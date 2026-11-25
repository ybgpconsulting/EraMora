import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { buildCartWhatsAppUrl } from '../utils/commerce';

export const CartPage: React.FC = () => {
  const {
    cart,
    settings,
    updateCartQuantity,
    removeFromCart,
    products,
    giftWrapSelected,
    setGiftWrapSelected,
    giftMessage,
    setGiftMessage,
    navigate,
  } = useStore();

  const enquiryItems = cart.filter(
    (item) => item.unitPrice > 0 && products.some((product) => product.id === item.productId && !product.isShowcaseDemo)
  );
  const directWhatsAppUrl = buildCartWhatsAppUrl({
    whatsappNumber: settings.whatsappNumber,
    brandName: settings.brandName,
    items: enquiryItems,
    giftWrapSelected,
    giftMessage,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <SeoHead
        title="Shopping Bag | ERAMORA"
        description="Review your ERAMORA selection and book directly with our WhatsApp concierge."
        canonicalPath="/cart"
        noIndex
      />

      <h1 className="font-serif text-4xl text-[#2C1E16] border-b border-[#2C1E16]/12 pb-6 mb-8">
        Your Shopping Bag
      </h1>

      {enquiryItems.length === 0 ? (
        <div className="py-16 text-center bg-[#F4EFE6]/50 border border-[#2C1E16]/10 space-y-4">
          <p className="font-serif text-2xl text-[#2C1E16]">Your shopping bag is empty</p>
          <p className="text-sm text-[#6B584C]">Discover signature candles, Eau de Parfum, and curated gift sets.</p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="bg-[#2C1E16] text-[#FAF7F2] px-7 py-3 text-xs uppercase tracking-widest cursor-pointer"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-5">
            {enquiryItems.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex flex-col sm:flex-row gap-4 p-4 border border-[#2C1E16]/10 bg-[#FAF7F2]"
              >
                <ImageWithFallback
                  src={item.image}
                  alt={item.name}
                  className="w-full sm:w-28 aspect-[4/3] object-cover bg-[#F4EFE6]"
                />
                <div className="flex-1 flex flex-col justify-between gap-3">
                  <div className="flex justify-between gap-4">
                    <div>
                      <a
                        href={`/product/${item.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/product/${item.slug}`);
                        }}
                        className="font-serif text-xl text-[#2C1E16] hover:text-[#B89352]"
                      >
                        {item.name}
                      </a>
                      <p className="text-xs text-[#6B584C]">{item.variantLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.variantId)}
                      aria-label={`Remove ${item.name}`}
                      className="p-1.5 text-[#6B584C] hover:text-[#2C1E16] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center border border-[#2C1E16]/20">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity - 1)}
                        aria-label={`Decrease ${item.name} quantity`}
                        className="w-8 h-8 flex items-center justify-center hover:bg-[#F4EFE6] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                        aria-label={`Increase ${item.name} quantity`}
                        className="w-8 h-8 flex items-center justify-center hover:bg-[#F4EFE6] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2">
              <div className="p-4 bg-[#F4EFE6]/65 border border-[#2C1E16]/10 space-y-2.5">
                <label className="flex items-start gap-2.5 text-xs text-[#2C1E16] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={giftWrapSelected}
                    onChange={(e) => setGiftWrapSelected(e.target.checked)}
                    className="mt-0.5 accent-[#2C1E16]"
                  />
                  <span>
                    <strong>Ask about gift presentation</strong>
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  aria-label="Optional gift message"
                  placeholder="Ask about gift presentation or leave a note for the concierge..."
                  className="w-full bg-[#FAF7F2] border border-[#2C1E16]/15 px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Summary Column */}
          <aside className="lg:col-span-4">
            <div className="p-6 bg-[#F4EFE6]/70 border border-[#2C1E16]/12 space-y-5">
              <h2 className="font-serif text-2xl text-[#2C1E16]">Enquiry Summary</h2>

              <div className="border-t border-[#2C1E16]/10 pt-4 text-xs leading-relaxed text-[#6B584C]">
                Product details, availability, final prices, taxes, and delivery charges are confirmed by the concierge.
                Sending a WhatsApp message is an enquiry only, not a confirmed purchase.
              </div>

              <div className="space-y-2.5 pt-2">
                {settings.whatsappOrderingEnabled && (
                  <a
                    href={directWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex min-h-11 items-center justify-center gap-2 border border-[#2C1E16]/20 bg-[#FAF7F2] px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.12em] text-[#2C1E16] transition-colors hover:bg-[#F4EFE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352]"
                  >
                    <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                    <span>Send enquiry on WhatsApp</span>
                  </a>
                )}
                {settings.whatsappOrderingEnabled && (
                  <p className="text-center text-[11px] leading-relaxed text-[#6B584C]">
                    Your bag stays on this device. Nothing is ordered or shared until you choose to send the WhatsApp enquiry.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
