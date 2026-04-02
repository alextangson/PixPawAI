'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  ImageIcon,
  ArrowRight,
  Truck,
  Shield,
  Star,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type PrintfulProduct } from '@/lib/printful/config';
import { MerchOrderFlow } from '@/components/merch-order-flow';
import { GenerationPicker } from '@/components/shop/generation-picker';
import { createClient } from '@/lib/supabase/client';

interface Props {
  product: PrintfulProduct;
  lang: string;
  initialGenerationId?: string;
}

const TRUST_POINTS = [
  'Premium quality printing',
  'Worldwide shipping (5-12 days)',
  'Satisfaction guarantee',
];

export function ProductDetailClient({ product, lang, initialGenerationId }: Props) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0].variantId);
  const [selectedGeneration, setSelectedGeneration] = useState<{
    id: string;
    imageUrl: string;
    title: string | null;
  } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(!!initialGenerationId);

  const selectedVariant = product.variants.find((v) => v.variantId === selectedVariantId);

  // Auto-load generation if generationId is provided via URL
  useEffect(() => {
    if (!initialGenerationId) return;

    const supabase = createClient();
    supabase
      .from('generations')
      .select('id, output_url, share_card_url, title')
      .eq('id', initialGenerationId)
      .single()
      .then(({ data }) => {
        if (data?.output_url) {
          setSelectedGeneration({
            id: data.id,
            imageUrl: data.share_card_url || data.output_url,
            title: data.title,
          });
        }
        setLoadingInitial(false);
      });
  }, [initialGenerationId]);

  return (
    <main className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 max-w-6xl py-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href={`/${lang}/shop`} className="hover:text-gray-700 transition-colors">
              Shop
            </Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
          {/* Left: Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 shadow-lg">
              <Image
                src={selectedGeneration?.imageUrl || product.imageUrl}
                alt={selectedGeneration?.title || product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {selectedGeneration && (
                <div className="absolute top-4 left-4 bg-coral text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Your Portrait
                </div>
              )}
            </div>

            {selectedGeneration && (
              <p className="text-sm text-gray-400 text-center">
                &ldquo;{selectedGeneration.title || 'Your pet portrait'}&rdquo; will be printed on this {product.name.toLowerCase()}.
              </p>
            )}

            {/* Trust badges - desktop only */}
            <div className="hidden md:flex items-center justify-center gap-6 pt-2">
              {[
                { icon: Truck, label: 'Free shipping 75+' },
                { icon: Shield, label: 'Quality guarantee' },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-sm text-gray-400">
                  <b.icon className="w-4 h-4" />
                  {b.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Product Info & Actions */}
          <div className="space-y-6">
            {/* Back link - mobile */}
            <Link
              href={`/${lang}/shop`}
              className="md:hidden inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Shop
            </Link>

            {/* Title & Rating */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-sm text-gray-400 ml-1">(89 reviews)</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-darkgray mb-2">
                {product.name}
              </h1>
              <p className="text-gray-500 text-lg">{product.description}</p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-coral font-bold text-3xl">
                ${selectedVariant ? (selectedVariant.price / 100).toFixed(2) : '—'}
              </span>
              {product.variants.length > 1 && (
                <span className="text-gray-400 text-sm">
                  {selectedVariant?.label}
                </span>
              )}
            </div>

            {/* Variant Selector */}
            {product.variants.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-darkgray mb-2.5">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.variantId}
                      onClick={() => setSelectedVariantId(v.variantId)}
                      className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                        selectedVariantId === v.variantId
                          ? 'border-coral bg-coral text-white shadow-md shadow-coral/20'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Image Selection / Checkout */}
            {!selectedGeneration && !loadingInitial ? (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-darkgray">
                  Step 1: Add Your Pet Portrait
                </h2>

                <Button
                  onClick={() => setPickerOpen(true)}
                  className="w-full h-14 bg-coral hover:bg-orange-600 text-white font-bold text-base rounded-xl shadow-lg shadow-coral/20 hover:shadow-xl hover:shadow-coral/30 transition-all"
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Choose from My Creations
                </Button>

                <Link
                  href={`/${lang}?product=${product.productId}`}
                  className="flex items-center justify-center gap-2 w-full h-14 border-2 border-coral text-coral font-bold rounded-xl hover:bg-coral/5 transition-colors text-base"
                >
                  <Sparkles className="w-5 h-5" />
                  Create a Pet Portrait First
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <p className="text-center text-sm text-gray-400">
                  Upload your pet photo — AI portrait ready in 30 seconds
                </p>
              </div>
            ) : loadingInitial ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-darkgray">
                    Step 2: Complete Your Order
                  </h2>
                  <button
                    onClick={() => setSelectedGeneration(null)}
                    className="text-sm text-coral hover:underline"
                  >
                    Change portrait
                  </button>
                </div>

                <MerchOrderFlow
                  generationId={selectedGeneration!.id}
                  initialProductId={product.productId}
                  initialVariantId={selectedVariantId}
                />
              </div>
            )}

            {/* Trust Points */}
            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
              {TRUST_POINTS.map((point) => (
                <div key={point} className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generation Picker Modal */}
      <GenerationPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(gen) => {
          setSelectedGeneration(gen);
          setPickerOpen(false);
        }}
      />
    </main>
  );
}
