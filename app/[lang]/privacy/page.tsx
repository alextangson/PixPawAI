import { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n-config';

export const metadata: Metadata = {
  title: 'Privacy Policy - PixPaw AI',
  description: 'Learn how PixPaw AI protects your privacy and handles your data.',
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <main className="min-h-screen bg-cream py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">
          Privacy Policy
        </h1>
        
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="leading-relaxed">
              We collect information you provide when you create an account, upload pet photos, 
              and make purchases. This includes your email address, uploaded images, and payment information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="leading-relaxed">
              Your information is used to:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
              <li>Generate AI-powered pet portraits</li>
              <li>Process payments and deliver digital products</li>
              <li>Improve our AI models and services</li>
              <li>Send important account updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Security</h2>
            <p className="leading-relaxed">
              We use industry-standard encryption and security measures to protect your data. 
              Your images are stored securely and are only used for generating your personalized artwork.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Sharing Your Content</h2>
            <p className="leading-relaxed">
              When you share your generated artwork to our public gallery, it becomes visible to other users. 
              You can choose to keep your creations private at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="leading-relaxed">
              You have the right to access, modify, or delete your personal data at any time. 
              Contact us at privacy@pixpawai.com for any privacy-related requests.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies</h2>
            <p className="leading-relaxed">
              We use cookies to maintain your session and improve your experience. 
              By using PixPaw AI, you consent to our use of cookies as described in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any significant 
              changes via email or through our website.
            </p>
          </section>

          <p className="text-sm text-gray-500 pt-6 border-t">
            Last updated: January 18, 2026
          </p>
        </div>
      </div>
    </main>
  );
}
