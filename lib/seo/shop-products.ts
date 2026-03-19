export interface ShopProduct {
  name: string;
  description: string;
  priceLabel: string;
  priceValue: number;
  image: string;
  productId: string;
  featured: boolean;
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    name: 'Custom Pillow',
    description: 'Cozy 16x16" plush cushion',
    priceLabel: 'from $49',
    priceValue: 49,
    image: 'https://images.unsplash.com/photo-1560790671-bd42f6076e85?w=1200&h=1200&fit=crop',
    productId: 'pillow',
    featured: true,
  },
  {
    name: 'Framed Wall Art',
    description: 'Premium canvas frame',
    priceLabel: 'from $59',
    priceValue: 59,
    image: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=1200&h=1200&fit=crop',
    productId: 'wall-art',
    featured: true,
  },
  {
    name: 'Custom T-Shirt',
    description: 'Soft cotton, all sizes',
    priceLabel: 'from $29',
    priceValue: 29,
    image: 'https://images.unsplash.com/photo-1576566527230-e99e0b760156?w=1200&h=1200&fit=crop',
    productId: 't-shirt',
    featured: false,
  },
  {
    name: 'Phone Case',
    description: 'Durable protective case',
    priceLabel: 'from $24',
    priceValue: 24,
    image: 'https://images.unsplash.com/photo-1610945265064-003444b62e9a?w=1200&h=1200&fit=crop',
    productId: 'phone-case',
    featured: false,
  },
  {
    name: 'Ceramic Mug',
    description: '11oz coffee mug',
    priceLabel: 'from $19',
    priceValue: 19,
    image: 'https://images.unsplash.com/photo-1578159311134-f099bbd66868?w=1200&h=1200&fit=crop',
    productId: 'mug',
    featured: false,
  },
  {
    name: 'Travel Tumbler',
    description: '20oz stainless steel',
    priceLabel: 'from $34',
    priceValue: 34,
    image: 'https://images.unsplash.com/photo-1627483262614-ad7d792b5606?w=1200&h=1200&fit=crop',
    productId: 'tumbler',
    featured: false,
  },
  {
    name: 'Patterned Socks',
    description: 'All-over print design',
    priceLabel: 'from $14',
    priceValue: 14,
    image: 'https://images.unsplash.com/photo-1603291606188-367759410317?w=1200&h=1200&fit=crop',
    productId: 'socks',
    featured: false,
  },
  {
    name: 'Floor Mat',
    description: '24x36" doormat',
    priceLabel: 'from $39',
    priceValue: 39,
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=1200&h=1200&fit=crop',
    productId: 'floor-mat',
    featured: false,
  },
];
