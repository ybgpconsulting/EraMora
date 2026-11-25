import React, { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { Reveal } from '../components/Reveal';
import { useScrollProgress, useWindowScroll } from '../hooks/useScrollProgress';
import { SEO_PAGES } from '../utils/seo';

const IMG = {
  hero: '/src/assets/images/hero_eramora_atelier_1794827348612.jpg',
  candle: '/src/assets/images/product_candle_oud_velvet_1794827351032.jpg',
  perfume: '/src/assets/images/product_perfume_saffron_noir_1794827349377.jpg',
  diffuser: '/src/assets/images/product_reed_diffuser_neroli_1794827350244.jpg',
  coffret: '/src/assets/images/product_gift_coffret_luxury_1794827351996.jpg',
  ritual: '/src/assets/images/editorial_lifestyle_ritual_1794827351121.jpg',
};

interface ChapterProps {
  id?: string;
  index: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  image: string;
}

const Chapter = React.memo(function Chapter({ id, index, eyebrow, title, body, cta, href, image }: ChapterProps) {
  const { navigate } = useStore();
  const ref = useRef<HTMLElement>(null);
  const progress = useScrollProgress(ref);
  const reveal = Math.min(1, Math.max(0, (progress - 0.04) / 0.3));

  return (
    <section id={id} ref={ref} className="home-scroll-chapter relative h-[190svh] bg-[#1B120D] md:h-[225svh]">
      <div className="home-scroll-stage sticky top-[var(--nav-h)] h-[calc(100svh-var(--nav-h))] overflow-hidden">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="home-scroll-image absolute inset-0 h-full w-full object-cover will-change-transform"
          style={{ transform: `scale(${1.07 + progress * 0.1})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1B120D]/92 via-[#1B120D]/20 to-[#1B120D]/55" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-6 text-[#FAF7F2]/45 md:px-10">
          <span className="luxe-eyebrow">ERAMORA</span>
          <span className="text-[10px] tabular-nums tracking-[0.34em]">{index}</span>
        </div>

        <div className="home-scroll-content relative mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-24 md:px-10 md:pb-16">
          <div
            className="home-scroll-copy max-w-xl text-[#FAF7F2]"
            style={{ opacity: reveal, transform: `translate3d(0, ${(1 - reveal) * 30}px, 0)` }}
          >
            <p className="luxe-eyebrow text-[#C5A059]">{eyebrow}</p>
            <h2 className="mt-4 text-balance font-serif text-[2.6rem] leading-[1.02] md:text-[3.6rem] lg:text-[4.1rem]">
              {title}
            </h2>
            <p className="mt-5 max-w-md text-[13px] leading-relaxed text-[#FAF7F2]/70 md:text-[15px]">{body}</p>
            <button
              type="button"
              onClick={() => navigate(href)}
              className="group mt-8 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] cursor-pointer"
            >
              <span className="relative pb-1">
                {cta}
                <span className="absolute bottom-0 left-0 h-px w-full bg-[#C5A059]/50 transition-colors duration-500 group-hover:bg-[#C5A059]" />
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#C5A059] transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});

const destinations = [
  {
    n: '01',
    title: 'The Collections',
    copy: 'Candles, fine fragrance, home perfumes and the objects that hold them.',
    href: '/collections',
    image: IMG.candle,
  },
  {
    n: '02',
    title: 'Signature Creations',
    copy: 'Our most-loved compositions, ready to be discovered in full.',
    href: '/shop',
    image: IMG.perfume,
  },
  {
    n: '03',
    title: 'The Gifting Atelier',
    copy: 'Explore gifting concepts and ask our concierge about available options.',
    href: '/gifting',
    image: IMG.coffret,
  },
];

const campaignArtwork = [
  {
    title: 'The Art of Fragrance',
    copy: 'Explore curated fragrances and scented candles.',
    image: '/brand/eramora/campaigns/fragrance-art.jpg',
    alt: 'ERAMORA fragrance campaign featuring a candle, diffuser and the message The Art of Fragrance',
    href: '/collections',
  },
  {
    title: 'Thoughtful Gifting',
    copy: 'Discover gifting composed for every occasion.',
    image: '/brand/eramora/campaigns/thoughtful-gifting.jpg',
    alt: 'ERAMORA gifting campaign showing a luxury fragrance and candle gift set',
    href: '/gifting',
  },
  {
    title: 'Introducing ERAMORA',
    copy: 'Where fragrance meets emotion.',
    image: '/brand/eramora/campaigns/brand-introduction.jpg',
    alt: 'ERAMORA introduction campaign featuring its fragrance, candle and gifting collection',
    href: '/about',
  },
];

export const HomePage: React.FC = () => {
  const { navigate, banners, settings } = useStore();
  const scrollY = useWindowScroll();
  const heroImage =
    banners.heroImage === '/brand/eramora/campaigns/brand-introduction.jpg'
      ? IMG.hero
      : banners.heroImage || IMG.hero;

  return (
    <div className="overflow-x-clip bg-[#FAF7F2]">
      <SeoHead {...SEO_PAGES.home} />

      {/* ---------- Cover ---------- */}
      <section className="relative h-[calc(100svh-var(--nav-h))] min-h-[520px] overflow-hidden bg-[#1B120D]">
        <img
          src={heroImage}
          alt="ERAMORA scented candle and Eau de Parfum flacon on travertine stone"
          className="home-hero-image absolute inset-0 h-full w-full object-cover"
          style={{
            transform: `translate3d(0, ${Math.min(scrollY * 0.16, 120)}px, 0) scale(${
              1.05 + Math.min(scrollY / 5000, 0.05)
            })`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B120D]/45 via-[#1B120D]/5 to-[#1B120D]/85" />

        <div className="absolute inset-x-0 top-0 flex justify-center px-6 pt-7">
          <span className="luxe-eyebrow text-center text-[#FAF7F2]/70">
            {banners.heroEyebrow || `${settings.brandName} · Atelier Collection`}
          </span>
        </div>

        <div className="absolute inset-x-0 top-[13%] flex flex-col items-center gap-5 px-6 text-center md:top-[16%]">
          <div>
            <h1 className="mx-auto max-w-3xl text-balance font-serif text-[2.5rem] leading-[1.02] text-[#FAF7F2] drop-shadow-[0_2px_14px_rgba(27,18,13,0.7)] md:text-6xl lg:text-7xl">
              {banners.heroHeadline}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-[12px] leading-relaxed text-[#FAF7F2] drop-shadow-[0_1px_8px_rgba(27,18,13,0.8)] md:text-sm">
              {banners.heroSubheadline}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="group inline-flex min-h-11 items-center gap-2 bg-[#2C1E16] px-6 text-[10px] font-medium uppercase tracking-[0.2em] text-[#FAF7F2] transition-colors hover:bg-[#3F2C21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FAF7F2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241811] cursor-pointer"
          >
            {banners.heroCtaLabel || 'Explore the Collection'}
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex justify-center pb-28 md:pb-10">
          <button
            type="button"
            onClick={() => {
              const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
              document.getElementById('home-philosophy')?.scrollIntoView({
                behavior: reducedMotion ? 'auto' : 'smooth',
              });
            }}
            aria-label="Scroll to explore the atelier"
            className="group flex flex-col items-center gap-3 cursor-pointer"
          >
            <span className="text-[9px] uppercase tracking-[0.42em] text-[#FAF7F2]/60 transition-colors group-hover:text-[#FAF7F2]">
              Scroll
            </span>
            <span className="relative block h-12 w-px overflow-hidden bg-[#FAF7F2]/20">
              <span className="scroll-cue absolute inset-0 bg-[#C5A059]" />
            </span>
          </button>
        </div>
      </section>

      {/* ---------- Scroll chapters ---------- */}
      <Chapter
        id="home-philosophy"
        index="I"
        eyebrow="The Philosophy"
        title="Where Fragrance Meets Emotion."
        body="Curated fragrances, candles and gifting to make every moment memorable."
        cta="Read our story"
        href="/about"
        image={IMG.ritual}
      />
      <Chapter
        index="II"
        eyebrow="The Gifting Atelier"
        title={banners.campaignTitle}
        body={banners.campaignSubtitle}
        cta="Enter the atelier"
        href="/gifting"
        image={IMG.coffret}
      />
      <Chapter
        index="III"
        eyebrow="Objects for the Home"
        title="A Scent for Every Room."
        body="Hand-poured wax, fine fragrance and quietly tactile objects made to be lived with, long after the last burn."
        cta="View the collections"
        href="/collections"
        image={IMG.candle}
      />

      {/* ---------- Atelier index ---------- */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24">
        <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="luxe-eyebrow text-[#B89352]">The Atelier Index</p>
            <h2 className="mt-3 max-w-lg text-balance font-serif text-3xl leading-[1.08] md:text-5xl">
              Four ways to enter the house.
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-relaxed text-[#6B584C] md:text-right">
            Each room of ERAMORA lives on its own page — so the story stays unhurried.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-px border border-[#2C1E16]/10 bg-[#2C1E16]/10 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((item, i) => (
            <Reveal key={item.href} delay={i * 60} className="h-full">
              <button
                type="button"
                onClick={() => navigate(item.href)}
                className="group flex h-full w-full items-stretch gap-4 bg-[#FAF7F2] p-4 text-left transition-colors duration-500 hover:bg-[#F4EFE6]/70 md:p-5 cursor-pointer"
              >
                <div className="h-[92px] w-16 shrink-0 overflow-hidden bg-[#F4EFE6] md:h-24 md:w-20">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-[1100ms] group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between py-0.5">
                  <div>
                    <span className="text-[9px] tabular-nums tracking-[0.34em] text-[#B89352]">{item.n}</span>
                    <h3 className="mt-1 font-serif text-xl leading-tight text-[#2C1E16] md:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-[#6B584C] md:text-xs">{item.copy}</p>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.28em] text-[#2C1E16]/60 transition-colors group-hover:text-[#B89352]">
                    Enter
                    <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Atelier campaign artwork ---------- */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24">
        <Reveal className="text-center">
          <p className="luxe-eyebrow text-[#B89352]">From the ERAMORA Atelier</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight md:text-5xl">
            Make every moment memorable.
          </h2>
        </Reveal>

        <div className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaignArtwork.map((campaign, i) => (
            <Reveal key={campaign.title} delay={i * 60}>
              <button
                type="button"
                onClick={() => navigate(campaign.href)}
                className="group block w-full text-left cursor-pointer"
              >
                <div className="aspect-[4/5] overflow-hidden bg-[#F4EFE6]">
                  <img
                    src={campaign.image}
                    alt={campaign.alt}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain transition-transform duration-[900ms] group-hover:scale-[1.02]"
                  />
                </div>
                <h3 className="mt-4 font-serif text-xl text-[#2C1E16] md:text-2xl">{campaign.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-[#6B584C]">{campaign.copy}</p>
                <span className="mt-3 inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.26em] text-[#2C1E16]/70 transition-colors group-hover:text-[#B89352]">
                  Discover
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Closing invitation ---------- */}
      <section className="relative h-[72svh] min-h-[440px] overflow-hidden">
        <img
          src={IMG.perfume}
          alt="ERAMORA Saffron Noir Eau de Parfum flacon in warm light"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1B120D]/68" />
        <div className="relative mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-6 text-center text-[#FAF7F2]">
          <Reveal>
            <p className="luxe-eyebrow text-[#C5A059]">Begin the Ritual</p>
            <h2 className="mt-5 text-balance font-serif text-4xl leading-[1.06] md:text-6xl">
              Find the scent that stays with you.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[12px] leading-relaxed text-[#FAF7F2]/65 md:text-sm">
              Personal fragrance and gifting concierge on WhatsApp
            </p>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="group mt-9 inline-flex items-center gap-3 border border-[#FAF7F2]/30 px-8 py-4 text-[10px] uppercase tracking-[0.3em] transition-colors duration-500 hover:border-[#FAF7F2] hover:bg-[#FAF7F2] hover:text-[#2C1E16] cursor-pointer"
            >
              Shop all creations
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
