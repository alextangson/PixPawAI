import Link from 'next/link';
import { Palette, Printer, Wrench, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Locale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/dictionary';
import Image from 'next/image';

const ICON_MAP = {
  palette: Palette,
  printer: Printer,
  wrench: Wrench,
};

export default async function HowToGuidePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-orange-50 via-cream to-white overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-20 w-64 h-64 bg-orange-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-orange-100 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
              {dict.howToGuide.hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              {dict.howToGuide.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Featured Guide - "Must Read" */}
      <section className="py-16 -mt-12 relative z-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-200">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left: Text Content */}
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="inline-block mb-4">
                  <span className="bg-gradient-to-r from-coral to-orange-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-md">
                    ⭐ {dict.howToGuide.featured.tag}
                  </span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {dict.howToGuide.featured.title}
                </h2>
                
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  {dict.howToGuide.featured.description}
                </p>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-2 border-coral text-coral hover:bg-coral hover:text-white transition-all font-bold"
                >
                  {dict.howToGuide.featured.button}
                </Button>
              </div>

              {/* Right: Do's and Don'ts Visual */}
              <div className="bg-gradient-to-br from-orange-50 to-cream p-8 md:p-12 flex items-center">
                <div className="w-full space-y-6">
                  {/* Do's Section */}
                  <div>
                    <h3 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-8 h-8" />
                      Do's ✅
                    </h3>
                    <ul className="space-y-3">
                      {dict.howToGuide.featured.dos.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-800 font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Don'ts Section */}
                  <div className="pt-4 border-t border-orange-200">
                    <h3 className="text-2xl font-bold text-red-700 mb-4 flex items-center gap-2">
                      <XCircle className="w-8 h-8" />
                      Don'ts ❌
                    </h3>
                    <ul className="space-y-3">
                      {dict.howToGuide.featured.donts.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Topic Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
              More Helpful Guides
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Everything you need to create stunning pet portraits
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {dict.howToGuide.topics.map((topic: any, index: number) => {
                const IconComponent = ICON_MAP[topic.icon as keyof typeof ICON_MAP];
                
                return (
                  <div
                    key={index}
                    className="group bg-cream rounded-2xl p-8 border-2 border-gray-200 hover:border-coral hover:shadow-xl transition-all duration-300 cursor-pointer"
                  >
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-coral to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-coral transition-colors">
                      {topic.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {topic.excerpt}
                    </p>

                    {/* Read More Link */}
                    <Link
                      href="#"
                      className="inline-flex items-center text-coral font-semibold group-hover:gap-3 transition-all"
                    >
                      Read More
                      <span className="ml-2 group-hover:ml-0 transition-all">→</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Help CTA */}
      <section className="py-16 bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-coral to-orange-600 rounded-full mb-6 shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {dict.howToGuide.helpCta.title}
            </h2>

            <p className="text-xl text-gray-600 mb-8">
              Our support team typically responds within 24 hours
            </p>

            <a href="mailto:support@pixpawai.com">
              <Button
                size="lg"
                className="bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold px-12 py-7 text-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                {dict.howToGuide.helpCta.button}
              </Button>
            </a>

            <p className="text-sm text-gray-500 mt-6">
              📧 support@pixpawai.com • 🕐 Mon-Fri, 9AM-5PM EST
            </p>
          </div>
        </div>
      </section>

      {/* Quick Tips Section */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Quick Tips for Success
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4 p-6 bg-cream rounded-xl border border-orange-100">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💡</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Use Natural Light</h4>
                  <p className="text-gray-600 text-sm">
                    Photos taken near a window during daytime produce the best AI results.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-cream rounded-xl border border-orange-100">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎯</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Fill the Frame</h4>
                  <p className="text-gray-600 text-sm">
                    Your pet's face should take up at least 60% of the photo.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-cream rounded-xl border border-orange-100">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔄</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Try Multiple Styles</h4>
                  <p className="text-gray-600 text-sm">
                    Different styles work better for different pets. Experiment!
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-6 bg-cream rounded-xl border border-orange-100">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Use the Regenerate Feature</h4>
                  <p className="text-gray-600 text-sm">
                    Not happy with the first result? Click "Regenerate" for a fresh take.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
