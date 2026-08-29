import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { stripSeoMetaLeak } from '@/lib/seo/meta-leak';

describe('stripSeoMetaLeak', () => {
  it('prefers the Meta Description body when both labels are dumped into an excerpt', () => {
    const leaked =
      'Meta Title: Custom Pet Pillows: The Ultimate Comfort Gift for Pet Lovers Meta Description: Discover why custom pet pillows are the must-have personalized gift in 2026.';
    assert.equal(
      stripSeoMetaLeak(leaked),
      'Discover why custom pet pillows are the must-have personalized gift in 2026.'
    );
  });

  it('strips a leading Meta Title label', () => {
    assert.equal(
      stripSeoMetaLeak('Meta Title: Hello pillows'),
      'Hello pillows'
    );
  });

  it('leaves a normal excerpt alone', () => {
    assert.equal(
      stripSeoMetaLeak('Compare AI vs traditional pet portraits.'),
      'Compare AI vs traditional pet portraits.'
    );
  });
});
