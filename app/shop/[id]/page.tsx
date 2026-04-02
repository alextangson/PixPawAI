import { redirect } from 'next/navigation';

/**
 * Legacy route: /shop/[id] used to show a "coming soon" page for a generation.
 * Now redirects to the main shop page. The new product-based route is at /[lang]/shop/[productId].
 */
export default async function LegacyShopPage({ params }: { params: Promise<{ id: string }> }) {
  await params;
  redirect('/en/shop');
}
