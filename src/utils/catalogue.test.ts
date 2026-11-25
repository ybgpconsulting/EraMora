import assert from 'node:assert/strict';
import test from 'node:test';
import { getProductImage } from './catalogue';

test('demo fragrance concepts use the matching product photograph instead of the campaign poster', () => {
  assert.equal(
    getProductImage({
      isShowcaseDemo: true,
      categoryId: 'cat-curated-fragrances',
      images: ['/brand/eramora/campaigns/fragrance-art.jpg'],
    }),
    '/src/assets/images/product_perfume_saffron_noir_1794827349377.jpg'
  );
});

test('custom catalogue images and non-fragrance demos are preserved', () => {
  const customImage = '/uploads/admin-selected-image.jpg';

  assert.equal(
    getProductImage({
      isShowcaseDemo: true,
      categoryId: 'cat-curated-fragrances',
      images: [customImage],
    }),
    customImage
  );
  assert.equal(
    getProductImage({
      isShowcaseDemo: true,
      categoryId: 'cat-scented-candles',
      images: ['/brand/eramora/campaigns/fragrance-art.jpg'],
    }),
    '/brand/eramora/campaigns/fragrance-art.jpg'
  );
});
