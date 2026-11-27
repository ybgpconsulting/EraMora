import type { Product } from '../types/store';
import type { FaqEntry } from '../content/faqs';

export const CANONICAL_SITE_URL = 'https://eramora.in';

export interface PageSeoMetadata {
  title: string;
  description: string;
  canonicalPath: string;
  keywords?: string[];
  noIndex?: boolean;
}

export const SEO_PAGES = {
  home: {
    title: 'ERAMORA | Fragrances, Candles & Thoughtful Gifting',
    description:
      "Discover ERAMORA fragrances, scented candles and gifting concepts. Enquire on WhatsApp to confirm current products and availability.",
    canonicalPath: '/',
  },
  collections: {
    title: 'Fragrance, Candle & Gifting Collections | ERAMORA',
    description:
      "Explore ERAMORA's curated fragrances, scented candles, sculptural candles, creative kits and gifting concepts.",
    canonicalPath: '/collections',
  },
  gifting: {
    title: 'Fragrance & Candle Gift Ideas | ERAMORA',
    description:
      'Explore ERAMORA gifting concepts and ask the WhatsApp concierge about current options. Availability, pricing and delivery are confirmed directly.',
    canonicalPath: '/gifting',
  },
  shop: {
    title: 'Shop Fragrances, Candles & Gifts | ERAMORA',
    description:
      "Explore ERAMORA's current fragrance, candle and gifting catalogue. Contact the WhatsApp concierge to confirm product details and availability.",
    canonicalPath: '/shop',
  },
  about: {
    title: 'About ERAMORA | Fragrance, Candles & Gifting',
    description:
      'Discover ERAMORA, a fragrance and lifestyle house shaped by scent, memory, candles and thoughtful gifting.',
    canonicalPath: '/about',
  },
  contact: {
    title: 'Contact ERAMORA | Product & Gifting Enquiries',
    description:
      'Contact the ERAMORA concierge for product guidance, availability, order support and gifting enquiries.',
    canonicalPath: '/contact',
  },
  faq: {
    title: 'ERAMORA FAQs | Products, Availability & Enquiries',
    description:
      'Find answers about ERAMORA products, WhatsApp enquiries, availability, delivery, payment and gifting options.',
    canonicalPath: '/faq',
  },
  shippingPolicy: {
    title: 'Shipping Policy | ERAMORA',
    description:
      'Learn how ERAMORA confirms delivery availability, timing and charges for product enquiries.',
    canonicalPath: '/shipping-policy',
  },
  returnsPolicy: {
    title: 'Returns & Refund Policy | ERAMORA',
    description: 'Review ERAMORA return and refund terms for confirmed purchases.',
    canonicalPath: '/returns-policy',
  },
  privacyPolicy: {
    title: 'Privacy Policy | ERAMORA',
    description: 'Read how ERAMORA handles personal information and website data.',
    canonicalPath: '/privacy-policy',
  },
  terms: {
    title: 'Terms & Conditions | ERAMORA',
    description: 'Read the terms that apply to ERAMORA website visits and product enquiries.',
    canonicalPath: '/terms',
  },
  grievance: {
    title: 'Grievance Redressal | ERAMORA',
    description: 'Find ERAMORA grievance contact information and the process for raising a concern.',
    canonicalPath: '/grievance-redressal',
  },
  cart: {
    title: 'Shopping Bag | ERAMORA',
    description:
      'Review selected items before sending a non-binding WhatsApp enquiry. Availability, pricing and delivery are confirmed by the concierge.',
    canonicalPath: '/cart',
    noIndex: true,
  },
  checkout: {
    title: 'WhatsApp Product Enquiry | ERAMORA',
    description:
      'Send a non-binding product enquiry to the ERAMORA WhatsApp concierge. A message does not confirm availability, an order or payment.',
    canonicalPath: '/checkout',
    noIndex: true,
  },
  wishlist: {
    title: 'Saved Fragrances & Candles | ERAMORA',
    description: 'Review the ERAMORA products saved in your wishlist.',
    canonicalPath: '/wishlist',
    noIndex: true,
  },
  admin: {
    title: 'ERAMORA Admin Portal',
    description: 'Private ERAMORA catalogue management portal.',
    canonicalPath: '/admin',
    noIndex: true,
  },
} as const satisfies Record<string, PageSeoMetadata>;

export function canonicalUrl(path: string): string {
  const internalPath = path.replace(/\\/g, '/').replace(/^\/+/, '').split(/[?#]/, 1)[0];
  return new URL(internalPath ? `/${internalPath}` : '/', CANONICAL_SITE_URL).toString();
}

export function getProductSeoDescription(
  product: Pick<Product, 'name' | 'seoDescription' | 'description' | 'subtitle'>
): string {
  const description = [product.seoDescription, product.description, product.subtitle]
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value));

  return (
    description ||
    `Explore ${product.name} from ERAMORA. Contact our WhatsApp concierge to confirm current details and availability.`
  );
}

export function createFaqStructuredData(faqs: readonly FaqEntry[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function absolutePublicUrl(path: string): string | undefined {
  try {
    const url = new URL(path, `${CANONICAL_SITE_URL}/`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function createProductStructuredData(product: Product): Array<Record<string, unknown>> {
  const productUrl = canonicalUrl(`/product/${encodeURIComponent(product.slug)}`);
  const offers = product.variants.map((variant) => ({
    '@type': 'Offer',
    name: variant.label,
    priceCurrency: 'INR',
    price: variant.price,
    availability: variant.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    url: productUrl,
  }));
  const images = product.images
    .map((image) => absolutePublicUrl(image))
    .filter((image): image is string => Boolean(image));
  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: getProductSeoDescription(product),
    category: product.categoryName,
    brand: { '@type': 'Brand', name: 'ERAMORA' },
    url: productUrl,
    ...(images.length ? { image: images } : {}),
    ...(product.variants.length === 1 ? { sku: product.variants[0].sku } : {}),
    ...(!product.isShowcaseDemo && offers.length ? { offers } : {}),
  };

  return [
    productSchema,
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: canonicalUrl('/') },
        { '@type': 'ListItem', position: 2, name: product.categoryName || 'Shop', item: canonicalUrl(`/shop?category=${encodeURIComponent(product.categoryName.toLowerCase().replace(/\s+/g, '-'))}`) },
        { '@type': 'ListItem', position: 3, name: product.name, item: productUrl },
      ],
    },
  ];
}
