'use client';

import { type Locale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/dictionary';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ShopPage() {
  const params = useParams();
  const lang = (params?.lang as Locale) || 'en';
  
  const [dict, setDict] = useState<any>(null);

  useEffect(() => {
    getDictionary(lang).then(setDict);
  }, [lang]);

  if (!dict) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-coral border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const products = [
    {
      name: 'Custom Pillow',
      description: 'Cozy 16x16" plush cushion',
      price: 'from $49',
      image: 'https://images.unsplash.com/photo-1560790671-bd42f6076e85?w=600&h=600&fit=crop',
      productId: 'pillow',
      featured: true,
    },
    {
      name: 'Framed Wall Art',
      description: 'Premium canvas frame',
      price: 'from $59',
      image: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=600&h=600&fit=crop',
      productId: 'wall-art',
      featured: true,
    },
    {
      name: 'Custom T-Shirt',
      description: 'Soft cotton, all sizes',
      price: 'from $29',
      image: 'https://images.unsplash.com/photo-1576566527230-e99e0b760156?w=600&h=600&fit=crop',
      productId: 't-shirt',
      featured: false,
    },
    {
      name: 'Phone Case',
      description: 'Durable protective case',
      price: 'from $24',
      image: 'https://images.unsplash.com/photo-1610945265064-003444b62e9a?w=600&h=600&fit=crop',
      productId: 'phone-case',
      featured: false,
    },
    {
      name: 'Ceramic Mug',
      description: '11oz coffee mug',
      price: 'from $19',
      image: 'https://images.unsplash.com/photo-1578159311134-f099bbd66868?w=600&h=600&fit=crop',
      productId: 'mug',
      featured: false,
    },
    {
      name: 'Travel Tumbler',
      description: '20oz stainless steel',
      price: 'from $34',
      image: 'https://images.unsplash.com/photo-1627483262614-ad7d792b5606?w=600&h=600&fit=crop',
      productId: 'tumbler',
      featured: false,
    },
    {
      name: 'Patterned Socks',
      description: 'All-over print design',
      price: 'from $14',
      image: 'https://images.unsplash.com/photo-1603291606188-367759410317?w=600&h=600&fit=crop',
      productId: 'socks',
      featured: false,
    },
    {
      name: 'Floor Mat',
      description: '24x36" doormat',
      price: 'from $39',
      image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&h=600&fit=crop',
      productId: 'floor-mat',
      featured: false,
    },
  ];

  return (
    <main className="min-h-screen bg-cream">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-coral to-orange-600 text-white py-20 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32">
            <Sparkles className="w-full h-full text-white" />
          </div>
          <div className="absolute bottom-10 right-10 w-40 h-40">
            <Sparkles className="w-full h-full text-white" />
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Shop Custom Pet Merch
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Turn your AI masterpieces into real-world treasures.
          </p>
        </div>
      </section>

      {/* Product Grid Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Info Banner */}
          <div className="bg-orange-50 border-l-4 border-coral rounded-lg p-6 mb-12 max-w-4xl mx-auto">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-coral flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg text-darkgray mb-2">
                  How It Works
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Choose a product below, then upload your pet's photo. Our AI will generate a stunning portrait, 
                  and you can preview it on your selected item before ordering. No design skills needed!
                </p>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <Link
                key={index}
                href={`/${lang}?product=${product.productId}`}
                className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
              >
                {/* Featured Badge */}
                {product.featured && (
                  <div className="absolute top-4 right-4 z-20 bg-coral text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    Popular
                  </div>
                )}

                {/* Product Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Hover Overlay with CTA */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                    <div className="bg-white text-black font-bold px-6 py-3 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-2xl flex items-center gap-2">
                      Create Now
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-darkgray mb-2 group-hover:text-coral transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-coral font-bold text-lg">
                      {product.price}
                    </span>
                    <span className="text-gray-500 text-sm flex items-center gap-1">
                      Customize
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-darkgray mb-4">
                Not Sure Which Product to Choose?
              </h3>
              <p className="text-gray-600 mb-6">
                Start by creating your pet's portrait first. You can choose the product later!
              </p>
              <Link
                href={`/${lang}`}
                className="inline-flex items-center gap-2 bg-coral hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <Sparkles className="w-5 h-5" />
                Create Portrait First
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
