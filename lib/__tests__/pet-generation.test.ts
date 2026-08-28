import test from 'node:test'
import assert from 'node:assert/strict'
import { hasUsablePetIdentity, normalizePetType, preservePetIdentity, resolvePetPromptStrength } from '../pet-generation'

test('unknown and failed analysis are not pet identity evidence', () => {
  for (const petType of [undefined, null, '', 'unknown', ' UNKNOWN ', 'pet', 'other', 'none', 'woman', 'girl', 42]) {
    assert.equal(hasUsablePetIdentity({ petType }), false)
  }
  assert.equal(hasUsablePetIdentity({ petType: 'dog', issues: ['qwen_api_error'] }), false)
  assert.equal(hasUsablePetIdentity({ petType: 'dog', hasPet: false }), false)
  assert.equal(hasUsablePetIdentity({ petType: 'dog', isSafe: false }), false)
  assert.equal(hasUsablePetIdentity({ petType: 'dog', issues: ['poor_lighting'] }), true)
})

test('normalizes known pets and never invents dog when analysis is unknown', () => {
  assert.equal(normalizePetType(' DOG '), 'dog')
  assert.equal(normalizePetType('puppy'), 'dog')
  assert.equal(normalizePetType('kitten'), 'cat')
  assert.equal(normalizePetType('guinea pig'), 'guinea pig')
  assert.equal(normalizePetType('unknown'), undefined)
})

test('identity guard is independent of style and works for fallback prompts', () => {
  const prompt = preservePetIdentity('wearing a Santa hat, commercial photography', 'dog')
  assert.match(prompt, /^Pet portrait of the same dog from the reference photo\./)
  assert.match(prompt, /never a human/)
  assert.match(prompt, /wearing a Santa hat/)
  assert.match(preservePetIdentity('watercolor', 'cat'), /same cat/)
  assert.throws(() => preservePetIdentity('Santa hat', 'unknown'), /could not be verified/)
  const christmas = preservePetIdentity('commercial photography', 'dog', 'Christmas-Vibe')
  assert.ok(christmas.indexOf('Santa hat') < christmas.indexOf('commercial photography'))
})

test('Christmas caps stale database and explicit client strengths', () => {
  assert.equal(resolvePetPromptStrength('Christmas-Vibe', undefined, 0.92), 0.9)
  assert.equal(resolvePetPromptStrength('Christmas-Vibe', 1, 0.45), 0.9)
  assert.equal(resolvePetPromptStrength('Christmas-Vibe', 0, 0.92), 0)
  assert.equal(resolvePetPromptStrength('Christmas-Vibe', 0.4, 0.92), 0.4)
  for (const invalid of [NaN, Infinity, -1, 2, '0.92', null]) {
    assert.equal(resolvePetPromptStrength('Christmas-Vibe', invalid, invalid), 0.9)
  }
  assert.equal(resolvePetPromptStrength('Retro-Pop-Art', undefined, 0.85), 0.85)
})
