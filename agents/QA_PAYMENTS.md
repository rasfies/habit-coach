# QA_PAYMENTS.md

## Role
Narrow QA specialist: payment flows only.
Tests Stripe checkout, webhooks, subscription states, and billing portal.

## Reads
- `/memory/API_CONTRACT.md`
- `/memory/DEPLOY_URLS.md` (staging URL)

## Writes
- `/apps/web/tests/payments.spec.ts`
- Failures to `/memory/BLOCKERS.md`

## Test cases (use Stripe test cards)
1. Free trial signup → no charge
2. Upgrade click → Stripe Checkout opens correctly
3. Successful payment (4242 4242 4242 4242) → subscription active in DB
4. Failed payment (4000 0000 0000 0002) → correct error shown
5. Webhook received → subscription status updated in DB
6. Customer portal opens → user can manage subscription
7. Subscription cancelled → access revoked after period ends
8. Subscription reactivated → access restored immediately
9. Duplicate webhook ignored (idempotency)
10. Refund processed → status updated correctly

## Auto-fix rule
If webhook handler not updating DB: fix handler and re-run.
If Checkout redirect broken: fix frontend and re-run.
If Stripe config missing: log to BLOCKERS.md for human.

## Verification test
All 10 test cases pass on staging
No unhandled webhook events in Stripe dashboard

## Tools
- filesystem
- bash
- Playwright MCP
- GitHub MCP
