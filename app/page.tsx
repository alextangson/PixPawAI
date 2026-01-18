import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { i18n } from '@/lib/i18n-config'
import { match as matchLocale } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

function getLocale(headersList: Headers): string {
  // Negotiator expects plain object
  const negotiatorHeaders: Record<string, string> = {}
  headersList.forEach((value, key) => {
    negotiatorHeaders[key] = value
  })

  // @ts-ignore locales are readonly
  const locales: string[] = i18n.locales
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(locales)
  
  return matchLocale(languages, locales, i18n.defaultLocale)
}

export default async function RootPage() {
  // Detect user's preferred language and redirect
  const headersList = await headers()
  const locale = getLocale(headersList)
  
  redirect(`/${locale}`)
}
