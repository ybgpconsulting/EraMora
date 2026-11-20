import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Archive,
  ChevronRight,
  ChevronDown,
  Layers,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { formatINR } from '../utils/commerce';
import type {
  BannerConfig,
  BusinessSettings,
  Category,
  Coupon,
  CustomerEnquiry,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
} from '../types/store';

type AdminTab = 'overview' | 'products' | 'announcement' | 'orders' | 'customers' | 'marketing' | 'settings';

interface OverviewData {
  totalOrders: number;
  totalRevenue: number;
  todaySales: number;
  monthlySales: number;
  totalCustomers: number;
  statusCounts: Record<string, number>;
  bestsellingProducts: Array<{ productId: string; name: string; units: number; revenue: number }>;
  lowStockProducts: Array<{ productId: string; productName: string; variantLabel: string; stock: number; sku: string }>;
}

export const AdminDashboardPage: React.FC = () => {
  const { user, login, logout, navigate, refreshCatalog, refreshConfig, categories, notify } = useStore();
  const productImageInputRef = useRef<HTMLInputElement>(null);

  // Admin Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState<AdminTab>('products');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [savingOrderIds, setSavingOrderIds] = useState<Set<string>>(() => new Set());
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [customersData, setCustomersData] = useState<{
    customers: Array<{ id: string; name: string; email: string; mobile: string; ordersCount: number; totalSpent: number }>;
    enquiries: CustomerEnquiry[];
  }>({ customers: [], enquiries: [] });

  const [marketingData, setMarketingData] = useState<{
    coupons: Coupon[];
    banners: BannerConfig | null;
  }>({ coupons: [], banners: null });

  const [settingsForm, setSettingsForm] = useState<BusinessSettings | null>(null);
  const [bannersForm, setBannersForm] = useState<BannerConfig | null>(null);

  // Product editor state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const defaultProductImage = '/src/assets/images/product_candle_oud_velvet_1794827351032.jpg';
  const [prodForm, setProdForm] = useState({
    name: '',
    subtitle: '',
    categoryId: '',
    description: '',
    variantLabel: '220g Amber Jar',
    variantSize: '220g',
    price: 1950,
    compareAtPrice: 0,
    stock: 15,
    sku: '',
    images: [defaultProductImage],
    isShowcaseDemo: false,
    isFeatured: true,
    isBestseller: false,
    isNewArrival: true,
    seoTitle: '',
    seoDescription: '',
  });

  // Category creator
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  const deferredProductSearch = useDeferredValue(productSearch);
  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === productCategoryFilter),
    [categories, productCategoryFilter]
  );
  const filteredProducts = useMemo(() => {
    const query = deferredProductSearch.trim().toLowerCase();
    return adminProducts.filter((product) => {
      const searchableText = [
        product.name,
        product.subtitle,
        product.categoryName,
        ...product.variants.flatMap((variant) => [variant.label, variant.sku]),
      ]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesCategory = product.categoryId === productCategoryFilter;
      const matchesStatus =
        productStatusFilter === 'all' ||
        (productStatusFilter === 'active' ? !product.isArchived : product.isArchived);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [adminProducts, deferredProductSearch, productCategoryFilter, productStatusFilter]);

  // WhatsApp Order Recorder
  const [waOrderOpen, setWaOrderOpen] = useState(false);
  const [waOrderForm, setWaOrderForm] = useState({
    customerName: '',
    mobile: '',
    email: '',
    houseFlat: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    productId: '',
    variantId: '',
    quantity: 1,
    paymentStatus: 'awaiting_verification' as PaymentStatus,
    giftWrapSelected: false,
    giftMessage: '',
    notes: '',
  });
  const [waOrderAdditionalItems, setWaOrderAdditionalItems] = useState<
    Array<{ productId: string; variantId: string; quantity: number }>
  >([]);

  // Coupon creator
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'flat',
    discountValue: 10,
    minOrderAmount: 1000,
  });

  const loadAdminData = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const [prodRes, mktRes, cfgRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/marketing'),
        fetch('/api/config/public'),
      ]);
      if (prodRes.ok) {
        const prods = (await prodRes.json()) as Product[];
        setAdminProducts(prods);
      }
      if (mktRes.ok) {
        const mkt = await mktRes.json();
        setMarketingData(mkt);
        if (mkt.banners) setBannersForm(mkt.banners as BannerConfig);
      }
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        setSettingsForm(cfg.settings as BusinessSettings);
      }
    } catch {
      notify('Could not refresh admin data.', 'error');
    }
  }, [user, notify]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const logged = await login(loginEmail, loginPassword);
      if (logged.role !== 'admin') {
        setLoginError('This account does not have Administrator privileges.');
      } else {
        notify('Signed in to ERAMORA Admin Portal', 'success');
      }
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setLoggingIn(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-14">
        <SeoHead title="Admin Portal | ERAMORA" description="ERAMORA Atelier Management Portal" noIndex />
        <div className="p-7 bg-[#F4EFE6]/75 border border-[#2C1E16]/15 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#B89352]">Atelier Operations</p>
            <h1 className="font-serif text-3xl text-[#2C1E16] mt-1">Admin Dashboard Sign In</h1>
          </div>

          {loginError && (
            <div role="alert" className="p-3 bg-[#3D1D1A] text-[#FAF7F2] text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label htmlFor="adm-email" className="block text-xs text-[#6B584C] mb-1">
                Admin Email
              </label>
              <input
                id="adm-email"
                type="email"
                required
                autoComplete="username"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="adm-pass" className="block text-xs text-[#6B584C] mb-1">
                Password
              </label>
              <input
                id="adm-pass"
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3.5 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-[#2C1E16] text-[#FAF7F2] py-3 text-xs uppercase tracking-[0.16em] cursor-pointer"
            >
              {loggingIn ? 'Signing In...' : 'Enter Dashboard'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#2C1E16]/10 flex items-center justify-end text-xs text-[#6B584C]">
            <button type="button" onClick={() => navigate('/')} className="hover:text-[#2C1E16] cursor-pointer">
              Back to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleImageUpload = async (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1.8 * 1024 * 1024) {
      notify('Choose a PNG, JPEG, or WEBP image under 1.8MB.', 'error');
      return;
    }

    setIsUploadingImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('The selected image could not be read.'));
        };
        reader.onerror = () => reject(reader.error || new Error('The selected image could not be read.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('The server returned an invalid response. Please try again.');
      }

      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        notify(data.error || 'Image upload failed.', 'error');
        return;
      }

      const uploadedUrl = data.url;
      if (editingProduct) {
        setEditingProduct((current) =>
          current ? { ...current, images: [...current.images, uploadedUrl] } : current
        );
      } else {
        setProdForm((current) => ({
          ...current,
          images:
            current.images.length === 1 && current.images[0] === defaultProductImage
              ? [uploadedUrl]
              : [...current.images, uploadedUrl],
        }));
      }
      notify('Image uploaded successfully.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check your connection and try again.';
      notify(`Image upload failed. ${message}`, 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prodForm.name,
          subtitle: prodForm.subtitle,
          categoryId: prodForm.categoryId || categories[0]?.id,
          description: prodForm.description,
          images: prodForm.images,
          variants: [
            {
              id: `var-${Date.now()}`,
              label: prodForm.variantLabel,
              size: prodForm.variantSize,
              price: Number(prodForm.price),
              compareAtPrice: prodForm.compareAtPrice > 0 ? Number(prodForm.compareAtPrice) : undefined,
              stock: Number(prodForm.stock),
              sku: prodForm.sku || `ERA-${Math.floor(100 + Math.random() * 900)}`,
            },
          ],
          isShowcaseDemo: prodForm.isShowcaseDemo,
          isFeatured: prodForm.isFeatured,
          isBestseller: prodForm.isBestseller,
          isNewArrival: prodForm.isNewArrival,
          seoTitle: prodForm.seoTitle,
          seoDescription: prodForm.seoDescription,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        notify(data.error || 'Could not create product.', 'error');
        return;
      }
      notify('Product added to catalogue.', 'success');
      setNewProductOpen(false);
      setProdForm((p) => ({ ...p, name: '', subtitle: '', description: '' }));
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch {
      notify('Could not create product. Check your connection and try again.', 'error');
    }
  };

  const handleSaveEditedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        notify(data.error || 'Could not update product.', 'error');
        return;
      }
      notify('Product updated.', 'success');
      setEditingProduct(null);
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch {
      notify('Could not update product. Check your connection and try again.', 'error');
    }
  };

  const handleArchiveProduct = async (id: string, archive: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: archive }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        notify(data.error || 'Could not update product status.', 'error');
        return;
      }
      notify(archive ? 'Product archived.' : 'Product restored.', 'info');
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch {
      notify('Could not update product status. Check your connection and try again.', 'error');
    }
  };

  const handleUpdateOrder = async (orderId: string, patch: Partial<Order>) => {
    if (savingOrderIds.has(orderId)) return;
    setSavingOrderIds((current) => new Set(current).add(orderId));
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const payload = (await res.json()) as Order | { error?: string };
      if (!res.ok) {
        throw new Error('error' in payload ? payload.error || 'Could not update order.' : 'Could not update order.');
      }
      if (!('id' in payload) || payload.id !== orderId) {
        throw new Error('The server did not confirm the order update.');
      }
      setOrders((current) => {
        const updatedOrders = current.map((order) => (order.id === orderId ? payload : order));
        return orderStatusFilter !== 'all' && payload.orderStatus !== orderStatusFilter
          ? updatedOrders.filter((order) => order.id !== orderId)
          : updatedOrders;
      });
      notify('Order updated.', 'success');
    } catch (err) {
      notify((err as Error).message || 'Could not update order. Check your connection and try again.', 'error');
    } finally {
      setSavingOrderIds((current) => {
        const next = new Set(current);
        next.delete(orderId);
        return next;
      });
    }
  };

  const handleCreateWhatsAppOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/orders/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...waOrderForm,
        items: [
          {
            productId: waOrderForm.productId,
            variantId: waOrderForm.variantId,
            quantity: waOrderForm.quantity,
          },
          ...waOrderAdditionalItems,
        ],
      }),
    });
    if (res.ok) {
      notify('WhatsApp order recorded.', 'success');
      setWaOrderOpen(false);
      setWaOrderForm((form) => ({
        ...form,
        customerName: '',
        mobile: '',
        email: '',
        houseFlat: '',
        street: '',
        landmark: '',
        city: '',
        state: '',
        pincode: '',
        quantity: 1,
        paymentStatus: 'awaiting_verification',
        giftWrapSelected: false,
        giftMessage: '',
        notes: '',
      }));
      setWaOrderAdditionalItems([]);
      void loadAdminData();
    } else {
      const err = (await res.json()) as { error?: string };
      notify(err.error || 'Could not record order.', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForm),
    });
    if (res.ok) {
      notify('Business settings saved and live across storefront.', 'success');
      await refreshConfig();
    }
  };

  const handleSaveBanners = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannersForm) return;
    const res = await fetch('/api/admin/banners', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bannersForm),
    });
    if (res.ok) {
      notify('Storefront announcement and banner settings updated.', 'success');
      await refreshConfig();
    } else {
      notify('Could not update storefront announcement and banner settings.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-20">
      <SeoHead title="Admin Dashboard | ERAMORA" description="ERAMORA store operations" noIndex />

      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2C1E16]/12 pb-5 mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#B89352]">ERAMORA Atelier Operations</p>
          <h1 className="font-serif text-3xl md:text-4xl text-[#2C1E16]">Catalogue Manager</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadAdminData()}
            className="inline-flex items-center gap-1.5 border border-[#2C1E16]/20 px-3.5 py-2 text-xs text-[#2C1E16] hover:bg-[#F4EFE6] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="border border-[#2C1E16]/20 px-3.5 py-2 text-xs text-[#2C1E16] hover:bg-[#F4EFE6] cursor-pointer"
          >
            View Storefront
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-1.5 bg-[#2C1E16] text-[#FAF7F2] px-3.5 py-2 text-xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Responsive Tab Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-8 border-b border-[#2C1E16]/10">
        {(
          [
            ['products', 'Products'],
            ['announcement', 'Announcement'],
            ['marketing', 'Marketing'],
            ['settings', 'Settings'],
          ] as Array<[AdminTab, string]>
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border transition-colors cursor-pointer ${
              tab === key
                ? 'bg-[#2C1E16] text-[#FAF7F2] border-[#2C1E16]'
                : 'border-[#2C1E16]/15 text-[#6B584C] hover:text-[#2C1E16]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'announcement' && (
        <div className="mx-auto max-w-3xl">
          {bannersForm ? (
            <form
              onSubmit={handleSaveBanners}
              className="space-y-5 border border-[#2C1E16]/12 bg-[#FAF7F2] p-5 md:p-7"
            >
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#B89352]">
                  Storefront message
                </p>
                <h2 className="mt-1 font-serif text-2xl text-[#2C1E16]">Announcement bar</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#6B584C]">
                  Edit the message shown above the navigation on storefront pages. Leave it blank to hide the bar.
                </p>
              </div>

              <div>
                <label htmlFor="announcement-text" className="mb-1.5 block text-xs font-medium text-[#2C1E16]">
                  Announcement text
                </label>
                <input
                  id="announcement-text"
                  type="text"
                  maxLength={140}
                  value={bannersForm.announcementText}
                  onChange={(event) =>
                    setBannersForm({ ...bannersForm, announcementText: event.target.value })
                  }
                  placeholder="Example: Personal fragrance and gifting enquiries on WhatsApp"
                  className="min-h-11 w-full border border-[#2C1E16]/20 bg-white px-3 py-2 text-sm text-[#2C1E16] placeholder:text-[#6B584C]/60 focus:border-[#B89352] focus:outline-none focus:ring-2 focus:ring-[#B89352]/25"
                />
                <p className="mt-1.5 text-[11px] text-[#6B584C]">
                  {bannersForm.announcementText.length}/140 characters
                </p>
              </div>

              <div className="border border-[#2C1E16]/10 bg-[#241811] px-4 py-3 text-center text-[10px] uppercase tracking-[0.18em] text-[#FAF7F2]/80">
                {bannersForm.announcementText.trim() || 'The announcement bar is hidden'}
              </div>

              <button
                type="submit"
                className="min-h-10 bg-[#2C1E16] px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-[#FAF7F2] transition-colors hover:bg-[#3F2C21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer"
              >
                Save announcement
              </button>
            </form>
          ) : (
            <p role="status" className="border border-[#2C1E16]/12 bg-[#FAF7F2] p-5 text-sm text-[#6B584C]">
              Announcement settings are unavailable. Refresh the admin data and try again.
            </p>
          )}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {tab === 'overview' && overview && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              ['Total Revenue', formatINR(overview.totalRevenue)],
              ['Monthly Sales', formatINR(overview.monthlySales)],
              ["Today's Sales", formatINR(overview.todaySales)],
              ['Total Orders', String(overview.totalOrders)],
              ['Customers', String(overview.totalCustomers)],
            ].map(([label, val]) => (
              <div key={label} className="p-4 bg-[#F4EFE6]/70 border border-[#2C1E16]/10">
                <p className="text-[11px] uppercase tracking-wider text-[#6B584C]">{label}</p>
                <p className="mt-1.5 font-sans font-semibold text-2xl text-[#2C1E16] tabular-nums">{val}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              ['Pending', overview.statusCounts.pending],
              ['Processing', overview.statusCounts.processing],
              ['Shipped', overview.statusCounts.shipped],
              ['Delivered', overview.statusCounts.delivered],
              ['Cancelled', overview.statusCounts.cancelled],
              ['Returns', overview.statusCounts.return_requested],
            ].map(([label, count]) => (
              <div key={String(label)} className="p-3 bg-[#FAF7F2] border border-[#2C1E16]/10 flex justify-between items-center text-xs">
                <span className="text-[#6B584C]">{label}</span>
                <span className="font-semibold tabular-nums text-[#2C1E16]">{count}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 border border-[#2C1E16]/12 bg-[#FAF7F2]">
              <h2 className="font-serif text-xl text-[#2C1E16] mb-3">Bestselling Products</h2>
              {overview.bestsellingProducts.length === 0 ? (
                <p className="text-xs text-[#6B584C]">No sales recorded yet.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#2C1E16]/10 text-[#6B584C] text-left">
                      <th className="py-2 font-medium">Product</th>
                      <th className="py-2 font-medium text-right">Units</th>
                      <th className="py-2 font-medium text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2C1E16]/8">
                    {overview.bestsellingProducts.map((b) => (
                      <tr key={b.productId}>
                        <td className="py-2.5 text-[#2C1E16]">{b.name}</td>
                        <td className="py-2.5 text-right tabular-nums">{b.units}</td>
                        <td className="py-2.5 text-right tabular-nums font-medium">{formatINR(b.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-5 border border-[#2C1E16]/12 bg-[#FAF7F2]">
              <h2 className="font-serif text-xl text-[#2C1E16] mb-3">Low-Stock Alerts</h2>
              {overview.lowStockProducts.length === 0 ? (
                <p className="text-xs text-[#6B584C]">All active variants are adequately stocked.</p>
              ) : (
                <ul className="divide-y divide-[#2C1E16]/8 text-xs">
                  {overview.lowStockProducts.map((item) => (
                    <li key={item.sku} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[#2C1E16] font-medium">{item.productName}</span>
                        <span className="text-[#6B584C] block">
                          {item.variantLabel} · {item.sku}
                        </span>
                      </div>
                      <span className={`tabular-nums font-semibold ${item.stock === 0 ? 'text-[#8C2F27]' : 'text-[#B89352]'}`}>
                        {item.stock} left
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS & CATEGORIES TAB */}
      {tab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#B89352]">PRODUCT CATALOGUE</p>
              <h2 className="mt-1 font-serif text-2xl text-[#2C1E16]">
                {selectedCategory?.name || 'Choose a category'}
              </h2>
              <p className="mt-1 text-xs text-[#6B584C]">
                {selectedCategory
                  ? `Manage products in ${selectedCategory.name}.`
                  : 'Select a category to view and manage its products.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setProductCategoryFilter('');
                    setProductSearch('');
                    setProductStatusFilter('all');
                    setNewProductOpen(false);
                    setEditingProduct(null);
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#2C1E16]/15 bg-[#FAF7F2] px-3.5 py-2 text-xs text-[#2C1E16] transition-colors hover:bg-[#F4EFE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer"
                >
                  <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>All categories</span>
                </button>
              )}
              <button
                type="button"
                aria-expanded={categoryManagerOpen}
                aria-controls={categoryManagerOpen ? 'admin-category-manager' : undefined}
                onClick={() => setCategoryManagerOpen((open) => !open)}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#2C1E16]/15 bg-[#FAF7F2] px-3.5 py-2 text-xs text-[#2C1E16] transition-colors hover:bg-[#F4EFE6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer"
              >
                <span>{categoryManagerOpen ? 'Close category manager' : 'Manage categories'}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 transition-transform ${categoryManagerOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => setNewProductOpen((open) => !open)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-[#2C1E16] px-4 py-2.5 text-xs font-medium text-[#FAF7F2] transition-colors hover:bg-[#3F2C21] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer"
                >
                  <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                  <span>{newProductOpen ? 'Close form' : 'Add product'}</span>
                </button>
              )}
            </div>
          </div>

          {!selectedCategory ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => {
                const productCount = adminProducts.filter((product) => product.categoryId === category.id).length;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setProductCategoryFilter(category.id);
                      setProductSearch('');
                      setProductStatusFilter('all');
                      setProdForm((form) => ({ ...form, categoryId: category.id }));
                    }}
                    className="group min-h-48 rounded-xl border border-[#2C1E16]/10 bg-gradient-to-br from-[#FAF7F2] to-[#F4EFE6]/70 p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#B89352]/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#B89352]/30 bg-white/70 text-[#8A6A32]">
                      <Layers aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <span className="mt-5 flex items-center justify-between gap-3">
                      <span className="font-serif text-lg text-[#2C1E16]">{category.name}</span>
                      <ChevronRight
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-[#8A6A32] transition-transform group-hover:translate-x-1"
                      />
                    </span>
                    <span className="mt-1 block min-h-10 text-xs leading-5 text-[#6B584C]">
                      {category.description || 'Manage products in this collection.'}
                    </span>
                    <span className="mt-4 inline-flex rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-[#6B584C]">
                      {productCount} {productCount === 1 ? 'product' : 'products'}
                    </span>
                  </button>
                );
              })}
              {categories.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#2C1E16]/20 bg-[#FAF7F2] p-8 text-center sm:col-span-2 xl:col-span-3">
                  <p className="font-serif text-lg text-[#2C1E16]">No categories yet</p>
                  <p className="mt-1 text-sm text-[#6B584C]">Create a category to start building your catalogue.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-3 rounded-xl border border-[#2C1E16]/10 bg-[#F4EFE6]/45 p-3 md:grid-cols-[minmax(0,1fr)_180px]">
              <label className="relative block">
                <span className="sr-only">Search products in {selectedCategory.name}</span>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B584C]"
                />
                <input
                  type="search"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Search products by name or SKU"
                  className="min-h-10 w-full rounded-md border border-[#2C1E16]/15 bg-[#FAF7F2] py-2 pl-9 pr-3 text-sm text-[#2C1E16] placeholder:text-[#6B584C]/70 focus:border-[#B89352] focus:outline-none focus:ring-2 focus:ring-[#B89352]/25"
                />
              </label>
              <select
                aria-label="Filter products by status"
                value={productStatusFilter}
                onChange={(event) => setProductStatusFilter(event.target.value)}
                className="min-h-10 rounded-md border border-[#2C1E16]/15 bg-[#FAF7F2] px-3 py-2 text-xs text-[#2C1E16] focus:border-[#B89352] focus:outline-none focus:ring-2 focus:ring-[#B89352]/25"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          {selectedCategory && (
            <>
          {newProductOpen && (
            <form onSubmit={handleCreateProduct} className="p-6 bg-[#F4EFE6]/70 border border-[#2C1E16]/15 space-y-4">
              <h3 className="font-serif text-xl text-[#2C1E16]">Add New Creation</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="new-product-name" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    Product name *
                  </label>
                  <input
                    id="new-product-name"
                    type="text"
                    required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    placeholder="e.g. Oud & Velvet Amber"
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new-product-subtitle" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    Key notes / subtitle
                  </label>
                  <input
                    id="new-product-subtitle"
                    type="text"
                    value={prodForm.subtitle}
                    onChange={(e) => setProdForm({ ...prodForm, subtitle: e.target.value })}
                    placeholder="e.g. Saffron · Black Tea · Sandalwood"
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new-product-category" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    Category
                  </label>
                  <select
                    id="new-product-category"
                    value={prodForm.categoryId || categories[0]?.id}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-product-variant" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    Variant label *
                  </label>
                  <input
                    id="new-product-variant"
                    type="text"
                    required
                    value={prodForm.variantLabel}
                    onChange={(e) => setProdForm({ ...prodForm, variantLabel: e.target.value })}
                    placeholder="e.g. 220g Amber Jar"
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new-product-price" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    Price (INR) *
                  </label>
                  <input
                    id="new-product-price"
                    type="number"
                    required
                    min={1}
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new-product-stock" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    Stock quantity *
                  </label>
                  <input
                    id="new-product-stock"
                    type="number"
                    required
                    min={0}
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-product-description" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                  Product description
                </label>
                <textarea
                  id="new-product-description"
                  rows={3}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  placeholder="Describe the fragrance, materials, and product details."
                  className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <button
                  type="button"
                  disabled={isUploadingImage}
                  aria-busy={isUploadingImage}
                  onClick={() => productImageInputRef.current?.click()}
                  className="inline-flex items-center gap-2 border border-[#2C1E16]/20 px-3 py-2 bg-[#FAF7F2] disabled:cursor-wait disabled:opacity-60"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isUploadingImage ? 'Uploading image…' : 'Upload Product Image'}</span>
                </button>
                <input
                  ref={productImageInputRef}
                  id="new-product-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const input = e.currentTarget;
                    const file = input.files?.[0];
                    input.value = '';
                    if (file) void handleImageUpload(file);
                  }}
                />
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={prodForm.isFeatured}
                    onChange={(e) => setProdForm({ ...prodForm, isFeatured: e.target.checked })}
                  />
                  <span>Featured</span>
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={prodForm.isShowcaseDemo}
                    onChange={(e) => setProdForm({ ...prodForm, isShowcaseDemo: e.target.checked })}
                  />
                  <span>Mark as Showcase Demo</span>
                </label>
              </div>

              {prodForm.images.length > 0 && (
                <div className="space-y-2" aria-live="polite">
                  <p className="text-xs font-medium text-[#6B584C]">Product image preview</p>
                  <div className="flex flex-wrap gap-3">
                    {prodForm.images.map((image, index) => (
                      <img
                        key={`${image}-${index}`}
                        src={image}
                        alt={`Product image ${index + 1}`}
                        className="h-20 w-20 border border-[#2C1E16]/15 object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="bg-[#2C1E16] text-[#FAF7F2] px-6 py-2.5 text-xs uppercase tracking-wider cursor-pointer">
                Save Product
              </button>
            </form>
          )}

          {/* Edit Modal */}
          {editingProduct && (
            <form onSubmit={handleSaveEditedProduct} className="p-6 bg-[#F4EFE6] border border-[#2C1E16]/20 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-xl text-[#2C1E16]">Editing: {editingProduct.name}</h3>
                <button type="button" onClick={() => setEditingProduct(null)} className="text-xs underline cursor-pointer">
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-product-name" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    Product name
                  </label>
                  <input
                    id="edit-product-name"
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-product-subtitle" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    Key notes / subtitle
                  </label>
                  <input
                    id="edit-product-subtitle"
                    type="text"
                    value={editingProduct.subtitle}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subtitle: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-product-seo-title" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    SEO title
                  </label>
                  <input
                    id="edit-product-seo-title"
                    type="text"
                    value={editingProduct.seoTitle || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, seoTitle: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-product-seo-description" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    SEO description
                  </label>
                  <input
                    id="edit-product-seo-description"
                    type="text"
                    value={editingProduct.seoDescription || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, seoDescription: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-[#6B584C]">Variants & Stock</p>
                {editingProduct.variants.map((v, idx) => (
                  <div key={v.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label htmlFor={`edit-variant-label-${idx}`} className="mb-1 block text-xs text-[#6B584C]">
                        Variant label
                      </label>
                      <input
                        id={`edit-variant-label-${idx}`}
                        type="text"
                        value={v.label}
                        onChange={(e) => {
                          const vars = [...editingProduct.variants];
                          vars[idx] = { ...v, label: e.target.value };
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                        className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label htmlFor={`edit-variant-price-${idx}`} className="mb-1 block text-xs text-[#6B584C]">
                        Price (INR)
                      </label>
                      <input
                        id={`edit-variant-price-${idx}`}
                        type="number"
                        value={v.price}
                        onChange={(e) => {
                          const vars = [...editingProduct.variants];
                          vars[idx] = { ...v, price: Number(e.target.value) };
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                        className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-2.5 py-1.5 text-xs tabular-nums"
                      />
                    </div>
                    <div>
                      <label htmlFor={`edit-variant-stock-${idx}`} className="mb-1 block text-xs text-[#6B584C]">
                        Stock quantity
                      </label>
                      <input
                        id={`edit-variant-stock-${idx}`}
                        type="number"
                        value={v.stock}
                        onChange={(e) => {
                          const vars = [...editingProduct.variants];
                          vars[idx] = { ...v, stock: Number(e.target.value) };
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                        className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-2.5 py-1.5 text-xs tabular-nums"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={editingProduct.isShowcaseDemo}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isShowcaseDemo: e.target.checked })}
                  />
                  <span>Showcase Demo Flag</span>
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={editingProduct.isBestseller}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isBestseller: e.target.checked })}
                  />
                  <span>Bestseller</span>
                </label>
              </div>
              <button type="submit" className="bg-[#2C1E16] text-[#FAF7F2] px-6 py-2.5 text-xs uppercase tracking-wider cursor-pointer">
                Update Product
              </button>
            </form>
          )}

          {/* Product List */}
          <div className="overflow-x-auto border border-[#2C1E16]/12 bg-[#FAF7F2]">
            <p className="border-b border-[#2C1E16]/10 px-4 py-2 text-[11px] text-[#6B584C]">
              Showing {filteredProducts.length} of{' '}
              {adminProducts.filter((product) => product.categoryId === productCategoryFilter).length} products
            </p>
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="bg-[#F4EFE6] text-[#6B584C] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Total Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2C1E16]/8">
                {filteredProducts.map((p) => {
                  const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                  return (
                    <tr key={p.id}>
                      <td className="p-3 font-medium text-[#2C1E16]">
                        {p.name}
                        {p.isShowcaseDemo && <span className="block text-[10px] text-[#6B584C]">Showcase Demo</span>}
                      </td>
                      <td className="p-3 text-[#6B584C]">{p.categoryName}</td>
                      <td className="p-3 tabular-nums">{formatINR(p.variants[0]?.price || 0)}</td>
                      <td className="p-3 tabular-nums">{totalStock}</td>
                      <td className="p-3">{p.isArchived ? 'Archived' : 'Active'}</td>
                      <td className="p-3 text-right space-x-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(p)}
                          className="underline text-[#2C1E16] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleArchiveProduct(p.id, !p.isArchived)}
                          className="inline-flex items-center gap-1 text-[#6B584C] hover:text-[#2C1E16] cursor-pointer"
                        >
                          <Archive className="w-3 h-3" />
                          <span>{p.isArchived ? 'Restore' : 'Archive'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6B584C]">
                      <div className="flex flex-col items-center gap-2">
                        <span>No products match these filters.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setProductSearch('');
                            setProductStatusFilter('all');
                          }}
                          className="text-xs font-medium text-[#2C1E16] underline underline-offset-2 hover:text-[#8A6A32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352]"
                        >
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
            </>
          )}

          {/* Categories Manager */}
          {categoryManagerOpen && (
            <div id="admin-category-manager" className="space-y-4 border border-[#2C1E16]/12 bg-[#FAF7F2] p-5">
              <h3 className="font-serif text-xl text-[#2C1E16]">Manage Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat: Category) => (
                  <div
                    key={cat.id}
                    className="inline-flex items-center gap-2 border border-[#2C1E16]/15 px-3 py-1.5 text-xs"
                  >
                    <span>{cat.name}</span>
                    <button
                      type="button"
                      aria-label={`Delete category ${cat.name}`}
                      onClick={async () => {
                        await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' });
                        await refreshCatalog();
                        notify('Category removed.', 'info');
                      }}
                      className="text-[#6B584C] hover:text-[#8C2F27] cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newCategoryName.trim()) return;
                  await fetch('/api/admin/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newCategoryName, description: newCategoryDesc }),
                  });
                  setNewCategoryName('');
                  setNewCategoryDesc('');
                  await refreshCatalog();
                  notify('Category added.', 'success');
                }}
                className="flex flex-wrap gap-2"
              >
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  className="border border-[#2C1E16]/20 bg-[#FAF7F2] px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Short description"
                  className="min-w-[200px] flex-1 border border-[#2C1E16]/20 bg-[#FAF7F2] px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="bg-[#2C1E16] px-4 py-2 text-xs uppercase text-[#FAF7F2] cursor-pointer"
                >
                  Add Category
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ORDERS & WHATSAPP RECORDER TAB */}
      {tab === 'orders' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search order #, name, phone..."
                className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="return_requested">Return Requested</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setWaOrderOpen((v) => !v)}
              className="inline-flex items-center gap-2 bg-[#2C1E16] text-[#FAF7F2] px-4 py-2.5 text-xs uppercase tracking-wider cursor-pointer"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
              <span>{waOrderOpen ? 'Close Recorder' : 'Record WhatsApp Order'}</span>
            </button>
          </div>

          {waOrderOpen && (
            <form onSubmit={handleCreateWhatsAppOrder} className="p-5 bg-[#F4EFE6]/70 border border-[#2C1E16]/15 space-y-3">
              <h3 className="font-serif text-xl text-[#2C1E16]">Record Confirmed WhatsApp-Assisted Order</h3>
              <p className="text-xs leading-relaxed text-[#6B584C]">
                Enter the confirmed delivery address and selected product variant. Shipping and payment updates can
                be added to the order after it is saved.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={waOrderForm.customerName}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, customerName: e.target.value })}
                  placeholder="Customer name *"
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                />
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={waOrderForm.mobile}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, mobile: e.target.value })}
                  placeholder="Mobile number *"
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                />
                <input
                  type="email"
                  autoComplete="email"
                  value={waOrderForm.email}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, email: e.target.value })}
                  placeholder="Email (optional)"
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  required
                  autoComplete="address-line1"
                  value={waOrderForm.houseFlat}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, houseFlat: e.target.value })}
                  placeholder="House / flat / building *"
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  required
                  autoComplete="address-line2"
                  value={waOrderForm.street}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, street: e.target.value })}
                  placeholder="Street / area *"
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={waOrderForm.landmark}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, landmark: e.target.value })}
                  placeholder="Landmark (optional)"
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  required
                  value={waOrderForm.city}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, city: e.target.value })}
                  placeholder="City *"
                  autoComplete="address-level2"
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  required
                  value={waOrderForm.state}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, state: e.target.value })}
                  placeholder="State *"
                  autoComplete="address-level1"
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  value={waOrderForm.pincode}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, pincode: e.target.value.replace(/\D/g, '') })}
                  placeholder="6-digit pincode *"
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                />
                <select
                  required
                  value={waOrderForm.productId}
                  onChange={(e) => {
                    const p = adminProducts.find((pr) => pr.id === e.target.value);
                    setWaOrderForm({
                      ...waOrderForm,
                      productId: e.target.value,
                      variantId: p?.variants.find((variant) => variant.stock > 0)?.id || '',
                    });
                  }}
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                >
                  <option value="" disabled>Select a product *</option>
                  {adminProducts
                    .filter((product) => !product.isArchived && product.variants.some((variant) => variant.stock > 0))
                    .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                    ))}
                </select>
                <select
                  required
                  value={waOrderForm.variantId}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, variantId: e.target.value })}
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                >
                  {adminProducts
                    .find((product) => product.id === waOrderForm.productId)
                    ?.variants.filter((variant) => variant.stock > 0).map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.label} · {formatINR(variant.price)} · {variant.stock} in stock
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={waOrderForm.quantity}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, quantity: Number(e.target.value) })}
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                />
                <select
                  value={waOrderForm.paymentStatus}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, paymentStatus: e.target.value as PaymentStatus })}
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                >
                  <option value="awaiting_verification">Awaiting Payment Verification</option>
                  <option value="paid">Paid (UPI / Transfer Verified)</option>
                </select>
                <label className="inline-flex items-center gap-2 text-xs text-[#2C1E16]">
                  <input
                    type="checkbox"
                    checked={waOrderForm.giftWrapSelected}
                    onChange={(e) => setWaOrderForm({ ...waOrderForm, giftWrapSelected: e.target.checked })}
                  />
                  Add signature gift packaging
                </label>
                <input
                  type="text"
                  value={waOrderForm.giftMessage}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, giftMessage: e.target.value })}
                  placeholder="Gift message (optional)"
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={waOrderForm.notes}
                  onChange={(e) => setWaOrderForm({ ...waOrderForm, notes: e.target.value })}
                  placeholder="Internal order notes (optional)"
                  className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                />
              </div>
              {waOrderAdditionalItems.map((item, index) => {
                const selectedProduct = adminProducts.find((product) => product.id === item.productId);
                const updateItem = (patch: Partial<typeof item>) => {
                  setWaOrderAdditionalItems((items) =>
                    items.map((current, currentIndex) =>
                      currentIndex === index ? { ...current, ...patch } : current
                    )
                  );
                };

                return (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 border-t border-[#2C1E16]/10 pt-3">
                    <select
                      required
                      aria-label={`Additional product ${index + 1}`}
                      value={item.productId}
                      onChange={(e) => {
                        const product = adminProducts.find((candidate) => candidate.id === e.target.value);
                        updateItem({
                          productId: e.target.value,
                          variantId: product?.variants.find((variant) => variant.stock > 0)?.id || '',
                        });
                      }}
                      className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                    >
                      {adminProducts
                        .filter(
                          (product) => !product.isArchived && product.variants.some((variant) => variant.stock > 0)
                        )
                        .map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                    </select>
                    <select
                      required
                      aria-label={`Additional variant ${index + 1}`}
                      value={item.variantId}
                      onChange={(e) => updateItem({ variantId: e.target.value })}
                      className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                    >
                      {selectedProduct?.variants
                        .filter((variant) => variant.stock > 0)
                        .map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.label} · {formatINR(variant.price)} · {variant.stock} in stock
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      required
                      aria-label={`Quantity for additional product ${index + 1}`}
                      value={item.quantity}
                      onChange={(e) => updateItem({ quantity: Number(e.target.value) })}
                      className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setWaOrderAdditionalItems((items) => items.filter((_, currentIndex) => currentIndex !== index))
                      }
                      className="text-left text-xs text-[#8C2F27] underline underline-offset-2"
                    >
                      Remove item
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                disabled={!adminProducts.some((product) => !product.isArchived && product.variants.some((variant) => variant.stock > 0))}
                onClick={() => {
                  const firstAvailable = adminProducts.find(
                    (product) => !product.isArchived && product.variants.some((variant) => variant.stock > 0)
                  );
                  if (!firstAvailable) return;
                  setWaOrderAdditionalItems((items) => [
                    ...items,
                    {
                      productId: firstAvailable.id,
                      variantId: firstAvailable.variants.find((variant) => variant.stock > 0)?.id || '',
                      quantity: 1,
                    },
                  ]);
                }}
                className="inline-flex items-center gap-1.5 border border-[#2C1E16]/20 px-3 py-2 text-xs text-[#2C1E16] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add another product
              </button>
              <button type="submit" className="bg-[#2C1E16] text-[#FAF7F2] px-5 py-2 text-xs uppercase cursor-pointer">
                Save WhatsApp Order
              </button>
            </form>
          )}

          <div className="space-y-3">
            {orders.map((ord) => (
              <div
                key={ord.id}
                aria-busy={savingOrderIds.has(ord.id)}
                className="p-4 border border-[#2C1E16]/12 bg-[#FAF7F2] space-y-3"
              >
                {savingOrderIds.has(ord.id) && (
                  <p role="status" className="text-[11px] text-[#8A6A32]">
                    Saving order changes…
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <strong className="font-serif text-lg text-[#2C1E16]">#{ord.orderNumber}</strong>
                    <span className="ml-2 uppercase tracking-wider text-[#B89352]">{ord.channel}</span>
                    <span className="ml-2 text-[#6B584C]">
                      {ord.address.fullName} · {ord.address.mobile}
                    </span>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#6B584C]">
                      {[ord.address.houseFlat, ord.address.street, ord.address.landmark, ord.address.city, ord.address.state]
                        .filter(Boolean)
                        .join(', ')}{' '}
                      {ord.address.pincode}
                      {ord.address.email ? ` · ${ord.address.email}` : ''}
                    </p>
                  </div>
                  <span className="font-semibold text-sm tabular-nums text-[#2C1E16]">{formatINR(ord.totalAmount)}</span>
                </div>

                <div className="text-xs text-[#6B584C]">
                  {ord.items.map((it) => `${it.productName} (${it.variantLabel}) × ${it.quantity}`).join(' · ')}
                  {ord.returnReason && <span className="block text-[#8C2F27] mt-1">Return Reason: {ord.returnReason}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-[#2C1E16]/8 text-xs">
                  <select
                    aria-label={`Order status for ${ord.orderNumber}`}
                    value={ord.orderStatus}
                    disabled={savingOrderIds.has(ord.id)}
                    onChange={(e) => void handleUpdateOrder(ord.id, { orderStatus: e.target.value as OrderStatus })}
                    className="bg-[#F4EFE6] border border-[#2C1E16]/15 px-2.5 py-1.5 disabled:cursor-wait disabled:opacity-60"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="return_requested">Return Requested</option>
                    <option value="refunded">Refunded</option>
                  </select>

                  <select
                    aria-label={`Payment status for ${ord.orderNumber}`}
                    value={ord.paymentStatus}
                    disabled={savingOrderIds.has(ord.id)}
                    onChange={(e) => void handleUpdateOrder(ord.id, { paymentStatus: e.target.value as PaymentStatus })}
                    className="bg-[#F4EFE6] border border-[#2C1E16]/15 px-2.5 py-1.5 disabled:cursor-wait disabled:opacity-60"
                  >
                    <option value="pending">Payment Pending</option>
                    <option value="awaiting_verification">Awaiting Verification</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>

                  <input
                    type="text"
                    defaultValue={ord.courierName || ''}
                    disabled={savingOrderIds.has(ord.id)}
                    onBlur={(e) => {
                      if (e.target.value !== (ord.courierName || '')) {
                        void handleUpdateOrder(ord.id, { courierName: e.target.value });
                      }
                    }}
                    placeholder="Courier (e.g. BlueDart)"
                    className="bg-[#FAF7F2] border border-[#2C1E16]/15 px-2.5 py-1.5 disabled:cursor-wait disabled:opacity-60"
                  />

                  <input
                    type="text"
                    defaultValue={ord.trackingNumber || ''}
                    disabled={savingOrderIds.has(ord.id)}
                    onBlur={(e) => {
                      if (e.target.value !== (ord.trackingNumber || '')) {
                        void handleUpdateOrder(ord.id, { trackingNumber: e.target.value });
                      }
                    }}
                    placeholder="Tracking Waybill #"
                    className="bg-[#FAF7F2] border border-[#2C1E16]/15 px-2.5 py-1.5 disabled:cursor-wait disabled:opacity-60"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUSTOMERS & ENQUIRIES TAB */}
      {tab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="font-serif text-2xl text-[#2C1E16]">
              WhatsApp Order Customers ({customersData.customers.length})
            </h2>
            <div className="divide-y divide-[#2C1E16]/10 border border-[#2C1E16]/12 bg-[#FAF7F2]">
              {customersData.customers.map((c) => (
                <div key={c.id} className="p-4 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-medium text-[#2C1E16] text-sm">{c.name}</p>
                    <p className="text-[#6B584C]">
                      {c.email} · {c.mobile}
                    </p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="font-semibold text-[#2C1E16]">{formatINR(c.totalSpent)}</p>
                    <p className="text-[#6B584C]">{c.ordersCount} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-2xl text-[#2C1E16]">Enquiries & Restock Requests ({customersData.enquiries.length})</h2>
            <div className="space-y-3">
              {customersData.enquiries.map((enq) => (
                <div key={enq.id} className="p-4 border border-[#2C1E16]/12 bg-[#FAF7F2] space-y-2 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="uppercase tracking-wider text-[#B89352]">{enq.type.replace('_', ' ')}</span>
                      <p className="font-medium text-sm text-[#2C1E16]">{enq.subject}</p>
                      <p className="text-[#6B584C]">
                        {enq.name} · {enq.email} {enq.mobile ? `· ${enq.mobile}` : ''}
                      </p>
                    </div>
                    <select
                      value={enq.status}
                      onChange={async (e) => {
                        await fetch(`/api/admin/enquiries/${enq.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: e.target.value }),
                        });
                        void loadAdminData();
                      }}
                      className="bg-[#F4EFE6] border border-[#2C1E16]/15 px-2 py-1"
                    >
                      <option value="open">Open</option>
                      <option value="responded">Responded</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <p className="text-[#6B584C]">{enq.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MARKETING TAB */}
      {tab === 'marketing' && (
        <div className="space-y-8">
          {/* Coupons */}
          <div className="p-5 border border-[#2C1E16]/12 bg-[#FAF7F2] space-y-4">
            <h2 className="font-serif text-2xl text-[#2C1E16]">Coupons & Offers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {marketingData.coupons.map((c) => (
                <div key={c.id} className="p-3.5 bg-[#F4EFE6]/70 border border-[#2C1E16]/10 flex justify-between items-start text-xs">
                  <div>
                    <strong className="text-sm text-[#2C1E16]">{c.code}</strong>
                    <p className="text-[#6B584C] mt-0.5">{c.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE' });
                      void loadAdminData();
                    }}
                    className="text-[#6B584C] hover:text-[#8C2F27] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await fetch('/api/admin/coupons', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(couponForm),
                });
                setCouponForm({ code: '', description: '', discountType: 'percentage', discountValue: 10, minOrderAmount: 1000 });
                void loadAdminData();
                notify('Coupon created.', 'success');
              }}
              className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2"
            >
              <input
                type="text"
                required
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                placeholder="CODE"
                className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs uppercase"
              />
              <select
                value={couponForm.discountType}
                onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as 'percentage' | 'flat' })}
                className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
              >
                <option value="percentage">% Off</option>
                <option value="flat">Flat ₹ Off</option>
              </select>
              <input
                type="number"
                value={couponForm.discountValue}
                onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                placeholder="Value"
                className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
              />
              <input
                type="number"
                value={couponForm.minOrderAmount}
                onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })}
                placeholder="Min ₹"
                className="bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-xs"
              />
              <button type="submit" className="bg-[#2C1E16] text-[#FAF7F2] px-4 py-2 text-xs uppercase cursor-pointer">
                Create Coupon
              </button>
            </form>
          </div>

          {/* Banners */}
          {bannersForm && (
            <form onSubmit={handleSaveBanners} className="p-5 border border-[#2C1E16]/12 bg-[#FAF7F2] space-y-3">
              <h2 className="font-serif text-2xl text-[#2C1E16]">Homepage Banners & Copy</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[#6B584C] mb-1">Hero Headline</label>
                  <input
                    type="text"
                    value={bannersForm.heroHeadline}
                    onChange={(e) => setBannersForm({ ...bannersForm, heroHeadline: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[#6B584C] mb-1">Campaign Title</label>
                  <input
                    type="text"
                    value={bannersForm.campaignTitle}
                    onChange={(e) => setBannersForm({ ...bannersForm, campaignTitle: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2"
                  />
                </div>
              </div>
              <button type="submit" className="bg-[#2C1E16] text-[#FAF7F2] px-5 py-2 text-xs uppercase cursor-pointer">
                Save Banners
              </button>
            </form>
          )}

        </div>
      )}

      {/* BUSINESS SETTINGS TAB */}
      {tab === 'settings' && settingsForm && (
        <form onSubmit={handleSaveSettings} className="p-6 border border-[#2C1E16]/12 bg-[#FAF7F2] space-y-6">
          <h2 className="font-serif text-2xl text-[#2C1E16]">Business, WhatsApp, Shipping & Policy Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label htmlFor="set-wa" className="block text-[#6B584C] mb-1">
                WhatsApp Ordering Number (with country code)
              </label>
              <input
                id="set-wa"
                type="text"
                value={settingsForm.whatsappNumber}
                onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[#6B584C] mb-1">Support Email</label>
              <input
                type="email"
                value={settingsForm.supportEmail}
                onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[#6B584C] mb-1">Instagram URL</label>
              <input
                type="url"
                value={settingsForm.instagramUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[#6B584C] mb-1">Free Shipping Threshold (₹)</label>
              <input
                type="number"
                value={settingsForm.freeShippingThreshold}
                onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })}
                className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[#6B584C] mb-1">Standard Shipping Fee (₹)</label>
              <input
                type="number"
                value={settingsForm.standardShippingFee}
                onChange={(e) => setSettingsForm({ ...settingsForm, standardShippingFee: Number(e.target.value) })}
                className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[#6B584C] mb-1">GST Rate (%)</label>
              <input
                type="number"
                value={settingsForm.gstRatePercent}
                onChange={(e) => setSettingsForm({ ...settingsForm, gstRatePercent: Number(e.target.value) })}
                className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settingsForm.whatsappOrderingEnabled}
                onChange={(e) => setSettingsForm({ ...settingsForm, whatsappOrderingEnabled: e.target.checked })}
              />
              <span>Show Floating WhatsApp Concierge</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#6B584C] mb-1">Shipping Policy</label>
              <textarea
                rows={3}
                value={settingsForm.policies.shipping}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    policies: { ...settingsForm.policies, shipping: e.target.value },
                  })
                }
                className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 p-2.5"
              />
            </div>
            <div>
              <label className="block text-[#6B584C] mb-1">Returns & Refund Policy</label>
              <textarea
                rows={3}
                value={settingsForm.policies.returns}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    policies: { ...settingsForm.policies, returns: e.target.value },
                  })
                }
                className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 p-2.5"
              />
            </div>
          </div>

          <button type="submit" className="bg-[#2C1E16] text-[#FAF7F2] px-6 py-3 text-xs uppercase tracking-widest cursor-pointer">
            Save All Business Settings
          </button>
        </form>
      )}
    </div>
  );
};
