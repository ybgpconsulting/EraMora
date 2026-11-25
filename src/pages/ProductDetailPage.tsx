import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Gift,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
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
import { getProductImage } from '../utils/catalogue';
import { canonicalUrl, createProductStructuredData, getProductSeoDescription } from '../utils/seo';
import type { Product } from '../types/store';
import { useModalFocus } from '../hooks/useModalFocus';

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
  const [openAccordion, setOpenAccordion] = useState<string>('composition');
  const zoomDialogRef = useModalFocus<HTMLDivElement>(zoomOpen, () => setZoomOpen(false));

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
    notify(`${quantity} × ${product.name} (${activeVariant.label}) added to your bag`, 'success');
  };

  const bundlePartner = recommendations[0];
  const productSchema = createProductStructuredData(product);

  const toggleAccordion = (section: string) => {
    setOpenAccordion((prev) => (prev === section ? '' : section));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-44 md:pb-16">
      <SeoHead
        title={product.seoTitle || `${product.name} | ERAMORA`}
        description={getProductSeoDescription(product)}
        canonicalPath={`/product/${encodeURIComponent(product.slug)}`}
        image={getProductImage(product)}
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
        <a
          href={`/shop?category=${product.categoryId}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/shop?category=${product.categoryId}`);
          }}
          className="hover:text-[#2C1E16]"
        >
          {product.categoryName}
        </a>
        <span>/</span>
        <span className="text-[#2C1E16] truncate font-medium">{product.name}</span>
      </nav>

      {/* Main Split: Gallery Left + Contiguous Purchase Module Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        {/* Gallery */}
        <div className="lg:col-span-6 space-y-3 lg:sticky lg:top-24">
          <div className="relative aspect-[4/3] bg-[#F4EFE6] border border-[#2C1E16]/10 overflow-hidden shadow-xs">
            <ImageWithFallback
              src={getProductImage(product, activeImgIdx)}
              alt={`${product.name} — view ${activeImgIdx + 1}`}
              loading="eager"
              className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
            />
            {product.badges[0] && (
              <span className="absolute left-4 top-4 border border-[#C5A059]/40 bg-[#FAF7F2]/95 px-3 py-1.5 text-[9px] uppercase tracking-[0.24em] text-[#2C1E16] backdrop-blur-md shadow-xs">
                {product.badges[0]}
              </span>
            )}
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Zoom product photograph"
              className="absolute bottom-3 right-3 min-w-11 min-h-11 px-3 bg-[#FAF7F2]/90 border border-[#2C1E16]/15 inline-flex items-center gap-1.5 text-xs text-[#2C1E16] backdrop-blur-md hover:bg-[#FAF7F2] cursor-pointer shadow-xs"
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
                  className={`w-20 aspect-[4/3] shrink-0 border overflow-hidden cursor-pointer transition-all ${
                    activeImgIdx === i ? 'border-[#B89352] ring-1 ring-[#B89352]' : 'border-[#2C1E16]/15 opacity-70 hover:opacity-100'
                  }`}
                >
                  <ImageWithFallback src={getProductImage(product, i)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Luxury Atelier Guarantee Callouts */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#2C1E16]/10 pt-5 text-center">
            <div className="p-3 bg-[#F4EFE6]/50 border border-[#2C1E16]/8">
              <Truck className="w-4 h-4 mx-auto text-[#B89352] mb-1.5" strokeWidth={1.5} />
              <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#2C1E16]">Complimentary Shipping</p>
              <p className="text-[10px] text-[#6B584C] mt-0.5">Across India</p>
            </div>
            <div className="p-3 bg-[#F4EFE6]/50 border border-[#2C1E16]/8">
              <Gift className="w-4 h-4 mx-auto text-[#B89352] mb-1.5" strokeWidth={1.5} />
              <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#2C1E16]">Atelier Packaging</p>
              <p className="text-[10px] text-[#6B584C] mt-0.5">Ivory Linen Box</p>
            </div>
            <div className="p-3 bg-[#F4EFE6]/50 border border-[#2C1E16]/8">
              <ShieldCheck className="w-4 h-4 mx-auto text-[#B89352] mb-1.5" strokeWidth={1.5} />
              <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-[#2C1E16]">Artisanal Purity</p>
              <p className="text-[10px] text-[#6B584C] mt-0.5">Clean Ingredients</p>
            </div>
          </div>
        </div>

        {/* Contiguous Purchase Module */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2 border-b border-[#2C1E16]/10 pb-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[#B89352] font-medium">
                {product.categoryName}
              </p>
              {product.ratingAverage > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-[#6B584C]">
                  <div className="flex text-[#C5A059]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                  </div>
                  <span className="font-semibold text-[#2C1E16]">{product.ratingAverage.toFixed(1)}</span>
                  {product.reviewCount > 0 && <span>({product.reviewCount} client reviews)</span>}
                </div>
              )}
            </div>

            <h1 className="font-serif text-3xl md:text-4xl text-[#2C1E16] leading-tight">{product.name}</h1>
            <p className="text-sm text-[#6B584C] leading-relaxed">{product.subtitle}</p>

            {product.isShowcaseDemo ? (
              <p className="pt-2 text-sm font-medium text-[#6B584C]">
                Showcase concept · Not for sale · Details and availability are unconfirmed
              </p>
            ) : (
              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="flex items-baseline gap-2.5 tabular-nums">
                  <span className="text-3xl font-semibold text-[#2C1E16]">{formatINR(activeVariant.price)}</span>
                  {activeVariant.compareAtPrice && activeVariant.compareAtPrice > activeVariant.price && (
                    <span className="text-base text-[#6B584C] line-through">
                      {formatINR(activeVariant.compareAtPrice)}
                    </span>
                  )}
                </div>
                {inStock ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#2E5A36] font-medium bg-[#2E5A36]/8 px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E5A36] animate-pulse" />
                    In Stock · Ready to Dispatch
                  </span>
                ) : (
                  <span className="text-xs text-[#8A5020] font-medium bg-[#8A5020]/10 px-2.5 py-1 rounded-full">
                    Availability on Request
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase tracking-[0.14em] text-[#6B584C] font-medium">Select Size / Presentation</span>
              <span className="tabular-nums text-[#6B584C]">
                {product.isShowcaseDemo
                  ? 'Variant details to be confirmed'
                  : inStock
                    ? `${activeVariant.stock} available · SKU ${activeVariant.sku}`
                    : 'Availability on request'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariantId(v.id);
                    setQuantity(1);
                  }}
                  className={`min-h-12 px-5 py-2.5 text-xs font-medium border transition-all cursor-pointer ${
                    v.id === activeVariant.id
                      ? 'bg-[#2C1E16] text-[#FAF7F2] border-[#2C1E16] shadow-sm'
                      : 'border-[#2C1E16]/20 bg-[#FAF7F2] text-[#2C1E16] hover:border-[#B89352]'
                  }`}
                >
                  <span className="block font-medium">{v.label}</span>
                  {!product.isShowcaseDemo && (
                    <span className={`block text-[11px] mt-0.5 ${v.id === activeVariant.id ? 'text-[#FAF7F2]/80' : 'text-[#6B584C]'}`}>
                      {formatINR(v.price)}
                    </span>
                  )}
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
                <div className="inline-flex items-center border border-[#2C1E16]/25 h-12 bg-[#FAF7F2]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-11 h-full flex items-center justify-center text-[#2C1E16] hover:bg-[#F4EFE6] cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold tabular-nums text-[#2C1E16]">{quantity}</span>
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
                  className="flex-1 min-w-[200px] h-12 bg-[#2C1E16] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#3F2C21] transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  Add to Bag — {formatINR(activeVariant.price * quantity)}
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
                  className="w-12 h-12 border border-[#2C1E16]/25 bg-[#FAF7F2] flex items-center justify-center hover:border-[#B89352] cursor-pointer transition-colors"
                >
                  <Heart className={`w-4 h-4 transition-transform duration-300 ${isSaved ? 'fill-[#B89352] text-[#B89352] scale-110' : 'text-[#2C1E16]'}`} />
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-[#2C1E16]/12 bg-[#F4EFE6] p-4 text-sm text-[#6B584C]">
              This variant is currently unavailable. You can ask our concierge about availability directly on WhatsApp.
            </div>
          )}

          {/* Dedicated WhatsApp Ordering Box */}
          <div className="p-4 bg-[#F4EFE6]/70 border border-[#2C1E16]/12 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2C1E16] inline-flex items-center gap-1.5">
                <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                WhatsApp Atelier Concierge
              </span>
              <span className="text-[11px] text-[#6B584C]">Direct Consultation</span>
            </div>
            <input
              type="text"
              value={waEnquiryNote}
              onChange={(e) => setWaEnquiryNote(e.target.value)}
              placeholder="Add personal note (e.g., custom gift message, delivery date request)..."
              aria-label="WhatsApp enquiry note"
              className="w-full min-h-11 bg-[#FAF7F2] border border-[#2C1E16]/15 px-3 py-2 text-xs text-[#2C1E16] placeholder-[#6B584C]/70 focus:outline-none focus:border-[#B89352]"
            />
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 inline-flex items-center justify-center gap-2 bg-[#FAF7F2] border border-[#2C1E16]/30 text-[#2C1E16] text-xs font-semibold uppercase tracking-[0.16em] hover:border-[#25D366] hover:bg-[#F4EFE6] transition-all"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              <span>{product.isShowcaseDemo ? 'Ask About This Concept' : 'Order or Inquire on WhatsApp'}</span>
            </a>
            <p className="text-[11px] leading-relaxed text-[#6B584C]">
              WhatsApp connects directly to our Noida atelier team for custom gift ribboning, personalized advice, and expedited delivery coordination.
            </p>
          </div>

          {/* Luxury Accordion System */}
          <div className="border-t border-[#2C1E16]/12 divide-y divide-[#2C1E16]/10 pt-2">
            {/* 1. The Composition & Olfactory Story */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleAccordion('composition')}
                className="w-full flex items-center justify-between text-left font-serif text-lg text-[#2C1E16] cursor-pointer"
              >
                <span>The Composition</span>
                <ChevronDown className={`w-4 h-4 text-[#B89352] transition-transform duration-300 ${openAccordion === 'composition' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'composition' && (
                <div className="mt-3 text-sm text-[#6B584C] leading-relaxed space-y-3">
                  <p>{product.description}</p>
                </div>
              )}
            </div>

            {/* 2. Olfactive Notes Pyramid */}
            {product.fragranceNotes && (
              <div className="py-4">
                <button
                  type="button"
                  onClick={() => toggleAccordion('notes')}
                  className="w-full flex items-center justify-between text-left font-serif text-lg text-[#2C1E16] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    Olfactory Architecture
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#B89352] transition-transform duration-300 ${openAccordion === 'notes' ? 'rotate-180' : ''}`} />
                </button>
                {openAccordion === 'notes' && (
                  <div className="mt-4 space-y-3.5">
                    {/* Top Notes */}
                    <div className="p-3.5 bg-[#FAF7F2] border border-[#2C1E16]/10">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="uppercase tracking-[0.18em] font-medium text-[#B89352]">Top Notes · The Opening</span>
                        <span className="text-[10px] text-[#6B584C]">First 15 minutes</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {product.fragranceNotes.top.map((note) => (
                          <span key={note} className="bg-[#F4EFE6] px-2.5 py-1 text-xs text-[#2C1E16] border border-[#2C1E16]/8">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Heart Notes */}
                    <div className="p-3.5 bg-[#FAF7F2] border border-[#2C1E16]/10">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="uppercase tracking-[0.18em] font-medium text-[#B89352]">Heart Notes · The Soul</span>
                        <span className="text-[10px] text-[#6B584C]">2 to 4 hours</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {product.fragranceNotes.heart.map((note) => (
                          <span key={note} className="bg-[#F4EFE6] px-2.5 py-1 text-xs text-[#2C1E16] border border-[#2C1E16]/8">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Base Notes */}
                    <div className="p-3.5 bg-[#FAF7F2] border border-[#2C1E16]/10">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="uppercase tracking-[0.18em] font-medium text-[#B89352]">Base Notes · The Memory</span>
                        <span className="text-[10px] text-[#6B584C]">6 to 12+ hours</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {product.fragranceNotes.base.map((note) => (
                          <span key={note} className="bg-[#F4EFE6] px-2.5 py-1 text-xs text-[#2C1E16] border border-[#2C1E16]/8">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Specifications & Materials */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleAccordion('specs')}
                className="w-full flex items-center justify-between text-left font-serif text-lg text-[#2C1E16] cursor-pointer"
              >
                <span>Atelier Specifications</span>
                <ChevronDown className={`w-4 h-4 text-[#B89352] transition-transform duration-300 ${openAccordion === 'specs' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'specs' && (
                <div className="mt-3 space-y-3">
                  {Object.keys(product.specifications).length > 0 && (
                    <dl className="divide-y divide-[#2C1E16]/10 border border-[#2C1E16]/10 bg-[#FAF7F2]">
                      {Object.entries(product.specifications).map(([key, val]) => (
                        <div key={key} className="py-2.5 px-3.5 flex justify-between gap-4 text-xs">
                          <dt className="text-[#6B584C] font-medium">{key}</dt>
                          <dd className="text-[#2C1E16] text-right">{val}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {product.ingredientsOrMaterials && (
                    <div className="p-3 bg-[#F4EFE6]/50 border border-[#2C1E16]/10 text-xs">
                      <p className="uppercase tracking-[0.14em] text-[#6B584C] font-medium mb-1">Ingredients & Craft Materials</p>
                      <p className="text-[#2C1E16] leading-relaxed">{product.ingredientsOrMaterials}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Ritual & Care */}
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleAccordion('ritual')}
                className="w-full flex items-center justify-between text-left font-serif text-lg text-[#2C1E16] cursor-pointer"
              >
                <span>The Ritual & Care</span>
                <ChevronDown className={`w-4 h-4 text-[#B89352] transition-transform duration-300 ${openAccordion === 'ritual' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'ritual' && (
                <div className="mt-3 text-xs text-[#6B584C] leading-relaxed space-y-2 p-3.5 bg-[#FAF7F2] border border-[#2C1E16]/10">
                  {product.categoryId === 'cat-scented-candles' || product.categoryId === 'cat-sculptural-candles' ? (
                    <>
                      <p>• On first burn, allow the melted wax pool to reach the edges of the vessel (~2 to 3 hours) to prevent candle tunneling.</p>
                      <p>• Trim the cotton wick to 5mm prior to each lighting to maintain a pure, soot-free flame.</p>
                      <p>• Burn on a heat-resistant surface away from direct drafts, children, and flammable objects.</p>
                    </>
                  ) : product.categoryId === 'cat-curated-fragrances' ? (
                    <>
                      <p>• Spray onto warm pulse points: the inside of wrists, hollow of the clavicle, and behind the ears.</p>
                      <p>• Allow the macerated essence to dry naturally without friction; rubbing can bruise delicate volatile top notes.</p>
                      <p>• Store away from direct sunlight and temperature fluctuations to preserve pure botanical extracts.</p>
                    </>
                  ) : (
                    <>
                      <p>• Keep in a cool, dry place. Handcrafted with non-toxic, archival-grade artisanal components.</p>
                      <p>• Each set arrives carefully checked by our atelier team prior to dispatch.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together */}
      {bundlePartner && !product.isShowcaseDemo && !bundlePartner.isShowcaseDemo && (
        <section className="mt-14 p-6 bg-[#F4EFE6]/65 border border-[#2C1E16]/10 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-[#B89352] font-medium">Complete the Ritual</p>
              <h2 className="font-serif text-2xl text-[#2C1E16] mt-1">Frequently Paired Together</h2>
              <p className="text-xs text-[#6B584C] mt-1">
                {product.name} ({activeVariant.label}) + {bundlePartner.name} ({bundlePartner.variants[0]?.label})
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-xl font-semibold tabular-nums text-[#2C1E16]">
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
                className="bg-[#2C1E16] text-[#FAF7F2] px-6 py-3 text-xs uppercase tracking-[0.16em] font-medium hover:bg-[#3F2C21] transition-all cursor-pointer shadow-sm"
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
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-serif text-3xl text-[#2C1E16]">Related Creations</h2>
            <button
              type="button"
              onClick={() => navigate(`/shop?category=${product.categoryId}`)}
              className="text-xs uppercase tracking-[0.16em] text-[#B89352] hover:underline cursor-pointer"
            >
              View all in {product.categoryName} →
            </button>
          </div>
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
        <div className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+76px)] left-0 right-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#2C1E16]/12 px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#2C1E16] truncate">{product.name}</p>
            <p className="text-xs text-[#6B584C] tabular-nums font-medium">{formatINR(activeVariant.price * quantity)}</p>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Send a WhatsApp enquiry"
            className="h-10 px-3 border border-[#2C1E16]/25 flex items-center justify-center text-[#2C1E16] bg-[#FAF7F2]"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
          </a>
          <button
            type="button"
            onClick={() => handleAdd(true)}
            className="h-10 px-5 bg-[#2C1E16] text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-sm"
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
          ref={zoomDialogRef}
          tabIndex={-1}
          className="fixed inset-0 z-50 bg-[#2C1E16]/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Close zoom view"
            className="absolute top-5 right-5 h-11 w-11 bg-[#FAF7F2] text-[#2C1E16] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] cursor-pointer shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={product.images[activeImgIdx] || product.images[0]}
            alt={product.name}
            className="max-h-[85vh] max-w-[92vw] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
