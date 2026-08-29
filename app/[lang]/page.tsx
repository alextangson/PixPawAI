import { HomeClient } from './home-client'
import { HomeSchema } from '@/components/home-schema'
import { getDictionary } from '@/lib/dictionary'
import { type Locale } from '@/lib/i18n-config'

/**
 * Server component shell for the homepage.
 * The interactive tree lives in HomeClient; the JSON-LD is emitted here so it
 * ships in the server HTML for crawlers that never run the client bundle.
 */
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
      <HomeClient />
    </>
  )
}
