'use client'

import { useEffect, useRef, useState } from 'react'

type Checkout = { id: string; token: string; checkoutUrl: string; mode: string }
type Result = { id: string; status: string; generation_id: string | null; mode: string }

export function WaffoCheckoutButton({ sku, generationId, onSuccess }: {
  sku: string
  generationId?: string
  onSuccess: (payment: Result, downloadPath?: string, token?: string) => void
}) {
  const storageKey = `pixpaw-waffo:${sku}:${generationId ?? ''}`
  const [checkout, setCheckout] = useState<Checkout | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [testDone, setTestDone] = useState(false)
  const success = useRef(onSuccess)
  success.current = onSuccess
  const delivered = useRef(false)

  useEffect(() => {
    delivered.current = false
    setTestDone(false)
    try {
      const saved = sessionStorage.getItem(storageKey)
      setCheckout(saved ? JSON.parse(saved) : null)
    } catch { setCheckout(null) }
  }, [storageKey])

  useEffect(() => {
    if (!checkout) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    const check = async () => {
      try {
        const response = await fetch(`/api/payments/waffo/status?id=${checkout.id}`, {
          headers: { Authorization: `Bearer ${checkout.token}` }, cache: 'no-store',
        })
        if (!response.ok) throw new Error('Unable to check payment. Please keep this tab open and try again.')
        const result: Result = await response.json()
        if (!cancelled && result.status === 'completed' && !delivered.current) {
          delivered.current = true
          if (result.mode === 'test') {
            sessionStorage.removeItem(storageKey)
            setTestDone(true)
            return
          }
          // Keep guest HD receipts so reopening the dialog can retry a download.
          if (!result.generation_id) sessionStorage.removeItem(storageKey)
          const path = result.generation_id
            ? `/api/generations/${result.generation_id}/hd?waffoOrderId=${checkout.id}` : undefined
          success.current(result, path, checkout.token)
          return
        }
        if (!cancelled) setError('')
      } catch {
        if (!cancelled) setError('Confirmation is delayed. We will keep checking; please do not pay again.')
      }
      if (!cancelled) timer = setTimeout(check, 5000)
    }
    void check()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [checkout, storageKey])

  async function prepare() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/payments/waffo/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, generationId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Unable to start checkout')
      // A separate click opens the new tab reliably without popup blockers.
      sessionStorage.setItem(storageKey, JSON.stringify(data))
      setCheckout(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout')
    } finally { setBusy(false) }
  }

  if (testDone) return <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
    Test payment confirmed. No real charge, credits or download access were granted.
  </p>

  return <div className="space-y-3">
    <p className="text-center text-xs text-gray-500">Applicable taxes are calculated at checkout.</p>
    {checkout ? <>
      {checkout.mode === 'test' && <p className="text-center text-sm font-semibold text-amber-700">
        Test checkout only — this does not purchase credits or download access.
      </p>}
      <button type="button" className="w-full rounded-xl bg-coral px-4 py-3 font-semibold text-white"
        onClick={() => window.open(checkout.checkoutUrl, '_blank', 'noopener,noreferrer')}>
        Open secure checkout{checkout.mode === 'test' ? ' (test)' : ''}
      </button>
      <p className="text-center text-xs text-gray-600">Complete payment in the new tab. This page will confirm your purchase automatically.</p>
      <button type="button" className="w-full text-xs underline text-gray-500" onClick={() => {
        sessionStorage.removeItem(storageKey)
        setCheckout(null)
      }}>Checkout expired or cancelled? Start again</button>
    </> : <button type="button" disabled={busy} onClick={prepare}
      className="w-full rounded-xl bg-coral px-4 py-3 font-semibold text-white disabled:opacity-50">
      {busy ? 'Preparing your secure checkout…' : 'Pay with Waffo'}
    </button>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </div>
}
