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
import { formatINR } from '../utils/commerce';
import { SEO_PAGES } from '../utils/seo';
import type {
  BannerConfig,
  BusinessSettings,
  Category,
  Product,
} from '../types/store';

type AdminTab = 'products' | 'announcement' | 'banners' | 'settings';

export const AdminDashboardPage: React.FC = () => {
  const { user, login, logout, navigate, refreshCatalog, refreshConfig, categories, notify } = useStore();
  const productImageInputRef = useRef<HTMLInputElement>(null);
  const editProductImageInputRef = useRef<HTMLInputElement>(null);

  // Admin Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState<AdminTab>('products');
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState('all');

  const [settingsForm, setSettingsForm] = useState<BusinessSettings | null>(null);
  const [bannersForm, setBannersForm] = useState<BannerConfig | null>(null);

  // Product editor state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const defaultProductImage = '/brand/eramora/campaigns/fragrance-art.jpg';
  const [prodForm, setProdForm] = useState({
    name: '',
    subtitle: '',
    categoryId: '',
    description: '',
    variantLabel: '220g Amber Jar',
    variantSize: '220g',
    price: '',
    compareAtPrice: 0,
    stock: 0,
    sku: '',
    images: [defaultProductImage],
    isShowcaseDemo: true,
    isFeatured: false,
    isBestseller: false,
    isNewArrival: false,
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

  const loadAdminData = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const [prodRes, cfgRes, settingsRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/config/public'),
        fetch('/api/admin/settings'),
      ]);
      if (prodRes.ok) {
        const prods = (await prodRes.json()) as Product[];
        setAdminProducts(prods);
      }
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        setBannersForm(cfg.banners as BannerConfig);
      }
      if (settingsRes.ok) {
        setSettingsForm((await settingsRes.json()) as BusinessSettings);
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
        <SeoHead {...SEO_PAGES.admin} />
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
                className="w-full min-h-11 bg-[#FAF7F2] border border-[#2C1E16]/20 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352]"
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
                className="w-full min-h-11 bg-[#FAF7F2] border border-[#2C1E16]/20 px-3.5 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352]"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full min-h-11 bg-[#2C1E16] text-[#FAF7F2] py-3 text-xs uppercase tracking-[0.16em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] disabled:cursor-wait disabled:opacity-70 cursor-pointer"
            >
              {loggingIn ? 'Signing In...' : 'Enter Dashboard'}
            </button>
          </form>

          <div className="pt-4 border-t border-[#2C1E16]/10 flex items-center justify-end text-xs text-[#6B584C]">
            <button type="button" onClick={() => navigate('/')} className="min-h-11 hover:text-[#2C1E16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] cursor-pointer">
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
              price: Number(prodForm.price) || 0,
              compareAtPrice: prodForm.compareAtPrice > 0 ? Number(prodForm.compareAtPrice) : undefined,
              stock: Number(prodForm.stock),
              sku: prodForm.sku.trim(),
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
      setProdForm((p) => ({
        ...p,
        name: '',
        subtitle: '',
        description: '',
        variantLabel: '220g Amber Jar',
        variantSize: '220g',
        price: '',
        compareAtPrice: 0,
        stock: 0,
        sku: '',
        images: [defaultProductImage],
        isShowcaseDemo: true,
        isFeatured: false,
        isBestseller: false,
        isNewArrival: false,
        seoTitle: '',
        seoDescription: '',
      }));
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

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = window.confirm(
      `Permanently delete "${product.name}"? This cannot be undone. Choose Archive to hide it reversibly.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/products/${product.id}?permanent=true`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        notify(data.error || 'Could not permanently delete product.', 'error');
        return;
      }
      notify('Product permanently deleted.', 'success');
      await Promise.all([loadAdminData(), refreshCatalog()]);
    } catch {
      notify('Could not delete product. Check your connection and try again.', 'error');
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
      <SeoHead {...SEO_PAGES.admin} />

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
            ['banners', 'Banners'],
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
                    required={!prodForm.isShowcaseDemo}
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
                  <label htmlFor="new-product-variant-size" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    Variant size *
                  </label>
                  <input
                    id="new-product-variant-size"
                    type="text"
                    required
                    value={prodForm.variantSize}
                    onChange={(e) => setProdForm({ ...prodForm, variantSize: e.target.value })}
                    placeholder="e.g. 50 ml"
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new-product-price" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    Price (INR) {prodForm.isShowcaseDemo ? '(optional for demo)' : '*'}
                  </label>
                  <input
                    id="new-product-price"
                    type="number"
                    required={!prodForm.isShowcaseDemo}
                    min={prodForm.isShowcaseDemo ? 0 : 1}
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="new-product-sku" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    SKU {prodForm.isShowcaseDemo ? '(optional for demo)' : '*'}
                  </label>
                  <input
                    id="new-product-sku"
                    type="text"
                    required={!prodForm.isShowcaseDemo}
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    placeholder="Enter approved SKU"
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
                  required={!prodForm.isShowcaseDemo}
                  minLength={prodForm.isShowcaseDemo ? undefined : 40}
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
                  <span>Showcase demo (not for sale)</span>
                </label>
              </div>
              <p className="text-xs leading-relaxed text-[#6B584C]">
                New products start as demo concepts with zero stock and are excluded from search indexing. Only
                uncheck this after the product details, price, and availability have been approved.
              </p>

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
              {!prodForm.isShowcaseDemo && !prodForm.images.some((image) =>
                /^\/uploads\/[A-Za-z0-9._-]+$/.test(image)
              ) && (
                <p className="text-xs text-[#8A3D2D]" role="alert">
                  Upload at least one product-specific image before publishing; campaign artwork is not accepted.
                </p>
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
                  <label htmlFor="edit-product-category" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    Category
                  </label>
                  <select
                    id="edit-product-category"
                    value={editingProduct.categoryId}
                    onChange={(e) => {
                      const category = categories.find((entry) => entry.id === e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        categoryId: e.target.value,
                        categoryName: category?.name || editingProduct.categoryName,
                      });
                    }}
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
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
                <div>
                  <label htmlFor="edit-product-seo-keywords" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                    SEO keywords (comma separated)
                  </label>
                  <input
                    id="edit-product-seo-keywords"
                    type="text"
                    value={(editingProduct.seoKeywords || []).join(', ')}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      seoKeywords: e.target.value.split(',').map((keyword) => keyword.trim()).filter(Boolean),
                    })}
                    className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="edit-product-image-alt" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                  Product image alt text
                </label>
                <input
                  id="edit-product-image-alt"
                  type="text"
                  value={editingProduct.imageAlt || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageAlt: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="edit-product-description" className="mb-1.5 block text-xs font-medium text-[#6B584C]">
                  Product description
                </label>
                <textarea
                  id="edit-product-description"
                  rows={4}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wider text-[#6B584C]">Product images</p>
                  <button
                    type="button"
                    disabled={isUploadingImage}
                    aria-busy={isUploadingImage}
                    onClick={() => editProductImageInputRef.current?.click()}
                    className="inline-flex items-center gap-2 border border-[#2C1E16]/20 px-3 py-2 bg-[#FAF7F2] text-xs disabled:cursor-wait disabled:opacity-60"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    {isUploadingImage ? 'Uploading image…' : 'Upload product image'}
                  </button>
                  <input
                    ref={editProductImageInputRef}
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
                </div>
                {editingProduct.images.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {editingProduct.images.map((image, index) => (
                      <div key={`${image}-${index}`} className="space-y-1">
                        <img
                          src={image}
                          alt={`Product image ${index + 1}`}
                          className="h-20 w-20 border border-[#2C1E16]/15 object-cover"
                        />
                        <button
                          type="button"
                          aria-label={`Remove product image ${index + 1}`}
                          onClick={() => setEditingProduct({
                            ...editingProduct,
                            images: editingProduct.images.filter((_, imageIndex) => imageIndex !== index),
                          })}
                          className="text-xs text-[#8A3D2D] underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {!editingProduct.isShowcaseDemo && !editingProduct.images.some((image) =>
                  /^\/uploads\/[A-Za-z0-9._-]+$/.test(image)
                ) && (
                  <p className="text-xs text-[#8A3D2D]" role="alert">
                    Upload a product-specific image before publishing; campaign artwork is not accepted.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-[#6B584C]">Variants & Stock</p>
                {editingProduct.variants.map((v, idx) => (
                  <div key={v.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
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
                      <label htmlFor={`edit-variant-size-${idx}`} className="mb-1 block text-xs text-[#6B584C]">
                        Variant size
                      </label>
                      <input
                        id={`edit-variant-size-${idx}`}
                        type="text"
                        value={v.size}
                        onChange={(e) => {
                          const vars = [...editingProduct.variants];
                          vars[idx] = { ...v, size: e.target.value };
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
                      <label htmlFor={`edit-variant-sku-${idx}`} className="mb-1 block text-xs text-[#6B584C]">
                        SKU
                      </label>
                      <input
                        id={`edit-variant-sku-${idx}`}
                        type="text"
                        value={v.sku}
                        onChange={(e) => {
                          const vars = [...editingProduct.variants];
                          vars[idx] = { ...v, sku: e.target.value };
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                        className="w-full bg-[#FAF7F2] border border-[#2C1E16]/20 px-2.5 py-1.5 text-xs"
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
                        <button
                          type="button"
                          aria-label={`Permanently delete ${p.name}`}
                          onClick={() => void handleDeleteProduct(p)}
                          className="inline-flex items-center gap-1 text-[#8C2F27] hover:text-[#6F211B] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89352] focus-visible:ring-offset-2"
                        >
                          <Trash2 aria-hidden="true" className="w-3 h-3" />
                          <span>Delete</span>
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
                        const response = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' });
                        if (!response.ok) {
                          const result = (await response.json()) as { error?: string };
                          notify(result.error || 'Could not remove category.', 'error');
                          return;
                        }
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

      {tab === 'banners' && bannersForm && (
        <div className="space-y-8">
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
        </div>
      )}

      {/* BUSINESS SETTINGS TAB */}
      {tab === 'settings' && settingsForm && (
        <form onSubmit={handleSaveSettings} className="p-6 border border-[#2C1E16]/12 bg-[#FAF7F2] space-y-6">
          <h2 className="font-serif text-2xl text-[#2C1E16]">Business & Contact Settings</h2>

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

          <button type="submit" className="bg-[#2C1E16] text-[#FAF7F2] px-6 py-3 text-xs uppercase tracking-widest cursor-pointer">
            Save Contact Settings
          </button>
        </form>
      )}
    </div>
  );
};
