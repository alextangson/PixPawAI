import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "../globals.css"
import { i18n, type Locale } from '@/lib/i18n-config'
import { getDictionary } from '@/lib/dictionary'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { getUser } from '@/lib/auth/actions'
import { ReferralWelcomeToast } from '@/components/referral-welcome-toast'

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
    title: dict.metadata.title,
    description: dict.metadata.description,
    keywords: dict.metadata.keywords.split(', '),
    authors: [{ name: "PixPaw AI" }],
    openGraph: {
      title: dict.metadata.title,
      description: dict.metadata.description,
      url: `https://pixpawai.com/${lang}`,
      siteName: "PixPaw AI",
      locale: lang === 'en' ? 'en_US' : lang,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.metadata.title,
      description: dict.metadata.description,
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
      <body 
        className={`${inter.variable} ${playfair.variable} font-sans`}
        suppressHydrationWarning
      >
        <Navbar dict={dict} lang={lang} user={user} />
        {children}
        <Footer dict={dict} lang={lang} />
        <ReferralWelcomeToast />
      </body>
    </html>
  )
}
