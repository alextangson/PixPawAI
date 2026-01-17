import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { generationId } = await request.json()
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if already refunded
    const { data: generation } = await supabase
      .from('generations')
      .select('is_refunded')
      .eq('id', generationId)
      .single()
    
    if (generation?.is_refunded) {
      return NextResponse.json({ 
        error: 'Credit already refunded for this generation' 
      }, { status: 400 })
    }
    
    // Refund 1 credit
    const { error: updateError } = await supabase.rpc('increment_credits', {
      user_id: user.id,
      amount: 1
    })
    
    if (updateError) throw updateError
    
    // Mark as refunded
    await supabase
      .from('generations')
      .update({
        is_refunded: true
      })
      .eq('id', generationId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Credit refund error:', error)
    return NextResponse.json({ error: 'Failed to refund credit' }, { status: 500 })
  }
}
