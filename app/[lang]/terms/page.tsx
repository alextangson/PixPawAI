import { Metadata } from 'next';
import { getDictionary } from '@/lib/dictionary';
import { Locale } from '@/lib/i18n-config';

export const metadata: Metadata = {
  title: 'Terms of Service - PixPaw AI',
  description: 'Read the terms and conditions for using PixPaw AI services.',
};

export default async function TermsPage({
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
          Terms of Service
        </h1>
        
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using PixPaw AI, you accept and agree to be bound by these Terms of Service. 
              If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
            <p className="leading-relaxed">
              PixPaw AI provides AI-powered pet portrait generation services. We transform your pet photos 
              into artistic 3D Pixar-style artwork using advanced machine learning technology.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
            <p className="leading-relaxed">You agree to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
              <li>Provide accurate account information</li>
              <li>Only upload images you have the right to use</li>
              <li>Not use our service for illegal or harmful purposes</li>
              <li>Not attempt to circumvent our payment systems</li>
              <li>Respect the intellectual property rights of others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Payment and Refunds</h2>
            <p className="leading-relaxed">
              All purchases are final unless otherwise stated. We offer a first-time satisfaction guarantee: 
              if you're not satisfied with your first generation, we'll refund your credit. 
              See our Refund Policy for more details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property</h2>
            <p className="leading-relaxed">
              You retain ownership of your original photos. Generated artworks are licensed to you for personal use. 
              By sharing to our public gallery, you grant us a license to display your artwork on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. AI Generation Quality</h2>
            <p className="leading-relaxed">
              While we strive for high-quality results, AI-generated artwork may vary. We perform quality checks 
              before processing, but results depend on input image quality and our AI models' capabilities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="leading-relaxed">
              PixPaw AI is provided "as is" without warranties. We are not liable for any indirect, 
              incidental, or consequential damages arising from your use of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Account Termination</h2>
            <p className="leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms or 
              engage in fraudulent activity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
            <p className="leading-relaxed">
              We may modify these terms at any time. Continued use of our service after changes 
              constitutes acceptance of the new terms.
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
