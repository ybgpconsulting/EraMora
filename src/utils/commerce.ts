import type { BusinessSettings, CartItem, Coupon } from '../types/store';

export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safe);
}

export function validateIndianMobile(mobile: string): boolean {
  const digits = mobile.replace(/\D/g, '');
  const normalized = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9][0-9]{9}$/.test(normalized);
}

export function sanitizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export interface PricingBreakdown {
  subtotal: number;
  discountAmount: number;
  giftWrapFee: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  freeShippingRemaining: number;
}

export function calculatePricingBreakdown(
  items: Pick<CartItem, 'unitPrice' | 'quantity'>[],
  coupon: Coupon | null | undefined,
  settings: Pick<
    BusinessSettings,
    'freeShippingThreshold' | 'standardShippingFee' | 'giftWrapFee' | 'gstRatePercent' | 'taxInclusive'
  >,
  giftWrapSelected: boolean
): PricingBreakdown {
  const subtotal = items.reduce((sum, item) => sum + Math.max(0, item.unitPrice) * Math.max(0, item.quantity), 0);

  let discountAmount = 0;
  if (coupon && coupon.active && subtotal >= coupon.minOrderAmount) {
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && coupon.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = Math.min(subtotal, Math.round(coupon.discountValue));
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const giftWrapFee = giftWrapSelected && subtotal > 0 ? settings.giftWrapFee : 0;
  const shippingFee =
    subtotal === 0
      ? 0
      : discountedSubtotal >= settings.freeShippingThreshold
      ? 0
      : settings.standardShippingFee;

  const freeShippingRemaining = Math.max(0, settings.freeShippingThreshold - discountedSubtotal);

  const taxableBase = discountedSubtotal + giftWrapFee;
  let taxAmount = 0;
  let totalAmount = taxableBase + shippingFee;

  if (settings.gstRatePercent > 0) {
    if (settings.taxInclusive) {
      // GST is already included in displayed MRP
      taxAmount = Math.round(taxableBase - taxableBase / (1 + settings.gstRatePercent / 100));
    } else {
      taxAmount = Math.round((taxableBase * settings.gstRatePercent) / 100);
      totalAmount = taxableBase + taxAmount + shippingFee;
    }
  }

  return {
    subtotal,
    discountAmount,
    giftWrapFee,
    shippingFee,
    taxAmount,
    totalAmount,
    freeShippingRemaining,
  };
}

export interface ProductWhatsAppParams {
  whatsappNumber: string;
  brandName?: string;
  productName: string;
  productUrl: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  customerEnquiry?: string;
}

export function buildProductWhatsAppUrl(params: ProductWhatsAppParams): string {
  const phone = sanitizePhoneNumber(params.whatsappNumber);
  const brand = params.brandName || 'ERAMORA';
  const total = params.unitPrice * params.quantity;
  const lines = [
    `Hello ${brand}, I would like to place an enquiry / order on WhatsApp:`,
    ``,
    `Brand: ${brand}`,
    `Product: ${params.productName}`,
    `Variant: ${params.variantLabel}`,
    `Quantity: ${params.quantity}`,
    `Displayed Price: ${formatINR(params.unitPrice)} each (Est. ${formatINR(total)})`,
    `Product Link: ${params.productUrl}`,
  ];
  if (params.customerEnquiry && params.customerEnquiry.trim()) {
    lines.push(`Enquiry Note: ${params.customerEnquiry.trim()}`);
  }
  lines.push(``, `Please share availability and order assistance. Thank you!`);
  const encoded = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${phone}?text=${encoded}`;
}

export interface CartWhatsAppParams {
  whatsappNumber: string;
  brandName?: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount?: number;
  couponCode?: string;
  giftWrapFee?: number;
  giftMessage?: string;
  totalAmount: number;
}

export function buildCartWhatsAppUrl(params: CartWhatsAppParams): string {
  const phone = sanitizePhoneNumber(params.whatsappNumber);
  const brand = params.brandName || 'ERAMORA';
  const lines: string[] = [
    `Hello ${brand}, I would like to order the following items via WhatsApp:`,
    ``,
  ];

  params.items.forEach((item, index) => {
    const lineTotal = item.unitPrice * item.quantity;
    lines.push(
      `${index + 1}. ${item.name} (${item.variantLabel}) × ${item.quantity} — ${formatINR(item.unitPrice)} each = ${formatINR(lineTotal)}`
    );
  });

  lines.push(``);
  lines.push(`Subtotal: ${formatINR(params.subtotal)}`);
  if (params.discountAmount && params.discountAmount > 0) {
    lines.push(
      `Coupon Discount${params.couponCode ? ` (${params.couponCode})` : ''}: -${formatINR(params.discountAmount)}`
    );
  }
  if (params.giftWrapFee && params.giftWrapFee > 0) {
    lines.push(`Signature Gift Packaging: ${formatINR(params.giftWrapFee)}`);
  }
  lines.push(`Delivery Charges: To be confirmed during the enquiry`);
  lines.push(`Total Estimated Amount: ${formatINR(params.totalAmount)}`);

  if (params.giftMessage && params.giftMessage.trim()) {
    lines.push(`Gift Card Message: "${params.giftMessage.trim()}"`);
  }
  lines.push(``, `Note: Please confirm stock and payment steps for this WhatsApp enquiry.`);

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildGeneralWhatsAppUrl(whatsappNumber: string, message: string): string {
  const phone = sanitizePhoneNumber(whatsappNumber);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
