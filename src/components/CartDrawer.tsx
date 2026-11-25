import React from 'react';
import { ArrowUpRight, Gift, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ImageWithFallback } from './ImageWithFallback';
import { WhatsAppIcon } from './WhatsAppIcon';
import { useModalFocus } from '../hooks/useModalFocus';
import { buildCartWhatsAppUrl, formatINR } from '../utils/commerce';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    products,
    settings,
    giftWrapSelected,
    setGiftWrapSelected,
    giftMessage,
    setGiftMessage,
    navigate,
  } = useStore();
  const dialogRef = useModalFocus<HTMLDivElement>(isCartOpen, () => setIsCartOpen(false));

  if (!isCartOpen) return null;

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
      id="cart-drawer"
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex justify-end bg-[#2C1E16]/60 backdrop-blur-sm transition-opacity duration-300"
      onClick={() => setIsCartOpen(false)}
    >
      <div
        className="w-full max-w-md bg-[#FAF7F2] h-full flex flex-col border-l border-[#2C1E16]/15 shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2C1E16]/10 flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-4 h-4 text-[#B89352]" strokeWidth={1.7} />
            <h2 className="font-serif text-xl text-[#2C1E16]">
              Your Bag {totalItemCount > 0 && <span className="text-sm font-sans text-[#6B584C]">({totalItemCount})</span>}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close shopping bag"
            className="h-11 w-11 flex items-center justify-center text-[#6B584C] hover:text-[#2C1E16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer rounded-full hover:bg-[#F4EFE6]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Complimentary Delivery Banner */}
        <div className="px-5 py-2.5 bg-[#F4EFE6] border-b border-[#2C1E16]/8 flex items-center gap-2 text-xs text-[#2C1E16]">
          <Truck className="w-3.5 h-3.5 text-[#B89352] shrink-0" strokeWidth={1.5} />
          <span>Complimentary boutique delivery across India on all orders.</span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {enquiryItems.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#F4EFE6] flex items-center justify-center text-[#B89352]">
                <ShoppingBag className="w-7 h-7" strokeWidth={1.3} />
              </div>
              <p className="font-serif text-2xl text-[#2C1E16]">Your bag is currently empty</p>
              <p className="text-sm text-[#6B584C] max-w-xs mx-auto leading-relaxed">
                Explore hand-poured botanical candles, artisanal Eau de Parfum, and curated gift coffrets.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/shop');
                }}
                className="inline-flex items-center justify-center bg-[#2C1E16] text-[#FAF7F2] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-[#3F2C21] transition-all cursor-pointer shadow-sm"
              >
                Explore Collection
              </button>
            </div>
          ) : (
            <>
              {enquiryItems.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex gap-3.5 pb-4 border-b border-[#2C1E16]/10"
                >
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover bg-[#F4EFE6] shrink-0 border border-[#2C1E16]/10"
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
                        className="font-serif text-base text-[#2C1E16] hover:text-[#B89352] truncate font-medium"
                      >
                        {item.name}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId, item.variantId)}
                        aria-label={`Remove ${item.name} from bag`}
                        className="h-9 w-9 -mr-1 flex shrink-0 items-center justify-center text-[#6B584C] hover:text-[#2C1E16] hover:bg-[#F4EFE6] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-[#6B584C]">{item.variantLabel}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="inline-flex items-center border border-[#2C1E16]/20 bg-[#FAF7F2]">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="h-8 w-8 flex items-center justify-center text-[#2C1E16] hover:bg-[#F4EFE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold tabular-nums text-[#2C1E16]">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.productId, item.variantId, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="h-8 w-8 flex items-center justify-center text-[#2C1E16] hover:bg-[#F4EFE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-[#2C1E16]">
                        {formatINR(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Gift Presentation Option */}
              <div className="p-3.5 bg-[#F4EFE6]/70 border border-[#2C1E16]/10 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={giftWrapSelected}
                    onChange={(e) => setGiftWrapSelected(e.target.checked)}
                    className="mt-0.5 accent-[#2C1E16]"
                  />
                  <span className="text-xs text-[#2C1E16] leading-relaxed">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#2C1E16]">
                      <Gift className="w-3.5 h-3.5 text-[#B89352]" />
                      Bespoke Gift Presentation
                    </span>
                    <span className="block text-[#6B584C] mt-0.5">
                      Complimentary warm ivory linen box, champagne silk ribbon, and handwritten card.
                    </span>
                  </span>
                </label>

                {giftWrapSelected && (
                  <input
                    type="text"
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    maxLength={200}
                    placeholder="Enter your handwritten gift message..."
                    aria-label="Gift card message"
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/15 px-3 py-2 text-xs text-[#2C1E16] placeholder-[#6B584C]/70 focus:outline-none focus:border-[#B89352]"
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Summary & CTAs */}
        {enquiryItems.length > 0 && (
          <div className="p-5 border-t border-[#2C1E16]/12 bg-[#FAF7F2] space-y-3.5 shadow-lg">
            <div className="space-y-1.5 text-xs text-[#6B584C]">
              <div className="flex justify-between items-baseline text-sm">
                <span className="font-serif text-[#2C1E16] text-base">Estimated Total</span>
                <span className="font-semibold text-lg text-[#2C1E16] tabular-nums">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Shipping</span>
                <span className="text-[#2E5A36] font-medium">Complimentary across India</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Packaging</span>
                <span className="text-[#2E5A36] font-medium">Signature Atelier Box Included</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {settings.whatsappOrderingEnabled && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#2C1E16] text-[#FAF7F2] py-3.5 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-[#3F2C21] transition-all cursor-pointer shadow-md"
                >
                  <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
                  <span>Order via WhatsApp Concierge</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 border border-[#2C1E16]/20 bg-[#FAF7F2] text-[#2C1E16] py-2.5 text-xs font-medium uppercase tracking-[0.14em] hover:bg-[#F4EFE6] transition-colors cursor-pointer"
              >
                <span>Review Order Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-center text-[10px] text-[#6B584C] leading-relaxed">
              Every creation is hand-checked and packed at our atelier prior to dispatch.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
