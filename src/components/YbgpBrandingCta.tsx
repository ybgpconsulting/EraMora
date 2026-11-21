import React from 'react';
import { ArrowUpRight, Phone, Mail, Instagram, Globe } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { YBGP_CONFIG, buildYbgpProjectEnquiryUrl } from '../utils/ybgp';
import { WhatsAppIcon } from './WhatsAppIcon';

/**
 * Standard fixed YBGP Attribution Banner.
 * Appears fixed at the bottom of the viewport on all intended public pages.
 * Excluded from Admin Dashboard and Checkout per master instructions.
 */
export const YbgpAttributionBanner: React.FC = () => {
  const { path } = useStore();

  // Exclude from admin dashboard and checkout flow per master instruction rule 8
  if (path.startsWith('/admin') || path.startsWith('/checkout')) {
    return null;
  }

  const isPDP = path.startsWith('/product/');

  return (
    <aside
      aria-label="Website developer attribution"
      className={`fixed z-35 transition-all duration-300 left-1/2 -translate-x-1/2 w-[calc(100%-24px)] md:w-[min(calc(100%-32px),980px)] ${
        isPDP
          ? 'bottom-[calc(env(safe-area-inset-bottom)+138px)] md:bottom-[calc(env(safe-area-inset-bottom)+16px)]'
          : 'bottom-[calc(env(safe-area-inset-bottom)+76px)] md:bottom-[calc(env(safe-area-inset-bottom)+16px)]'
      }`}
    >
      <a
        href={YBGP_CONFIG.website}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Looking to grow your business? Designed and developed by YBGP. Visit ybgp.in (opens in new tab)"
        className="group flex items-center justify-between gap-3 sm:gap-4 rounded-[20px] bg-[#062F22] hover:bg-[#083829] px-4 py-3 md:px-6 md:py-3.5 text-white shadow-[0_16px_45px_-12px_rgba(0,0,0,0.45)] border border-emerald-900/50 backdrop-blur-md transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2]"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[13px] sm:text-[14px] md:text-[15px] font-bold tracking-tight text-white leading-tight">
            {YBGP_CONFIG.bannerHeadline}
          </p>
          <p className="mt-0.5 text-[11px] sm:text-[12px] md:text-[13px] font-normal text-white/80 leading-tight">
            {YBGP_CONFIG.bannerSubline}
          </p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="rounded-[14px] bg-white px-2.5 py-1.5 sm:px-3 sm:py-1.5 md:px-4 md:py-2 shadow-xs transition-transform duration-300 group-hover:scale-[1.03] flex items-center justify-center">
            <img
              src={YBGP_CONFIG.logoPath}
              alt="YBGP"
              className="h-5 sm:h-6 md:h-7 w-[84px] sm:w-[98px] md:w-[124px] object-contain"
              loading="eager"
              decoding="async"
            />
          </div>
          <span className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors group-hover:bg-white/20 group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </a>
    </aside>
  );
};

/**
 * YBGP Footer Attribution & Project Enquiry Card.
 * Clear distinction between demo brand (ERAMORA) and creator/consultant (YBGP).
 */
export const YbgpFooterAttribution: React.FC = () => {
  const enquiryUrl = buildYbgpProjectEnquiryUrl(YBGP_CONFIG.defaultProjectName);

  return (
    <a
      href={enquiryUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${YBGP_CONFIG.bannerHeadline} Contact YBGP about a project like ${YBGP_CONFIG.defaultProjectName}.`}
      className="group ml-auto mr-0 flex min-h-[68px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#062F22] px-4 py-3 text-white shadow-lg transition-colors hover:bg-[#083b2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241811] sm:px-4"
    >
      <span className="min-w-0">
        <span className="block text-[12px] font-semibold leading-snug">
          {YBGP_CONFIG.bannerHeadline}
        </span>
        <span className="mt-1 block text-[11px] leading-snug text-white/75">
          {YBGP_CONFIG.bannerSubline}
        </span>
      </span>
      <span className="flex h-10 w-20 shrink-0 items-center justify-center rounded-lg bg-white px-2.5 py-2">
        <img
          src={YBGP_CONFIG.logoPath}
          alt="YBGP"
          className="max-h-full w-full object-contain"
        />
      </span>
    </a>
  );
};

/**
 * YBGP Showcase Card for Contact Page.
 */
export const YbgpProjectInquiryCard: React.FC = () => {
  const enquiryUrl = buildYbgpProjectEnquiryUrl(YBGP_CONFIG.defaultProjectName);

  return (
    <section
      aria-label="Agency contact and project enquiry"
      className="mt-14 rounded-2xl border border-[#2C1E16]/12 bg-[#062F22] p-8 md:p-10 text-white shadow-xl"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white px-3.5 py-1.5 shadow-sm">
              <img
                src={YBGP_CONFIG.logoPath}
                alt="YBGP"
                className="h-6 w-auto object-contain"
              />
            </div>
            <span className="text-[10px] uppercase tracking-[0.24em] text-[#C5A059]">
              Designed & Engineered by YBGP
            </span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl text-white">
            Interested in a Project Like ERAMORA for Your Business?
          </h2>
          <p className="max-w-xl text-sm text-white/75 leading-relaxed">
            YBGP consults, designs, and builds production-grade commerce flagships, progressive web apps, and bespoke digital experiences for forward-looking brands.
          </p>
        </div>

        <a
          href={enquiryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-black transition-transform hover:-translate-y-0.5 hover:bg-[#20ba59] shadow-lg shrink-0"
        >
          <WhatsAppIcon className="h-4 w-4 text-black" />
          <span>Discuss a Similar Project on WhatsApp</span>
        </a>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-white/70">
        <div className="rounded-xl bg-white/5 p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-[#C5A059] font-medium">WhatsApp / Call</p>
          <a href={`tel:${YBGP_CONFIG.phoneTel}`} className="mt-1 block font-medium text-white hover:underline">
            {YBGP_CONFIG.phoneDisplay}
          </a>
        </div>

        <div className="rounded-xl bg-white/5 p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-[#C5A059] font-medium">Direct Email</p>
          <a href={`mailto:${YBGP_CONFIG.email}`} className="mt-1 block font-medium text-white hover:underline">
            {YBGP_CONFIG.email}
          </a>
        </div>

        <div className="rounded-xl bg-white/5 p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-[#C5A059] font-medium">Instagram</p>
          <a
            href={YBGP_CONFIG.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-medium text-white hover:underline"
          >
            {YBGP_CONFIG.instagramHandle}
          </a>
        </div>

        <div className="rounded-xl bg-white/5 p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-[#C5A059] font-medium">Official Website</p>
          <a
            href={YBGP_CONFIG.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block font-medium text-white hover:underline"
          >
            ybgp.in ↗
          </a>
        </div>
      </div>
    </section>
  );
};
