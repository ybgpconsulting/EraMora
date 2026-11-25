import React, { useEffect, useMemo, useState } from 'react';
import {
  Heart,
  Minus,
  Plus,
  ZoomIn,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { ProductCard } from '../components/ProductCard';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import {
  buildProductWhatsAppUrl,
  formatINR,
} from '../utils/commerce';
import { canonicalUrl, createProductStructuredData } from '../utils/seo';
import type { Product } from '../types/store';

interface ProductDetailPageProps {
  slug: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug }) => {
  const {
    products,
    navigate,
    addToCart,
    wishlist,
    toggleWishlist,
    recordViewedProduct,
    recentlyViewed,
    settings,
    notify,
  } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [waEnquiryNote, setWaEnquiryNote] = useState('');

  useEffect(() => {
    setLoading(true);
    setActiveImgIdx(0);
    setQuantity(1);
    fetch(`/api/products/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Not found'))))
      .then((data: { product: Product; related: Product[]; recommendations: Product[] }) => {
        setProduct(data.product);
        setRelated(data.related);
        setRecommendations(data.recommendations);
        setSelectedVariantId(data.product.variants[0]?.id || '');
        recordViewedProduct(data.product.id);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug, recordViewedProduct]);

  const activeVariant = useMemo(() => {
    if (!product) return undefined;
    return product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  }, [product, selectedVariantId]);

  const recentlyViewedProducts = useMemo(
    () =>
      recentlyViewed
        .filter((id) => id !== product?.id)
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p))
        .slice(0, 3),
    [recentlyViewed, products, product?.id]
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 aspect-[4/3] bg-[#F4EFE6] animate-pulse" />
          <div className="lg:col-span-6 space-y-4">
            <div className="h-8 bg-[#F4EFE6] w-2/3 animate-pulse" />
            <div className="h-6 bg-[#F4EFE6] w-1/3 animate-pulse" />
            <div className="h-32 bg-[#F4EFE6] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || !activeVariant) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-4xl text-[#2C1E16]">Creation Not Found</h1>
        <p className="text-sm text-[#6B584C]">This fragrance or candle may have been archived or moved.</p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="bg-[#2C1E16] text-[#FAF7F2] px-6 py-3 text-xs uppercase tracking-widest cursor-pointer"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const isSaved = wishlist.includes(product.id);
  const inStock = !product.isShowcaseDemo && activeVariant.stock > 0;
  const productUrl = canonicalUrl(`/product/${encodeURIComponent(product.slug)}`);
  const waUrl = buildProductWhatsAppUrl({
    whatsappNumber: settings.whatsappNumber,
    brandName: settings.brandName,
    productName: product.name,
    productUrl,
    variantLabel: activeVariant.label,
    quantity,
    customerEnquiry: waEnquiryNote,
  });

  const handleAdd = (openDrawer = true) => {
    if (!inStock) return;
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0] || '',
        variantId: activeVariant.id,
        variantLabel: activeVariant.label,
        unitPrice: activeVariant.price,
        quantity,
        maxStock: activeVariant.stock,
      },
      openDrawer
    );
  };

  const bundlePartner = recommendations[0];

  const productSchema = createProductStructuredData(product);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-44 md:pb-16">
      <SeoHead
        title={product.seoTitle || `${product.name} | ERAMORA`}
        description={product.seoDescription || product.subtitle || product.description}
        canonicalPath={`/product/${encodeURIComponent(product.slug)}`}
        image={product.images[0]}
        noIndex={product.isShowcaseDemo}
        structuredData={productSchema}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#6B584C] mb-6 flex items-center gap-2">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="hover:text-[#2C1E16]">
          Home
        </a>
        <span>/</span>
        <a href="/shop" onClick={(e) => { e.preventDefault(); navigate('/shop'); }} className="hover:text-[#2C1E16]">
          Shop
        </a>
        <span>/</span>
        <span className="text-[#2C1E16] truncate">{product.name}</span>
      </nav>

      {/* Main Split: Gallery Left + Contiguous Purchase Module Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        {/* Gallery */}
        <div className="lg:col-span-6 space-y-3 lg:sticky lg:top-24">
          <div className="relative aspect-[4/3] bg-[#F4EFE6] border border-[#2C1E16]/10 overflow-hidden">
            <ImageWithFallback
              src={product.images[activeImgIdx] || product.images[0]}
              alt={`${product.name} — view ${activeImgIdx + 1}`}
              loading="eager"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Zoom product photograph"
              className="absolute bottom-3 right-3 min-w-[38px] min-h-[38px] px-3 bg-[#FAF7F2]/90 border border-[#2C1E16]/15 inline-flex items-center gap-1.5 text-xs text-[#2C1E16] hover:bg-[#FAF7F2] cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Zoom</span>
            </button>
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImgIdx(i)}
                  aria-label={`View photograph ${i + 1}`}
                  className={`w-20 aspect-[4/3] shrink-0 border overflow-hidden cursor-pointer ${
                    activeImgIdx === i ? 'border-[#2C1E16]' : 'border-[#2C1E16]/15 opacity-70 hover:opacity-100'
                  }`}
                >
                  <ImageWithFallback src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contiguous Purchase Module */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2 border-b border-[#2C1E16]/10 pb-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#6B584C]">
              {product.categoryName}
              {product.isShowcaseDemo ? ' · Demo concept' : ''}
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-[#2C1E16] leading-tight">{product.name}</h1>
            <p className="text-sm text-[#6B584C]">{product.subtitle}</p>

            {product.isShowcaseDemo ? (
              <p className="pt-2 text-sm font-medium text-[#6B584C]">
                Showcase concept · Not for sale · Details and availability are unconfirmed
              </p>
            ) : (
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-baseline gap-2.5 tabular-nums">
                  <span className="text-2xl font-semibold text-[#2C1E16]">{formatINR(activeVariant.price)}</span>
                  {activeVariant.compareAtPrice && activeVariant.compareAtPrice > activeVariant.price && (
                    <span className="text-sm text-[#6B584C] line-through">
                      {formatINR(activeVariant.compareAtPrice)}
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Variants */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase tracking-[0.14em] text-[#6B584C]">Select Variant</span>
              <span className="tabular-nums text-[#6B584C]">
                {product.isShowcaseDemo
                  ? 'Variant details to be confirmed'
                  : inStock
                    ? `${activeVariant.stock} available · SKU ${activeVariant.sku}`
                    : 'Availability on request'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariantId(v.id);
                    setQuantity(1);
                  }}
                  className={`px-4 py-2.5 text-xs font-medium border transition-colors cursor-pointer ${
                    v.id === activeVariant.id
                      ? 'bg-[#2C1E16] text-[#FAF7F2] border-[#2C1E16]'
                      : 'border-[#2C1E16]/20 text-[#2C1E16] hover:border-[#B89352]'
                  }`}
                >
                  {product.isShowcaseDemo ? v.label : `${v.label} — ${formatINR(v.price)}`}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Actions */}
          {product.isShowcaseDemo ? (
            <div className="border border-[#C5A059]/35 bg-[#F4EFE6]/70 p-4 text-sm leading-relaxed text-[#6B584C]">
              This is a sample catalogue concept, not an item for sale. Ask our concierge about the concept; no price
              or availability is confirmed.
            </div>
          ) : inStock ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center border border-[#2C1E16]/25 h-12">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-11 h-full flex items-center justify-center text-[#2C1E16] hover:bg-[#F4EFE6] cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-medium tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(activeVariant.stock, q + 1))}
                    aria-label="Increase quantity"
                    className="w-11 h-full flex items-center justify-center text-[#2C1E16] hover:bg-[#F4EFE6] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdd(true)}
                  className="flex-1 min-w-[160px] h-12 bg-[#2C1E16] text-[#FAF7F2] text-xs font-medium uppercase tracking-[0.16em] hover:bg-[#3F2C21] transition-colors cursor-pointer"
                >
                  Add to Bag — {formatINR(activeVariant.price * quantity)}
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                  className="w-12 h-12 border border-[#2C1E16]/25 flex items-center justify-center hover:border-[#B89352] cursor-pointer"
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#B89352] text-[#B89352]' : 'text-[#2C1E16]'}`} />
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-[#2C1E16]/12 bg-[#F4EFE6] p-4 text-sm text-[#6B584C]">
              This variant is currently unavailable. You can ask our concierge about availability directly on WhatsApp.
            </div>
          )}

          {/* Dedicated WhatsApp Ordering Box */}
          <div className="p-4 bg-[#F4EFE6]/70 border border-[#2C1E16]/12 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#2C1E16]">
                Ask our Concierge
              </span>
              <span className="text-[11px] text-[#6B584C]">Enquiry only</span>
            </div>
            <input
              type="text"
              value={waEnquiryNote}
              onChange={(e) => setWaEnquiryNote(e.target.value)}
              placeholder="Optional note (e.g., ask about presentation or product details)..."
              aria-label="WhatsApp enquiry note"
              className="w-full bg-[#FAF7F2] border border-[#2C1E16]/15 px-3 py-2 text-xs text-[#2C1E16] placeholder-[#6B584C]/70 focus:outline-none focus:border-[#B89352]"
            />
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 inline-flex items-center justify-center gap-2 bg-[#FAF7F2] border border-[#2C1E16]/30 text-[#2C1E16] text-xs font-medium uppercase tracking-[0.14em] hover:border-[#25D366] transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              <span>{product.isShowcaseDemo ? 'Ask About This Concept' : 'Enquire on WhatsApp'}</span>
            </a>
            <p className="text-[11px] leading-relaxed text-[#6B584C]">
              WhatsApp opens a conversation only. No purchase is placed or confirmed by sending a message.
            </p>
          </div>

          {/* Description, Fragrance Notes, Materials & Specs */}
          <div className="pt-4 border-t border-[#2C1E16]/10 space-y-5">
            <div>
              <h2 className="font-serif text-xl text-[#2C1E16] mb-2">The Composition</h2>
              <p className="text-sm text-[#6B584C] leading-relaxed">{product.description}</p>
            </div>

            {product.fragranceNotes && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-[#F4EFE6]/60 border border-[#2C1E16]/10">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#6B584C]">Top Notes</p>
                  <p className="mt-1 text-xs text-[#2C1E16] leading-relaxed">
                    {product.fragranceNotes.top.join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#6B584C]">Heart Notes</p>
                  <p className="mt-1 text-xs text-[#2C1E16] leading-relaxed">
                    {product.fragranceNotes.heart.join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-[#6B584C]">Base Notes</p>
                  <p className="mt-1 text-xs text-[#2C1E16] leading-relaxed">
                    {product.fragranceNotes.base.join(', ')}
                  </p>
                </div>
              </div>
            )}

            {product.ingredientsOrMaterials && (
              <div>
                <h3 className="text-xs uppercase tracking-[0.14em] text-[#6B584C] mb-1">Ingredients & Materials</h3>
                <p className="text-sm text-[#2C1E16]">{product.ingredientsOrMaterials}</p>
              </div>
            )}

            {Object.keys(product.specifications).length > 0 && (
              <dl className="divide-y divide-[#2C1E16]/10 border-t border-b border-[#2C1E16]/10">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="py-2.5 flex justify-between gap-4 text-xs">
                    <dt className="text-[#6B584C]">{key}</dt>
                    <dd className="text-[#2C1E16] text-right">{val}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </div>

      {/* Frequently Bought Together */}
      {bundlePartner && !product.isShowcaseDemo && !bundlePartner.isShowcaseDemo && (
        <section className="mt-14 p-6 bg-[#F4EFE6]/65 border border-[#2C1E16]/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#B89352]">Complete the Ritual</p>
              <h2 className="font-serif text-2xl text-[#2C1E16] mt-1">Frequently Paired Together</h2>
              <p className="text-xs text-[#6B584C] mt-1">
                {product.name} ({activeVariant.label}) + {bundlePartner.name} ({bundlePartner.variants[0]?.label})
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-lg font-semibold tabular-nums text-[#2C1E16]">
                {formatINR(activeVariant.price + (bundlePartner.variants[0]?.price || 0))}
              </span>
              <button
                type="button"
                onClick={() => {
                  handleAdd(false);
                  const bv = bundlePartner.variants[0];
                  if (bv && bv.stock > 0) {
                    addToCart({
                      productId: bundlePartner.id,
                      slug: bundlePartner.slug,
                      name: bundlePartner.name,
                      image: bundlePartner.images[0] || '',
                      variantId: bv.id,
                      variantLabel: bv.label,
                      unitPrice: bv.price,
                      quantity: 1,
                      maxStock: bv.stock,
                    });
                  }
                }}
                className="bg-[#2C1E16] text-[#FAF7F2] px-5 py-2.5 text-xs uppercase tracking-[0.14em] hover:bg-[#3F2C21] cursor-pointer"
              >
                Add Pairing to Bag
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Related & Recently Viewed */}
      {related.length > 0 && (
        <section className="mt-16 pt-12 border-t border-[#2C1E16]/10">
          <h2 className="font-serif text-3xl text-[#2C1E16] mb-6">Related Creations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {recentlyViewedProducts.length > 0 && (
        <section className="mt-14 pt-10 border-t border-[#2C1E16]/10">
          <h2 className="font-serif text-2xl text-[#2C1E16] mb-5">Recently Viewed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyViewedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Mobile Add to Bag Bar */}
      {inStock && (
        <div className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+78px)] left-0 right-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#2C1E16]/12 px-4 py-2.5 flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#2C1E16] truncate">{product.name}</p>
            <p className="text-xs text-[#6B584C] tabular-nums">{formatINR(activeVariant.price * quantity)}</p>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Send a WhatsApp enquiry"
            className="h-10 px-3 border border-[#2C1E16]/25 flex items-center justify-center text-[#2C1E16]"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
          </a>
          <button
            type="button"
            onClick={() => handleAdd(true)}
            className="h-10 px-5 bg-[#2C1E16] text-[#FAF7F2] text-xs font-medium uppercase tracking-wider cursor-pointer"
          >
            Add to Bag
          </button>
        </div>
      )}

      {/* Image Zoom Lightbox */}
      {zoomOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product Photograph Zoom"
          className="fixed inset-0 z-50 bg-[#2C1E16]/85 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Close zoom view"
            className="absolute top-5 right-5 w-10 h-10 bg-[#FAF7F2] text-[#2C1E16] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={product.images[activeImgIdx] || product.images[0]}
            alt={product.name}
            className="max-h-[85vh] max-w-[92vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
