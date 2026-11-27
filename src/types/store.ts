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
  imageAlt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ratingAverage: number;
  reviewCount: number;
  createdAt: string;
  updatedAt?: string;
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

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'admin';
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
  whatsappOrderingEnabled: boolean;
}

export interface StorePublicConfig {
  settings: BusinessSettings;
  banners: BannerConfig;
}
