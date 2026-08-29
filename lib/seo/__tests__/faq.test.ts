import test from 'node:test';
import assert from 'node:assert/strict';
import { extractFaqFromHtml } from '../faq';

test('extracts FAQ items from strong + paragraph pattern', () => {
  const html = `
    <h2>FAQ</h2>
    <p><strong>Is this appropriate?</strong></p>
    <p>Yes, it helps people process grief.</p>
    <p><strong>How much does it cost?</strong></p>
    <p>From free to premium plans.</p>
  `;

  assert.deepEqual(extractFaqFromHtml(html), [
    { question: 'Is this appropriate?', answer: 'Yes, it helps people process grief.' },
    { question: 'How much does it cost?', answer: 'From free to premium plans.' },
  ]);
});

test('extracts FAQ items from h3 + paragraph pattern', () => {
  const html = `
    <h2>FAQ</h2>
    <h3>Can I use an old photo?</h3>
    <p>Yes. Upload the best quality you have.</p>
  `;

  assert.deepEqual(extractFaqFromHtml(html), [
    { question: 'Can I use an old photo?', answer: 'Yes. Upload the best quality you have.' },
  ]);
});
