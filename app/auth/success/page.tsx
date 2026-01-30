'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthSuccessContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

    useEffect(() => {
        async function verifyAndRedirect() {
            try {
                const supabase = createClient()

                // Verify session
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('❌ Session verification failed:', error)
                    setStatus('error')
                    setTimeout(() => {
                        router.push('/en?error=session-verification-failed')
                    }, 2000)
                    return
                }

                if (session) {
                    console.log('✅ Session verified:', session.user.email)
                    setStatus('success')

                    // Get redirect target
                    const next = searchParams.get('next') || '/en'

                    // Short delay to ensure session is fully synced
                    setTimeout(() => {
                        router.push(next)
                        router.refresh() // Refresh server components to get latest user state
                    }, 800)
                } else {
                    console.error('❌ No session found')
                    setStatus('error')
                    setTimeout(() => {
                        router.push('/en?error=no-session')
                    }, 2000)
                }
            } catch (err) {
                console.error('❌ Unexpected error:', err)
                setStatus('error')
                setTimeout(() => {
                    router.push('/en?error=unexpected')
                }, 2000)
            }
        }

        verifyAndRedirect()
    }, [router, searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-cream to-white">
            <div className="text-center max-w-md px-6">
                {status === 'loading' && (
                    <>
                        <div className="w-20 h-20 border-4 border-coral border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Logging you in...</h2>
                        <p className="text-gray-600">Setting up your account</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
                        <p className="text-gray-600">Redirecting you now...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
                        <p className="text-gray-600">Something went wrong. Redirecting...</p>
                    </>
                )}
            </div>
        </div>
    )
}

export default function AuthSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-cream to-white">
                <div className="w-20 h-20 border-4 border-coral border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <AuthSuccessContent />
        </Suspense>
    )
}
