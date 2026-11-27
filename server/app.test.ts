import assert from 'node:assert/strict';
import test from 'node:test';
import { handleRequest } from './app';
import type { Env } from './env';
import { signSessionToken } from './db';
import { DATABASE_SCHEMA_VERSION, DEFAULT_ADMIN_HASH } from './seed';
import { createDiyColouringKitProducts } from './diy-colouring-kits';
import worker from '../worker';

test('order and customer-data endpoints are disabled', async () => {
  const initialState = {
    users: [{ id: 'admin-1', role: 'admin', email: 'admin@example.com' }],
    orders: [
      {
        id: 'ord-1',
        orderNumber: 'ERA-1042',
        orderStatus: 'pending',
        paymentStatus: 'awaiting_verification',
        trackingNumber: '',
        courierName: '',
        adminNotes: '',
      },
    ],
  };
  let storedData = JSON.stringify(initialState);
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
  const env = {
    DB: fakeDb,
    SESSION_SECRET: 'order-update-test-secret-with-at-least-32-characters',
  } as unknown as Env;
  const token = await signSessionToken(env, {
    userId: 'admin-1',
    role: 'admin',
    email: 'admin@example.com',
  });

  const response = await handleRequest(
    new Request('https://store.example/api/admin/orders/ord-1', {
      method: 'PATCH',
      headers: {
        origin: 'https://store.example',
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ orderStatus: 'shipped', trackingNumber: 'WAYBILL-1' }),
    }),
    env
  );
  assert.equal(response.status, 410);
  assert.equal('orders' in JSON.parse(storedData), false);

  const sandboxResponse = await handleRequest(
    new Request('https://store.example/api/payments/razorpay/sandbox-complete', {
      method: 'POST',
      headers: {
        origin: 'https://store.example',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ orderId: 'ord-1', outcome: 'success' }),
    }),
    env
  );
  assert.equal(sandboxResponse.status, 410);

  const enquiryResponse = await handleRequest(
    new Request('https://store.example/api/enquiries', {
      method: 'POST',
      headers: {
        origin: 'https://store.example',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test customer', email: 'test@example.com' }),
    }),
    env
  );
  assert.equal(enquiryResponse.status, 410);

  const disabledDataRoutes = [
    ['POST', '/api/analytics/abandoned-cart'],
    ['POST', '/api/products/prod-1/reviews'],
    ['GET', '/api/orders/track'],
    ['GET', '/api/admin/customers'],
    ['GET', '/api/admin/overview'],
    ['GET', '/api/admin/backup'],
  ] as const;
  for (const [method, path] of disabledDataRoutes) {
    const disabledResponse = await handleRequest(
      new Request(`https://store.example${path}`, {
        method,
        headers: method === 'POST'
          ? { origin: 'https://store.example', 'content-type': 'application/json' }
          : undefined,
        body: method === 'POST' ? '{}' : undefined,
      }),
      env
    );
    assert.equal(disabledResponse.status, 410, `${method} ${path} should be disabled`);
  }
});

