import assert from 'node:assert/strict';
import test from 'node:test';
import { getLegacyCategorySlug } from './routes';

test('resolves only supported category route aliases', () => {
  assert.equal(getLegacyCategorySlug('/diy-colouring-kits'), 'diy-colouring-kits');
  assert.equal(getLegacyCategorySlug('/curated-fragrances'), 'curated-fragrances');
  assert.equal(getLegacyCategorySlug('/scented-candles'), 'scented-candles');
  assert.equal(getLegacyCategorySlug('/sculptural-candles'), 'sculptural-candles');
  assert.equal(getLegacyCategorySlug('/shop'), null);
  assert.equal(getLegacyCategorySlug('/gifting'), null);
  assert.equal(getLegacyCategorySlug('/diy-colouring-kits/extra'), null);
});
