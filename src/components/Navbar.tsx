import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Heart, Instagram, Menu, Phone, Search, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { BrandLogo } from './BrandLogo';
import { ImageWithFallback } from './ImageWithFallback';
import { WhatsAppIcon } from './WhatsAppIcon';
import { buildGeneralWhatsAppUrl, formatINR } from '../utils/commerce';
import { getCurrentStoreProducts, getProductImage } from '../utils/catalogue';
import { useModalFocus } from '../hooks/useModalFocus';

export const Navbar: React.FC = () => {
  const {
    path,
    navigate,
    banners,
    categories,
    products,
    cartCount,
    wishlist,
    settings,
    setIsCartOpen,
    isSearchOpen,
    setIsSearchOpen,
  } = useStore();

  const [bannerVisible, setBannerVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuDialogRef = useModalFocus<HTMLDivElement>(menuOpen, () => setMenuOpen(false));
  const searchDialogRef = useModalFocus<HTMLDivElement>(isSearchOpen, () => setIsSearchOpen(false));
  const storefrontProducts = useMemo(
    () => getCurrentStoreProducts(products, categories),
    [categories, products]
  );

  const isAdmin = path.startsWith('/admin');
  const basePath = path.split('?')[0].replace(/\/+$/, '') || '/';

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return storefrontProducts.slice(0, 4);
    return storefrontProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [searchQuery, storefrontProducts]);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Candles', href: '/shop?category=scented-candles' },
    { label: 'Kids’ DIY Kits', href: '/shop?category=diy-colouring-kits' },
    { label: 'Collections', href: '/collections' },
    { label: 'About', href: '/about' },
  ];

  const menuLinks = [
    { label: 'Home', href: '/' },
    { label: 'Scented Candles', href: '/shop?category=scented-candles' },
    { label: 'Kids’ DIY Colouring Kits', href: '/shop?category=diy-colouring-kits' },
    { label: 'All Collections', href: '/collections' },
    { label: 'Our Story', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    setIsSearchOpen(false);
    navigate(href);
  };

  const isActive = (href: string) => {
    if (href.includes('?')) {
      return path === href;
    }
    if (href === '/shop') return basePath === '/shop' || basePath.startsWith('/product');
    return basePath === href;
  };

  const waUrl = buildGeneralWhatsAppUrl(
    settings.whatsappNumber,
    `Hello ${settings.brandName}, I would like recommendations or availability information for scented candles and kids' DIY colouring kits.`
  );
  const phoneUrl = `tel:${settings.supportPhone.replace(/[^\d+]/g, '')}`;

  return (
    <>
      {bannerVisible && banners.announcementText && !isAdmin && basePath !== '/' && (
        <div
          role="region"
          aria-label="Announcement"
          className="relative flex min-h-11 items-center overflow-hidden bg-[#241811] px-12 text-[#FAF7F2]/70"
        >
          <p className="mx-auto max-w-full truncate text-center text-[9px] uppercase tracking-[0.2em]">
            {banners.announcementText}
          </p>
          <button
            type="button"
            onClick={() => setBannerVisible(false)}
            aria-label="Dismiss announcement"
            className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-[#241811] text-[#FAF7F2]/70 transition-colors hover:text-[#FAF7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-[#2C1E16]/10 bg-[#FAF7F2]/95 shadow-[0_8px_30px_-24px_rgba(44,30,22,0.45)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 md:h-[72px] md:px-8 xl:px-10">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-primary-navigation"
              className="-ml-2 flex h-11 w-11 items-center justify-center text-[#2C1E16] xl:hidden cursor-pointer"
            >
              <Menu className="h-5 w-5" strokeWidth={1.4} />
            </button>
            <a href="/" onClick={(e) => handleNavClick(e, '/')} aria-label="ERAMORA home" className="shrink-0">
              <BrandLogo />
            </a>
          </div>

          <nav aria-label="Primary Navigation" className="hidden items-center justify-center gap-6 xl:flex 2xl:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`group relative whitespace-nowrap pb-1 text-[9px] uppercase tracking-[0.22em] transition-colors 2xl:text-[10px] ${
                  isActive(link.href) ? 'text-[#2C1E16]' : 'text-[#6B584C] hover:text-[#2C1E16]'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352]`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-px bg-[#B89352] transition-all duration-500 ${
                    isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 md:gap-1">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search ERAMORA catalogue"
              aria-controls="catalog-search-dialog"
              className="flex h-11 min-w-11 items-center justify-center text-[#2C1E16] transition-colors hover:text-[#765A2E] cursor-pointer"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>

            <a
              href="/wishlist"
              onClick={(e) => handleNavClick(e, '/wishlist')}
              aria-label={`Wishlist (${wishlist.length} saved)`}
              className="relative hidden h-11 min-w-11 items-center justify-center text-[#2C1E16] transition-colors hover:text-[#765A2E] md:flex"
            >
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {wishlist.length > 0 && (
                <span className="absolute right-1 top-2 h-1.5 w-1.5 rounded-full bg-[#B89352]" />
              )}
            </a>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Book or enquire on WhatsApp"
              className="flex h-11 min-w-11 items-center justify-center text-[#2C1E16] transition-colors hover:text-[#25D366]"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] text-[#25D366]" />
            </a>

            <a
              href={phoneUrl}
              aria-label={`Call ERAMORA at ${settings.supportPhone}`}
              className="hidden h-11 items-center justify-center gap-2 text-[#2C1E16] transition-colors hover:text-[#765A2E] sm:flex sm:min-w-11 xl:px-2"
            >
              <Phone className="h-[17px] w-[17px]" strokeWidth={1.5} />
              <span className="hidden text-[10px] tracking-[0.12em] xl:inline">{settings.supportPhone}</span>
            </a>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Shopping bag (${cartCount} items)`}
              aria-controls="cart-drawer"
              className="relative flex h-11 min-w-11 items-center justify-center gap-1 text-[#2C1E16] transition-colors hover:text-[#765A2E] cursor-pointer"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2C1E16] px-1 text-[9px] font-medium tabular-nums text-[#FAF7F2]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile app drawer */}
      {menuOpen && (
        <div
          id="mobile-primary-navigation"
          ref={menuDialogRef}
          className="fixed inset-0 z-50 xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="ERAMORA menu"
          tabIndex={-1}
        >
          <div
            className="animate-fade-in absolute inset-0 bg-[#241811]/55 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="animate-drawer-in absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-[#FAF7F2] shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#2C1E16]/10 px-5">
              <BrandLogo />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center text-[#6B584C] hover:text-[#2C1E16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer"
              >
                <X className="h-5 w-5" strokeWidth={1.4} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <p className="luxe-eyebrow text-[#765A2E]">The House</p>
              <nav aria-label="Mobile Navigation" className="mt-3 flex flex-col">
                {menuLinks.map((link, i) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    aria-current={isActive(link.href) ? 'page' : undefined}
                    className={`group flex min-h-12 items-center justify-between border-b border-[#2C1E16]/8 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] ${
                      isActive(link.href) ? 'text-[#2C1E16]' : ''
                    }`}
                  >
                    <span className="flex items-baseline gap-3.5">
                      <span className="text-[9px] tabular-nums tracking-[0.24em] text-[#765A2E]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-serif text-[25px] leading-none text-[#2C1E16]">{link.label}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[#2C1E16]/25 transition-colors group-hover:text-[#765A2E]" />
                  </a>
                ))}
              </nav>

              <div className="mt-7">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-2xl bg-[#2C1E16] px-4 py-4 text-[#FAF7F2]"
                >
                  <span className="text-[10px] uppercase tracking-[0.26em]">WhatsApp Concierge</span>
                  <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                </a>
              </div>

              <div className="mt-6 space-y-1 text-[11px] text-[#6B584C]">
                <a href={`mailto:${settings.supportEmail}`} className="block hover:text-[#2C1E16]">
                  {settings.supportEmail}
                </a>
                <a href={phoneUrl} className="block hover:text-[#2C1E16]">
                  {settings.supportPhone}
                </a>
              </div>

              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Follow ERAMORA on Instagram ${settings.instagramHandle}`}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#2C1E16]/15 px-4 text-[11px] tracking-[0.08em] text-[#2C1E16] transition-colors hover:border-[#B89352] hover:text-[#8A6A32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352]"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
                <span>Follow {settings.instagramHandle}</span>
              </a>
            </div>

            <div className="shrink-0 border-t border-[#2C1E16]/10 px-5 py-4 pb-safe">
              <p className="text-[9px] uppercase tracking-[0.3em] text-[#6B584C]/70">
                Where Fragrance Meets Emotion
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      {isSearchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search ERAMORA"
          id="catalog-search-dialog"
          ref={searchDialogRef}
          tabIndex={-1}
          className="animate-fade-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#241811]/55 px-4 pt-16 pb-6 backdrop-blur-sm md:pt-24"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="animate-soft-rise max-h-[calc(100dvh-5.5rem)] w-full max-w-2xl overflow-y-auto border border-[#2C1E16]/10 bg-[#FAF7F2] p-5 shadow-2xl md:max-h-[calc(100dvh-6.5rem)] md:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[#2C1E16]/15 pb-3">
              <Search className="h-[18px] w-[18px] text-[#765A2E]" strokeWidth={1.5} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setIsSearchOpen(false);
                    navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                placeholder="Search scented candles, colouring kits, jars, bowls..."
                aria-label="Search scented candles and kids’ DIY colouring kits"
                className="w-full bg-transparent text-base text-[#2C1E16] placeholder-[#6B584C]/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
                className="flex h-11 min-w-11 items-center justify-center text-[#6B584C] hover:text-[#2C1E16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer"
              >
                <X className="h-5 w-5" strokeWidth={1.4} />
              </button>
            </div>

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="luxe-eyebrow text-[#6B584C]">
                  {searchQuery.trim() ? 'Matching Creations' : 'Suggested Creations'}
                </span>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
                    }}
                    className="text-[10px] uppercase tracking-[0.18em] text-[#2C1E16] underline underline-offset-4 hover:text-[#765A2E] cursor-pointer"
                  >
                    View all results
                  </button>
                )}
              </div>

              {searchResults.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#6B584C]">
                  No creations matched “{searchQuery}”. Try candles, colouring kits, jars or bowls.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {searchResults.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(`/product/${prod.slug}`);
                      }}
                      className="group flex items-center gap-3.5 border border-[#2C1E16]/8 p-2.5 text-left transition-colors hover:border-[#B89352]/60 cursor-pointer"
                    >
                      <ImageWithFallback
                        src={getProductImage(prod)}
                        alt={prod.name}
                        className="h-14 w-14 shrink-0 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-serif text-base text-[#2C1E16] group-hover:text-[#765A2E]">
                          {prod.name}
                        </p>
                        <p className="text-[11px] text-[#6B584C] tabular-nums">
                          {prod.categoryName} · {prod.isShowcaseDemo
                            ? 'Demo concept · Not for sale'
                            : prod.variants[0]
                              ? formatINR(prod.variants[0].price)
                              : 'Price on request'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
