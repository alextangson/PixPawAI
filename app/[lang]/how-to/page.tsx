import Link from 'next/link';
import { Camera, Palette, Printer, Wrench, Mail, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Locale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/dictionary';
import { getBlogArticles, getFeaturedArticle } from '@/lib/wordpress/blog';
import { BLOG_CATEGORIES } from '@/lib/constants/blog-categories';
import { BlogArticleCard } from '@/components/blog/blog-article-card';
import type { Metadata } from 'next';

const ICON_MAP = {
  camera: Camera,
  palette: Palette,
  printer: Printer,
  wrench: Wrench,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;

  return {
    title: 'AI Pet Portrait Tutorials & Guides - PixPaw AI',
    description: 'Learn how to create perfect AI pet portraits with our comprehensive guides. From photo tips to style selection and printing advice.',
    openGraph: {
      title: 'AI Pet Portrait Tutorials & Guides - PixPaw AI',
      description: 'Master the art of AI pet portraits with expert tutorials and guides',
      type: 'website',
    },
    alternates: {
      canonical: `/${lang}/how-to`,
    },
  };
}

export default async function HowToGuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { lang } = await params;
  const { category } = await searchParams;
  const dict = await getDictionary(lang);

  // Fetch articles from WordPress
  const [featuredArticle, allArticles] = await Promise.all([
    getFeaturedArticle(),
    getBlogArticles({ category, perPage: 12 }),
  ]);

  // Filter out featured article from the list
  const articles = featuredArticle
    ? allArticles.filter(article => article.id !== featuredArticle.id)
    : allArticles;

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
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/80 rounded-full shadow-md">
              <BookOpen className="w-5 h-5 text-coral" />
              <span className="text-sm font-semibold text-gray-700">Knowledge Center</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
              AI Pet Portrait Tutorials & Guides
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed">
              Master the art of creating stunning AI pet portraits with expert tips and tricks
            </p>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {featuredArticle && (
        <section className="py-16 -mt-12 relative z-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <BlogArticleCard article={featuredArticle} featured lang={lang} />
            </div>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
              <Link
                href={`/${lang}/how-to`}
                className={`px-6 py-3 rounded-full font-semibold transition-all ${!category
                    ? 'bg-gradient-to-r from-coral to-orange-600 text-white shadow-md'
                    : 'bg-cream text-gray-700 hover:bg-gray-200'
                  }`}
              >
                All Articles
              </Link>

              {BLOG_CATEGORIES.map((cat) => {
                const IconComponent = ICON_MAP[cat.icon as keyof typeof ICON_MAP];

                return (
                  <Link
                    key={cat.slug}
                    href={`/${lang}/how-to?category=${cat.slug}`}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${category === cat.slug
                        ? 'bg-gradient-to-r from-coral to-orange-600 text-white shadow-md'
                        : 'bg-cream text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {cat.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article) => (
                  <BlogArticleCard key={article.id} article={article} lang={lang} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Articles Yet</h3>
                <p className="text-gray-600 mb-8">
                  {category
                    ? 'No articles found in this category. Try browsing all articles.'
                    : 'We are working on creating helpful content for you. Check back soon!'}
                </p>
                {category && (
                  <Link href={`/${lang}/how-to`}>
                    <Button variant="outline" className="border-2 border-coral text-coral hover:bg-coral hover:text-white">
                      View All Articles
                    </Button>
                  </Link>
                )}
              </div>
            )}
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

      {/* CTA to Try Product */}
      {articles.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Ready to Create Your Own?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Turn your pet into a stunning AI portrait in just 30 seconds
              </p>
              <Link href={`/${lang}`}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold px-12 py-7 text-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  Try PixPaw AI Now
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
