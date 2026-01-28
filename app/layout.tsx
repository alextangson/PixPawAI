import type { Metadata } from "next"
import { Inter, Dancing_Script, Caveat, Pacifico } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const dancingScript = Dancing_Script({ 
  subsets: ["latin"],
  variable: '--font-dancing-script',
  weight: ['400', '700']
})
const caveat = Caveat({
  subsets: ["latin"],
  variable: '--font-caveat',
  weight: ['400', '700']
})
const pacifico = Pacifico({
  subsets: ["latin"],
  variable: '--font-pacifico',
  weight: '400'
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pixpawai.com'),
  title: "PixPaw AI - Turn Your Pet Into a Pixar Star",
  description: "Transform your furry friend into stunning 3D Disney-style artwork in just 30 seconds. AI-powered pet portraits with 4K downloads and custom merchandise.",
  keywords: ["pet portraits", "AI art", "Pixar style", "Disney pets", "3D pet art", "custom pet merchandise"],
  authors: [{ name: "PixPaw AI" }],
  manifest: '/manifest.json',
  alternates: {
    canonical: '/en',
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
    title: "PixPaw AI - Turn Your Pet Into a Pixar Star",
    description: "Transform your furry friend into stunning 3D Disney-style artwork in just 30 seconds.",
    url: "https://pixpawai.com/en",
    siteName: "PixPaw AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: '/brand/png/logo-orange-256.png',
        width: 256,
        height: 256,
        alt: 'PixPaw AI - Turn Your Pet Into a Pixar Star',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PixPaw AI - Turn Your Pet Into a Pixar Star",
    description: "Transform your furry friend into stunning 3D Disney-style artwork in just 30 seconds.",
    images: ['/brand/png/logo-orange-256.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${dancingScript.variable} ${caveat.variable} ${pacifico.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
