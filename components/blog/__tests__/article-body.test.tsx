import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { BlogArticleBody, looksLikeHtmlContent } from '../article-body';

test('looksLikeHtmlContent detects WordPress HTML content', () => {
  assert.equal(
    looksLikeHtmlContent('<h1>Pet Memorial Gift</h1><p>Honor your companion.</p>'),
    true
  );
});

test('looksLikeHtmlContent keeps markdown content on markdown path', () => {
  assert.equal(
    looksLikeHtmlContent('# Pet Memorial Gift\n\nHonor your companion.'),
    false
  );
});

test('BlogArticleBody renders WordPress HTML instead of escaped tags', () => {
  const markup = renderToStaticMarkup(
    <BlogArticleBody content="<h2>Ideas</h2><p>Comfort &amp; remembrance.</p>" />
  );

  assert.match(markup, /<h2>Ideas<\/h2>/);
  assert.match(markup, /<p>Comfort & remembrance\.<\/p>/);
  assert.doesNotMatch(markup, /&lt;h2&gt;Ideas&lt;\/h2&gt;/);
});

test('looksLikeHtmlContent returns false for empty content', () => {
  assert.equal(looksLikeHtmlContent(''), false);
});
