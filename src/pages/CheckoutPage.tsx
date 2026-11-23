import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { buildCartWhatsAppUrl } from '../utils/commerce';

export const CheckoutPage: React.FC = () => {
  const { cart, products, settings, giftWrapSelected, giftMessage, navigate } = useStore();
  const enquiryItems = cart.filter(
    (item) => item.unitPrice > 0 && products.some((product) => product.id === item.productId && !product.isShowcaseDemo)
  );
  const whatsappUrl = buildCartWhatsAppUrl({
    whatsappNumber: settings.whatsappNumber,
    brandName: settings.brandName,
    items: enquiryItems,
    giftWrapSelected,
    giftMessage,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
      <SeoHead
        title="WhatsApp Enquiry | ERAMORA"
        description="Review your ERAMORA selection and send a non-binding enquiry to our WhatsApp concierge."
        canonicalPath="/checkout"
        noIndex
      />

      <button
        type="button"
        onClick={() => navigate('/cart')}
        className="mb-6 inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#6B584C] hover:text-[#2C1E16]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to your bag
      </button>

      <div className="grid gap-8 md:grid-cols-[1fr_0.8fr]">
        <section className="space-y-5">
          <div>
            <p className="luxe-eyebrow text-[#B89352]">Personal Concierge</p>
            <h1 className="mt-2 font-serif text-4xl text-[#2C1E16]">Send an Enquiry</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#6B584C]">
              No account or customer details are collected on this website. Your selection opens in WhatsApp for
              discussion with our concierge. Sending a message does not place or confirm a purchase.
            </p>
          </div>

          {enquiryItems.length === 0 ? (
            <div className="space-y-4 border border-[#2C1E16]/10 bg-[#F4EFE6]/60 p-6">
              <p className="font-serif text-xl text-[#2C1E16]">Your bag is empty</p>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="min-h-11 bg-[#2C1E16] px-5 text-xs uppercase tracking-[0.14em] text-[#FAF7F2]"
              >
                Explore the collection
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {enquiryItems.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 border border-[#2C1E16]/10 bg-[#FAF7F2] p-3">
                    <ImageWithFallback src={item.image} alt={item.name} className="h-16 w-16 shrink-0 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-base text-[#2C1E16]">{item.name}</p>
                      <p className="text-xs text-[#6B584C]">{item.variantLabel} · Qty {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {settings.whatsappOrderingEnabled ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[#2C1E16] px-4 text-xs font-medium uppercase tracking-[0.14em] text-[#FAF7F2] transition-colors hover:bg-[#3F2C21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352]"
                >
                  <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                  Send enquiry on WhatsApp
                </a>
              ) : (
                <p role="status" className="border border-[#2C1E16]/15 p-4 text-sm text-[#6B584C]">
                  WhatsApp ordering is temporarily unavailable.
                </p>
              )}
            </>
          )}
        </section>

        <aside className="h-fit space-y-3 border border-[#2C1E16]/12 bg-[#F4EFE6]/70 p-6">
          <h2 className="font-serif text-2xl text-[#2C1E16]">Before you continue</h2>
          <p className="text-sm leading-relaxed text-[#6B584C]">
            The concierge will confirm product details, availability, final prices, applicable taxes, and delivery
            charges. No payment is taken and no purchase is confirmed on this page.
          </p>
        </aside>
      </div>
    </div>
  );
};