test('disabled cancellation endpoint does not mutate historical order or stock data', async () => {
  const initialState = {
    users: [{ id: 'admin-1', role: 'admin', email: 'admin@example.com' }],
    orders: [
      {
        id: 'ord-1',
        orderNumber: 'ERA-1042',
        orderStatus: 'pending',
        paymentStatus: 'awaiting_verification',
        items: [{ productId: 'prod-1', variantId: 'var-1', quantity: 1 }],
      },
    ],
    products: [{ id: 'prod-1', variants: [{ id: 'var-1', stock: 10 }] }],
  };
  let storedData = JSON.stringify(initialState);
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
        first: async <T,>() =>
          query.startsWith('SELECT data, version FROM app_state')
            ? ({ data: storedData, version: storedVersion }) as T
            : null as T,
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
  const env = {
    DB: fakeDb,
    SESSION_SECRET: 'order-cancellation-test-secret-with-at-least-32-characters',
  } as unknown as Env;
  const token = await signSessionToken(env, {
    userId: 'admin-1',
    role: 'admin',
    email: 'admin@example.com',
  });
  const cancelRequest = () =>
    handleRequest(
      new Request('https://store.example/api/orders/ERA-1042/cancel', {
        method: 'POST',
        headers: {
          origin: 'https://store.example',
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Customer request' }),
      }),
      env
    );

  const response = await cancelRequest();
  const state = JSON.parse(storedData) as typeof initialState;

  assert.equal(response.status, 410);
  assert.equal('orders' in state, false);
  assert.equal(state.products[0].variants[0].stock, 10);
});

test('public product feed and sitemap exclude demo and archived products', async () => {
  const diyProducts = createDiyColouringKitProducts('2026-03-10T00:00:00.000Z');
  const product = {
    id: 'internal-product-id',
    slug: 'saffron-noir',
    name: 'Saffron Noir',
    subtitle: 'Saffron and sandalwood',
    categoryId: 'cat-fragrance',
    categoryName: 'Fragrance',
    description: 'A warm eau de parfum composed with saffron, tea, and sandalwood for evening wear.',
    images: ['/uploads/saffron-noir.jpg'],
    variants: [{ id: 'variant-1', label: '50 ml', size: '50 ml', price: 2500, stock: 5, sku: 'ERA-001' }],
    isShowcaseDemo: true,
    isArchived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z',
  };
  const approvedProduct = {
    ...product,
    id: 'approved-product',
    slug: 'approved-fragrance',
    isShowcaseDemo: false,
  };
  const incompleteProducts = [
    { ...approvedProduct, id: 'legacy-test-1', slug: 'asd', name: 'Asd', subtitle: '', description: '' },
    { ...approvedProduct, id: 'legacy-test-2', slug: 'candle', name: 'cANDLE', subtitle: '', description: '' },
  ];
  const storedData = JSON.stringify({
    schemaVersion: DATABASE_SCHEMA_VERSION,
    products: [
      product,
      approvedProduct,
      ...incompleteProducts,
      { ...product, slug: 'archived-item', isArchived: true, isShowcaseDemo: false },
      ...diyProducts,
    ],
    reviews: [{ id: 'legacy-review', productId: product.id, authorName: 'Historical Customer' }],
  });
  const fakeDb = {
    batch: async () => [],
    prepare() {
      return {
        bind() {
          return this;
        },
        first: async <T,>() => ({ data: storedData, version: 1 }) as T,
        run: async () => ({ meta: { changes: 0 } }),
      };
    },
  };
  const env = {
    DB: fakeDb,
    ASSETS: {
      fetch: async () => new Response(
        '<!doctype html><html><head><title>Store</title><meta name="robots" content="index, follow"><link rel="canonical" href="https://eramora.in/"></head><body></body></html>',
        { headers: { 'content-type': 'text/html; charset=utf-8' } }
      ),
    },
  } as unknown as Env;

  const feedResponse = await handleRequest(
    new Request('https://store.example/products.json'),
    env
  );
  const feed = (await feedResponse.json()) as {
    products: Array<{
      slug: string;
      url: string;
      listingType: string;
      variants: Array<{ currency: string; availability: string }>;
    }>;
  };

  assert.equal(feedResponse.status, 200);
  const diySlugs = diyProducts.map((item) => item.slug);
  assert.deepEqual(feed.products.map((item) => item.slug), ['approved-fragrance', ...diySlugs]);
  const diyFeedItems = feed.products.filter((item) => diySlugs.includes(item.slug));
  assert.equal(diyFeedItems.length, 13);
  assert.ok(diyFeedItems.every((item) => item.variants[0].currency === 'INR'));
  assert.ok(diyFeedItems.every((item) => item.variants[0].availability === 'out-of-stock'));
  assert.ok(diyFeedItems.every((item) => item.images[0].includes('/products/diy-colouring-kits/')));

  const categoryResponse = await handleRequest(
    new Request('https://store.example/api/products?category=diy-colouring-kits'),
    env
  );
  const categoryProducts = (await categoryResponse.json()) as Array<{
    slug: string;
    variants: Array<{ price: number; stock: number }>;
  }>;
  assert.equal(categoryResponse.status, 200);
  assert.equal(categoryProducts.length, 13);
  assert.ok(categoryProducts.every((item) => item.variants[0].price === 199 && item.variants[0].stock === 0));

  const catalogResponse = await handleRequest(new Request('https://store.example/api/products'), env);
  const catalog = (await catalogResponse.json()) as Array<{ slug: string }>;
  assert.equal(catalogResponse.status, 200);
  assert.deepEqual(
    catalog.map((item) => item.slug).sort(),
    ['approved-fragrance', 'saffron-noir']
  );

  for (const productSlug of ['asd', 'candle']) {
    const productResponse = await handleRequest(
      new Request(`https://store.example/api/products/${productSlug}`),
      env
    );
    assert.equal(productResponse.status, 404, `${productSlug} should not be publicly accessible`);
    const productPageResponse = await handleRequest(
      new Request(`https://store.example/product/${productSlug}`),
      env
    );
    assert.equal(productPageResponse.status, 404, `${productSlug} page should return 404`);
  }

  const sitemapResponse = await handleRequest(new Request('https://store.example/sitemap.xml'), env);
  const sitemap = await sitemapResponse.text();
  assert.equal(sitemapResponse.status, 200);
  assert.ok(sitemap.includes('https://eramora.in/product/approved-fragrance'));
  assert.ok(sitemap.includes('https://eramora.in/faq'));
  assert.ok(sitemap.includes('https://eramora.in/grievance-redressal'));
  assert.ok(!sitemap.includes('?category='));
  assert.ok(!sitemap.includes('saffron-noir'));
  assert.ok(!sitemap.includes('/product/asd'));
  assert.ok(!sitemap.includes('/product/candle'));
  assert.ok(!sitemap.includes('archived-item'));

  let robotsContent = '';
  let titleContent = '';
  let canonicalHref = '';
  let headContent = '';
  const previousHtmlRewriter = Reflect.get(globalThis, 'HTMLRewriter');
  class HtmlRewriterStub {
    on(selector: string, handlers: unknown): this {
      if (selector === 'meta[name="robots"]') {
        const elementHandler = handlers as {
          element: (element: { setAttribute: (name: string, value: string) => void }) => void;
        };
        elementHandler.element({ setAttribute: (_name, value) => (robotsContent = value) });
      } else if (selector === 'title') {
        const elementHandler = handlers as {
          element: (element: { setInnerContent: (value: string) => void }) => void;
        };
        elementHandler.element({ setInnerContent: (value) => (titleContent = value) });
      } else if (selector === 'link[rel="canonical"]') {
        const elementHandler = handlers as {
          element: (element: { setAttribute: (name: string, value: string) => void }) => void;
        };
        elementHandler.element({ setAttribute: (_name, value) => (canonicalHref = value) });
      } else if (selector === 'head') {
        const elementHandler = handlers as {
          element: (element: { append: (value: string) => void }) => void;
        };
        elementHandler.element({ append: (value) => (headContent += value) });
      }
      return this;
    }

    transform(response: Response): Response {
      return response;
    }
  }
  Reflect.set(globalThis, 'HTMLRewriter', HtmlRewriterStub);
  try {
    const demoPageResponse = await handleRequest(
      new Request('https://store.example/product/saffron-noir'),
      env
    );
    assert.equal(demoPageResponse.status, 200);
    assert.equal(robotsContent, 'noindex, nofollow');

    titleContent = '';
    canonicalHref = '';
    robotsContent = '';
    headContent = '';
    const kitPageResponse = await handleRequest(
      new Request(`https://store.example/product/${diySlugs[0]}`),
      env
    );
    assert.equal(kitPageResponse.status, 200);
    assert.equal(titleContent, diyProducts[0].seoTitle);
    assert.equal(canonicalHref, `https://eramora.in/product/${diySlugs[0]}`);
    assert.equal(robotsContent, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    assert.ok(headContent.includes('name="keywords"'));
    assert.ok(headContent.includes(diyProducts[0].seoKeywords?.[0] || ''));

    for (const path of [
      '/curated-fragrances',
      '/scented-candles',
      '/sculptural-candles',
      '/diy-colouring-kits',
    ]) {
      titleContent = '';
      canonicalHref = '';
      robotsContent = '';
      const aliasResponse = await handleRequest(new Request(`https://store.example${path}`), env);
      assert.equal(aliasResponse.status, 200);
      assert.equal(titleContent, 'Shop Fragrances, Candles & Gifts | ERAMORA');
      assert.equal(canonicalHref, 'https://eramora.in/shop');
      assert.equal(
        robotsContent,
        'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      );
    }
  } finally {
    if (previousHtmlRewriter === undefined) Reflect.deleteProperty(globalThis, 'HTMLRewriter');
    else Reflect.set(globalThis, 'HTMLRewriter', previousHtmlRewriter);
  }

});

test('new products default to unpublished demo concepts and assigned categories cannot be deleted', async () => {
  const initialState = {
    schemaVersion: DATABASE_SCHEMA_VERSION,
    users: [{ id: 'admin-1', role: 'admin', email: 'admin@example.com' }],
    categories: [
      { id: 'cat-1', name: 'Fragrance', slug: 'fragrance', description: '', image: '/image.jpg', featured: true, sortOrder: 1 },
      { id: 'cat-empty', name: 'Empty', slug: 'empty', description: '', image: '/image.jpg', featured: true, sortOrder: 2 },
    ],
    products: [],
    banners: {},
    settings: {},
  };
  let storedData = JSON.stringify(initialState);
  let storedVersion = 1;
  const uploadedImages = new Set(['verified-fragrance.jpg']);
  const fakeDb = {
    batch: async () => [],
    prepare(query: string) {
      let values: unknown[] = [];
      return {
        bind(...nextValues: unknown[]) {
          values = nextValues;
          return this;
        },
        first: async <T,>() =>
          query.startsWith('SELECT key FROM media')
            ? (uploadedImages.has(String(values[0])) ? { key: String(values[0]) } : null) as T
            : ({ data: storedData, version: storedVersion }) as T,
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
  const env = {
    DB: fakeDb,
    SESSION_SECRET: 'new-product-test-secret-with-at-least-32-characters',
  } as unknown as Env;
  const token = await signSessionToken(env, {
    userId: 'admin-1',
    role: 'admin',
    email: 'admin@example.com',
  });
  const headers = {
    origin: 'https://store.example',
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  };

  const publishedWithoutVariant = await handleRequest(
    new Request('https://store.example/api/admin/products', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Unapproved item', categoryId: 'cat-1', isShowcaseDemo: false }),
    }),
    env
  );
  assert.equal(publishedWithoutVariant.status, 400);

  const createResponse = await handleRequest(
    new Request('https://store.example/api/admin/products', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'New concept', categoryId: 'cat-1' }),
    }),
    env
  );
  const created = (await createResponse.json()) as {
    id: string;
    isShowcaseDemo: boolean;
    variants: Array<{ price: number; stock: number; sku: string }>;
    ratingAverage: number;
    isFeatured: boolean;
    isNewArrival: boolean;
  };
  assert.equal(createResponse.status, 201);
  assert.equal(created.isShowcaseDemo, true);
  assert.deepEqual(created.variants.map(({ price, stock, sku }) => ({ price, stock, sku })), [
    { price: 0, stock: 0, sku: '' },
  ]);
  assert.equal(created.ratingAverage, 0);
  assert.equal(created.isFeatured, false);
  assert.equal(created.isNewArrival, false);

  const commercialDetails = {
    name: 'Verified fragrance',
    subtitle: 'A reviewed fragrance composition',
    description: 'A product description reviewed and approved for this verified fragrance listing.',
    categoryId: 'cat-1',
    images: ['/brand/eramora/campaigns/fragrance-art.jpg'],
    variants: [{ id: 'var-valid', label: '50 ml', size: '50 ml', price: 2500, stock: 5, sku: 'ERA-VERIFIED-1' }],
    isShowcaseDemo: false,
  };
  const genericImagePublication = await handleRequest(
    new Request('https://store.example/api/admin/products', {
      method: 'POST',
      headers,
      body: JSON.stringify(commercialDetails),
    }),
    env
  );
  assert.equal(genericImagePublication.status, 400);

  const missingSkuPublication = await handleRequest(
    new Request('https://store.example/api/admin/products', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...commercialDetails,
        images: ['/uploads/verified-fragrance.jpg'],
        variants: [{ ...commercialDetails.variants[0], sku: '' }],
      }),
    }),
    env
  );
  assert.equal(missingSkuPublication.status, 400);

  const publishDemoMissingDetails = await handleRequest(
    new Request(`https://store.example/api/admin/products/${created.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ isShowcaseDemo: false }),
    }),
    env
  );
  assert.equal(publishDemoMissingDetails.status, 400);

  const publishDemo = await handleRequest(
    new Request(`https://store.example/api/admin/products/${created.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        ...commercialDetails,
        images: ['/uploads/verified-fragrance.jpg'],
      }),
    }),
    env
  );
  const publishedProduct = (await publishDemo.json()) as { isShowcaseDemo: boolean; variants: Array<{ price: number; sku: string }> };
  assert.equal(publishDemo.status, 200);
  assert.equal(publishedProduct.isShowcaseDemo, false);
  assert.equal(publishedProduct.variants[0].price, 2500);
  assert.equal(publishedProduct.variants[0].sku, 'ERA-VERIFIED-1');

  const deleteAssignedCategory = await handleRequest(
    new Request('https://store.example/api/admin/categories/cat-1', { method: 'DELETE', headers }),
    env
  );
  assert.equal(deleteAssignedCategory.status, 409);
  assert.ok(JSON.parse(storedData).categories.some((category: { id: string }) => category.id === 'cat-1'));

  const deleteEmptyCategory = await handleRequest(
    new Request('https://store.example/api/admin/categories/cat-empty', { method: 'DELETE', headers }),
    env
  );
  assert.equal(deleteEmptyCategory.status, 200);
  assert.ok(!JSON.parse(storedData).categories.some((category: { id: string }) => category.id === 'cat-empty'));
});

