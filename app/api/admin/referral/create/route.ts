import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/referral/create
 * Admin-only: Create beta invite codes
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

    // 1. Check if user is admin
    const adminSupabase = createAdminClient();
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to verify admin status' },
        { status: 500 }
      );
    }

    // Simple admin check (you can enhance this with a dedicated admin role field)
    // For now, assuming admins have 'pro' tier or you can add an 'is_admin' field
    const isAdmin = profile.tier === 'pro'; // TODO: Replace with proper admin role check
    
    if (!isAdmin) {
      console.warn('⚠️ Non-admin user attempted to create referral code:', user.id);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // 2. Parse request body
    const {
      code,
      type = 'beta_invite',
      newUserReward,
      maxUses = null,
      expiresAt = null,
      metadata = {},
    } = await request.json();

    // 3. Validate input
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request - code is required' },
        { status: 400 }
      );
    }

    if (!newUserReward || typeof newUserReward !== 'number' || newUserReward <= 0) {
      return NextResponse.json(
        { error: 'Invalid request - newUserReward must be a positive number' },
        { status: 400 }
      );
    }

    if (type !== 'beta_invite' && type !== 'user_referral') {
      return NextResponse.json(
        { error: 'Invalid type - must be beta_invite or user_referral' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase().trim();

    // 4. Check if code already exists
    const { data: existingCode } = await adminSupabase
      .from('referral_codes')
      .select('code')
      .eq('code', normalizedCode)
      .single();

    if (existingCode) {
      return NextResponse.json(
        { error: 'Code already exists - please choose a different code' },
        { status: 409 }
      );
    }

    // 5. Create referral code
    const { data: newCode, error: insertError } = await adminSupabase
      .from('referral_codes')
      .insert({
        code: normalizedCode,
        type,
        created_by: user.id,
        created_by_type: 'admin',
        new_user_reward: newUserReward,
        referrer_reward: 0, // Beta invites don't reward the admin
        max_uses: maxUses,
        expires_at: expiresAt,
        is_active: true,
        metadata,
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create referral code:', insertError);
      return NextResponse.json(
        { error: 'Failed to create referral code', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('✅ Admin created new referral code:', normalizedCode, 'by user:', user.id);

    // 6. Build referral URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpaw.ai';
    const referralUrl = `${baseUrl}?invite=${normalizedCode}`;

    return NextResponse.json({
      success: true,
      message: 'Referral code created successfully',
      code: newCode.code,
      referralUrl,
      details: {
        type: newCode.type,
        newUserReward: newCode.new_user_reward,
        maxUses: newCode.max_uses,
        expiresAt: newCode.expires_at,
        createdAt: newCode.created_at,
      },
    });

  } catch (error: any) {
    console.error('❌ Admin referral creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/referral/create
 * Admin-only: List all referral codes
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

    // Check admin status
    const adminSupabase = createAdminClient();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.tier === 'pro'; // TODO: Replace with proper admin check
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all referral codes
    const { data: codes, error: fetchError } = await adminSupabase
      .from('referral_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Failed to fetch referral codes:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch referral codes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      codes: codes.map(code => ({
        id: code.id,
        code: code.code,
        type: code.type,
        createdByType: code.created_by_type,
        newUserReward: code.new_user_reward,
        referrerReward: code.referrer_reward,
        currentUses: code.current_uses,
        maxUses: code.max_uses,
        isActive: code.is_active,
        expiresAt: code.expires_at,
        deactivatedAt: code.deactivated_at,
        createdAt: code.created_at,
      })),
    });

  } catch (error: any) {
    console.error('❌ Admin referral list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
