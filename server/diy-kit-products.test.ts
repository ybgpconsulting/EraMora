import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createDiyKitProducts,
  DIY_KIT_CATALOGUE,
  DIY_KIT_CATEGORY_ID,
  DIY_KIT_PRICE_INR,
} from './diy-kit-products';

test('the supplied DIY catalogue becomes individual priced products without invented stock or reviews', () => {
  const products = createDiyKitProducts('2026-11-27T00:00:00.000Z');

  assert.equal(products.length, 13);
  assert.equal(products.length, DIY_KIT_CATALOGUE.length);
  assert.equal(DIY_KIT_PRICE_INR, 199);

  for (const product of products) {
    assert.equal(product.categoryId, DIY_KIT_CATEGORY_ID);
    assert.equal(product.categoryName, 'DIY Colouring Kits');
    assert.equal(product.isShowcaseDemo, false);
    assert.equal(product.isArchived, false);
    assert.equal(product.variants.length, 1);
    assert.equal(product.variants[0].price, 199);
    assert.equal(product.variants[0].stock, 0);
    assert.ok(product.variants[0].sku.startsWith('ERA-DIY-'));
    assert.equal(product.variants[0].sku.length, 11);
    assert.equal(product.ratingAverage, 0);
    assert.equal(product.reviewCount, 0);
    assert.equal(product.isFeatured, false);
    assert.equal(product.isBestseller, false);
    assert.equal(product.isNewArrival, false);
    assert.equal(product.images.length, 1);
    assert.ok(product.images[0].startsWith('/brand/eramora/diy-kits/'));
    assert.match(product.images[0], /\.(?:jpg|webp)$/);
    assert.match(product.description, /paints or brushes are included have not been specified/i);
  }
});
