import type { ReactNode } from 'react'
import { Analytics } from '@/components/analytics'

/**
 * Auth routes live outside app/[lang], so they do not inherit the GA4
 * <Analytics /> tag from the locale layout. Load it here so signup/login
 * events on /auth/success can reach gtag.
 */
export default function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <Analytics />
      {children}
    </>
  )
}
