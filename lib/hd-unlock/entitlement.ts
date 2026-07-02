export interface HdUnlockRecord {
  status: 'pending' | 'completed' | 'failed'
  paypal_order_id: string
  user_id: string | null
}

export interface HdViewer {
  userId: string | null
  tier: string | null
  role: string | null
  isOwner: boolean
}

const PAID_TIERS = ['starter', 'pro', 'master']

/**
 * Single source of truth for who may download a clean (un-watermarked) original.
 * Mirrors the legacy client-side rule (admin / paid-tier owner) and adds
 * per-generation HD unlock purchases (guest via orderId, or the logged-in buyer).
 */
export function isEntitledToHd(
  unlock: HdUnlockRecord | null,
  viewer: HdViewer,
  orderIdParam: string | null
): boolean {
  if (viewer.role === 'admin') return true
  if (viewer.isOwner && viewer.tier !== null && PAID_TIERS.includes(viewer.tier)) return true
  if (unlock && unlock.status === 'completed') {
    if (orderIdParam !== null && orderIdParam === unlock.paypal_order_id) return true
    if (viewer.userId !== null && viewer.userId === unlock.user_id) return true
  }
  return false
}
