import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Sparkles, ArrowRight, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Locale } from '@/lib/i18n-config';
import { getBlogArticles, getFeaturedArticleByHub } from '@/lib/wordpress/blog';
import { BlogBreadcrumb } from '@/components/blog/blog-breadcrumb';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;

  return {
    title: 'Pet Stories & Guides - PixPaw AI Blog',
    description:
      'Stories about pet love, loss, and remembrance. Thoughtful guides on memorial portraits, gift ideas, and honoring the bond you share with your pet.',
    openGraph: {
      title: 'Pet Stories & Guides - PixPaw AI Blog',
      description:
        'Thoughtful stories and guides about pet love, loss, and remembrance.',
      type: 'website',
    },
    alternates: {
      canonical: `https://pixpawai.com/${lang}/blog`,
    },
  };
}

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

  const breadcrumbItems = [
    { label: 'Home', href: `/${lang}` },
    { label: 'Blog' },
  ];

  return (
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
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/80 rounded-full shadow-md">
              <Sparkles className="w-5 h-5 text-amber-600" />
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
          </div>
        </div>
      </section>

      <section className="py-10 bg-white border-y border-stone-100">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-3xl bg-gradient-to-r from-stone-900 to-stone-800 text-white p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 text-amber-300 mb-3">
                  <Sparkles className="w-4 h-4" />
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
            </div>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="py-12 bg-stone-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {articles.length > 0 ? (
              <>
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
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
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
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-gradient-to-br from-stone-800 to-stone-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6">
              <Sparkles className="w-8 h-8 text-amber-300" />
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
          </div>
        </div>
      </section>
    </main>
  );
}
