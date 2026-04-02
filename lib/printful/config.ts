/**
 * Printful API Configuration
 * https://developers.printful.com/docs/
 *
 * Env vars required:
 *   PRINTFUL_API_KEY        — store API key (Bearer token)
 *   PRINTFUL_WEBHOOK_SECRET — optional HMAC secret for webhook verification
 */

export const PRINTFUL_API_BASE = 'https://api.printful.com';
export const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY!;
export const PRINTFUL_WEBHOOK_SECRET = process.env.PRINTFUL_WEBHOOK_SECRET;

// ---------------------------------------------------------------------------
// Product catalog — maps our internal productId to Printful variant IDs.
// To find variant IDs: GET /products/{id} from Printful API or Printful dashboard.
// Each entry lists the variants you want to offer (size/color combos).
// ---------------------------------------------------------------------------

export interface PrintfulVariant {
  variantId: number;   // Printful variant_id
  label: string;       // Display label shown to user
  price: number;       // USD retail price (cents)
}

export interface PrintfulProduct {
  productId: string;   // Our internal ID
  name: string;
  printfulProductId: number; // Printful catalog product ID
  variants: PrintfulVariant[];
  /** Which area of the product the pet portrait is placed on */
  placementKey: string;
  /** Short description for product cards */
  description: string;
  /** Display image URL for the shop page */
  imageUrl: string;
  /** Whether to show as featured/popular */
  featured: boolean;
}

export const PRINTFUL_PRODUCTS: Record<string, PrintfulProduct> = {
  pillow: {
    productId: 'pillow',
    name: 'Custom Pillow',
    printfulProductId: 48,
    placementKey: 'default',
    description: 'Cozy plush cushion with your pet portrait',
    imageUrl: 'https://images.unsplash.com/photo-1560790671-bd42f6076e85?w=600&h=600&fit=crop',
    featured: true,
    variants: [
      { variantId: 5254819432, label: '18×18"', price: 4499 },
      { variantId: 5254819436, label: '22×22"', price: 4999 },
    ],
  },
  'canvas-print': {
    productId: 'canvas-print',
    name: 'Canvas Print',
    printfulProductId: 2,
    placementKey: 'front',
    description: 'Premium framed wall art for your home',
    imageUrl: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=600&h=600&fit=crop',
    featured: true,
    variants: [
      { variantId: 5254819144, label: '11×14"', price: 4999 },
      { variantId: 5254819146, label: '12×24"', price: 5999 },
    ],
  },
  't-shirt': {
    productId: 't-shirt',
    name: 'Custom T-Shirt',
    printfulProductId: 71,
    placementKey: 'front',
    description: 'Soft cotton tee in all sizes',
    imageUrl: 'https://images.unsplash.com/photo-1576566527230-e99e0b760156?w=600&h=600&fit=crop',
    featured: false,
    variants: [
      { variantId: 5254819464, label: 'White S', price: 2999 },
      { variantId: 5254819468, label: 'White M', price: 2999 },
      { variantId: 5254819498, label: 'White L', price: 2999 },
      { variantId: 5254819500, label: 'White XL', price: 2999 },
    ],
  },
  'phone-case': {
    productId: 'phone-case',
    name: 'Phone Case',
    printfulProductId: 266,
    placementKey: 'case',
    description: 'Durable protective case with your pet art',
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-003444b62e9a?w=600&h=600&fit=crop',
    featured: false,
    variants: [
      { variantId: 5254819508, label: 'iPhone 11 Pro Max', price: 3499 },
      { variantId: 5254819509, label: 'iPhone 12 Pro Max', price: 3499 },
      { variantId: 5254819510, label: 'iPhone 13', price: 3499 },
    ],
  },
  mug: {
    productId: 'mug',
    name: 'Ceramic Mug',
    printfulProductId: 19,
    placementKey: 'front',
    description: '11oz coffee mug with your pet portrait',
    imageUrl: 'https://images.unsplash.com/photo-1578159311134-f099bbd66868?w=600&h=600&fit=crop',
    featured: false,
    variants: [
      { variantId: 5254819366, label: 'White 11oz', price: 1999 },
    ],
  },
};
