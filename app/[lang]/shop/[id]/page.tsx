import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { SEO_SITE_URL } from '@/lib/seo/metadata'
import { MerchOrderFlow } from '@/components/merch-order-flow'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  const { lang, id } = await params
  return {
    title: 'Custom Pet Product Preview | PixPaw AI',
    description: 'Turn your pet portrait into a custom product — pillows, mugs, shirts and more.',
    alternates: { canonical: `${SEO_SITE_URL}/${lang}/shop/${id}/` },
    robots: { index: false, follow: false, nocache: true },
  }
}

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>
}) {
  const { lang, id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect(`/${lang}`)

  const { data: generation } = await supabase
    .from('generations')
    .select('id, output_url, share_card_url, title')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!generation?.output_url) redirect(`/${lang}/dashboard`)

  const imageUrl = generation.share_card_url || generation.output_url

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/${lang}/dashboard`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Portrait preview */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {generation.title || 'Your Pet Portrait'}
            </h1>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-md">
              <Image
                src={imageUrl}
                alt={generation.title || 'Pet portrait'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <p className="text-sm text-gray-500">
              This portrait will be printed on your chosen product.
            </p>
          </div>

          {/* Order flow */}
          <div>
            <MerchOrderFlow generationId={generation.id} />
          </div>
        </div>
      </div>
    </main>
  )
}
