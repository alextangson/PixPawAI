import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

const MAX_REFERRALS = 50;

/**
 * GET /api/referral/stats
 * Get detailed referral statistics for current user
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

    // 1. Get user profile with referral data
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('referral_code, successful_referrals, referral_rewards_earned, referred_by_code, referred_by_user_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Failed to fetch profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // 2. Get referral code details (if user has one)
    let referralCodeData = null;
    if (profile.referral_code) {
      const { data: codeData } = await adminSupabase
        .from('referral_codes')
        .select('*')
        .eq('code', profile.referral_code)
        .single();
      
      referralCodeData = codeData;
    }

    // 3. Get list of successful referrals (users who completed first generation)
    const { data: successfulReferrals, error: referralsError } = await adminSupabase
      .from('referral_claims')
      .select('new_user_email, granted_at, new_user_reward, referrer_reward')
      .eq('referrer_id', user.id)
      .eq('reward_status', 'granted')
      .order('granted_at', { ascending: false })
      .limit(50);

    if (referralsError) {
      console.error('❌ Failed to fetch referrals:', referralsError);
    }

    // 4. Get pending referrals (users who signed up but haven't completed first generation)
    const { data: pendingReferrals, error: pendingError } = await adminSupabase
      .from('referral_claims')
      .select('new_user_email, created_at')
      .eq('referrer_id', user.id)
      .eq('reward_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20);

    if (pendingError) {
      console.error('❌ Failed to fetch pending referrals:', pendingError);
    }

    // 5. Check if user was referred by someone
    let referredBy = null;
    if (profile.referred_by_user_id) {
      const { data: referrerData } = await adminSupabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', profile.referred_by_user_id)
        .single();
      
      if (referrerData) {
        referredBy = {
          email: referrerData.email,
          name: referrerData.full_name,
          code: profile.referred_by_code,
        };
      }
    } else if (profile.referred_by_code) {
      // Beta invite (no referrer user)
      referredBy = {
        email: null,
        name: 'Beta Invite',
        code: profile.referred_by_code,
      };
    }

    // 6. Build response
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpaw.ai';
    const hasReachedLimit = profile.successful_referrals >= MAX_REFERRALS;
    const remainingReferrals = Math.max(0, MAX_REFERRALS - profile.successful_referrals);

    return NextResponse.json({
      success: true,
      referralCode: profile.referral_code,
      referralUrl: profile.referral_code ? `${baseUrl}?ref=${profile.referral_code}` : null,
      stats: {
        successfulReferrals: profile.successful_referrals,
        pendingReferrals: pendingReferrals?.length || 0,
        maxReferrals: MAX_REFERRALS,
        remainingReferrals,
        totalRewardsEarned: profile.referral_rewards_earned,
        hasReachedLimit,
      },
      referralCodeDetails: referralCodeData ? {
        createdAt: referralCodeData.created_at,
        currentUses: referralCodeData.current_uses,
        isActive: referralCodeData.is_active,
      } : null,
      successfulReferralsList: successfulReferrals?.map(r => ({
        email: r.new_user_email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email for privacy
        grantedAt: r.granted_at,
        rewardEarned: r.referrer_reward,
      })) || [],
      pendingReferralsList: pendingReferrals?.map(r => ({
        email: r.new_user_email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        signedUpAt: r.created_at,
      })) || [],
      referredBy,
    });

  } catch (error: any) {
    console.error('❌ Referral stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
