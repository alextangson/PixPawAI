import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, ShoppingCart, Heart, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/en')
  }

  // Fetch the generation
  const { data: generation } = await supabase
    .from('generations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!generation) {
    redirect('/en/dashboard')
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/en/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Gallery
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left: Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={generation.output_url}
                alt={generation.title || 'Your portrait'}
                className="w-full h-full object-cover"
              />
            </div>
            
            {generation.share_card_url && (
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={generation.share_card_url}
                  alt="Branded card"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {generation.title || 'Your Pet Portrait'}
              </h1>
              <p className="text-gray-600 text-lg">
                Premium Wall Art • Museum Quality Print
              </p>
            </div>

            {/* Coming Soon Badge */}
            <div className="bg-gradient-to-r from-coral/10 to-orange/10 border-2 border-coral/30 rounded-2xl p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-coral/20 rounded-full mb-4">
                  <ShoppingCart className="w-8 h-8 text-coral" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  🎨 Shop Coming Soon!
                </h2>
                <p className="text-gray-600 mb-6">
                  We're preparing amazing physical products for your masterpiece. Transform your AI-generated art into:
                </p>
                <div className="space-y-3 text-left max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🖼️</span>
                    <div>
                      <p className="font-semibold text-gray-800">Premium Canvas Prints</p>
                      <p className="text-sm text-gray-600">Museum-quality, ready to hang</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🛋️</span>
                    <div>
                      <p className="font-semibold text-gray-800">Custom Pet Pillows</p>
                      <p className="text-sm text-gray-600">Shaped like your pet</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">☕</span>
                    <div>
                      <p className="font-semibold text-gray-800">Photo Mugs & More</p>
                      <p className="text-sm text-gray-600">Perfect gifts for pet lovers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                className="w-full h-14 bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white text-lg font-bold"
                disabled
              >
                <Heart className="w-5 h-5 mr-2" />
                Notify Me When Available
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" className="h-12">
                  <Heart className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Beta Testing:</strong> Be among the first to know when our shop launches. Premium quality, competitive prices, worldwide shipping.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
