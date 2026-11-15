# Staging DineSight without buying a domain

**Decision confirmed:** Use generated HTTPS provider hostnames for the initial McKanim + DineSight pilot. **This document is a deployment runbook, not evidence that hosting or email delivery has been connected.**

## Hosting account verification — 15 November 2026

The user's connected Vercel account exposes the team **vicent's projects** on the **Hobby** plan. An authenticated repository search found `muhindovicent/McKanim-restaurant-website`, but no existing McKanim Vercel project under this team.

**Commercial use gate: HOLD.** Vercel Hobby is restricted to personal, non-commercial usage. DineSight is intended to be sold to paying restaurants. Upgrade the team to a commercially appropriate plan, or choose an eligible alternative host, **before** creating a Vercel deployment for this commercial project. No paid plan change is authorized by this runbook.

Official policy: https://vercel.com/docs/plans/hobby

Render has been connected by the user, but no Render deployment action has yet completed; do not claim an API URL or active service. A staging database, reviewed SQL migration and reproducible lockfile are still required before API deployment.

## Cost-conscious staging alternative

If the Vercel account remains on Hobby, do **not** deploy this commercial project there. Render supports **free static-site staging** on provider-generated `onrender.com` hostnames. This can serve McKanim's HTML/CSS/JS preview while Vercel's commercially eligible plan is pending. Render also supports free Node web services for development, but those are explicitly **not for production applications** and can spin down on inactivity. A real restaurant pilot will require suitable service availability, database backups, and an agreed budget.

This is an alternative proposal, **not** an actual Render deployment. For a static site built from the current monorepo, use an explicit deploy/publish directory containing only the five intended frontend assets rather than serving the repository root, which contains backend source code and operational documents. Verify `/backend/` and `/docs/` return 404.

Sources:
- https://render.com/docs/static-sites
- https://render.com/docs/free
- https://vercel.com/docs/plans/hobby

## 1. Separation of concerns

| Surface | Provider | Example URL SHAPE (not an assigned hostname) | Purpose |
|---|---|---|---|
| McKanim web preview | Vercel | `https://<generated-site-host>.vercel.app` | Public-facing restaurant concept and eventual invitation acceptance UI |
| DineSight API staging | Render | `https://<generated-api-host>.onrender.com` | NestJS protected staging service |
| DineSight staging database | Neon | Secret PostgreSQL connection string (no public browser URL) | Isolated development/staging records |
| DineSight email | Not connected | Disabled | Do not send real invitations |

The actual URLs are allocated by providers during project creation. **Never invent or hardcode them.** Record them after deployment in private deployment settings, not in a committed source file.

## 2. Create the McKanim Vercel preview

- Use a **separate staging Vercel project**, linked to the GitHub repository `muhindovicent/McKanim-restaurant-website`.
- Keep the project root at the repository root, choose a static/Other framework setup and deploy the reviewed staging branch only.
- Root-level `.vercelignore` uses an allowlist for `index.html`, `styles.css`, `script.js`, `favicon.svg` and `content/`, excluding backend sources, test files and private project documents from the public static upload.
- Inspect the generated `https://...vercel.app` preview hostname in the Vercel dashboard and copy that **exact** origin.
- Enable appropriate Vercel Deployment Protection for preview deployments. Note: protection by Vercel account login may block a restaurant owner who is not a Vercel team member from using a future invitation URL. Plan a dedicated, properly authenticated invitation flow before releasing owner emails.
- Confirm `/backend/package.json`, `/backend/.env.example`, `/docs/`, and `/tests/` cannot be retrieved through the public preview. These should return HTTP 404.
- The present site is a concept. Don't enable or advertise genuine orders/reservations.

## 3. Configure the Render staging API (deployment only after release gates)

- Create a separate Render web service connected to the same repository, selecting the reviewed staging branch.
- Set **Root Directory** to `backend`, runtime Node.js, Build Command `npm install --no-audit --no-fund && npm run build` (temporary until the reviewed lockfile is committed), and Start Command `npm start`.
- Use Node 24 LTS supported by the current CI. Use Render's configured `PORT`; do not hardcode a local workstation port.
- Use a separate Neon **staging** database and dedicated service credentials. Never point staging at a production database.
- Store environment variables in Render dashboard, **not** GitHub files:

```dotenv
NODE_ENV=production
APP_ENV=staging
DATABASE_URL=<private-staging-postgres-url>
PUBLIC_WEB_ORIGIN=https://<actual-vercel-preview-host>.vercel.app
CORS_ORIGINS=https://<actual-vercel-preview-host>.vercel.app
INVITATION_DELIVERY_MODE=disabled
```

The app intentionally refuses staging startup if `PUBLIC_WEB_ORIGIN` is missing, not HTTPS, or not present in the exact CORS allowlist.

**Blocker:** Initial Prisma migration and npm lockfile are currently stored as CI review artifacts, not committed and approved. Review/commit them and confirm runtime DB access before connecting a durable staging database or declaring this deployable.

## 4. Invitation-link security

- Backend invitation links must be constructed from the **configured trusted HTTPS frontend origin**, never from `Host` or `X-Forwarded-Host` request headers.
- `src/config/web-origin.ts` validates the origin and specifies the eventual `/accept-owner-invitation.html#token=...` link shape. **This page and redemption HTTP route are not yet implemented.**
- A future acceptance page must set `Referrer-Policy: no-referrer`, remove the invitation fragment from browser history immediately, avoid third-party analytics/assets on the token page, submit the token to a rate-limited API, and never echo it to logs.
- The backend enforces `INVITATION_DELIVERY_MODE=disabled` because no verified mail sender is connected.
- A Vercel-generated web URL is **not** an email-sending domain. Providers such as Resend may restrict sending to an account's own verified email until a sending domain is verified; use synthetic test emails until then.
- Do not email the provided private owner-administrator address until the provider, sender identity, secure acceptance page, API and staging URLs have been verified.

## 5. Staging acceptance checklist

- [ ] GitHub backend and website CI both green
- [ ] Versioned initial SQL migration reviewed and committed
- [ ] `package-lock.json` reviewed and committed; use `npm ci` for reproducibility
- [ ] Separate staging DB created, backup/restoration expectations documented
- [ ] Vercel site preview URL generated; static frontend allowlist tested
- [ ] HTTPS Render API endpoint provisioned, with safe startup configuration
- [ ] API readiness and public unpublished-menu behavior verified over HTTPS
- [ ] CORS allows only the exact public frontend URL
- [ ] Invitation link builder and origin validation tests green
- [ ] Secure owner redemption UI, API endpoint, rate limits and staff login implemented and tested
- [ ] Email delivery configured with an approved sender (not merely a Vercel/Render hostname)
- [ ] Owner confirms operational data before restaurant activation

**No production merge or real owner invitation has been authorized.**

## Official references

- Vercel generated URLs: https://vercel.com/docs/deployments/generated-urls
- Vercel ignore rules: https://vercel.com/docs/deployments/vercel-ignore
- Vercel Deployment Protection: https://vercel.com/docs/deployment-protection
- Render web services: https://render.com/docs/web-services
- Render monorepos: https://render.com/docs/monorepo-support
- Neon database branching: https://neon.com/branching
- OWASP secure token URL and Referrer Policy: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
