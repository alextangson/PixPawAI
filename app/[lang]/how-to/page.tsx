import Link from 'next/link';
import { Camera, Palette, Printer, Wrench, Mail, BookOpen, Sparkles, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Locale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/dictionary';
import { getBlogArticles, getFeaturedArticle } from '@/lib/wordpress/blog';
import { BLOG_CATEGORIES } from '@/lib/constants/blog-categories';
import { BlogArticleCard } from '@/components/blog/blog-article-card';
import { HowToSchema } from '@/components/how-to/how-to-schema';
import { Breadcrumb } from '@/components/how-to/breadcrumb';
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
      canonical: `https://pixpawai.com/${lang}/how-to`,
    },
  };
}

// Enable Static Site Generation with Incremental Static Regeneration
// Page will be statically generated at build time and revalidated every hour
export const revalidate = 3600;
export const dynamic = 'force-static';

export default async function HowToGuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { lang } = await params;
  const { category, q } = await searchParams;
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

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: `/${lang}` },
    { label: 'How-to Guides' },
  ];

  return (
    <main className="min-h-screen bg-cream">
      {/* JSON-LD Schemas */}
      <HowToSchema articles={allArticles} lang={lang} />

      {/* Hero Section */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-orange-50 via-cream to-white overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-20 w-64 h-64 bg-orange-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-orange-100 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <div className="max-w-6xl mx-auto mb-8">
            <Breadcrumb items={breadcrumbItems} />
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/80 rounded-full shadow-md">
              <BookOpen className="w-5 h-5 text-coral" />
              <span className="text-sm font-semibold text-gray-700">Knowledge Center</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
              AI Pet Portrait Tutorials & Guides
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8">
              Master the art of creating stunning AI pet portraits with expert tips and tricks
            </p>

            {/* Search Box */}
            <form
              action={`/${lang}/how-to`}
              method="GET"
              className="max-w-xl mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={q}
                  placeholder="Search tutorials... (e.g., Royal Portrait, Photo Tips)"
                  className="w-full pl-12 pr-28 py-4 bg-white border-2 border-gray-200 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:border-coral shadow-lg transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-coral hover:bg-orange-600 text-white font-semibold rounded-full transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Category Filter - Enhanced Pill Buttons */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${lang}/how-to`}
                className={`px-5 py-2.5 rounded-full font-semibold transition-all duration-200 ${!category
                  ? 'bg-gradient-to-r from-coral to-orange-600 text-white shadow-lg shadow-coral/30 scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
              >
                All Articles
              </Link>

              {BLOG_CATEGORIES.map((cat) => {
                const IconComponent = ICON_MAP[cat.icon as keyof typeof ICON_MAP];
                const isActive = category === cat.slug;

                return (
                  <Link
                    key={cat.slug}
                    href={`/${lang}/how-to?category=${cat.slug}`}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-all duration-200 ${isActive
                      ? 'bg-gradient-to-r from-coral to-orange-600 text-white shadow-lg shadow-coral/30 scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
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

      {/* Featured Article */}
      {featuredArticle && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-coral" />
                <span className="text-sm font-bold text-coral uppercase tracking-wide">Featured Guide</span>
              </div>
              <BlogArticleCard article={featuredArticle} featured lang={lang} />
            </div>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="py-12 bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {articles.length > 0 ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  {category ? `${BLOG_CATEGORIES.find(c => c.slug === category)?.name || 'Category'} Articles` : 'All Articles'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {articles.map((article) => (
                    <BlogArticleCard key={article.id} article={article} lang={lang} />
                  ))}
                </div>
              </>
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

      {/* Combined CTA Section - Split Layout */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left: Product CTA */}
              <div className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-coral to-orange-600 rounded-2xl mb-6 shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Create Magic?
                </h2>
                <p className="text-lg text-gray-300 mb-6">
                  See your pet in stunning 3D animation in just 30 seconds
                </p>
                <Link href={`/${lang}`}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                  >
                    See Your Pet in 3D Animation Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Right: Support CTA */}
              <div className="text-center md:text-left md:pl-8 md:border-l md:border-gray-700">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  {dict.howToGuide.helpCta.title}
                </h3>
                <p className="text-gray-300 mb-6">
                  Our support team typically responds within 24 hours
                </p>
                <a href="mailto:support@pixpawai.com">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-6"
                  >
                    {dict.howToGuide.helpCta.button}
                  </Button>
                </a>
                <p className="text-sm text-gray-400 mt-4">
                  📧 support@pixpawai.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
