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
}

export const PRINTFUL_PRODUCTS: Record<string, PrintfulProduct> = {
  pillow: {
    productId: 'pillow',
    name: 'Custom Pillow',
    printfulProductId: 48, // Printful: All-Over Print Pillow
    placementKey: 'default',
    variants: [
      { variantId: 9312, label: '14×14"', price: 4900 },
      { variantId: 9313, label: '16×16"', price: 5400 },
      { variantId: 9314, label: '18×18"', price: 5900 },
    ],
  },
  'wall-art': {
    productId: 'wall-art',
    name: 'Framed Poster',
    printfulProductId: 2, // Printful: Enhanced Matte Paper Framed Poster
    placementKey: 'front',
    variants: [
      { variantId: 1374, label: '8×10"', price: 3999 },
      { variantId: 1375, label: '12×16"', price: 5999 },
      { variantId: 1376, label: '18×24"', price: 7999 },
    ],
  },
  't-shirt': {
    productId: 't-shirt',
    name: 'Custom T-Shirt',
    printfulProductId: 71, // Printful: Unisex Staple T-Shirt
    placementKey: 'front',
    variants: [
      { variantId: 4012, label: 'S', price: 2900 },
      { variantId: 4013, label: 'M', price: 2900 },
      { variantId: 4014, label: 'L', price: 2900 },
      { variantId: 4015, label: 'XL', price: 2900 },
      { variantId: 4016, label: '2XL', price: 3200 },
    ],
  },
  'phone-case': {
    productId: 'phone-case',
    name: 'Phone Case',
    printfulProductId: 266, // Printful: Snap case for iPhone
    placementKey: 'case',
    variants: [
      { variantId: 10178, label: 'iPhone 15', price: 2400 },
      { variantId: 10179, label: 'iPhone 15 Pro', price: 2400 },
      { variantId: 10180, label: 'iPhone 14', price: 2400 },
      { variantId: 10181, label: 'iPhone 14 Pro', price: 2400 },
    ],
  },
  mug: {
    productId: 'mug',
    name: 'Ceramic Mug',
    printfulProductId: 19, // Printful: White Glossy Mug
    placementKey: 'front',
    variants: [
      { variantId: 1320, label: '11oz', price: 1900 },
      { variantId: 1321, label: '15oz', price: 2200 },
    ],
  },
  tumbler: {
    productId: 'tumbler',
    name: 'Travel Tumbler',
    printfulProductId: 300, // Printful: Stainless Steel Tumbler
    placementKey: 'front',
    variants: [
      { variantId: 11501, label: '20oz', price: 3400 },
    ],
  },
  socks: {
    productId: 'socks',
    name: 'Patterned Socks',
    printfulProductId: 162, // Printful: All-Over Print Socks
    placementKey: 'default',
    variants: [
      { variantId: 6589, label: 'S/M', price: 1400 },
      { variantId: 6590, label: 'L/XL', price: 1400 },
    ],
  },
  'floor-mat': {
    productId: 'floor-mat',
    name: 'Floor Mat',
    printfulProductId: 358, // Printful: Rectangle Floor Mat
    placementKey: 'default',
    variants: [
      { variantId: 13201, label: '24×36"', price: 3900 },
      { variantId: 13202, label: '36×60"', price: 5900 },
    ],
  },
};
