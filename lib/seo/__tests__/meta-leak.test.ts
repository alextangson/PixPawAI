import test from 'node:test';
import assert from 'node:assert/strict';
import { stripSeoMetaLeak } from '../meta-leak';

test('prefers the Meta Description body when both labels leak into an excerpt', () => {
  const leaked =
    'Meta Title: Custom Pet Pillows: The Ultimate Comfort Gift for Pet Lovers Meta Description: Discover why custom pet pillows are the must-have personalized gift in 2026.';
  assert.equal(
    stripSeoMetaLeak(leaked),
    'Discover why custom pet pillows are the must-have personalized gift in 2026.'
  );
});

test('strips a leading Meta Title label', () => {
  assert.equal(stripSeoMetaLeak('Meta Title: Hello pillows'), 'Hello pillows');
});

test('leaves a normal excerpt alone', () => {
  assert.equal(
    stripSeoMetaLeak('Compare AI vs traditional pet portraits.'),
    'Compare AI vs traditional pet portraits.'
  );
});
