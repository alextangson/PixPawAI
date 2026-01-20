'use client';

import { Check, X, Lock, Sparkles } from 'lucide-react';

interface ComparisonFeature {
  name: string;
  free: string | boolean;
  starter: string | boolean;
  pro: string | boolean;
  master: string | boolean;
  highlight?: boolean;
}

interface ComparisonTableProps {
  dict: any;
}

export function PricingComparisonTable({ dict }: ComparisonTableProps) {
  // Safe access with fallbacks
  const comparisonDict = dict?.pricing?.comparisonTable || {};
  const featuresDict = comparisonDict.features || {};
  
  const features: ComparisonFeature[] = [
    {
      name: featuresDict.generations || 'Generation Credits',
      free: '1-2',
      starter: '15',
      pro: '50',
      master: '200',
    },
    {
      name: featuresDict.multiSelect || 'Multi-Image Selection',
      free: false,
      starter: false,
      pro: '3 choices',
      master: '5 choices',
      highlight: true,
    },
    {
      name: featuresDict.resolution || 'Image Resolution',
      free: '1024px',
      starter: '1024px',
      pro: '2048px',
      master: '4096px (4K)',
    },
    {
      name: featuresDict.aspectRatios || 'Aspect Ratios',
      free: '2 basic',
      starter: 'All 9 types',
      pro: 'All + Custom',
      master: 'Full Custom',
    },
    {
      name: featuresDict.styles || 'Available Styles',
      free: '3 basic',
      starter: '8 styles',
      pro: '15 styles',
      master: '30+ styles',
    },
    {
      name: featuresDict.inpainting || 'Partial Redraw (Inpainting)',
      free: false,
      starter: false,
      pro: 'Coming Soon',
      master: 'Coming Soon',
    },
    {
      name: featuresDict.refinement || 'Image Refinement',
      free: false,
      starter: false,
      pro: '1x per image',
      master: '3x per image',
    },
    {
      name: featuresDict.styleMixing || 'Style Mixing',
      free: false,
      starter: false,
      pro: false,
      master: true,
      highlight: true,
    },
    {
      name: featuresDict.batchDownload || 'Batch Download',
      free: false,
      starter: false,
      pro: 'ZIP package',
      master: 'ZIP + RAW',
    },
    {
      name: featuresDict.processingSpeed || 'Processing Speed',
      free: 'Standard',
      starter: 'Standard',
      pro: 'Standard',
      master: '2x Priority',
    },
    {
      name: featuresDict.commercialLicense || 'Commercial License',
      free: false,
      starter: 'Personal',
      pro: 'Social Media',
      master: 'Full Rights',
    },
    {
      name: featuresDict.merchDiscount || 'Physical Products Discount',
      free: false,
      starter: false,
      pro: '10% off',
      master: '20% off',
    },
    {
      name: featuresDict.support || 'Customer Support',
      free: 'Community',
      starter: 'Email (48h)',
      pro: 'Email (24h)',
      master: 'Priority (4h)',
    },
  ];

  const renderCell = (value: string | boolean, tier: string, isHighlight?: boolean) => {
    if (typeof value === 'boolean') {
      if (value) {
        return <Check className="w-5 h-5 text-green-500 mx-auto" />;
      } else {
        return <X className="w-5 h-5 text-gray-300 mx-auto" />;
      }
    }

    // Check if it's a "Coming Soon" feature
    if (value === 'Coming Soon' || (typeof value === 'string' && value.includes('🔒'))) {
      return (
        <div className="flex items-center justify-center gap-1 text-gray-500">
          <Lock className="w-4 h-4" />
          <span className="text-sm">{dict?.pricing?.comparisonTable?.comingSoon || 'Coming Soon'}</span>
        </div>
      );
    }

    const textColorClass = tier === 'pro' || tier === 'master' ? 'text-gray-900 font-semibold' : 'text-gray-700';
    const bgClass = isHighlight ? 'bg-orange-50' : '';

    return (
      <span className={`${textColorClass} ${bgClass} px-2 py-1 rounded`}>
        {value}
      </span>
    );
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {comparisonDict.title || 'Detailed Feature Comparison'}
        </h2>
        <p className="text-gray-600">
          {comparisonDict.subtitle || 'See exactly what you get with each plan'}
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-2xl shadow-lg overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-white">
              <th className="text-left p-4 font-bold text-gray-900 border-b-2 border-gray-200">
                Feature
              </th>
              <th className="text-center p-4 font-bold text-gray-700 border-b-2 border-gray-200">
                Free
              </th>
              <th className="text-center p-4 font-bold text-gray-700 border-b-2 border-gray-200">
                Starter
              </th>
              <th className="text-center p-4 font-bold bg-orange-50 border-b-2 border-coral">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-coral fill-coral" />
                  <span className="text-coral">Pro</span>
                </div>
              </th>
              <th className="text-center p-4 font-bold bg-gradient-to-br from-amber-50 to-orange-50 border-b-2 border-amber-400">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-amber-700">Master 🏆</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr
                key={index}
                className={`border-b border-gray-100 ${
                  feature.highlight ? 'bg-orange-50/30' : 'hover:bg-gray-50'
                } transition-colors`}
              >
                <td className="p-4 font-medium text-gray-900">
                  {feature.name}
                  {feature.highlight && (
                    <Sparkles className="inline-block w-4 h-4 ml-2 text-coral" />
                  )}
                </td>
                <td className="p-4 text-center">{renderCell(feature.free, 'free', feature.highlight)}</td>
                <td className="p-4 text-center">{renderCell(feature.starter, 'starter', feature.highlight)}</td>
                <td className="p-4 text-center bg-orange-50/50">
                  {renderCell(feature.pro, 'pro', feature.highlight)}
                </td>
                <td className="p-4 text-center bg-gradient-to-br from-amber-50/50 to-orange-50/50">
                  {renderCell(feature.master, 'master', feature.highlight)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 sm:space-y-4">
        {['free', 'starter', 'pro', 'master'].map((tier) => (
          <div
            key={tier}
            className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 ${
              tier === 'pro'
                ? 'border-coral'
                : tier === 'master'
                ? 'border-amber-400'
                : 'border-gray-200'
            }`}
          >
            <h3 className="text-xl font-bold mb-4 capitalize flex items-center gap-2">
              {tier === 'pro' && <Sparkles className="w-5 h-5 text-coral" />}
              {tier}
              {tier === 'master' && ' 🏆'}
            </h3>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{feature.name}</span>
                  <div className="ml-2">
                    {renderCell(
                      feature[tier as keyof Omit<ComparisonFeature, 'name' | 'highlight'>],
                      tier,
                      feature.highlight
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
