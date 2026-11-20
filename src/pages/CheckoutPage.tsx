import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ImageWithFallback } from '../components/ImageWithFallback';
import {
  buildCartWhatsAppUrl,
  calculatePricingBreakdown,
  formatINR,
} from '../utils/commerce';

export const CheckoutPage: React.FC = () => {
  const { cart, settings, appliedCoupon, giftWrapSelected, giftMessage, navigate } = useStore();
  const breakdown = calculatePricingBreakdown(cart, appliedCoupon, settings, giftWrapSelected);
  const whatsappUrl = buildCartWhatsAppUrl({
    whatsappNumber: settings.whatsappNumber,
    brandName: settings.brandName,
    items: cart,
    subtotal: breakdown.subtotal,
    shippingFee: breakdown.shippingFee,
    discountAmount: breakdown.discountAmount,
    couponCode: appliedCoupon?.code,
    giftWrapFee: breakdown.giftWrapFee,
    giftMessage,
    totalAmount: breakdown.totalAmount,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14">
      <SeoHead
        title="Order on WhatsApp | ERAMORA"
        description="Review your ERAMORA bag and send your order enquiry to our WhatsApp concierge."
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
            <p className="luxe-eyebrow text-[#B89352]">Personal Order Concierge</p>
            <h1 className="mt-2 font-serif text-4xl text-[#2C1E16]">Order on WhatsApp</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#6B584C]">
              No account or customer details are collected on this website. Your itemized bag opens in WhatsApp;
              share delivery details directly with our concierge only if you choose.
            </p>
          </div>

          {cart.length === 0 ? (
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
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 border border-[#2C1E16]/10 bg-[#FAF7F2] p-3">
                    <ImageWithFallback src={item.image} alt={item.name} className="h-16 w-16 shrink-0 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-base text-[#2C1E16]">{item.name}</p>
                      <p className="text-xs text-[#6B584C]">{item.variantLabel} · Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm tabular-nums text-[#2C1E16]">{formatINR(item.unitPrice * item.quantity)}</p>
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
                  Send bag to WhatsApp · {formatINR(breakdown.totalAmount)}
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
          <h2 className="font-serif text-2xl text-[#2C1E16]">Order estimate</h2>
          <div className="flex justify-between text-sm text-[#6B584C]">
            <span>Subtotal</span><span>{formatINR(breakdown.subtotal)}</span>
          </div>
          {breakdown.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-[#6B584C]">
              <span>Discount</span><span>-{formatINR(breakdown.discountAmount)}</span>
            </div>
          )}
          {breakdown.giftWrapFee > 0 && (
            <div className="flex justify-between text-sm text-[#6B584C]">
              <span>Gift packaging</span><span>{formatINR(breakdown.giftWrapFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-[#6B584C]">
            <span>Delivery</span>
            <span>To be confirmed</span>
          </div>
          <div className="flex justify-between border-t border-[#2C1E16]/12 pt-3 font-semibold text-[#2C1E16]">
            <span>Total estimate</span><span>{formatINR(breakdown.totalAmount)}</span>
          </div>
          <p className="border-t border-[#2C1E16]/10 pt-3 text-xs leading-relaxed text-[#6B584C]">
            This is an estimate, not a confirmed order. The concierge confirms availability, delivery, and payment over WhatsApp.
          </p>
        </aside>
      </div>
    </div>
  );
};
