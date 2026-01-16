/**
 * Delete Generation API Endpoint
 * POST /api/delete-generation
 * Deletes a generation and its associated files from storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user authentication
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request data
    const body = await request.json()
    const { generation_id } = body

    if (!generation_id) {
      return NextResponse.json(
        { error: 'Missing required field: generation_id' },
        { status: 400 }
      )
    }

    console.log('Delete request:', { userId: user.id, generation_id })

    // 3. Fetch the generation to verify ownership
    const { data: generation, error: fetchError } = await supabase
      .from('generations')
      .select('*')
      .eq('id', generation_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !generation) {
      console.error('Generation not found:', fetchError)
      return NextResponse.json(
        { error: 'Generation not found or you do not have permission' },
        { status: 404 }
      )
    }

    // 4. Delete storage files
    const adminSupabase = createAdminClient()
    const filesToDelete: string[] = []

    // Extract file paths from URLs
    if (generation.input_url) {
      const inputPath = generation.input_url.split('/user-uploads/').pop()
      if (inputPath) filesToDelete.push(inputPath)
    }

    if (generation.output_url) {
      const outputPath = generation.output_url.split('/generated-results/').pop()
      if (outputPath) filesToDelete.push(outputPath)
    }

    // Delete from storage
    if (filesToDelete.length > 0) {
      // Delete input image
      if (generation.input_url) {
        const inputPath = generation.input_url.split('/user-uploads/').pop()
        if (inputPath) {
          const { error: inputDeleteError } = await adminSupabase
            .storage
            .from('user-uploads')
            .remove([inputPath])
          
          if (inputDeleteError) {
            console.warn('Failed to delete input file:', inputDeleteError)
          } else {
            console.log('✅ Deleted input file')
          }
        }
      }

      // Delete output image
      if (generation.output_url) {
        const outputPath = generation.output_url.split('/generated-results/').pop()
        if (outputPath) {
          const { error: outputDeleteError } = await adminSupabase
            .storage
            .from('generated-results')
            .remove([outputPath])
          
          if (outputDeleteError) {
            console.warn('Failed to delete output file:', outputDeleteError)
          } else {
            console.log('✅ Deleted output file')
          }
        }
      }

      // Delete share card if exists
      if (generation.share_card_url) {
        const cardPath = generation.share_card_url.split('/shared-cards/').pop()
        if (cardPath) {
          const { error: cardDeleteError } = await adminSupabase
            .storage
            .from('shared-cards')
            .remove([cardPath])
          
          if (cardDeleteError) {
            console.warn('Failed to delete share card:', cardDeleteError)
          } else {
            console.log('✅ Deleted share card')
          }
        }
      }
    }

    // 5. Delete the generation record
    const { error: deleteError } = await adminSupabase
      .from('generations')
      .delete()
      .eq('id', generation_id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Failed to delete generation record:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete generation', details: deleteError.message },
        { status: 500 }
      )
    }

    console.log('✅ Generation deleted successfully:', generation_id)
    console.log('ℹ️  Was rewarded:', generation.is_rewarded)
    console.log('ℹ️  No credits deducted (fair policy)')

    // 6. Return success
    return NextResponse.json({
      success: true,
      message: 'Generation deleted successfully',
      generation_id,
    })

  } catch (error: any) {
    console.error('Delete generation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
