import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight } from 'lucide-react';
import { BlogArticle } from '@/lib/wordpress/types';

interface BlogRelatedArticlesProps {
  articles: BlogArticle[];
  lang?: string;
  basePath?: 'how-to' | 'blog';
}

export function BlogRelatedArticles({
  articles,
  lang = 'en',
  basePath = 'how-to',
}: BlogRelatedArticlesProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-orange-50 to-cream rounded-3xl">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Related Articles
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/${lang}/${basePath}/${article.slug}`}
              className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-coral hover:shadow-lg transition-all duration-300"
            >
              {/* Cover Image */}
              {article.coverImage && (
                <div className="relative w-full h-40 overflow-hidden bg-gray-100">
                  <Image
                    src={article.coverImage.url}
                    alt={article.coverImage.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                {/* Category */}
                <span className="text-xs font-semibold text-coral uppercase tracking-wide">
                  {article.category.name}
                </span>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mt-2 mb-2 line-clamp-2 group-hover:text-coral transition-colors">
                  {article.title}
                </h3>

                {/* Reading Time */}
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{article.readingTime} min read</span>
                </div>

                {/* Read More */}
                <div className="mt-3 inline-flex items-center text-coral text-sm font-semibold group-hover:gap-2 transition-all">
                  Read More
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:ml-0 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
