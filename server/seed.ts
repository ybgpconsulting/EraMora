import { pbkdf2Hex, randomHex, timingSafeEqualString } from './crypto';
import type { Env } from './env';
import type {
  BannerConfig,
  BusinessSettings,
  Category,
  AdminUser,
  Product,
} from '../src/types/store';

export const DATABASE_SCHEMA_VERSION = 4;

export interface DatabaseSchema {
  schemaVersion: number;
  categories: Category[];
  products: Product[];
  users: Array<AdminUser & { passwordHash: string }>;
  banners: BannerConfig;
  settings: BusinessSettings;
}

const PASSWORD_ITERATIONS = 100_000;
export const DEFAULT_ADMIN_HASH =
  'pbkdf2$100000$37be92ab5d8125a5ad92cac2f6040b69$096b5e0ea76aa52d74b69ba8debffb1227a74625874ea0d68a70305c6058de39';

export async function hashPassword(password: string): Promise<string> {
  const salt = randomHex(16);
  const hash = await pbkdf2Hex(password, salt, PASSWORD_ITERATIONS);
  return `pbkdf2$${PASSWORD_ITERATIONS}$${salt}$${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (typeof stored !== 'string') return false;
  const [scheme, iterationsRaw, salt, hash] = stored.split('$');
  if (scheme !== 'pbkdf2' || !salt || !hash) return false;
  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations) || iterations < 1000 || iterations > 1_000_000) return false;
  const derived = await pbkdf2Hex(password, salt, iterations);
  return timingSafeEqualString(derived, hash);
}

const IMG = {
  hero: '/brand/eramora/campaigns/brand-introduction.jpg',
  candle: '/brand/eramora/campaigns/fragrance-art.jpg',
  perfume: '/brand/eramora/campaigns/fragrance-art.jpg',
  coffret: '/brand/eramora/campaigns/thoughtful-gifting.jpg',
  ritual: '/brand/eramora/campaigns/brand-introduction.jpg',
};
const PRODUCT_IMG = {
  perfume: '/src/assets/images/product_perfume_saffron_noir_1794827349377.jpg',
};

export async function createInitialSeed(env?: Env): Promise<DatabaseSchema> {
  if (
    env?.ENVIRONMENT === 'production' &&
    (!env.ADMIN_DEMO_PASSWORD ||
      env.ADMIN_DEMO_PASSWORD.length < 12 ||
      env.ADMIN_DEMO_PASSWORD.length > 256)
  ) {
    throw new Error('Set an ADMIN_DEMO_PASSWORD between 12 and 256 characters before initializing the production store.');
  }

  const now = new Date().toISOString();
  const categories: Category[] = [
    { id: 'cat-curated-fragrances', name: 'Curated Fragrances', slug: 'curated-fragrances', description: 'A curated edit of eau de parfum concepts for fragrance discovery.', image: IMG.perfume, featured: true, sortOrder: 1 },
    { id: 'cat-scented-candles', name: 'Scented Candles', slug: 'scented-candles', description: 'Scented candle concepts for calm, luminous moments.', image: IMG.candle, featured: true, sortOrder: 2 },
    { id: 'cat-sculptural-candles', name: 'Sculptural Candles', slug: 'sculptural-candles', description: 'Decorative sculptural candle concepts where form meets fragrance.', image: IMG.ritual, featured: true, sortOrder: 3 },
    { id: 'cat-diy-colouring-kits', name: 'DIY Colouring Kits', slug: 'diy-colouring-kits', description: 'Creative colouring kit concepts for slow, thoughtful play.', image: IMG.hero, featured: true, sortOrder: 4 },
    { id: 'cat-gifting', name: 'Gifting', slug: 'gifting', description: 'Thoughtful gift box concepts for meaningful occasions.', image: IMG.coffret, featured: true, sortOrder: 5 },
  ];

  const catalogue: Array<[string, string, string, string]> = [
    ['Curated Fragrances', 'Amber Veil Eau de Parfum', 'amber-veil-eau-de-parfum', 'cat-curated-fragrances'],
    ['Curated Fragrances', 'Rose Élan Eau de Parfum', 'rose-elan-eau-de-parfum', 'cat-curated-fragrances'],
    ['Curated Fragrances', 'Oud Nocturne Eau de Parfum', 'oud-nocturne-eau-de-parfum', 'cat-curated-fragrances'],
    ['Curated Fragrances', 'Citrus Reverie Eau de Parfum', 'citrus-reverie-eau-de-parfum', 'cat-curated-fragrances'],
    ['Curated Fragrances', 'Vanilla Solstice Eau de Parfum', 'vanilla-solstice-eau-de-parfum', 'cat-curated-fragrances'],
    ['Scented Candles', 'Quiet Evening Scented Candle', 'quiet-evening-scented-candle', 'cat-scented-candles'],
    ['Scented Candles', 'Vanilla Haze Scented Candle', 'vanilla-haze-scented-candle', 'cat-scented-candles'],
    ['Scented Candles', 'Rose Atelier Scented Candle', 'rose-atelier-scented-candle', 'cat-scented-candles'],
    ['Scented Candles', 'Amber Glow Scented Candle', 'amber-glow-scented-candle', 'cat-scented-candles'],
    ['Scented Candles', 'Linen & Light Scented Candle', 'linen-and-light-scented-candle', 'cat-scented-candles'],
    ['Sculptural Candles', 'Petal Form Sculptural Candle', 'petal-form-sculptural-candle', 'cat-sculptural-candles'],
    ['Sculptural Candles', 'Twist Form Sculptural Candle', 'twist-form-sculptural-candle', 'cat-sculptural-candles'],
    ['Sculptural Candles', 'Arch Form Sculptural Candle', 'arch-form-sculptural-candle', 'cat-sculptural-candles'],
    ['Sculptural Candles', 'Knot Form Sculptural Candle', 'knot-form-sculptural-candle', 'cat-sculptural-candles'],
    ['Sculptural Candles', 'Bloom Sculpture Candle', 'bloom-sculpture-candle', 'cat-sculptural-candles'],
    ['DIY Colouring Kits', 'Little Garden Colouring Kit', 'little-garden-colouring-kit', 'cat-diy-colouring-kits'],
    ['DIY Colouring Kits', 'Dreamy Florals Colouring Kit', 'dreamy-florals-colouring-kit', 'cat-diy-colouring-kits'],
    ['DIY Colouring Kits', 'Mandala Calm Colouring Kit', 'mandala-calm-colouring-kit', 'cat-diy-colouring-kits'],
    ['DIY Colouring Kits', 'Whimsical World Colouring Kit', 'whimsical-world-colouring-kit', 'cat-diy-colouring-kits'],
    ['DIY Colouring Kits', 'Create Your Own Keepsake Kit', 'create-your-own-keepsake-kit', 'cat-diy-colouring-kits'],
    ['Gifting', 'The Little Moments Gift Box', 'the-little-moments-gift-box', 'cat-gifting'],
    ['Gifting', 'Fragrance & Glow Gift Set', 'fragrance-and-glow-gift-set', 'cat-gifting'],
    ['Gifting', 'Candle Ritual Gift Set', 'candle-ritual-gift-set', 'cat-gifting'],
    ['Gifting', 'Celebration Gift Box', 'celebration-gift-box', 'cat-gifting'],
    ['Gifting', 'Personal Touch Gift Set', 'personal-touch-gift-set', 'cat-gifting'],
  ];

  const products: Product[] = catalogue.map(([categoryName, name, slug, categoryId], index) => ({
    id: `demo-${index + 1}`,
    slug,
    name,
    subtitle: 'Demo / sample catalogue concept',
    categoryId,
    categoryName,
    description: 'This is a clearly marked demo or sample product for ERAMORA catalogue preparation. Confirmed product details, pricing and availability will be published only after approval.',
    specifications: { 'Catalogue Status': 'Demo / sample — not yet approved for sale' },
    images: [categoryId === 'cat-curated-fragrances' ? PRODUCT_IMG.perfume : categoryId === 'cat-gifting' ? IMG.coffret : categoryId === 'cat-scented-candles' ? IMG.candle : IMG.ritual],
    variants: [{ id: `demo-${index + 1}-variant`, label: 'Sample variant', size: 'TBC', price: 0, stock: 0, sku: `DEMO-${String(index + 1).padStart(2, '0')}` }],
    badges: ['Demo / Sample'],
    isShowcaseDemo: true,
    isFeatured: true,
    isBestseller: false,
    isNewArrival: false,
    isArchived: false,
    seoTitle: `${name} | Demo Catalogue | ERAMORA`,
    seoDescription: `Explore the demo catalogue concept ${name} at ERAMORA. This item is not yet approved for commercial sale.`,
    ratingAverage: 0,
    reviewCount: 0,
    createdAt: now,
  }));

  const customAdminPassword = env?.ADMIN_DEMO_PASSWORD;
  const adminPasswordHash = customAdminPassword ? await hashPassword(customAdminPassword) : DEFAULT_ADMIN_HASH;
  const users: Array<AdminUser & { passwordHash: string }> = [
    { id: 'user-admin-1', name: 'ERAMORA Atelier Admin', email: 'admin@eramora.in', mobile: '8368143892', role: 'admin', passwordHash: adminPasswordHash, createdAt: now },
  ];

  const banners: BannerConfig = {
    id: 'main-banners',
    announcementText: 'Personal fragrance and gifting enquiries available on WhatsApp',
    heroEyebrow: 'ERAMORA · Atelier Collection',
    heroHeadline: 'Where Fragrance Meets Emotion.',
    heroSubheadline: 'Curated fragrances, candles and thoughtful gifting.',
    heroCtaLabel: 'Explore the Collection',
    heroImage: IMG.hero,
    campaignTitle: 'The Art of Thoughtful Gifting',
    campaignSubtitle: 'Explore gift selections with the ERAMORA concierge before confirming availability.',
    campaignActive: true,
  };

  const settings: BusinessSettings = {
    brandName: 'ERAMORA',
    tagline: 'Where Fragrance Meets Emotion.',
    whatsappNumber: '918368143892',
    supportEmail: 'eramora.in@gmail.com',
    supportPhone: '+91 83681 43892',
    studioAddress: 'Sector 20, Noida, Uttar Pradesh – 201301, India',
    instagramHandle: '@eramora.in',
    instagramUrl: 'https://www.instagram.com/eramora.in/',
    whatsappOrderingEnabled: true,
  };

  return {
    schemaVersion: DATABASE_SCHEMA_VERSION,
    categories,
    products,
    users,
    banners,
    settings,
  };
}
