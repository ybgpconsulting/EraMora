import test from 'node:test';
import assert from 'node:assert/strict';
import { formatINR, buildProductWhatsAppUrl, buildCartWhatsAppUrl } from './commerce';

test('formatINR formats Indian rupees with proper grouping', () => {
  assert.equal(formatINR(1850), '₹1,850');
  assert.equal(formatINR(125000), '₹1,25,000');
});

test('product WhatsApp links contain no quoted price and clarify that they are enquiries', () => {
  const url = buildProductWhatsAppUrl({
    whatsappNumber: '918368143892',
    brandName: 'ERAMORA',
    productName: 'Oud & Velvet Amber Candle',
    productUrl: 'https://eramora.in/product/oud-velvet-amber-candle',
    variantLabel: '220g Amber Jar',
    quantity: 2,
    customerEnquiry: 'Can this be gift wrapped?',
  });
  const message = new URL(url).searchParams.get('text') || '';

  assert.ok(url.startsWith('https://wa.me/918368143892?text='));
  assert.ok(message.includes('Product: Oud & Velvet Amber Candle'));
  assert.ok(message.includes('Variant: 220g Amber Jar'));
  assert.ok(message.includes('Quantity: 2'));
  assert.ok(message.includes('Can this be gift wrapped?'));
  assert.ok(message.includes('does not place or confirm a purchase'));
  assert.ok(!message.includes('₹'));
});

test('cart WhatsApp links include product details without totals or purchase confirmation', () => {
  const url = buildCartWhatsAppUrl({
    whatsappNumber: '918368143892',
    brandName: 'ERAMORA',
    items: [
      {
        productId: 'p1',
        slug: 'saffron-noir',
        name: 'Saffron Noir Eau de Parfum',
        image: '/img.jpg',
        variantId: 'v1',
        variantLabel: '50 ml Flacon',
        unitPrice: 3450,
        quantity: 1,
        maxStock: 10,
      },
    ],
    giftWrapSelected: true,
    giftMessage: 'For Mira',
  });
  const message = new URL(url).searchParams.get('text') || '';

  assert.ok(url.startsWith('https://wa.me/918368143892?text='));
  assert.ok(message.includes('Saffron Noir Eau de Parfum (50 ml Flacon) × 1'));
  assert.ok(message.includes('Gift presentation request'));
  assert.ok(message.includes('this is not confirmed'));
  assert.ok(message.includes('For Mira'));
  assert.ok(message.includes('Note for the concierge'));
  assert.ok(message.includes('does not place or confirm a purchase'));
  assert.ok(!message.includes('Subtotal'));
  assert.ok(!message.includes('Total'));
  assert.ok(!message.includes('₹'));
});
