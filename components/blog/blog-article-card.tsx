import Link from 'next/link';
import Image from 'next/image';
import { Clock, Calendar } from 'lucide-react';
import { BlogArticle } from '@/lib/wordpress/types';
import { cn } from '@/lib/utils';

interface BlogArticleCardProps {
  article: BlogArticle;
  featured?: boolean;
  lang?: string;
}

export function BlogArticleCard({ article, featured = false, lang = 'en' }: BlogArticleCardProps) {
  const formattedDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link
      href={`/${lang}/how-to/${article.slug}`}
      className={cn(
        'group block bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-coral hover:shadow-xl transition-all duration-300',
        featured && 'md:col-span-2 lg:col-span-3'
      )}
    >
      {/* Cover Image */}
      {article.coverImage && (
        <div className={cn(
          'relative w-full overflow-hidden bg-gray-100',
          featured ? 'h-64 md:h-96' : 'h-48'
        )}>
          <Image
            src={article.coverImage.url}
            alt={article.coverImage.alt}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes={featured ? '(max-width: 768px) 100vw, 80vw' : '(max-width: 768px) 100vw, 33vw'}
          />
        </div>
      )}

      {/* Content */}
      <div className={cn('p-6', featured && 'md:p-8')}>
        {/* Category Badge */}
        <div className="inline-block mb-3">
          <span className="bg-gradient-to-r from-coral to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            {article.category.name}
          </span>
        </div>

        {/* Title */}
        <h3 className={cn(
          'font-bold text-gray-900 mb-3 group-hover:text-coral transition-colors line-clamp-2',
          featured ? 'text-2xl md:text-3xl' : 'text-xl'
        )}>
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className={cn(
          'text-gray-600 mb-4 line-clamp-3',
          featured ? 'text-base md:text-lg' : 'text-sm'
        )}>
          {article.excerpt}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{article.readingTime} min read</span>
          </div>
        </div>

        {/* Read More Link */}
        <div className="mt-4 inline-flex items-center text-coral font-semibold group-hover:gap-3 transition-all">
          Read More
          <span className="ml-2 group-hover:ml-0 transition-all">→</span>
        </div>
      </div>
    </Link>
  );
}
