import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { generationId, reasons, otherReason, action, style, strength } = await request.json()
    const supabase = createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Insert feedback record
    const { error } = await supabase
      .from('generation_feedback')
      .insert({
        generation_id: generationId,
        user_id: user?.id,
        reasons: reasons,
        other_reason: otherReason || null,
        action_taken: action,
        style: style,
        strength: strength,
        created_at: new Date().toISOString()
      })
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback logging error:', error)
    return NextResponse.json({ error: 'Failed to log feedback' }, { status: 500 })
  }
}
