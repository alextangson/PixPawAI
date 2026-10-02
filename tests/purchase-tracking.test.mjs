import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../components/analytics.tsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React } }).outputText;
function load(window) {
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports,window){${code}\n})`)(() => ({}),module,module.exports,window);
  return module.exports;
}
const purchase = { transactionId: 'SYNTHETIC', value: 4.99, items: [] };
test('purchase dispatch reports false without existing analytics and true after dispatch', () => {
  assert.equal(load(undefined).trackPurchase(purchase), false);
  assert.equal(load({}).trackPurchase(purchase), false);
  assert.equal(load({ gtag: true }).trackPurchase(purchase), false);
  const calls = [];
  assert.equal(load({ gtag: (...args) => calls.push(args) }).trackPurchase(purchase), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][1], 'purchase');
  assert.equal(calls[0][2].transaction_id, 'SYNTHETIC');
});

// Drive the real status effect through polling and delayed analytics readiness.
const { harness, settle } = await import('./helpers/ui-harness.mjs');
async function statusHarness() {
  const stored = new Map(), timers = new Map(), calls = [];
  let now = 0;
  const window = {
    setInterval: fn => { timers.set(1, fn); return 1; },
    clearInterval: id => timers.delete(id),
  };
  const h = harness({ '@/components/analytics': { trackPurchase: load(window).trackPurchase } }, {
    window, sessionStorage: { getItem: key => stored.get(key), setItem: (key,value) => stored.set(key,value) },
    Date: { now: () => now },
    fetch: async () => Response.json({payment:{id:'SYNTHETIC',provider_order_id:'ORDER-A',status:'completed',amount_usd:4.99,tier:'starter',credits_purchased:15}}),
  });
  const {CreemPaymentStatus}=h.load('components/payment/creem-payment-status.tsx');
  const props={locale:'en',requestId:'SYNTHETIC',signatureValid:true};
  const render=()=>{h.render(CreemPaymentStatus,props);h.flush();};
  render();await settle();render();
  return {h,stored,timers,calls,render,
    ready:()=>{window.gtag=(...args)=>calls.push(args);},
    tick:value=>{now=value;[...timers.values()].forEach(fn=>fn());},
  };
}
test('status effect retries delayed analytics and writes marker only after one dispatch',async()=>{
  const s=await statusHarness();assert.equal(s.stored.size,0);assert.equal(s.timers.size,1);
  s.tick(100);assert.equal(s.stored.size,0);
  s.ready();s.tick(200);assert.equal(s.calls.length,1);assert.equal(s.stored.size,1);assert.equal(s.timers.size,0);
  s.render();s.tick(300);assert.equal(s.calls.length,1);s.h.unmount();
});
test('status tracking timeout does not mark dispatch or enable analytics',async()=>{
  const s=await statusHarness();s.tick(4000);
  assert.equal(s.stored.size,0);assert.equal(s.calls.length,0);assert.equal(s.timers.size,0);s.h.unmount();
});
test('unmount cancels delayed tracking without writing a marker',async()=>{
  const s=await statusHarness();s.h.unmount();s.ready();s.tick(100);
  assert.equal(s.stored.size,0);assert.equal(s.calls.length,0);assert.equal(s.timers.size,0);
});
