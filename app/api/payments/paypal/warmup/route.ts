/**
 * PayPal Token Warmup API
 * 
 * Purpose: Pre-fetch and cache PayPal access token
 * This speeds up the actual order creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { warmupPayPalToken } from '@/lib/paypal/config';

export async function POST(request: NextRequest) {
  try {
    await warmupPayPalToken();
    return NextResponse.json({ success: true });
  } catch (error) {
    // Don't fail - this is just optimization
    return NextResponse.json({ success: false });
  }
}
