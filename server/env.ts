/**
 * Cloudflare Workers bindings and secrets used by ERAMORA.
 *
 * DB      - D1 database (required). Created automatically on first request.
 * ASSETS  - Static asset binding for the built Vite output in ./dist.
 * FILES   - Optional R2 bucket for admin image uploads. When absent, uploads
 *           fall back to a D1 `media` table so the store works with D1 only.
 */
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  FILES?: R2Bucket;

  SESSION_SECRET?: string;
  ADMIN_DEMO_PASSWORD?: string;
  APP_URL?: string;
  ENVIRONMENT?: string;
}
