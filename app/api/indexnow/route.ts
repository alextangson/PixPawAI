import { NextResponse } from 'next/server';
import { submitToIndexNow } from '@/lib/seo/indexnow';

const ADMIN_SECRET = process.env.ADMIN_API_SECRET || '';

/**
 * POST /api/indexnow
 * Protected endpoint to submit URLs to IndexNow.
 * Body: { urls: string[] }
 * Header: Authorization: Bearer <ADMIN_API_SECRET>
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { urls } = body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'urls must be a non-empty array' }, { status: 400 });
    }

    const validUrls = urls.filter(
      (u: unknown) => typeof u === 'string' && u.startsWith('https://')
    );

    if (validUrls.length === 0) {
      return NextResponse.json({ error: 'No valid https URLs provided' }, { status: 400 });
    }

    const result = await submitToIndexNow(validUrls);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[IndexNow API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
