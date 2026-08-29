import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const env = {
  CREEM_API_KEY: 'creem_synthetic',
  CREEM_WEBHOOK_SECRET: 'synthetic-webhook-secret',
  CREEM_STARTER_PRODUCT_ID: 'prod_STARTER',
  CREEM_PRO_PRODUCT_ID: 'prod_PRO',
  CREEM_MASTER_PRODUCT_ID: 'prod_MASTER',
  NEXT_PUBLIC_SITE_URL: 'https://pixpawai.example',
  NODE_ENV: 'production',
  CREEM_ENVIRONMENT: 'production',
};

function request(body) {
  return new Request('https://pixpawai.example/api/payments/creem/create-checkout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

function checkoutEvent(overrides = {}) {
  const event = {
    id: 'evt_SYNTHETIC', eventType: 'checkout.completed', object: {
      id: 'ch_SYNTHETIC', status: 'completed', request_id: '00000000-0000-4000-8000-000000000001',
      order: { id: 'ord_SYNTHETIC', transaction: 'tran_SYNTHETIC', product: 'prod_STARTER', amount: 499, currency: 'USD', status: 'paid' },
      product: { id: 'prod_STARTER' },
    },
  };
  return { ...event, ...overrides, object: { ...event.object, ...(overrides.object ?? {}) } };
}

function harness(settings = {}) {
  const calls = { insert: [], update: [], rpc: [], fetch: [] };
  const payment = {
    id: '00000000-0000-4000-8000-000000000001', user_id: 'TEST-USER', tier: 'starter',
    amount_usd: 4.99, credits_purchased: 15, status: 'pending', provider: 'creem',
  };
  const client = {
    auth: { getUser: async () => ({ data: { user: settings.unauthorized ? null : { id: 'TEST-USER', email: 'buyer@example.test' } }, error: null }) },
    rpc: async (name, args) => {
      calls.rpc.push({ name, args });
      return settings.rpcResult ?? { data: { success: true, already_completed: false }, error: null };
    },
    from(table) {
      const filters = [];
      const query = {
        select() { return query; },
        eq(key, value) { filters.push([key, value]); return query; },
        async maybeSingle() {
          const row = table === 'payments' && settings.payment !== null ? { ...payment, ...(settings.payment ?? {}) } : null;
          return { data: row && filters.every(([key, value]) => row[key] === value) ? row : null, error: settings.lookupError ? { code: 'XX000' } : null };
        },
        insert(row) { calls.insert.push({ table, row }); return Promise.resolve(settings.insertResult ?? { error: null }); },
        update(row) { calls.update.push({ table, row, filters }); return query; },
        then(resolve) { return Promise.resolve({ error: settings.updateError ? { code: 'XX000' } : null }).then(resolve); },
      };
      return query;
    },
  };
  const fetcher = async (url, init) => {
    calls.fetch.push({ url, init });
    if (settings.fetcher) return settings.fetcher(url, init);
    return Response.json({ id: 'ch_SYNTHETIC', checkout_url: 'https://checkout.creem.io/synthetic' });
  };
  const cache = new Map();
  const quiet = { log() {}, error() {}, warn() {} };
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative);
    const source = readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
    } }).outputText;
    const module = { exports: {} };
    const imports = name => {
      if (name.startsWith('node:')) return require(name);
      if (name === 'next/server') return require('next/server');
      if (name === '@/lib/supabase/server') return { createClient: async () => client, createAdminClient: () => client };
      if (name === '@/lib/rate-limit') return { checkRateLimitSmart: async () => ({ success: true }) };
      if (name === '@/lib/i18n-config') return { i18n: { defaultLocale: 'en', locales: ['en'] } };
      if (name === '@/lib/payments/catalog') return load('lib/payments/catalog.ts');
      if (name === '@/lib/creem/config') return load('lib/creem/config.ts');
      if (name === '@/lib/creem/credit-payments') return load('lib/creem/credit-payments.ts');
      throw new Error(`Unexpected dependency: ${name}`);
    };
    vm.runInThisContext(`(function(require, module, exports, fetch, console, process) { ${output}\n})`, {
      filename: relative,
    })(imports, module, module.exports, fetcher, quiet, { env });
    cache.set(relative, module.exports);
    return module.exports;
  }
  return { calls, load };
}

test('checkout persists the server-owned tier before returning the hosted URL', async () => {
  const h = harness();
  const response = await h.load('app/api/payments/creem/create-checkout/route.ts').POST(
    request({ tier: 'starter', amount: 0.01, credits: 999, locale: 'en' }),
  );
  assert.equal(response.status, 200);
  assert.equal(h.calls.insert[0].row.provider, 'creem');
  assert.equal(h.calls.insert[0].row.amount_usd, 4.99);
  assert.equal(h.calls.insert[0].row.credits_purchased, 15);
  const providerBody = JSON.parse(h.calls.fetch[0].init.body);
  assert.equal(providerBody.product_id, 'prod_STARTER');
  assert.equal(providerBody.request_id, h.calls.insert[0].row.id);
  assert.equal(providerBody.metadata.payment_id, h.calls.insert[0].row.id);
  assert.equal((await response.json()).checkoutUrl, 'https://checkout.creem.io/synthetic');
});

