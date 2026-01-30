'use client';

import { useState, useEffect } from 'react';
import { Check, X, Lock, Gift, Zap, Shield, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Locale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/dictionary';
import { useParams, useRouter } from 'next/navigation';
import { PricingComparisonTable } from '@/components/pricing-comparison-table';
import { StatsBadges, TestimonialCarousel } from '@/components/pricing-social-proof';
import { UpgradeModal } from '@/components/pricing-upgrade-modal';
import { PricingCountdown, LimitedSlots } from '@/components/pricing-countdown';
import { PaymentModal } from '@/components/payment/payment-modal';
import { trackPricingPageView, trackPricingCTAClick } from '@/lib/pricing-analytics';
import { ReferralLinkModal } from '@/components/referral-link-modal';
import { AuthRequiredDialog } from '@/components/auth-required-dialog';
import { createClient } from '@/lib/supabase/client';

export default function PricingPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as Locale) || 'en';
  
  const [dict, setDict] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showAuthRequiredDialog, setShowAuthRequiredDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<{tier: 'starter' | 'pro' | 'master', price: string, credits: number} | null>(null);

  useEffect(() => {
    getDictionary(lang).then(setDict);
    
    // Track page view
    trackPricingPageView('optimized');
  }, [lang]);

  const handleStartCreating = async (tier: 'free' | 'starter' | 'pro' | 'master' = 'free', price?: string, credits?: number) => {
    trackPricingCTAClick(tier, 'card', 'optimized');
    
    if (tier === 'free') {
      // Free tier直接跳转到上传
      router.push(`/${lang}#upload`);
    } else {
      // 付费套餐：先检查登录状态
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // 未登录：显示友好的登录提示对话框
        // 保存用户选择的套餐，登录后可以继续
        const tierCredits = credits || (tier === 'starter' ? 15 : tier === 'pro' ? 50 : 100);
        setSelectedTier({ tier: tier as 'starter' | 'pro' | 'master', price: price || '', credits: tierCredits });
        setShowAuthRequiredDialog(true);
        return;
      }
      
      // 已登录：显示支付弹窗
      const tierCredits = credits || (tier === 'starter' ? 15 : tier === 'pro' ? 50 : 100);
      setSelectedTier({ tier: tier as 'starter' | 'pro' | 'master', price: price || '', credits: tierCredits });
      setShowPaymentModal(true);
    }
  };

  const handleUpgrade = () => {
    router.push(`/${lang}#upload`);
  };

  if (!dict) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // Render pricing cards in standard order: Free → Starter → Pro (推荐) → Master (专业)
  const renderPricingCards = () => {
    return (
      <>
        <FreeCard dict={dict} onCTA={() => handleStartCreating('free')} />
        <StarterCard dict={dict} onCTA={() => handleStartCreating('starter', dict.pricing.cards.starter.price, 15)} />
        <ProCard dict={dict} onCTA={() => handleStartCreating('pro', dict.pricing.cards.pro.price, 50)} featured />
        <MasterCard dict={dict} onCTA={() => handleStartCreating('master', dict.pricing.cards.master.salePrice, 200)} />
      </>
    );
  };

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
            <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-6xl font-extrabold text-gray-900 mb-6">
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
          {/* Desktop: 4-column grid with visual hierarchy */}
          <div className="hidden md:grid md:grid-cols-4 gap-6 max-w-7xl mx-auto items-center">
            {renderPricingCards()}
          </div>

          {/* Mobile: Vertical stack with Pro first for emphasis */}
          <div className="md:hidden space-y-6 max-w-md mx-auto">
            <ProCard dict={dict} onCTA={() => handleStartCreating('pro', dict.pricing.cards.pro.price, 50)} featured />
            <MasterCard dict={dict} onCTA={() => handleStartCreating('master', dict.pricing.cards.master.salePrice, 200)} />
            <StarterCard dict={dict} onCTA={() => handleStartCreating('starter', dict.pricing.cards.starter.price, 15)} />
            <FreeCard dict={dict} onCTA={() => handleStartCreating('free')} />
          </div>
          
          {/* Mobile Sticky CTA Bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-coral shadow-2xl p-4 pb-safe z-40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="text-xs text-gray-600 font-medium">Best Value</div>
                <div className="text-lg font-bold text-gray-900">Pro Bundle</div>
                <div className="text-sm text-coral font-semibold">{dict.pricing.cards.pro.price}</div>
              </div>
              <Button
                onClick={() => handleStartCreating('pro', dict.pricing.cards.pro.price, 50)}
                className="bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold px-6 py-3 shadow-xl"
              >
                Get Pro
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Badges */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <StatsBadges dict={dict} />
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-gradient-to-b from-white to-cream">
        <div className="container mx-auto px-4">
          <PricingComparisonTable dict={dict} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-8">
            {dict.pricing.socialProof?.testimonialTitle || 'What Our Users Say'}
          </h2>
          <TestimonialCarousel dict={dict} />
        </div>
      </section>

      {/* Referral/Growth Hacking Section */}
      <section className="py-16 bg-gradient-to-r from-orange-100 via-orange-50 to-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12 border-2 border-orange-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-coral to-orange-600 rounded-full mb-6">
                <Gift className="w-8 h-8 text-white" />
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
                onClick={() => setShowReferralModal(true)}
              >
                {dict.pricing.referral.button}
              </Button>
              
              <p className="text-sm text-gray-500 mt-4">
                🎁 Refer up to 50 friends • Both get 5 free credits
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Accordion Style */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
              {dict.pricing.faq.title}
            </h2>
            <p className="text-center text-gray-600 mb-12">
              Everything you need to know about our pricing
            </p>
            
            <FAQAccordion items={dict.pricing.faq.items} />
            
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
            onClick={() => handleStartCreating()}
          >
            Start Creating Now 🎨
          </Button>
        </div>
      </section>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        variant="A"
        dict={dict}
      />

      {/* Payment Modal */}
      {selectedTier && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          tier={selectedTier.tier}
          price={selectedTier.price}
          credits={selectedTier.credits}
        />
      )}

      {/* Referral Link Modal */}
      <ReferralLinkModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
      />

      {/* Auth Required Dialog */}
      <AuthRequiredDialog
        isOpen={showAuthRequiredDialog}
        onClose={() => setShowAuthRequiredDialog(false)}
      />
    </main>
  );
}

