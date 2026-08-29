/**
 * On-demand ISR revalidation endpoint
 *
 * Called by WordPress webhook when a post is published/updated.
 * Also supports manual GET requests for debugging.
 *
 * Usage:
 *   POST /api/revalidate
 *   Body: { "slug": "my-article-slug" }   (optional — omit to revalidate all blog pages)
 *   Header: Authorization: Bearer <REVALIDATE_SECRET>
 *
 * Env vars required:
 *   REVALIDATE_SECRET  — shared secret between WordPress and this app
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { submitToIndexNow } from '@/lib/seo/indexnow';

const SECRET = process.env.REVALIDATE_SECRET;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com').replace(/\/+$/, '');

/**
 * Fire-and-forget IndexNow ping. Never allowed to fail the revalidate response —
 * WordPress only cares that the cache was busted — but failures are logged, not
 * swallowed. No-ops silently when INDEXNOW_API_KEY is unset.
 */
function pingIndexNow(urls: string[]): void {
  void submitToIndexNow(urls)
    .then((result) => {
      if (result.success) {
        console.log(`[Revalidate] IndexNow submitted ${result.submitted} URL(s):`, urls.join(', '));
      } else {
        console.warn('[Revalidate] IndexNow submission skipped or failed for:', urls.join(', '));
      }
    })
    .catch((error) => {
      console.error('[Revalidate] IndexNow ping threw:', error);
    });
}

function isAuthorized(req: NextRequest): boolean {
  if (!SECRET) {
    // No secret configured — reject all requests to avoid open revalidation
    console.warn('[Revalidate] REVALIDATE_SECRET not set. Rejecting request.');
    return false;
  }
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  // Also support ?secret= query param for WordPress webhook compatibility
  const querySecret = req.nextUrl.searchParams.get('secret') ?? '';
  return token === SECRET || querySecret === SECRET;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let slug: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    slug = body?.slug || body?.post?.slug;
  } catch {
    // body parse failure is fine — we'll do a full revalidate
  }

  if (slug) {
    // Revalidate specific article
    revalidatePath(`/en/blog/${slug}`);
    revalidatePath(`/blog/${slug}`);
    console.log(`[Revalidate] Revalidated blog post: ${slug}`);
    pingIndexNow([`${SITE_URL}/en/blog/${slug}/`, `${SITE_URL}/en/blog/`]);
  } else {
    // Revalidate all blog-related pages
    revalidatePath('/en/blog', 'page');
    revalidatePath('/blog', 'page');
    revalidateTag('blog');
    console.log('[Revalidate] Revalidated all blog pages');
    pingIndexNow([`${SITE_URL}/en/blog/`]);
  }

  // Always revalidate sitemap since blog content changed
  revalidatePath('/sitemap.xml');

  return NextResponse.json({ revalidated: true, slug: slug ?? 'all', timestamp: Date.now() });
}

// GET for manual debugging / health check
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, message: 'Revalidate endpoint is live. Use POST to trigger.' });
}
