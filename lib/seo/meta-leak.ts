/**
 * WordPress / Yoast sometimes dumps "Meta Title:" / "Meta Description:"
 * into the post excerpt. Strip those labels so listings never show the leak.
 */
export function stripSeoMetaLeak(text: string): string {
  if (!text) return text;

  const descriptionMatch = text.match(/Meta Description:\s*([\s\S]+)/i);
  if (descriptionMatch) {
    return descriptionMatch[1].replace(/\s+/g, ' ').trim();
  }

  if (/Meta Title:/i.test(text)) {
    return text
      .replace(/Meta Title:\s*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return text.replace(/\s+/g, ' ').trim();
}