// FAQ Accordion Component
function FAQAccordion({ items }: { items: any[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {items.map((item: any, index: number) => {
        const isOpen = openIndex === index;
        
        return (
          <div
            key={index}
            className="bg-cream rounded-xl border-2 border-orange-100 overflow-hidden transition-all hover:border-coral"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-orange-50 transition-colors"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-coral to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 pr-4">
                  {item.question}
                </h3>
              </div>
              <div className="flex-shrink-0">
                <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                  <svg className="w-6 h-6 text-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>
            
            <div
              className={`transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              } overflow-hidden`}
            >
              <div className="px-6 pb-6 pl-18">
                <p className="text-gray-600 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Individual Pricing Card Components
function FreeCard({ dict, onCTA }: { dict: any; onCTA: () => void }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:shadow-md transition-shadow duration-300 flex flex-col">
      <div className="mb-3">
        <span className="inline-block bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
          {dict.pricing.cards.free.badge}
        </span>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        {dict.pricing.cards.free.title}
      </h3>
      
      <div className="mb-4">
        <span className="text-4xl font-extrabold text-gray-900">
          {dict.pricing.cards.free.price}
        </span>
      </div>
      
      {/* Features */}
      <ul className="space-y-3 mb-6 flex-grow">
        {dict.pricing.cards.free.features.map((feature: string, index: number) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700 font-medium">{feature}</span>
          </li>
        ))}
        {dict.pricing.cards.free.limitations?.map((limitation: string, index: number) => {
          const cleanText = limitation.replace(/⚠️/g, '').trim();
          return (
            <li key={`limit-${index}`} className="flex items-start gap-2">
              <X className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-500">{cleanText}</span>
            </li>
          );
        })}
      </ul>
      
      <Button
        variant="outline"
        className="w-full py-4 text-sm font-semibold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
        onClick={onCTA}
      >
        {dict.pricing.cards.free.button}
      </Button>
    </div>
  );
}

function StarterCard({ dict, onCTA }: { dict: any; onCTA: () => void }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-300 p-6 hover:shadow-md transition-all duration-300 flex flex-col">
      <div className="mb-3">
        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
          {dict.pricing.cards.starter.badge}
        </span>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        {dict.pricing.cards.starter.title}
      </h3>
      
      <div className="mb-1">
        <span className="text-4xl font-extrabold text-gray-900">
          {dict.pricing.cards.starter.price}
        </span>
      </div>
      
      {dict.pricing.cards.starter.perImage && (
        <div className="text-xs text-gray-500 mb-4">
          {dict.pricing.cards.starter.perImage}
        </div>
      )}
      
      {/* Features */}
      <ul className="space-y-3 mb-6 flex-grow">
        {dict.pricing.cards.starter.features.map((feature: string, index: number) => {
          const cleanFeature = feature.replace(/🚫/g, '').trim();
          return (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700 font-medium">{cleanFeature}</span>
            </li>
          );
        })}
      </ul>
      
      {dict.pricing.cards.starter.highlight && (
        <div className="mb-4 text-xs text-blue-600 font-medium text-center bg-blue-50 py-2 px-3 rounded-lg">
          {dict.pricing.cards.starter.highlight.replace(/💡/g, '').trim()}
        </div>
      )}
      
      <Button
        className="w-full py-4 text-sm font-semibold bg-gray-800 hover:bg-gray-900 text-white transition-all"
        onClick={onCTA}
      >
        {dict.pricing.cards.starter.button}
      </Button>
    </div>
  );
}

function ProCard({ dict, onCTA, featured }: { dict: any; onCTA: () => void; featured?: boolean }) {
  return (
    <div className={`relative bg-gradient-to-br from-orange-50 via-orange-50/50 to-white rounded-2xl border-3 border-coral p-6 shadow-2xl ${
      featured ? 'md:scale-105 lg:scale-[1.08] xl:scale-105' : 'md:scale-105 lg:scale-[1.08] xl:scale-105'
    } hover:shadow-3xl transition-all duration-300 flex flex-col z-10`}>
      {/* Best Value Badge - More Prominent */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-gradient-to-r from-coral to-orange-600 text-white text-sm font-bold px-6 py-2 rounded-full shadow-xl">
          ⭐ {dict.pricing.cards.pro.badge.replace(/⭐/g, '').trim()}
        </div>
      </div>
      
      <div className="mt-4 mb-3">
        <span className="inline-block bg-coral/10 text-coral text-xs font-bold px-3 py-1.5 rounded-full border-2 border-coral/20">
          MOST POPULAR
        </span>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {dict.pricing.cards.pro.title}
      </h3>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-extrabold bg-gradient-to-r from-coral to-orange-600 bg-clip-text text-transparent">
            {dict.pricing.cards.pro.price}
          </span>
          <span className="text-gray-500 text-sm">one-time</span>
        </div>
        {dict.pricing.cards.pro.comparison && (
          <div className="text-xs text-gray-600 mt-2">
            {dict.pricing.cards.pro.comparison}
          </div>
        )}
      </div>
      
      {/* Features */}
      <ul className="space-y-3 mb-6 flex-grow">
        {dict.pricing.cards.pro.features.map((feature: string, index: number) => {
          const isComingSoon = feature.includes('🔒');
          const isHighlight = feature.includes('✨');
          const cleanFeature = feature.replace(/✨|🔒/g, '').trim();
          
          return (
            <li key={index} className="flex items-start gap-2">
              {isComingSoon ? (
                <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              ) : isHighlight ? (
                <Sparkles className="w-4 h-4 text-coral flex-shrink-0 mt-0.5 fill-coral" />
              ) : (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              )}
              <span className={`text-sm ${
                isComingSoon ? 'text-gray-500' : 
                isHighlight ? 'text-coral font-semibold' : 
                'text-gray-700 font-medium'
              }`}>
                {cleanFeature}
              </span>
            </li>
          );
        })}
      </ul>
      
      {dict.pricing.cards.pro.highlight && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-2.5 text-center">
          <div className="text-xs text-green-700 font-semibold">
            {dict.pricing.cards.pro.highlight.replace(/⭐/g, '').trim()}
          </div>
        </div>
      )}
      
      <Button
        className="w-full py-6 text-lg font-bold bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-[1.02]"
        onClick={onCTA}
      >
        {dict.pricing.cards.pro.button.replace(/🚀/g, '').trim()}
      </Button>
      
      {/* Trust Signal */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-600 font-medium">
          💯 Most popular choice • Money-back guarantee
        </p>
      </div>
    </div>
  );
}

function MasterCard({ dict, onCTA }: { dict: any; onCTA: () => void }) {
  return (
    <div className="relative bg-white rounded-2xl border-2 border-gray-800 p-6 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col md:scale-[1.02] lg:scale-[1.03] xl:scale-100">
      {/* Professional Badge */}
      <div className="mb-3">
        <span className="inline-block bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
          🏆 {dict.pricing.cards.master.badge}
        </span>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {dict.pricing.cards.master.title}
      </h3>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-medium text-gray-400 line-through">
            {dict.pricing.cards.master.originalPrice}
          </span>
          <span className="text-4xl font-extrabold text-gray-900">
            {dict.pricing.cards.master.salePrice}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-medium">Limited offer: </span>
          <PricingCountdown className="font-semibold text-amber-700" targetHour={24} />
        </div>
      </div>
      
      {/* Features */}
      <ul className="space-y-3 mb-6 flex-grow">
        {dict.pricing.cards.master.features.map((feature: string, index: number) => {
          const isComingSoon = feature.includes('🔒');
          const isHighlight = feature.includes('✨');
          const cleanFeature = feature.replace(/✨|🔒/g, '').trim();
          
          return (
            <li key={index} className="flex items-start gap-2">
              {isComingSoon ? (
                <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              ) : (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              )}
              <span className={`text-sm ${
                isComingSoon ? 'text-gray-500' : 
                isHighlight ? 'text-gray-900 font-semibold' : 
                'text-gray-700 font-medium'
              }`}>
                {cleanFeature}
              </span>
            </li>
          );
        })}
      </ul>
      
      <Button
        className="w-full py-5 text-base font-bold bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all"
        onClick={onCTA}
      >
        {dict.pricing.cards.master.button.replace(/🏆/g, '').trim()}
      </Button>
      
      {/* Trust Signal */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-600 font-medium">
          For Professionals • Priority Support (4h)
        </p>
      </div>
    </div>
  );
}
