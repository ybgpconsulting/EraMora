import React from 'react';
import { Heart, House, ShoppingBag, Store } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { buildGeneralWhatsAppUrl } from '../utils/commerce';
import { WhatsAppIcon } from './WhatsAppIcon';

export const MobileBottomNav: React.FC = () => {
  const { path, navigate, wishlist, cartCount, setIsCartOpen, settings } = useStore();

  // Admin dashboard has its own tab bar
  if (path.startsWith('/admin')) return null;

  const base = path.split('?')[0].replace(/\/+$/, '') || '/';

  const waUrl = buildGeneralWhatsAppUrl(
    settings.whatsappNumber,
    `Hello ${settings.brandName}, I would like to place an order or ask a question.`
  );

  const items = [
    { key: 'home', label: 'Home', icon: House, active: base === '/', onPress: () => navigate('/') },
    {
      key: 'shop',
      label: 'Shop',
      icon: Store,
      active: base === '/collections' || base === '/shop' || base.startsWith('/product'),
      onPress: () => navigate('/shop'),
    },
    {
      key: 'wishlist',
      label: 'Saved',
      icon: Heart,
      active: base === '/wishlist',
      count: wishlist.length,
      onPress: () => navigate('/wishlist'),
    },
    {
      key: 'bag',
      label: 'Bag',
      icon: ShoppingBag,
      active: false,
      count: cartCount,
      onPress: () => setIsCartOpen(true),
    },
    { key: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon, active: false, href: waUrl },
  ];

  return (
    <nav
      aria-label="Mobile app navigation"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] md:hidden"
    >
      <div className="mx-auto max-w-md overflow-hidden rounded-[22px] border border-[#2C1E16]/10 bg-[#FAF7F2]/95 shadow-[0_20px_45px_-20px_rgba(44,30,22,0.5)] backdrop-blur-2xl">
        <div className="grid h-[62px] grid-cols-5 items-center">
          {items.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                <span className="relative">
                  <Icon
                    className={`h-[19px] w-[19px] transition-colors ${
                      item.key === 'whatsapp'
                        ? 'text-[#25D366]'
                        : item.active
                          ? 'text-[#B89352]'
                          : 'text-[#6B584C]'
                    }`}
                    strokeWidth={item.active ? 1.9 : 1.5}
                  />
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#2C1E16] px-1 text-[8px] font-medium tabular-nums text-[#FAF7F2]">
                      {item.count}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[9px] uppercase tracking-[0.1em] transition-colors ${
                    item.active ? 'font-semibold text-[#2C1E16]' : 'font-medium text-[#6B584C]'
                  }`}
                >
                  {item.label}
                </span>
                <span
                  className={`absolute bottom-1.5 h-1 w-1 rounded-full transition-opacity ${
                    item.active ? 'bg-[#B89352] opacity-100' : 'opacity-0'
                  }`}
                />
              </>
            );

            return item.href ? (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact ERAMORA on WhatsApp"
                className="relative flex h-full flex-col items-center justify-center gap-1"
              >
                {content}
              </a>
            ) : (
              <button
                key={item.key}
                type="button"
                onClick={item.onPress}
                aria-current={item.active ? 'page' : undefined}
                className="relative flex h-full flex-col items-center justify-center gap-1 cursor-pointer"
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
