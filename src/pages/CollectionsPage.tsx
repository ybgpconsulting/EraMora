import React, { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { ProductCard } from '../components/ProductCard';
import { Reveal } from '../components/Reveal';

type ShowcaseTab = 'featured' | 'fragrance' | 'candles' | 'sculptural' | 'diy' | 'gifting';

const TABS: Array<[ShowcaseTab, string]> = [
  ['featured', 'Featured'],
  ['fragrance', 'Curated Fragrances'],
  ['candles', 'Scented Candles'],
  ['sculptural', 'Sculptural Candles'],
  ['diy', 'DIY Colouring Kits'],
  ['gifting', 'Gifting'],
];

const HERO_IMAGE = '/src/assets/images/editorial_lifestyle_ritual_1794827351121.jpg';

export const CollectionsPage: React.FC = () => {
  const { categories, products, navigate, loadingCatalog } = useStore();
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('featured');

  const displayedProducts = useMemo(() => {
    if (activeTab === 'candles') return products.filter((p) => p.categoryId === 'cat-scented-candles').slice(0, 6);
    if (activeTab === 'fragrance') return products.filter((p) => p.categoryId === 'cat-curated-fragrances').slice(0, 6);
    if (activeTab === 'sculptural') return products.filter((p) => p.categoryId === 'cat-sculptural-candles').slice(0, 6);
    if (activeTab === 'diy') return products.filter((p) => p.categoryId === 'cat-diy-colouring-kits').slice(0, 6);
    if (activeTab === 'gifting') return products.filter((p) => p.categoryId === 'cat-gifting').slice(0, 6);
    return products.filter((p) => p.isFeatured).slice(0, 6);
  }, [activeTab, products]);

  return (
    <div className="bg-[#FAF7F2]">
      <SeoHead
        title="The Collections | ERAMORA"
        description="Explore ERAMORA collections: curated fragrances, scented candles, sculptural candles, DIY colouring kits and gifting."
        canonicalPath="/collections"
      />

      <section className="relative h-[46svh] min-h-[340px] overflow-hidden md:h-[56svh]">
        <img src={HERO_IMAGE} alt="ERAMORA candle ritual on travertine with brass trimmer" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B120D]/90 via-[#1B120D]/35 to-[#1B120D]/30" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-5 pb-10 md:px-10 md:pb-14">
          <p className="luxe-eyebrow text-[#C5A059]">The Catalogue</p>
          <h1 className="mt-3 text-balance font-serif text-4xl leading-[1.02] text-[#FAF7F2] md:text-6xl">
            The Collections
          </h1>
          <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-[#FAF7F2]/70 md:text-[15px]">
            Every ERAMORA object begins with a memory. Explore the house by fragrance family, gesture and room.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20">
        <Reveal className="flex flex-col gap-3 border-b border-[#2C1E16]/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="luxe-eyebrow text-[#B89352]">By Category</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">Five expressions of the house.</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="group inline-flex items-center gap-2 self-start text-[10px] uppercase tracking-[0.24em] text-[#2C1E16] md:self-auto cursor-pointer"
          >
            Browse the full catalogue
            <ArrowUpRight className="h-3.5 w-3.5 text-[#B89352] transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-5 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <Reveal key={cat.id} delay={i * 55}>
              <button
                type="button"
                onClick={() => navigate(`/shop?category=${cat.slug}`)}
                className="group block w-full text-left cursor-pointer"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-[#F4EFE6]">
                  <ImageWithFallback
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B120D]/75 via-transparent to-transparent" />
                  <span className="absolute left-3 top-3 text-[9px] tabular-nums tracking-[0.3em] text-[#FAF7F2]/70">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                    <h3 className="font-serif text-base leading-tight text-[#FAF7F2] md:text-xl">{cat.name}</h3>
                    <span className="mt-1 inline-flex items-center gap-1 text-[8px] uppercase tracking-[0.24em] text-[#C5A059] opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:text-[9px]">
                      Explore <ArrowUpRight className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </div>
                <p className="mt-2.5 line-clamp-2 text-[11px] leading-relaxed text-[#6B584C]">{cat.description}</p>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-[#2C1E16]/10">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20">
          <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="luxe-eyebrow text-[#B89352]">The Signature Edit</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">Creations in focus.</h2>
            </div>

            <div
              role="tablist"
              aria-label="Collection filters"
              className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:px-0"
            >
              {TABS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === key}
                  onClick={() => setActiveTab(key)}
                  className={`whitespace-nowrap border px-3.5 py-2 text-[9px] uppercase tracking-[0.2em] transition-colors cursor-pointer ${
                    activeTab === key
                      ? 'border-[#2C1E16] bg-[#2C1E16] text-[#FAF7F2]'
                      : 'border-[#2C1E16]/12 text-[#6B584C] hover:border-[#2C1E16]/40 hover:text-[#2C1E16]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Reveal>

          {loadingCatalog ? (
            <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-8">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="space-y-3">
                  <div className="aspect-[4/5] animate-pulse bg-[#F4EFE6]" />
                  <div className="h-3 w-2/3 animate-pulse bg-[#F4EFE6]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-8">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="group inline-flex items-center gap-3 border border-[#2C1E16]/25 px-8 py-3.5 text-[10px] uppercase tracking-[0.26em] text-[#2C1E16] transition-colors duration-500 hover:border-[#2C1E16] hover:bg-[#2C1E16] hover:text-[#FAF7F2] cursor-pointer"
            >
              View every creation
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
