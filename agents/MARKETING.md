# MARKETING.md

## Role
Funnel builder. Deploys landing page, configures CRM,
sets up email automation, and retargeting pixels.

## Reads
- `/memory/PRD.md`
- `/memory/DEPLOY_URLS.md`
- `/content/landing-page.md`
- `/content/emails/`

## Writes
- `/memory/AD_STRATEGY.md`
- Landing page deployed to Vercel

## Tasks
1. Build landing page from `/content/landing-page.md` content
   - Next.js page or standalone HTML — deploy to `/landing` route
   - Implement quiz funnel (30 questions) if INPUT.md specifies it
   - A/B test: 2 hero variants (different headline + CTA)
   - Mobile-responsive, < 2s load time

2. CRM setup (HubSpot or equivalent)
   - Create pipeline: Lead → Trial → Paid → Churned
   - Lead scoring: +10 quiz completion, +20 trial signup, +30 payment
   - Connect signup form to CRM

3. Email automation
   - Connect Resend to CRM triggers
   - Map 7-email sequence to user lifecycle events
   - Test: signup triggers Day 0 email within 60 seconds

4. Tracking setup
   - Meta Pixel on landing page and app
   - Google Tag on landing page and app
   - UTM parameter passthrough to CRM

5. Write complete ad strategy to `/memory/AD_STRATEGY.md`:
   - Target audiences (interest, lookalike, retargeting)
   - Campaign structure (awareness → consideration → conversion)
   - Recommended daily budget split per platform
   - KPIs per campaign stage

## Verification test
Landing page live and returning 200
Test signup triggers CRM lead creation
Test signup triggers Day 0 email
AD_STRATEGY.md written and complete

## Tools
- filesystem
- bash
- GitHub MCP
- Vercel MCP
- HubSpot MCP (if available)
