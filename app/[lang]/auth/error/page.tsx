import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { type Locale } from '@/lib/i18n-config'
import { getDictionary } from '@/lib/dictionary'

export default async function AuthErrorPage({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Authentication Error
          </h1>
          <p className="text-gray-600">
            Sorry, we couldn't log you in. This could be due to an expired link or a technical issue.
          </p>
        </div>

        <div className="space-y-3">
          <Link href={`/${lang}`}>
            <Button className="w-full bg-coral hover:bg-orange-600 text-white">
              Return to Home
            </Button>
          </Link>
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <Link href={`/${lang}/how-to`} className="text-coral hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
