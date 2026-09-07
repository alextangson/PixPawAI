# Creem credit checkout

PixPaw AI's Starter, Pro, and Master credit packs use Creem hosted checkout. Historical PayPal rows remain in `payments` for reconciliation. Printful physical merchandise remains on PayPal because Creem does not support physical goods.

## Required Creem setup

1. Create three one-time digital products in Creem with these exact USD prices:
   - Starter: $4.99
   - Pro: $19.99
   - Master: $39.99
2. Configure the environment variables listed in `.env.example` with values from the same Creem environment.
3. Register the webhook URL:
   - Test: `https://<test-host>/api/payments/creem/webhook`
   - Production: `https://pixpawai.com/api/payments/creem/webhook`
4. Subscribe the webhook to `checkout.completed`, `refund.created`, and `dispute.created`.
5. Apply, in order:
   - `20260828_atomic_paypal_credit_fulfillment.sql`
   - `20260829_creem_credit_checkout.sql`

## Release gate

Run `npm run test:payments` and `npm run build`. Then complete one Creem Test Mode checkout and verify all of the following before switching to production:

- The browser returns to `/en/payment/success` with a valid signed URL.
- The payment row changes from `pending` to `completed`.
- `provider` is `creem`, and provider order and transaction references are populated.
- Credits and tier change in the same database transaction.
- Re-sending the webhook does not add credits again.
- A failed or tampered webhook does not add credits.

Production activation additionally requires production API credentials, production product IDs, a production webhook secret, HTTPS `NEXT_PUBLIC_SITE_URL`, and `CREEM_ENVIRONMENT=production`.
