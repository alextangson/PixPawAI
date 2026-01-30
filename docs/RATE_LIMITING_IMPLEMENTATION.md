# 服务端 Rate Limiting 实施指南

## 📋 概述

本文档说明如何为 PixPaw AI 添加服务端速率限制，防止 API 滥用和账单爆炸。

## 🎯 目标

- 防止单个 IP 短时间内发起大量请求
- 保护关键 API 端点（上传、生成、支付）
- 在不影响正常用户体验的前提下阻止机器人攻击

## 🛠️ 推荐方案：Vercel Edge Middleware + Upstash Redis

### 为什么选择这个方案？

1. **Vercel Edge Middleware** - 在请求到达 API 之前拦截
2. **Upstash Redis** - 免费套餐足够 MVP 使用（10,000 请求/天）
3. **零延迟** - Edge 函数在全球边缘节点运行
4. **简单集成** - 无需额外服务器

---

## 📦 实施步骤

### 步骤 1: 安装依赖

```bash
npm install @upstash/redis @upstash/ratelimit
```

### 步骤 2: 注册 Upstash 账号

1. 访问 https://upstash.com/
2. 创建免费 Redis 数据库
3. 获取 `UPSTASH_REDIS_REST_URL` 和 `UPSTASH_REDIS_REST_TOKEN`
4. 添加到 `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### 步骤 3: 创建 Rate Limiter 工具

创建文件 `lib/rate-limit.ts`:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// 创建 Redis 客户端
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 不同端点的速率限制配置
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

// 检查速率限制的辅助函数
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
```

### 步骤 4: 在 API 路由中使用

示例：保护上传端点 `app/api/upload-temp/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, getClientIp, checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // 1. 获取客户端 IP
  const clientIp = getClientIp(request);
  
  // 2. 检查速率限制
  const rateLimit = await checkRateLimit(rateLimiters.upload, clientIp);
  
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many uploads. Please try again later.',
        retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.reset.toString(),
          'Retry-After': Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  
  // 3. 正常处理请求
  // ... 你的上传逻辑
  
  // 4. 在响应头中返回速率限制信息
  return NextResponse.json(
    { success: true },
    {
      headers: {
        'X-RateLimit-Limit': rateLimit.limit.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.reset.toString(),
      },
    }
  );
}
```

### 步骤 5: 更新 Middleware（可选）

如果想在所有 API 路由前统一拦截，可以修改 `middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiters, getClientIp, checkRateLimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 对 API 路由应用速率限制
  if (pathname.startsWith('/api/')) {
    const clientIp = getClientIp(request);
    
    // 根据路径选择不同的限制器
    let limiter = rateLimiters.api;
    
    if (pathname.includes('/upload')) {
      limiter = rateLimiters.upload;
    } else if (pathname.includes('/generate')) {
      limiter = rateLimiters.generate;
    } else if (pathname.includes('/payment')) {
      limiter = rateLimiters.payment;
    }
    
    const rateLimit = await checkRateLimit(limiter, clientIp);
    
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please slow down.',
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          },
        }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## 🎨 前端处理

在客户端处理 429 错误：

```typescript
// components/upload-modal-wizard.tsx
async function handleUpload() {
  try {
    const response = await fetch('/api/upload-temp', {
      method: 'POST',
      body: formData,
    });
    
    if (response.status === 429) {
      const data = await response.json();
      const retryAfter = data.retryAfter || 60;
      
      toast.error(
        `Too many uploads! Please wait ${retryAfter} seconds.`,
        { duration: 5000 }
      );
      
      // 显示倒计时
      setUploadCooldown(retryAfter);
      return;
    }
    
    // 正常处理
    const data = await response.json();
    // ...
  } catch (error) {
    console.error('Upload error:', error);
  }
}
```

---

## 📊 速率限制配置建议

| 端点 | 限制 | 时间窗口 | 理由 |
|------|------|----------|------|
| `/api/upload-temp` | 5 次 | 1 分钟 | 防止存储滥用 |
| `/api/generate` | 3 次 | 1 分钟 | 保护 AI API 成本 |
| `/api/check-quality` | 10 次 | 1 分钟 | 允许多次尝试 |
| `/api/payments/*` | 10 次 | 1 小时 | 防止支付欺诈 |
| `/api/*` (其他) | 30 次 | 1 分钟 | 通用保护 |

---

## 🧪 测试

### 本地测试

```bash
# 快速发送多个请求
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/upload-temp \
    -H "Content-Type: application/json" \
    -d '{"test": true}'
  echo ""
done
```

### 预期结果

- 前 5 次：200 OK
- 第 6 次开始：429 Too Many Requests

---

## 💰 成本估算

### Upstash 免费套餐

- **10,000 命令/天** - 足够 MVP 使用
- **256 MB 存储** - 速率限制数据很小
- **无需信用卡**

### 何时升级？

- 日活用户 > 500
- 每日请求 > 8,000
- 升级到 Pro 套餐：$10/月（1M 命令）

---

## 🔐 安全注意事项

1. **不要在客户端暴露 Redis 凭据**
   - 只在服务端使用 `UPSTASH_REDIS_REST_URL`
   - 不要添加 `NEXT_PUBLIC_` 前缀

2. **IP 欺骗防护**
   - Vercel 自动处理 `x-forwarded-for` 头
   - 信任 Vercel 提供的 IP 地址

3. **白名单机制**（可选）
   ```typescript
   const WHITELISTED_IPS = ['your-office-ip'];
   
   if (WHITELISTED_IPS.includes(clientIp)) {
     return NextResponse.next(); // 跳过限制
   }
   ```

---

## 📈 监控

### Upstash 控制台

- 查看实时请求数
- 分析速率限制触发情况
- 识别攻击模式

### 添加日志

```typescript
if (!rateLimit.success) {
  console.warn(`[Rate Limit] IP ${clientIp} exceeded limit on ${pathname}`);
  
  // 可选：记录到数据库用于分析
  await supabase.from('rate_limit_violations').insert({
    ip: clientIp,
    endpoint: pathname,
    timestamp: new Date().toISOString(),
  });
}
```

---

## 🚀 部署清单

- [ ] 注册 Upstash 账号
- [ ] 创建 Redis 数据库
- [ ] 添加环境变量到 Vercel
- [ ] 安装 npm 依赖
- [ ] 创建 `lib/rate-limit.ts`
- [ ] 更新关键 API 路由
- [ ] 测试速率限制
- [ ] 更新前端错误处理
- [ ] 监控 Upstash 使用量

---

## 🆘 故障排除

### 问题：所有请求都被限制

**原因：** IP 地址获取错误

**解决：**
```typescript
console.log('Client IP:', getClientIp(request));
// 确保返回真实 IP，而不是 'unknown'
```

### 问题：限制不生效

**原因：** Redis 连接失败

**解决：**
```typescript
// 测试 Redis 连接
const redis = new Redis({ url, token });
const result = await redis.ping();
console.log('Redis ping:', result); // 应该返回 'PONG'
```

---

## 📚 参考资料

- [Upstash 文档](https://upstash.com/docs/redis/overall/getstarted)
- [Vercel Edge Middleware](https://vercel.com/docs/functions/edge-middleware)
- [@upstash/ratelimit](https://github.com/upstash/ratelimit)

---

**预计实施时间：** 1-2 小时  
**优先级：** 🔴 高（在正式上线前完成）  
**维护成本：** 极低（免费套餐 + 自动扩展）
