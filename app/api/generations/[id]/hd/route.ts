/**
 * Gated HD download - the ONLY path to a clean-original signed URL.
 *
 * Method: GET /api/generations/[id]/hd?orderId=<paypal order id (guests)>
 * Returns: { downloadUrl } (signed, 60s) or 403.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { isEntitledToHd, HdViewer } from '@/lib/hd-unlock/entitlement'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: generationId } = await params
    const orderIdParam = request.nextUrl.searchParams.get('orderId')

    const admin = createAdminClient()
    const { data: generation } = await admin
      .from('generations')
      .select('id, user_id, metadata, output_storage_path')
      .eq('id', generationId)
      .single()

    if (!generation) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let viewer: HdViewer = { userId: null, tier: null, role: null, isOwner: false }
    if (user) {
      const { data: profile } = await admin
        .from('profiles')
        .select('tier, role')
        .eq('id', user.id)
        .single()
      viewer = {
        userId: user.id,
        tier: profile?.tier ?? null,
        role: profile?.role ?? null,
        isOwner: generation.user_id === user.id,
      }
    }

    // Narrow to the single relevant row; isEntitledToHd re-verifies the pairing
    // (keeps the decision unit-testable).
    let unlockQuery = admin
      .from('hd_unlocks')
      .select('status, paypal_order_id, user_id')
      .eq('generation_id', generationId)
      .eq('status', 'completed')
    if (orderIdParam) {
      unlockQuery = unlockQuery.eq('paypal_order_id', orderIdParam)
    } else if (user) {
      unlockQuery = unlockQuery.eq('user_id', user.id)
    }
    const { data: unlocks } = await unlockQuery.limit(1)
    const unlock = unlocks?.[0] ?? null

    if (!isEntitledToHd(unlock, viewer, orderIdParam)) {
      return NextResponse.json(
        { error: 'HD download not unlocked for this portrait' },
        { status: 403 }
      )
    }

    // New generations: clean original in the private bucket.
    // Legacy generations: fall back to the public-bucket original, then to the preview.
    // Oldest rows with neither field resolve to the WebP preview — accepted per plan; near-zero cohort.
    const metadata = generation.metadata as Record<string, any> | null
    const bucket = metadata?.originalBucket ?? 'generated-results'
    const filePath = metadata?.originalImagePath ?? generation.output_storage_path
    if (!filePath) {
      return NextResponse.json({ error: 'Original file not available for this generation' }, { status: 404 })
    }
    const { data: signed, error: signError } = await admin.storage
      .from(bucket)
      .createSignedUrl(filePath, 60)

    if (signError || !signed?.signedUrl) {
      console.error('[HD Download] Failed to sign URL:', signError)
      return NextResponse.json({ error: 'Failed to create download link' }, { status: 500 })
    }

    return NextResponse.json({ downloadUrl: signed.signedUrl })
  } catch (error: any) {
    console.error('[HD Download] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
