import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { ProductCard } from '../components/ProductCard';
import { buildGeneralWhatsAppUrl } from '../utils/commerce';
import { getCurrentStoreCategories, getCurrentStoreProducts } from '../utils/catalogue';
import { SEO_PAGES } from '../utils/seo';

export const ShopPage: React.FC<{ initialCategory?: string }> = ({ initialCategory }) => {
  const { path, navigate, categories, products, loadingCatalog, settings } = useStore();
  const currentCategories = getCurrentStoreCategories(categories);
  const currentProducts = getCurrentStoreProducts(products, categories);

  const urlParams = new URLSearchParams(path.split('?')[1] || '');
  const initialCat = urlParams.get('category') || initialCategory || 'all';
  const initialQ = urlParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'popular' | 'latest' | 'price-asc' | 'price-desc'>('featured');
  const productPrices = currentProducts.flatMap((product) =>
    product.variants.map((variant) => variant.price)
  );
  const minProductPrice = productPrices.length ? Math.min(...productPrices) : 0;
  const maxProductPrice = productPrices.length ? Math.max(...productPrices) : 0;
  const hasPriceRange = minProductPrice < maxProductPrice;
  const candleCategory = currentCategories.find((category) => category.slug === 'scented-candles');
  const candleProducts = currentProducts.filter((product) => product.categoryId === candleCategory?.id);
  const candleAvailabilityUrl = buildGeneralWhatsAppUrl(
    settings.whatsappNumber,
    `Hello ${settings.brandName}, please let me know which scented candles are currently available.`
  );

  // Keep synced when URL changes via navbar links
  React.useEffect(() => {
    const params = new URLSearchParams(path.split('?')[1] || '');
    setSelectedCategory(params.get('category') || initialCategory || 'all');
    if (params.has('q')) setSearchQuery(params.get('q') || '');
  }, [path, initialCategory]);

  const filteredProducts = useMemo(() => {
    let list = [...currentProducts];
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter(
        (p) =>
          p.categoryId === selectedCategory ||
          p.categoryName.toLowerCase().replace(/\s+/g, '-') === selectedCategory.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }
    if (hasPriceRange && maxPrice !== null) {
      list = list.filter((product) =>
        product.variants.some((variant) => variant.price <= maxPrice)
      );
    }
    if (inStockOnly) {
      list = list.filter((p) => p.variants.some((v) => v.stock > 0));
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => {
        if (a.isShowcaseDemo !== b.isShowcaseDemo) return a.isShowcaseDemo ? 1 : -1;
        return Math.min(...a.variants.map((v) => v.price)) - Math.min(...b.variants.map((v) => v.price));
      });
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => {
        if (a.isShowcaseDemo !== b.isShowcaseDemo) return a.isShowcaseDemo ? 1 : -1;
        return Math.min(...b.variants.map((v) => v.price)) - Math.min(...a.variants.map((v) => v.price));
      });
    } else if (sortBy === 'latest') {
      list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0) || b.ratingAverage - a.ratingAverage);
    } else {
      list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
    return list;
  }, [currentProducts, selectedCategory, searchQuery, maxPrice, inStockOnly, sortBy, hasPriceRange]);

  const activeCategoryObj = currentCategories.find((category) => category.slug === selectedCategory || category.id === selectedCategory);
  const categoryTitle = activeCategoryObj?.slug === 'diy-colouring-kits'
    ? "Kids’ DIY Colouring Kits"
    : activeCategoryObj?.name;
  const categoryDescription = activeCategoryObj?.slug === 'scented-candles'
    ? 'Explore our scented candle collection. Contact the concierge to confirm current designs and availability.'
    : activeCategoryObj?.slug === 'diy-colouring-kits'
      ? 'Creative colouring kits featuring decorative jars, bowls, trays and trinket dishes for little makers.'
      : 'Explore ERAMORA scented candles and kids’ DIY colouring kits. Ask our concierge to confirm current product details and availability.';

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-14">
      <SeoHead {...SEO_PAGES.shop} />

      <div className="mb-8 border-b border-[#2C1E16]/12 pb-8">
        <p className="luxe-eyebrow text-[#765A2E]">The ERAMORA Edit</p>
        <h1 className="mt-3 font-serif text-4xl text-[#2C1E16] md:text-5xl">
          {categoryTitle || 'Candles & Colouring Kits'}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B584C]">
          {loadingCatalog
            ? 'Loading the current catalogue...'
            : categoryDescription}
        </p>
      </div>

      {/* Category Filter Strip */}
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-6 md:mx-0 md:flex-wrap md:px-0">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            navigate('/shop');
          }}
          aria-pressed={selectedCategory === 'all'}
          className={`min-h-11 shrink-0 border px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#2C1E16] text-[#FAF7F2] border-[#2C1E16]'
              : 'border-[#2C1E16]/15 text-[#6B584C] hover:border-[#2C1E16] hover:text-[#2C1E16]'
          }`}
        >
          {loadingCatalog ? 'All creations' : `All creations (${currentProducts.length})`}
        </button>
        {currentCategories.map((cat) => {
          const categoryCount = currentProducts.filter((product) => product.categoryId === cat.id).length;
          const label = cat.slug === 'diy-colouring-kits' ? 'Kids’ DIY Kits' : cat.name;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.slug);
                navigate(`/shop?category=${cat.slug}`);
              }}
              aria-pressed={selectedCategory === cat.slug || selectedCategory === cat.id}
              className={`min-h-11 shrink-0 border px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer ${
                selectedCategory === cat.slug || selectedCategory === cat.id
                  ? 'bg-[#2C1E16] text-[#FAF7F2] border-[#2C1E16]'
                  : 'border-[#2C1E16]/15 text-[#6B584C] hover:border-[#2C1E16] hover:text-[#2C1E16]'
              }`}
            >
              {label} ({categoryCount})
            </button>
          );
        })}
      </div>

      {/* Secondary Controls: Search, Price, Availability, Sort */}
      <div className="mb-6 grid grid-cols-1 items-center gap-3 border border-[#2C1E16]/10 bg-[#F4EFE6]/60 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-12">
        <div className={`relative flex items-center ${hasPriceRange ? 'lg:col-span-5' : 'lg:col-span-8'}`}>
          <Search aria-hidden="true" className="absolute left-3 h-4 w-4 text-[#6B584C]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candles, colouring kits, jars..."
            aria-label="Filter products by keyword"
            className="min-h-11 w-full border border-[#2C1E16]/15 bg-[#FAF7F2] py-2 pl-9 pr-3 text-sm text-[#2C1E16] focus:border-[#B89352] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352]"
          />
        </div>

        {hasPriceRange && (
          <>
            <div className="flex items-center gap-3 text-xs text-[#6B584C] sm:col-span-2 lg:col-span-3">
              <SlidersHorizontal aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <label htmlFor="max-price-filter" className="whitespace-nowrap">
                Up to ₹{(maxPrice ?? maxProductPrice).toLocaleString('en-IN')}
              </label>
              <input
                id="max-price-filter"
                type="range"
                min={minProductPrice}
                max={maxProductPrice}
                step={Math.max(1, Math.ceil((maxProductPrice - minProductPrice) / 20))}
                value={maxPrice ?? maxProductPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#2C1E16]"
              />
            </div>

            <div className="flex min-h-11 items-center lg:col-span-2">
              <label className="inline-flex items-center gap-2 text-xs text-[#2C1E16] cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-[#2C1E16]"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </>
        )}

        <div className="flex items-center justify-between gap-2 sm:justify-end lg:col-span-2">
          <label htmlFor="shop-sort" className="text-xs text-[#6B584C] whitespace-nowrap">
            Sort by:
          </label>
          <select
            id="shop-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="min-h-11 bg-[#FAF7F2] border border-[#2C1E16]/15 px-3 py-2 text-xs text-[#2C1E16] focus:outline-none focus:border-[#B89352] focus-visible:ring-2 focus-visible:ring-[#B89352]"
          >
            <option value="featured">Curated Featured</option>
            <option value="popular">Most Popular</option>
            <option value="latest">Latest Arrivals</option>
            {hasPriceRange && (
              <>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Results Header Count & Clear */}
      <div className="flex items-center justify-between mb-8 text-xs text-[#6B584C] border-b border-[#2C1E16]/8 pb-3">
        <span>Showing <strong className="text-[#2C1E16] font-medium">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'creation' : 'creations'}</span>
        {(searchQuery || selectedCategory !== 'all' || inStockOnly || maxPrice !== null) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              setMaxPrice(null);
              setInStockOnly(false);
              navigate('/shop');
            }}
            className="text-[#765A2E] hover:underline cursor-pointer"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results Grid */}
      {loadingCatalog ? (
        <div role="status" aria-label="Loading catalogue" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="space-y-3">
              <div className="aspect-[4/5] bg-[#F4EFE6] animate-pulse" />
              <div className="h-3 w-1/3 bg-[#F4EFE6] animate-pulse" />
              <div className="h-5 w-2/3 bg-[#F4EFE6] animate-pulse" />
              <div className="h-3 w-full bg-[#F4EFE6] animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="border border-[#2C1E16]/10 bg-[#F4EFE6]/45 px-5 py-14 text-center sm:px-8">
          {activeCategoryObj?.slug === 'scented-candles' && candleProducts.length === 0 ? (
            <div className="mx-auto max-w-xl space-y-4">
              <p className="luxe-eyebrow text-[#765A2E]">Scented Candles</p>
              <h2 className="font-serif text-2xl text-[#2C1E16] sm:text-3xl">
                No candle products are listed here right now.
              </h2>
              <p className="text-sm leading-6 text-[#6B584C]">
                Ask our WhatsApp Concierge to confirm current candle designs and availability.
              </p>
              <a
                href={candleAvailabilityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center border border-[#2C1E16]/20 bg-[#2C1E16] px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#FAF7F2] transition-colors hover:bg-[#3F2C21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352]"
              >
                Ask about candle availability
              </a>
            </div>
          ) : (
            <div className="mx-auto max-w-xl space-y-4">
              <h2 className="font-serif text-2xl text-[#2C1E16]">No matching creations found</h2>
              <p className="text-sm leading-6 text-[#6B584C]">
                Try another search or clear the filters to see the current ERAMORA edit.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                  setMaxPrice(null);
                  setInStockOnly(false);
                  navigate('/shop');
                }}
                className="min-h-11 bg-[#2C1E16] px-6 py-2.5 text-xs uppercase tracking-widest text-[#FAF7F2] transition-colors hover:bg-[#3F2C21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
