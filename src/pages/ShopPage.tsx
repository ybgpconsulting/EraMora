import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { ProductCard } from '../components/ProductCard';
import { SEO_PAGES } from '../utils/seo';

export const ShopPage: React.FC = () => {
  const { path, navigate, categories, products, loadingCatalog } = useStore();

  const urlParams = new URLSearchParams(path.split('?')[1] || '');
  const initialCat = urlParams.get('category') || 'all';
  const initialQ = urlParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'popular' | 'latest' | 'price-asc' | 'price-desc'>('featured');
  const hasApprovedProducts = products.some((product) => !product.isShowcaseDemo);

  // Keep synced when URL changes via navbar links
  React.useEffect(() => {
    const params = new URLSearchParams(path.split('?')[1] || '');
    setSelectedCategory(params.get('category') || 'all');
    if (params.has('q')) setSearchQuery(params.get('q') || '');
  }, [path]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
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
    if (hasApprovedProducts && maxPrice < 10000) {
      list = list.filter(
        (p) => p.isShowcaseDemo || Math.min(...p.variants.map((v) => v.price)) <= maxPrice
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
  }, [products, selectedCategory, searchQuery, maxPrice, inStockOnly, sortBy, hasApprovedProducts]);

  const activeCategoryObj = categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <SeoHead {...SEO_PAGES.shop} />

      <div className="border-b border-[#2C1E16]/12 pb-8 mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-[#6B584C]">ERAMORA Catalogue</p>
        <h1 className="mt-1 font-serif text-4xl md:text-5xl text-[#2C1E16]">
          {activeCategoryObj ? activeCategoryObj.name : 'All Creations'}
        </h1>
        <p className="mt-2 text-sm text-[#6B584C] max-w-2xl">
          {loadingCatalog
            ? 'Loading the current catalogue...'
            : activeCategoryObj
            ? activeCategoryObj.description
            : hasApprovedProducts
              ? 'Explore the ERAMORA collection and contact our concierge to confirm product details and availability.'
              : 'Pre-loaded entries are showcase concepts for catalogue review, not approved for sale.'}
        </p>
      </div>

      {/* Category Filter Strip */}
      <div className="flex flex-wrap items-center gap-2 pb-6">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            navigate('/shop');
          }}
          aria-pressed={selectedCategory === 'all'}
          className={`min-h-11 px-4 py-2 text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#2C1E16] text-[#FAF7F2] border-[#2C1E16]'
              : 'border-[#2C1E16]/15 text-[#6B584C] hover:border-[#2C1E16] hover:text-[#2C1E16]'
          }`}
        >
          {loadingCatalog ? 'All' : `All (${products.length})`}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setSelectedCategory(cat.slug);
              navigate(`/shop?category=${cat.slug}`);
            }}
            aria-pressed={selectedCategory === cat.slug || selectedCategory === cat.id}
            className={`min-h-11 px-4 py-2 text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer ${
              selectedCategory === cat.slug || selectedCategory === cat.id
                ? 'bg-[#2C1E16] text-[#FAF7F2] border-[#2C1E16]'
                : 'border-[#2C1E16]/15 text-[#6B584C] hover:border-[#2C1E16] hover:text-[#2C1E16]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Secondary Controls: Search, Price, Availability, Sort */}
      <div className={`grid grid-cols-1 ${hasApprovedProducts ? 'md:grid-cols-12' : 'md:grid-cols-7'} gap-4 items-center bg-[#F4EFE6]/60 border border-[#2C1E16]/10 p-4 mb-10`}>
        <div className="md:col-span-4 relative flex items-center">
          <Search className="w-4 h-4 text-[#6B584C] absolute left-3" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by scent note or product..."
            aria-label="Filter products by keyword"
            className="w-full min-h-11 bg-[#FAF7F2] border border-[#2C1E16]/15 pl-9 pr-3 py-2 text-sm text-[#2C1E16] focus:outline-none focus:border-[#B89352] focus-visible:ring-2 focus-visible:ring-[#B89352]"
          />
        </div>

        {hasApprovedProducts && (
          <>
            <div className="md:col-span-3 flex items-center gap-3 text-xs text-[#6B584C]">
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <label htmlFor="max-price-filter" className="whitespace-nowrap">
                Under ₹{maxPrice.toLocaleString('en-IN')}
              </label>
              <input
                id="max-price-filter"
                type="range"
                min={1000}
                max={10000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#2C1E16]"
              />
            </div>

            <div className="md:col-span-2">
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

        <div className="md:col-span-3 flex items-center justify-end gap-2">
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
            {hasApprovedProducts && (
              <>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </>
            )}
          </select>
        </div>
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
        <div className="py-16 text-center border border-[#2C1E16]/10 bg-[#F4EFE6]/40 space-y-4">
          <p className="font-serif text-2xl text-[#2C1E16]">No matching creations found</p>
          <p className="text-sm text-[#6B584C]">Try widening your price range or clearing category filters.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              setMaxPrice(10000);
              setInStockOnly(false);
              navigate('/shop');
            }}
            className="min-h-11 bg-[#2C1E16] text-[#FAF7F2] px-6 py-2.5 text-xs uppercase tracking-widest cursor-pointer"
          >
            Reset Filters
          </button>
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
