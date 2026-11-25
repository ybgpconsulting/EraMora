import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { Reveal } from '../components/Reveal';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { buildGeneralWhatsAppUrl } from '../utils/commerce';
import { SEO_PAGES } from '../utils/seo';

const IMG = {
  coffret: '/src/assets/images/product_gift_coffret_luxury_1794827351996.jpg',
  candle: '/src/assets/images/product_candle_oud_velvet_1794827351032.jpg',
  perfume: '/src/assets/images/product_perfume_saffron_noir_1794827349377.jpg',
  ritual: '/src/assets/images/editorial_lifestyle_ritual_1794827351121.jpg',
};

const steps = [
  {
    n: 'I',
    title: 'Consult',
    body: 'Share the occasion, guest count and preferences with our concierge. Possible options and availability will be confirmed directly.',
  },
  {
    n: 'II',
    title: 'Compose',
    body: 'Discuss possible product combinations and presentation with the concierge. Product details, options, and pricing are confirmed before any purchase.',
  },
  {
    n: 'III',
    title: 'Deliver',
    body: 'Ask the concierge about presentation and delivery possibilities for your enquiry; nothing is confirmed until discussed directly.',
  },
];

const occasions = [
  { title: 'Weddings', copy: 'Ask the concierge about possible wedding gifting options and availability.', image: IMG.ritual },
  { title: 'Corporate', copy: 'Enquire about potential client or team gifting arrangements.', image: IMG.coffret },
  { title: 'Anniversaries', copy: 'Explore gifting concepts for anniversaries with the concierge.', image: IMG.candle },
  { title: 'Festive', copy: 'Ask about seasonal gifting ideas and current availability.', image: IMG.perfume },
];

export const GiftingPage: React.FC = () => {
  const { navigate, banners, settings } = useStore();

  const waUrl = buildGeneralWhatsAppUrl(
    settings.whatsappNumber,
    `Hello ${settings.brandName}, I would like to plan bespoke gifting for an occasion.`
  );

  return (
    <div className="bg-[#FAF7F2]">
      <SeoHead {...SEO_PAGES.gifting} />

      <section className="mx-auto max-w-7xl px-5 pt-10 md:px-10 md:pt-16">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-14">
          <Reveal className="lg:col-span-5">
            <p className="luxe-eyebrow text-[#B89352]">The Gifting Atelier</p>
            <h1 className="mt-4 text-balance font-serif text-[2.6rem] leading-[1.04] md:text-6xl">
              {banners.campaignTitle}
            </h1>
            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[#6B584C] md:text-[15px]">
              {banners.campaignSubtitle}
            </p>
            <p className="mt-4 max-w-md text-[13px] leading-relaxed text-[#6B584C]/85">
              A scent can hold a memory — the warmth of an evening conversation or a moment shared. Contact our
              concierge to discuss gifting ideas; any options and details are confirmed directly.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/contact?topic=custom_gifting')}
                className="group inline-flex min-h-11 items-center gap-3 bg-[#2C1E16] px-7 py-3.5 text-[10px] uppercase tracking-[0.26em] text-[#FAF7F2] transition-colors hover:bg-[#3F2C21] cursor-pointer"
              >
                Request custom gifting
                <ArrowUpRight className="h-3.5 w-3.5 text-[#C5A059] transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 border border-[#2C1E16]/20 px-5 py-3.5 text-[10px] uppercase tracking-[0.22em] text-[#2C1E16] transition-colors hover:border-[#B89352]"
              >
                <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
                WhatsApp
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#2C1E16]/10 pt-5 text-[10px] uppercase tracking-[0.18em] text-[#6B584C]">
              <span>Presentation enquiries</span>
              <span>Options confirmed directly</span>
              <span>Delivery details on request</span>
            </div>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-7">
            <div className="relative aspect-[5/4] overflow-hidden bg-[#F4EFE6] md:aspect-[16/11]">
              <ImageWithFallback
                src={IMG.coffret}
                alt="Gift coffret concept presented by ERAMORA"
                loading="eager"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B120D]/35 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-[#FAF7F2] md:bottom-5 md:left-6 md:right-6">
                <p className="font-serif text-lg leading-tight md:text-2xl">The Evening Memory Coffret</p>
                <span className="text-[9px] uppercase tracking-[0.24em] text-[#FAF7F2]/70">Gifting concept</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-10 md:py-24">
        <Reveal className="border-y border-[#2C1E16]/10 py-10 text-center">
          <p className="luxe-eyebrow text-[#B89352]">The Gifting Ritual</p>
          <p className="mx-auto mt-4 max-w-xl font-serif text-2xl leading-snug text-[#2C1E16] md:text-3xl">
            “Thoughtful gifting begins with a conversation about the occasion and the options available.”
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 80}>
              <div className="flex h-full flex-col gap-3 border-t border-[#2C1E16]/15 pt-5">
                <span className="font-serif text-sm tracking-[0.2em] text-[#B89352]">{step.n}</span>
                <h3 className="font-serif text-2xl leading-tight">{step.title}</h3>
                <p className="text-[12.5px] leading-relaxed text-[#6B584C]">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-[#F4EFE6]/60">
        <div className="mx-auto max-w-7xl px-5 py-14 md:px-10 md:py-20">
          <Reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="luxe-eyebrow text-[#B89352]">Occasions</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">For the moments that matter.</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/shop?category=gifting')}
              className="group inline-flex min-h-11 items-center gap-2 self-start text-[10px] uppercase tracking-[0.24em] text-[#2C1E16] md:self-auto cursor-pointer"
            >
              Shop gift coffrets
              <ArrowUpRight className="h-3.5 w-3.5 text-[#B89352]" />
            </button>
          </Reveal>

          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 md:gap-x-5 lg:grid-cols-4">
            {occasions.map((item, i) => (
              <Reveal key={item.title} delay={i * 55}>
                <button
                  type="button"
                  onClick={() => navigate('/contact?topic=custom_gifting')}
                  className="group block w-full text-left cursor-pointer"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#FAF7F2]">
                    <ImageWithFallback
                      src={item.image}
                      alt={`ERAMORA ${item.title.toLowerCase()} gifting`}
                      className="h-full w-full object-cover transition-transform duration-[1100ms] group-hover:scale-[1.05]"
                    />
                  </div>
                  <h3 className="mt-3 font-serif text-lg leading-tight">{item.title}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#6B584C]">{item.copy}</p>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 text-center md:px-8 md:py-24">
        <Reveal>
          <p className="luxe-eyebrow text-[#B89352]">Bespoke Commissions</p>
          <h2 className="mt-4 text-balance font-serif text-3xl leading-[1.1] md:text-5xl">
            Tell us the occasion. We’ll explore what’s possible.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[13px] leading-relaxed text-[#6B584C]">
            Ask the concierge about minimum quantities, samples, presentation, and availability. Details are confirmed
            for each enquiry.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/contact?topic=custom_gifting')}
              className="min-h-11 bg-[#2C1E16] px-8 py-3.5 text-[10px] uppercase tracking-[0.26em] text-[#FAF7F2] transition-colors hover:bg-[#3F2C21] cursor-pointer"
            >
              Speak to concierge
            </button>
            <button
              type="button"
              onClick={() => navigate('/about')}
              className="min-h-11 border border-[#2C1E16]/20 px-7 py-3.5 text-[10px] uppercase tracking-[0.22em] text-[#2C1E16] transition-colors hover:border-[#B89352] cursor-pointer"
            >
              Our philosophy
            </button>
          </div>
        </Reveal>
      </section>
    </div>
  );
};
