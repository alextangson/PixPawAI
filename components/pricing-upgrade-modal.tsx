'use client';

import { useEffect } from 'react';
import { X, Sparkles, Check, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { trackUpgradeModalShown, trackUpgradeModalClick } from '@/lib/pricing-analytics';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  variant?: 'A' | 'B' | 'C';
  dict?: any;
}

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  onUpgrade,
  variant = 'A',
  dict 
}: UpgradeModalProps) {
  // Track modal shown
  useEffect(() => {
    if (isOpen) {
      trackUpgradeModalShown(variant);
    }
  }, [isOpen, variant]);

  const handleUpgrade = () => {
    trackUpgradeModalClick('upgrade', variant);
    onUpgrade();
  };

  const handleDismiss = () => {
    trackUpgradeModalClick('dismiss', variant);
    onClose();
  };

  // Different messaging based on A/B test variant
  const upgradeModalDict = dict?.pricing?.upgradeModal || {};
  
  const getHeadline = () => {
    switch (variant) {
      case 'A':
        return upgradeModalDict.headlineA || 'Want better results?';
      case 'B':
        return upgradeModalDict.headlineB || 'Get more choices';
      case 'C':
        return upgradeModalDict.headlineC || 'Upgrade to Pro';
      default:
        return upgradeModalDict.headlineA || 'Want better results?';
    }
  };

  const getSubheadline = () => {
    switch (variant) {
      case 'A':
        return upgradeModalDict.subheadlineA || 'Pro users generate 3 images and pick the best one';
      case 'B':
        return upgradeModalDict.subheadlineB || 'Upgrade to Pro for multi-image selection';
      case 'C':
        return upgradeModalDict.subheadlineC || 'Generate 3 images and pick your favorite';
      default:
        return upgradeModalDict.subheadlineA || 'Pro users generate 3 images and pick the best one';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-gradient-to-br from-white to-orange-50">
        {/* Accessible title for screen readers */}
        <DialogTitle className="sr-only">Upgrade to Pro Plan</DialogTitle>
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 z-10 rounded-full p-2 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {getHeadline()}
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              {getSubheadline()}
            </p>
          </div>

          {/* Feature Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
            <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 text-center">
              <div className="text-sm text-gray-600 mb-2">Free Plan</div>
              <div className="text-4xl font-bold text-gray-600 mb-1">1</div>
              <div className="text-xs text-gray-500">Image per generation</div>
            </div>
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200 text-center">
              <div className="text-sm text-gray-600 mb-2">Pro Plan</div>
              <div className="text-4xl font-bold text-green-600 mb-1">3</div>
              <div className="text-xs text-gray-500">Images to choose from</div>
            </div>
          </div>

          {/* Comparison Images Placeholder */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <div className="aspect-square bg-gray-100 rounded-xl border-2 border-gray-300 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="text-6xl mb-2">😕</div>
                    <div className="text-sm font-semibold text-gray-700">当前生成</div>
                    <div className="text-xs text-gray-500 mt-1">70分</div>
                  </div>
                </div>
              </div>
              <div className="relative md:col-span-2">
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-coral text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  Pro升级 →
                </div>
                <div className="grid grid-cols-3 gap-2 h-full">
                  {[85, 90, 95].map((score, i) => (
                    <div 
                      key={i}
                      className="aspect-square bg-gradient-to-br from-green-100 to-green-50 rounded-xl border-2 border-green-300 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                    >
                      <div className="text-center p-2">
                        <div className="text-4xl mb-1">😊</div>
                        <div className="text-xs font-semibold text-green-700">选项 {i + 1}</div>
                        <div className="text-xs text-green-600 mt-1">{score}分</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pro Features */}
          <div className="bg-white rounded-xl p-6 border-2 border-orange-200 mb-8">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-coral" />
              Pro用户专享特权
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">一次生成3张，选最满意的</div>
                  <div className="text-sm text-gray-600">不同角度、表情、光线，总有一张完美</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">2K高清下载（可打印A3尺寸）</div>
                  <div className="text-sm text-gray-600">免费版只有1K分辨率</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">精修细节功能（即将推出）</div>
                  <div className="text-sm text-gray-600">调整耳朵、眼神、背景等细节</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">50张生成额度</div>
                  <div className="text-sm text-gray-600">Perfect for 2-4 weeks of use</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Signal */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-center border border-blue-200">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-800">
              <Zap className="w-4 h-4" />
              <span className="font-semibold">Multi-image selection for better results</span>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Pick your favorite from 3 options
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleUpgrade}
              className="flex-1 py-6 text-lg font-bold bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white shadow-xl hover:shadow-2xl transition-all"
            >
              升级到 Pro - $19.99 🚀
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="sm:w-auto px-6 py-6 text-gray-600 hover:text-gray-800 border-2 border-gray-300"
            >
              继续使用免费版
            </Button>
          </div>

          {/* Trust Badge */}
          <div className="text-center mt-4 text-xs text-gray-500">
            🔒 安全支付 • 💯 不满意全额退款
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
