import React, { useEffect } from 'react';
import { absolutePublicUrl, canonicalUrl } from '../utils/seo';

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const FALLBACK_SOCIAL_IMAGE = '/brand/eramora/campaigns/brand-introduction.jpg';

function resolveSocialImage(image: string): string {
  return (
    absolutePublicUrl(image) ||
    absolutePublicUrl(FALLBACK_SOCIAL_IMAGE) ||
    'https://eramora.in/brand/eramora/campaigns/brand-introduction.jpg'
  );
}

export const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  canonicalPath,
  image = FALLBACK_SOCIAL_IMAGE,
  noIndex = false,
  structuredData,
}) => {
  useEffect(() => {
    document.title = title;

    const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    const imageUrl = resolveSocialImage(image);
    setMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl);

    const pageCanonicalUrl = canonicalUrl(canonicalPath ?? window.location.pathname);
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', pageCanonicalUrl);
    setMeta('meta[property="og:url"]', 'property', 'og:url', pageCanonicalUrl);
    const isProductPage =
      Array.isArray(structuredData) &&
      structuredData.some((entry) => entry['@type'] === 'Product');
    setMeta('meta[property="og:type"]', 'property', 'og:type', isProductPage ? 'product' : 'website');

    const existingScript = document.getElementById('eramora-dynamic-jsonld');
    if (existingScript) existingScript.remove();
    if (structuredData) {
      const script = document.createElement('script');
      script.id = 'eramora-dynamic-jsonld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      const s = document.getElementById('eramora-dynamic-jsonld');
      if (s) s.remove();
    };
  }, [title, description, canonicalPath, image, noIndex, structuredData]);

  return null;
};
