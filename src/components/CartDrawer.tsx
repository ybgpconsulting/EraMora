import React from 'react';
import { Gift, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ImageWithFallback } from './ImageWithFallback';
import { WhatsAppIcon } from './WhatsAppIcon';
import { calculatePricingBreakdown, formatINR } from '../utils/commerce';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    settings,
    appliedCoupon,
    giftWrapSelected,
    setGiftWrapSelected,
    giftMessage,
    setGiftMessage,
    navigate,
  } = useStore();

  if (!isCartOpen) return null;

  const breakdown = calculatePricingBreakdown(cart, appliedCoupon, settings, giftWrapSelected);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
      className="fixed inset-0 z-50 flex justify-end bg-[#2C1E16]/50 backdrop-blur-xs"
      onClick={() => setIsCartOpen(false)}
    >
      <div
        className="w-full max-w-md bg-[#FAF7F2] h-full flex flex-col border-l border-[#2C1E16]/15 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2C1E16]/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#2C1E16]" />
            <h2 className="font-serif text-xl text-[#2C1E16]">Your Shopping Bag</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close shopping bag"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#6B584C] hover:text-[#2C1E16] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp enquiry note */}
        {cart.length > 0 && (
          <div className="px-5 py-2.5 bg-[#F4EFE6] border-b border-[#2C1E16]/8 text-xs text-[#2C1E16]">
            Delivery availability and charges are confirmed during your WhatsApp enquiry.
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <p className="font-serif text-2xl text-[#2C1E16]">Your bag is currently empty</p>
              <p className="text-sm text-[#6B584C] max-w-xs mx-auto">
                Explore hand-poured scented candles, Eau de Parfum, and heirloom gift coffrets.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/shop');
                }}
                className="inline-flex items-center justify-center bg-[#2C1E16] text-[#FAF7F2] px-6 py-3 text-xs font-medium uppercase tracking-widest hover:bg-[#3F2C21] cursor-pointer"
              >
                Explore Collection
              </button>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-3.5 pb-4 border-b border-[#2C1E16]/10"
                >
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover bg-[#F4EFE6] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={`/product/${item.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setIsCartOpen(false);
                          navigate(`/product/${item.slug}`);
                        }}
                        className="font-serif text-base text-[#2C1E16] hover:text-[#B89352] truncate"
                      >
                        {item.name}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                        aria-label={`Remove ${item.name} from bag`}
                        className="p-1 text-[#6B584C] hover:text-[#2C1E16] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-[#6B584C]">{item.variantLabel}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="inline-flex items-center border border-[#2C1E16]/20">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="w-7 h-7 flex items-center justify-center text-[#2C1E16] hover:bg-[#F4EFE6] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-medium tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="w-7 h-7 flex items-center justify-center text-[#2C1E16] hover:bg-[#F4EFE6] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-medium tabular-nums text-[#2C1E16]">
                        {formatINR(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Gift Packaging */}
              <div className="p-3.5 bg-[#F4EFE6]/70 border border-[#2C1E16]/10 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={giftWrapSelected}
                    onChange={(e) => setGiftWrapSelected(e.target.checked)}
                    className="mt-0.5 accent-[#2C1E16]"
                  />
                  <span className="text-xs text-[#2C1E16] leading-relaxed">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Gift className="w-3.5 h-3.5 text-[#B89352]" />
                      Add Signature ERAMORA Gift Packaging (+{formatINR(settings.giftWrapFee)})
                    </span>
                    <span className="block text-[#6B584C]">Ivory keepsake wrap, champagne satin ribbon & message card.</span>
                  </span>
                </label>

                <input
                  type="text"
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  maxLength={200}
                  placeholder="Optional handwritten gift card message..."
                  aria-label="Gift card message"
                  className="w-full bg-[#FAF7F2] border border-[#2C1E16]/15 px-3 py-2 text-xs text-[#2C1E16] placeholder-[#6B584C]/70 focus:outline-none focus:border-[#B89352]"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer CTAs */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[#2C1E16]/12 bg-[#FAF7F2] space-y-3">
            <div className="space-y-1 text-xs text-[#6B584C]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums text-[#2C1E16] font-medium">{formatINR(breakdown.subtotal)}</span>
              </div>
              {breakdown.giftWrapFee > 0 && (
                <div className="flex justify-between">
                  <span>Signature Gift Packaging</span>
                  <span className="tabular-nums text-[#2C1E16]">{formatINR(breakdown.giftWrapFee)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="tabular-nums text-[#2C1E16]">To be confirmed</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#2C1E16]/10 text-sm font-semibold text-[#2C1E16]">
                <span>Total</span>
                <span className="tabular-nums">{formatINR(breakdown.totalAmount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#2C1E16] text-[#FAF7F2] py-3 text-xs font-medium uppercase tracking-widest hover:bg-[#3F2C21] transition-colors cursor-pointer"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Continue to WhatsApp checkout</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/cart');
                }}
                className="text-xs text-[#6B584C] hover:text-[#2C1E16] underline underline-offset-4 py-1 cursor-pointer"
              >
                View Full Bag
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
