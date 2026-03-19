import { NextResponse } from 'next/server';

const INDEXNOW_KEY = process.env.INDEXNOW_API_KEY || '';

/**
 * GET /api/indexnow/verify?key=<key>
 * Serves the IndexNow key verification.
 * The keyLocation in IndexNow submissions should point here.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (!INDEXNOW_KEY || key !== INDEXNOW_KEY) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(INDEXNOW_KEY, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
