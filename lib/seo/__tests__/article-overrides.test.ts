import test from 'node:test';
import assert from 'node:assert/strict';
import { applyArticlePresentation, rewriteArticleBodyHtml } from '../article-overrides';

const slug = 'best-ai-pet-portrait-generator';
const coverUrl = 'https://pixpawai.com/blog/covers/best-ai-pet-portrait-generator-hero.png';
const legacyUrl = 'https://beige-yak-585162.hostingersite.com/wp-content/uploads/hero.png';
const article = {
  slug,
  title: 'WP title',
  excerpt: 'WP excerpt',
  coverImage: { url: legacyUrl, alt: 'Old cover', width: 800, height: 600 },
};

test('presentation replaces the WP cover with the self-hosted cover without mutating the source', () => {
  assert.deepEqual(applyArticlePresentation(article).coverImage, {
    url: coverUrl,
    alt: 'AI pet portrait style comparison collage for best AI pet portrait generator guide',
    width: 1536,
    height: 1024,
  });
  assert.equal(article.coverImage.url, legacyUrl);
  assert.equal(applyArticlePresentation({ ...article, slug: 'another-post' }).coverImage, article.coverImage);
});

test('body scrub replaces legacy image URLs while preserving surrounding HTML and other images', () => {
  const html = `<p>Comparison copy stays unchanged.</p><img src="${legacyUrl}" srcset="${legacyUrl} 1x, https://other.hostingersite.com/hero.png 2x" data-src='//other.hostingersite.com/lazy.png'><div style="background-image:url(https://other.hostingersite.com/bg.png)"></div><img src="https://pixpawai.com/other.png">`;
  const rewritten = rewriteArticleBodyHtml(slug, html);
  assert.doesNotMatch(rewritten, /hostingersite|beige-yak/i);
  assert.equal(rewritten, `<p>Comparison copy stays unchanged.</p><img src="${coverUrl}" srcset="${coverUrl} 1x, ${coverUrl} 2x" data-src='${coverUrl}'><div style="background-image:url(${coverUrl})"></div><img src="https://pixpawai.com/other.png">`);
  assert.equal(rewriteArticleBodyHtml('another-post', html), html);
});
