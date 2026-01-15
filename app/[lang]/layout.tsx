import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { i18n, type Locale } from '@/lib/i18n-config'
import { getDictionary } from '@/lib/dictionary'

const inter = Inter({ subsets: ["latin"] })

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
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ lang: Locale }>
}>) {
  const { lang } = await params
  
  return (
    <html lang={lang}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
