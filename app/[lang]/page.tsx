import { HomeClient } from './home-client'
import { HomeSchema } from '@/components/home-schema'
import { getDictionary } from '@/lib/dictionary'
import { type Locale } from '@/lib/i18n-config'

/**
 * Server component shell for the homepage.
 * Dictionary is loaded here (not in useEffect) so H1 / how-it-works / $4.99 / CTA
 * ship in the initial HTML for no-JS crawlers.
 */
export const revalidate = 3600

export default async function Home({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  const faqs = (dict.faq?.questions ?? []).map((item: { question: string; answer: string }) => ({
    question: item.question,
    answer: item.answer,
  }))

  return (
    <>
      <HomeSchema lang={lang} faqs={faqs} />
      <HomeClient dict={dict} lang={lang} />
    </>
  )
}
