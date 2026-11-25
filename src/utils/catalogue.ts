import type { Product } from '../types/store';

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
