/**
 * Cloudflare Workers bindings and secrets used by ERAMORA.
 *
 * DB      - D1 database binding (required); its application schema is
 *           initialized on first request.
 * ASSETS  - Static asset binding for the built Vite output in ./dist.
 * FILES   - Optional R2 bucket for admin image uploads. When absent, uploads
 *           fall back to a D1 `media` table so the store works with D1 only.
 */
export interface Env extends Cloudflare.Env {
  FILES?: R2Bucket;
}
