import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = relative => readFileSync(path.join(root, relative), 'utf8');

test('generation safety cannot be disabled and Creem moderation runs before billing', () => {
  const route = read('app/api/generate/route.ts');
  const router = read('lib/model-router.ts');
  assert.doesNotMatch(`${route}\n${router}`, /disable_safety_checker:\s*true/);
  assert.match(`${route}\n${router}`, /disable_safety_checker:\s*false/g);
  assert.ok(route.indexOf('await moderateUserPrompt(') < route.indexOf(".from('generations')"));
  assert.ok(route.indexOf('await moderateUserPrompt(') < route.indexOf("'decrement_credits'"));
  assert.ok(route.indexOf('await moderateUserPrompt(') < route.indexOf('await generateWithReplicate('));
});

test('public compliance pages and purchase surfaces link the Acceptable Use Policy', () => {
  const aup = read('app/[lang]/acceptable-use/page.tsx');
  assert.match(aup, /NSFW/);
  assert.match(aup, /Creem.*Moderation API/);
  assert.match(aup, /flag.*deny/s);
  assert.match(read('app/[lang]/terms/page.tsx'), /Acceptable Use Policy/);
  assert.match(read('components/footer.tsx'), /acceptable-use/);
  assert.match(read('components/payment/payment-modal.tsx'), /acceptable-use/);
  assert.match(read('components/upload-modal-wizard.tsx'), /acceptable-use/);
});

test('shop surfaces contain no fabricated customer counts, ratings, or testimonials', () => {
  const shop = read('app/[lang]/shop/page.tsx');
  const product = read('components/shop/product-detail-client.tsx');
  assert.doesNotMatch(`${shop}\n${product}`, /10,000\+|4\.9\/5|Join thousands|\(127\)|\(89 reviews\)|Sarah M\.|James K\.|Emily R\./);
  assert.doesNotMatch(read('app/[lang]/about/page.tsx'), /tested across thousands/);
  assert.doesNotMatch(read('lib/constants/fun-facts.ts'), /trained on thousands|Hollywood movie effects|over 100 facial features/);
});

test('public pricing promises only implemented products and benefits', () => {
  const pricing = read('app/[lang]/pricing/pricing-page-client.tsx');
  const paymentModal = read('components/payment/payment-modal.tsx');
  const publicCopy = `${pricing}\n${paymentModal}`;

  assert.doesNotMatch(publicCopy, /Multi-Image Selection|Premium Styles|Priority Queue|Priority Support|Money-Back Guarantee|Limited Time/i);
  assert.match(publicCopy, /Credits never expire/);
  assert.match(publicCopy, /Watermark-free/);
  assert.match(paymentModal, /Acceptable Use Policy/);
});
