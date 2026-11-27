import assert from 'node:assert/strict';
import test from 'node:test';
import { getDb, initDb, signSessionToken, verifySessionToken } from './db';
import { DATABASE_SCHEMA_VERSION, SEEDED_SAMPLE_PRODUCT_IDS } from './seed';
import type { Env } from './env';

test('versioned startup migration preserves catalogue edits and administrator data', async () => {
  const legacyState = {
    categories: [{
      id: 'cat-custom',
      name: 'Edited category',
      description: 'Owner-authored category description.',
      image: '/src/assets/images/hero_eramora_atelier_1794827348612.jpg',
    }],
    products: [
      {
        id: 'prod-custom',
        name: 'Administrator-edited name',
        variants: [{ price: 2500, stock: 7 }],
        images: ['/src/assets/images/product_perfume_saffron_noir_1794827349377.jpg'],
      },
      {
        id: 'prod-legacy-asd',
        slug: 'asd',
        name: 'Asd',
        subtitle: '',
        description: '',
        variants: [{ id: 'var-asd', label: '220g', size: '220g', price: 1950, stock: 15, sku: 'ERA-826' }],
        isArchived: false,
      },
      {
        id: 'prod-legacy-candle',
        slug: 'candle',
        name: 'cANDLE',
        subtitle: '',
        description: '',
        variants: [{ id: 'var-candle', label: '220g', size: '220g', price: 1950, stock: 15, sku: 'ERA-671' }],
        isArchived: false,
      },
      ...SEEDED_SAMPLE_PRODUCT_IDS.map((id) => ({
        id,
        name: `Sample ${id}`,
        subtitle: 'Unverified fragrance details',
        description: 'Unverified commercial description with claims that should not remain public.',
        specifications: { volume: '50 ml' },
        fragranceNotes: { top: ['Bergamot'], heart: ['Rose'], base: ['Musk'] },
        ingredientsOrMaterials: 'Unverified materials',
        variants: [{ id: 'var-1', label: '50 ml', size: '50 ml', price: 2499, stock: 12, sku: 'ERA-123' }],
        badges: ['Bestseller'],
        isShowcaseDemo: false,
        isFeatured: true,
        isBestseller: true,
        isNewArrival: true,
        ratingAverage: 4.9,
        reviewCount: 17,
      })),
    ],
    users: [
      { id: 'admin-1', role: 'admin', email: 'admin@example.com' },
      { id: 'customer-1', role: 'customer', email: 'customer@example.com' },
    ],
    banners: {
      heroImage: '/src/assets/images/editorial_lifestyle_ritual_1794827351121.jpg',
      heroHeadline: 'Owner-edited campaign heading.',
      campaignSubtitle:
        'Every ERAMORA coffret arrives wrapped in warm ivory linen paper, sealed with champagne ribbon and your personal note.',
    },
    settings: { brandName: 'ERAMORA custom', freeShippingThreshold: 5000, policies: { privacy: 'old copy' } },
    orders: [{ id: 'order-1', customerEmail: 'customer@example.com' }],
    reviews: [{ id: 'review-1', authorName: 'Customer' }],
    enquiries: [{ id: 'enquiry-1', email: 'customer@example.com' }],
    abandonedCarts: [{ id: 'cart-1', email: 'customer@example.com' }],
    coupons: [{ code: 'OLD' }],
  };
  let storedData = JSON.stringify(legacyState);
  let storedVersion = 4;
  const fakeDb = {
    batch: async () => [],
    prepare(query: string) {
      let values: unknown[] = [];
      return {
        bind(...nextValues: unknown[]) {
          values = nextValues;
          return this;
        },
        first: async <T,>() => ({ data: storedData, version: storedVersion }) as T,
        run: async () => {
          if (query.startsWith('UPDATE app_state')) {
            if (values[1] !== storedVersion) return { meta: { changes: 0 } };
            storedData = String(values[0]);
            storedVersion += 1;
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },
      };
    },
  };

  await initDb({ DB: fakeDb } as unknown as Env);
  const migrated = getDb() as typeof legacyState & { schemaVersion: number };
  assert.equal(migrated.products[0].name, 'Administrator-edited name');
  assert.equal(migrated.products[0].variants[0].price, 2500);
  assert.equal(migrated.products[0].variants[0].stock, 7);
  assert.equal(migrated.products[0].images[0], '/src/assets/images/product_perfume_saffron_noir_1794827349377.jpg');
  assert.equal(migrated.categories[0].name, 'Edited category');
  assert.equal(migrated.categories[0].description, 'Owner-authored category description.');
  assert.equal(migrated.categories[0].image, '/brand/eramora/campaigns/brand-introduction.jpg');
  assert.equal(migrated.banners.heroImage, '/brand/eramora/campaigns/brand-introduction.jpg');
  assert.equal(migrated.banners.heroHeadline, 'Owner-edited campaign heading.');
  assert.equal(migrated.settings.brandName, 'ERAMORA custom');
  assert.deepEqual(migrated.users.map((user) => user.id), ['admin-1']);
  assert.equal(
    migrated.banners.campaignSubtitle,
    'Explore gifting concepts and ask our concierge about current options and availability.'
  );
  assert.equal(migrated.schemaVersion, DATABASE_SCHEMA_VERSION);
  const normalizedSamples = migrated.products.filter((product) =>
    SEEDED_SAMPLE_PRODUCT_IDS.includes(product.id)
  );
  assert.equal(normalizedSamples.length, 25);
  for (const product of normalizedSamples) {
    assert.equal(product.isShowcaseDemo, true);
    assert.equal(product.variants[0].price, 0);
    assert.equal(product.variants[0].stock, 0);
    assert.equal(product.variants[0].sku, '');
    assert.deepEqual(product.specifications, {});
    assert.equal(product.fragranceNotes, undefined);
    assert.equal(product.ingredientsOrMaterials, '');
    assert.deepEqual(product.badges, []);
    assert.equal(product.isFeatured, false);
    assert.equal(product.isBestseller, false);
    assert.equal(product.isNewArrival, false);
    assert.equal(product.ratingAverage, 0);
    assert.equal(product.reviewCount, 0);
    assert.match(product.description, /sample catalogue concept only/i);
  }
  const diyProducts = migrated.products.filter((product) => product.id.startsWith('diy-colouring-kit-'));
  assert.equal(diyProducts.length, 13);
  const archivedLegacyListings = (migrated.products as Array<{
    id: string;
    slug?: string;
    name: string;
    description?: string;
    isArchived?: boolean;
    updatedAt?: string;
  }>).filter((product) => product.slug === 'asd' || product.slug === 'candle');
  assert.equal(archivedLegacyListings.length, 2);
  assert.ok(archivedLegacyListings.every((product) => product.isArchived));
  assert.deepEqual(
    archivedLegacyListings.map((product) => [product.slug, product.name, product.description]),
    [['asd', 'Asd', ''], ['candle', 'cANDLE', '']]
  );
  assert.ok(archivedLegacyListings.every((product) => Boolean(product.updatedAt)));
  assert.equal(
    migrated.categories.find((category) => category.slug === 'diy-colouring-kits')?.description,
    'Discover creative DIY colouring kits featuring decorative jars, bowls, trays and trinket dishes. Personalise your favourite designs with your own creative touch.'
  );
  for (const retiredField of ['orders', 'reviews', 'enquiries', 'abandonedCarts', 'coupons']) {
    assert.equal(retiredField in migrated, false);
  }
  assert.equal('freeShippingThreshold' in migrated.settings, false);
  assert.equal('policies' in migrated.settings, false);

  await initDb({ DB: fakeDb } as unknown as Env);
  assert.equal(storedVersion, 5, 'a completed migration should not write again');
});

test('version 6 archives only the two confirmed incomplete listings', async () => {
  const records = [
    { id: 'prod-asd', slug: 'asd', name: 'Asd', isArchived: false },
    { id: 'prod-candle', slug: 'candle', name: 'cANDLE', isArchived: false },
    { id: 'prod-custom', name: 'A real product', isArchived: false },
  ];
  let storedData = JSON.stringify({
    schemaVersion: 6,
    categories: [],
    products: records,
    users: [],
    banners: {},
    settings: {},
  });
  let storedVersion = 1;
  const fakeDb = {
    batch: async () => [],
    prepare(query: string) {
      let values: unknown[] = [];
      return {
        bind(...nextValues: unknown[]) {
          values = nextValues;
          return this;
        },
        first: async <T,>() => ({ data: storedData, version: storedVersion }) as T,
        run: async () => {
          if (query.startsWith('UPDATE app_state')) {
            if (values[1] !== storedVersion) return { meta: { changes: 0 } };
            storedData = String(values[0]);
            storedVersion += 1;
            return { meta: { changes: 1 } };
          }
          return { meta: { changes: 0 } };
        },
      };
    },
  };

  await initDb({ DB: fakeDb } as unknown as Env);
  const migrated = JSON.parse(storedData) as {
    schemaVersion: number;
    products: Array<{ id: string; slug?: string; name: string; isArchived: boolean }>;
  };
  assert.equal(migrated.schemaVersion, 7);
  assert.equal(migrated.products.length, records.length);
  assert.deepEqual(
    migrated.products.map((product) => [product.id, product.name, product.isArchived]),
    [
      ['prod-asd', 'Asd', true],
      ['prod-candle', 'cANDLE', true],
      ['prod-custom', 'A real product', false],
    ]
  );

  await initDb({ DB: fakeDb } as unknown as Env);
  assert.equal(storedVersion, 2, 'the migration should run only once');
});

test('schema migration retries CAS conflicts against the latest catalogue state', async () => {
  const initialState = {
    schemaVersion: DATABASE_SCHEMA_VERSION - 1,
    categories: [],
    products: [
      {
        id: 'demo-1',
        name: 'Sample concept',
        variants: [{ id: 'var-1', label: '50 ml', size: '50 ml', price: 2500, stock: 3, sku: 'ERA-1' }],
      },
      { id: 'prod-custom', name: 'Before concurrent edit' },
    ],
    users: [],
    banners: {},
    settings: {},
  };
  let storedData = JSON.stringify(initialState);
  let storedVersion = 1;
  let conflictOnce = true;
  const fakeDb = {
    batch: async () => [],
    prepare(query: string) {
      let values: unknown[] = [];
      return {
        bind(...nextValues: unknown[]) {
          values = nextValues;
          return this;
        },
        first: async <T,>() => ({ data: storedData, version: storedVersion }) as T,
        run: async () => {
          if (!query.startsWith('UPDATE app_state')) return { meta: { changes: 0 } };
          if (conflictOnce) {
            conflictOnce = false;
            const concurrentState = JSON.parse(storedData) as typeof initialState;
            concurrentState.products[1].name = 'Concurrent administrator edit';
            concurrentState.products.push({ id: 'prod-added-concurrently', name: 'Concurrent addition', variants: [] });
            storedData = JSON.stringify(concurrentState);
            storedVersion += 1;
            return { meta: { changes: 0 } };
          }
          if (values[1] !== storedVersion) return { meta: { changes: 0 } };
          storedData = String(values[0]);
          storedVersion += 1;
          return { meta: { changes: 1 } };
        },
      };
    },
  };

  await initDb({ DB: fakeDb } as unknown as Env);
  const migrated = getDb();
  assert.equal(migrated.products.find((product) => product.id === 'prod-custom')?.name, 'Concurrent administrator edit');
  assert.equal(migrated.products.find((product) => product.id === 'prod-added-concurrently')?.name, 'Concurrent addition');
  assert.equal(migrated.products.find((product) => product.id === 'demo-1')?.variants[0].price, 0);
  assert.equal(storedVersion, 3);
});

test('session signing fails closed without a sufficiently long configured secret', async () => {
  const missingSecretEnv = {} as Env;
  const shortSecretEnv = { SESSION_SECRET: 'too-short' } as Env;
  const payload = { userId: 'admin-1', role: 'admin' as const, email: 'admin@example.com' };

  await assert.rejects(signSessionToken(missingSecretEnv, payload), /SESSION_SECRET must be configured/);
  await assert.rejects(signSessionToken(shortSecretEnv, payload), /SESSION_SECRET must be configured/);
  assert.equal(await verifySessionToken(missingSecretEnv, 'invalid.token'), null);
  assert.equal(await verifySessionToken(shortSecretEnv, 'invalid.token'), null);
});
