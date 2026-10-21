import { waffoClient } from '@/lib/waffo/config'
import { ScanSemanticMode } from '@waffo/pancake-ts'

export class WaffoModerationError extends Error {
  constructor(
    public code: 'PROMPT_REJECTED' | 'MODERATION_REVIEW' | 'MODERATION_UNAVAILABLE',
    public status: 400 | 429 | 503,
    message: string,
    public retryAfterSeconds?: number,
  ) {
    super(message)
    this.name = 'WaffoModerationError'
  }
}

/** No prompt text or provider error payloads are logged. Never fail open. */
export async function moderateWaffoPrompt(prompt: string): Promise<void> {
  const unavailable = () => new WaffoModerationError('MODERATION_UNAVAILABLE', 503,
    'Content safety checks are temporarily unavailable. Please retry later. No credits were used.', 60)
  if (!prompt.trim() || prompt.length > 10000) {
    throw new WaffoModerationError('PROMPT_REJECTED', 400,
      'Please use a scene description of 1–10,000 characters. No credits were used.')
  }
  let rateLimitSeconds: number | undefined
  let verdict
  try {
    const client = waffoClient({ fetch: async (url, init) => {
      const timeout = AbortSignal.timeout(10000)
      const response = await fetch(url, { ...init,
        signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
      })
      if (response.status === 429) {
        const header = response.headers.get('retry-after')
        const delay = header && /^\d+$/.test(header) ? Number(header)
          : header ? Math.ceil((Date.parse(header) - Date.now()) / 1000) : NaN
        rateLimitSeconds = Number.isFinite(delay) && delay > 0 ? delay : 60
      }
      return response
    } })
    verdict = await client.contentSafety.scanPrompt({
      prompt: prompt.trim(), semantic: ScanSemanticMode.Enforce,
    })
  } catch {
    if (rateLimitSeconds !== undefined) {
      throw new WaffoModerationError('MODERATION_UNAVAILABLE', 429,
        'Content safety checks are busy. Please retry after the indicated delay. No credits were used.', rateLimitSeconds)
    }
    throw unavailable()
  }
  if (rateLimitSeconds !== undefined) throw unavailable()
  if (verdict?.action === 'allow' && verdict.reasonCode === 'allowed' &&
      typeof verdict.requestId === 'string' && verdict.requestId.length > 0) return
  if (verdict?.action === 'block') {
    throw new WaffoModerationError('PROMPT_REJECTED', 400,
      'This scene request cannot be processed under our Acceptable Use Policy. No credits were used.')
  }
  if (verdict?.action === 'review' && verdict.reasonCode !== 'service_degraded') {
    throw new WaffoModerationError('MODERATION_REVIEW', 503,
      'This scene needs further safety review. Please try again later. No credits were used.', 3600)
  }
  throw unavailable()
}
