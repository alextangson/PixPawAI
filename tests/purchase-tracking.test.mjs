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
