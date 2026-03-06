import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, ArrowLeft, Sparkles } from 'lucide-react';
import { type Locale } from '@/lib/i18n-config';
import { getBlogArticleForHub, getRelatedArticles, getAllArticleSlugs } from '@/lib/wordpress/blog';
import { BlogBreadcrumb } from '@/components/blog/blog-breadcrumb';
import { BlogTableOfContents } from '@/components/blog/blog-table-of-contents';
import { BlogSocialShare } from '@/components/blog/blog-social-share';
import { BlogRelatedArticles } from '@/components/blog/blog-related-articles';
import { BlogArticleSchema, BreadcrumbSchema } from '@/components/blog/blog-article-schema';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';

interface ArticlePageProps {
  params: Promise<{
    lang: Locale;
    slug: string;
  }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getBlogArticleForHub(slug, 'how-to');

  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    keywords: article.seoKeywords,
    alternates: {
      canonical: `https://pixpawai.com/en/how-to/${slug}`,
    },
    openGraph: {
      type: 'article',
      title: article.metaTitle,
      description: article.metaDescription,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author.name],
      images: article.coverImage ? [
        {
          url: article.coverImage.url,
          width: article.coverImage.width,
          height: article.coverImage.height,
          alt: article.coverImage.alt,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.metaTitle,
      description: article.metaDescription,
      images: article.coverImage ? [article.coverImage.url] : [],
    },
  };
}

// Generate static params for all articles (ISR)
export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs({ hub: 'how-to' });

  // Generate for all supported languages
  const params: Array<{ lang: string; slug: string }> = [];
  const languages = ['en']; // Add more languages as needed

  for (const lang of languages) {
    for (const slug of slugs) {
      params.push({ lang, slug });
    }
  }

  return params;
}

// Revalidate every hour
export const revalidate = 3600;
export const dynamicParams = true;

export default async function BlogArticlePage({ params }: ArticlePageProps) {
  const { lang, slug } = await params;
  const article = await getBlogArticleForHub(slug, 'how-to');

  if (!article) {
    notFound();
  }

  // Fetch related articles
  const relatedArticles = await getRelatedArticles(article.category.id, article.id, 3, 'how-to');

  // Format date
  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: `/${lang}` },
    { label: 'How-to Guide', href: `/${lang}/how-to` },
    { label: article.title },
  ];

  // Build full URL for social share
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com';
  const articleUrl = `${siteUrl}/${lang}/how-to/${article.slug}`;

  return (
    <>
      {/* JSON-LD Schemas */}
      <BlogArticleSchema article={article} url={articleUrl} />
      <BreadcrumbSchema
        items={breadcrumbItems.map((item) => ({
          name: item.label,
          url: item.href ? `${siteUrl}${item.href}` : articleUrl,
        }))}
      />

      <article className="min-h-screen bg-cream">
        {/* Back Button - Mobile */}
        <div className="lg:hidden sticky top-16 z-10 bg-cream/95 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-3">
            <Link
              href={`/${lang}/how-to`}
              className="inline-flex items-center gap-2 text-coral font-semibold hover:gap-3 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Articles
            </Link>
          </div>
        </div>

        {/* Article Header */}
        <header className="pt-12 pb-8 bg-gradient-to-br from-orange-50 via-cream to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumb */}
              <BlogBreadcrumb items={breadcrumbItems} />

              {/* Category Badge */}
              <div className="mb-4">
                <Link
                  href={`/${lang}/how-to?category=${article.category.slug}`}
                  className="inline-block bg-gradient-to-r from-coral to-orange-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
                >
                  {article.category.name}
                </Link>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                {article.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-coral" />
                  <time dateTime={article.publishedAt}>{formattedDate}</time>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-coral" />
                  <span>{article.readingTime} min read</span>
                </div>
                <div className="flex items-center gap-2">
                  {article.author.avatar && (
                    <Image
                      src={article.author.avatar}
                      alt={article.author.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  <span>By {article.author.name}</span>
                </div>
              </div>

              {/* Excerpt */}
              <p className="text-xl text-gray-700 leading-relaxed">
                {article.excerpt}
              </p>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {article.coverImage && (
          <div className="container mx-auto px-4 mb-12">
            <div className="max-w-5xl mx-auto">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={article.coverImage.url}
                  alt={article.coverImage.alt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
              </div>
            </div>
          </div>
        )}

        {/* Article Content & Sidebar */}
        <div className="container mx-auto px-4 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
              {/* Main Content */}
              <div className="lg:col-span-9">
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-12 lg:p-16">
                  {/* Article Content */}
                  <div className="prose prose-lg md:prose-xl max-w-none 
                      prose-headings:font-bold prose-headings:text-gray-900
                      prose-h1:text-3xl prose-h1:md:text-4xl prose-h1:mt-8 prose-h1:mb-6 prose-h1:font-extrabold prose-h1:text-gray-900
                      prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-200 prose-h2:font-bold
                      prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:font-semibold
                      prose-h4:text-lg prose-h4:md:text-xl prose-h4:mt-6 prose-h4:mb-3 prose-h4:font-semibold
                      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-base prose-p:md:text-lg
                      prose-a:text-coral prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                      prose-strong:text-gray-900 prose-strong:font-bold
                      prose-ul:my-6 prose-ol:my-6
                      prose-li:text-gray-700 prose-li:my-2 prose-li:text-base prose-li:md:text-lg
                      prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
                      prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-coral prose-code:text-sm prose-code:font-mono
                      prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
                      prose-blockquote:border-l-4 prose-blockquote:border-coral prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:my-8">
                    <ReactMarkdown>
                      {article.content}
                    </ReactMarkdown>
                  </div>

                  {/* Keywords/Tags */}
                  {article.seoKeywords.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {article.seoKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-orange-50 text-coral text-sm font-medium rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Share */}
                <div className="mt-8">
                  <BlogSocialShare
                    title={article.title}
                    url={articleUrl}
                    excerpt={article.excerpt}
                  />
                </div>

                {/* CTA Banner */}
                <div className="mt-8 bg-gradient-to-br from-coral to-orange-600 rounded-2xl p-8 md:p-12 text-white text-center shadow-xl">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">
                    Ready to Create Your Pet Portrait?
                  </h3>
                  <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
                    Apply what you learned and turn your pet into stunning AI art in just 30 seconds
                  </p>
                  <Link href={`/${lang}`}>
                    <Button
                      size="lg"
                      className="bg-white text-coral hover:bg-gray-100 font-bold px-10 py-6 text-lg shadow-lg"
                    >
                      Try PixPaw AI Now
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Sidebar - Desktop Only */}
              <aside className="hidden lg:block lg:col-span-3">
                <div className="sticky top-24">
                  <BlogTableOfContents content={article.content} />
                </div>
              </aside>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <BlogRelatedArticles articles={relatedArticles} lang={lang} basePath="how-to" />
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <section className="py-16 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Explore More Guides
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Continue learning with our other helpful tutorials
              </p>
              <Link href={`/${lang}/how-to`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-coral text-coral hover:bg-coral hover:text-white font-bold px-10 py-6 text-lg"
                >
                  Browse All Articles
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </article>
    </>
  );
}
