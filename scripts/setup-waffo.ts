import { loadEnvConfig } from '@next/env'
import { WaffoPancake, TaxCategory } from '@waffo/pancake-ts'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { WAFFO_CATALOG } from '../lib/waffo/catalog'

loadEnvConfig(process.cwd())

async function main() {
  const merchantId = process.env.WAFFO_MERCHANT_ID
  const storeId = process.env.WAFFO_STORE_ID
  const privateKey = process.env.WAFFO_PRIVATE_KEY_BASE64
    ? Buffer.from(process.env.WAFFO_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
    : process.env.WAFFO_PRIVATE_KEY
  if (!merchantId || !storeId || !privateKey || privateKey.includes('<paste-')) {
    throw new Error('Set WAFFO_MERCHANT_ID, WAFFO_STORE_ID and a real test private key in .env.local first.')
  }
  if (process.env.WAFFO_ENVIRONMENT !== 'test') throw new Error('This setup command supports test mode only.')
  const productsOnly = process.argv.includes('--products-only')
  const origin = productsOnly ? null : new URL(process.env.WAFFO_SITE_URL ?? '')
  if (origin && origin.protocol !== 'https:') throw new Error('WAFFO_SITE_URL must be a public HTTPS origin (ngrok or staging).')
  const client = new WaffoPancake({ merchantId, privateKey, environment: 'test' })
  const stores = await client.graphql.query<{ stores: { id: string }[] }>({
    query: 'query { stores { id } }',
  })
  if (stores.errors?.length || !stores.data?.stores.some(store => store.id === storeId)) {
    throw new Error('Configured store is not accessible to this merchant.')
  }
  // Checkpoints survive the provider's 24-hour idempotency window; reruns reuse IDs.
  const stateFile = '.waffo-setup.test.json'
  const state: { merchantId: string; storeId: string; products: Record<string, string>; webhook?: string; webhookUrl?: string } =
    existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : { merchantId, storeId, products: {} }
  if (state.merchantId !== merchantId || state.storeId !== storeId) throw new Error('Setup checkpoint belongs to a different merchant/store.')
  const save = () => writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 })
  for (const [sku, plan] of Object.entries(WAFFO_CATALOG)) {
    const envName = `WAFFO_PRODUCT_${sku.toUpperCase()}`
    if (!state.products[sku]) state.products[sku] = process.env[envName] ?? ''
    if (!state.products[sku]) {
      const result = await client.onetimeProducts.create({
        storeId, name: `PixPaw ${plan.name}`,
        prices: { USD: { amount: plan.amount, taxCategory: TaxCategory.DigitalGoods } },
        metadata: { pixpawSku: sku },
      }, { idempotencyKey: `pixpaw-${storeId}-test-${sku}-v1` })
      state.products[sku] = result.product.id
      save()
    }
    console.log(`${envName}=${state.products[sku]}`)
  }
  // Persist product mappings without printing or rewriting any credential value.
  const envFile = '.env.local'
  let envText = existsSync(envFile) ? readFileSync(envFile, 'utf8') : ''
  for (const [sku, id] of Object.entries(state.products)) {
    const name = `WAFFO_PRODUCT_${sku.toUpperCase()}`
    const pattern = new RegExp(`^${name}=.*$`, 'm')
    envText = pattern.test(envText) ? envText.replace(pattern, `${name}=${id}`) : `${envText}\n${name}=${id}\n`
  }
  writeFileSync(envFile, envText, { mode: 0o600 })
  save()
  if (productsOnly) {
    console.log('Test product mappings saved to .env.local. Webhook setup awaits a public HTTPS origin.')
    return
  }
  const url = new URL('/api/payments/waffo/webhook/', origin!).toString()
  if (!state.webhook) {
    const result = await client.webhooks.add({
      storeId, channel: 'http', url, events: ['order.completed'], testMode: true,
    }, { idempotencyKey: `pixpaw-${storeId}-test-webhook-v1` })
    state.webhook = result.webhook.id
    state.webhookUrl = url
    save()
  } else if (state.webhookUrl !== url) {
    await client.webhooks.update({ id: state.webhook, url })
    state.webhookUrl = url
    save()
  }
  console.log('Test webhook configured and product mappings saved to .env.local. Restart Next.js.')
}

main().catch(error => {
  // Avoid dumping SDK errors (which can contain request information).
  console.error(error instanceof Error ? error.message : 'Waffo setup failed')
  process.exitCode = 1
})
