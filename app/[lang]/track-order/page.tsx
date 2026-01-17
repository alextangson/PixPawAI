import { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n-config';
import { Package, Clock, CheckCircle, Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Track Order - PixPaw AI',
  description: 'Track your PixPaw AI digital downloads and future physical product orders.',
};

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <main className="min-h-screen bg-cream py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <Package className="w-16 h-16 mx-auto mb-4 text-coral" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Track Your Order
          </h1>
          <p className="text-xl text-gray-600">
            View your digital downloads and check order status
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-coral/10 to-purple/10 rounded-2xl p-8 mb-8">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-coral flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Digital Products (Currently Available)
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                All your AI-generated artwork is instantly available in your Dashboard after generation. 
                No shipping or tracking needed - just download and enjoy!
              </p>
              <a 
                href={`/${lang}/dashboard`}
                className="inline-block bg-gradient-to-r from-coral to-purple text-white font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
              >
                Go to My Dashboard
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Physical Products - Coming Soon!
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-purple" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Custom Pet Pillows</h3>
                <p className="text-gray-600">
                  Soon you'll be able to order custom-shaped pillows featuring your pet's AI portrait. 
                  We're currently finalizing our manufacturing partners to ensure premium quality.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-coral" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Tracking</h3>
                <p className="text-gray-600">
                  Once physical products launch, you'll be able to track your orders here. 
                  You'll receive email updates at every stage from production to delivery.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Quality Guarantee</h3>
                <p className="text-gray-600">
                  Every physical product will come with our satisfaction guarantee. 
                  Not happy? We'll make it right or offer a full refund.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Want to Be Notified?</h2>
          <p className="text-gray-600 mb-6">
            Be the first to know when our physical products launch! Join our waitlist from the Shop page.
          </p>
          <div className="flex gap-4">
            <a 
              href={`/${lang}/shop`}
              className="inline-block bg-gray-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-all"
            >
              Join Waitlist
            </a>
            <a 
              href={`/${lang}/contact`}
              className="inline-block border-2 border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:border-gray-400 transition-all"
            >
              Contact Support
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Questions about your order? Email us at support@pixpawai.com</p>
        </div>
      </div>
    </main>
  );
}
