import React, { useState } from 'react';

interface BrandLogoProps {
  variant?: 'inline' | 'stacked' | 'emblem';
  light?: boolean;
  className?: string;
  imgClassName?: string;
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'inline',
  light = false,
  className = '',
  imgClassName = '',
  alt = 'ERAMORA — Where Fragrance Meets Emotion',
}) => {
  const [hasError, setHasError] = useState(false);

  // SVG Fallback in case of offline/network failure
  const strokeColor = light ? '#FAF7F2' : '#2C1E16';
  const accentColor = '#C5A059';

  const svgFallback = (
    <span className={`inline-flex ${variant === 'stacked' ? 'flex-col items-center' : 'items-center'} gap-2 ${className}`}>
      <svg
        viewBox="0 0 64 48"
        className={variant === 'stacked' ? 'w-11 h-9' : 'w-7 h-6'}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M32 6 C37 14 37 25 32 33 C27 25 27 14 32 6 Z"
          stroke={strokeColor}
          strokeWidth="1.6"
          fill={accentColor}
          fillOpacity="0.16"
        />
        <path d="M27 26 C18 16 9 20 11 30 C18 34 24 32 27 26 Z" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M37 26 C46 16 55 20 53 30 C46 34 40 32 37 26 Z" stroke={strokeColor} strokeWidth="1.5" />
        <path d="M22 31 C12 30 6 35 11 40 C18 41 22 37 22 31 Z" stroke={strokeColor} strokeWidth="1.4" />
        <path d="M42 31 C52 30 58 35 53 40 C46 41 42 37 42 31 Z" stroke={strokeColor} strokeWidth="1.4" />
        <path d="M18 42 Q32 46 46 42" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span
        className={`font-serif tracking-[0.22em] font-medium uppercase whitespace-nowrap ${
          variant === 'stacked' ? 'text-2xl mt-1' : 'text-xl md:text-2xl'
        } ${light ? 'text-[#FAF7F2]' : 'text-[#2C1E16]'}`}
      >
        ERAMORA
      </span>
      {variant === 'stacked' && (
        <span className={`text-[11px] tracking-[0.14em] uppercase ${light ? 'text-[#FAF7F2]/75' : 'text-[#6B584C]'}`}>
          Where Fragrance Meets Emotion.
        </span>
      )}
    </span>
  );

  if (hasError) {
    return svgFallback;
  }

  // Official Approved Brand Assets from Kit
  let src = '';
  let defaultClasses = '';

  if (variant === 'stacked') {
    src = light
      ? '/brand/eramora/ERAMORA_Primary_Ivory.png'
      : '/brand/eramora/ERAMORA_Primary_Transparent.png';
    defaultClasses = 'h-16 sm:h-20 md:h-22 w-auto object-contain';
  } else if (variant === 'emblem') {
    src = '/brand/eramora/ERAMORA_Approved_Lotus_Transparent.png';
    defaultClasses = 'h-7 sm:h-8 md:h-9 w-auto object-contain';
  } else {
    // Inline / Horizontal Logo for Header & Navigation
    src = light
      ? '/brand/eramora/ERAMORA_Horizontal_Ivory.png'
      : '/brand/eramora/ERAMORA_Header_Logo_Transparent.png';
    defaultClasses = 'h-auto w-[148px] sm:w-[176px] md:w-[204px] xl:w-[220px] object-contain';
  }

  return (
    <span className={`inline-flex items-center shrink-0 ${className}`}>
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className={`${defaultClasses} ${imgClassName}`}
        loading="eager"
        decoding="async"
      />
    </span>
  );
};