test('scanner probe paths are blocked before redirects and asset routing while .well-known remains available', async () => {
  let assetFetchCount = 0;
  const env = {
    ENVIRONMENT: 'production',
    ASSETS: {
      fetch: async () => {
        assetFetchCount += 1;
        return new Response('asset', { status: 200 });
      },
    },
  } as unknown as Env;
  const scannerPaths = [
    '/ms-edit.php',
    '/%6d%73-edit.php',
    '/%256d%2573-edit.php',
    '/wp-login.php',
    '/%2577p-login.php',
    '/wp-admin/',
    '/wp-admin/setup.php',
    '/wp-admin/images/edit.php',
    '/WP-ADMIN/Images/EDIT.PHP',
    '/wp-signup.php',
    '/wp-cron.php',
    '/index.php',
    '/%69ndex%2ephp',
    '/%2569ndex%252ephp',
    '/wp-config.php.bak',
    '/xmlrpc.php',
    '/.env',
    '/.git/config',
    '/phpmyadmin/index.php',
    '/phpinfo.php',
    '/HNAP1',
    '/boaform/admin/formLogin',
    '/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php',
    '/malformed%ZZ/ms-edit.php',
  ];

  for (const path of scannerPaths) {
    const response = await handleRequest(new Request(`http://store.example${path}`), env);
    assert.equal(response.status, 404, `${path} should be rejected before HTTPS redirect`);
  }
  assert.equal(assetFetchCount, 0, 'scanner paths must not be forwarded to the asset binding');

  const workerResponse = await worker.fetch(
    new Request('https://store.example/wp-admin/images/edit.php'),
    env
  );
  assert.equal(workerResponse.status, 404);
  assert.equal(workerResponse.headers.get('cache-control'), 'no-store');
  assert.equal(await workerResponse.text(), 'Not Found');
  assert.equal(assetFetchCount, 0, 'Worker entry point must reject probes before asset fetch');

  const wellKnownResponse = await handleRequest(
    new Request('https://store.example/.well-known/acme-challenge/example-token'),
    env
  );
  assert.equal(wellKnownResponse.status, 200);
  assert.equal(await wellKnownResponse.text(), 'asset');
  for (const path of [
    '/shop',
    '/admin',
    '/diy-colouring-kits',
    '/products/diy-colouring-kits/rose-lid-jar-tray.webp',
  ]) {
    const response = await worker.fetch(new Request(`https://store.example${path}`), env);
    assert.equal(response.status, 200, `${path} should remain available`);
  }
  assert.equal(assetFetchCount, 5, 'legitimate storefront and static asset requests should use ASSETS');
});

