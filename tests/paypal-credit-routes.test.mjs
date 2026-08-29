import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const payment = {
  id: '00000000-0000-4000-8000-000000000001', user_id: 'TEST-USER', provider: 'paypal',
  provider_order_id: 'ORDER-A', tier: 'starter', amount_usd: 4.99, credits_purchased: 15, status: 'pending',
};
const capture = { id: 'CAPTURE-A', status: 'COMPLETED', amount: { value: '4.99', currency_code: 'USD' } };
function order(overrides = {}) {
  return { id: 'ORDER-A', status: 'COMPLETED', purchase_units: [
    { custom_id: 'TEST-USER', payments: { captures: [structuredClone(capture)] } },
  ], ...overrides };
}
function request(body, headers = {}) {
  return new Request('http://localhost/api/test', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
  });
}
function webhook(resource = capture, eventType = 'PAYMENT.CAPTURE.COMPLETED') {
  return request({ id: 'TEST-EVENT', event_type: eventType, resource: {
    ...resource, supplementary_data: { related_ids: { order_id: 'ORDER-A' } },
  } }, Object.fromEntries(['transmission-id', 'transmission-time', 'transmission-sig', 'cert-url', 'auth-algo']
    .map(key => [`paypal-${key}`, 'SYNTHETIC-HEADER'])));
}

function harness(settings = {}) {
  const calls = { rpc: [], fetch: [], insert: [], update: [] };
  const client = {
    auth: { getUser: async () => ({ data: { user: settings.unauthorized ? null : { id: 'TEST-USER' } }, error: null }) },
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
          if (settings.lookupError) return { data: null, error: { code: 'TEST_DB_FAILURE' } };
          const row = table === 'payments' ? (settings.payment === null ? null : { ...payment, ...settings.payment })
            : settings.otherOrder === table ? { id: 'OTHER-ORDER', paypal_order_id: 'ORDER-A' } : null;
          return { data: row && filters.every(([key, value]) => row[key] === value) ? row : null, error: null };
        },
        insert(row) {
          calls.insert.push({ table, row });
          return settings.insertResult ?? Promise.resolve({ error: null });
        },
        update(row) { calls.update.push({ table, row, filters }); return query; },
        then(resolve) { return Promise.resolve({ error: null }).then(resolve); },
      };
      return query;
    },
  };
  const fetcher = async (url, init) => {
    calls.fetch.push({ url, init });
    if (settings.fetcher) return settings.fetcher(url, init);
    return Response.json(order());
  };
  const cache = new Map();
  const quiet = { log() {}, error() {}, warn() {} };
  // Execute the actual route/helper bodies, replacing only external I/O modules.
  // No .env loading, PayPal HTTP, Supabase HTTP, cookies, or Redis calls in these tests.
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative);
    const source = readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
    } }).outputText;
    const module = { exports: {} };
    const imports = name => {
      if (name === 'next/server') return require('next/server');
      if (name === '@/lib/supabase/server') return { createClient: async () => client, createAdminClient: () => client };
      if (name === '@/lib/rate-limit') return { checkRateLimitSmart: async () => ({ success: true }) };
      if (name === '@/lib/payments/catalog') return load('lib/payments/catalog.ts');
      if (name === '@/lib/paypal/config') return {
        ...load('lib/paypal/config.ts'),
        getPayPalAccessToken: async () => 'SYNTHETIC-TOKEN',
        verifyPayPalWebhookSignature: async () => settings.signature !== false,
      };
      if (name === '@/lib/paypal/credit-payments') return load('lib/paypal/credit-payments.ts');
      throw new Error(`Unexpected dependency: ${name}`);
    };
    vm.runInThisContext(`(function(require, module, exports, fetch, console, process) { ${output}\n})`, {
      filename: relative,
    })(imports, module, module.exports, fetcher, quiet, { env: {} });
    cache.set(relative, module.exports);
    return module.exports;
  }
  return { calls, load, post: route => load(`app/api/payments/paypal/${route}/route.ts`).POST };
}

