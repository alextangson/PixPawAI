import type { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionary';
import type { Locale } from '@/lib/i18n-config';
import { Mail, MessageCircle, Twitter } from 'lucide-react';
import { DEFAULT_OG_IMAGE_URL, DEFAULT_TWITTER_IMAGE_URL, SEO_SITE_URL } from '@/lib/seo/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const pageUrl = `${SEO_SITE_URL}/${lang}/contact`;

  return {
    title: 'Contact Us - PixPaw AI',
    description: 'Get in touch with the PixPaw AI team for support, inquiries, or privacy-related requests.',
    alternates: { canonical: pageUrl },
    openGraph: {
      title: 'Contact Us - PixPaw AI',
      description: 'Reach out to PixPaw AI for support, feedback, or privacy requests.',
      url: pageUrl,
      type: 'website',
      images: [{ url: DEFAULT_OG_IMAGE_URL, width: 1200, height: 630, alt: 'Contact PixPaw AI' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Contact Us - PixPaw AI',
      description: 'Reach out to PixPaw AI for support, feedback, or privacy requests.',
      images: [DEFAULT_TWITTER_IMAGE_URL],
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <main className="min-h-screen bg-cream py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-600">
            We'd love to hear from you! Reach out with any questions or feedback.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <a 
            href="mailto:support@pixpawai.com"
            className="bg-white rounded-2xl shadow-sm p-8 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-coral to-purple rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Email Support</h2>
            <p className="text-gray-600 mb-3">
              For general inquiries, support, or feedback
            </p>
            <p className="text-coral font-semibold group-hover:underline">
              support@pixpawai.com
            </p>
          </a>

          <a 
            href="mailto:privacy@pixpawai.com"
            className="bg-white rounded-2xl shadow-sm p-8 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Privacy & Data</h2>
            <p className="text-gray-600 mb-3">
              For privacy-related questions or data requests
            </p>
            <p className="text-blue-600 font-semibold group-hover:underline">
              privacy@pixpawai.com
            </p>
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How long does it take to generate an image?</h3>
              <p className="text-gray-600">
                Most images are generated in 30-60 seconds. Complex styles may take up to 2 minutes.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What if I'm not happy with my generation?</h3>
              <p className="text-gray-600">
                We offer a first-time satisfaction guarantee! Click "Not quite" to get an automatic 
                credit refund and try again.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I use my artwork commercially?</h3>
              <p className="text-gray-600">
                Generated artworks are licensed for personal use. For commercial licensing, 
                please contact us at support@pixpawai.com.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What image formats do you accept?</h3>
              <p className="text-gray-600">
                We accept JPG, PNG, and WEBP formats. Images should be clear, well-lit, and 
                show your pet's face clearly.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How do I delete my account?</h3>
              <p className="text-gray-600">
                To delete your account and all associated data, please email us at 
                privacy@pixpawai.com with your request.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Response time: We typically respond within 24 hours on business days.
          </p>
          <p className="text-sm text-gray-500">
            Made with ❤️ for pet lovers worldwide
          </p>
        </div>
      </div>
    </main>
  );
}
