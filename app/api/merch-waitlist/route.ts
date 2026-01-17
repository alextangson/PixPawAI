/**
 * Merch Waitlist API Endpoint
 * POST /api/merch-waitlist
 * Stores email addresses from users interested in PixPaw merchandise
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, generation_id, pet_name } = body

    // Validate email
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Use admin client to insert without authentication
    const adminSupabase = createAdminClient()

    const { data, error } = await adminSupabase
      .from('merch_waitlist')
      .insert({
        email: email.trim().toLowerCase(),
        generation_id: generation_id || null,
        pet_name: pet_name || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to add to waitlist:', error)
      return NextResponse.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      )
    }

    console.log('✅ Added to merch waitlist:', email)

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist!',
      data,
    })
  } catch (error: any) {
    console.error('Merch waitlist API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
