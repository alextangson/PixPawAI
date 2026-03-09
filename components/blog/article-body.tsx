import React from 'react';
import ReactMarkdown from 'react-markdown';

interface BlogArticleBodyProps {
  content: string;
}

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

export function looksLikeHtmlContent(content: string): boolean {
  return HTML_TAG_PATTERN.test(content.trim());
}

export function BlogArticleBody({ content }: BlogArticleBodyProps) {
  if (!content.trim()) {
    return null;
  }

  if (looksLikeHtmlContent(content)) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return <ReactMarkdown>{content}</ReactMarkdown>;
}
