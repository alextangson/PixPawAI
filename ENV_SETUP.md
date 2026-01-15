# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
# Get these from your Supabase project dashboard: https://app.supabase.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Service Role Key (NEVER expose to client - only for server-side API routes)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Provider (Replicate)
REPLICATE_API_KEY=your_replicate_api_key

# Payment Provider (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Application URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## How to Get Supabase Keys

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

## Security Notes

- ✅ `NEXT_PUBLIC_*` variables are safe to expose to the browser
- ❌ `SUPABASE_SERVICE_ROLE_KEY` must NEVER be used on the client side
- ❌ Never commit `.env.local` to git (it's already in .gitignore)
