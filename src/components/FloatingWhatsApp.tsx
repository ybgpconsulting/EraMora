import React from 'react';
import { useStore } from '../context/StoreContext';
import { WhatsAppIcon } from './WhatsAppIcon';
import { buildGeneralWhatsAppUrl } from '../utils/commerce';

export const FloatingWhatsApp: React.FC = () => {
  const { path, settings } = useStore();

  // Keep mobile clean since bottom nav has WhatsApp tab; hide in Admin, Checkout, and PDP (which has dedicated WhatsApp ordering box)
  if (
    !settings.whatsappOrderingEnabled ||
    path.startsWith('/admin') ||
    path.startsWith('/checkout') ||
    path.startsWith('/product/')
  ) {
    return null;
  }

  const waUrl = buildGeneralWhatsAppUrl(
    settings.whatsappNumber,
    `Hello ${settings.brandName}, I would like assistance choosing a fragrance or placing an order.`
  );

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Send an enquiry to ERAMORA on WhatsApp"
      className="hidden md:inline-flex fixed bottom-[calc(env(safe-area-inset-bottom)+88px)] right-6 z-30 items-center gap-2 bg-[#2C1E16] text-[#FAF7F2] px-4 py-3 text-xs font-medium tracking-wider uppercase border border-[#C5A059]/45 shadow-xl hover:bg-[#3F2C21] transition-transform hover:-translate-y-0.5"
    >
      <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
      <span>WhatsApp Concierge</span>
    </a>
  );
};
