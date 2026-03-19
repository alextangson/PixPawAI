import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.INDEXNOW_API_KEY || '5d6f3058001c4ea8a1db7fc252f417fb';
  return new NextResponse(key, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
