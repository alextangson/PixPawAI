// Prices are authoritative on the server; never accept amounts from the browser.
export const WAFFO_CATALOG = {
  starter: { name: 'Starter Pack', amount: '4.99', credits: 15 },
  pro: { name: 'Pro Bundle', amount: '19.99', credits: 50 },
  master: { name: 'Master Plan', amount: '39.99', credits: 200 },
  hd_unlock: { name: 'HD Portrait Unlock', amount: '9.99', credits: 0 },
} as const

export type WaffoSku = keyof typeof WAFFO_CATALOG
export function isWaffoSku(value: unknown): value is WaffoSku {
  return typeof value === 'string' && Object.hasOwn(WAFFO_CATALOG, value)
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function usdCents(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const text = String(value)
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null
  const [whole, fractional = ''] = text.split('.')
  const cents = Number(whole) * 100 + Number(fractional.padEnd(2, '0'))
  return Number.isSafeInteger(cents) ? cents : null
}

// Current Pancake prices exclude tax. Verify the actual charge against its
// signed tax breakdown, then compare the subtotal with our stored catalog price.
export function paidSubtotal(data: {
  chargedAmount?: unknown; amount?: unknown; taxAmount?: unknown; subtotal?: unknown; total?: unknown;
  listPrice?: { total?: unknown; subtotal?: unknown; taxAmount?: unknown };
}): number | null {
  const charged = usdCents(data.chargedAmount ?? data.amount)
  const tax = usdCents(data.listPrice?.taxAmount ?? data.taxAmount)
  const total = usdCents(data.listPrice?.total ?? data.total ?? data.chargedAmount ?? data.amount)
  if (charged === null || tax === null || total === null || charged !== total || total < tax) return null
  const subtotal = usdCents(data.listPrice?.subtotal ?? data.subtotal ?? ((total - tax) / 100).toFixed(2))
  if (subtotal === null || subtotal + tax !== total) return null
  return subtotal / 100
}
