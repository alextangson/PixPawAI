import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';

interface FooterProps {
  dict: {
    footer: {
      brand: {
        name: string;
        mission: string;
        charityStatement: string;
      };
      discover: {
        title: string;
        links: {
          pixarDogs: string;
          royalCats: string;
          searchGallery: string;
        };
      };
      support: {
        title: string;
        links: {
          faq: string;
          trackOrder: string;
          contactUs: string;
        };
      };
      legal: {
        title: string;
        links: {
          privacy: string;
          terms: string;
          refund: string;
        };
      };
      copyright: string;
      language: {
        label: string;
        languages: {
          en: string;
        };
      };
    };
  };
  lang: string;
}

export function Footer({ dict, lang }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 md:gap-8 mb-8">
          {/* Column 1: Brand & Mission */}
          <div className="md:col-span-1">
            <Link href={`/${lang}`} className="flex items-center gap-2 mb-4 group">
              <div className="relative w-40 h-12 group-hover:opacity-90 transition-opacity">
                <Image 
                  src="/brand/logo-white.svg" 
                  alt="PixPaw AI Logo" 
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              {dict.footer.brand.mission}
            </p>
            
            {/* Charity Statement */}
            <div className="flex items-start gap-2 bg-gray-800 rounded-lg p-3">
              <Heart className="w-5 h-5 text-coral fill-coral flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300">
                <strong className="text-coral font-semibold">
                  {dict.footer.brand.charityStatement}
                </strong>
              </p>
            </div>
          </div>

          {/* Column 2: Discover (SEO Internal Links) */}
          <div>
            <h4 className="font-semibold mb-4 text-white">{dict.footer.discover.title}</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href={`/${lang}/gallery?style=pixar-dogs`} className="hover:text-coral transition-colors">
                  {dict.footer.discover.links.pixarDogs}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/gallery?style=royal-cats`} className="hover:text-coral transition-colors">
                  {dict.footer.discover.links.royalCats}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/gallery`} className="hover:text-coral transition-colors">
                  {dict.footer.discover.links.searchGallery}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h4 className="font-semibold mb-4 text-white">{dict.footer.support.title}</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href={`/${lang}#faq`} className="hover:text-coral transition-colors">
                  {dict.footer.support.links.faq}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/track-order`} className="hover:text-coral transition-colors">
                  {dict.footer.support.links.trackOrder}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/contact`} className="hover:text-coral transition-colors">
                  {dict.footer.support.links.contactUs}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">{dict.footer.legal.title}</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href={`/${lang}/privacy`} className="hover:text-coral transition-colors">
                  {dict.footer.legal.links.privacy}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/terms`} className="hover:text-coral transition-colors">
                  {dict.footer.legal.links.terms}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/refund`} className="hover:text-coral transition-colors">
                  {dict.footer.legal.links.refund}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Copyright */}
            <p className="text-gray-400 text-sm flex items-center gap-2 flex-wrap">
              <span>{dict.footer.copyright}</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                Made with <Heart className="w-3 h-3 fill-coral text-coral inline" /> for pets
              </span>
            </p>
            
            {/* Right: Language Switcher */}
            <LanguageSwitcher currentLang={lang} dict={dict} />
          </div>
        </div>
      </div>
    </footer>
  );
}
