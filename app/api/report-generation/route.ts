/**
 * Report Generation API
 * 
 * POST /api/report-generation
 * Allows users to report inappropriate content in the public gallery
 * 
 * Features:
 * - Authenticated users only
 * - Prevents duplicate reports (same user + generation)
 * - Rate limiting (max 10 reports per hour per user)
 * - Logs to moderation system
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required to report content' },
        { status: 401 }
      )
    }
    
    // 2. Parse request body
    const body = await request.json()
    const { generationId, reason } = body
    
    if (!generationId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: generationId and reason' },
        { status: 400 }
      )
    }
    
    // Validate reason length
    if (reason.length < 10 || reason.length > 500) {
      return NextResponse.json(
        { error: 'Reason must be between 10 and 500 characters' },
        { status: 400 }
      )
    }
    
    // 3. Check if generation exists
    const { data: generation, error: genError } = await supabase
      .from('generations')
      .select('id, user_id, is_public')
      .eq('id', generationId)
      .single()
    
    if (genError || !generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      )
    }
    
    // 4. Prevent self-reporting
    if (generation.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot report your own content' },
        { status: 400 }
      )
    }
    
    // 5. Check for duplicate report (same user + generation)
    const { data: existingReport } = await supabase
      .from('user_reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('generation_id', generationId)
      .single()
    
    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this content' },
        { status: 409 } // Conflict
      )
    }
    
    // 6. Rate limiting: Check reports in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentReports, error: countError } = await supabase
      .from('user_reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_id', user.id)
      .gte('created_at', oneHourAgo)
    
    if (countError) {
      console.error('Error checking report rate limit:', countError)
    } else if (recentReports && recentReports >= 10) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'You can only submit 10 reports per hour. Please try again later.'
        },
        { status: 429 } // Too Many Requests
      )
    }
    
    // 7. Create report
    const { data: report, error: insertError } = await supabase
      .from('user_reports')
      .insert({
        reporter_id: user.id,
        generation_id: generationId,
        reason: reason.trim(),
        status: 'pending'
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error creating report:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit report. Please try again.' },
        { status: 500 }
      )
    }
    
    // 8. Log to moderation system (for analytics)
    try {
      const { logViolation } = await import('@/lib/moderation/violation-tracker')
      await logViolation({
        userId: generation.user_id, // Log against content creator, not reporter
        violationType: 'user_report',
        metadata: {
          reportId: report.id,
          reporterId: user.id,
          generationId,
          reason: reason.substring(0, 100) // Truncate for storage
        }
      })
    } catch (logError) {
      console.error('Error logging violation:', logError)
      // Don't fail the request if logging fails
    }
    
    console.log(`📢 Report submitted: Generation ${generationId} by user ${user.id.substring(0, 8)}...`)
    
    return NextResponse.json({
      success: true,
      message: 'Thank you for your report. Our team will review it shortly.',
      reportId: report.id
    })
  } catch (error) {
    console.error('Report generation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/report-generation?generationId=xxx
 * Check if current user has already reported a generation
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ hasReported: false })
    }
    
    const { searchParams } = new URL(request.url)
    const generationId = searchParams.get('generationId')
    
    if (!generationId) {
      return NextResponse.json(
        { error: 'Missing generationId parameter' },
        { status: 400 }
      )
    }
    
    const { data: report } = await supabase
      .from('user_reports')
      .select('id, status')
      .eq('reporter_id', user.id)
      .eq('generation_id', generationId)
      .single()
    
    return NextResponse.json({
      hasReported: !!report,
      status: report?.status || null
    })
  } catch (error) {
    console.error('Check report status error:', error)
    return NextResponse.json({ hasReported: false })
  }
}
