import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { generateKeyPairSync, sign } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { verifyWebhook } from '@waffo/pancake-ts'
import { isWaffoSku, usdCents, paidSubtotal } from '../lib/waffo/catalog'

test('tax-exclusive totals match the actual charge and stored subtotal', () => {
  assert.equal(paidSubtotal({ chargedAmount: '5.49', listPrice: { total: '5.49', subtotal: '4.99', taxAmount: '0.50' } }), 4.99)
  assert.equal(paidSubtotal({ amount: '4.99', taxAmount: '0' }), 4.99)
  assert.equal(paidSubtotal({ chargedAmount: '0.01', listPrice: { total: '5.49', subtotal: '4.99', taxAmount: '0.50' } }), null)
  assert.equal(paidSubtotal({ chargedAmount: '5.49', listPrice: { total: '5.49', subtotal: '4.99', taxAmount: '0.40' } }), null)
  assert.equal(paidSubtotal({ amount: '4.99' }), null)
})

test('catalog rejects inherited keys and malformed money', () => {
  assert.equal(isWaffoSku('constructor'), false)
  assert.equal(isWaffoSku('__proto__'), false)
  assert.equal(isWaffoSku('hd_unlock'), true)
  for (const value of [null, '', '-1', '1e3', '4.999', NaN, {}, 'Infinity']) {
    assert.equal(usdCents(value), null)
  }
  assert.equal(usdCents('4.99'), 499)
  assert.equal(usdCents(9.99), 999)
})

test('SDK rejects tampered bodies, bad signatures and stale deliveries', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const key = publicKey.export({ type: 'spki', format: 'pem' }).toString()
  const raw = JSON.stringify({ id: 'delivery', eventType: 'order.completed', mode: 'test', data: { amount: '4.99' } })
  const signature = (timestamp: number) => `t=${timestamp},v1=${sign('RSA-SHA256', Buffer.from(`${timestamp}.${raw}`), privateKey).toString('base64')}`
  const now = Date.now()
  const sig = signature(now)
  assert.equal(verifyWebhook(raw, sig, { publicKey: key }).id, 'delivery')
  assert.throws(() => verifyWebhook(raw.replace('4.99', '0.01'), sig, { publicKey: key }))
  assert.throws(() => verifyWebhook(raw, 'bad', { publicKey: key }))
  assert.throws(() => verifyWebhook(raw, signature(now - 3600000), { publicKey: key }))
})

test('SQL fulfillment is atomic, idempotent, scoped and inaccessible to browsers', async () => {
  const db = new PGlite()
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth;
      create table auth.users(id uuid primary key);
      create table public.profiles(id uuid primary key, credits integer, tier text);
      create table public.generations(id uuid primary key);
    `)
    await db.exec(readFileSync('supabase/migrations/20261020_waffo_payments.sql', 'utf8'))
    const buyer = '00000000-0000-4000-8000-000000000001'
    const order = '00000000-0000-4000-8000-000000000002'
    const hd = '00000000-0000-4000-8000-000000000003'
    const generation = '00000000-0000-4000-8000-000000000004'
    await db.query('insert into auth.users values ($1)', [buyer])
    await db.query('insert into profiles values ($1, 3, $2)', [buyer, 'free'])
    await db.query(`insert into waffo_orders(id,token_hash,user_id,sku,amount_usd,credits,product_id,store_id,mode)
      values ($1,'hash',$2,'starter',4.99,15,'PROD_test','STO_test','prod')`, [order, buyer])
    const fulfill = (id = order, event = 'delivery-1', provider = 'ORD_test', amount = 4.99, mode = 'prod') =>
      db.query('select fulfill_waffo_order($1,$2,$3,$4,$5,$6)', [id, event, provider, amount, 'STO_test', mode])
    await assert.rejects(fulfill(order, 'bad-amount', 'ORD_test', 0.01))
    await assert.rejects(fulfill(order, 'bad-mode', 'ORD_test', 4.99, 'test'))
    assert.equal((await db.query<{ credits: number }>('select credits from profiles')).rows[0].credits, 3)
    assert.equal((await db.query('select * from waffo_events')).rows.length, 0)
    await Promise.all([fulfill(), fulfill(), fulfill(order, 'delivery-retry')])
    assert.deepEqual((await db.query('select credits,tier from profiles')).rows, [{ credits: 18, tier: 'starter' }])
    assert.equal((await db.query('select * from waffo_events')).rows.length, 1)
    await assert.rejects(fulfill(order, 'new-delivery', 'ORD_other'))
    await db.query('insert into generations values ($1)', [generation])
    await db.query(`insert into waffo_orders(id,token_hash,generation_id,sku,amount_usd,credits,product_id,store_id,mode)
      values ($1,'hash',$2,'hd_unlock',9.99,0,'PROD_hd','STO_test','prod')`, [hd, generation])
    await fulfill(hd, 'hd-delivery', 'ORD_hd', 9.99)
    assert.equal((await db.query<{ status: string }>('select status from waffo_orders where id=$1', [hd])).rows[0].status, 'completed')
    assert.equal((await db.query<{ credits: number }>('select credits from profiles')).rows[0].credits, 18)
    // Missing profiles must roll back the event insert and leave the order retryable.
    await db.exec('delete from profiles')
    const missing = '00000000-0000-4000-8000-000000000005'
    await db.query(`insert into waffo_orders(id,token_hash,user_id,sku,amount_usd,credits,product_id,store_id,mode)
      values ($1,'hash',$2,'starter',4.99,15,'PROD_test','STO_test','prod')`, [missing, buyer])
    await assert.rejects(fulfill(missing, 'retryable', 'ORD_missing'))
    assert.equal((await db.query("select * from waffo_events where event_id='retryable'")).rows.length, 0)
    assert.equal((await db.query<{ status: string }>('select status from waffo_orders where id=$1', [missing])).rows[0].status, 'pending')
    await db.query('insert into profiles values ($1, 0, $2)', [buyer, 'free'])
    await fulfill(missing, 'retryable', 'ORD_missing')
    assert.equal((await db.query<{ credits: number }>('select credits from profiles')).rows[0].credits, 15)
    const sandbox = '00000000-0000-4000-8000-000000000006'
    await db.query(`insert into waffo_orders(id,token_hash,user_id,sku,amount_usd,credits,product_id,store_id,mode)
      values ($1,'hash',$2,'master',39.99,200,'PROD_sandbox','STO_test','test')`, [sandbox, buyer])
    await fulfill(sandbox, 'sandbox', 'ORD_sandbox', 39.99, 'test')
    assert.equal((await db.query<{ credits: number }>('select credits from profiles')).rows[0].credits, 15)
    assert.equal((await db.query<{ status: string }>('select status from waffo_orders where id=$1', [sandbox])).rows[0].status, 'completed')
    await db.exec('set role authenticated')
    await assert.rejects(fulfill())
    await assert.rejects(db.query("update waffo_orders set status='completed'"))
    await db.exec('reset role')
    const rls = await db.query<{ relrowsecurity: boolean }>("select relrowsecurity from pg_class where relname in ('waffo_orders','waffo_events')")
    assert.ok(rls.rows.every(row => row.relrowsecurity))
  } finally { await db.close() }
})
