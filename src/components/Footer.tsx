import React from 'react';
import { Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { buildGeneralWhatsAppUrl } from '../utils/commerce';
import { BrandLogo } from './BrandLogo';
import { WhatsAppIcon } from './WhatsAppIcon';
import { YbgpFooterAttribution } from './YbgpBrandingCta';

const exploreLinks = [
  { label: 'Shop all', href: '/shop' },
  { label: 'Collections', href: '/collections' },
  { label: 'Gifting', href: '/gifting' },
  { label: 'Our story', href: '/about' },
];

const careLinks = [
  { label: 'FAQs', href: '/faq' },
  { label: 'Shipping', href: '/shipping-policy' },
  { label: 'Returns', href: '/returns-policy' },
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Grievance Redressal', href: '/grievance-redressal' },
];

const linkClassName =
  'inline-flex min-h-8 items-center text-[12px] text-[#FAF7F2]/65 transition-colors hover:text-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]';

const contactLinkClassName =
  'group flex min-h-14 items-center gap-3 rounded-xl border border-transparent px-2.5 text-[#FAF7F2]/72 transition-colors hover:border-[#C5A059]/25 hover:bg-[#FAF7F2]/[0.04] hover:text-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]';

export const Footer: React.FC = () => {
  const { path, navigate, settings } = useStore();
  const basePath = path.split('?')[0].replace(/\/+$/, '') || '/';
  const isProductRoute = basePath.startsWith('/product/');
  const isAdminRoute = basePath.startsWith('/admin');
  const phoneUrl = `tel:${settings.supportPhone.replace(/[^\d+]/g, '')}`;
  const whatsappUrl = buildGeneralWhatsAppUrl(
    settings.whatsappNumber,
    `Hello ${settings.brandName}, I would like fragrance recommendations or ordering assistance.`
  );

  if (isAdminRoute) return null;

  const renderLinks = (links: typeof exploreLinks) =>
    links.map((link) => (
      <a
        key={link.href}
        href={link.href}
        onClick={(event) => {
          event.preventDefault();
          navigate(link.href);
        }}
        className={linkClassName}
      >
        {link.label}
      </a>
    ));

  return (
    <footer
      className={`bg-[#241811] text-[#FAF7F2] ${
        isProductRoute
          ? 'pb-[calc(env(safe-area-inset-bottom)+176px)]'
          : 'pb-[calc(env(safe-area-inset-bottom)+100px)]'
      } md:pb-28`}
    >
      <div className="mx-auto max-w-7xl px-5 pt-9 md:px-8 md:pt-11 lg:px-10">
        <div className="grid grid-cols-2 gap-3 border-b border-[#FAF7F2]/10 pb-6 md:grid-cols-4 md:gap-4 md:pb-8">
          <div className="col-span-2 space-y-3 rounded-2xl border border-[#FAF7F2]/10 bg-[#FAF7F2]/[0.035] p-4 md:col-span-1 md:p-5">
            <BrandLogo variant="stacked" light className="items-start" />
            <p className="max-w-xs text-[12px] leading-relaxed text-[#FAF7F2]/60">
              Curated fragrances, candles and gifting for memorable moments.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Follow ERAMORA on Instagram ${settings.instagramHandle}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#FAF7F2]/15 text-[#FAF7F2]/75 transition-colors hover:border-[#C5A059] hover:text-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
              >
                <Instagram aria-hidden="true" className="h-4 w-4" />
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact ERAMORA on WhatsApp"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#FAF7F2]/15 text-[#25D366] transition-colors hover:border-[#25D366] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <nav
            aria-label="Explore ERAMORA"
            className="space-y-2 rounded-2xl border border-[#FAF7F2]/10 bg-[#FAF7F2]/[0.035] p-4 md:p-5"
          >
            <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#C5A059]">
              Explore
            </h2>
            <div className="flex flex-col">{renderLinks(exploreLinks)}</div>
          </nav>

          <nav
            aria-label="Customer care"
            className="space-y-2 rounded-2xl border border-[#FAF7F2]/10 bg-[#FAF7F2]/[0.035] p-4 md:p-5"
          >
            <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#C5A059]">
              Help
            </h2>
            <div className="flex flex-col">{renderLinks(careLinks)}</div>
          </nav>

          <div className="col-span-2 rounded-2xl border border-[#FAF7F2]/10 bg-[#FAF7F2]/[0.035] p-4 md:col-span-1 md:p-5">
            <div className="mb-2">
              <h2 className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#C5A059]">
                Contact
              </h2>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#FAF7F2]/45">
                Fragrance guidance and order support
              </p>
            </div>

            <a href={`mailto:${settings.supportEmail}`} className={contactLinkClassName}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059]">
                <Mail aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
              </span>
              <span className="min-w-0">
                <span className="block text-[9px] uppercase tracking-[0.16em] text-[#FAF7F2]/40">
                  Email
                </span>
                <span className="mt-0.5 block break-all text-[12px] font-medium">
                  {settings.supportEmail}
                </span>
              </span>
            </a>

            <a href={phoneUrl} className={contactLinkClassName}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059]">
                <Phone aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
              </span>
              <span>
                <span className="block text-[9px] uppercase tracking-[0.16em] text-[#FAF7F2]/40">
                  Call
                </span>
                <span className="mt-0.5 block text-[12px] font-medium">
                  {settings.supportPhone}
                </span>
              </span>
            </a>

            <div className="flex min-h-14 items-start gap-3 px-2.5 pt-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 text-[#C5A059]">
                <MapPin aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
              </span>
              <span className="min-w-0">
                <span className="block text-[9px] uppercase tracking-[0.16em] text-[#FAF7F2]/40">
                  Studio
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-[#FAF7F2]/72">
                  {settings.studioAddress}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4 xl:flex-row xl:items-stretch">
          <div className="flex min-h-[68px] flex-1 flex-col justify-center rounded-2xl border border-[#FAF7F2]/10 bg-[#FAF7F2]/[0.035] px-4 py-3 text-[9px] uppercase tracking-[0.16em] text-[#FAF7F2]/55 md:px-5">
            <p>© {new Date().getFullYear()} ERAMORA · All rights reserved</p>
            <p className="mt-1">Personal fragrance and gifting concierge · Noida, India</p>
          </div>
          <div className="w-full max-w-[26rem] xl:shrink-0">
            <YbgpFooterAttribution />
          </div>
        </div>
      </div>
    </footer>
  );
};
