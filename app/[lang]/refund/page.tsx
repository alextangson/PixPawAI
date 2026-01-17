import { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n-config';
import { CheckCircle2, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund Policy - PixPaw AI',
  description: 'Learn about PixPaw AI refund policy and satisfaction guarantee.',
};

export default async function RefundPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <main className="min-h-screen bg-cream py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
          Refund Policy
        </h1>
        
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6 text-gray-700">
          <div className="bg-gradient-to-r from-coral/10 to-purple/10 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              First-Time Satisfaction Guarantee
            </h2>
            <p className="text-lg leading-relaxed">
              Not happy with your first generation? We'll automatically refund your credit 
              when you click "Not quite" - no questions asked!
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Automatic Credit Refund</h3>
                  <p className="text-gray-600">
                    If you're not satisfied with your first generation, click "Try Different Style" or 
                    "Regenerate" and we'll automatically refund your credit back to your account.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Instant & Hassle-Free</h3>
                  <p className="text-gray-600">
                    No need to contact support or fill out forms. The refund happens instantly 
                    and you can try again immediately.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">One-Time Per Image</h3>
                  <p className="text-gray-600">
                    The satisfaction guarantee applies once per uploaded image. Subsequent generations 
                    of the same image will use your available credits.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="pt-6 border-t">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Not Eligible for Refund</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Low-Quality Input Photos</h3>
                  <p className="text-gray-600">
                    Images that fail our quality check (blurry, unclear, or no visible pet) 
                    are rejected before generation and don't consume credits.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">After Download or Share</h3>
                  <p className="text-gray-600">
                    Once you download or share your artwork to the gallery, it indicates satisfaction. 
                    Refunds are not available after these actions.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Abuse Prevention</h3>
                  <p className="text-gray-600">
                    Repeated refund requests or suspicious patterns may result in account review 
                    to prevent system abuse.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="pt-6 border-t">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment Disputes</h2>
            <p className="leading-relaxed">
              If you believe you were charged incorrectly, please contact us at support@pixpawai.com 
              within 30 days of the charge. Include your transaction ID and reason for dispute.
            </p>
          </section>

          <section className="pt-6 border-t">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Questions?</h2>
            <p className="leading-relaxed">
              If you have any questions about our refund policy, please reach out to our support team 
              at support@pixpawai.com. We're here to help!
            </p>
          </section>

          <p className="text-sm text-gray-500 pt-6 border-t">
            Last updated: January 18, 2026
          </p>
        </div>
      </div>
    </main>
  );
}
