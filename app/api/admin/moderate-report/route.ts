/**
 * Admin Moderate Report API
 * 
 * POST /api/admin/moderate-report
 * Allows admins to take action on user reports
 * 
 * Actions:
 * - dismiss: Mark report as reviewed, no action needed
 * - delete: Remove content from gallery
 * - warn: Issue warning to content owner
 * - ban: Permanently ban content owner
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify admin authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin only' },
        { status: 403 }
      )
    }
    
    // 2. Parse request body
    const body = await request.json()
    const { reportId, action, adminNotes, generationId, contentOwnerId } = body
    
    if (!reportId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: reportId and action' },
        { status: 400 }
      )
    }
    
    const validActions = ['dismiss', 'delete', 'warn', 'ban']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: dismiss, delete, warn, or ban' },
        { status: 400 }
      )
    }
    
    const adminSupabase = createAdminClient()
    
    // 3. Update report status
    const { error: updateError } = await adminSupabase
      .from('user_reports')
      .update({
        status: action === 'dismiss' ? 'dismissed' : 'action_taken',
        admin_notes: adminNotes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId)
    
    if (updateError) {
      console.error('Error updating report:', updateError)
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      )
    }
    
    // 4. Take action based on type
    switch (action) {
      case 'dismiss':
        // No further action needed
        console.log(`✅ Report ${reportId} dismissed by admin ${user.id}`)
        break
      
      case 'delete':
        // Remove content from public gallery
        if (generationId) {
          const { error: deleteError } = await adminSupabase
            .from('generations')
            .update({ is_public: false })
            .eq('id', generationId)
          
          if (deleteError) {
            console.error('Error hiding generation:', deleteError)
          } else {
            console.log(`🗑️ Generation ${generationId} removed from gallery`)
          }
        }
        
        // Log violation for content owner
        if (contentOwnerId) {
          const { logViolation } = await import('@/lib/moderation/violation-tracker')
          await logViolation({
            userId: contentOwnerId,
            violationType: 'user_report',
            metadata: {
              reportId,
              action: 'content_deleted',
              adminId: user.id,
              adminNotes
            }
          })
        }
        break
      
      case 'warn':
        // Issue warning to content owner
        if (contentOwnerId) {
          const { logViolation } = await import('@/lib/moderation/violation-tracker')
          await logViolation({
            userId: contentOwnerId,
            violationType: 'user_report',
            metadata: {
              reportId,
              action: 'warning_issued',
              adminId: user.id,
              adminNotes
            }
          })
          console.log(`⚠️ Warning issued to user ${contentOwnerId}`)
        }
        break
      
      case 'ban':
        // Permanently ban user
        if (contentOwnerId) {
          const { error: banError } = await adminSupabase
            .from('user_bans')
            .upsert({
              user_id: contentOwnerId,
              ban_type: 'permanent',
              reason: `Admin ban: ${adminNotes || 'Inappropriate content'}`,
              expires_at: null,
              created_by: user.id
            }, {
              onConflict: 'user_id'
            })
          
          if (banError) {
            console.error('Error banning user:', banError)
          } else {
            console.log(`🔨 User ${contentOwnerId} permanently banned`)
          }
          
          // Also hide all their public content
          await adminSupabase
            .from('generations')
            .update({ is_public: false })
            .eq('user_id', contentOwnerId)
          
          // Log violation
          const { logViolation } = await import('@/lib/moderation/violation-tracker')
          await logViolation({
            userId: contentOwnerId,
            violationType: 'user_report',
            metadata: {
              reportId,
              action: 'permanent_ban',
              adminId: user.id,
              adminNotes
            }
          })
        }
        break
    }
    
    return NextResponse.json({
      success: true,
      message: `Action "${action}" completed successfully`,
      reportId
    })
  } catch (error) {
    console.error('Moderate report API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
