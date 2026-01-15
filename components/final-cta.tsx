import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FinalCtaProps {
  dict: {
    finalCta: {
      title: string;
      subtitle: string;
      cta: string;
    };
  };
  lang: string;
  onOpenUpload: () => void;
}

export function FinalCta({ dict, lang, onOpenUpload }: FinalCtaProps) {
  return (
    <section className="py-20 bg-[#FF8C42] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32">
          <Sparkles className="w-full h-full text-white" />
        </div>
        <div className="absolute bottom-10 right-10 w-40 h-40">
          <Sparkles className="w-full h-full text-white" />
        </div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 transform -translate-y-1/2">
          <Sparkles className="w-full h-full text-white" />
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="text-center">
          {/* Sparkle Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            {dict.finalCta.title}
          </h2>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            {dict.finalCta.subtitle}
          </p>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={onOpenUpload}
            className="bg-white text-[#FF8C42] hover:bg-gray-100 text-lg px-8 py-6 h-auto font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
          >
            {dict.finalCta.cta}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          {/* Trust Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-white/80 text-sm">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>100% Risk-Free • Love it or Money Back</span>
          </div>
        </div>
      </div>
    </section>
  );
}
