/**
 * Violation Tracker & Progressive Penalty System
 * 
 * Purpose: Track user violations and implement escalating penalties
 * 
 * Penalty Tiers:
 * - 1-2 violations: Warning message
 * - 3-5 violations: 24-hour cooldown
 * - 6+ violations: Permanent ban
 * 
 * Usage:
 * ```typescript
 * const status = await checkUserViolations(userId)
 * if (status.banned) {
 *   return error('Account suspended')
 * }
 * 
 * await logViolation(userId, 'nsfw_image', imageUrl)
 * ```
 */

import { createAdminClient } from '@/lib/supabase/server'

// ============================================
// Types
// ============================================

export interface ViolationStatus {
  allowed: boolean
  banned?: boolean
  cooldown?: number // seconds remaining
  warning?: boolean
  message?: string
  violationCount: number
  reason?: string
}

export type ViolationType = 
  | 'nsfw_image' 
  | 'sensitive_prompt' 
  | 'user_report'
  | 'gore'
  | 'hate'
  | 'violence'

export interface LogViolationParams {
  userId: string
  violationType: ViolationType
  imageUrl?: string
  prompt?: string
  unsafeReason?: string
  metadata?: Record<string, any>
}

// ============================================
// Violation Checking
// ============================================

/**
 * Check user's violation status and determine if they can proceed
 * Returns violation count and penalty status
 */
export async function checkUserViolations(userId: string): Promise<ViolationStatus> {
  try {
    const supabase = createAdminClient()
    
    // Check for active ban
    const { data: activeBan } = await supabase
      .from('user_bans')
      .select('*')
      .eq('user_id', userId)
      .or('expires_at.is.null,expires_at.gt.now()')
      .single()
    
    if (activeBan) {
      if (activeBan.ban_type === 'permanent') {
        return {
          allowed: false,
          banned: true,
          violationCount: 0,
          reason: activeBan.reason || 'Multiple content policy violations',
          message: 'Your account has been permanently suspended for violating our content policy.'
        }
      }
      
      if (activeBan.ban_type === 'cooldown' && activeBan.expires_at) {
        const expiresAt = new Date(activeBan.expires_at)
        const now = new Date()
        const secondsRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / 1000)
        
        if (secondsRemaining > 0) {
          return {
            allowed: false,
            cooldown: secondsRemaining,
            violationCount: 0,
            message: `Your account is in cooldown. Please wait ${formatCooldown(secondsRemaining)}.`
          }
        }
      }
    }
    
    // Get violation count in last 30 days
    const { data: violations, error, count } = await supabase
      .from('moderation_logs')
      .select('*', { count: 'exact', head: false })
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    if (error) {
      console.error('Error checking violations:', error)
      // On error, allow but log
      return {
        allowed: true,
        violationCount: 0
      }
    }
    
    const violationCount = count || 0
    
    // Apply progressive penalties
    if (violationCount >= 6) {
      // Permanent ban (should have been caught above, but double-check)
      return {
        allowed: false,
        banned: true,
        violationCount,
        reason: 'Multiple violations',
        message: 'Your account has been suspended for repeated content policy violations.'
      }
    }
    
    if (violationCount >= 3) {
      // 24-hour cooldown
      return {
        allowed: false,
        cooldown: 86400, // 24 hours in seconds
        violationCount,
        message: 'Due to multiple violations, your account is in a 24-hour cooldown period.'
      }
    }
    
    if (violationCount >= 1) {
      // Warning
      return {
        allowed: true,
        warning: true,
        violationCount,
        message: `Content policy warning: You have ${violationCount} violation(s) in the last 30 days. Further violations may result in account suspension.`
      }
    }
    
    // No violations
    return {
      allowed: true,
      violationCount: 0
    }
  } catch (error) {
    console.error('Error in checkUserViolations:', error)
    // On error, allow but log
    return {
      allowed: true,
      violationCount: 0
    }
  }
}

/**
 * Log a content policy violation
 * Automatically applies progressive penalties
 */
export async function logViolation(params: LogViolationParams): Promise<{ success: boolean; penaltyApplied?: string }> {
  try {
    const { userId, violationType, imageUrl, prompt, unsafeReason, metadata } = params
    const supabase = createAdminClient()
    
    // Insert violation log
    const { error: logError } = await supabase
      .from('moderation_logs')
      .insert({
        user_id: userId,
        violation_type: violationType,
        image_url: imageUrl,
        prompt: prompt,
        unsafe_reason: unsafeReason || 'none',
        metadata: metadata || {}
      })
    
    if (logError) {
      console.error('Error logging violation:', logError)
      return { success: false }
    }
    
    console.log(`🚨 Violation logged: ${violationType} for user ${userId.substring(0, 8)}...`)
    
    // Check total violations and apply penalty
    const status = await checkUserViolations(userId)
    
    // Apply ban if threshold reached
    if (status.violationCount >= 6) {
      await applyBan(userId, 'permanent', 'Multiple content policy violations (6+ offenses)')
      return { success: true, penaltyApplied: 'permanent_ban' }
    }
    
    if (status.violationCount >= 3 && status.violationCount < 6) {
      await applyBan(userId, 'cooldown', '24-hour cooldown for repeated violations', 86400)
      return { success: true, penaltyApplied: '24h_cooldown' }
    }
    
    if (status.violationCount === 1) {
      await applyBan(userId, 'warning', 'First content policy violation - warning issued')
      return { success: true, penaltyApplied: 'warning' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in logViolation:', error)
    return { success: false }
  }
}

/**
 * Apply a ban or cooldown to a user
 */
async function applyBan(
  userId: string, 
  banType: 'warning' | 'cooldown' | 'permanent',
  reason: string,
  durationSeconds?: number
): Promise<void> {
  try {
    const supabase = createAdminClient()
    
    const expiresAt = durationSeconds 
      ? new Date(Date.now() + durationSeconds * 1000).toISOString()
      : null
    
    // Upsert ban (update if exists, insert if not)
    const { error } = await supabase
      .from('user_bans')
      .upsert({
        user_id: userId,
        ban_type: banType,
        reason,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
    
    if (error) {
      console.error('Error applying ban:', error)
    } else {
      console.log(`🔨 Ban applied: ${banType} for user ${userId.substring(0, 8)}...`)
    }
  } catch (error) {
    console.error('Error in applyBan:', error)
  }
}

/**
 * Check if user is currently banned (quick check)
 */
export async function isUserBanned(userId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    
    const { data } = await supabase
      .from('user_bans')
      .select('id')
      .eq('user_id', userId)
      .or('expires_at.is.null,expires_at.gt.now()')
      .single()
    
    return !!data
  } catch (error) {
    console.error('Error checking ban status:', error)
    return false
  }
}

/**
 * Get user's violation history (for admin dashboard)
 */
export async function getUserViolationHistory(userId: string, limit = 50) {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('moderation_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching violation history:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getUserViolationHistory:', error)
    return []
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format cooldown duration for user-friendly display
 */
function formatCooldown(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`
}

/**
 * Get violation severity level (for analytics)
 */
export function getViolationSeverity(violationType: ViolationType): 'low' | 'medium' | 'high' {
  switch (violationType) {
    case 'nsfw_image':
    case 'gore':
    case 'hate':
      return 'high'
    case 'violence':
    case 'sensitive_prompt':
      return 'medium'
    case 'user_report':
      return 'low'
    default:
      return 'medium'
  }
}
