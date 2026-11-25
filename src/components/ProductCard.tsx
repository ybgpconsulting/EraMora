import React from 'react';
import { ArrowUpRight, Heart, Plus } from 'lucide-react';
import type { Product } from '../types/store';
import { useStore } from '../context/StoreContext';
import { ImageWithFallback } from './ImageWithFallback';
import { formatINR } from '../utils/commerce';
import { getProductImage } from '../utils/catalogue';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigate, addToCart, wishlist, toggleWishlist } = useStore();
  const primaryVariant = product.variants[0];
  const isSaved = wishlist.includes(product.id);
  const inStock = !product.isShowcaseDemo && product.variants.some((v) => v.stock > 0);
  const badgeText = product.badges[0] || (product.isShowcaseDemo ? 'Showcase' : '');

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.isShowcaseDemo || !primaryVariant || primaryVariant.stock <= 0) {
      navigate(`/product/${product.slug}`);
      return;
    }
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] || '',
      variantId: primaryVariant.id,
      variantLabel: primaryVariant.label,
      unitPrice: primaryVariant.price,
      quantity: 1,
      maxStock: primaryVariant.stock,
    });
  };

  return (
    <article className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F4EFE6]">
        <a
          href={`/product/${product.slug}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/product/${product.slug}`);
          }}
          className="block h-full w-full"
          aria-label={`View ${product.name}`}
        >
          <ImageWithFallback
            src={getProductImage(product)}
            alt={product.name}
            fallbackTitle={product.name}
            className="h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.05]"
          />
        </a>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1B120D]/25 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

        {badgeText && (
          <span className="absolute left-3 top-3 bg-[#FAF7F2]/85 px-2.5 py-1 text-[8px] uppercase tracking-[0.2em] text-[#2C1E16]/75 backdrop-blur-md">
            {badgeText}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={isSaved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={isSaved}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-[#2C1E16]/8 bg-[#FAF7F2]/85 text-[#2C1E16] backdrop-blur-md transition-colors hover:text-[#B89352] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer"
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-[#B89352] text-[#B89352]' : ''}`} strokeWidth={1.6} />
        </button>

        <button
          type="button"
          onClick={handleQuickAdd}
          aria-label={
            product.isShowcaseDemo
              ? `View ${product.name} demo concept`
              : inStock
                ? `Quick add ${product.name} to bag`
                : `View ${product.name} availability`
          }
          className="absolute inset-x-3 bottom-3 flex min-h-11 translate-y-0 items-center justify-center gap-2 bg-[#2C1E16]/95 py-2.5 text-[9px] uppercase tracking-[0.22em] text-[#FAF7F2] opacity-100 transition-all duration-500 hover:bg-[#2C1E16] focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] focus-visible:ring-offset-2 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 cursor-pointer"
        >
          {product.isShowcaseDemo ? (
            <ArrowUpRight aria-hidden="true" className="h-3 w-3" strokeWidth={1.8} />
          ) : (
            <Plus aria-hidden="true" className="h-3 w-3" strokeWidth={1.8} />
          )}
          <span>{product.isShowcaseDemo ? 'View concept' : inStock ? 'Add to bag' : 'View availability'}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[9px] uppercase tracking-[0.24em] text-[#B89352]">{product.categoryName}</p>
        <h3 className="mt-1.5 font-serif text-[20px] leading-snug text-[#2C1E16] md:text-[22px]">
          <a
            href={`/product/${product.slug}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/product/${product.slug}`);
            }}
            className="transition-colors hover:text-[#B89352]"
          >
            {product.name}
          </a>
        </h3>
        <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-[#6B584C]">{product.subtitle}</p>

        <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-[#2C1E16]/8 pt-2.5">
          {product.isShowcaseDemo ? (
            <span className="text-[10px] uppercase tracking-[0.12em] text-[#6B584C]">
              Demo concept · Not for sale
            </span>
          ) : (
            <>
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="text-[13px] font-medium text-[#2C1E16]">
                  {primaryVariant ? formatINR(primaryVariant.price) : 'Price on request'}
                </span>
                {primaryVariant?.compareAtPrice && primaryVariant.compareAtPrice > primaryVariant.price && (
                  <span className="text-[11px] text-[#6B584C] line-through">{formatINR(primaryVariant.compareAtPrice)}</span>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-[0.12em] text-[#6B584C]">
                {inStock ? primaryVariant?.size : 'Availability on request'}
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
};
