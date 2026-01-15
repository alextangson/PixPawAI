import { HeroSection } from '@/components/hero-section'
import { type Locale } from '@/lib/i18n-config'
import { getDictionary } from '@/lib/dictionary'

export default async function Home({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  
  return (
    <main className="min-h-screen">
      <HeroSection dict={dict} />
    </main>
  )
}
