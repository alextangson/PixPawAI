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

test('matches FAQ headings that carry a topic suffix', () => {
  const html = `
    <h2>Intro</h2>
    <p>Not a question.</p>
    <h2>FAQ: Pet Loss Gift Ideas</h2>
    <p><strong>Q: Is it appropriate to give a pet loss gift?</strong></p>
    <p>A: Absolutely. Acknowledging pet loss validates the grief.</p>
    <p><strong>Q: What if they already have everything?</strong></p>
    <p>A: Consider a donation in their pet&#8217;s name.</p>
  `;

  assert.deepEqual(extractFaqFromHtml(html), [
    {
      question: 'Is it appropriate to give a pet loss gift?',
      answer: 'Absolutely. Acknowledging pet loss validates the grief.',
    },
    {
      question: 'What if they already have everything?',
      answer: 'Consider a donation in their pet’s name.',
    },
  ]);
});

test('decodes numeric entities instead of leaking them into JSON-LD', () => {
  const html = `
    <h2>FAQ</h2>
    <h3>What&#8217;s included&#8230;</h3>
    <p>Everything &amp; more &#8212; no extras.</p>
    <h3>Second question?</h3>
    <p>Second answer.</p>
  `;

  const result = extractFaqFromHtml(html);

  assert.equal(result[0].question, 'What’s included…');
  assert.equal(result[0].answer, 'Everything & more — no extras.');
});

test('matches a "Frequently Asked Questions" heading', () => {
  const html = `
    <h2>Frequently Asked Questions</h2>
    <h3>How long does it take?</h3>
    <p>Around 30 seconds.</p>
  `;

  assert.equal(extractFaqFromHtml(html).length, 1);
});

test('stops at the next h2 so unrelated content is not treated as an answer', () => {
  const html = `
    <h2>FAQ</h2>
    <p><strong>Question one?</strong></p>
    <p>Answer one.</p>
    <h2>Conclusion</h2>
    <p><strong>Not a question</strong></p>
    <p>Not an answer.</p>
  `;

  assert.deepEqual(extractFaqFromHtml(html), [
    { question: 'Question one?', answer: 'Answer one.' },
  ]);
});

test('dedupes repeated questions and returns nothing for empty input', () => {
  const html = `
    <h2>FAQ</h2>
    <p><strong>Same question?</strong></p>
    <p>First answer.</p>
    <p><strong>Same question?</strong></p>
    <p>Second answer.</p>
  `;

  assert.equal(extractFaqFromHtml(html).length, 1);
  assert.deepEqual(extractFaqFromHtml(''), []);
});
