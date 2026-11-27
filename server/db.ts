import { base64UrlDecode, base64UrlEncode, hmacSha256Base64Url, timingSafeEqualString } from './crypto';
import type { Env } from './env';
import { createDiyKitProducts, DIY_KIT_CATEGORY_DESCRIPTION, DIY_KIT_CATEGORY_IMAGE } from './diy-kit-products';
import {
  createInitialSeed,
  DATABASE_SCHEMA_VERSION,
  normalizeSeededSampleProduct,
  SEEDED_SAMPLE_PRODUCT_IDS,
  type DatabaseSchema,
} from './seed';

const SESSION_COOKIE = 'eramora_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
interface StoredState {
  data: DatabaseSchema;
  version: number;
}

type PersistedDatabaseSchema = DatabaseSchema & {
  schemaVersion?: number;
  orders?: unknown[];
  reviews?: unknown[];
  enquiries?: unknown[];
  abandonedCarts?: unknown[];
  coupons?: unknown[];
  settings: DatabaseSchema['settings'] & {
    freeShippingThreshold?: unknown;
    standardShippingFee?: unknown;
    giftWrapFee?: unknown;
    gstRatePercent?: unknown;
    taxInclusive?: unknown;
    codEnabled?: unknown;
    razorpayEnabled?: unknown;
    lowStockThreshold?: unknown;
    policies?: unknown;
  };
};

