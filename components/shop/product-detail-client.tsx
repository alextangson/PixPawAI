'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Sparkles, ImageIcon, ArrowRight } from 'lucide-react';
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
  const minPrice = Math.round(Math.min(...product.variants.map((v) => v.price)) / 100);

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
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/${lang}/shop`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Product / Preview Image */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-md">
              <Image
                src={selectedGeneration?.imageUrl || product.imageUrl}
                alt={selectedGeneration?.title || product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {selectedGeneration && (
                <div className="absolute top-4 left-4 bg-coral text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Your Portrait
                </div>
              )}
            </div>
            {selectedGeneration && (
              <p className="text-sm text-gray-500 text-center">
                {selectedGeneration.title || 'Your pet portrait'} will be printed on this {product.name.toLowerCase()}.
              </p>
            )}
          </div>

          {/* Right: Product Info & Actions */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-darkgray mb-2">{product.name}</h1>
              <p className="text-gray-600 text-lg">{product.description}</p>
              <p className="text-coral font-bold text-2xl mt-3">from ${minPrice}</p>
            </div>

            {/* Variant Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size / Option
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.variantId}
                    onClick={() => setSelectedVariantId(v.variantId)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedVariantId === v.variantId
                        ? 'border-coral bg-coral text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {v.label} — ${(v.price / 100).toFixed(0)}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Selection / Checkout */}
            {!selectedGeneration && !loadingInitial ? (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Add Your Pet Portrait</h2>

                <Button
                  onClick={() => setPickerOpen(true)}
                  className="w-full h-14 bg-coral hover:bg-orange-600 text-white font-bold text-base"
                >
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Choose from My Creations
                </Button>

                <Link
                  href={`/${lang}?product=${product.productId}`}
                  className="flex items-center justify-center gap-2 w-full h-14 border-2 border-coral text-coral font-bold rounded-lg hover:bg-coral/5 transition-colors text-base"
                >
                  <Sparkles className="w-5 h-5" />
                  Create a Pet Portrait First
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : loadingInitial ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-coral border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
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
