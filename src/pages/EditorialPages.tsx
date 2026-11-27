import React from 'react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { YbgpProjectInquiryCard } from '../components/YbgpBrandingCta';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { GRIEVANCE_CONTACT, LEGAL_POLICIES, type LegalPolicyKind } from '../content/policies';
import { ERAMORA_FAQS } from '../content/faqs';
import { buildGeneralWhatsAppUrl } from '../utils/commerce';
import { createFaqStructuredData, SEO_PAGES } from '../utils/seo';

export const AboutPage: React.FC = () => {
  const { navigate } = useStore();
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-16 space-y-14">
      <SeoHead
        {...SEO_PAGES.about}
      />

      <header className="text-center max-w-2xl mx-auto space-y-4">
        <p className="text-xs uppercase tracking-[0.2em] text-[#B89352]">The Brand Philosophy</p>
        <h1 className="font-serif text-4xl md:text-5xl text-[#2C1E16] text-balance">Where Fragrance Meets Emotion.</h1>
        <p className="text-base text-[#6B584C] leading-relaxed">
          ERAMORA explores fragrance, candle and gifting concepts around a simple belief: scent is one way a moment
          stays with us. Catalogue concepts are not offers for sale; product details require confirmation.
        </p>
      </header>

      <div className="aspect-[16/9] bg-[#F4EFE6] border border-[#2C1E16]/10 overflow-hidden">
        <ImageWithFallback
          src="/src/assets/images/hero_eramora_atelier_1794827348612.jpg"
          alt="ERAMORA fragrance and candle composition on travertine stone"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-sm text-[#6B584C] leading-relaxed">
        <div className="space-y-3">
          <h2 className="font-serif text-2xl text-[#2C1E16]">Inspiration & Memory</h2>
          <p>
            The catalogue explores how fragrance and atmosphere can connect with memory. Individual compositions,
            notes and product details remain concepts until reviewed and confirmed.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="font-serif text-2xl text-[#2C1E16]">Material Honesty & Tactile Form</h2>
          <p>
            The catalogue explores vessels, forms and presentation ideas. Materials, dimensions, contents and product
            specifications are confirmed by ERAMORA before any purchase is offered.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="font-serif text-2xl text-[#2C1E16]">The Gifting Ritual</h2>
          <p>
            Gifting is one of ERAMORA's catalogue themes. Ask the concierge about possible products and presentation
            options for milestones or other occasions; availability and details are confirmed directly.
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="font-serif text-2xl text-[#2C1E16]">Approachable Luxury</h2>
          <p>
            Browse the catalogue and contact the concierge with questions. This website does not accept or confirm
            orders or payments; availability, delivery, charges and transaction terms require confirmation.
          </p>
        </div>
      </div>

      <div className="text-center pt-4">
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="bg-[#2C1E16] text-[#FAF7F2] px-8 py-3.5 text-xs uppercase tracking-[0.16em] cursor-pointer"
        >
          Explore the Collection
        </button>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const { path, settings } = useStore();
  const phoneUrl = `tel:${settings.supportPhone.replace(/[^\d+]/g, '')}`;
  const isCustomGift = path.includes('custom_gifting');

  const waUrl = buildGeneralWhatsAppUrl(
    settings.whatsappNumber,
    `Hello ${settings.brandName}, I have an enquiry regarding ${isCustomGift ? 'custom gifting' : 'your collection'}.`
  );

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-16">
      <SeoHead
        {...SEO_PAGES.contact}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[#B89352]">Concierge Desk</p>
          <h1 className="font-serif text-4xl text-[#2C1E16]">Write to ERAMORA</h1>
          <p className="text-sm text-[#6B584C] leading-relaxed">
            For bespoke wedding favours, corporate gifting hampers, or fragrance guidance, reach us directly here or
            connect on WhatsApp.
          </p>

          <div className="space-y-2 text-sm text-[#2C1E16] pt-2 border-t border-[#2C1E16]/10">
            <p>
              <span className="text-[#6B584C]">Email:</span>{' '}
              <a href={`mailto:${settings.supportEmail}`} className="hover:underline">{settings.supportEmail}</a>
            </p>
            <p>
              <span className="text-[#6B584C]">Phone:</span>{' '}
              <a href={phoneUrl} className="hover:underline">{settings.supportPhone}</a>
            </p>
            <p>
              <span className="text-[#6B584C]">Instagram:</span>{' '}
              <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {settings.instagramHandle}
              </a>
            </p>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#2C1E16] text-[#FAF7F2] px-6 py-3 text-xs uppercase tracking-[0.14em]"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>

        <div className="lg:col-span-7 flex flex-col items-start justify-center gap-5 border border-[#2C1E16]/12 bg-[#F4EFE6]/70 p-6 md:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#B89352]">A direct conversation</p>
            <h2 className="mt-2 font-serif text-2xl text-[#2C1E16]">
              {isCustomGift ? 'Plan a considered gift' : 'Speak with our concierge'}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#6B584C]">
              Share your questions or gifting preferences directly in WhatsApp. This website does not save enquiry or customer details.
            </p>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-2 bg-[#2C1E16] px-6 text-xs uppercase tracking-[0.14em] text-[#FAF7F2]"
          >
            <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
            Continue in WhatsApp
          </a>
        </div>
      </div>

      <YbgpProjectInquiryCard />
    </div>
  );
};

export const FaqPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16">
      <SeoHead
        {...SEO_PAGES.faq}
        structuredData={createFaqStructuredData(ERAMORA_FAQS)}
      />
      <p className="text-xs uppercase tracking-[0.18em] text-[#6B584C]">Client Assistance</p>
      <h1 className="font-serif text-4xl text-[#2C1E16] mt-1 mb-8 border-b border-[#2C1E16]/12 pb-6">
        Frequently Asked Questions
      </h1>
      <div className="divide-y divide-[#2C1E16]/12">
        {ERAMORA_FAQS.map((item, i) => (
          <details key={i} open={i === 0} className="py-5 group">
            <summary className="font-serif text-xl text-[#2C1E16] cursor-pointer list-none flex justify-between items-center">
              <span>{item.question}</span>
              <span className="text-sm text-[#B89352]">+</span>
            </summary>
            <p className="mt-3 text-sm text-[#6B584C] leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
};

export const PolicyPage: React.FC<{ kind: LegalPolicyKind }> = ({ kind }) => {
  const titles = {
    shipping: 'Shipping Policy',
    returns: 'Returns & Refund Policy',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
  };
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16 space-y-6">
      <SeoHead
        {...({
          shipping: SEO_PAGES.shippingPolicy,
          returns: SEO_PAGES.returnsPolicy,
          privacy: SEO_PAGES.privacyPolicy,
          terms: SEO_PAGES.terms,
        } as const)[kind]}
      />
      <p className="text-xs uppercase tracking-[0.18em] text-[#6B584C]">ERAMORA Store Policies</p>
      <h1 className="font-serif text-4xl text-[#2C1E16] border-b border-[#2C1E16]/12 pb-6">{titles[kind]}</h1>
      <div className="text-sm text-[#6B584C] leading-relaxed whitespace-pre-line">
        {LEGAL_POLICIES[kind]}
      </div>
    </div>
  );
};

export const GrievancePage: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 md:px-8 py-12 md:py-16 space-y-6">
    <SeoHead {...SEO_PAGES.grievance} />
    <p className="text-xs uppercase tracking-[0.18em] text-[#6B584C]">Customer Assistance</p>
    <h1 className="font-serif text-4xl text-[#2C1E16] border-b border-[#2C1E16]/12 pb-6">
      Grievance Redressal
    </h1>
    <p className="text-sm text-[#6B584C] leading-relaxed">
      For a grievance related to ERAMORA or a confirmed transaction, contact the grievance officer using the details
      below.
    </p>
    <div role="status" className="space-y-2 border border-[#8A3D2D]/30 bg-[#F4EFE6] p-4 text-sm text-[#6B584C]">
      <p className="font-semibold text-[#8A3D2D]">Owner verification pending</p>
      <p>
        The details below have not been independently verified. Before relying on or publishing them as confirmed legal
        contact information, the owner must approve:
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>Operator name and legal identity</li>
        <li>Business address</li>
        <li>Grievance officer name and designation</li>
        <li>Grievance email address</li>
        <li>Grievance phone number and response process</li>
      </ul>
    </div>
    <dl className="divide-y divide-[#2C1E16]/10 border-y border-[#2C1E16]/10 text-sm">
      <div className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]">
        <dt className="text-[#6B584C]">Operator</dt>
        <dd className="text-[#2C1E16]">{GRIEVANCE_CONTACT.operatorName}</dd>
      </div>
      <div className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]">
        <dt className="text-[#6B584C]">Business address</dt>
        <dd className="text-[#2C1E16]">{GRIEVANCE_CONTACT.address}</dd>
      </div>
      <div className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]">
        <dt className="text-[#6B584C]">Grievance officer</dt>
        <dd className="text-[#2C1E16]">
          {GRIEVANCE_CONTACT.officerName}, {GRIEVANCE_CONTACT.officerDesignation}
        </dd>
      </div>
      <div className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]">
        <dt className="text-[#6B584C]">Email</dt>
        <dd>
          <a className="text-[#2C1E16] underline underline-offset-4" href={`mailto:${GRIEVANCE_CONTACT.email}`}>
            {GRIEVANCE_CONTACT.email}
          </a>
        </dd>
      </div>
      <div className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]">
        <dt className="text-[#6B584C]">Phone</dt>
        <dd>
          <a className="text-[#2C1E16] underline underline-offset-4" href={`tel:${GRIEVANCE_CONTACT.phone}`}>
            {GRIEVANCE_CONTACT.phone}
          </a>
        </dd>
      </div>
    </dl>
  </div>
);