test('public config hides the unverified studio address while admins retain access to settings', async () => {
  const initialState = {
    schemaVersion: DATABASE_SCHEMA_VERSION,
    users: [{ id: 'admin-1', role: 'admin', email: 'admin@example.com' }],
    categories: [],
    products: [],
    banners: {},
    settings: { brandName: 'ERAMORA', studioAddress: 'Unverified address' },
  };
  const storedData = JSON.stringify(initialState);
  const fakeDb = {
    batch: async () => [],
    prepare(query: string) {
      return {
        bind() {
          return this;
        },
        first: async <T,>() =>
          query.startsWith('SELECT data, version')
            ? ({ data: storedData, version: 1 }) as T
            : null as T,
        run: async () => ({ meta: { changes: 1 } }),
      };
    },
  };
  const env = {
    DB: fakeDb,
    SESSION_SECRET: 'public-config-test-secret-with-at-least-32-characters',
  } as unknown as Env;
  const publicResponse = await handleRequest(new Request('https://store.example/api/config/public'), env);
  const publicConfig = (await publicResponse.json()) as { settings: { studioAddress: string } };
  assert.equal(publicResponse.status, 200);
  assert.equal(publicConfig.settings.studioAddress, '');

  const privateResponse = await handleRequest(
    new Request('https://store.example/api/admin/settings'),
    env
  );
  assert.equal(privateResponse.status, 403);
  const adminCatalogueResponse = await handleRequest(
    new Request('https://store.example/api/admin/products'),
    env
  );
  assert.equal(adminCatalogueResponse.status, 403, 'legitimate admin API paths must not be scanner-blocked');

  const token = await signSessionToken(env, {
    userId: 'admin-1',
    role: 'admin',
    email: 'admin@example.com',
  });
  const authorizedCatalogueResponse = await handleRequest(
    new Request('https://store.example/api/admin/products', {
      headers: { authorization: `Bearer ${token}` },
    }),
    env
  );
  assert.equal(authorizedCatalogueResponse.status, 200);
  assert.deepEqual(await authorizedCatalogueResponse.json(), []);

  const adminResponse = await handleRequest(
    new Request('https://store.example/api/admin/settings', {
      headers: { authorization: `Bearer ${token}` },
    }),
    env
  );
  const adminSettings = (await adminResponse.json()) as { studioAddress: string };
  assert.equal(adminResponse.status, 200);
  assert.equal(adminSettings.studioAddress, 'Unverified address');
});

