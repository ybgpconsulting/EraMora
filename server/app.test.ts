import assert from 'node:assert/strict';
import test from 'node:test';
import { handleRequest } from './app';
import type { Env } from './env';
import { signSessionToken } from './db';
import { DEFAULT_ADMIN_HASH } from './seed';

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
  const product = {
    id: 'internal-product-id',
    slug: 'saffron-noir',
    name: 'Saffron Noir',
    subtitle: 'Saffron and sandalwood',
    categoryName: 'Fragrance',
    description: 'A warm eau de parfum.',
    images: ['/uploads/saffron-noir.jpg'],
    variants: [{ label: '50 ml', size: '50 ml', price: 2500, stock: 5 }],
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
  const storedData = JSON.stringify({
    schemaVersion: 4,
    products: [
      product,
      approvedProduct,
      { ...product, slug: 'archived-item', isArchived: true, isShowcaseDemo: false },
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
  assert.deepEqual(feed.products.map((item) => item.slug), ['approved-fragrance']);

  const sitemapResponse = await handleRequest(new Request('https://store.example/sitemap.xml'), env);
  const sitemap = await sitemapResponse.text();
  assert.equal(sitemapResponse.status, 200);
  assert.ok(sitemap.includes('https://eramora.in/product/approved-fragrance'));
  assert.ok(sitemap.includes('https://eramora.in/faq'));
  assert.ok(sitemap.includes('https://eramora.in/grievance-redressal'));
  assert.ok(!sitemap.includes('?category='));
  assert.ok(!sitemap.includes('saffron-noir'));
  assert.ok(!sitemap.includes('archived-item'));

  let robotsContent = '';
  let titleContent = '';
  let canonicalHref = '';
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
    schemaVersion: 4,
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
    isShowcaseDemo: boolean;
    variants: Array<{ price: number; stock: number }>;
  };
  assert.equal(createResponse.status, 201);
  assert.equal(created.isShowcaseDemo, true);
  assert.deepEqual(created.variants.map(({ price, stock }) => ({ price, stock })), [{ price: 0, stock: 0 }]);

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

test('login fails closed without a session secret and rejects oversized streamed bodies', async () => {
  const storedData = JSON.stringify({ schemaVersion: 4, users: [] });
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
    schemaVersion: 4,
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
    schemaVersion: 4,
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
