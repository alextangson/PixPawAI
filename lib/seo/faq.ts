export interface ParsedFaqItem {
  question: string;
  answer: string;
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract FAQ pairs from WordPress HTML content.
 * Supports:
 * 1) <p><strong>Question?</strong></p><p>Answer</p>
 * 2) <h3>Question?</h3><p>Answer</p>
 */
export function extractFaqFromHtml(html: string): ParsedFaqItem[] {
  if (!html) {
    return [];
  }

  const faqHeadingMatch = html.match(/<h2[^>]*>\s*FAQ\s*<\/h2>/i);
  const contentStart = faqHeadingMatch
    ? (faqHeadingMatch.index ?? 0) + faqHeadingMatch[0].length
    : 0;

  const afterFaq = html.slice(contentStart);
  const nextH2 = afterFaq.match(/<h2[^>]*>/i);
  const faqSection = nextH2 ? afterFaq.slice(0, nextH2.index) : afterFaq;

  const results: ParsedFaqItem[] = [];
  const seen = new Set<string>();

  const strongPattern = /<p[^>]*>\s*<strong>([\s\S]*?)<\/strong>\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let strongMatch: RegExpExecArray | null;
  while ((strongMatch = strongPattern.exec(faqSection)) !== null) {
    const question = stripHtml(strongMatch[1]);
    const answer = stripHtml(strongMatch[2]);

    if (!question || !answer || seen.has(question.toLowerCase())) {
      continue;
    }

    seen.add(question.toLowerCase());
    results.push({ question, answer });
  }

  if (results.length > 0) {
    return results;
  }

  const headingPattern = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let headingMatch: RegExpExecArray | null;
  while ((headingMatch = headingPattern.exec(faqSection)) !== null) {
    const question = stripHtml(headingMatch[1]);
    const answer = stripHtml(headingMatch[2]);

    if (!question || !answer || seen.has(question.toLowerCase())) {
      continue;
    }

    seen.add(question.toLowerCase());
    results.push({ question, answer });
  }

  return results;
}
