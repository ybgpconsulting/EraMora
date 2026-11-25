import assert from 'node:assert/strict';
import test from 'node:test';
import { ERAMORA_FAQS } from '../content/faqs';
import type { Product } from '../types/store';
import {
  canonicalUrl,
  createFaqStructuredData,
  createProductStructuredData,
  getProductSeoDescription,
} from './seo';

const product: Product = {
  id: 'product-1',
  slug: 'saffron-noir',
  name: 'Saffron Noir',
  subtitle: 'Saffron and sandalwood',
  categoryId: 'fragrance',
  categoryName: 'Fragrance',
  description: 'A warm eau de parfum.',
  specifications: {},
  images: ['/uploads/saffron-noir.jpg'],
  variants: [
    { id: 'variant-1', label: '50 ml', size: '50 ml', price: 2500, stock: 3, sku: 'ERA-001' },
    { id: 'variant-2', label: '100 ml', size: '100 ml', price: 4200, stock: 0, sku: 'ERA-002' },
  ],
  badges: [],
  isShowcaseDemo: true,
  isFeatured: false,
  isBestseller: false,
  isNewArrival: false,
  isArchived: false,
  ratingAverage: 4.8,
  reviewCount: 12,
  createdAt: '2026-01-01T00:00:00.000Z',
};

test('canonical URLs always use the official origin and omit tracking queries', () => {
  assert.equal(canonicalUrl('/product/saffron-noir?utm_source=chat'), 'https://eramora.in/product/saffron-noir');
});

test('product structured data describes every variant without publishing showcase ratings', () => {
  const [schema, breadcrumbs] = createProductStructuredData(product);
  assert.equal(schema['@type'], 'Product');
  assert.deepEqual(schema.image, ['https://eramora.in/uploads/saffron-noir.jpg']);
  assert.equal(schema.offers, undefined);
  assert.equal(schema.aggregateRating, undefined);
  assert.equal(breadcrumbs['@type'], 'BreadcrumbList');

  const publishedProduct = createProductStructuredData({ ...product, isShowcaseDemo: false })[0];
  assert.equal(publishedProduct.aggregateRating, undefined);
});

test('product SEO descriptions fall back without inventing product attributes', () => {
  assert.equal(
    getProductSeoDescription({
      name: 'Saffron Noir',
      seoDescription: '  ',
      description: '',
      subtitle: '',
    }),
    'Explore Saffron Noir from ERAMORA. Contact our WhatsApp concierge to confirm current details and availability.'
  );
});

test('FAQ structured data mirrors the published FAQ content', () => {
  const schema = createFaqStructuredData(ERAMORA_FAQS);
  const questions = schema.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>;

  assert.equal(schema['@type'], 'FAQPage');
  assert.equal(questions.length, ERAMORA_FAQS.length);
  assert.equal(questions[0].name, ERAMORA_FAQS[0].question);
  assert.equal(questions[0].acceptedAnswer.text, ERAMORA_FAQS[0].answer);
});
