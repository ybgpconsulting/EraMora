import assert from 'node:assert/strict';
import test from 'node:test';
import { getCurrentStoreCategories, getCurrentStoreProducts, getProductImage } from './catalogue';

test('storefront exposes only published scented candles and DIY colouring kits', () => {
  const categories = [
    { id: 'gift-sets', slug: 'gift-sets', sortOrder: 1 },
    { id: 'diy-kits', slug: 'diy-colouring-kits', sortOrder: 3 },
    { id: 'candles', slug: 'scented-candles', sortOrder: 2 },
  ];
  const products = [
    { id: 'gift', categoryId: 'gift-sets', isShowcaseDemo: false, isArchived: false },
    { id: 'kit', categoryId: 'diy-kits', isShowcaseDemo: false, isArchived: false },
    { id: 'candle', categoryId: 'candles', isShowcaseDemo: false, isArchived: false },
    { id: 'candle-demo', categoryId: 'candles', isShowcaseDemo: true, isArchived: false },
    { id: 'archived-kit', categoryId: 'diy-kits', isShowcaseDemo: false, isArchived: true },
  ];

  assert.deepEqual(
    getCurrentStoreCategories(categories).map((category) => category.slug),
    ['scented-candles', 'diy-colouring-kits']
  );
  assert.deepEqual(
    getCurrentStoreProducts(products, categories).map((product) => product.id),
    ['kit', 'candle']
  );
});

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
