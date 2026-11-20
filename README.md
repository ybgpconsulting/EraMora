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
npm run dev
```

There is no migration or seed command to run. On the first API request the Worker creates the D1 schema and seeds a demo catalogue, settings, coupons, sample orders, and a local administrator:

- Local admin: `admin@eramora.in` / the development-only password in `.dev.vars`
- Coupons: `WELCOME10`, `GIFT250`

Customers shop and request orders as guests. There is no customer sign-in or account requirement.
The storefront sends an itemized order request to WhatsApp; the ERAMORA team confirms stock,
shipping, and payment manually, then records the order and courier details in the admin dashboard.

`npm run dev` builds the SPA into `dist/` and starts `wrangler dev` on <http://localhost:3000> with a local D1 database in `.wrangler/`.

### Useful scripts

```bash
npm run typecheck  # TypeScript for the client and the Worker
npm run lint       # alias for typecheck
npm test           # unit tests (pricing, validation, Razorpay HMAC)
npm run build      # production SPA build
npm run deploy     # build + wrangler deploy
npm run clean      # remove dist/, dev-dist/, and local Worker state
```

## Ordering and shipping

- Customers do not create accounts. The guest checkout sends the bag, delivery contact, and address details to WhatsApp.
- A WhatsApp request is not an order confirmation: the team confirms stock, total, payment method, and delivery with the customer.
- The admin dashboard records confirmed WhatsApp orders and updates payment, fulfillment, courier, and tracking details manually.
- Customers can track recorded orders with their order number and matching contact details.

## Data and secrets

- `app_state` holds the store document (catalogue, manually recorded orders, administrator, settings) with optimistic concurrency, so concurrent admin order entries cannot oversell stock.
- `app_meta` stores the auto-generated session signing secret when `SESSION_SECRET` is not provided.
- `media` stores admin image uploads when R2 is not bound.
- The runtime schema lives in `server/db.ts`; `migrations/0001_init.sql` mirrors it for teams that prefer explicit migrations. Running the migration is optional.

Production administrator setup (required before the first production API request):

```bash
wrangler secret put ADMIN_DEMO_PASSWORD  # choose a unique password between 12 and 256 characters
wrangler secret put SESSION_SECRET       # recommended; otherwise generated and stored in D1
```

Never use the local demo password in production. Existing databases that contain the old demo
administrator hash are upgraded to the configured `ADMIN_DEMO_PASSWORD` on the first production
login. If the production password is missing or invalid, administrator login fails closed.

Set `APP_URL` as a plain variable so canonical sitemap links point at the public origin.

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
npm run deploy
```

1. `wrangler d1 create` prints the `database_id`; replace the placeholder in `wrangler.jsonc`.
2. `npm run deploy` runs `vite build` and `wrangler deploy`.
3. **No separate migration, seed, or SQL step is required.** The first request to the deployed Worker creates `app_state`, `app_meta`, and `media` if they are missing, then seeds the catalogue, settings, and administrator. Set `ADMIN_DEMO_PASSWORD` before the first production API request.

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

For Freebuff Sites, use the same `dist/` output and Worker entry through the Sites deployment manifest.

## Security notes

- Passwords use PBKDF2-SHA256 (100,000 iterations) via Web Crypto.
- Sessions are HttpOnly, SameSite=Lax cookies; `Secure` is set on HTTPS.
- Production admin setup fails closed without `ADMIN_DEMO_PASSWORD`; legacy demo hashes are upgraded on first production login.
- Admin routes verify both the signed session and the current administrator record. Login and order tracking are rate-limited.
- Mutating API requests reject cross-origin browser requests; public order tracking requires a matching order number and contact and omits private address/internal notes.
- Product edits validate variant pricing, stock, and image URLs. Uploads are size-limited and checked against PNG, JPEG, or WEBP file signatures.
- API responses are `no-store`; responses include framing, MIME-sniffing, referrer, permissions, and HTTPS transport protections.
