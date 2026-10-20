import 'server-only'
import { WaffoPancake } from '@waffo/pancake-ts'

export function waffoEnvironment(): 'test' | 'prod' {
  const value = process.env.WAFFO_ENVIRONMENT ?? 'test'
  if (value !== 'test' && value !== 'prod') throw new Error('Invalid WAFFO_ENVIRONMENT')
  return value
}

export function waffoStoreId() {
  const id = process.env.WAFFO_STORE_ID
  if (!id) throw new Error('Missing WAFFO_STORE_ID')
  return id
}

export function waffoClient() {
  const merchantId = process.env.WAFFO_MERCHANT_ID
  const privateKey = process.env.WAFFO_PRIVATE_KEY_BASE64
    ? Buffer.from(process.env.WAFFO_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
    : process.env.WAFFO_PRIVATE_KEY
  if (!merchantId || !privateKey || privateKey.includes('<paste-')) {
    throw new Error('Waffo credentials are not configured')
  }
  return new WaffoPancake({ merchantId, privateKey, environment: waffoEnvironment() })
}
