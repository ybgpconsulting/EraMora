import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { YBGP_CONFIG, buildYbgpProjectEnquiryUrl } from '../utils/ybgp';
import { WhatsAppIcon } from './WhatsAppIcon';

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
      aria-label={`${YBGP_CONFIG.bannerHeadline} Enquire with YBGP on WhatsApp about a project like ${YBGP_CONFIG.defaultProjectName}.`}
      className="group ml-auto mr-0 flex min-h-[76px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#062F22] px-4 py-3 text-white shadow-lg transition-colors hover:bg-[#083b2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241811] sm:px-4"
    >
      <span className="min-w-0">
        <span className="block text-[12px] font-semibold leading-snug">
          {YBGP_CONFIG.bannerHeadline}
        </span>
        <span className="mt-1 block text-[11px] leading-snug text-white/75">
          {YBGP_CONFIG.bannerSubline}
        </span>
        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#E4C77D]">
          Enquire on WhatsApp
          <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
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
