import assert from 'node:assert/strict';
import { accessSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  createDiyColouringKitProducts,
  ensureDiyColouringKitCatalog,
} from './diy-colouring-kits';
import type { Category, Product } from '../src/types/store';

test('DIY kit catalogue has 13 unique, zero-stock INR products with their optimized photos', () => {
  const products = createDiyColouringKitProducts('2026-01-01T00:00:00.000Z');
  assert.equal(products.length, 13);
  assert.equal(new Set(products.map((product) => product.id)).size, 13);
  assert.equal(new Set(products.map((product) => product.slug)).size, 13);
  assert.equal(new Set(products.map((product) => product.variants[0].sku)).size, 13);
  assert.equal(new Set(products.map((product) => product.seoDescription)).size, 13);

  products.forEach((product, index) => {
    const variant = product.variants[0];
    assert.equal(variant.price, 199);
    assert.equal(variant.stock, 0);
    assert.equal(variant.sku, `ERA-DIY-${String(index + 1).padStart(3, '0')}`);
    assert.equal(product.categoryId, 'cat-diy-colouring-kits');
    assert.equal(product.isShowcaseDemo, false);
    assert.equal(product.isArchived, false);
    assert.ok(product.imageAlt);
    assert.ok(product.seoTitle);
    assert.ok(product.seoKeywords?.length);

    const imagePath = path.join(process.cwd(), 'public', product.images[0].replace(/^\//, ''));
    accessSync(imagePath);
    const image = readFileSync(imagePath);
    assert.equal(image.toString('ascii', 0, 4), 'RIFF');
    assert.equal(image.toString('ascii', 8, 12), 'WEBP');
  });
});

test('DIY kit catalogue migration is repeatable and preserves existing stock and unrelated products', () => {
  const categories: Category[] = [];
  const products: Product[] = [
    {
      id: 'existing-product',
      slug: 'existing-product',
      name: 'Existing product',
      subtitle: '',
      categoryId: 'other-category',
      categoryName: 'Other',
      description: '',
      specifications: {},
      images: [],
      variants: [],
      badges: [],
      isShowcaseDemo: true,
      isFeatured: false,
      isBestseller: false,
      isNewArrival: false,
      isArchived: false,
      ratingAverage: 0,
      reviewCount: 0,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
  ];
  const legacyKit = createDiyColouringKitProducts('2025-01-01T00:00:00.000Z')[0];
  legacyKit.id = 'legacy-diy-product';
  legacyKit.slug = 'legacy-diy-product';
  legacyKit.variants[0].sku = 'OLD-DIY-001';
  legacyKit.variants[0].stock = 3;
  products.push(legacyKit);

  ensureDiyColouringKitCatalog(categories, products, '2026-01-01T00:00:00.000Z');
  ensureDiyColouringKitCatalog(categories, products, '2026-01-02T00:00:00.000Z');

  assert.equal(categories.length, 1);
  assert.equal(products.length, 14);
  assert.equal(products[0].name, 'Existing product');
  const migratedKit = products.find((product) => product.variants[0]?.sku === 'ERA-DIY-001');
  assert.equal(migratedKit?.id, 'diy-colouring-kit-001');
  assert.equal(migratedKit?.variants[0].stock, 3);
});
