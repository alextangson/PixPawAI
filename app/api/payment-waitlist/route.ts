import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, tier, price } = await request.json();

    // 验证必填字段
    if (!email || !tier || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 验证tier
    if (!['starter', 'pro', 'master'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 获取当前用户ID（如果已登录）
    const { data: { user } } = await supabase.auth.getUser();

    // 获取IP和User-Agent
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const user_agent = request.headers.get('user-agent') || 'unknown';

    // 插入到数据库（使用UPSERT来处理重复提交）
    const { data, error } = await supabase
      .from('payment_waitlist')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          tier,
          price,
          user_id: user?.id || null,
          ip_address,
          user_agent,
        },
        {
          onConflict: 'email,tier',
          ignoreDuplicates: false, // 如果重复，更新updated_at
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error inserting to waitlist:', error);
      return NextResponse.json(
        { error: 'Failed to join waitlist' },
        { status: 500 }
      );
    }

    // 可选：发送确认邮件（TODO: 集成邮件服务）
    // await sendWaitlistConfirmationEmail(email, tier);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist',
      data: {
        id: data.id,
        email: data.email,
        tier: data.tier,
      },
    });

  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 获取等待列表统计（仅供管理员使用）
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 验证用户权限（这里简化处理，实际应该检查是否为管理员）
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取统计数据
    const { data: stats, error } = await supabase
      .from('payment_waitlist')
      .select('tier, email')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 计算统计
    const tierCounts = stats?.reduce((acc: any, item) => {
      acc[item.tier] = (acc[item.tier] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      total: stats?.length || 0,
      by_tier: tierCounts,
      recent: stats?.slice(0, 10), // 最近10条
    });

  } catch (error) {
    console.error('Waitlist stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
