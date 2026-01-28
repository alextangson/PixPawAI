import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "../globals.css"
import { i18n, type Locale } from '@/lib/i18n-config'
import { getDictionary } from '@/lib/dictionary'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { getUser } from '@/lib/auth/actions'
import { ReferralWelcomeToast } from '@/components/referral-welcome-toast'
import { Analytics } from '@/components/analytics'

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dict = await getDictionary(lang)

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com'),
    title: dict.metadata.title,
    description: dict.metadata.description,
    keywords: dict.metadata.keywords.split(', '),
    authors: [{ name: "PixPaw AI" }],
    manifest: '/manifest.json',  // ✅ 使用绝对路径，不受 [lang] 路由影响
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      // To get verification code:
      // 1. Go to https://search.google.com/search-console
      // 2. Add property -> URL prefix -> https://pixpawai.com
      // 3. Choose "HTML tag" method
      // 4. Copy the content value from: <meta name="google-site-verification" content="YOUR_CODE" />
      // 5. Add to .env.local: NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=YOUR_CODE
    },
    alternates: {
      canonical: `/${lang}`,
      languages: {
        'en': '/en',
        'x-default': '/en',
        // Add more languages when available:
        // 'zh': '/zh',
      },
    },
    icons: {
      icon: [
        { url: '/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicons/favicon.ico', sizes: 'any' },
      ],
      shortcut: '/favicons/favicon.ico',
      apple: '/favicons/apple-touch-icon.png',
    },
    openGraph: {
      title: dict.metadata.title,
      description: dict.metadata.description,
      url: `https://pixpawai.com/${lang}`,
      siteName: "PixPaw AI",
      locale: 'en_US',
      type: "website",
      images: [
        {
          url: '/brand/png/logo-orange-256.png',
          width: 256,
          height: 256,
          alt: 'PixPaw AI Logo',
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.metadata.title,
      description: dict.metadata.description,
      images: ['/brand/png/logo-orange-256.png'],
    },
  }
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang as Locale)
  const user = await getUser()

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans`}
        suppressHydrationWarning
      >
        <Analytics />
        <Navbar dict={dict} lang={lang} user={user} />
        {children}
        <Footer dict={dict} lang={lang} />
        <ReferralWelcomeToast />
      </body>
    </html>
  )
}