test('login fails closed without a session secret and rejects oversized streamed bodies', async () => {
  const storedData = JSON.stringify({ schemaVersion: DATABASE_SCHEMA_VERSION, users: [] });
  const fakeDb = {
    batch: async () => [],
    prepare(query: string) {
      return {
        bind() {
          return this;
        },
        first: async <T,>() => {
          if (query.startsWith('SELECT data, version')) return { data: storedData, version: 1 } as T;
          if (query.startsWith('INSERT INTO rate_limits')) return { count: 1, reset_at: Date.now() + 60_000 } as T;
          return null as T;
        },
        run: async () => ({ meta: { changes: 0 } }),
      };
    },
  };
  const env = { DB: fakeDb } as unknown as Env;

  const loginResponse = await handleRequest(
    new Request('https://store.example/api/auth/login', {
      method: 'POST',
      headers: { origin: 'https://store.example', 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'anything' }),
    }),
    env
  );
  assert.equal(loginResponse.status, 503);

  const oversizedRequest = new Request('https://store.example/api/auth/login', {
    method: 'POST',
    headers: { origin: 'https://store.example', 'content-type': 'application/json' },
    body: JSON.stringify({ value: 'x'.repeat(70 * 1024) }),
  });
  assert.equal(oversizedRequest.headers.has('content-length'), false);
  const oversizedResponse = await handleRequest(oversizedRequest, env);
  assert.equal(oversizedResponse.status, 413);
});

