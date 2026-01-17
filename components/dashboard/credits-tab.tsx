'use client'

import { Sparkles, Zap, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreditsTabProps {
  currentCredits: number
}

export function CreditsTab({ currentCredits }: CreditsTabProps) {
  const plans = [
    {
      id: 'starter',
      name: 'Starter Pack',
      price: '$4.99',
      credits: 15,
      icon: Sparkles,
      features: [
        '15 High-Res Generations',
        'No Watermarks',
        'All 9 Aspect Ratios',
        '8 Style Options',
        'Personal Use License',
      ],
    },
    {
      id: 'pro',
      name: 'Pro Bundle',
      price: '$19.99',
      credits: 50,
      icon: Crown,
      badge: 'Best Value',
      features: [
        '50 Generation Credits',
        '✨ 3-Image Selection',
        '2K High Resolution',
        '15 Premium Styles',
        '10% Off Physical Products',
      ],
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Current Balance */}
      <div className="bg-gradient-to-r from-coral to-orange-600 rounded-2xl p-8 mb-8 text-white text-center">
        <p className="text-white/80 text-sm mb-2">Your Current Balance</p>
        <p className="text-6xl font-bold mb-4">{currentCredits}</p>
        <p className="text-white/80">Credits Available</p>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {plans.map((plan) => {
          const Icon = plan.icon
          return (
            <div
              key={plan.id}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow relative"
            >
              {plan.badge && (
                <div className="absolute top-4 right-4 bg-coral text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-coral/10 rounded-full flex items-center justify-center">
                  <Icon className="w-6 h-6 text-coral" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-3xl font-bold text-coral">{plan.price}</p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                <span className="text-2xl font-bold text-gray-900">{plan.credits}</span> Credits
              </p>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full bg-coral hover:bg-orange-600 text-white font-semibold"
                onClick={() => window.location.href = '/en/pricing'}
              >
                Get {plan.name}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Free Credits Info */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
        <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Earn Free Credits
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Share your portraits to the gallery: +1 credit each</li>
          <li>• Refer a friend: +5 credits when they sign up</li>
          <li>• Follow us on social media: +2 credits</li>
        </ul>
      </div>
    </div>
  )
}
