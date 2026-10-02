import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, elements, text } from './helpers/ui-harness.mjs';

function checkout() {
  const calls = [];
  const paypal = () => null;
  const router = { refresh: () => calls.push('refresh') };
  const h = harness({
    'next/navigation': { useRouter: () => router },
    './paypal-buttons-advanced': { PayPalButtonsAdvanced: paypal },
    '@/components/analytics': { trackEvent() {} },
    '@/components/ui/dialog': { Dialog: 'dialog', DialogContent: 'section', DialogTitle: 'h1', DialogDescription: 'description' },
  }, { window: { dispatchEvent: e => calls.push(e.type) }, Event });
  const { PaymentModal } = h.load('components/payment/payment-modal.tsx');
  const props = { isOpen: true, onClose() {}, tier: 'starter', price: '$4.99', credits: 15 };
  const wrapper = PaymentModal(props);
  const render = () => h.render(wrapper.type, wrapper.props);
  const tree = render();h.flush();
  return { h, calls, paypal, PaymentModal, props, wrapper, render,
    success: elements(tree).find(e => e.type === paypal).props.onSuccess };
}
const receipt = { orderId: 'ORDER-SYNTHETIC', tier: 'pro', credits: 50 };

test('confirmed checkout shows actual purchased tier/credits and refreshes only once per order', () => {
  const c = checkout();
  c.success(receipt);c.success(receipt);
  assert.deepEqual(c.calls, ['credits-updated', 'refresh']);
  const tree = c.render();
  assert.match(text(tree), /50 credits from Pro Bundle/);
  assert.ok(elements(tree).some(e => e.props?.role === 'status'));
  assert.ok(!elements(tree).some(e => e.type === c.paypal));
});

test('tier changes have distinct sessions; old callbacks after unmount cannot refresh or report success', () => {
  const old = checkout();
  const nextWrapper = old.PaymentModal({ ...old.props, tier: 'master' });
  assert.notEqual(nextWrapper.key, old.wrapper.key);
  old.h.unmount();const writes = old.h.writes.length;
  old.success(receipt);
  assert.deepEqual(old.calls, []);
  assert.equal(old.h.writes.length, writes);
});

test('closing removes checkout; reopening starts clean and late old success remains ignored', () => {
  const old = checkout();old.success(receipt);
  assert.equal(old.PaymentModal({ ...old.props, isOpen: false }), null);
  old.h.unmount();old.success({ ...receipt, orderId: 'LATE' });
  assert.deepEqual(old.calls, ['credits-updated', 'refresh']);
  const reopened = checkout();
  assert.ok(elements(reopened.render()).some(e => e.type === reopened.paypal));
  assert.ok(!elements(reopened.render()).some(e => e.props?.role === 'status'));
});

// Execute the rendered description for each pack, rather than checking source strings.
for (const [tier, price, credits, name] of [
  ['starter', '$4.99', 15, 'Starter Pack'],
  ['pro', '$19.99', 50, 'Pro Bundle'],
  ['master', '$39.99', 200, 'Master Plan'],
]) {
  test(`checkout accessibility description identifies ${tier} and one-time payment`, () => {
    const c = checkout();
    const wrapper = c.PaymentModal({ ...c.props, tier, price, credits });
    const tree = c.h.render(wrapper.type, wrapper.props);
    const description = elements(tree).find(e => e.type === 'description');
    assert.ok(description);
    const content = text(description);
    for (const value of [String(credits), price, name, 'USD', 'one-time payment', 'PayPal']) {
      assert.ok(content.includes(value), `Description missing ${value}`);
    }
    c.h.unmount();
  });
}
