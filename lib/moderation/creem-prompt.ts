const CREEM_MODERATION_URL = 'https://api.creem.io/v1/moderation/prompt'

type CreemModerationDecision = 'allow' | 'flag' | 'deny'

type CreemModerationResponse = {
  id?: unknown
  decision?: unknown
  usage?: {
    units?: unknown
  }
}

type ModerateUserPromptOptions = {
  apiKey?: string
  externalId?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

export class CreemModerationError extends Error {
  constructor(
    public code: 'PROMPT_REJECTED' | 'MODERATION_UNAVAILABLE',
    public status: 400 | 503,
    message: string,
  ) {
    super(message)
    this.name = 'CreemModerationError'
  }
}

/**
 * Screen user-controlled text with Creem before any image generation or billing.
 * Flagged content is blocked, and provider/configuration failures fail closed.
 */
export async function moderateUserPrompt(
  prompt: string,
  options: ModerateUserPromptOptions = {},
): Promise<{ id: string; decision: 'allow'; units: number | null }> {
  const normalizedPrompt = typeof prompt === 'string' ? prompt.trim() : ''
  if (!normalizedPrompt) {
    throw new CreemModerationError(
      'PROMPT_REJECTED',
      400,
      'Please describe a safe pet portrait scene and try again.',
    )
  }

  const apiKey = options.apiKey
    ?? process.env.CREEM_MODERATION_API_KEY
    ?? process.env.CREEM_API_KEY
  if (!apiKey) {
    throw new CreemModerationError(
      'MODERATION_UNAVAILABLE',
      503,
      'Content safety checks are temporarily unavailable. No credits were used.',
    )
  }

  const fetchImpl = options.fetchImpl ?? fetch
  let response: Response
  try {
    response = await fetchImpl(CREEM_MODERATION_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        prompt: normalizedPrompt,
        ...(options.externalId ? { external_id: options.externalId } : {}),
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 5000),
    })
  } catch {
    throw new CreemModerationError(
      'MODERATION_UNAVAILABLE',
      503,
      'Content safety checks are temporarily unavailable. No credits were used.',
    )
  }

  let result: CreemModerationResponse
  try {
    result = await response.json() as CreemModerationResponse
  } catch {
    result = {}
  }

  const decision = result.decision as CreemModerationDecision | undefined
  if (!response.ok || !['allow', 'flag', 'deny'].includes(decision ?? '')) {
    throw new CreemModerationError(
      'MODERATION_UNAVAILABLE',
      503,
      'Content safety checks are temporarily unavailable. No credits were used.',
    )
  }

  if (decision === 'flag' || decision === 'deny') {
    throw new CreemModerationError(
      'PROMPT_REJECTED',
      400,
      'This scene request cannot be processed under our Acceptable Use Policy. No credits were used.',
    )
  }

  if (typeof result.id !== 'string' || !result.id) {
    throw new CreemModerationError(
      'MODERATION_UNAVAILABLE',
      503,
      'Content safety checks are temporarily unavailable. No credits were used.',
    )
  }

  return {
    id: result.id,
    decision: 'allow',
    units: typeof result.usage?.units === 'number' ? result.usage.units : null,
  }
}
