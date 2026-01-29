'use client';

import { BlogArticle } from '@/lib/wordpress/types';

interface HowToSchemaProps {
    articles: BlogArticle[];
    lang: string;
    currentUrl: string;
}

/**
 * ItemList Schema for How-to Articles
 * https://schema.org/ItemList
 */
export function ItemListSchema({ articles, lang }: { articles: BlogArticle[]; lang: string }) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com';

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'AI Pet Portrait Tutorials & Guides',
        description: 'Comprehensive tutorials and guides for creating stunning AI pet portraits',
        numberOfItems: articles.length,
        itemListElement: articles.map((article, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'Article',
                name: article.title,
                description: article.excerpt,
                url: `${siteUrl}/${lang}/how-to/${article.slug}`,
                image: article.coverImage?.url,
                datePublished: article.publishedAt,
                author: {
                    '@type': 'Person',
                    name: article.author.name,
                },
            },
        })),
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

/**
 * BreadcrumbList Schema
 * https://schema.org/BreadcrumbList
 */
export function BreadcrumbListSchema({ lang }: { lang: string }) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com';

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${siteUrl}/${lang}`,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'How-to Guides',
                item: `${siteUrl}/${lang}/how-to`,
            },
        ],
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

/**
 * CollectionPage Schema
 * https://schema.org/CollectionPage
 */
export function CollectionPageSchema({ lang }: { lang: string }) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com';

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'AI Pet Portrait Tutorials & Guides',
        description: 'Learn how to create perfect AI pet portraits with our comprehensive guides. From photo tips to style selection and printing advice.',
        url: `${siteUrl}/${lang}/how-to`,
        isPartOf: {
            '@type': 'WebSite',
            name: 'PixPaw AI',
            url: siteUrl,
        },
        about: {
            '@type': 'Thing',
            name: 'AI Pet Portrait Generation',
        },
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

/**
 * Combined Schema Component for How-to Page
 */
export function HowToSchema({ articles, lang }: { articles: BlogArticle[]; lang: string }) {
    return (
        <>
            <BreadcrumbListSchema lang={lang} />
            <CollectionPageSchema lang={lang} />
            {articles.length > 0 && <ItemListSchema articles={articles} lang={lang} />}
        </>
    );
}
