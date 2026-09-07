import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

// A disposable local PostgreSQL cluster only. Never reads .env or uses a remote DB.
const exec = promisify(execFile);
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('PG')));
const options = { env, maxBuffer: 1024 * 1024 };
let directory;
let started = false;
const userId = randomUUID();
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
async function sql(query) {
  const { stdout } = await exec('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1',
    '-h', directory, '-p', '55439', '-U', 'postgres', '-d', 'postgres', '-c', query], options);
  return stdout.trim();
}
async function migration(name) {
  return sql(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8'));
}
const fix = '20260828_atomic_paypal_credit_fulfillment.sql';
const creemFix = '20260829_creem_credit_checkout.sql';
async function payment(order = 'ORDER-A', extra = '') {
  await sql(`INSERT INTO public.payments(id, user_id, provider_order_id, tier, amount_usd, credits_purchased)
    VALUES (${quote(randomUUID())}, ${quote(userId)}, ${quote(order)}, 'starter', 4.99, 15); ${extra}`);
}
function fulfill(order = 'ORDER-A', capture = 'CAPTURE-A', amount = '4.99', currency = 'USD') {
  return sql(`SET ROLE service_role; SELECT public.fulfill_paypal_credit_payment(
    ${quote(order)}, ${quote(capture)}, ${amount}, ${quote(currency)});`)
    .then(value => JSON.parse(value));
}
async function creemPayment(id = randomUUID()) {
  await sql(`INSERT INTO public.payments(id, user_id, provider, provider_order_id, tier, amount_usd, credits_purchased, metadata)
    VALUES (${quote(id)}, ${quote(userId)}, 'creem', ${quote(`ch_${id}`)}, 'starter', 4.99, 15,
      ${quote(JSON.stringify({ creem_checkout_id: `ch_${id}`, creem_product_id: 'prod_STARTER' }))}::jsonb);`);
  return id;
}
function fulfillCreem(id, transaction = 'tran_A', amountCents = 499, currency = 'USD') {
  return sql(`SET ROLE service_role; SELECT public.fulfill_creem_credit_payment(
    ${quote(id)}, ${quote(`ch_${id}`)}, 'ord_A', ${quote(transaction)}, 'prod_STARTER',
    ${amountCents}, ${quote(currency)}, 'evt_A');`).then(value => JSON.parse(value));
}
async function state() {
  return JSON.parse(await sql(`SELECT json_build_object(
    'credits', (SELECT credits FROM profiles WHERE id = ${quote(userId)}),
    'tier', (SELECT tier FROM profiles WHERE id = ${quote(userId)}),
    'completed', (SELECT count(*) FROM payments WHERE status = 'completed'),
    'granted', (SELECT count(*) FROM payments WHERE credits_granted_at IS NOT NULL));`));
}

before(async () => {
  directory = await mkdtemp('/tmp/pixpaw-payment-test-');
  await exec('initdb', ['-D', path.join(directory, 'data'), '-A', 'trust', '-U', 'postgres', '--no-locale', '-E', 'UTF8'], options);
  await exec('pg_ctl', ['-D', path.join(directory, 'data'), '-l', path.join(directory, 'postgres.log'),
    '-o', `-k ${directory} -p 55439 -c listen_addresses=''`, '-w', 'start'], options);
  started = true;
  await sql(`CREATE EXTENSION "uuid-ossp";
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id UUID PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql AS 'SELECT NULL::uuid';
    CREATE TABLE public.profiles(id UUID PRIMARY KEY REFERENCES auth.users(id),
      credits INTEGER NOT NULL DEFAULT 2,
      tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro')),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
  await migration('20260120_add_payments_table.sql');
  await migration('20260130_fix_payment_race_condition.sql');
  await sql('GRANT ALL ON public.payments TO anon, authenticated, service_role;');
  await migration(fix);
  await migration(creemFix);
});
after(async () => {
  if (started) await exec('pg_ctl', ['-D', path.join(directory, 'data'), '-m', 'immediate', '-w', 'stop'], options);
  if (directory) await rm(directory, { recursive: true, force: true });
});
beforeEach(async () => {
  await sql(`TRUNCATE public.payments, public.profiles, auth.users;
    INSERT INTO auth.users VALUES (${quote(userId)});
    INSERT INTO public.profiles(id) VALUES (${quote(userId)});`);
});

test('reproduces the old completed-before-grant bug against its actual SQL', async () => {
  await payment();
  const result = JSON.parse(await sql(`UPDATE payments SET status = 'completed';
    SELECT increment_credits_safe(${quote(userId)}, 15, (SELECT id FROM payments));`));
  assert.equal(result.error, 'payment_already_processed');
  assert.equal((await state()).credits, 2);
});

test('grants credits, tier, completion, and receipt together', async () => {
  await payment();
  assert.equal((await fulfill()).added, 15);
  assert.deepEqual(await state(), { credits: 17, tier: 'starter', completed: 1, granted: 1 });
});

test('simultaneous capture and webhook deliveries grant exactly once', async () => {
  await payment();
  const results = await Promise.all(Array.from({ length: 12 }, () => fulfill()));
  assert.equal(results.filter(result => !result.already_completed).length, 1);
  assert.equal(results.reduce((sum, result) => sum + result.added, 0), 15);
  assert.equal((await state()).credits, 17);
});

test('concurrent different purchases do not lose balance increments', async () => {
  await payment('ORDER-A');
  await payment('ORDER-B');
  await Promise.all([fulfill(), fulfill('ORDER-B', 'CAPTURE-B')]);
  assert.equal((await state()).credits, 32);
});

test('a database error after the profile update rolls back everything; retry succeeds', async () => {
  await payment();
  await sql(`CREATE FUNCTION test_fail_payment() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN RAISE EXCEPTION 'injected_write_failure'; END; $$;
    CREATE TRIGGER test_failure BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION test_fail_payment();`);
  try {
    await assert.rejects(fulfill(), /injected_write_failure/);
    assert.deepEqual(await state(), { credits: 2, tier: 'free', completed: 0, granted: 0 });
  } finally {
    await sql('DROP TRIGGER test_failure ON payments; DROP FUNCTION test_fail_payment();');
  }
  await fulfill();
  assert.equal((await state()).credits, 17);
});

test('a unique capture conflict rolls back the second credit grant', async () => {
  await payment();
  await payment('ORDER-B');
  await fulfill();
  await assert.rejects(fulfill('ORDER-B'), /duplicate key/);
  assert.equal((await state()).credits, 17);
  assert.equal((await state()).granted, 1);
});

test('missing profiles fail without marking orders completed', async () => {
  await payment();
  await sql('DELETE FROM profiles;');
  await assert.rejects(fulfill(), /profile_not_found/);
  assert.equal((await state()).completed, 0);
});

test('completed manual repair receipt prevents duplicate credits and is preserved', async () => {
  await payment();
  const receipt = { status: 'completed', credits_added: 15, operation_id: 'SYNTHETIC-REPAIR' };
  await sql(`UPDATE profiles SET credits = 17;
    UPDATE payments SET status = 'completed', provider_payment_id = 'CAPTURE-A',
      metadata = ${quote(JSON.stringify({ manual_credit_reconciliation: receipt }))}::jsonb;`);
  assert.equal((await fulfill()).already_completed, true);
  assert.equal((await state()).credits, 17);
  assert.deepEqual(JSON.parse(await sql("SELECT metadata->'manual_credit_reconciliation' FROM payments")), receipt);
});

test('an ambiguous manual repair blocks all automatic grants', async () => {
  await payment();
  await sql(`UPDATE payments SET metadata = '{"manual_credit_reconciliation":{"status":"pending"}}';`);
  await assert.rejects(fulfill(), /manual_reconciliation_requires_review/);
  assert.equal((await state()).credits, 2);
});

test('legacy completed payments are not assumed missing or silently reported fulfilled', async () => {
  await payment();
  await sql("UPDATE payments SET status = 'completed';");
  await assert.rejects(fulfill(), /legacy_payment_requires_review/);
  assert.equal((await state()).credits, 2);
});

test('refunded and cancelled payments cannot be recredited', async () => {
  await payment();
  await fulfill();
  for (const status of ['refunded', 'cancelled']) {
    await sql(`UPDATE payments SET status = ${quote(status)};`);
    await assert.rejects(fulfill(), /payment_not_fulfillable/);
  }
  assert.equal((await state()).credits, 17);
});

test('rejects wrong currency, amount, missing amount, non-finite amount, and missing capture', async () => {
  await payment();
  for (const [capture, amount, currency] of [
    ['CAPTURE-A', '4.99', 'EUR'], ['CAPTURE-A', '4.98', 'USD'],
    ['CAPTURE-A', 'NULL', 'USD'], ['CAPTURE-A', "'NaN'::numeric", 'USD'], ['', '4.99', 'USD'],
  ]) await assert.rejects(fulfill('ORDER-A', capture, amount, currency), /invalid_capture/);
  assert.equal((await state()).credits, 2);
});

test('rejects different capture IDs even after successful fulfillment', async () => {
  await payment();
  await fulfill();
  await assert.rejects(fulfill('ORDER-A', 'DIFFERENT-CAPTURE'), /capture_mismatch/);
  assert.equal((await state()).credits, 17);
});

test('master purchases are compatible with the original profile constraint', async () => {
  await payment();
  await sql("UPDATE payments SET tier = 'master', amount_usd = 39.99, credits_purchased = 200;");
  await fulfill('ORDER-A', 'CAPTURE-A', '39.99');
  assert.equal((await state()).credits, 202);
  assert.equal((await state()).tier, 'master');
});

test('Creem checkout completion atomically grants credits exactly once', async () => {
  const id = await creemPayment();
  const results = await Promise.all(Array.from({ length: 8 }, () => fulfillCreem(id)));
  assert.equal(results.filter(result => !result.already_completed).length, 1);
  assert.equal(results.reduce((sum, result) => sum + result.added, 0), 15);
  assert.deepEqual(await state(), { credits: 17, tier: 'starter', completed: 1, granted: 1 });
  assert.equal(await sql(`SELECT provider_order_id FROM payments WHERE id = ${quote(id)}`), 'ord_A');
});

test('Creem fulfillment rejects mismatched amount, currency, product, checkout, and transaction replays', async () => {
  const id = await creemPayment();
  await assert.rejects(fulfillCreem(id, 'tran_A', 1), /invalid_creem_payment/);
  await assert.rejects(fulfillCreem(id, 'tran_A', 499, 'EUR'), /invalid_creem_payment/);
  await assert.rejects(sql(`SET ROLE service_role; SELECT fulfill_creem_credit_payment(
    ${quote(id)}, 'wrong_checkout', 'ord_A', 'tran_A', 'prod_STARTER', 499, 'USD', 'evt_A');`), /invalid_creem_payment/);
  await assert.rejects(sql(`SET ROLE service_role; SELECT fulfill_creem_credit_payment(
    ${quote(id)}, ${quote(`ch_${id}`)}, 'ord_A', 'tran_A', 'prod_WRONG', 499, 'USD', 'evt_A');`), /invalid_creem_payment/);
  await fulfillCreem(id);
  await assert.rejects(fulfillCreem(id, 'tran_OTHER'), /transaction_mismatch/);
  assert.equal((await state()).credits, 17);
});

test('only service_role can fulfill or insert trusted payments', async () => {
  await payment();
  for (const role of ['anon', 'authenticated']) {
    await assert.rejects(sql(`SET ROLE ${role}; SELECT fulfill_paypal_credit_payment('ORDER-A','CAPTURE-A',4.99,'USD');`), /permission denied/);
    await assert.rejects(sql(`SET ROLE ${role}; INSERT INTO payments(user_id,provider_order_id,tier,amount_usd,credits_purchased)
      VALUES (${quote(userId)},'FORGED','starter',4.99,99999);`), /permission denied/);
  }
  await fulfill();
  assert.equal((await state()).credits, 17);
});

test('reapplying the migration does not backfill or grant legacy payments', async () => {
  await payment();
  await sql("UPDATE payments SET status = 'completed';");
  await migration(fix);
  assert.equal((await state()).credits, 2);
  assert.equal((await state()).granted, 0);
});
