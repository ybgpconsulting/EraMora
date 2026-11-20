import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  BannerConfig,
  BusinessSettings,
  CartItem,
  Category,
  Coupon,
  CustomerUser,
  Product,
  StorePublicConfig,
} from '../types/store';

interface ToastMessage {
  id: string;
  text: string;
  tone: 'info' | 'success' | 'error';
}

interface StoreContextValue {
  path: string;
  navigate: (to: string) => void;
  config: StorePublicConfig | null;
  settings: BusinessSettings;
  banners: BannerConfig;
  categories: Category[];
  products: Product[];
  loadingCatalog: boolean;
  refreshCatalog: () => Promise<void>;
  refreshConfig: () => Promise<void>;
  user: CustomerUser | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<CustomerUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  addToCart: (item: CartItem, openDrawer?: boolean) => void;
  updateCartQuantity: (productId: string, variantId: string, quantity: number) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  recentlyViewed: string[];
  recordViewedProduct: (productId: string) => void;
  giftWrapSelected: boolean;
  setGiftWrapSelected: (val: boolean) => void;
  giftMessage: string;
  setGiftMessage: (val: string) => void;
  appliedCoupon: Coupon | null;
  setAppliedCoupon: (coupon: Coupon | null) => void;
  notify: (text: string, tone?: 'info' | 'success' | 'error') => void;
}

const DEFAULT_SETTINGS: BusinessSettings = {
  brandName: 'ERAMORA',
  tagline: 'Where Fragrance Meets Emotion.',
  whatsappNumber: '918368143892',
  supportEmail: 'eramora.in@gmail.com',
  supportPhone: '+91 83681 43892',
  studioAddress: 'Sector 20, Noida, Uttar Pradesh – 201301, India',
  instagramHandle: '@eramora.in',
  instagramUrl: 'https://www.instagram.com/eramora.in/',
  freeShippingThreshold: 0,
  standardShippingFee: 0,
  giftWrapFee: 0,
  gstRatePercent: 0,
  taxInclusive: false,
  codEnabled: false,
  razorpayEnabled: false,
  whatsappOrderingEnabled: true,
  lowStockThreshold: 8,
  policies: {
    shipping: '',
    returns: '',
    privacy: '',
    terms: '',
  },
};

const DEFAULT_BANNERS: BannerConfig = {
  id: 'main-banners',
  announcementText: 'Personal fragrance and gifting enquiries available on WhatsApp',
  heroEyebrow: 'ERAMORA · Atelier Collection',
  heroHeadline: 'Where Fragrance Meets Emotion.',
  heroSubheadline:
    'Curated fragrances, candles and gifting to make every moment memorable.',
  heroCtaLabel: 'Explore the Collection',
  heroImage: '/src/assets/images/hero_eramora_atelier_1794827348612.jpg',
  campaignTitle: 'The Art of Thoughtful Gifting',
  campaignSubtitle:
    'Every ERAMORA coffret arrives wrapped in warm ivory linen paper, sealed with champagne ribbon and your personal note.',
  campaignActive: true,
};

const StoreContext = createContext<StoreContextValue | null>(null);