test('invalid tiers and missing authentication never call Creem', async () => {
  for (const [settings, body] of [[{}, { tier: '__proto__', locale: 'en' }], [{ unauthorized: true }, { tier: 'starter', locale: 'en' }]]) {
    const h = harness(settings);
    const response = await h.load('app/api/payments/creem/create-checkout/route.ts').POST(request(body));
    assert.notEqual(response.status, 200);
    assert.equal(h.calls.fetch.length, 0);
  }
});

test('provider failures are not exposed as successful checkouts', async () => {
  const h = harness({ fetcher: async () => Response.json({ error: 'synthetic' }, { status: 500 }) });
  const response = await h.load('app/api/payments/creem/create-checkout/route.ts').POST(request({ tier: 'starter', locale: 'en' }));
  assert.equal(response.status, 502);
  assert.equal((await response.json()).checkoutUrl, undefined);
  assert.ok(h.calls.update.some(call => call.row.status === 'failed'));
});

test('signed checkout completion invokes only the atomic fulfillment RPC', async () => {
  const h = harness();
  const body = JSON.stringify(checkoutEvent());
  const signature = createHmac('sha256', env.CREEM_WEBHOOK_SECRET).update(body).digest('hex');
  const response = await h.load('app/api/payments/creem/webhook/route.ts').POST(new Request('https://pixpawai.example/api/payments/creem/webhook', {
    method: 'POST', headers: { 'creem-signature': signature }, body,
  }));
  assert.equal(response.status, 200);
  assert.equal(h.calls.rpc.length, 1);
  assert.equal(h.calls.rpc[0].name, 'fulfill_creem_credit_payment');
  assert.equal(h.calls.rpc[0].args.p_amount_cents, 499);
  assert.equal(h.calls.rpc[0].args.p_transaction_id, 'tran_SYNTHETIC');
  assert.equal(h.calls.update.length, 0);
});

test('tampered signatures, amounts, products, and statuses cannot grant credits', async () => {
  const samples = [
    [checkoutEvent(), '0'.repeat(64)],
    [checkoutEvent({ object: { order: { ...checkoutEvent().object.order, amount: 1 } } }), null],
    [checkoutEvent({ object: { order: { ...checkoutEvent().object.order, product: 'prod_PRO' }, product: { id: 'prod_PRO' } } }), null],
    [checkoutEvent({ object: { order: { ...checkoutEvent().object.order, status: 'pending' } } }), null],
  ];
  for (const [event, forcedSignature] of samples) {
    const h = harness();
    const body = JSON.stringify(event);
    const signature = forcedSignature ?? createHmac('sha256', env.CREEM_WEBHOOK_SECRET).update(body).digest('hex');
    const response = await h.load('app/api/payments/creem/webhook/route.ts').POST(new Request('https://pixpawai.example/api/payments/creem/webhook', {
      method: 'POST', headers: { 'creem-signature': signature }, body,
    }));
    assert.notEqual(response.status, 200);
    assert.equal(h.calls.rpc.length, 0);
  }
});

test('fulfillment failures stay retryable so Creem can redeliver', async () => {
  const h = harness({ rpcResult: { data: null, error: { code: 'XX000' } } });
  const body = JSON.stringify(checkoutEvent());
  const signature = createHmac('sha256', env.CREEM_WEBHOOK_SECRET).update(body).digest('hex');
  const response = await h.load('app/api/payments/creem/webhook/route.ts').POST(new Request('https://pixpawai.example/api/payments/creem/webhook', {
    method: 'POST', headers: { 'creem-signature': signature }, body,
  }));
  assert.equal(response.status, 503);
  assert.equal(h.calls.rpc.length, 1);
});

test('refunds update a known Creem order and unknown refunds stay retryable', async () => {
  const event = {
    id: 'evt_REFUND', eventType: 'refund.created', object: {
      reason: 'requested_by_customer', order: { id: 'ord_REFUND' },
    },
  };
  for (const known of [true, false]) {
    const h = harness({ payment: known ? { provider_order_id: 'ord_REFUND' } : null });
    const body = JSON.stringify(event);
    const signature = createHmac('sha256', env.CREEM_WEBHOOK_SECRET).update(body).digest('hex');
    const response = await h.load('app/api/payments/creem/webhook/route.ts').POST(new Request('https://pixpawai.example/api/payments/creem/webhook', {
      method: 'POST', headers: { 'creem-signature': signature }, body,
    }));
    assert.equal(response.status, known ? 200 : 503);
    assert.equal(h.calls.update.some(call => call.row.status === 'refunded'), known);
  }
});
