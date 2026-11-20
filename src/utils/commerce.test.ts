import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatINR,
  validateIndianMobile,
  calculatePricingBreakdown,
  buildProductWhatsAppUrl,
  buildCartWhatsAppUrl,
} from './commerce';
import type { Coupon } from '../types/store';

const sampleSettings = {
  freeShippingThreshold: 2500,
  standardShippingFee: 150,
  giftWrapFee: 200,
  gstRatePercent: 18,
  taxInclusive: true,
};

test('formatINR formats Indian rupees with proper grouping', () => {
  assert.equal(formatINR(1850), '₹1,850');
  assert.equal(formatINR(125000), '₹1,25,000');
});

test('validateIndianMobile validates 10-digit Indian mobile numbers', () => {
  assert.equal(validateIndianMobile('8368143892'), true);
  assert.equal(validateIndianMobile('+91 8368143892'), true);
  assert.equal(validateIndianMobile('1234567890'), false);
});

test('calculatePricingBreakdown computes shipping, coupon discount, and gift wrap accurately', () => {
  const coupon: Coupon = {
    id: 'c1',
    code: 'WELCOME10',
    description: '10% off',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 1000,
    maxDiscount: 500,
    active: true,
  };

  const result = calculatePricingBreakdown(
    [{ unitPrice: 2000, quantity: 1 }],
    coupon,
    sampleSettings,
    true
  );

  assert.equal(result.subtotal, 2000);
  assert.equal(result.discountAmount, 200);
  assert.equal(result.giftWrapFee, 200);
  // discountedSubtotal is 1800 < 2500 threshold -> shipping 150
  assert.equal(result.shippingFee, 150);
  assert.equal(result.totalAmount, 2150);
  assert.equal(result.freeShippingRemaining, 700);
});

test('calculatePricingBreakdown grants free shipping above threshold', () => {
  const result = calculatePricingBreakdown(
    [{ unitPrice: 2800, quantity: 1 }],
    null,
    sampleSettings,
    false
  );
  assert.equal(result.shippingFee, 0);
  assert.equal(result.totalAmount, 2800);
  assert.equal(result.freeShippingRemaining, 0);
});

test('buildProductWhatsAppUrl properly encodes brand, product, variant, quantity, and price', () => {
  const url = buildProductWhatsAppUrl({
    whatsappNumber: '918368143892',
    brandName: 'ERAMORA',
    productName: 'Oud & Velvet Amber Candle',
    productUrl: 'https://eramora.in/product/oud-velvet-amber-candle',
    variantLabel: '220g Amber Jar',
    quantity: 2,
    unitPrice: 1850,
    customerEnquiry: 'Can this be gift wrapped?',
  });

  assert.ok(url.startsWith('https://wa.me/918368143892?text='));
  const decoded = decodeURIComponent(url.split('?text=')[1]);
  assert.ok(decoded.includes('Brand: ERAMORA'));
  assert.ok(decoded.includes('Product: Oud & Velvet Amber Candle'));
  assert.ok(decoded.includes('Variant: 220g Amber Jar'));
  assert.ok(decoded.includes('Quantity: 2'));
  assert.ok(decoded.includes('₹1,850'));
  assert.ok(decoded.includes('Can this be gift wrapped?'));
});

test('buildCartWhatsAppUrl encodes itemized cart summary with shipping and total', () => {
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
    subtotal: 3450,
    shippingFee: 0,
    totalAmount: 3450,
  });

  assert.ok(url.startsWith('https://wa.me/918368143892?text='));
  const decoded = decodeURIComponent(url.split('?text=')[1]);
  assert.ok(decoded.includes('Saffron Noir Eau de Parfum (50 ml Flacon) × 1'));
  assert.ok(decoded.includes('Subtotal: ₹3,450'));
  assert.ok(decoded.includes('Delivery Charges: To be confirmed'));
  assert.ok(decoded.includes('Total Estimated Amount: ₹3,450'));
});

test('buildCartWhatsAppUrl supports direct orders without customer details', () => {
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
    subtotal: 3450,
    shippingFee: 0,
    totalAmount: 3450,
  });
  const message = new URL(url).searchParams.get('text') || '';

  assert.ok(url.startsWith('https://wa.me/918368143892?text='));
  assert.ok(message.includes('Saffron Noir Eau de Parfum (50 ml Flacon) × 1'));
  assert.ok(message.includes('Total Estimated Amount: ₹3,450'));
  assert.ok(!message.includes('Delivery & Contact Details'));
});
