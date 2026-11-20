import assert from 'node:assert/strict';
import test from 'node:test';
import { isSameOriginMutation } from './http';

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
