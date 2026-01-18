import type { Metadata } from "next"
import { Inter, Dancing_Script, Caveat } from "next/font/google"
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

export const metadata: Metadata = {
  title: "PixPaw AI - Turn Your Pet Into a Pixar Star",
  description: "Transform your furry friend into stunning 3D Disney-style artwork in just 30 seconds. AI-powered pet portraits with 4K downloads and custom merchandise.",
  keywords: ["pet portraits", "AI art", "Pixar style", "Disney pets", "3D pet art", "custom pet merchandise"],
  authors: [{ name: "PixPaw AI" }],
  manifest: '/manifest.json',
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
    url: "https://pixpawai.com",
    siteName: "PixPaw AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: '/brand/logo-orange.svg',
        width: 1200,
        height: 630,
        alt: 'PixPaw AI - Turn Your Pet Into a Pixar Star',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PixPaw AI - Turn Your Pet Into a Pixar Star",
    description: "Transform your furry friend into stunning 3D Disney-style artwork in just 30 seconds.",
    images: ['/brand/logo-orange.svg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${dancingScript.variable} ${caveat.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
