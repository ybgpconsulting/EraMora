# ERAMORA — Where Fragrance Meets Emotion

A production-ready luxury fragrance storefront running entirely on **Cloudflare Workers**: a React 19 + Vite single-page storefront, a Worker API, D1 persistence, and a PWA build.

The Worker is the only server entry (`worker.ts`).

No payment gateway or shipping-carrier account is required. Customers send their order requests to the WhatsApp concierge, and the ERAMORA team confirms payment and shipping manually.

## Architecture

| Layer | Technology |
| --- | --- |
| Storefront | React 19, Vite 8, Tailwind CSS 4, PWA (`vite-plugin-pwa`) |
| API | `worker.ts` → `server/app.ts` (Workers-native router) |
| Database | Cloudflare D1, schema created and seeded automatically on first request |
| Media | D1 `media` table by default, or R2 when a `FILES` binding exists |
| Auth | HMAC-SHA256 signed session cookie (Web Crypto) |

The Worker serves `/api/*`, `/uploads/*`, and `/sitemap.xml`; every other request falls through to the static `ASSETS` binding with SPA routing.

## Local development

```bash
npm install
# Run once to create local Worker settings.
Copy-Item .dev.vars.example .dev.vars
# Edit .dev.vars and set a random SESSION_SECRET (32+ characters) and a unique
# ADMIN_DEMO_PASSWORD (12–256 characters) before starting the Worker.
npm run dev
```

On the first API request the Worker creates the D1 schema and seeds an initial demo catalogue only when `app_state` is empty. Existing catalogues are never replaced automatically. A versioned one-time migration removes retired order/customer data and corrects legacy demo image paths while preserving catalogue and administrator edits.

- Local admin: `admin@eramora.in` / the password set in `.dev.vars` before the first API request

The admin portal manages catalogue, banners, and contact settings. Customers can send a WhatsApp
enquiry; it is not an order, purchase, or payment confirmation.

`npm run dev` builds the SPA into `dist/` and starts `wrangler dev` on <http://localhost:3000> with a local D1 database in `.wrangler/`.

### Useful scripts

```bash
npm run typecheck  # TypeScript for the client and the Worker
npm run lint       # alias for typecheck
npm test           # unit and Worker API tests
npm run build      # production SPA build
npm run deploy     # build + wrangler deploy
npm run clean      # remove dist/, dev-dist/, and local Worker state
```

## WhatsApp enquiries

- This site does not collect customer accounts, delivery addresses, orders, or payments.
- WhatsApp messages contain item selections only. The concierge confirms product details, availability, pricing, applicable taxes, and delivery directly.
- Sending a WhatsApp message does not place or confirm a purchase.
- Items marked demo/sample are catalogue concepts and are not for sale.

## Data and secrets

- `app_state` holds the catalogue, administrator, banners, and contact settings with optimistic concurrency.
- `rate_limits` holds shared fixed-window API rate-limit counters.
- `media` stores admin image uploads when R2 is not bound.
- Runtime schema setup is idempotent; `migrations/` contains the corresponding D1 migrations.

Set both Worker secrets before enabling administrator access in production:

```bash
npx wrangler secret put ADMIN_DEMO_PASSWORD  # unique password, 12–256 characters
npx wrangler secret put SESSION_SECRET       # random secret, at least 32 characters
```

`wrangler.jsonc` declares both secrets as required, so deployments fail when either is missing.
Each `wrangler secret put` command deploys a new Worker version immediately. For a first deployment,
create an ignored `.prod.secrets` JSON file containing both production secrets and deploy them with:

```bash
npm run build
npx wrangler deploy --secrets-file .prod.secrets
```

Keep `.prod.secrets` out of source control and never reuse `.dev.vars` values in production.
Administrator login fails closed if either secret is missing or invalid. Generate a unique session
secret and never store it in source control or Wrangler `vars`.

Worker binding types are generated from `wrangler.jsonc`. Run `npm run types:worker` after changing
bindings or required secrets; `npm run typecheck` checks that the committed generated types are current.

Canonical URLs and sitemap entries use the fixed public origin `https://eramora.in`,
configured in `src/utils/seo.ts`. `APP_URL` does not override this canonical origin.

### Optional R2 uploads

Create the bucket and uncomment the `r2_buckets` binding in `wrangler.jsonc`:

```bash
wrangler r2 bucket create eramora-uploads
```

The upload endpoint automatically prefers R2 over the D1 fallback.

## Deploying from a fresh Cloudflare account

```bash
wrangler login
wrangler d1 create eramora-store
# copy the returned database_id into wrangler.jsonc
# create .prod.secrets with the two required production secrets
npm run build
npx wrangler deploy --secrets-file .prod.secrets
```

1. `wrangler d1 create` prints the `database_id`; replace the placeholder in `wrangler.jsonc`.
2. The first deployment uploads the required secrets with the Worker. Later deployments can use `npm run deploy`.
3. Wrangler attaches `eramora.in` and `www.eramora.in` as custom domains and disables the public
   `workers.dev` and Preview URLs. In the Cloudflare zone's SSL/TLS > Edge Certificates settings,
   set **Minimum TLS Version** to **TLS 1.2** and enable **Always Use HTTPS**. These zone settings
   are managed separately from Wrangler; verify them after configuration changes. The Worker also
   redirects production GET/HEAD requests to HTTPS and rejects other plaintext requests.
4. The Worker creates its runtime schema on first request and migrates existing application state without resetting the catalogue. You can apply the tracked SQL migrations explicitly with `npx wrangler d1 migrations apply eramora-store --remote`.
5. Before launch, an owner must verify the grievance officer identity and contact/address details
   shown on the site, and approve the live catalogue, product imagery, and commercial claims.

Validate the bundle without publishing:

```bash
npm run build
npx wrangler deploy --dry-run
```

To pre-create the schema explicitly instead of relying on first-request initialization:

```bash
wrangler d1 migrations apply eramora-store --remote
```

The migration is idempotent and matches the runtime schema; the Worker still seeds an empty database on its first request.

Production tracing is enabled at a 5% sample rate to limit trace volume; logs remain enabled for
all invocations. Review observability usage after launch and adjust sampling to actual traffic.

For Freebuff Sites, use the same `dist/` output and Worker entry through the Sites deployment manifest.

## Security notes

- Passwords use PBKDF2-SHA256 (100,000 iterations) via Web Crypto.
- Sessions are HttpOnly, SameSite=Lax cookies; `Secure` is set on HTTPS.
- Admin routes verify a signed session and current administrator record. A configured `SESSION_SECRET` of at least 32 characters is required for signing.
- Login rate limits are stored in D1 and shared across Worker isolates.
- Mutating API requests reject cross-origin browser requests. Retired personal-data endpoints return `410 Gone`.
- API request bodies are streamed and size-limited; product image uploads have a separate limit.
- Product edits validate variant pricing, stock, and image URLs. Uploads are size-limited and checked against PNG, JPEG, or WEBP file signatures.
- API responses are `no-store`; responses include framing, MIME-sniffing, referrer, permissions, and HTTPS transport protections.
