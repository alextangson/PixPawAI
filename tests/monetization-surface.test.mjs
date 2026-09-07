import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('pricing leads with purchasable outcomes and keeps credits as a repeat-use option', () => {
  const source = read('app/[lang]/pricing/pricing-page-client.tsx');
  const hd = source.indexOf('HD Digital Portrait');
  const canvas = source.indexOf('Canvas Keepsake');
  const credits = source.indexOf('Need more generations?');

  assert.ok(hd > 0);
  assert.ok(canvas > hd);
  assert.ok(credits > canvas);
  assert.match(source, /profit_ladder_v1/);
  assert.doesNotMatch(source, /Coming Soon|Money-Back Guarantee|MOST POPULAR|Limited time offer/);
});

test('checkout persistence failure withholds the PayPal order from the buyer', () => {
  const source = read('app/api/printful/create-order/route.ts');
  const persistence = source.indexOf('const { error: insertError } = await');
  const failure = source.indexOf('if (insertError)');
  const response = source.indexOf('paypalOrderId: paypalOrder.id');

  assert.ok(persistence > 0);
  assert.ok(failure > persistence);
  assert.ok(response > failure);
  assert.match(source, /Checkout is temporarily unavailable/);
});

test('credit checkout describes only currently delivered benefits', () => {
  const source = read('components/payment/payment-modal.tsx');
  assert.doesNotMatch(source, /3-Image Selection|Priority Queue|Priority Support|Physical Products|Premium Styles/);
  assert.match(source, /Credits never expire/);
  assert.match(source, /Watermark-free downloads/);
});

test('pricing metadata matches the value ladder shown on the page', () => {
  const source = read('app/[lang]/pricing/layout.tsx');
  assert.match(source, /HD Digital Portrait/);
  assert.match(source, /Canvas Keepsake/);
  assert.match(source, /HD_UNLOCK\.amount/);
  assert.match(source, /price: '64\.99'/);
  assert.match(source, /buildCreditPackAggregateOffer\(\)\.offers/);
});
