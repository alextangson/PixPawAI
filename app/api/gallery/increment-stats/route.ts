/**
 * Gallery Stats Increment API
 * POST /api/gallery/increment-stats
 * Increments view or like count for public gallery images
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { generation_id, action } = body;

    // Validate input
    if (!generation_id) {
      return NextResponse.json(
        { error: 'Missing generation_id' },
        { status: 400 }
      );
    }

    if (!action || !['view', 'like'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "view" or "like"' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient();

    let newCount: number | null = null;

    if (action === 'view') {
      // Increment views
      const { data, error } = await adminSupabase
        .rpc('increment_views', { generation_uuid: generation_id });

      if (error) {
        console.error('Failed to increment views:', error);
        return NextResponse.json(
          { error: 'Failed to increment views', details: error.message },
          { status: 500 }
        );
      }

      newCount = data;
      console.log('✅ View count incremented for:', generation_id, 'New count:', newCount);
    } else if (action === 'like') {
      // Increment likes
      const { data, error } = await adminSupabase
        .rpc('increment_likes', { generation_uuid: generation_id });

      if (error) {
        console.error('Failed to increment likes:', error);
        return NextResponse.json(
          { error: 'Failed to increment likes', details: error.message },
          { status: 500 }
        );
      }

      newCount = data;
      console.log('✅ Like count incremented for:', generation_id, 'New count:', newCount);
    }

    return NextResponse.json({
      success: true,
      action,
      generation_id,
      new_count: newCount,
    });
  } catch (error: any) {
    console.error('Gallery stats increment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get('generation_id');

    if (!generationId) {
      return NextResponse.json(
        { error: 'Missing generation_id parameter' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const { data: generation, error } = await adminSupabase
      .from('generations')
      .select('views, likes')
      .eq('id', generationId)
      .eq('is_public', true)
      .single();

    if (error || !generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      generation_id: generationId,
      views: generation.views,
      likes: generation.likes,
    });
  } catch (error: any) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
