# Creem account review recovery

PixPaw AI's Creem payout account was rejected on August 31, 2026. The review notification was generic, but the live merchant record had several objective mismatches:

- The product website pointed to a different product instead of `https://pixpawai.com`.
- The merchant contact email did not match the public `support@pixpawai.com` address.
- The store was marked as not being an AI wrapper.
- The business and product descriptions did not explain the pet-portrait service or the digital credit products.

## Website changes in this branch

- Adds a public Acceptable Use Policy and links it from the footer, prompt UI, and purchase terms.
- Adds Creem's production Moderation API as a fail-closed gate before persistence, credit deduction, or model invocation.
- Enables the Replicate safety checker on every known image-generation path.
- Discloses third-party AI, moderation, hosting, payment, and fulfillment providers.
- Removes unsupported customer counts, rating counts, and testimonial copy.

## Required production configuration

Set `CREEM_MODERATION_API_KEY` in the Vercel Production environment to a live Creem key with moderation access. A sandbox key does not satisfy Creem's review requirement. Do this before deploying the branch because the generation route intentionally fails closed when the key is missing.

After deployment, verify from the production product that:

1. A safe scene description receives an `allow` decision before image generation.
2. Both `flag` and `deny` stop the request before a generation record or credit deduction.
3. A timeout, invalid response, or missing key returns a retryable error and does not call the image model.
4. `/en/acceptable-use/`, `/en/terms/`, `/en/privacy/`, `/en/contact/`, and `/en/pricing/` load without authentication.

## Creem merchant details to correct

Update only the public business fields; do not alter identity or tax data without the account owner's review.

- Website: `https://pixpawai.com`
- Contact email: `support@pixpawai.com`
- AI wrapper: Yes
- Business description: PixPaw AI is an independent AI pet portrait application. Customers upload a pet photo, choose an art style, and may add a short scene description. The service applies pet-focused prompt construction, photo quality checks, layered content moderation, and third-party image-generation infrastructure to produce a digital portrait.
- Products sold through Creem: One-time digital generation credit packs for PixPaw AI. Credits are used only inside PixPaw AI to generate pet portraits and do not expire. Creem is not used for physical goods; physical merchandise is separately processed and fulfilled through other providers.

Because the current outcome is **Rejected**, Creem's documentation says the dashboard may not show a re-review button. Once the production checks pass and the merchant details are corrected, contact Creem support with the Store ID and a concise summary of the remediation. Sending that request is a separate external action.
