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

const COLLECTIONS = [
  {
    slug: 'scented-candles',
    id: 'cat-scented-candles',
    title: 'Scented Candles',
    heading: 'A little warmth for home.',
    description: 'Explore the candle collection and ask our concierge to confirm current designs and availability.',
    fallbackImage: CANDLE_IMAGE,
    imageAlt: 'ERAMORA scented candle collection',
    imageFit: 'cover',
    accent: 'text-[#765A2E]',
  },
  {
    slug: 'diy-colouring-kits',
    id: 'cat-diy-colouring-kits',
    title: "Kids’ DIY Colouring Kits",
    heading: 'Colour outside the lines.',
    description: 'Decorative white jars, bowls, trays and trinket dishes for children to personalise with colour.',
    fallbackImage: DIY_IMAGE,
    imageAlt: 'Unpainted white DIY colouring kit design',
    imageFit: 'contain',
    accent: 'text-[#A65F43]',
  },
] as const;

export const CollectionsPage: React.FC = () => {
  const { categories, products, navigate, settings, loadingCatalog } = useStore();
  const currentCategories = getCurrentStoreCategories(categories);
  const currentProducts = getCurrentStoreProducts(products, categories);
  const whatsappUrl = buildGeneralWhatsAppUrl(
    settings.whatsappNumber,
    `Hello ${settings.brandName}, please let me know about current scented candle and kids' DIY colouring kit availability.`
  );

  return (
    <div className="bg-[#FAF7F2]">
      <SeoHead {...SEO_PAGES.collections} />

      <section className="relative overflow-hidden bg-[#241811] text-[#FAF7F2]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:min-h-[470px] lg:grid-cols-[1fr_0.85fr]">
          <div className="flex flex-col justify-center px-5 py-14 sm:px-8 md:px-10 lg:py-20">
            <p className="luxe-eyebrow text-[#D4B77D]">The ERAMORA edit</p>
            <h1 className="mt-4 max-w-2xl text-balance font-serif text-4xl leading-[1.02] md:text-6xl">
              Candles for home.
              <span className="mt-1 block text-[#D4B77D]">Colour kits for kids.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#FAF7F2]/72 md:text-base">
              We’re keeping things focused: scented candles and hands-on DIY colouring kits. Ask our WhatsApp
              Concierge to confirm product details and current availability.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/shop?category=scented-candles')}
                className="inline-flex min-h-11 items-center gap-2 bg-[#FAF7F2] px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#241811] transition-colors hover:bg-[#E9DFC9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B77D] cursor-pointer"
              >
                Explore candles
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/shop?category=diy-colouring-kits')}
                className="inline-flex min-h-11 items-center gap-2 border border-[#FAF7F2]/40 px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#FAF7F2] transition-colors hover:border-[#D4B77D] hover:text-[#E2C792] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B77D] cursor-pointer"
              >
                Explore kids’ kits
                <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="relative min-h-[310px] overflow-hidden bg-[#3A291F] sm:min-h-[390px] lg:min-h-0">
            <ImageWithFallback
              src={CANDLE_IMAGE}
              alt="Scented candle in a warm home setting"
              loading="eager"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1B120D]/65 via-transparent to-[#1B120D]/10" />
            <div className="absolute bottom-5 left-5 border-l border-[#D4B77D] pl-3 sm:bottom-7 sm:left-7">
              <p className="luxe-eyebrow text-[#E1C58B]">For everyday rituals</p>
              <p className="mt-1 font-serif text-xl">A thoughtful little edit.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20">
        <Reveal className="flex flex-col gap-3 border-b border-[#2C1E16]/10 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="luxe-eyebrow text-[#765A2E]">Shop by collection</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-[#2C1E16] md:text-4xl">
              Two ways to make a moment.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#6B584C] md:text-right">
            Find a gentle glow for your space or a creative project to share with your little ones.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-5 md:grid-cols-2 md:gap-7">
          {COLLECTIONS.map((collection) => {
            const category = currentCategories.find((entry) => entry.slug === collection.slug);
            const collectionProducts = currentProducts.filter(
              (product) => product.categoryId === (category?.id || collection.id)
            );
            const image = collectionProducts[0]
              ? getProductImage(collectionProducts[0])
              : collection.fallbackImage;
            const isDiy = collection.slug === 'diy-colouring-kits';

            return (
              <Reveal key={collection.slug}>
                <button
                  type="button"
                  onClick={() => navigate(`/shop?category=${collection.slug}`)}
                  className="group flex h-full w-full flex-col overflow-hidden border border-[#2C1E16]/10 bg-white text-left transition-colors hover:border-[#B89352]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F4EFE6]">
                    <ImageWithFallback
                      src={image}
                      alt={collectionProducts[0]?.imageAlt || collection.imageAlt}
                      className={`h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
                        collection.imageFit === 'contain' ? 'object-contain p-8 sm:p-12' : 'object-cover'
                      }`}
                    />
                    <span className={`absolute left-4 top-4 border border-white/60 bg-white/95 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] ${collection.accent}`}>
                      {loadingCatalog
                        ? 'Collection'
                        : collectionProducts.length
                          ? `${collectionProducts.length} designs`
                          : 'Availability by enquiry'}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-5 sm:p-7">
                    <div>
                      <p className={`luxe-eyebrow ${collection.accent}`}>{isDiy ? 'For little makers' : 'For slower moments'}</p>
                      <h3 className="mt-2 font-serif text-2xl text-[#2C1E16] sm:text-3xl">{collection.title}</h3>
                      <p className="mt-2 font-serif text-lg text-[#6B584C]">{collection.heading}</p>
                      <p className="mt-3 max-w-lg text-sm leading-6 text-[#6B584C]">{collection.description}</p>
                    </div>
                    <span className="mt-6 inline-flex min-h-11 items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#2C1E16]">
                      {collectionProducts.length ? 'Browse this collection' : 'Ask about availability'}
                      <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#A77D3F] transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </button>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="border-y border-[#2C1E16]/10 bg-[#F4EFE6]/55">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20">
          <Reveal className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="luxe-eyebrow text-[#A65F43]">Kids’ DIY Colouring Kits</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-[#2C1E16] md:text-4xl">
                Make it yours, one colour at a time.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/shop?category=diy-colouring-kits')}
              className="inline-flex min-h-11 items-center gap-2 self-start text-[10px] font-medium uppercase tracking-[0.18em] text-[#2C1E16] hover:text-[#8F5038] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] sm:self-auto cursor-pointer"
            >
              See all {currentProducts.filter((product) => product.categoryId === 'cat-diy-colouring-kits').length} kits
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </Reveal>

          {loadingCatalog ? (
            <div role="status" aria-label="Loading DIY colouring kits" className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="aspect-[4/5] animate-pulse bg-[#E9DFC9]" />
              ))}
            </div>
          ) : currentProducts.filter((product) => product.categoryId === 'cat-diy-colouring-kits').length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
              {currentProducts
                .filter((product) => product.categoryId === 'cat-diy-colouring-kits')
                .slice(0, 4)
                .map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
            </div>
          ) : (
            <p className="border border-dashed border-[#2C1E16]/15 bg-white/60 p-8 text-center text-sm text-[#6B584C]">
              Our kids’ colouring kits are being refreshed. Contact the concierge for updates.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-16">
        <div className="flex flex-col gap-4 border-l-2 border-[#B89352] pl-5 sm:flex-row sm:items-center sm:justify-between sm:pl-7">
          <div>
            <p className="luxe-eyebrow text-[#765A2E]">A little help, whenever you need it</p>
            <h2 className="mt-2 font-serif text-2xl text-[#2C1E16]">Ask us what’s available.</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#6B584C]">
              Our WhatsApp Concierge can confirm current products and answer your questions.
            </p>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start border border-[#2C1E16]/20 px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#2C1E16] transition-colors hover:border-[#A77D3F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] sm:self-auto"
          >
            WhatsApp Concierge
            <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-[#A77D3F]" />
          </a>
        </div>
      </section>
    </div>
  );
};
