/**
 * Gallery Load More API
 * GET /api/gallery/load-more?offset=30&limit=30
 * Loads additional gallery images for infinite scroll
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const petTypeFilter = searchParams.get('petType') || '';
    const searchQuery = searchParams.get('query') || '';

    // Validate parameters
    if (offset < 0 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid offset or limit parameters' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let query = supabase
      .from('generations')
      .select('id, output_url, title, alt_text, style, style_category, prompt, created_at, views, likes, is_public, pet_type')
      .eq('status', 'succeeded')
      .eq('is_public', true)
      .not('output_url', 'is', null);

    // Apply pet type filter if provided
    if (petTypeFilter) {
      const petTypes = petTypeFilter.split(',').map(pt => pt.trim());
      query = query.in('pet_type', petTypes);
    }

    // Apply search query if provided
    if (searchQuery) {
      query = query.or(
        `title.ilike.%${searchQuery}%,alt_text.ilike.%${searchQuery}%,prompt.ilike.%${searchQuery}%,style.ilike.%${searchQuery}%`
      );
    }

    const { data: images, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Failed to load more gallery images:', error);
      return NextResponse.json(
        { error: 'Failed to load images', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        images: images || [],
        offset,
        limit,
        count: images?.length || 0,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error('Gallery load more error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
