import type { Category, Product } from '../types/store';

export const CURRENT_STORE_CATEGORY_SLUGS = ['scented-candles', 'diy-colouring-kits'] as const;

const currentStoreCategorySlugs = new Set<string>(CURRENT_STORE_CATEGORY_SLUGS);

const LEGACY_FRAGRANCE_IMAGE = '/brand/eramora/campaigns/fragrance-art.jpg';
const FRAGRANCE_PRODUCT_IMAGE = '/src/assets/images/product_perfume_saffron_noir_1794827349377.jpg';

export function getProductImage(
  product: Pick<Product, 'isShowcaseDemo' | 'categoryId' | 'images'>,
  index = 0
): string {
  const image = product.images[index] || product.images[0] || '';

  if (
    product.isShowcaseDemo &&
    product.categoryId === 'cat-curated-fragrances' &&
    image === LEGACY_FRAGRANCE_IMAGE
  ) {
    return FRAGRANCE_PRODUCT_IMAGE;
  }

  return image;
}

export function getCurrentStoreCategories<T extends Pick<Category, 'id' | 'slug' | 'sortOrder'>>(
  categories: readonly T[]
): T[] {
  return categories
    .filter((category) => currentStoreCategorySlugs.has(category.slug))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCurrentStoreProducts<
  T extends Pick<Product, 'categoryId' | 'isShowcaseDemo' | 'isArchived'>
>(
  products: readonly T[],
  categories: readonly Pick<Category, 'id' | 'slug' | 'sortOrder'>[]
): T[] {
  const categoryIds = new Set(getCurrentStoreCategories(categories).map((category) => category.id));
  return products.filter(
    (product) =>
      categoryIds.has(product.categoryId) &&
      !product.isShowcaseDemo &&
      !product.isArchived
  );
}
