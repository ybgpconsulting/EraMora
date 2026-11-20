import type { Product } from '../types/store';

export const CANONICAL_SITE_URL = 'https://eramora.in';

export function canonicalUrl(path: string): string {
  const internalPath = path.replace(/\\/g, '/').replace(/^\/+/, '').split(/[?#]/, 1)[0];
  return new URL(internalPath ? `/${internalPath}` : '/', CANONICAL_SITE_URL).toString();
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
    description: product.description || product.subtitle,
    category: product.categoryName,
    brand: { '@type': 'Brand', name: 'ERAMORA' },
    url: productUrl,
    ...(images.length ? { image: images } : {}),
    ...(product.variants.length === 1 ? { sku: product.variants[0].sku } : {}),
    ...(!product.isShowcaseDemo && offers.length ? { offers } : {}),
    ...(!product.isShowcaseDemo &&
    product.reviewCount > 0 &&
    Number.isFinite(product.ratingAverage) &&
    product.ratingAverage >= 1 &&
    product.ratingAverage <= 5
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.ratingAverage,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
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
