import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveWordPressMeta } from '../wordpress/blog'

const FALLBACK = {
  title: 'Fallback Title',
  excerpt: 'Fallback excerpt text that stands in when WordPress has no SEO metadata configured.',
}

test('prefers Yoast title and description when present', () => {
  const meta = resolveWordPressMeta(
    {
      yoast_head_json: {
        title: 'Yoast Title | PixPaw AI',
        description: 'Yoast meta description.',
        og_description: 'OG description that should be ignored.',
      },
    },
    FALLBACK
  )

  assert.equal(meta.metaTitle, 'Yoast Title | PixPaw AI')
  assert.equal(meta.metaDescription, 'Yoast meta description.')
})

test('falls back to og_description when Yoast description is empty', () => {
  const meta = resolveWordPressMeta(
    { yoast_head_json: { title: 'Yoast Title', description: '', og_description: 'OG description.' } },
    FALLBACK
  )

  assert.equal(meta.metaDescription, 'OG description.')
})

test('falls back to cleaned title and truncated excerpt without Yoast', () => {
  const meta = resolveWordPressMeta({}, FALLBACK)

  assert.equal(meta.metaTitle, FALLBACK.title)
  assert.equal(meta.metaDescription, FALLBACK.excerpt.substring(0, 160))
})

test('decodes entities and strips markup coming out of Yoast', () => {
  const meta = resolveWordPressMeta(
    {
      yoast_head_json: {
        title: 'Pet &amp; Portrait <b>Guide</b>',
        description: '  Spaced   &quot;quoted&quot; copy.  ',
      },
    },
    FALLBACK
  )

  assert.equal(meta.metaTitle, 'Pet & Portrait Guide')
  assert.equal(meta.metaDescription, 'Spaced "quoted" copy.')
})

test('truncates only the excerpt fallback, never the editor-authored Yoast copy', () => {
  const longYoast = 'y'.repeat(200)
  const meta = resolveWordPressMeta({ yoast_head_json: { description: longYoast } }, FALLBACK)

  assert.equal(meta.metaDescription.length, 200)
})
