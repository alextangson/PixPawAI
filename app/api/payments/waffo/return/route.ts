export function GET() {
  return new Response(
    '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PixPaw checkout</title><body style="font-family:system-ui;max-width:38rem;margin:5rem auto;padding:1rem"><h1>Thank you!</h1><p>Return to your PixPaw tab to check your payment and receive your purchase. Confirmation can take a moment.</p></body></html>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'", 'Referrer-Policy': 'no-referrer' } },
  )
}
