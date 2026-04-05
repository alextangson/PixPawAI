import { BlogArticle } from '@/lib/wordpress/types';

interface BlogArticleSchemaProps {
  article: BlogArticle;
  url: string;
}

/**
 * Generate JSON-LD structured data for blog articles
 * Helps search engines understand the content
 * https://developers.google.com/search/docs/appearance/structured-data/article
 */
export function BlogArticleSchema({ article, url }: BlogArticleSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage ? [article.coverImage.url] : [],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author.name || 'PixPaw AI Team',
      url: 'https://pixpawai.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PixPaw AI',
      logo: {
        '@type': 'ImageObject',
        url: 'https://pixpawai.com/brand/logo-full.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    keywords: article.seoKeywords.join(', '),
    articleSection: article.category.name,
    wordCount: article.content.replace(/<[^>]*>/g, '').split(/\s+/).length,
    timeRequired: `PT${article.readingTime}M`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Breadcrumb Schema for SEO
 */
interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
