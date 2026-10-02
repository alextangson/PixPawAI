import { STYLES, type Style } from '@/lib/styles';
import type { ParsedFaqItem } from './faq';

// IDs, not display labels, define the style URLs listed in the sitemap.
export function toStyleSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function findPortraitStyle(slug: string): Style | undefined {
  return STYLES.find((style) => toStyleSlug(style.id) === slug || toStyleSlug(style.label) === slug);
}

// Render these exact answers as visible text and FAQ JSON-LD.
export function getStyleFaqs(style: Style): ParsedFaqItem[] {
  return [
    {
      question: `What is the ${style.label} style?`,
      answer: style.description || `${style.label} is one of PixPaw AI's available pet portrait styles.`,
    },
    {
      question: `How do I prepare a photo for the ${style.label} style?`,
      answer: 'Use a clear, well-lit pet photo with the face visible. AI-generated details can differ from the source photo, so review your portrait before downloading or ordering a print.',
    },
    {
      question: 'Can I try other styles?',
      answer: 'Yes. Choose another available style in the portrait generator to compare results. Additional generations use your available generation credits or free tries.',
    },
    {
      question: 'Are downloads watermark-free?',
      answer: 'Free downloads include a watermark. Watermark-free downloads depend on a paid credit pack or a completed HD unlock for that portrait. Compare the options on the Pricing page.',
    },
  ];
}
