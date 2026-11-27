import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialSeed, SEEDED_SAMPLE_PRODUCT_IDS } from './seed';
import { DIY_KIT_CATALOGUE, DIY_KIT_CATEGORY_ID, DIY_KIT_PRICE_INR } from './diy-kit-products';
import type { Env } from './env';

test('first-run seed creates all DIY products as priced items and keeps concept samples unpublished', async () => {
  const seed = await createInitialSeed({ ENVIRONMENT: 'development' } as Env);

  const sampleProducts = seed.products.filter((product) => SEEDED_SAMPLE_PRODUCT_IDS.includes(product.id));
  assert.equal(sampleProducts.length, 25);
  for (const product of sampleProducts) {
    assert.equal(product.isShowcaseDemo, true);
    assert.equal(product.variants.every((variant) => variant.price === 0 && variant.stock === 0), true);
  }

  const diyProducts = seed.products.filter((product) => product.categoryId === DIY_KIT_CATEGORY_ID);
  assert.equal(diyProducts.length, DIY_KIT_CATALOGUE.length);
  assert.equal(DIY_KIT_PRICE_INR, 199);
  assert.ok(seed.categories.some((category) => category.id === DIY_KIT_CATEGORY_ID));

  for (const product of diyProducts) {
    assert.equal(product.isShowcaseDemo, false);
    assert.equal(product.isArchived, false);
    assert.equal(product.variants.length, 1);
    assert.equal(product.variants[0].price, 199);
    assert.equal(product.variants[0].stock, 0);
    assert.equal(product.ratingAverage, 0);
    assert.equal(product.reviewCount, 0);
    assert.equal(product.isFeatured, false);
    assert.equal(product.isBestseller, false);
    assert.equal(product.isNewArrival, false);
    assert.ok(product.images[0].startsWith('/brand/eramora/diy-kits/'));
  }
});
