const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com';
const INDEXNOW_KEY = process.env.INDEXNOW_API_KEY || '';

/**
 * Submit URLs to IndexNow for faster Bing/Yandex indexing.
 * Silently skips if INDEXNOW_API_KEY is not configured.
 */
export async function submitToIndexNow(urls: string[]): Promise<{ success: boolean; submitted: number }> {
  if (!INDEXNOW_KEY || urls.length === 0) {
    return { success: false, submitted: 0 };
  }

  const host = new URL(SITE_URL).host;

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 10000),
      }),
    });

    if (response.ok || response.status === 202) {
      return { success: true, submitted: urls.length };
    }

    console.error('[IndexNow] Submission failed:', response.status, await response.text());
    return { success: false, submitted: 0 };
  } catch (error) {
    console.error('[IndexNow] Network error:', error);
    return { success: false, submitted: 0 };
  }
}
