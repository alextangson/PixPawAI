import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 创建 Redis 客户端
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 白名单 IP 列表（不受速率限制）
const WHITELISTED_IPS = [
  // 网络代理
  '38.150.34.13',
  // Mac Mini
  '192.168.1.100',
  // 本地开发环境
  '::1',
  '127.0.0.1',
  'localhost',
];

// 匿名用户（IP 限制）的速率限制配置
export const rateLimiters = {
  // 上传端点：每 IP 每分钟 5 次
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:upload',
  }),

  // 生成端点：每 IP 每分钟 3 次
  generate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 m'),
    analytics: true,
    prefix: 'ratelimit:generate',
  }),

  // 质量检查：每 IP 每分钟 10 次
  qualityCheck: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:quality',
  }),

  // 支付端点：每 IP 每小时 10 次
  payment: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'ratelimit:payment',
  }),

  // 通用 API：每 IP 每分钟 30 次
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),
};

// 登录用户（User ID 限制）的速率限制配置 - 更宽松的限制
export const authenticatedRateLimiters = {
  // 上传端点：每用户每分钟 10 次（是匿名的 2 倍）
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:auth:upload',
  }),

  // 生成端点：每用户每分钟 5 次（是匿名的 1.67 倍）
  generate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:auth:generate',
  }),

  // 质量检查：每用户每分钟 20 次（是匿名的 2 倍）
  qualityCheck: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: 'ratelimit:auth:quality',
  }),

  // 支付端点：每用户每小时 20 次（是匿名的 2 倍）
  payment: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    analytics: true,
    prefix: 'ratelimit:auth:payment',
  }),

  // 通用 API：每用户每分钟 60 次（是匿名的 2 倍）
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: 'ratelimit:auth:api',
  }),
};

// 获取客户端 IP 地址
export function getClientIp(request: Request): string {
  // Vercel 提供的真实 IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

// 检查 IP 是否在白名单中
export function isWhitelistedIp(ip: string): boolean {
  return WHITELISTED_IPS.includes(ip);
}

// 检查速率限制的辅助函数（基础版本）
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const result = await limiter.limit(identifier);
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

// 智能速率限制检查（支持白名单和登录用户）
export async function checkRateLimitSmart(
  request: Request,
  endpoint: 'upload' | 'generate' | 'qualityCheck' | 'payment' | 'api',
  userId?: string | null
): Promise<{ 
  success: boolean; 
  limit: number; 
  remaining: number; 
  reset: number;
  whitelisted?: boolean;
  authenticated?: boolean;
}> {
  // 1. 检查白名单 IP
  const clientIp = getClientIp(request);
  
  if (isWhitelistedIp(clientIp)) {
    console.log(`✅ [Rate Limit] Whitelisted IP: ${clientIp}`);
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: Date.now() + 60000,
      whitelisted: true,
    };
  }
  
  // 2. 如果用户已登录，使用更宽松的限制（基于 User ID）
  if (userId) {
    const limiter = authenticatedRateLimiters[endpoint];
    const result = await limiter.limit(userId);
    
    console.log(`👤 [Rate Limit] Authenticated user ${userId}: ${result.remaining}/${result.limit} remaining`);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      authenticated: true,
    };
  }
  
  // 3. 匿名用户，使用严格的 IP 限制
  const limiter = rateLimiters[endpoint];
  const result = await limiter.limit(clientIp);
  
  console.log(`🌐 [Rate Limit] Anonymous IP ${clientIp}: ${result.remaining}/${result.limit} remaining`);
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    authenticated: false,
  };
}
