# External service checks — 24 October 2026

## Email

The configured Resend key accepted an email to the provider's official delivery
simulation address (HTTP 200). The deployed authentication signup/session flow
also completed with a labelled Resend delivery-test address. No real person's
inbox was used. The key is sending-only: reading domain/message data returns
`restricted_api_key`. This is not an invalid sending credential.

Real inbox placement and the provider delivery event could not be independently
observed with this key. Configuration of auth email is verified as far as the
provider request and deployed authentication flow, not a promise of inbox delivery.

## Receipt extraction

The unique Gemini credential found in the old project configuration and disk
backup returns HTTP 400 / INVALID_ARGUMENT on the official model-list endpoint.
No model generation was attempted and no OCR key was enabled. Manual receipt
upload and expense entry remain the available flow.

## Subscriptions

A live Paddle API credential from the existing stack could read its product
catalog. It contained no CostPacket product. Available sandbox credentials were
rejected. No product, price, merchant approval or successful live payment was
invented; no checkout/charge was created during verification. CostPacket billing
stays disabled pending its own merchant/catalog configuration.

Paddle subscription configuration is separate from receiving payment for
freelance services. No existing unrelated SaaS price was reused.
