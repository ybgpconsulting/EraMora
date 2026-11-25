import type { CartItem } from '../types/store';

export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safe);
}

export function sanitizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export interface ProductWhatsAppParams {
  whatsappNumber: string;
  brandName?: string;
  productName: string;
  productUrl: string;
  variantLabel: string;
  quantity: number;
  customerEnquiry?: string;
}

export function buildProductWhatsAppUrl(params: ProductWhatsAppParams): string {
  const phone = sanitizePhoneNumber(params.whatsappNumber);
  const brand = params.brandName || 'ERAMORA';
  const lines = [
    `Hello ${brand}, I have a product enquiry:`,
    ``,
    `Brand: ${brand}`,
    `Product: ${params.productName}`,
    `Variant: ${params.variantLabel}`,
    `Quantity: ${params.quantity}`,
    `Product Link: ${params.productUrl}`,
  ];
  if (params.customerEnquiry && params.customerEnquiry.trim()) {
    lines.push(`Enquiry Note: ${params.customerEnquiry.trim()}`);
  }
  lines.push(
    ``,
    `Please confirm product details, availability, current price, applicable taxes, and delivery charges.`,
    `This message is an enquiry only and does not place or confirm a purchase.`
  );
  const encoded = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${phone}?text=${encoded}`;
}

export interface CartWhatsAppParams {
  whatsappNumber: string;
  brandName?: string;
  items: CartItem[];
  giftWrapSelected?: boolean;
  giftMessage?: string;
}

export function buildCartWhatsAppUrl(params: CartWhatsAppParams): string {
  const phone = sanitizePhoneNumber(params.whatsappNumber);
  const brand = params.brandName || 'ERAMORA';
  const lines: string[] = [
    `Hello ${brand}, I would like to enquire about these items:`,
    ``,
  ];

  params.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name} (${item.variantLabel}) × ${item.quantity}`
    );
  });

  if (params.giftWrapSelected) {
    lines.push('', 'Gift presentation request: Please share available options; this is not confirmed.');
  }

  if (params.giftMessage && params.giftMessage.trim()) {
    lines.push(`Note for the concierge: "${params.giftMessage.trim()}"`);
  }
  lines.push(
    ``,
    `Please confirm product details, availability, current price, applicable taxes, and delivery charges.`,
    `This message is an enquiry only and does not place or confirm a purchase.`
  );

  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildGeneralWhatsAppUrl(whatsappNumber: string, message: string): string {
  const phone = sanitizePhoneNumber(whatsappNumber);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