test('login fails closed without an administrator password in non-production environments', async () => {
  const storedData = JSON.stringify({
    schemaVersion: DATABASE_SCHEMA_VERSION,
    users: [{
      id: 'admin-1',
      role: 'admin',
      email: 'admin@eramora.in',
      passwordHash: DEFAULT_ADMIN_HASH,
    }],
  });
  const fakeDb = {
    batch: async () => [],
    prepare(query: string) {
      return {
        bind() {
          return this;
        },
        first: async <T,>() =>
          query.startsWith('SELECT data, version')
            ? ({ data: storedData, version: 1 }) as T
            : query.startsWith('INSERT INTO rate_limits')
              ? ({ count: 1, reset_at: Date.now() + 60_000 }) as T
              : null as T,
        run: async () => ({ meta: { changes: 0 } }),
      };
    },
  };
  const env = {
    DB: fakeDb,
    ENVIRONMENT: 'development',
    SESSION_SECRET: 'development-test-secret-with-at-least-32-characters',
  } as unknown as Env;

  const response = await handleRequest(
    new Request('https://store.example/api/auth/login', {
      method: 'POST',
      headers: { origin: 'https://store.example', 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@eramora.in', password: 'not-the-configured-password' }),
    }),
    env
  );

  assert.equal(response.status, 503);
});

test('production rejects insecure requests and redirects safe page requests to HTTPS', async () => {
  const env = { ENVIRONMENT: 'production' } as Env;

  const insecureLogin = await handleRequest(
    new Request('http://store.example/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'dummy-password' }),
    }),
    env
  );
  assert.equal(insecureLogin.status, 400);
  assert.equal(insecureLogin.headers.get('set-cookie'), null);

  const insecurePage = await handleRequest(
    new Request('http://store.example/catalog?category=home'),
    env
  );
  assert.equal(insecurePage.status, 308);
  assert.equal(
    insecurePage.headers.get('location'),
    'https://store.example/catalog?category=home'
  );
});

