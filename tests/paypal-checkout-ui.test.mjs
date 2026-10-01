import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const React = require('react');

function harness() {
  let completed = false;
  const calls = [];
  const effects = [];
  const paypal = () => null;
  const hooks = { ...React, useState: () => [completed, v => { completed = v; }],
    useCallback: fn => fn, useEffect: fn => effects.push(fn) };
  const source = readFileSync(new URL('../components/payment/payment-modal.tsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true,
  } }).outputText;
  const module = { exports: {} };
  const imports = name => {
    if (name === 'react') return hooks;
    if (name === 'next/navigation') return { useRouter: () => ({ refresh: () => calls.push('refresh') }) };
    if (name === './paypal-buttons-advanced') return { PayPalButtonsAdvanced: paypal };
    if (name === '@/components/analytics') return { trackEvent: () => {} };
    if (name === '@/components/ui/dialog') return { Dialog: 'dialog', DialogContent: 'section', DialogTitle: 'h1' };
    if (name === 'lucide-react') return new Proxy({}, { get: () => 'svg' });
    throw new Error(name);
  };
  vm.runInThisContext(`(function(require,module,exports,window,Event){${code}\n})`)(imports,module,module.exports,
    { dispatchEvent: e => calls.push(e.type) }, Event);
  const render = (isOpen = true) => module.exports.PaymentModal({ isOpen, onClose() {}, tier: 'starter', price: '$4.99', credits: 15 });
  const elements = tree => !tree || typeof tree !== 'object' ? [] : [tree, ...React.Children.toArray(tree.props?.children).flatMap(elements)];
  return { render, elements, effects, calls, paypal };
}

test('credit checkout uses PayPal; confirmed success refreshes balance and replaces the buttons', () => {
  const h = harness();
  const checkout = h.elements(h.render()).find(e => e.type === h.paypal);
  assert.ok(checkout);
  assert.equal(checkout.props.tier, 'starter');
  assert.equal(checkout.props.credits, 15);
  assert.deepEqual(h.calls, []);
  checkout.props.onSuccess({ orderId: 'SYNTHETIC' });
  assert.deepEqual(h.calls, ['credits-updated', 'refresh']);
  const result = h.elements(h.render());
  assert.ok(result.some(e => e.props?.role === 'status'));
  assert.ok(!result.some(e => e.type === h.paypal));
});

test('reopening checkout clears stale success', () => {
  const h = harness();
  h.elements(h.render()).find(e => e.type === h.paypal).props.onSuccess({});
  h.render();
  h.effects.forEach(effect => effect());
  assert.ok(h.elements(h.render()).some(e => e.type === h.paypal));
});
