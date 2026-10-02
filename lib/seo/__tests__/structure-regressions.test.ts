import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getLocalArticleBySlug } from '../../content/local-articles';
import { SHOP_PRODUCTS } from '../shop-products';
import { PRINTFUL_PRODUCTS } from '../../printful/config';

test('cat article keeps its linked brand name and a single route-owned H1', async () => {
  const article = await getLocalArticleBySlug('ai-cat-portrait');
  assert.ok(article);
  assert.match(article.excerpt, /On PixPawAI/);
  assert.doesNotMatch(article.excerpt, /\$1/);
  assert.doesNotMatch(article.content, /<h1\b/i);
  assert.match(article.content, /<h2\b/);
  assert.match(article.content, /href="https:\/\/pixpawai.com\/en\/"/);
});

test('shop schema retains the exact configured minimum in dollars', () => {
  for (const product of Object.values(PRINTFUL_PRODUCTS)) {
    const seo = SHOP_PRODUCTS.find(item => item.productId === product.productId);
    assert.equal(seo?.priceValue, Math.min(...product.variants.map(v => v.price)) / 100);
  }
  assert.ok(SHOP_PRODUCTS.some(item => item.priceValue === 64.99));
});

test('document elements belong only to the app root', () => {
  const root = fs.readFileSync('app/layout.tsx', 'utf8');
  const locale = fs.readFileSync('app/[lang]/layout.tsx', 'utf8');
  for (const tag of ['html', 'head', 'body']) {
    assert.match(root, new RegExp(`<${tag}\\b`));
    assert.doesNotMatch(locale, new RegExp(`<${tag}\\b`));
  }
  assert.match(locale, /<OrganizationSchema/);
});

test('pricing schema emits the same question and answer pairs as the shared visible FAQ', async () => {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { FAQPageSchema } = await import('../../../components/home-schema');
  const { PRICING_FAQS } = await import('../pricing-faq');
  const markup = renderToStaticMarkup(React.createElement(FAQPageSchema, { faqs: PRICING_FAQS }));
  const json = JSON.parse(markup.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
  assert.deepEqual(json.mainEntity.map((item: any) => ({ question: item.name, answer: item.acceptedAnswer.text })), PRICING_FAQS);
  assert.doesNotMatch(markup, /3-Image|style mixing|Pro Bundle|Master Plan/);
});