test('capture fulfills using one RPC, never separate payment/profile writes', async () => {
  const h = harness();
  const response = await h.post('capture-order')(request({ orderId: 'ORDER-A' }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  assert.equal(h.calls.rpc.length, 1);
  assert.deepEqual(h.calls.rpc[0], { name: 'fulfill_paypal_credit_payment', args: {
    p_order_id: 'ORDER-A', p_capture_id: 'CAPTURE-A', p_amount: '4.99', p_currency: 'USD', p_event_id: null,
  } });
  assert.equal(h.calls.fetch[0].init.headers['PayPal-Request-Id'], payment.id);
  assert.equal(h.calls.update.length, 0);
});

test('capture errors never report success or mark payments completed', async () => {
  for (const rpcResult of [
    { data: null, error: { code: 'XX000' } }, { data: { success: false }, error: null },
    { data: null, error: null }, { data: { success: true }, error: null },
  ]) {
    const h = harness({ rpcResult });
    const response = await h.post('capture-order')(request({ orderId: 'ORDER-A' }));
    assert.equal(response.status, 503);
    assert.notEqual((await response.json()).success, true);
    assert.equal(h.calls.update.length, 0);
  }
});

test('completed status alone does not short-circuit fulfillment verification', async () => {
  const h = harness({ payment: { status: 'completed' }, rpcResult: { data: null, error: { code: '55000' } } });
  const response = await h.post('capture-order')(request({ orderId: 'ORDER-A' }));
  assert.equal(response.status, 409);
  assert.equal(h.calls.rpc.length, 1);
});

test('confirmed replay returns the same purchase payload for the frontend', async () => {
  const h = harness({ rpcResult: { data: { success: true, already_completed: true }, error: null } });
  const response = await h.post('capture-order')(request({ orderId: 'ORDER-A' }));
  const result = await response.json();
  assert.equal(result.alreadyCompleted, true);
  assert.equal(result.payment.orderId, 'ORDER-A');
  assert.equal(result.payment.credits, 15);
});

test('already-captured and timed-out captures recover through GET without new purchase', async () => {
  for (const timeout of [false, true]) {
    const h = harness({ fetcher: async (_url, init) => {
      if (init.method === 'POST') {
        if (timeout) throw new Error('synthetic_timeout');
        return Response.json({ details: [{ issue: 'ORDER_ALREADY_CAPTURED' }] }, { status: 422 });
      }
      return Response.json(order());
    } });
    const response = await h.post('capture-order')(request({ orderId: 'ORDER-A' }));
    assert.equal(response.status, 200);
    assert.equal(h.calls.fetch.length, 2);
    assert.equal(h.calls.rpc.length, 1);
  }
});

test('an uncertain provider result stays retryable and does not claim no charges', async () => {
  const h = harness({ fetcher: async () => { throw new Error('synthetic_timeout'); } });
  const response = await h.post('capture-order')(request({ orderId: 'ORDER-A' }));
  assert.equal(response.status, 503);
  assert.doesNotMatch(JSON.stringify(await response.json()), /No charges were made/);
  assert.equal(h.calls.rpc.length, 0);
  assert.equal(h.calls.update.length, 0);
});

test('unconfirmed, wrong-owner, wrong-order and multiple captures cannot grant credits', async () => {
  const samples = [
    order({ status: 'APPROVED' }), order({ id: 'OTHER-ORDER' }),
    order({ purchase_units: [{ custom_id: 'OTHER-USER', payments: { captures: [capture] } }] }),
    order({ purchase_units: [{ payments: { captures: [capture, capture] } }] }),
    order({ purchase_units: [{ payments: { captures: [{ ...capture, status: 'PENDING' }] } }] }),
  ];
  for (const sample of samples) {
    const h = harness({ fetcher: async () => Response.json(sample) });
    assert.notEqual((await h.post('capture-order')(request({ orderId: 'ORDER-A' }))).status, 200);
    assert.equal(h.calls.rpc.length, 0);
  }
});

test('ownership, authentication and refunded orders are checked before capture', async () => {
  for (const settings of [{ unauthorized: true }, { payment: { user_id: 'OTHER-USER' } }, { payment: { status: 'refunded' } }]) {
    const h = harness(settings);
    assert.notEqual((await h.post('capture-order')(request({ orderId: 'ORDER-A' }))).status, 200);
    assert.equal(h.calls.fetch.length, 0);
    assert.equal(h.calls.rpc.length, 0);
  }
});

test('webhook grant failure returns non-2xx so PayPal can retry', async () => {
  const h = harness({ rpcResult: { data: null, error: { code: 'XX000' } } });
  const response = await h.post('webhook')(webhook());
  assert.equal(response.status, 503);
  assert.notEqual((await response.json()).received, true);
  assert.equal(h.calls.rpc[0].name, 'fulfill_paypal_credit_payment');
  assert.equal(h.calls.rpc[0].args.p_event_id, 'TEST-EVENT');
  assert.equal(h.calls.update.length, 0);
});

test('valid and duplicate webhook deliveries acknowledge the atomic grant', async () => {
  for (const already_completed of [false, true]) {
    const h = harness({ rpcResult: { data: { success: true, already_completed }, error: null } });
    assert.equal((await h.post('webhook')(webhook())).status, 200);
    assert.equal(h.calls.rpc.length, 1);
  }
});

test('rejects invalid signatures even outside production', async () => {
  const h = harness({ signature: false });
  assert.equal((await h.post('webhook')(webhook())).status, 403);
  assert.equal(h.calls.rpc.length, 0);
});

test('amount and currency validation fails closed in the webhook', async () => {
  for (const amount of [undefined, { value: 'NaN', currency_code: 'USD' },
    { value: '4.99', currency_code: 'EUR' }, { value: '4.98', currency_code: 'USD' },
    { value: '4.991', currency_code: 'USD' }]) {
    const h = harness();
    assert.equal((await h.post('webhook')(webhook({ ...capture, amount }))).status, 400);
    assert.equal(h.calls.rpc.length, 0);
  }
});

test('unknown or unavailable orders are retryable; known non-credit orders are ignored', async () => {
  for (const settings of [{ payment: null }, { lookupError: true }]) {
    const h = harness(settings);
    assert.equal((await h.post('webhook')(webhook())).status, 503);
  }
  for (const otherOrder of ['hd_unlocks', 'printful_orders']) {
    const h = harness({ payment: null, otherOrder });
    assert.equal((await h.post('webhook')(webhook())).status, 200);
    assert.equal(h.calls.rpc.length, 0);
  }
});

test('late approval never overwrites manual repair metadata', async () => {
  const h = harness();
  assert.equal((await h.post('webhook')(webhook({ id: 'ORDER-A' }, 'CHECKOUT.ORDER.APPROVED'))).status, 200);
  assert.equal(h.calls.update.length, 0);
  assert.equal(h.calls.rpc.length, 0);
});

test('late denial only targets pending orders', async () => {
  const h = harness();
  await h.post('webhook')(webhook(capture, 'PAYMENT.CAPTURE.DENIED'));
  assert.ok(h.calls.update[0].filters.some(([key, value]) => key === 'status' && value === 'pending'));
});

test('create-order waits for persistence and withholds order ID on DB failure', async () => {
  let release;
  let inserted;
  const insertReached = new Promise(resolve => { inserted = resolve; });
  const insertResult = { then(resolve) { inserted(); return new Promise(done => { release = () => done(resolve({ error: { code: 'XX000' } })); }); } };
  const h = harness({ insertResult, fetcher: async () => Response.json({ id: 'ORDER-A', status: 'CREATED' }) });
  let returned = false;
  const result = h.post('create-order')(request({ tier: 'starter' })).then(response => { returned = true; return response; });
  await insertReached;
  assert.equal(returned, false);
  release();
  const response = await result;
  assert.equal(response.status, 503);
  assert.equal((await response.json()).orderId, undefined);
});

test('create-order stores server-priced credits before returning the order', async () => {
  const h = harness({ fetcher: async () => Response.json({ id: 'ORDER-A', status: 'CREATED' }) });
  const response = await h.post('create-order')(request({ tier: 'starter', credits: 999, amount: 0.01 }));
  assert.equal(response.status, 200);
  assert.equal(h.calls.insert[0].row.credits_purchased, 15);
  assert.equal(h.calls.insert[0].row.amount_usd, 4.99);
  assert.equal((await response.json()).orderId, 'ORDER-A');
});

test('prototype keys and non-string values are not valid pricing tiers', async () => {
  for (const tier of ['toString', '__proto__', 'constructor', {}, ['starter']]) {
    const h = harness();
    assert.equal((await h.post('create-order')(request({ tier }))).status, 400);
    assert.equal(h.calls.fetch.length, 0);
  }
});
