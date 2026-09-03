import type { Locale } from '@/lib/i18n-config';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Sparkles,
  Truck,
  Shield,
  Palette,
  Package,
  Heart,
} from 'lucide-react';
import { PRINTFUL_PRODUCTS } from '@/lib/printful/config';

const STEPS = [
  {
    icon: Palette,
    title: 'Create Your Portrait',
    description: 'Upload your pet photo and our AI creates a stunning watercolor-style portrait in seconds.',
  },
  {
    icon: Package,
    title: 'Pick Your Product',
    description: 'Choose from pillows, canvas prints, t-shirts, phone cases, mugs, and more.',
  },
  {
    icon: Truck,
    title: 'We Ship It To You',
    description: 'Review the shipping price and delivery estimate at checkout before you pay.',
  },
];

export default async function ShopPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const products = Object.values(PRINTFUL_PRODUCTS);
  const featuredProducts = products.filter((p) => p.featured);
  const otherProducts = products.filter((p) => !p.featured);

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-coral via-orange-500 to-amber-500 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-[10%] right-[10%] w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <Heart className="w-4 h-4" />
                Made with love for pet parents
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Your Pet,{' '}
                <span className="text-yellow-200">On Everything.</span>
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-xl mb-8 leading-relaxed">
                Turn your AI pet portrait into premium custom products.
                Pillows, canvas prints, t-shirts, and more — printed and shipped worldwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="#products"
                  className="inline-flex items-center justify-center gap-2 bg-white text-coral font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-base"
                >
                  Browse Products
                  <ArrowRight className="w-5 h-5" />
                </a>
                <Link
                  href={`/${lang}`}
                  className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm text-white font-bold px-8 py-4 rounded-full border border-white/30 hover:bg-white/25 transition-all duration-300 text-base"
                >
                  <Sparkles className="w-5 h-5" />
                  Create Portrait First
                </Link>
              </div>
            </div>

            {/* Right: Featured product collage */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                  <Image
                    src="/products/generated/pillow.png"
                    alt="Custom pet pillow"
                    width={300}
                    height={300}
                    className="w-full h-auto"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-2xl -rotate-1 hover:rotate-0 transition-transform duration-500">
                  <Image
                    src="/products/generated/mug.png"
                    alt="Custom pet mug"
                    width={300}
                    height={300}
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="rounded-2xl overflow-hidden shadow-2xl -rotate-2 hover:rotate-0 transition-transform duration-500">
                  <Image
                    src="/products/generated/canvas-print.png"
                    alt="Custom pet canvas"
                    width={300}
                    height={300}
                    className="w-full h-auto"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                  <Image
                    src="/products/generated/phone-case.png"
                    alt="Custom pet phone case"
                    width={300}
                    height={300}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-darkgray text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Three simple steps to turn your pet into a masterpiece.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="text-center relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t-2 border-dashed border-gray-200" />
                )}
                <div className="w-20 h-20 bg-coral/10 rounded-2xl flex items-center justify-center mx-auto mb-5 relative">
                  <step.icon className="w-9 h-9 text-coral" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-coral text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-darkgray mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="products" className="py-16 md:py-20 scroll-mt-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-coral font-semibold text-sm uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4" />
              Made-to-order keepsakes
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-darkgray">
              Featured Products
            </h2>
          </div>

          {/* Featured: Large cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {featuredProducts.map((product) => {
              const minPrice = Math.round(
                Math.min(...product.variants.map((v) => v.price)) / 100
              );
              return (
                <Link
                  key={product.productId}
                  href={`/${lang}/shop/${product.productId}`}
                  className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
                >
                  <div className="relative h-72 md:h-80 overflow-hidden">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>

                  <div className="p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-bold text-darkgray mb-2 group-hover:text-coral transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-gray-500">{product.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-coral font-bold text-2xl">${minPrice}</div>
                        <div className="text-xs text-gray-400 mt-0.5">starting from</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-5 pt-5 border-t border-gray-100">
                      <span className="inline-flex items-center gap-1 text-coral font-semibold text-sm group-hover:gap-2 transition-all">
                        Customize Now
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Other Products: Smaller cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherProducts.map((product) => {
              const minPrice = Math.round(
                Math.min(...product.variants.map((v) => v.price)) / 100
              );
              return (
                <Link
                  key={product.productId}
                  href={`/${lang}/shop/${product.productId}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500"
                >
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-darkgray mb-1 group-hover:text-coral transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-500 text-sm mb-3">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-coral font-bold text-lg">${minPrice}</span>
                      <span className="text-sm text-gray-400 flex items-center gap-1 group-hover:text-coral transition-colors">
                        Shop
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Badges + CTA */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Trust badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
            {[
              { icon: Truck, title: 'Shipping Up Front', desc: 'Price shown before payment' },
              { icon: Shield, title: 'Quality Guarantee', desc: 'Premium materials & print' },
              { icon: Heart, title: 'Made With Love', desc: 'By pet parents, for pet parents' },
            ].map((badge) => (
              <div key={badge.title} className="flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <badge.icon className="w-6 h-6 text-coral" />
                </div>
                <div>
                  <div className="font-bold text-darkgray text-sm">{badge.title}</div>
                  <div className="text-gray-400 text-xs">{badge.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="bg-gradient-to-br from-coral to-orange-600 rounded-3xl p-8 md:p-12 text-center text-white shadow-xl">
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Ready to Make Something Special?
            </h3>
            <p className="text-white/85 mb-8 max-w-lg mx-auto">
              Start with a portrait of your pet, then choose the perfect product.
              It only takes 30 seconds.
            </p>
            <Link
              href={`/${lang}`}
              className="inline-flex items-center gap-2 bg-white text-coral font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-base"
            >
              <Sparkles className="w-5 h-5" />
              Create Your Pet Portrait
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