const LS_CART = 'eramora_cart_v1';
const LS_WISHLIST = 'eramora_wishlist_v1';
const LS_RECENT = 'eramora_recent_v1';
const LS_GIFT = 'eramora_gift_v1';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(() => window.location.pathname + window.location.search);
  const [config, setConfig] = useState<StorePublicConfig | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LS_CART);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LS_WISHLIST);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LS_RECENT);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [giftWrapSelected, setGiftWrapSelected] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LS_GIFT);
      return saved ? Boolean(JSON.parse(saved).selected) : false;
    } catch {
      return false;
    }
  });
  const [giftMessage, setGiftMessage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(LS_GIFT);
      return saved ? String(JSON.parse(saved).message || '') : '';
    } catch {
      return '';
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((text: string, tone: 'info' | 'success' | 'error' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts([{ id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname + window.location.search) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname + window.location.search);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_CART, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_WISHLIST, JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_RECENT, JSON.stringify(recentlyViewed));
    } catch {
      // ignore
    }
  }, [recentlyViewed]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_GIFT, JSON.stringify({ selected: giftWrapSelected, message: giftMessage }));
    } catch {
      // ignore
    }
  }, [giftWrapSelected, giftMessage]);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config/public');
      if (res.ok) {
        const data = (await res.json()) as StorePublicConfig;
        setConfig(data);
      }
    } catch {
      // offline fallback handled gracefully
    }
  }, []);

  const refreshCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const [catRes, prodRes] = await Promise.all([fetch('/api/categories'), fetch('/api/products')]);
      if (catRes.ok) setCategories((await catRes.json()) as Category[]);
      if (prodRes.ok) setProducts((await prodRes.json()) as Product[]);
    } catch {
      // ignore
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = (await res.json()) as { user: CustomerUser | null };
        setUser(data.user);
      }
    } catch {
      // ignore
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshConfig();
    void refreshCatalog();
    void refreshUser();
  }, [refreshConfig, refreshCatalog, refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json()) as { user?: CustomerUser; error?: string };
    if (!res.ok || !data.user) {
      throw new Error(data.error || 'Login failed.');
    }
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    notify('Signed out safely.', 'info');
  }, [notify]);

  const addToCart = useCallback(
    (item: CartItem, openDrawer = true) => {
      setCart((prev) => {
        const idx = prev.findIndex((i) => i.productId === item.productId && i.variantId === item.variantId);
        if (idx >= 0) {
          const next = [...prev];
          const target = next[idx];
          const nextQty = Math.min(item.maxStock || 20, target.quantity + item.quantity);
          next[idx] = { ...target, quantity: nextQty, unitPrice: item.unitPrice, maxStock: item.maxStock };
          return next;
        }
        return [...prev, item];
      });
      notify(`Added ${item.name} (${item.variantLabel}) to bag`, 'success');
      if (openDrawer) setIsCartOpen(true);
    },
    [notify]
  );

  const updateCartQuantity = useCallback((productId: string, variantId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => !(i.productId === productId && i.variantId === variantId));
      }
      return prev.map((i) =>
        i.productId === productId && i.variantId === variantId
          ? { ...i, quantity: Math.min(i.maxStock || 20, quantity) }
          : i
      );
    });
  }, []);

  const removeFromCart = useCallback((productId: string, variantId: string) => {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedCoupon(null);
    setGiftWrapSelected(false);
    setGiftMessage('');
  }, []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) => {
        const exists = prev.includes(productId);
        const next = exists ? prev.filter((id) => id !== productId) : [productId, ...prev];
        notify(exists ? 'Removed from wishlist' : 'Saved to wishlist', 'info');
        return next;
      });
    },
    [notify]
  );

  const recordViewedProduct = useCallback((productId: string) => {
    setRecentlyViewed((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 8));
  }, []);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0), [cart]);

  const value: StoreContextValue = {
    path,
    navigate,
    config,
    settings: config?.settings || DEFAULT_SETTINGS,
    banners: config?.banners || DEFAULT_BANNERS,
    categories,
    products,
    loadingCatalog,
    refreshCatalog,
    refreshConfig,
    user,
    authLoading,
    login,
    logout,
    refreshUser,
    cart,
    cartCount,
    cartSubtotal,
    isCartOpen,
    setIsCartOpen,
    isSearchOpen,
    setIsSearchOpen,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    wishlist,
    toggleWishlist,
    recentlyViewed,
    recordViewedProduct,
    giftWrapSelected,
    setGiftWrapSelected,
    giftMessage,
    setGiftMessage,
    appliedCoupon,
    setAppliedCoupon,
    notify,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
      {/* Clean Toast Stack */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-28 md:bottom-6 left-4 md:left-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto px-4 py-3 text-sm border shadow-sm transition-all ${
                t.tone === 'error'
                  ? 'bg-[#3D1D1A] text-[#FAF7F2] border-[#6E3630]'
                  : 'bg-[#2C1E16] text-[#FAF7F2] border-[#C5A059]/40'
              }`}
            >
              {t.text}
            </div>
          ))}
        </div>
      )}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
