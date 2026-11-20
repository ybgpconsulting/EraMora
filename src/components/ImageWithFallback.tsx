import React, { useState } from 'react';

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fallbackTitle?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fallbackTitle,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-[#F4EFE6] text-[#6B584C] p-6 text-center ${className}`}
      >
        <svg viewBox="0 0 64 48" className="w-10 h-8 mb-2 opacity-50" fill="none" aria-hidden="true">
          <path d="M32 8 C36 16 36 25 32 32 C28 25 28 16 32 8 Z" stroke="#2C1E16" strokeWidth="1.4" />
          <path d="M27 25 C19 17 11 21 13 29 C19 33 25 31 27 25 Z" stroke="#2C1E16" strokeWidth="1.4" />
          <path d="M37 25 C45 17 53 21 51 29 C45 33 39 31 37 25 Z" stroke="#2C1E16" strokeWidth="1.4" />
          <path d="M20 39 Q32 43 44 39" stroke="#C5A059" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="font-serif text-sm tracking-wide text-[#2C1E16]">
          {fallbackTitle || 'ERAMORA Atelier'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
