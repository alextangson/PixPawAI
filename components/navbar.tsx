'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Heart, PawPrint } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { LoginButton } from '@/components/auth/login-button';
import { UserMenu } from '@/components/auth/user-menu';

interface NavbarProps {
  dict: {
    nav: {
      logo: string;
      links: {
        shop: string;
        gallery: string;
        howToGuide: string;
        pricing: string;
      };
      cta: string;
      charity: {
        tooltip: string;
      };
    };
  };
  lang: string;
  user: User | null;
}

export function Navbar({ dict, lang, user }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const menuLinks = [
    { href: `/${lang}/gallery`, label: dict.nav.links.gallery },
    { href: `/${lang}/how-to`, label: dict.nav.links.howToGuide },
    { href: `/${lang}/pricing`, label: dict.nav.links.pricing },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-orange-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <Link href={`/${lang}`} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-coral to-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              {dict.nav.logo}
            </span>
          </Link>

          {/* Desktop Menu - Center */}
          <div className="hidden md:flex items-center gap-8">
            {menuLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-coral font-medium transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-coral transition-all group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Actions - Right */}
          <div className="flex items-center gap-4">
            {/* Charity Heart Icon with Tooltip */}
            <div className="relative hidden md:block">
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="p-2 rounded-full hover:bg-orange-100 transition-colors group"
                aria-label={dict.nav.charity.tooltip}
              >
                <Heart className="w-5 h-5 text-coral fill-coral group-hover:scale-110 transition-transform" />
              </button>
              
              {/* Tooltip */}
              {showTooltip && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-10">
                  <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45" />
                  {dict.nav.charity.tooltip}
                </div>
              )}
            </div>

            {/* Auth Section */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {/* CTA Button for logged in users */}
                  <Link href={`/${lang}#upload`}>
                    <Button className="bg-coral hover:bg-orange-600 text-white font-semibold px-6">
                      {dict.nav.cta}
                    </Button>
                  </Link>
                  {/* User Menu */}
                  <UserMenu user={user} />
                </>
              ) : (
                <>
                  {/* Login Button */}
                  <LoginButton>
                    <Button variant="ghost" className="text-gray-700 hover:text-coral font-medium">
                      Log In
                    </Button>
                  </LoginButton>
                  {/* CTA Button */}
                  <LoginButton redirectTo={`/${lang}#upload`}>
                    <Button className="bg-coral hover:bg-orange-600 text-white font-semibold px-6">
                      {dict.nav.cta}
                    </Button>
                  </LoginButton>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-orange-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-900" />
              ) : (
                <Menu className="w-6 h-6 text-gray-900" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-orange-100 animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-4">
              {menuLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-coral font-medium py-2 px-4 rounded-lg hover:bg-orange-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile Charity Message */}
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-lg">
                <Heart className="w-4 h-4 text-coral fill-coral" />
                <span className="text-xs text-gray-600">
                  {dict.nav.charity.tooltip}
                </span>
              </div>

              {/* Mobile Auth Section */}
              {user ? (
                <>
                  {/* User Info */}
                  <div className="px-4 py-2 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.user_metadata?.full_name || user.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  {/* Mobile CTA */}
                  <Link href={`/${lang}#upload`} onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-coral hover:bg-orange-600 text-white font-semibold">
                      {dict.nav.cta}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  {/* Mobile Login */}
                  <LoginButton redirectTo={`/${lang}#upload`}>
                    <Button variant="outline" className="w-full border-2 border-coral text-coral hover:bg-coral hover:text-white font-semibold" onClick={() => setMobileMenuOpen(false)}>
                      Log In
                    </Button>
                  </LoginButton>
                  {/* Mobile CTA */}
                  <LoginButton redirectTo={`/${lang}#upload`}>
                    <Button className="w-full bg-coral hover:bg-orange-600 text-white font-semibold">
                      {dict.nav.cta}
                    </Button>
                  </LoginButton>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
