export type OrderChannel = 'online' | 'whatsapp';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'return_requested' | 'refunded';
export type PaymentMethod = 'razorpay' | 'cod' | 'whatsapp_manual';
export type PaymentStatus = 'pending' | 'awaiting_verification' | 'paid' | 'failed' | 'refunded';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  featured: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  label: string;
  size: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
}

export interface FragranceNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  categoryId: string;
  categoryName: string;
  description: string;
  specifications: Record<string, string>;
  fragranceNotes?: FragranceNotes;
  ingredientsOrMaterials?: string;
  images: string[];
  variants: ProductVariant[];
  badges: string[]; // e.g., 'Bestseller', 'New Arrival', 'Limited Batch'
  isShowcaseDemo: boolean; // Clearly distinguishes showcase catalogue items from verified admin inventory
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isArchived: boolean;
  seoTitle?: string;
  seoDescription?: string;
  ratingAverage: number;
  reviewCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  variantId: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}

export interface IndianAddress {
  fullName: string;
  mobile: string;
  email: string;
  houseFlat: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  active: boolean;
  expiresAt?: string;
}

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  channel: OrderChannel;
  customerId?: string;
  address: IndianAddress;
  items: OrderItemSnapshot[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  giftWrapSelected: boolean;
  giftWrapFee: number;
  giftMessage?: string;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  orderStatus: OrderStatus;
  trackingNumber?: string;
  courierName?: string;
  cancellationReason?: string;
  returnReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'customer' | 'admin';
  savedAddresses: IndianAddress[];
  createdAt: string;
}

export interface CustomerEnquiry {
  id: string;
  type: 'contact' | 'custom_gifting' | 'back_in_stock';
  name: string;
  email: string;
  mobile?: string;
  subject: string;
  message: string;
  productId?: string;
  status: 'open' | 'responded' | 'closed';
  createdAt: string;
}

export interface BannerConfig {
  id: string;
  announcementText: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroCtaLabel: string;
  heroImage: string;
  campaignTitle: string;
  campaignSubtitle: string;
  campaignActive: boolean;
}

export interface BusinessSettings {
  brandName: string;
  tagline: string;
  whatsappNumber: string; // digits with country code e.g. 918368143892
  supportEmail: string;
  supportPhone: string;
  studioAddress: string;
  instagramHandle: string;
  instagramUrl: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  giftWrapFee: number;
  gstRatePercent: number;
  taxInclusive: boolean;
  codEnabled: boolean;
  razorpayEnabled: boolean;
  whatsappOrderingEnabled: boolean;
  lowStockThreshold: number;
  policies: {
    shipping: string;
    returns: string;
    privacy: string;
    terms: string;
  };
}

export interface StorePublicConfig {
  settings: BusinessSettings;
  banners: BannerConfig;
  razorpayConfigured: boolean;
  razorpayKeyId: string | null;
}
