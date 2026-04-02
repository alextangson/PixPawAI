import { PRINTFUL_PRODUCTS } from '@/lib/printful/config';

export interface ShopProduct {
  name: string;
  description: string;
  priceLabel: string;
  priceValue: number;
  image: string;
  productId: string;
  featured: boolean;
}

/** Derive SEO product list from Printful config (single source of truth). */
export const SHOP_PRODUCTS: ShopProduct[] = Object.values(PRINTFUL_PRODUCTS).map(
  (p) => {
    const minPrice = Math.min(...p.variants.map((v) => v.price));
    const dollars = Math.round(minPrice / 100);
    return {
      name: p.name,
      description: p.description,
      priceLabel: `from $${dollars}`,
      priceValue: dollars,
      image: p.imageUrl,
      productId: p.productId,
      featured: p.featured,
    };
  }
);
