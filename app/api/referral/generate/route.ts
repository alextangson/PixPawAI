import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

const MAX_REFERRALS = 50; // Maximum referrals per user

/**
 * POST /api/referral/generate
 * Generate or retrieve user's referral link
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Check if user already has a referral code
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('referral_code, successful_referrals, referral_rewards_earned')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Failed to fetch profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    let referralCode = profile.referral_code;
    let isNewCode = false;

    // 2. If no referral code exists, generate one
    if (!referralCode) {
      // Generate unique code using database function
      const { data: generatedCode, error: generateError } = await adminSupabase
        .rpc('generate_user_referral_code', { user_uuid: user.id });

      if (generateError || !generatedCode) {
        console.error('❌ Failed to generate referral code:', generateError);
        return NextResponse.json(
          { error: 'Failed to generate referral code' },
          { status: 500 }
        );
      }

      referralCode = generatedCode;
      isNewCode = true;

      // 3. Create referral code record in referral_codes table
      const { error: insertCodeError } = await adminSupabase
        .from('referral_codes')
        .insert({
          code: referralCode,
          type: 'user_referral',
          created_by: user.id,
          created_by_type: 'user',
          new_user_reward: 5,
          referrer_reward: 5,
          max_uses: null, // Unlimited uses, but limited by referrer's successful_referrals
          is_active: true,
        });

      if (insertCodeError) {
        console.error('❌ Failed to insert referral code:', insertCodeError);
        return NextResponse.json(
          { error: 'Failed to create referral code' },
          { status: 500 }
        );
      }

      // 4. Update user profile with referral code
      const { error: updateProfileError } = await adminSupabase
        .from('profiles')
        .update({
          referral_code: referralCode,
          referral_created_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateProfileError) {
        console.error('❌ Failed to update profile with referral code:', updateProfileError);
        // Non-critical - code is created, just profile update failed
      }

      console.log('✅ Generated new referral code:', referralCode, 'for user:', user.id);
    }

    // 5. Check if user has reached referral limit
    const hasReachedLimit = profile.successful_referrals >= MAX_REFERRALS;
    const remainingReferrals = Math.max(0, MAX_REFERRALS - profile.successful_referrals);

    // 6. Build referral URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpaw.ai';
    const referralUrl = `${baseUrl}?ref=${referralCode}`;

    return NextResponse.json({
      success: true,
      referralCode,
      referralUrl,
      isNewCode,
      stats: {
        successfulReferrals: profile.successful_referrals,
        maxReferrals: MAX_REFERRALS,
        remainingReferrals,
        totalRewardsEarned: profile.referral_rewards_earned,
        hasReachedLimit,
      },
    });

  } catch (error: any) {
    console.error('❌ Referral generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/referral/generate
 * Get current user's referral info (if exists)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const adminSupabase = createAdminClient();
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('referral_code, successful_referrals, referral_rewards_earned')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    if (!profile.referral_code) {
      return NextResponse.json({
        hasReferralCode: false,
        referralCode: null,
        referralUrl: null,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpaw.ai';
    const referralUrl = `${baseUrl}?ref=${profile.referral_code}`;
    const hasReachedLimit = profile.successful_referrals >= MAX_REFERRALS;
    const remainingReferrals = Math.max(0, MAX_REFERRALS - profile.successful_referrals);

    return NextResponse.json({
      hasReferralCode: true,
      referralCode: profile.referral_code,
      referralUrl,
      stats: {
        successfulReferrals: profile.successful_referrals,
        maxReferrals: MAX_REFERRALS,
        remainingReferrals,
        totalRewardsEarned: profile.referral_rewards_earned,
        hasReachedLimit,
      },
    });

  } catch (error: any) {
    console.error('❌ Referral fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
