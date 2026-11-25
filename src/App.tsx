import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Preloader } from './components/Preloader';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { OfflineIndicator, PWAInstallPrompt } from './components/PWAComponents';
import { HomePage } from './pages/HomePage';
import { CollectionsPage } from './pages/CollectionsPage';
import { GiftingPage } from './pages/GiftingPage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { WishlistPage } from './pages/WishlistPage';
import { AboutPage, ContactPage, FaqPage, GrievancePage, PolicyPage } from './pages/EditorialPages';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const AppRouter: React.FC = () => {
  const { path } = useStore();
  const pathname = path.split('?')[0].replace(/\/+$/, '') || '/';

  let page: React.ReactNode;
  if (pathname === '/') {
    page = <HomePage />;
  } else if (pathname === '/collections') {
    page = <CollectionsPage />;
  } else if (pathname === '/gifting') {
    page = <GiftingPage />;
  } else if (pathname === '/shop') {
    page = <ShopPage />;
  } else if (/^\/(curated-fragrances|scented-candles|sculptural-candles|diy-colouring-kits|gifting)$/.test(pathname)) {
    const slug = pathname.slice(1);
    window.history.replaceState({}, '', `/shop?category=${slug}`);
    page = <ShopPage />;
  } else if (pathname.startsWith('/product/')) {
    const slug = pathname.slice('/product/'.length);
    page = <ProductDetailPage slug={slug} />;
  } else if (pathname === '/cart') {
    page = <CartPage />;
  } else if (pathname === '/checkout') {
    page = <CheckoutPage />;
  } else if (pathname === '/account') {
    page = <ContactPage />;
  } else if (pathname === '/wishlist') {
    page = <WishlistPage />;
  } else if (pathname === '/about') {
    page = <AboutPage />;
  } else if (pathname === '/contact') {
    page = <ContactPage />;
  } else if (pathname === '/faq') {
    page = <FaqPage />;
  } else if (pathname === '/shipping-policy') {
    page = <PolicyPage kind="shipping" />;
  } else if (pathname === '/returns-policy') {
    page = <PolicyPage kind="returns" />;
  } else if (pathname === '/privacy-policy') {
    page = <PolicyPage kind="privacy" />;
  } else if (pathname === '/terms') {
    page = <PolicyPage kind="terms" />;
  } else if (pathname === '/grievance-redressal') {
    page = <GrievancePage />;
  } else if (pathname === '/admin') {
    page = <AdminDashboardPage />;
  } else {
    page = <HomePage />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF7F2] text-[#2C1E16]">
      <Navbar />
      <main className="flex-1">{page}</main>
      <Footer />
      <CartDrawer />
      <MobileBottomNav />
      <OfflineIndicator />
      {!path.startsWith('/admin') && <PWAInstallPrompt />}
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <Preloader />
      <AppRouter />
    </StoreProvider>
  );
}
