import React from 'react';
import { ArrowLeft, ArrowUpRight, Gift, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { buildCartWhatsAppUrl, formatINR } from '../utils/commerce';
import { SEO_PAGES } from '../utils/seo';

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

  const subtotal = enquiryItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const totalItemCount = enquiryItems.reduce((acc, item) => acc + item.quantity, 0);

  const directWhatsAppUrl = buildCartWhatsAppUrl({
    whatsappNumber: settings.whatsappNumber,
    brandName: settings.brandName,
    items: enquiryItems,
    giftWrapSelected,
    giftMessage,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <SeoHead {...SEO_PAGES.cart} />

      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#2C1E16]/12 pb-6 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#B89352] font-medium">Atelier Bag</p>
          <h1 className="font-serif text-3xl md:text-4xl text-[#2C1E16] mt-1">
            Your Shopping Bag {totalItemCount > 0 && <span className="text-xl font-sans text-[#6B584C]">({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})</span>}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#6B584C] hover:text-[#2C1E16] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Discovering</span>
        </button>
      </div>

      {enquiryItems.length === 0 ? (
        <div className="py-20 text-center bg-[#F4EFE6]/50 border border-[#2C1E16]/10 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#B89352] border border-[#2C1E16]/8">
            <ShoppingBag className="w-7 h-7" strokeWidth={1.3} />
          </div>
          <p className="font-serif text-2xl text-[#2C1E16]">Your shopping bag is empty</p>
          <p className="text-sm text-[#6B584C] max-w-md mx-auto leading-relaxed">
            Browse fragrance, candle and gifting concepts, then ask the concierge to confirm current details.
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="bg-[#2C1E16] text-[#FAF7F2] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#3F2C21] transition-all cursor-pointer shadow-sm"
          >
            Explore the Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-5">
            {enquiryItems.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex flex-col sm:flex-row gap-5 p-5 border border-[#2C1E16]/10 bg-[#FAF7F2] shadow-xs"
              >
                <ImageWithFallback
                  src={item.image}
                  alt={item.name}
                  className="w-full sm:w-28 aspect-[4/3] sm:aspect-square object-cover bg-[#F4EFE6] border border-[#2C1E16]/8 shrink-0"
                />
                <div className="flex-1 flex flex-col justify-between gap-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <a
                        href={`/product/${item.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/product/${item.slug}`);
                        }}
                        className="font-serif text-xl text-[#2C1E16] hover:text-[#B89352] font-medium"
                      >
                        {item.name}
                      </a>
                      <p className="text-xs text-[#6B584C] mt-0.5">{item.variantLabel}</p>
                      <p className="text-xs font-semibold text-[#2C1E16] mt-2 tabular-nums">
                        {formatINR(item.unitPrice)} each
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.variantId)}
                      aria-label={`Remove ${item.name}`}
                      className="min-h-11 min-w-11 flex items-center justify-center text-[#6B584C] hover:text-[#2C1E16] hover:bg-[#F4EFE6] rounded-full cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#2C1E16]/8 pt-3">
                    <div className="inline-flex items-center border border-[#2C1E16]/20 bg-[#FAF7F2]">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity - 1)}
                        aria-label={`Decrease ${item.name} quantity`}
                        className="h-10 w-10 flex items-center justify-center hover:bg-[#F4EFE6] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-9 text-center text-xs font-semibold tabular-nums text-[#2C1E16]">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                        aria-label={`Increase ${item.name} quantity`}
                        className="h-10 w-10 flex items-center justify-center hover:bg-[#F4EFE6] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#2C1E16] tabular-nums">
                        {formatINR(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Gift Presentation Request */}
            <div className="p-5 bg-[#F4EFE6]/70 border border-[#2C1E16]/10 space-y-3">
              <label className="flex items-start gap-3 text-xs text-[#2C1E16] cursor-pointer">
                <input
                  type="checkbox"
                  checked={giftWrapSelected}
                  onChange={(e) => setGiftWrapSelected(e.target.checked)}
                  className="mt-0.5 accent-[#2C1E16] h-4 w-4"
                />
                <div>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
                    <Gift className="w-4 h-4 text-[#B89352]" />
                    Request gift presentation
                  </span>
                  <p className="text-xs text-[#6B584C] mt-0.5 leading-relaxed">
                    This is a request only. Available options, any charges and message-card details will be confirmed by the concierge.
                  </p>
                </div>
              </label>

              {giftWrapSelected && (
                <textarea
                  rows={2}
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  maxLength={250}
                  aria-label="Gift card message"
                  placeholder="Add a gift-message request for the concierge..."
                  className="w-full bg-[#FAF7F2] border border-[#2C1E16]/15 px-3 py-2 text-xs text-[#2C1E16] placeholder-[#6B584C]/70 focus:outline-none focus:border-[#B89352]"
                />
              )}
            </div>
          </div>

          {/* Summary Column */}
          <aside className="lg:col-span-4">
            <div className="p-6 bg-[#F4EFE6]/70 border border-[#2C1E16]/12 space-y-5 sticky top-24 shadow-sm">
              <h2 className="font-serif text-2xl text-[#2C1E16]">Enquiry Summary</h2>

              <div className="space-y-2.5 text-xs text-[#6B584C] border-b border-[#2C1E16]/10 pb-4">
                <div className="flex justify-between items-baseline text-sm">
                  <span className="text-[#2C1E16] font-medium">Subtotal ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})</span>
                  <span className="font-semibold text-lg text-[#2C1E16] tabular-nums">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#B89352]" />
                    Delivery
                  </span>
                  <span className="font-semibold text-[#2C1E16]">To be confirmed</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-[#B89352]" />
                    Gift presentation
                  </span>
                  <span className="font-semibold text-[#2C1E16]">Request only</span>
                </div>
              </div>

              <div className="text-xs leading-relaxed text-[#6B584C] space-y-2">
                <p className="flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#B89352] shrink-0 mt-0.5" />
                  <span>A WhatsApp message is an enquiry only. Product availability, delivery, charges and any purchase terms must be confirmed by ERAMORA.</span>
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {settings.whatsappOrderingEnabled && (
                  <a
                    href={directWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex min-h-12 items-center justify-center gap-2 bg-[#2C1E16] text-[#FAF7F2] px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.16em] transition-all hover:bg-[#3F2C21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] shadow-md hover:shadow-lg"
                  >
                    <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                    <span>Enquire via WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/checkout')}
                  className="w-full inline-flex min-h-11 items-center justify-center gap-1.5 border border-[#2C1E16]/20 bg-[#FAF7F2] px-4 py-2.5 text-center text-xs font-medium uppercase tracking-[0.14em] text-[#2C1E16] transition-colors hover:bg-[#F4EFE6]"
                >
                  <span>Review Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <p className="text-center text-[10px] leading-relaxed text-[#6B584C] pt-1">
                  Private & secure: your cart remains locally on this device.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
