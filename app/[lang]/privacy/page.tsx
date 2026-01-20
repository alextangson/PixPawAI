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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
            <div className="space-y-4">
              <p className="leading-relaxed">
                We use cookies and similar technologies to enhance your experience, maintain security, 
                and improve our services. By using PixPaw AI, you consent to our use of cookies.
              </p>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">6.1 Essential Cookies</h3>
                <p className="leading-relaxed">
                  Required for the website to function properly:
                </p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-sm">
                  <li><strong>Authentication:</strong> Keep you logged in (Supabase auth tokens)</li>
                  <li><strong>Session:</strong> Remember your preferences and settings</li>
                  <li><strong>Security:</strong> Protect against fraud and abuse</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">6.2 Payment Cookies</h3>
                <p className="leading-relaxed">
                  When you make a payment through PayPal, PayPal may set cookies to process your transaction 
                  securely. These cookies are governed by PayPal's privacy policy.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">6.3 Performance Cookies (Optional)</h3>
                <p className="leading-relaxed">
                  We may use analytics cookies to understand how users interact with our service and 
                  improve our features. You can opt out of these through your browser settings.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">6.4 Managing Cookies</h3>
                <p className="leading-relaxed">
                  You can control cookies through your browser settings. However, disabling essential 
                  cookies may affect your ability to use certain features of PixPaw AI.
                </p>
              </div>
            </div>
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
