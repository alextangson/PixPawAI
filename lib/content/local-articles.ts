import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { marked } from 'marked';
import type { BlogArticle } from '@/lib/wordpress/types';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'articles');

interface LocalFrontmatter {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  category?: string;
}

function toSlug(fileName: string): string {
  return fileName
    .replace(/\.md$/i, '')
    .replace(/^article-\d+-/i, '')
    .trim();
}

function normalizeCategory(rawCategory?: string) {
  const slug = (rawCategory || 'guides')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const name = rawCategory?.trim() || 'Guides';
  return { slug, name };
}

function estimateReadingTime(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[[^\]]*]\([^)]*\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/[>*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildArticleFromMarkdown(fileName: string, source: string): BlogArticle {
  const parsed = matter(source);
  const data = (parsed.data || {}) as LocalFrontmatter;
  const slug = toSlug(fileName);
  const plainText = stripMarkdown(parsed.content);
  const category = normalizeCategory(data.category);
  const publishedAt = new Date('2026-03-01').toISOString();

  const html = marked.parse(parsed.content, {
    gfm: true,
    breaks: false,
    async: false,
  }) as string;

  const idSeed = slug
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return {
    id: 900000 + idSeed,
    slug,
    title: data.title || slug.replace(/-/g, ' '),
    excerpt: plainText.slice(0, 220),
    content: html,
    coverImage: null,
    category: {
      id: 9000 + idSeed,
      name: category.name,
      slug: category.slug,
    },
    author: {
      name: 'PixPaw Team',
      avatar: '',
    },
    publishedAt,
    updatedAt: publishedAt,
    readingTime: estimateReadingTime(plainText),
    isFeatured: false,
    seoKeywords: Array.isArray(data.keywords) ? data.keywords : [],
    metaTitle: data.metaTitle || data.title || 'PixPaw AI Blog',
    metaDescription:
      data.metaDescription ||
      plainText.slice(0, 155) ||
      'Pet portrait guides from PixPaw AI',
  };
}

export async function getLocalArticles(): Promise<BlogArticle[]> {
  try {
    const files = await fs.readdir(CONTENT_DIR);
    const markdownFiles = files.filter((file) => file.endsWith('.md') && file !== 'README.md');

    const articles = await Promise.all(
      markdownFiles.map(async (fileName) => {
        const filePath = path.join(CONTENT_DIR, fileName);
        const source = await fs.readFile(filePath, 'utf-8');
        return buildArticleFromMarkdown(fileName, source);
      })
    );

    return articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  } catch (error) {
    console.error('[LocalArticles] Failed to read local markdown articles:', error);
    return [];
  }
}

export async function getLocalArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const articles = await getLocalArticles();
  return articles.find((article) => article.slug === slug) || null;
}

export async function getLocalArticleSlugs(): Promise<string[]> {
  const articles = await getLocalArticles();
  return articles.map((article) => article.slug);
}
