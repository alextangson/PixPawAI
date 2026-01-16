import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthErrorPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Authentication Error
        </h1>
        
        <p className="text-gray-600 mb-8">
          Sorry, there was a problem signing you in. This could be due to:
        </p>

        <ul className="text-left text-sm text-gray-600 mb-8 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">•</span>
            <span>Invalid or expired authentication link</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">•</span>
            <span>Network connection issues</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-500 mt-0.5">•</span>
            <span>Browser cookies or local storage disabled</span>
          </li>
        </ul>

        <div className="space-y-3">
          <Link href="/en">
            <Button className="w-full bg-coral hover:bg-orange-600 text-white font-semibold">
              Return to Home
            </Button>
          </Link>
          
          <Link href="/en">
            <Button variant="outline" className="w-full">
              Try Signing In Again
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          If the problem persists, please contact support.
        </p>
      </div>
    </main>
  )
}
