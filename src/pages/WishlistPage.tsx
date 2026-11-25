import React from 'react';
import { useStore } from '../context/StoreContext';
import { SeoHead } from '../components/SeoHead';
import { ProductCard } from '../components/ProductCard';
import { SEO_PAGES } from '../utils/seo';

export const WishlistPage: React.FC = () => {
  const { products, wishlist, navigate } = useStore();
  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <SeoHead {...SEO_PAGES.wishlist} />

      <div className="border-b border-[#2C1E16]/12 pb-6 mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-[#6B584C]">Saved Selections</p>
        <h1 className="font-serif text-4xl text-[#2C1E16] mt-1">Your Wishlist ({savedProducts.length})</h1>
      </div>

      {savedProducts.length === 0 ? (
        <div className="py-16 text-center bg-[#F4EFE6]/50 border border-[#2C1E16]/10 space-y-4">
          <p className="font-serif text-2xl text-[#2C1E16]">No saved creations yet</p>
          <p className="text-sm text-[#6B584C] max-w-md mx-auto">
            Tap the heart icon on any candle, Eau de Parfum, or gift coffret to keep it here for later.
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="bg-[#2C1E16] text-[#FAF7F2] px-7 py-3 text-xs uppercase tracking-widest cursor-pointer"
          >
            Explore Catalogue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {savedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};
