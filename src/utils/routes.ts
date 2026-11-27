const CATEGORY_ROUTE_ALIASES = new Set([
  'curated-fragrances',
  'scented-candles',
  'sculptural-candles',
  'diy-colouring-kits',
]);

export function getLegacyCategorySlug(pathname: string): string | null {
  const slug = pathname.replace(/^\/|\/$/g, '');
  return CATEGORY_ROUTE_ALIASES.has(slug) ? slug : null;
}