let cached: StoredState | null = null;
let schemaReady = false;
let activeEnv: Env | null = null;

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS app_state (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     data TEXT NOT NULL,
     version INTEGER NOT NULL DEFAULT 1
   )`,
  `CREATE TABLE IF NOT EXISTS media (
     key TEXT PRIMARY KEY,
     content_type TEXT NOT NULL,
     data BLOB NOT NULL,
     created_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
     key TEXT PRIMARY KEY,
     count INTEGER NOT NULL,
     reset_at INTEGER NOT NULL
   )`,
  'DROP TABLE IF EXISTS app_meta',
];

/**
 * Called once per request before any handler runs. Creates the schema on the
 * first request of an isolate, seeds only an empty database, applies versioned
 * data migrations without replacing the catalogue, and refreshes the snapshot.
 */
export async function initDb(env: Env): Promise<void> {
  activeEnv = env;

  if (!schemaReady) {
    await env.DB.batch(SCHEMA_STATEMENTS.map((sql) => env.DB.prepare(sql)));
    schemaReady = true;
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const row = await env.DB.prepare('SELECT data, version FROM app_state WHERE id = 1').first<{
      data: string;
      version: number;
    }>();

    if (row) {
      const data = JSON.parse(row.data) as PersistedDatabaseSchema;
      const storedSchemaVersion = Number.isSafeInteger(data.schemaVersion)
        ? Number(data.schemaVersion)
        : 0;
      if (storedSchemaVersion < DATABASE_SCHEMA_VERSION) {
        const legacyImages = new Map([
          ['/src/assets/images/hero_eramora_atelier_1794827348612.jpg', '/brand/eramora/campaigns/brand-introduction.jpg'],
          ['/src/assets/images/product_candle_oud_velvet_1794827351032.jpg', '/brand/eramora/campaigns/fragrance-art.jpg'],
          ['/src/assets/images/product_reed_diffuser_neroli_1794827350244.jpg', '/brand/eramora/campaigns/fragrance-art.jpg'],
          ['/src/assets/images/product_gift_coffret_luxury_1794827351996.jpg', '/brand/eramora/campaigns/thoughtful-gifting.jpg'],
          ['/src/assets/images/editorial_lifestyle_ritual_1794827351121.jpg', '/brand/eramora/campaigns/brand-introduction.jpg'],
        ]);

        if (storedSchemaVersion < 4) {
          delete data.orders;
          delete data.reviews;
          delete data.enquiries;
          delete data.abandonedCarts;
          delete data.coupons;
          data.users = Array.isArray(data.users)
            ? data.users.filter((user) => user.role === 'admin')
            : [];
          if (Array.isArray(data.categories)) {
            data.categories = data.categories.map((category) => ({
              ...category,
              image: legacyImages.get(category.image) || category.image,
            }));
          }
          if (data.banners?.heroImage) {
            data.banners.heroImage = legacyImages.get(data.banners.heroImage) || data.banners.heroImage;
          }
          if (data.banners?.campaignSubtitle?.startsWith('Every ERAMORA coffret arrives wrapped in warm ivory linen')) {
            data.banners.campaignSubtitle =
              'Explore gifting concepts and ask our concierge about current options and availability.';
          }
          if (data.settings) {
            delete data.settings.freeShippingThreshold;
            delete data.settings.standardShippingFee;
            delete data.settings.giftWrapFee;
            delete data.settings.gstRatePercent;
            delete data.settings.taxInclusive;
            delete data.settings.codEnabled;
            delete data.settings.razorpayEnabled;
            delete data.settings.lowStockThreshold;
            delete data.settings.policies;
          }
        }

        const legacyCategoryDescriptions = new Map([
          ['cat-curated-fragrances', 'A curated edit of artisanal eau de parfum compositions crafted with slow maceration.'],
          ['cat-scented-candles', 'Hand-poured botanical wax candles formulated for calm, luminous, and meditative evenings.'],
          ['cat-sculptural-candles', 'Architectural candle forms hand-poured in natural soy and beeswax blends where form meets fragrance.'],
          ['cat-diy-colouring-kits', 'Mindful art and botanical colouring kits designed for slow, unhurried, contemplative play.'],
          ['cat-gifting', 'Artisanal gift coffrets presented in warm ivory linen boxes with champagne satin ribbons.'],
        ]);
        const safeCategoryDescriptions = new Map([
          ['cat-curated-fragrances', 'Explore fragrance concepts in the ERAMORA sample catalogue. Notes, formulation, price and availability require confirmation.'],
          ['cat-scented-candles', 'Explore candle concepts in the ERAMORA sample catalogue. Materials, specifications, price and availability require confirmation.'],
          ['cat-sculptural-candles', 'Explore sculptural candle concepts. Materials, dimensions, specifications and availability require confirmation.'],
          ['cat-diy-colouring-kits', 'Explore creative-kit concepts. Materials, contents, specifications and availability require confirmation.'],
          ['cat-gifting', 'Explore gifting concepts. Product combinations, presentation, pricing and delivery details are confirmed by the concierge.'],
        ]);
        if (Array.isArray(data.categories)) {
          data.categories = data.categories.map((category) =>
            legacyCategoryDescriptions.get(category.id) === category.description
              ? { ...category, description: safeCategoryDescriptions.get(category.id) || category.description }
              : category
          );
        }

        if (data.banners) {
          if (data.banners.announcementText === 'Complimentary boutique shipping across India · Concierge assistance on WhatsApp') {
            data.banners.announcementText = 'Product and gifting enquiries on WhatsApp';
          }
          if (data.banners.heroSubheadline === 'Curated fragrances, hand-poured candles and thoughtful gifting.') {
            data.banners.heroSubheadline = 'Explore fragrance, candle and gifting concepts.';
          }
          if (
            data.banners.campaignSubtitle ===
              'Every ERAMORA coffret arrives wrapped in warm ivory linen paper, sealed with champagne ribbon and your personal handwritten note.' ||
            data.banners.campaignSubtitle ===
              'Every ERAMORA coffret arrives wrapped in warm ivory linen paper, sealed with champagne ribbon and your personal note.'
          ) {
            data.banners.campaignSubtitle =
              'Explore gifting concepts and ask our concierge about current options and availability.';
          }
        }

        const sampleProductIds = new Set(SEEDED_SAMPLE_PRODUCT_IDS);
        data.products = Array.isArray(data.products)
          ? data.products.map((product) =>
              sampleProductIds.has(product.id) ? normalizeSeededSampleProduct(product) : product
            )
          : [];

        if (!Array.isArray(data.categories)) data.categories = [];
        const diyCategory = data.categories.find((category) => category.id === 'cat-diy-colouring-kits');
        if (diyCategory) {
          if (
            diyCategory.description ===
            'Explore creative-kit concepts. Materials, contents, specifications and availability require confirmation.'
          ) {
            diyCategory.description = DIY_KIT_CATEGORY_DESCRIPTION;
          }
          if (diyCategory.image === '/brand/eramora/campaigns/brand-introduction.jpg') {
            diyCategory.image = DIY_KIT_CATEGORY_IMAGE;
          }
        } else {
          data.categories.push({
            id: 'cat-diy-colouring-kits',
            name: 'DIY Colouring Kits',
            slug: 'diy-colouring-kits',
            description: DIY_KIT_CATEGORY_DESCRIPTION,
            image: DIY_KIT_CATEGORY_IMAGE,
            featured: true,
            sortOrder: 4,
          });
        }

        const existingProductIds = new Set(data.products.map((product) => product.id));
        const existingProductSlugs = new Set(data.products.map((product) => product.slug));
        const newDiyProducts = createDiyKitProducts(new Date().toISOString()).filter(
          (product) => !existingProductIds.has(product.id) && !existingProductSlugs.has(product.slug)
        );
        data.products.push(...newDiyProducts);
        data.schemaVersion = DATABASE_SCHEMA_VERSION;

        const result = await env.DB.prepare(
          'UPDATE app_state SET data = ?, version = version + 1 WHERE id = 1 AND version = ?'
        ).bind(JSON.stringify(data), row.version).run();
        if (result.meta.changes === 1) {
          cached = { data, version: row.version + 1 };
          return;
        }
        continue;
      }

      cached = { data, version: row.version };
      return;
    }

    const seed = await createInitialSeed(env);
    seed.schemaVersion = DATABASE_SCHEMA_VERSION;
    await env.DB.prepare('INSERT OR IGNORE INTO app_state (id, data, version) VALUES (1, ?, 1)')
      .bind(JSON.stringify(seed))
      .run();
  }

  throw new Error('Unable to initialize the database after repeated concurrent updates.');
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
  role: 'admin';
  email: string;
  exp: number;
}

export async function getSessionSecret(env: Env): Promise<string> {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET must be configured with at least 32 characters.');
  }
  return env.SESSION_SECRET;
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
  if (!token || !env.SESSION_SECRET || env.SESSION_SECRET.length < 32) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;
  const expected = await hmacSha256Base64Url(await getSessionSecret(env), encoded);
  if (!timingSafeEqualString(signature, expected)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(encoded)) as SessionPayload;
    if (
      !parsed ||
      typeof parsed.userId !== 'string' ||
      parsed.role !== 'admin' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.exp !== 'number' ||
      Date.now() > parsed.exp
    ) {
      return null;
    }
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
