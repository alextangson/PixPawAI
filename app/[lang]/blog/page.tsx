import Link from 'next/link';
<<<<<<< HEAD
import { Camera, Palette, Printer, Wrench, Mail, BookOpen, Sparkles, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Locale } from '@/lib/i18n-config';
import { getDictionary } from '@/lib/dictionary';
import { getBlogArticles, getFeaturedArticleByHub } from '@/lib/wordpress/blog';
import { BLOG_CATEGORIES } from '@/lib/constants/blog-categories';
import { isHowToCategorySlug } from '@/lib/content-hubs';
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

=======
import Image from 'next/image';
import { BookOpen, Heart, ArrowRight, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Locale } from '@/lib/i18n-config';
import { getBlogArticles, getFeaturedArticleByHub } from '@/lib/wordpress/blog';
import { BlogBreadcrumb } from '@/components/blog/blog-breadcrumb';
import type { Metadata } from 'next';

>>>>>>> origin/main
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;

  return {
<<<<<<< HEAD
    title: 'AI Pet Portrait Tutorials & Guides - PixPaw AI',
    description: 'Learn how to create perfect AI pet portraits with our comprehensive guides. From photo tips to style selection and printing advice.',
    openGraph: {
      title: 'AI Pet Portrait Tutorials & Guides - PixPaw AI',
      description: 'Master the art of AI pet portraits with expert tutorials and guides',
=======
    title: 'Pet Stories & Guides - PixPaw AI Blog',
    description:
      'Stories about pet love, loss, and remembrance. Thoughtful guides on memorial portraits, gift ideas, and honoring the bond you share with your pet.',
    openGraph: {
      title: 'Pet Stories & Guides - PixPaw AI Blog',
      description:
        'Thoughtful stories and guides about pet love, loss, and remembrance.',
>>>>>>> origin/main
      type: 'website',
    },
    alternates: {
      canonical: `https://pixpawai.com/${lang}/blog`,
    },
  };
}

<<<<<<< HEAD
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
  const howToCategories = BLOG_CATEGORIES.filter((cat) => isHowToCategorySlug(cat.slug));

  // Fetch articles from WordPress
  const [featuredArticle, allArticles] = await Promise.all([
    getFeaturedArticleByHub('how-to'),
    getBlogArticles({ category, perPage: 12, hub: 'how-to' }),
  ]);

  // Filter out featured article from the list
  const articles = featuredArticle
    ? allArticles.filter(article => article.id !== featuredArticle.id)
    : allArticles;

  // Breadcrumb items
=======
export const revalidate = 3600;
export const dynamic = 'force-static';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;

  const [featuredArticle, allArticles] = await Promise.all([
    getFeaturedArticleByHub('blog'),
    getBlogArticles({ perPage: 12, hub: 'blog' }),
  ]);

  const articles = featuredArticle
    ? allArticles.filter((a) => a.id !== featuredArticle.id)
    : allArticles;

