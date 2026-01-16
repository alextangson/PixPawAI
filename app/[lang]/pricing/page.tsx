'use client';

import { useState, useEffect } from 'react';
import { Check, X, Lock, Gift, Zap, Shield, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Locale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/dictionary';
import { useParams, useRouter } from 'next/navigation';

export default function PricingPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as Locale) || 'en';
  
  const [dict, setDict] = useState<any>(null);

  useEffect(() => {
    getDictionary(lang).then(setDict);
  }, [lang]);

  const handleStartCreating = () => {
    router.push(`/${lang}#upload`);
  };

  if (!dict) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-cream">
      {/* Header Section */}
      <section className="relative py-20 bg-gradient-to-br from-orange-50 via-cream to-white overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-orange-100 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
              {dict.pricing.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-6">
              {dict.pricing.subtitle}
            </p>
            
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-gray-200">
              <Lock className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                {dict.pricing.trustBadge}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-16 -mt-12 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Card 1: Free Trial */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {dict.pricing.cards.free.title}
              </h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-gray-900">
                  {dict.pricing.cards.free.price}
                </span>
              </div>
              
              {/* Features */}
              <ul className="space-y-4 mb-8">
                {dict.pricing.cards.free.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    {index < 1 ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={index < 1 ? 'text-gray-700' : 'text-gray-500'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button
                variant="outline"
                className="w-full py-6 text-lg font-semibold border-2 border-gray-300 hover:border-coral hover:text-coral transition-all"
                onClick={handleStartCreating}
              >
                {dict.pricing.cards.free.button}
              </Button>
            </div>

            {/* Card 2: Starter Pack */}
            <div className="bg-white rounded-2xl border-2 border-gray-300 p-8 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <div className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-3">
                {dict.pricing.cards.starter.badge}
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {dict.pricing.cards.starter.title}
              </h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-gray-900">
                  {dict.pricing.cards.starter.price}
                </span>
              </div>
              
              {/* Features */}
              <ul className="space-y-4 mb-8">
                {dict.pricing.cards.starter.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                variant="secondary"
                className="w-full py-6 text-lg font-semibold bg-gray-800 hover:bg-gray-900 text-white transition-all"
                onClick={handleStartCreating}
              >
                {dict.pricing.cards.starter.button}
              </Button>
            </div>

            {/* Card 3: Pro Bundle (HIGHLIGHTED) */}
            <div className="relative bg-gradient-to-br from-orange-50 to-white rounded-2xl border-4 border-coral p-8 shadow-2xl transform md:scale-105 hover:scale-110 transition-all duration-300">
              {/* Best Value Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-coral text-white text-sm font-bold px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <Zap className="w-4 h-4 fill-white" />
                  {dict.pricing.cards.pro.badge}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2 mt-4">
                {dict.pricing.cards.pro.title}
              </h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold bg-gradient-to-r from-coral to-orange-600 bg-clip-text text-transparent">
                  {dict.pricing.cards.pro.price}
                </span>
                <span className="text-gray-500 text-lg ml-2">one-time</span>
              </div>
              
              {/* Features */}
              <ul className="space-y-4 mb-8">
                {dict.pricing.cards.pro.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    {index === 1 ? (
                      <Gift className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" />
                    ) : (
                      <Check className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`font-semibold ${index === 1 ? 'text-coral' : 'text-gray-800'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button
                className="w-full py-7 text-xl font-bold bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                onClick={handleStartCreating}
              >
                {dict.pricing.cards.pro.button} 🚀
              </Button>
              
              {/* Trust Signal */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  ⚡ Most popular choice • 💯 Money-back guarantee
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Referral/Growth Hacking Section */}
      <section className="py-16 bg-gradient-to-r from-orange-100 via-orange-50 to-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12 border-2 border-orange-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-coral to-orange-600 rounded-full mb-6">
                <LinkIcon className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {dict.pricing.referral.headline}
              </h2>
              
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                {dict.pricing.referral.text}
              </p>
              
              <Button
                size="lg"
                className="bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                onClick={handleStartCreating}
              >
                {dict.pricing.referral.button}
              </Button>
              
              <p className="text-sm text-gray-500 mt-4">
                🎁 Unlimited referrals • No cap on free credits
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
              {dict.pricing.faq.title}
            </h2>
            <p className="text-center text-gray-600 mb-12">
              Everything you need to know about our pricing
            </p>
            
            <div className="space-y-6">
              {dict.pricing.faq.items.map((item: any, index: number) => (
                <div
                  key={index}
                  className="bg-cream rounded-2xl p-6 border border-orange-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-coral to-orange-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">Q</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {item.question}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Additional Trust Signals */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <Shield className="w-10 h-10 text-coral mx-auto mb-3" />
                <h4 className="font-bold text-gray-900 mb-1">Secure Payments</h4>
                <p className="text-sm text-gray-600">256-bit SSL encryption</p>
              </div>
              <div className="p-4">
                <Zap className="w-10 h-10 text-coral mx-auto mb-3" />
                <h4 className="font-bold text-gray-900 mb-1">Instant Access</h4>
                <p className="text-sm text-gray-600">Credits applied immediately</p>
              </div>
              <div className="p-4">
                <Gift className="w-10 h-10 text-coral mx-auto mb-3" />
                <h4 className="font-bold text-gray-900 mb-1">Money-Back Guarantee</h4>
                <p className="text-sm text-gray-600">100% satisfaction or refund</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Ready to transform your pet?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 10,000+ happy pet parents today
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold px-12 py-7 text-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105"
            onClick={handleStartCreating}
          >
            Start Creating Now 🎨
          </Button>
        </div>
      </section>
    </main>
  );
}
