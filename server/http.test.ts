import assert from 'node:assert/strict';
import test from 'node:test';
import { HttpResponse, isSameOriginMutation, rateLimit } from './http';
import type { RequestContext } from './http';

const requestUrl = new URL('https://store.example/api/admin/products');

test('allows same-origin mutations', () => {
  const request = new Request(requestUrl, {
    method: 'POST',
    headers: { origin: 'https://store.example' },
  });

  assert.equal(isSameOriginMutation(request, requestUrl), true);
});

test('rejects cross-origin browser mutations', () => {
  const request = new Request(requestUrl, {
    method: 'POST',
    headers: {
      origin: 'https://attacker.example',
      'sec-fetch-site': 'cross-site',
    },
  });

  assert.equal(isSameOriginMutation(request, requestUrl), false);
});

test('rejects malformed origins and allows non-browser requests without origin metadata', () => {
  const malformed = new Request(requestUrl, {
    method: 'POST',
    headers: { origin: 'null' },
  });
  const nonBrowser = new Request(requestUrl, { method: 'POST' });

  assert.equal(isSameOriginMutation(malformed, requestUrl), false);
  assert.equal(isSameOriginMutation(nonBrowser, requestUrl), true);
});

test('rate limits requests through a shared D1 counter without storing the raw IP', async () => {
  let count = 0;
  let storedKey = '';
  const fakeDb = {
    prepare() {
      let values: unknown[] = [];
      return {
        bind(...nextValues: unknown[]) {
          values = nextValues;
          return this;
        },
        first: async <T,>() => {
          storedKey = String(values[0]);
          count += 1;
          return { count, reset_at: Date.now() + 60_000 } as T;
        },
        run: async () => ({ meta: { changes: 0 } }),
      };
    },
  };
  const middleware = rateLimit(1, 60_000);
  const request: RequestContext = {
    req: new Request(requestUrl, { method: 'POST' }),
    env: { DB: fakeDb } as RequestContext['env'],
    url: requestUrl,
    params: {},
    query: {},
    body: {},
    rawBody: '',
    session: null,
    ip: '203.0.113.42',
    header: () => undefined,
  };
  const firstResponse = new HttpResponse();
  const secondResponse = new HttpResponse();

  assert.equal(await middleware(request, firstResponse), true);
  assert.equal(await middleware(request, secondResponse), false);
  assert.equal(secondResponse.statusCode, 429);
  assert.match(storedKey, /^[a-f0-9]{64}$/);
  assert.equal(storedKey.includes(request.ip), false);
});
