import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { ProductCard } from '../components/ProductCard';
import { Reveal } from '../components/Reveal';
import { SeoHead } from '../components/SeoHead';
import { buildGeneralWhatsAppUrl } from '../utils/commerce';
import { getCurrentStoreCategories, getCurrentStoreProducts, getProductImage } from '../utils/catalogue';
import { SEO_PAGES } from '../utils/seo';

const CANDLE_IMAGE = '/src/assets/images/product_candle_oud_velvet_1794827351032.jpg';
const DIY_IMAGE = '/products/diy-colouring-kits/rose-lid-jar-tray.webp';

const collectionDetails = [
  {
    slug: 'scented-candles',
    title: 'Scented Candles',
    eyebrow: 'For slower moments',
    copy: 'A warm, gentle glow for the corners of home you return to.',
    accent: 'champagne',
  },
  {
    slug: 'diy-colouring-kits',
    title: "Kids’ DIY Colouring Kits",
    eyebrow: 'For little makers',
    copy: 'White decorative pieces ready for children to make their own with colour.',
    accent: 'terracotta',
  },
] as const;

export const HomePage: React.FC = () => {
  const { navigate, categories, products, settings, loadingCatalog } = useStore();
  const currentCategories = getCurrentStoreCategories(categories);
  const currentProducts = getCurrentStoreProducts(products, categories);
  const candleProduct = currentProducts.find((product) => product.categoryId === 'cat-scented-candles');
  const diyProducts = currentProducts.filter((product) => product.categoryId === 'cat-diy-colouring-kits');
  const heroCandleImage = candleProduct ? getProductImage(candleProduct) : CANDLE_IMAGE;
  const heroDiyImage = diyProducts[0] ? getProductImage(diyProducts[0]) : DIY_IMAGE;
  const whatsappUrl = buildGeneralWhatsAppUrl(
    settings.whatsappNumber,
    `Hello ${settings.brandName}, please let me know about current scented candle and kids' DIY colouring kit availability.`
  );

  return (
    <div className="overflow-x-clip bg-[#FAF7F2]">
      <SeoHead {...SEO_PAGES.home} />

      <section className="relative overflow-hidden bg-[#241811] text-[#FAF7F2]">
        <div className="mx-auto grid min-h-[720px] max-w-[1440px] grid-cols-1 lg:min-h-[680px] lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative z-10 flex flex-col justify-center px-5 pb-12 pt-16 sm:px-8 md:px-12 lg:py-20 xl:px-16">
            <p className="luxe-eyebrow text-[#D4B77D]">Scented candles · kids’ colouring kits</p>
            <h1 className="mt-5 max-w-3xl text-balance font-serif text-[clamp(2.85rem,7vw,5.5rem)] leading-[0.98]">
              A softer ritual.
              <span className="mt-1 block text-[#D4B77D]">A brighter afternoon.</span>
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-[#FAF7F2]/75 md:text-base">
              Discover ERAMORA scented candles and creative colouring kits for little makers. Browse the current edit
              and ask our concierge to confirm availability before ordering.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:flex">
              <button
                type="button"
                onClick={() => navigate('/shop?category=scented-candles')}
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#FAF7F2] px-3 text-xs font-medium uppercase tracking-[0.12em] text-[#241811] transition-colors hover:bg-[#E9DFC9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B77D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241811] sm:gap-3 sm:px-5 sm:tracking-[0.16em] cursor-pointer"
              >
                <span className="sm:hidden">Candles</span>
                <span className="hidden sm:inline">Explore scented candles</span>
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/shop?category=diy-colouring-kits')}
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#FAF7F2]/40 px-3 text-xs font-medium uppercase tracking-[0.12em] text-[#FAF7F2] transition-colors hover:border-[#D4B77D] hover:text-[#E2C792] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B77D] sm:gap-3 sm:px-5 sm:tracking-[0.16em] cursor-pointer"
              >
                <span className="sm:hidden">Kids’ kits</span>
                <span className="hidden sm:inline">Shop kids’ kits</span>
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-6 text-[11px] leading-relaxed text-[#FAF7F2]/55">
              Product details and availability are confirmed by the ERAMORA WhatsApp Concierge.
            </p>
          </div>

          <div className="relative min-h-[390px] overflow-hidden bg-[#3A291F] sm:min-h-[480px] lg:min-h-0">
            <ImageWithFallback
              src={heroCandleImage}
              alt={candleProduct?.imageAlt || 'ERAMORA scented candle in warm, natural light'}
              loading="eager"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1B120D]/70 via-[#1B120D]/5 to-[#1B120D]/10" />
            <div className="absolute bottom-5 left-5 text-[#FAF7F2] sm:bottom-8 sm:left-8">
              <p className="luxe-eyebrow text-[#E1C58B]">The ERAMORA edit</p>
              <p className="mt-2 font-serif text-2xl">Made for moments at home.</p>
            </div>
            <div className="absolute right-4 top-4 flex w-[min(45%,220px)] items-center gap-3 border border-white/30 bg-[#FAF7F2]/95 p-2.5 text-[#2C1E16] shadow-lg backdrop-blur-md sm:right-7 sm:top-7 sm:w-[230px] sm:p-3">
              <ImageWithFallback
                src={heroDiyImage}
                alt={diyProducts[0]?.imageAlt || 'Unpainted white DIY colouring kit design'}
                className="h-16 w-16 shrink-0 bg-[#F4EFE6] object-contain sm:h-[76px] sm:w-[76px]"
              />
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.15em] text-[#A65F43]">For little makers</p>
                <p className="mt-1 line-clamp-2 font-serif text-sm leading-tight sm:text-base">
                  Kids’ DIY Colouring Kits
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24">
        <Reveal className="flex flex-col gap-4 border-b border-[#2C1E16]/10 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="luxe-eyebrow text-[#765A2E]">Two collections to explore</p>
            <h2 className="mt-3 max-w-2xl text-balance font-serif text-3xl leading-tight text-[#2C1E16] md:text-5xl">
              Choose a moment to make your own.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#6B584C] md:text-right">
            A considered candle for home, or a creative kit for a colourful afternoon together.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-5 md:grid-cols-2 md:gap-7">
          {collectionDetails.map((collection, index) => {
            const category = currentCategories.find((entry) => entry.slug === collection.slug);
            const product = currentProducts.find((entry) => entry.categoryId === category?.id);
            const image =
              collection.slug === 'scented-candles'
                ? product ? getProductImage(product) : CANDLE_IMAGE
                : product ? getProductImage(product) : DIY_IMAGE;
            const categoryHasProducts = currentProducts.some((entry) => entry.categoryId === category?.id);
            const isDiy = collection.slug === 'diy-colouring-kits';

            return (
              <Reveal key={collection.slug} delay={index * 70}>
                <button
                  type="button"
                  onClick={() => navigate(`/shop?category=${collection.slug}`)}
                  className="group grid w-full overflow-hidden border border-[#2C1E16]/10 bg-white text-left transition-colors duration-300 hover:border-[#B89352]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] md:grid-cols-[1.05fr_0.95fr] cursor-pointer"
                >
                  <div className="relative aspect-[5/4] overflow-hidden bg-[#F4EFE6] md:aspect-auto md:min-h-[320px]">
                    <ImageWithFallback
                      src={image}
                      alt={product?.imageAlt || (collection.slug === 'scented-candles' ? 'Scented candle collection' : 'Unpainted white DIY colouring kit')}
                      className={`h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
                        isDiy ? 'object-contain p-8 sm:p-12' : 'object-cover'
                      }`}
                    />
                    <span
                      className={`absolute left-4 top-4 border bg-[#FAF7F2]/95 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] ${
                        collection.accent === 'terracotta'
                          ? 'border-[#A65F43]/30 text-[#8F5038]'
                          : 'border-[#B89352]/30 text-[#765A2E]'
                      }`}
                    >
                      {loadingCatalog
                        ? 'Collection'
                        : categoryHasProducts
                          ? `${currentProducts.filter((entry) => entry.categoryId === category?.id).length} designs`
                          : 'Ask about availability'}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between p-5 sm:p-7 md:p-6 lg:p-8">
                    <div>
                      <p className={`luxe-eyebrow ${collection.accent === 'terracotta' ? 'text-[#8F5038]' : 'text-[#765A2E]'}`}>
                        {collection.eyebrow}
                      </p>
                      <h3 className="mt-3 font-serif text-2xl leading-tight text-[#2C1E16] sm:text-3xl">
                        {collection.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-[#6B584C]">{collection.copy}</p>
                    </div>
                    <span className="mt-8 inline-flex min-h-11 items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#2C1E16]">
                      {collection.slug === 'scented-candles' && !categoryHasProducts
                        ? 'Ask our concierge'
                        : 'Explore collection'}
                      <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#A77D3F] transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </section>

      {currentProducts.length > 0 && (
        <section className="border-y border-[#2C1E16]/10 bg-[#F4EFE6]/60">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-20">
            <Reveal className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="luxe-eyebrow text-[#765A2E]">The current edit</p>
                <h2 className="mt-3 font-serif text-3xl leading-tight text-[#2C1E16] md:text-4xl">
                  Explore what’s listed now.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="inline-flex min-h-11 items-center gap-2 self-start text-[10px] font-medium uppercase tracking-[0.18em] text-[#2C1E16] hover:text-[#8F5038] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] md:self-auto cursor-pointer"
              >
                View all {currentProducts.length} creations
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </Reveal>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {currentProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-20">
        <div className="flex flex-col gap-6 border border-[#2C1E16]/10 bg-[#2C1E16] p-6 text-[#FAF7F2] sm:flex-row sm:items-center sm:justify-between sm:p-8 md:px-10">
          <div className="max-w-2xl">
            <p className="luxe-eyebrow text-[#D4B77D]">A personal note goes a long way</p>
            <h2 className="mt-3 font-serif text-2xl leading-tight sm:text-3xl">
              Need help choosing?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#FAF7F2]/70">
              Ask our WhatsApp Concierge about current designs, product details and availability.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 bg-[#FAF7F2] px-5 text-xs font-medium uppercase tracking-[0.16em] text-[#241811] transition-colors hover:bg-[#E9DFC9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B77D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2C1E16]"
          >
            WhatsApp Concierge
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </section>

      {loadingCatalog && (
        <div className="sr-only" role="status" aria-live="polite">
          Loading the current ERAMORA collections
        </div>
      )}
    </div>
  );
};
