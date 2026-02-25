/**
 * Guest Credit System for Anonymous Users
 * Allows 2 free generations per IP per day
 */

import { Redis } from '@upstash/redis'

// Reuse the Redis instance from rate-limit.ts
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const GUEST_DAILY_LIMIT = 2
const GUEST_TTL_SECONDS = 86400 // 24 hours

/**
 * Check if guest user has remaining free credits
 */
export async function checkGuestFreeTier(ip: string): Promise<{
  allowed: boolean
  remaining: number
  total: number
  resetAt?: Date
}> {
  try {
    const key = `guest_free:${ip}`

    // Get current usage count
    const usage = await redis.get<number>(key)

    const currentUsage = usage || 0
    const remaining = Math.max(0, GUEST_DAILY_LIMIT - currentUsage)
    const allowed = remaining > 0

    // Get TTL to calculate reset time
    const ttl = await redis.ttl(key)
    const resetAt = ttl > 0
      ? new Date(Date.now() + ttl * 1000)
      : new Date(Date.now() + GUEST_TTL_SECONDS * 1000)

    return {
      allowed,
      remaining,
      total: GUEST_DAILY_LIMIT,
      resetAt
    }
  } catch (error) {
    console.error('[Guest Credits] Check failed:', error)
    // On error, allow to continue (fail-open)
    return {
      allowed: true,
      remaining: GUEST_DAILY_LIMIT,
      total: GUEST_DAILY_LIMIT
    }
  }
}

/**
 * Increment guest usage after successful generation
 */
export async function incrementGuestUsage(ip: string): Promise<void> {
  try {
    const key = `guest_free:${ip}`

    // Increment with expiry (only set expiry on first use)
    const current = await redis.incr(key)

    if (current === 1) {
      // Set expiry on first increment
      await redis.expire(key, GUEST_TTL_SECONDS)
      console.log(`[Guest Credits] First use for IP ${ip}, starting 24h window`)
    } else {
      console.log(`[Guest Credits] IP ${ip} now at ${current}/${GUEST_DAILY_LIMIT}`)
    }
  } catch (error) {
    console.error('[Guest Credits] Increment failed:', error)
    // Non-critical error, don't throw
  }
}

/**
 * Get remaining guest credits (for display purposes)
 */
export async function getGuestRemainingCredits(ip: string): Promise<number> {
  try {
    const key = `guest_free:${ip}`
    const usage = await redis.get<number>(key)
    return Math.max(0, GUEST_DAILY_LIMIT - (usage || 0))
  } catch (error) {
    console.error('[Guest Credits] Get remaining failed:', error)
    return GUEST_DAILY_LIMIT
  }
}
