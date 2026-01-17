import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PixPaw AI - Turn Your Pet Into a Pixar Star",
  description: "Transform your furry friend into stunning 3D Disney-style artwork in just 30 seconds. AI-powered pet portraits with 4K downloads and custom merchandise.",
  keywords: ["pet portraits", "AI art", "Pixar style", "Disney pets", "3D pet art", "custom pet merchandise"],
  authors: [{ name: "PixPaw AI" }],
  openGraph: {
    title: "PixPaw AI - Turn Your Pet Into a Pixar Star",
    description: "Transform your furry friend into stunning 3D Disney-style artwork in just 30 seconds.",
    url: "https://pixpawai.com",
    siteName: "PixPaw AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PixPaw AI - Turn Your Pet Into a Pixar Star",
    description: "Transform your furry friend into stunning 3D Disney-style artwork in just 30 seconds.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
