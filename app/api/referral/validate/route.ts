import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/referral/validate
 * Validate a referral code (beta invite or user referral)
 * Does NOT create a claim, just checks validity
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request - code is required' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch referral code details
    const { data: referralCode, error: fetchError } = await adminSupabase
      .from('referral_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (fetchError || !referralCode) {
      return NextResponse.json({
        valid: false,
        reason: 'Code not found',
      });
    }

    // 2. Check if code is active
    if (!referralCode.is_active) {
      return NextResponse.json({
        valid: false,
        reason: 'Code is no longer active',
        deactivatedAt: referralCode.deactivated_at,
        deactivationReason: referralCode.deactivation_reason,
      });
    }

    // 3. Check if code has expired
    if (referralCode.expires_at) {
      const expiryDate = new Date(referralCode.expires_at);
      if (expiryDate < new Date()) {
        return NextResponse.json({
          valid: false,
          reason: 'Code has expired',
          expiredAt: referralCode.expires_at,
        });
      }
    }

    // 4. Check if code has reached max uses
    if (referralCode.max_uses !== null && referralCode.current_uses >= referralCode.max_uses) {
      return NextResponse.json({
        valid: false,
        reason: 'Code has reached maximum usage limit',
        maxUses: referralCode.max_uses,
        currentUses: referralCode.current_uses,
      });
    }

    // 5. For user referrals, check if referrer has reached their limit
    if (referralCode.type === 'user_referral' && referralCode.created_by) {
      const { data: referrerProfile } = await adminSupabase
        .from('profiles')
        .select('successful_referrals')
        .eq('id', referralCode.created_by)
        .single();

      if (referrerProfile && referrerProfile.successful_referrals >= 50) {
        return NextResponse.json({
          valid: false,
          reason: 'Referrer has reached maximum referral limit',
        });
      }
    }

    // ✅ Code is valid
    return NextResponse.json({
      valid: true,
      code: referralCode.code,
      type: referralCode.type,
      newUserReward: referralCode.new_user_reward,
      referrerReward: referralCode.referrer_reward,
      usesRemaining: referralCode.max_uses 
        ? referralCode.max_uses - referralCode.current_uses 
        : null, // null = unlimited
      expiresAt: referralCode.expires_at,
    });

  } catch (error: any) {
    console.error('❌ Referral validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