test('admin image upload stores a validated image and returns its public URL', async () => {
  const initialState = {
    schemaVersion: DATABASE_SCHEMA_VERSION,
    users: [{ id: 'admin-1', role: 'admin', email: 'admin@example.com' }],
  };
  let storedMedia: unknown[] | null = null;
  const fakeDb = {
    batch: async () => [],
    prepare(query: string) {
      let values: unknown[] = [];
      return {
        bind(...nextValues: unknown[]) {
          values = nextValues;
          return this;
        },
        first: async <T,>() => ({ data: JSON.stringify(initialState), version: 1 }) as T,
        run: async () => {
          if (query.startsWith('INSERT INTO media')) storedMedia = values;
          return { meta: { changes: 1 } };
        },
      };
    },
  };
  const env = {
    DB: fakeDb,
    SESSION_SECRET: 'image-upload-test-secret-with-at-least-32-characters',
  } as unknown as Env;
  const token = await signSessionToken(env, {
    userId: 'admin-1',
    role: 'admin',
    email: 'admin@example.com',
  });
  const dataUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/r3sAAAAASUVORK5CYII=';

  const response = await handleRequest(
    new Request('https://store.example/api/admin/upload', {
      method: 'POST',
      headers: {
        origin: 'https://store.example',
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ dataUrl }),
    }),
    env
  );
  const result = (await response.json()) as { url?: string; error?: string };

  assert.equal(response.status, 201);
  assert.match(result.url || '', /^\/uploads\/eramora-\d+-[a-f0-9]+\.png$/);
  assert.ok(storedMedia);
});
