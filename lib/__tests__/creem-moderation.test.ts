import test from 'node:test'
import assert from 'node:assert/strict'
import { CreemModerationError, moderateUserPrompt } from '../moderation/creem-prompt'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

test('allows only an explicit allow decision and sends only the expected fields', async () => {
  let requestBody: Record<string, unknown> | undefined
  const result = await moderateUserPrompt('  my pet on the beach  ', {
    apiKey: 'creem_synthetic',
    externalId: 'generation_synthetic',
    fetchImpl: (async (url, init) => {
      assert.equal(url, 'https://api.creem.io/v1/moderation/prompt')
      assert.equal(init?.method, 'POST')
      assert.equal((init?.headers as Record<string, string>)['x-api-key'], 'creem_synthetic')
      requestBody = JSON.parse(String(init?.body))
      return jsonResponse({ id: 'mod_allow', decision: 'allow', usage: { units: 1 }, ignored: true })
    }) as typeof fetch,
  })

  assert.deepEqual(requestBody, {
    prompt: 'my pet on the beach',
    external_id: 'generation_synthetic',
  })
  assert.deepEqual(result, { id: 'mod_allow', decision: 'allow', units: 1 })
})

test('flag and deny both block the prompt', async () => {
  for (const decision of ['flag', 'deny']) {
    await assert.rejects(
      moderateUserPrompt('unsafe request', {
        apiKey: 'creem_synthetic',
        fetchImpl: (async () => jsonResponse({ id: `mod_${decision}`, decision })) as typeof fetch,
      }),
      (error: unknown) => error instanceof CreemModerationError
        && error.code === 'PROMPT_REJECTED'
        && error.status === 400,
    )
  }
})

test('missing config, provider errors, malformed responses, and timeouts fail closed', async () => {
  const cases: Array<Parameters<typeof moderateUserPrompt>[1]> = [
    { apiKey: '' },
    { apiKey: 'creem_synthetic', fetchImpl: (async () => jsonResponse({ error: 'nope' }, 503)) as typeof fetch },
    { apiKey: 'creem_synthetic', fetchImpl: (async () => jsonResponse({ id: 'mod_unknown', decision: 'review' })) as typeof fetch },
    { apiKey: 'creem_synthetic', fetchImpl: (async () => { throw new Error('timeout') }) as typeof fetch },
  ]

  for (const options of cases) {
    await assert.rejects(
      moderateUserPrompt('my pet', options),
      (error: unknown) => error instanceof CreemModerationError
        && error.code === 'MODERATION_UNAVAILABLE'
        && error.status === 503,
    )
  }
})
