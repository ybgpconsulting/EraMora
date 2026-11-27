import React from 'react';
import { ArrowLeft, Gift, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { buildCartWhatsAppUrl, formatINR } from '../utils/commerce';
import { SEO_PAGES } from '../utils/seo';

export const CheckoutPage: React.FC = () => {
  const { cart, products, settings, giftWrapSelected, giftMessage, navigate } = useStore();
  const enquiryItems = cart.filter(
    (item) => item.unitPrice > 0 && products.some((product) => product.id === item.productId && !product.isShowcaseDemo)
  );

  const subtotal = enquiryItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const totalItemCount = enquiryItems.reduce((acc, item) => acc + item.quantity, 0);

  const whatsappUrl = buildCartWhatsAppUrl({
    whatsappNumber: settings.whatsappNumber,
    brandName: settings.brandName,
    items: enquiryItems,
    giftWrapSelected,
    giftMessage,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
      <SeoHead {...SEO_PAGES.checkout} />

      <button
        type="button"
        onClick={() => navigate('/cart')}
        className="mb-6 inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#6B584C] hover:text-[#2C1E16] cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to your bag
      </button>

      <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] items-start">
        <section className="space-y-6">
          <div>
            <p className="luxe-eyebrow text-[#B89352]">Personal Concierge</p>
            <h1 className="mt-2 font-serif text-3xl md:text-4xl text-[#2C1E16]">Product & Delivery Enquiry</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#6B584C]">
              Your selected items open as a WhatsApp enquiry. No order or payment is placed on this website.
            </p>
          </div>

          {enquiryItems.length === 0 ? (
            <div className="space-y-4 border border-[#2C1E16]/10 bg-[#F4EFE6]/60 p-6">
              <p className="font-serif text-xl text-[#2C1E16]">Your bag is empty</p>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="min-h-11 bg-[#2C1E16] px-6 text-xs uppercase tracking-[0.14em] text-[#FAF7F2] cursor-pointer"
              >
                Explore the collection
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[#6B584C] font-medium">Selected Creations ({totalItemCount})</p>
                {enquiryItems.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-4 border border-[#2C1E16]/10 bg-[#FAF7F2] p-3.5 shadow-xs">
                    <ImageWithFallback src={item.image} alt={item.name} className="h-16 w-16 shrink-0 object-cover border border-[#2C1E16]/8" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-base text-[#2C1E16] font-medium">{item.name}</p>
                      <p className="text-xs text-[#6B584C]">{item.variantLabel} · Qty {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#2C1E16] tabular-nums">
                        {formatINR(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {giftWrapSelected && (
                <div className="p-4 bg-[#F4EFE6]/70 border border-[#2C1E16]/10 text-xs text-[#2C1E16] space-y-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-[#B89352]" />
                    Gift presentation requested
                  </span>
                  {giftMessage && (
                    <p className="text-[#6B584C] italic pl-5.5">“{giftMessage}”</p>
                  )}
                </div>
              )}

              {settings.whatsappOrderingEnabled ? (
                <div className="space-y-3 pt-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[#2C1E16] px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#FAF7F2] transition-all hover:bg-[#3F2C21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] shadow-md hover:shadow-lg"
                  >
                    <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                    <span>Send Enquiry to WhatsApp</span>
                  </a>
                  <p className="text-center text-[11px] leading-relaxed text-[#6B584C]">
                    Your message is an enquiry only. ERAMORA must confirm availability, delivery, charges and transaction terms before any purchase.
                  </p>
                </div>
              ) : (
                <p role="status" className="border border-[#2C1E16]/15 p-4 text-sm text-[#6B584C]">
                  WhatsApp ordering is temporarily unavailable.
                </p>
              )}
            </>
          )}
        </section>

        <aside className="space-y-5 border border-[#2C1E16]/12 bg-[#F4EFE6]/70 p-6 shadow-sm">
          <h2 className="font-serif text-2xl text-[#2C1E16]">Enquiry Summary</h2>

          <div className="space-y-2 text-xs border-b border-[#2C1E16]/10 pb-4">
            <div className="flex justify-between items-baseline text-sm">
              <span className="text-[#2C1E16] font-medium">Estimated Subtotal</span>
              <span className="font-semibold text-lg text-[#2C1E16] tabular-nums">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-[#6B584C]">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#B89352]" />
                Boutique Shipping
              </span>
              <span className="font-semibold text-[#2C1E16]">To be confirmed</span>
            </div>
            <div className="flex justify-between items-center text-xs text-[#6B584C]">
              <span className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-[#B89352]" />
                Atelier Gift Box
              </span>
              <span className="font-semibold text-[#2C1E16]">Request only</span>
            </div>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-[#6B584C]">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B89352] shrink-0 mt-0.5" />
              <p>Product details, availability and delivery arrangements are confirmed directly for each enquiry.</p>
            </div>
            <p>
              Payment methods and transaction terms will be provided by ERAMORA before a purchase is confirmed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
