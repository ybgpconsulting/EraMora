import { base64UrlDecode, base64UrlEncode, hmacSha256Base64Url, randomHex, timingSafeEqualString } from './crypto';
import type { Env } from './env';
import { createInitialSeed, type DatabaseSchema } from './seed';

const SESSION_COOKIE = 'eramora_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

interface StoredState {
  data: DatabaseSchema;
  version: number;
}

let cached: StoredState | null = null;
let schemaReady = false;
let activeEnv: Env | null = null;

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS app_state (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     data TEXT NOT NULL,
     version INTEGER NOT NULL DEFAULT 1
   )`,
  `CREATE TABLE IF NOT EXISTS app_meta (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS media (
     key TEXT PRIMARY KEY,
     content_type TEXT NOT NULL,
     data BLOB NOT NULL,
     created_at TEXT NOT NULL
   )`,
];

/**
 * Called once per request before any handler runs. Creates the schema on the
 * first request of an isolate, seeds the demo catalogue when the database is
 * empty, and refreshes the per-isolate snapshot so cross-isolate admin edits
 * are visible immediately.
 */
export async function initDb(env: Env): Promise<void> {
  activeEnv = env;

  if (!schemaReady) {
    await env.DB.batch(SCHEMA_STATEMENTS.map((sql) => env.DB.prepare(sql)));
    schemaReady = true;
  }

  const row = await env.DB.prepare('SELECT data, version FROM app_state WHERE id = 1').first<{
    data: string;
    version: number;
  }>();

  if (row) {
    const data = JSON.parse(row.data) as DatabaseSchema;
    const categories = Array.isArray(data.categories) ? data.categories : [];
    const products = Array.isArray(data.products) ? data.products : [];
    const users = Array.isArray(data.users) ? data.users : [];
    const orders = Array.isArray(data.orders) ? data.orders : [];
    const enquiries = Array.isArray(data.enquiries) ? data.enquiries : [];
    const abandonedCarts = Array.isArray(data.abandonedCarts) ? data.abandonedCarts : [];
    const oldCategorySlugs = new Set(['fragrance', 'home-fragrance', 'gift-sets', 'luxury-gifts', 'lifestyle-accessories']);
    const hasLegacyCategories = categories.some((category) => oldCategorySlugs.has(category.slug));
    const approvedSlugs = new Set([
      'curated-fragrances',
      'scented-candles',
      'sculptural-candles',
      'diy-colouring-kits',
      'gifting',
    ]);
    const needsCatalogueMigration =
      hasLegacyCategories ||
      categories.length !== 5 ||
      categories.some((category) => !approvedSlugs.has(category.slug)) ||
      products.length !== 25;

    if (needsCatalogueMigration) {
      const seed = await createInitialSeed(env);
      data.categories = seed.categories;
      data.products = seed.products;
      data.reviews = [];
      data.coupons = [];
      data.orders = [];
      data.users = users.filter((user) => user.role === 'admin');
      data.enquiries = [];
      data.abandonedCarts = [];
      data.settings = seed.settings;
      data.banners = seed.banners;
      await env.DB.prepare(
        'UPDATE app_state SET data = ?, version = version + 1 WHERE id = 1 AND version = ?'
      ).bind(JSON.stringify(data), row.version).run();
      cached = { data, version: row.version + 1 };
      return;
    }

    const adminUsers = users.filter((user) => user.role === 'admin');
    const hasLegacyRecords =
      orders.length > 0 ||
      enquiries.length > 0 ||
      abandonedCarts.length > 0 ||
      adminUsers.length !== users.length;
    data.orders = [];
    data.users = adminUsers;
    data.enquiries = [];
    data.abandonedCarts = [];
    if (hasLegacyRecords) {
      await env.DB.prepare(
        'UPDATE app_state SET data = ?, version = version + 1 WHERE id = 1 AND version = ?'
      ).bind(JSON.stringify(data), row.version).run();
      cached = { data, version: row.version + 1 };
      return;
    }
    cached = { data, version: row.version };
    return;
  }

  const seed = await createInitialSeed(env);
  await env.DB.prepare('INSERT OR IGNORE INTO app_state (id, data, version) VALUES (1, ?, 1)')
    .bind(JSON.stringify(seed))
    .run();

  const inserted = await env.DB.prepare('SELECT data, version FROM app_state WHERE id = 1').first<{
    data: string;
    version: number;
  }>();

  cached = inserted
    ? { data: JSON.parse(inserted.data) as DatabaseSchema, version: inserted.version }
    : { data: seed, version: 1 };
}

export function getDb(): DatabaseSchema {
  if (!cached) {
    throw new Error('Database has not been initialised for this request.');
  }
  return cached.data;
}

/**
 * Read-modify-write with optimistic locking. Mutators are replayed against the
 * latest committed state on a version conflict, so concurrent checkouts cannot
 * silently overwrite each other. The whole document is small (catalogue +
 * orders), which keeps this simple and atomic for a boutique store.
 */
export async function saveDb(mutator: (db: DatabaseSchema) => void): Promise<DatabaseSchema> {
  const env = activeEnv;
  if (!env) throw new Error('Database has not been initialised for this request.');

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const row = await env.DB.prepare('SELECT data, version FROM app_state WHERE id = 1').first<{
      data: string;
      version: number;
    }>();
    if (!row) throw new Error('Database state is missing.');

    const draft = JSON.parse(row.data) as DatabaseSchema;
    mutator(draft);

    const result = await env.DB.prepare(
      'UPDATE app_state SET data = ?, version = version + 1 WHERE id = 1 AND version = ?'
    )
      .bind(JSON.stringify(draft), row.version)
      .run();

    if (result.meta.changes === 1) {
      cached = { data: draft, version: row.version + 1 };
      return draft;
    }

    lastError = new Error('Concurrent write conflict; retrying.');
    await new Promise((resolve) => setTimeout(resolve, 10 + Math.floor(Math.random() * 40)));
  }

  throw lastError || new Error('Unable to persist changes.');
}

export interface SessionPayload {
  userId: string;
  role: 'customer' | 'admin';
  email: string;
  exp: number;
}

let cachedSecret: string | null = null;

/**
 * Uses SESSION_SECRET when provided. Otherwise a 256-bit secret is generated
 * once and persisted in D1, so sessions survive redeploys and stay consistent
 * across isolates without requiring any setup.
 */
export async function getSessionSecret(env: Env): Promise<string> {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  if (cachedSecret) return cachedSecret;

  const existing = await env.DB.prepare("SELECT value FROM app_meta WHERE key = 'session_secret'").first<{
    value: string;
  }>();
  if (existing?.value) {
    cachedSecret = existing.value;
    return existing.value;
  }

  const generated = randomHex(32);
  await env.DB.prepare("INSERT OR IGNORE INTO app_meta (key, value) VALUES ('session_secret', ?)")
    .bind(generated)
    .run();
  const stored = await env.DB.prepare("SELECT value FROM app_meta WHERE key = 'session_secret'").first<{
    value: string;
  }>();
  cachedSecret = stored?.value || generated;
  return cachedSecret;
}

export async function signSessionToken(
  env: Env,
  payload: Omit<SessionPayload, 'exp'>
): Promise<string> {
  const full: SessionPayload = { ...payload, exp: Date.now() + SESSION_TTL_MS };
  const encoded = base64UrlEncode(JSON.stringify(full));
  const signature = await hmacSha256Base64Url(await getSessionSecret(env), encoded);
  return `${encoded}.${signature}`;
}

export async function verifySessionToken(env: Env, token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const expected = await hmacSha256Base64Url(await getSessionSecret(env), encoded);
  if (!timingSafeEqualString(signature, expected)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(encoded)) as SessionPayload;
    if (!parsed || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function sanitizeString(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

export { SESSION_COOKIE };
