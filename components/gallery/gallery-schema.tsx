/**
 * Gallery Schema Component
 * Adds ImageGallery structured data for SEO
 */

interface GalleryImage {
  id: string;
  output_url: string;
  title: string | null;
  alt_text: string | null;
}

interface GallerySchemaProps {
  images: GalleryImage[];
  url: string;
}

/**
 * ImageGallery Schema for SEO
 * https://schema.org/ImageGallery
 */
export function GallerySchema({ images, url }: GallerySchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: 'PixPaw AI Pet Portrait Gallery',
    description: 'Discover stunning AI-generated pet portraits in artistic styles',
    url: url,
    image: images.slice(0, 12).map((image) => ({
      '@type': 'ImageObject',
      contentUrl: image.output_url,
      name: image.title || 'AI Pet Portrait',
      description: image.alt_text || 'AI-generated pet portrait',
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