>>>>>>> origin/main
  const breadcrumbItems = [
    { label: 'Home', href: `/${lang}` },
    { label: 'Blog' },
  ];

  return (
<<<<<<< HEAD
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
=======
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative py-16 md:py-20 bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50/30 overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-10 right-20 w-64 h-64 bg-amber-100 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-stone-200 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto mb-8">
            <BlogBreadcrumb items={breadcrumbItems} />
>>>>>>> origin/main
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/80 rounded-full shadow-md">
<<<<<<< HEAD
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
              action={`/${lang}/blog`}
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
=======
              <Heart className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-semibold text-stone-700">
                Stories & Guides
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-stone-900 mb-6">
              Pet Stories & Guides
            </h1>
            <p className="text-lg md:text-xl text-stone-600 leading-relaxed">
              Thoughtful reads about pet love, loss, and the art of
              remembrance
            </p>
>>>>>>> origin/main
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* Category Filter - Enhanced Pill Buttons */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${lang}/blog`}
                className={`px-5 py-2.5 rounded-full font-semibold transition-all duration-200 ${!category
                  ? 'bg-gradient-to-r from-coral to-orange-600 text-white shadow-lg shadow-coral/30 scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
              >
                All Articles
              </Link>

              {howToCategories.map((cat) => {
                const IconComponent = ICON_MAP[cat.icon as keyof typeof ICON_MAP];
                const isActive = category === cat.slug;

                return (
                  <Link
                    key={cat.slug}
                    href={`/${lang}/blog?category=${cat.slug}`}
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
=======
      <section className="py-10 bg-white border-y border-stone-100">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-3xl bg-gradient-to-r from-stone-900 to-stone-800 text-white p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 text-amber-300 mb-3">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    Pet Memorial
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  A quiet place for pet loss and remembrance
                </h2>
                <p className="text-stone-300 leading-relaxed">
                  If you are looking for memorial portrait ideas, gift guidance,
                  or a gentle place to start, our Pet Memorial page was built
                  for that moment.
                </p>
              </div>

              <div>
                <Link href={`/${lang}/pet-memorial`}>
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-6">
                    Visit Pet Memorial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
>>>>>>> origin/main
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
<<<<<<< HEAD
                <Sparkles className="w-5 h-5 text-coral" />
                <span className="text-sm font-bold text-coral uppercase tracking-wide">Featured Guide</span>
              </div>
              <BlogArticleCard article={featuredArticle} featured lang={lang} basePath="how-to" />
=======
                <BookOpen className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-bold text-amber-700 uppercase tracking-wide">
                  Featured
                </span>
              </div>

              <Link
                href={`/${lang}/blog/${featuredArticle.slug}`}
                className="group block bg-stone-50 rounded-2xl overflow-hidden border-2 border-stone-200 hover:border-amber-600 hover:shadow-xl transition-all duration-300"
              >
                {featuredArticle.coverImage && (
                  <div className="relative w-full h-64 md:h-96 overflow-hidden bg-stone-100">
                    <Image
                      src={featuredArticle.coverImage.url}
                      alt={featuredArticle.coverImage.alt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 80vw"
                    />
                  </div>
                )}
                <div className="p-6 md:p-8">
                  <span className="inline-block bg-stone-700 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    {featuredArticle.category.name}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-stone-900 mb-3 group-hover:text-amber-700 transition-colors">
                    {featuredArticle.title}
                  </h3>
                  <p className="text-base md:text-lg text-stone-600 mb-4 line-clamp-3">
                    {featuredArticle.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-stone-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(featuredArticle.publishedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{featuredArticle.readingTime} min read</span>
                    </div>
                  </div>
                </div>
              </Link>
>>>>>>> origin/main
            </div>
          </div>
        </section>
      )}

      {/* Articles Grid */}
<<<<<<< HEAD
      <section className="py-12 bg-cream">
=======
      <section className="py-12 bg-stone-50">
>>>>>>> origin/main
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {articles.length > 0 ? (
              <>
<<<<<<< HEAD
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  {category ? `${BLOG_CATEGORIES.find(c => c.slug === category)?.name || 'Category'} Articles` : 'All Articles'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {articles.map((article) => (
                    <BlogArticleCard key={article.id} article={article} lang={lang} basePath="how-to" />
=======
                <h2 className="text-2xl font-bold text-stone-900 mb-8">
                  All Articles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {articles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/${lang}/blog/${article.slug}`}
                      className="group block bg-white rounded-2xl overflow-hidden border-2 border-stone-200 hover:border-amber-600 hover:shadow-xl transition-all duration-300"
                    >
                      {article.coverImage && (
                        <div className="relative w-full h-48 overflow-hidden bg-stone-100">
                          <Image
                            src={article.coverImage.url}
                            alt={article.coverImage.alt}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <span className="inline-block bg-stone-700 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                          {article.category.name}
                        </span>
                        <h3 className="text-xl font-bold text-stone-900 mb-3 group-hover:text-amber-700 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-stone-600 mb-4 line-clamp-3">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-stone-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(article.publishedAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{article.readingTime} min read</span>
                          </div>
                        </div>
                        <div className="mt-4 inline-flex items-center text-amber-700 font-semibold group-hover:gap-3 transition-all">
                          Read More
                          <span className="ml-2 group-hover:ml-0 transition-all">
                            →
                          </span>
                        </div>
                      </div>
                    </Link>
>>>>>>> origin/main
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
<<<<<<< HEAD
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
                  <Link href={`/${lang}/blog`}>
                    <Button variant="outline" className="border-2 border-coral text-coral hover:bg-coral hover:text-white">
                      View All Articles
                    </Button>
                  </Link>
                )}
=======
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-stone-400" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-2">
                  No Articles Yet
                </h3>
                <p className="text-stone-600">
                  We&apos;re working on thoughtful content for you. Check
                  back soon.
                </p>
>>>>>>> origin/main
              </div>
            )}
          </div>
        </div>
      </section>

<<<<<<< HEAD
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
                  Transform your pet photo into stunning AI art in just 30 seconds
                </p>
                <Link href={`/${lang}`}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-bold px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                  >
                    Create Your Pet Portrait Now
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
=======
      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-br from-stone-800 to-stone-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6">
              <Heart className="w-8 h-8 text-amber-300" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Every Pet Deserves to Be Remembered
            </h2>
            <p className="text-lg text-stone-300 mb-8">
              Turn your favorite photo into a timeless portrait
            </p>
            <Link href={`/${lang}`}>
              <Button
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-8 py-6 text-lg shadow-xl"
              >
                Create a Portrait
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
>>>>>>> origin/main
          </div>
        </div>
      </section>
    </main>
  );
}
