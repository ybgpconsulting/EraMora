import { base64ToBytes, randomHex } from './crypto';
import {
  getDb,
  initDb,
  sanitizeString,
  saveDb,
  signSessionToken,
  verifySessionToken,
  SESSION_COOKIE,
} from './db';
import type { Env } from './env';
import {
  HttpError,
  HttpResponse,
  Router,
  parseCookies,
  rateLimit,
  requireAdmin,
  isSameOriginMutation,
  withSecurityHeaders,
  type RequestContext,
} from './http';
import {
  DEFAULT_ADMIN_HASH,
  hashPassword,
  normalizeSeededSampleProduct,
  SAMPLE_CONCEPT_DESCRIPTION,
  SAMPLE_CONCEPT_SEO_DESCRIPTION,
  SAMPLE_CONCEPT_SUBTITLE,
  verifyPassword,
} from './seed';
import { isScannerProbePath } from './scanner-guard';
import { ERAMORA_FAQS } from '../src/content/faqs';
import {
  absolutePublicUrl,
  canonicalUrl,
  createFaqStructuredData,
  createProductStructuredData,
  getProductSeoDescription,
  SEO_PAGES,
  type PageSeoMetadata,
} from '../src/utils/seo';
import type {
  Category,
  Product,
  ProductVariant,
} from '../src/types/store';

const router = new Router();

function parseProductVariants(value: unknown, allowUnpriced = false): ProductVariant[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 30) return null;

  const variants: ProductVariant[] = [];
  const ids = new Set<string>();
  const skus = new Set<string>();

  for (const entry of value) {
    if (!entry || typeof entry !== 'object') return null;
    const candidate = entry as Record<string, unknown>;
    const label = sanitizeString(candidate.label, 120);
    const size = sanitizeString(candidate.size, 80);
    const price = typeof candidate.price === 'number' ? candidate.price : Number.NaN;
    const stock = typeof candidate.stock === 'number' ? candidate.stock : Number.NaN;
    const id = sanitizeString(candidate.id, 80) || `var-${randomHex(3)}`;
    const sku = sanitizeString(candidate.sku, 80);
    const compareAtPrice =
      candidate.compareAtPrice === undefined || candidate.compareAtPrice === null || candidate.compareAtPrice === ''
        ? undefined
        : typeof candidate.compareAtPrice === 'number'
          ? candidate.compareAtPrice
          : Number.NaN;

    if (
      !label ||
      !size ||
      !Number.isFinite(price) ||
      price < 0 ||
      (price === 0 && !allowUnpriced) ||
      price > 10_000_000 ||
      !Number.isSafeInteger(stock) ||
      stock < 0 ||
      stock > 1_000_000 ||
      (!allowUnpriced && !sku) ||
      (compareAtPrice !== undefined &&
        (!Number.isFinite(compareAtPrice) || compareAtPrice <= price || compareAtPrice > 10_000_000)) ||
      ids.has(id) ||
      (Boolean(sku) && skus.has(sku))
    ) {
      return null;
    }

    ids.add(id);
    if (sku) skus.add(sku);
    variants.push({ id, label, size, price, compareAtPrice, stock, sku });
  }

  return variants;
}

function parseProductImages(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 12) return null;
  const images: string[] = [];
  for (const entry of value) {
    const image = sanitizeString(entry, 500);
    if (
      !image ||
      image.startsWith('//') ||
      (!image.startsWith('/') && !/^https:\/\//i.test(image))
    ) {
      return null;
    }
    images.push(image);
  }
  return images;
}

function containsOnlyGenericCampaignImages(images: string[]): boolean {
  return images.every((image) => {
    try {
      return new URL(image, 'https://eramora.in').pathname.toLowerCase().startsWith('/brand/eramora/campaigns/');
    } catch {
      return true;
    }
  });
}

async function hasStoredProductImage(env: Env, images: string[]): Promise<boolean> {
  for (const image of images) {
    const match = /^\/uploads\/([A-Za-z0-9._-]+)$/.exec(image);
    if (!match) continue;

    if (env.FILES && await env.FILES.head(match[1])) return true;

    const media = await env.DB.prepare('SELECT key FROM media WHERE key = ?')
      .bind(match[1])
      .first<{ key: string }>();
    if (media) return true;
  }
  return false;
}

interface CommercialProductInput {
  name: string;
  subtitle: string;
  description: string;
  category: Category;
  images: string[];
  variants: ProductVariant[];
}

async function validateCommercialProductInput(
  body: Partial<Product>,
  categories: Category[],
  env: Env
): Promise<{ input: CommercialProductInput; error?: never } | { input?: never; error: string }> {
  const name = sanitizeString(body.name, 140);
  if (!name) return { error: 'Enter a valid product name before publishing.' };

  const categoryId = sanitizeString(body.categoryId, 120);
  const category = categories.find((entry) => entry.id === categoryId);
  if (!category) return { error: 'Choose a valid product category before publishing.' };

  const subtitle = sanitizeString(body.subtitle, 160);
  const description = sanitizeString(body.description, 2000);
  if (!subtitle || subtitle === SAMPLE_CONCEPT_SUBTITLE || description.length < 40 ||
    description === SAMPLE_CONCEPT_DESCRIPTION) {
    return { error: 'Add complete, approved product details before publishing.' };
  }

  const images = parseProductImages(body.images);
  if (
    !images ||
    containsOnlyGenericCampaignImages(images) ||
    !(await hasStoredProductImage(env, images))
  ) {
    return { error: 'Upload at least one valid product-specific image before publishing.' };
  }

  const variants = parseProductVariants(body.variants, false);
  if (!variants) {
    return { error: 'Add at least one variant with a positive price, valid stock, label, size, and SKU.' };
  }

  return { input: { name, subtitle, description, category, images, variants } };
}

function isEligibleForPublicListing(product: Product): boolean {
  if (product.isShowcaseDemo) return true;

  const images = parseProductImages(product.images);
  return Boolean(
    sanitizeString(product.name, 140) &&
      sanitizeString(product.subtitle, 160) &&
      sanitizeString(product.description, 2000).length >= 40 &&
      sanitizeString(product.categoryId, 120) &&
      sanitizeString(product.categoryName, 80) &&
      images &&
      !containsOnlyGenericCampaignImages(images) &&
      parseProductVariants(product.variants, false)
  );
}

function normalizeDemoProduct(product: Product): Product {
  return normalizeSeededSampleProduct({
    ...product,
    subtitle: SAMPLE_CONCEPT_SUBTITLE,
    description: SAMPLE_CONCEPT_DESCRIPTION,
    specifications: {},
    fragranceNotes: undefined,
    ingredientsOrMaterials: '',
    variants: (Array.isArray(product.variants) ? product.variants : []).map((variant) => ({
      id: variant.id,
      label: variant.label,
      size: variant.size,
      price: 0,
      stock: 0,
      sku: '',
    })),
    badges: [],
    isShowcaseDemo: true,
    isFeatured: false,
    isBestseller: false,
    isNewArrival: false,
    ratingAverage: 0,
    reviewCount: 0,
    seoTitle: `${product.name} | ERAMORA Sample Concept`,
    seoDescription: SAMPLE_CONCEPT_SEO_DESCRIPTION,
  });
}

function matchesImageSignature(bytes: Uint8Array, extension: string): boolean {
  if (extension === 'png') {
    return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  }
  if (extension === 'jpg' || extension === 'jpeg') {
    return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  }
  return (
    extension === 'webp' &&
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  );
}

function setSessionCookie(res: HttpResponse, token: string, secure: boolean): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: '/',
  });
}

// ---------- PUBLIC CONFIG & SEO ----------
router.get('/api/config/public', (_req, res) => {
  const db = getDb();
  res.json({
    settings: { ...db.settings, studioAddress: '' },
    banners: db.banners,
  });
});

// ---------- CATALOGUE ----------
router.get('/api/categories', (_req, res) => {
  const db = getDb();
  const sorted = [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  res.json(sorted);
});

router.get('/api/products', (req, res) => {
  const db = getDb();
  const category = typeof req.query.category === 'string' ? req.query.category.toLowerCase() : '';
  const q = typeof req.query.q === 'string' ? req.query.q.toLowerCase().trim() : '';
  const minPrice = Number(req.query.minPrice || 0);
  const maxPrice = Number(req.query.maxPrice || 0);
  const inStockOnly = req.query.inStock === 'true';
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'featured';

  let list = db.products.filter((product) => !product.isArchived && isEligibleForPublicListing(product));

  if (category && category !== 'all') {
    list = list.filter(
      (p) =>
        p.categoryId === category ||
        p.categoryName.toLowerCase().replace(/\s+/g, '-') === category ||
        p.categoryName.toLowerCase() === category
    );
  }

  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (minPrice > 0) {
    list = list.filter((p) => Math.min(...p.variants.map((v) => v.price)) >= minPrice);
  }
  if (maxPrice > 0) {
    list = list.filter((p) => Math.min(...p.variants.map((v) => v.price)) <= maxPrice);
  }
  if (inStockOnly) {
    list = list.filter((p) => p.variants.some((v) => v.stock > 0));
  }

  if (sort === 'price-asc') {
    list.sort(
      (a, b) => Math.min(...a.variants.map((v) => v.price)) - Math.min(...b.variants.map((v) => v.price))
    );
  } else if (sort === 'price-desc') {
    list.sort(
      (a, b) => Math.min(...b.variants.map((v) => v.price)) - Math.min(...a.variants.map((v) => v.price))
    );
  } else if (sort === 'latest') {
    list.sort(
      (a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0) || b.createdAt.localeCompare(a.createdAt)
    );
  } else if (sort === 'popular') {
    list.sort(
      (a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0) || b.ratingAverage - a.ratingAverage
    );
  } else {
    list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
  }

  res.json(list);
});

router.get('/api/products/:slug', (req, res) => {
  const db = getDb();
  const product = db.products.find(
    (candidate) =>
      candidate.slug === req.params.slug &&
      !candidate.isArchived &&
      isEligibleForPublicListing(candidate)
  );
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const related = db.products
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        !candidate.isArchived &&
        isEligibleForPublicListing(candidate) &&
        candidate.categoryId === product.categoryId
    )
    .slice(0, 3);
  const recommendations = db.products
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        !candidate.isArchived &&
        isEligibleForPublicListing(candidate) &&
        candidate.categoryId !== product.categoryId
    )
    .slice(0, 3);
  res.json({ product, related, recommendations });
});

// ---------- ADMIN AUTHENTICATION ----------
router.post(
  '/api/auth/login',
  rateLimit(5, 15 * 60_000),
  async (req, res) => {
    if (!req.env.SESSION_SECRET || req.env.SESSION_SECRET.length < 32) {
      return res.status(503).json({ error: 'Administrator session signing is not configured.' });
    }
    if (
      !req.env.ADMIN_DEMO_PASSWORD ||
      req.env.ADMIN_DEMO_PASSWORD.length < 12 ||
      req.env.ADMIN_DEMO_PASSWORD.length > 256
    ) {
      return res.status(503).json({ error: 'Administrator access is not configured with a valid password.' });
    }

    const email = sanitizeString(req.body.email, 120).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (password.length > 256) return res.status(401).json({ error: 'Invalid administrator credentials.' });
    let user = getDb().users.find((u) => u.email === email);

    if (user?.passwordHash === DEFAULT_ADMIN_HASH) {
      const passwordHash = await hashPassword(req.env.ADMIN_DEMO_PASSWORD);
      await saveDb((draft) => {
        const admin = draft.users.find((candidate) => candidate.id === user?.id);
        if (admin?.passwordHash === DEFAULT_ADMIN_HASH) admin.passwordHash = passwordHash;
      });
      user = getDb().users.find((candidate) => candidate.email === email);
    }

    const passwordOk = user ? await verifyPassword(password, user.passwordHash) : false;

    if (!user || user.role !== 'admin' || !passwordOk) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    const token = await signSessionToken(req.env, { userId: user.id, role: user.role, email: user.email });
    setSessionCookie(
      res,
      token,
      req.env.ENVIRONMENT === 'production' || req.url.protocol === 'https:'
    );
    const { passwordHash: _ph, ...safeUser } = user;
    res.json({ user: safeUser });
  }
);

router.post('/api/auth/logout', (req, res) => {
  res.clearCookie(
    SESSION_COOKIE,
    req.env.ENVIRONMENT === 'production' || req.url.protocol === 'https:'
  );
  res.json({ ok: true });
});

router.get('/api/auth/me', (req, res) => {
  if (!req.session) return res.json({ user: null });
  const db = getDb();
  const user = db.users.find((u) => u.id === req.session?.userId);
  if (!user || user.role !== 'admin') return res.json({ user: null });
  const { passwordHash: _ph, ...safeUser } = user;
  res.json({ user: safeUser });
});

// ---------- ADMIN CATALOGUE MANAGEMENT ----------
router.get('/api/admin/products', requireAdmin, (_req, res) => {
  res.json(getDb().products);
});

router.post('/api/admin/products', requireAdmin, async (req, res) => {
  const body = req.body as Partial<Product>;
  const db = getDb();
  const isShowcaseDemo = body.isShowcaseDemo !== false;
  const publication = isShowcaseDemo
    ? undefined
    : await validateCommercialProductInput(body, db.categories, req.env);
  if (publication && !publication.input) {
    return res.status(400).json({ error: publication.error });
  }
  const commercialInput = publication && 'input' in publication ? publication.input : undefined;
  const name = commercialInput?.name || sanitizeString(body.name, 140);
  if (!name) return res.status(400).json({ error: 'Product name is required.' });
  const requestedCategory = body.categoryId
    ? db.categories.find((category) => category.id === body.categoryId)
    : undefined;
  if (body.categoryId && !requestedCategory) {
    return res.status(400).json({ error: 'Choose a valid product category.' });
  }
  const cat = commercialInput?.category || requestedCategory || db.categories[0];
  if (!cat) return res.status(400).json({ error: 'Create a category before adding products.' });
  const variants = commercialInput?.variants || (
    body.variants === undefined
      ? isShowcaseDemo
        ? [{ id: `var-${randomHex(3)}`, label: 'Sample variant', size: 'TBC', price: 0, stock: 0, sku: '' }]
        : null
      : parseProductVariants(body.variants, isShowcaseDemo)
  );
  if (!variants) return res.status(400).json({ error: 'Enter valid variant labels, prices, stock, and SKUs.' });
  const images = commercialInput?.images || (
    body.images === undefined
      ? ['/brand/eramora/campaigns/fragrance-art.jpg']
      : parseProductImages(body.images)
  );
  if (!images) return res.status(400).json({ error: 'Add between 1 and 12 valid product image URLs.' });
  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `creation-${randomHex(3)}`;
  const slug = db.products.some((p) => p.slug === slugBase) ? `${slugBase}-${randomHex(2)}` : slugBase;
  const now = new Date().toISOString();

  const newProduct: Product = {
    id: `prod-${randomHex(4)}`,
    slug,
    name,
    subtitle: commercialInput?.subtitle || SAMPLE_CONCEPT_SUBTITLE,
    categoryId: cat.id,
    categoryName: cat.name,
    description: commercialInput?.description || SAMPLE_CONCEPT_DESCRIPTION,
    specifications: isShowcaseDemo ? {} : body.specifications || {},
    fragranceNotes: isShowcaseDemo ? undefined : body.fragranceNotes,
    ingredientsOrMaterials: isShowcaseDemo ? '' : sanitizeString(body.ingredientsOrMaterials || '', 600),
    images,
    variants,
    badges: isShowcaseDemo ? [] : Array.isArray(body.badges) ? body.badges : [],
    isShowcaseDemo,
    isFeatured: !isShowcaseDemo && Boolean(body.isFeatured),
    isBestseller: !isShowcaseDemo && Boolean(body.isBestseller),
    isNewArrival: !isShowcaseDemo && Boolean(body.isNewArrival),
    isArchived: false,
    seoTitle: isShowcaseDemo
      ? `${name} | ERAMORA Sample Concept`
      : sanitizeString(body.seoTitle || `${name} | ERAMORA`, 120),
    seoDescription: isShowcaseDemo
      ? SAMPLE_CONCEPT_SEO_DESCRIPTION
      : sanitizeString(body.seoDescription || body.subtitle || '', 220),
    ratingAverage: 0,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await saveDb((draft) => {
    draft.products.unshift(newProduct);
  });
  res.status(201).json(newProduct);
});

router.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const body = req.body as Partial<Product>;
  const db = getDb();
  const existing = db.products.find((p) => p.id === id);
  if (!existing) return res.status(404).json({ error: 'Product not found.' });
  const isPublishing = existing.isShowcaseDemo && body.isShowcaseDemo === false;
  const publication = isPublishing
    ? await validateCommercialProductInput(body, db.categories, req.env)
    : undefined;
  if (publication && !publication.input) {
    return res.status(400).json({ error: publication.error });
  }
  if (body.name !== undefined && !sanitizeString(body.name, 140)) {
    return res.status(400).json({ error: 'Product name cannot be empty.' });
  }
  const allowUnpricedVariants =
    !isPublishing && (body.isShowcaseDemo === true || (body.isShowcaseDemo === undefined && existing.isShowcaseDemo));
  const variants =
    body.variants === undefined ? undefined : parseProductVariants(body.variants, allowUnpricedVariants);
  if (body.variants !== undefined && !variants) {
    return res.status(400).json({ error: 'Enter valid variant labels, prices, stock, and SKUs.' });
  }
  const images = body.images === undefined ? undefined : parseProductImages(body.images);
  if (body.images !== undefined && !images) {
    return res.status(400).json({ error: 'Add between 1 and 12 valid product image URLs.' });
  }

  await saveDb((draft) => {
    const target = draft.products.find((p) => p.id === id);
    if (!target) return;
    if (publication?.input) {
      target.name = publication.input.name;
      target.subtitle = publication.input.subtitle;
      target.description = publication.input.description;
      target.categoryId = publication.input.category.id;
      target.categoryName = publication.input.category.name;
      target.images = publication.input.images;
      target.variants = publication.input.variants;
    } else {
      if (body.name) target.name = sanitizeString(body.name, 140);
      if (body.subtitle !== undefined) target.subtitle = sanitizeString(body.subtitle, 160);
      if (body.description !== undefined) target.description = sanitizeString(body.description, 2000);
    }
    if (body.categoryId) {
      const cat = draft.categories.find((c) => c.id === body.categoryId);
      if (cat) {
        target.categoryId = cat.id;
        target.categoryName = cat.name;
      }
    }
    if (variants) target.variants = variants;
    if (images) target.images = images;
    if (Array.isArray(body.badges)) target.badges = body.badges;
    if (body.fragranceNotes !== undefined) target.fragranceNotes = body.fragranceNotes;
    if (body.ingredientsOrMaterials !== undefined) {
      target.ingredientsOrMaterials = sanitizeString(body.ingredientsOrMaterials, 600);
    }
    if (body.isShowcaseDemo !== undefined) target.isShowcaseDemo = Boolean(body.isShowcaseDemo);
    if (body.isFeatured !== undefined) target.isFeatured = Boolean(body.isFeatured);
    if (body.isBestseller !== undefined) target.isBestseller = Boolean(body.isBestseller);
    if (body.isNewArrival !== undefined) target.isNewArrival = Boolean(body.isNewArrival);
    if (body.isArchived !== undefined) target.isArchived = Boolean(body.isArchived);
    if (body.seoTitle !== undefined) target.seoTitle = sanitizeString(body.seoTitle, 120);
    if (body.seoDescription !== undefined) target.seoDescription = sanitizeString(body.seoDescription, 220);
    if (target.isShowcaseDemo) Object.assign(target, normalizeDemoProduct(target));
    target.updatedAt = new Date().toISOString();
  });

  res.json(getDb().products.find((p) => p.id === id));
});

router.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const permanent = req.query.permanent === 'true';
  await saveDb((draft) => {
    if (permanent) {
      draft.products = draft.products.filter((p) => p.id !== id);
    } else {
      const target = draft.products.find((p) => p.id === id);
      if (target) target.isArchived = true;
    }
  });
  res.json({ ok: true });
});

router.post('/api/admin/upload', requireAdmin, async (req, res) => {
  const dataUrl = typeof req.body.dataUrl === 'string' ? req.body.dataUrl : '';
  const match =
    /^data:image\/(png|jpeg|jpg|webp);base64,((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)$/.exec(
      dataUrl
    );
  if (!match || !match[2]) {
    return res.status(400).json({ error: 'Only PNG, JPEG, or WEBP images are permitted.' });
  }

  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  if (match[2].length > Math.ceil((1.8 * 1024 * 1024 * 4) / 3) + 4) {
    return res.status(400).json({ error: 'Image file size must be under 1.8MB.' });
  }
  const bytes = base64ToBytes(match[2]);

  // Keep images under D1's row limit when R2 is not bound.
  if (bytes.byteLength > 1.8 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image file size must be under 1.8MB.' });
  }
  if (!matchesImageSignature(bytes, ext)) {
    return res.status(400).json({ error: 'The uploaded file does not match its image format.' });
  }

  const filename = `eramora-${Date.now()}-${randomHex(4)}.${ext}`;
  const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

  if (req.env.FILES) {
    await req.env.FILES.put(filename, bytes, { httpMetadata: { contentType } });
  } else {
    await req.env.DB.prepare(
      'INSERT INTO media (key, content_type, data, created_at) VALUES (?, ?, ?, ?)'
    )
      .bind(filename, contentType, bytes.buffer, new Date().toISOString())
      .run();
  }

  res.status(201).json({ url: `/uploads/${filename}` });
});

router.post('/api/admin/categories', requireAdmin, async (req, res) => {
  const name = sanitizeString(req.body.name, 80);
  if (!name) return res.status(400).json({ error: 'Category name is required.' });
  const category: Category = {
    id: `cat-${randomHex(3)}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: sanitizeString(req.body.description || '', 260),
    image: sanitizeString(
      req.body.image || '/brand/eramora/campaigns/fragrance-art.jpg',
      300
    ),
    featured: Boolean(req.body.featured ?? true),
    sortOrder: getDb().categories.length + 1,
  };
  await saveDb((db) => {
    db.categories.push(category);
  });
  res.status(201).json(category);
});

router.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
  let categoryInUse = false;
  let categoryFound = false;
  await saveDb((db) => {
    categoryFound = db.categories.some((category) => category.id === req.params.id);
    categoryInUse = db.products.some((product) => product.categoryId === req.params.id);
    if (!categoryFound || categoryInUse) return;
    db.categories = db.categories.filter((c) => c.id !== req.params.id);
  });
  if (!categoryFound) return res.status(404).json({ error: 'Category not found.' });
  if (categoryInUse) {
    return res.status(409).json({ error: 'Reassign or remove products in this category before deleting it.' });
  }
  res.json({ ok: true });
});

router.put('/api/admin/banners', requireAdmin, async (req, res) => {
  await saveDb((db) => {
    db.banners = {
      ...db.banners,
      announcementText: sanitizeString(req.body.announcementText ?? db.banners.announcementText, 200),
      heroEyebrow: sanitizeString(req.body.heroEyebrow ?? db.banners.heroEyebrow, 80),
      heroHeadline: sanitizeString(req.body.heroHeadline ?? db.banners.heroHeadline, 120),
      heroSubheadline: sanitizeString(req.body.heroSubheadline ?? db.banners.heroSubheadline, 300),
      heroCtaLabel: sanitizeString(req.body.heroCtaLabel ?? db.banners.heroCtaLabel, 60),
      campaignTitle: sanitizeString(req.body.campaignTitle ?? db.banners.campaignTitle, 120),
      campaignSubtitle: sanitizeString(req.body.campaignSubtitle ?? db.banners.campaignSubtitle, 300),
      campaignActive: req.body.campaignActive ?? db.banners.campaignActive,
    };
  });
  res.json(getDb().banners);
});

router.put('/api/admin/settings', requireAdmin, async (req, res) => {
  await saveDb((db) => {
    const settings = db.settings;
    if (req.body.whatsappNumber !== undefined) {
      settings.whatsappNumber = sanitizeString(req.body.whatsappNumber, 25);
    }
    if (req.body.supportEmail !== undefined) settings.supportEmail = sanitizeString(req.body.supportEmail, 120);
    if (req.body.supportPhone !== undefined) settings.supportPhone = sanitizeString(req.body.supportPhone, 40);
    if (req.body.studioAddress !== undefined) {
      settings.studioAddress = sanitizeString(req.body.studioAddress, 200);
    }
    if (req.body.instagramHandle !== undefined) {
      settings.instagramHandle = sanitizeString(req.body.instagramHandle, 80);
    }
    if (req.body.instagramUrl !== undefined) settings.instagramUrl = sanitizeString(req.body.instagramUrl, 200);
    if (req.body.whatsappOrderingEnabled !== undefined) {
      settings.whatsappOrderingEnabled = Boolean(req.body.whatsappOrderingEnabled);
    }
  });
  res.json(getDb().settings);
});

router.get('/api/admin/settings', requireAdmin, (_req, res) => {
  res.json(getDb().settings);
});

// ---------- SITEMAP, MEDIA, ASSETS ----------
interface SeoMetadata extends PageSeoMetadata {
  image?: string;
  productPage?: boolean;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const PAGE_SEO: Record<string, SeoMetadata> = {
  '/': SEO_PAGES.home,
  '/collections': SEO_PAGES.collections,
  '/gifting': SEO_PAGES.gifting,
  '/shop': SEO_PAGES.shop,
  '/curated-fragrances': { ...SEO_PAGES.shop, canonicalPath: '/shop' },
  '/scented-candles': { ...SEO_PAGES.shop, canonicalPath: '/shop' },
  '/sculptural-candles': { ...SEO_PAGES.shop, canonicalPath: '/shop' },
  '/diy-colouring-kits': { ...SEO_PAGES.shop, canonicalPath: '/shop' },
  '/about': SEO_PAGES.about,
  '/contact': SEO_PAGES.contact,
  '/account': { ...SEO_PAGES.contact, canonicalPath: '/contact' },
  '/faq': { ...SEO_PAGES.faq, structuredData: createFaqStructuredData(ERAMORA_FAQS) },
  '/shipping-policy': SEO_PAGES.shippingPolicy,
  '/returns-policy': SEO_PAGES.returnsPolicy,
  '/privacy-policy': SEO_PAGES.privacyPolicy,
  '/terms': SEO_PAGES.terms,
  '/grievance-redressal': SEO_PAGES.grievance,
  '/cart': SEO_PAGES.cart,
  '/checkout': SEO_PAGES.checkout,
  '/wishlist': SEO_PAGES.wishlist,
  '/admin': SEO_PAGES.admin,
};

function renderSeoHtml(response: Response, metadata: SeoMetadata): Response {
  if (!response.headers.get('content-type')?.toLowerCase().includes('text/html')) return response;

  const image =
    absolutePublicUrl(metadata.image || '/brand/eramora/campaigns/brand-introduction.jpg') ||
    canonicalUrl('/brand/eramora/campaigns/brand-introduction.jpg');
  const robots = metadata.noIndex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const jsonLd = metadata.structuredData
    ? JSON.stringify(metadata.structuredData).replace(/</g, '\\u003c')
    : '';
  const rewriter = new HTMLRewriter()
    .on('title', {
      element(element) {
        element.setInnerContent(metadata.title);
      },
    })
    .on('meta[name="description"]', {
      element(element) {
        element.setAttribute('content', metadata.description);
      },
    })
    .on('meta[name="robots"]', {
      element(element) {
        element.setAttribute('content', robots);
      },
    })
    .on('link[rel="canonical"]', {
      element(element) {
        element.setAttribute('href', canonicalUrl(metadata.canonicalPath));
      },
    })
    .on('meta[property="og:type"]', {
      element(element) {
        element.setAttribute('content', metadata.productPage ? 'product' : 'website');
      },
    })
    .on('meta[property="og:title"], meta[name="twitter:title"]', {
      element(element) {
        element.setAttribute('content', metadata.title);
      },
    })
    .on('meta[property="og:description"], meta[name="twitter:description"]', {
      element(element) {
        element.setAttribute('content', metadata.description);
      },
    })
    .on('meta[property="og:url"]', {
      element(element) {
        element.setAttribute('content', canonicalUrl(metadata.canonicalPath));
      },
    })
    .on('meta[property="og:image"], meta[name="twitter:image"]', {
      element(element) {
        element.setAttribute('content', image);
      },
    });

  if (jsonLd) {
    rewriter.on('head', {
      element(element) {
        element.append(
          `<script id="eramora-dynamic-jsonld" type="application/ld+json">${jsonLd}</script>`,
          { html: true }
        );
      },
    });
  }

  return rewriter.transform(response);
}

function xmlEscape(value: string): string {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;',
    };
    return entities[character];
  });
}

function renderSitemap(): Response {
  const db = getDb();
  const staticPaths = Object.values(SEO_PAGES)
    .filter((page) => !('noIndex' in page && page.noIndex))
    .map((page) => page.canonicalPath);
  const urls = [
    ...staticPaths.map(
      (path) => `<url><loc>${xmlEscape(canonicalUrl(path))}</loc><changefreq>weekly</changefreq></url>`
    ),
    ...db.products
      .filter((product) => !product.isArchived)
      .filter((product) => !product.isShowcaseDemo)
      .filter(isEligibleForPublicListing)
      .map((product) => {
        const lastModified = product.updatedAt || product.createdAt;
        const lastmod = /^\d{4}-\d{2}-\d{2}/.test(lastModified)
          ? `<lastmod>${lastModified.slice(0, 10)}</lastmod>`
          : '';
        const productUrl = canonicalUrl(`/product/${encodeURIComponent(product.slug)}`);
        return `<url><loc>${xmlEscape(productUrl)}</loc>${lastmod}<changefreq>weekly</changefreq></url>`;
      }),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
  return new Response(xml, {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}

function renderProductFeed(): Response {
  const products = getDb().products
    .filter((product) => !product.isArchived && !product.isShowcaseDemo)
    .filter(isEligibleForPublicListing)
    .map((product) => ({
      name: product.name,
      slug: product.slug,
      url: canonicalUrl(`/product/${encodeURIComponent(product.slug)}`),
      category: product.categoryName,
      description: getProductSeoDescription(product),
      images: product.images
        .map((image) => absolutePublicUrl(image))
        .filter((image): image is string => Boolean(image)),
      listingType: product.isShowcaseDemo ? 'showcase' : 'published',
      updatedAt: product.updatedAt || product.createdAt,
      variants: product.variants.map((variant) => ({
        name: variant.label,
        size: variant.size,
        price: variant.price,
        currency: 'INR',
        availability: product.isShowcaseDemo
          ? 'confirm-with-store'
          : variant.stock > 0
            ? 'in-stock'
            : 'out-of-stock',
      })),
    }));

  return new Response(
    JSON.stringify({
      name: 'ERAMORA Product Catalogue',
      url: canonicalUrl('/shop'),
      currency: 'INR',
      note: 'Prices and availability can change; confirm current details with the ERAMORA WhatsApp concierge.',
      products,
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=300, stale-while-revalidate=600',
      },
    }
  );
}

async function readLimitedBody(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

async function serveUpload(env: Env, url: URL): Promise<Response> {
  const key = decodeURIComponent(url.pathname.slice('/uploads/'.length));
  if (!/^[A-Za-z0-9._-]+$/.test(key)) {
    return new Response('Not found', { status: 404 });
  }

  if (env.FILES) {
    const object = await env.FILES.get(key);
    if (object) {
      return new Response(object.body, {
        headers: {
          'content-type': object.httpMetadata?.contentType || 'application/octet-stream',
          'cache-control': 'public, max-age=31536000, immutable',
        },
      });
    }
  }

  await initDb(env);
  const row = await env.DB.prepare('SELECT content_type, data FROM media WHERE key = ?')
    .bind(key)
    .first<{ content_type: string; data: ArrayBuffer | number[] }>();

  if (!row) return new Response('Not found', { status: 404 });

  const bytes = row.data instanceof ArrayBuffer ? row.data : new Uint8Array(row.data);
  return new Response(bytes, {
    headers: {
      'content-type': row.content_type,
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}

async function handleApi(request: Request, env: Env, url: URL): Promise<Response> {
  const res = new HttpResponse();
  res.setHeader('cache-control', 'no-store');

  if (!isSameOriginMutation(request, url)) {
    res.status(403).json({ error: 'Cross-origin requests are not allowed.' });
    return withSecurityHeaders(res.toResponse(), url.protocol === 'https:');
  }

  const personalDataEndpoints =
    url.pathname === '/api/orders' ||
    url.pathname.startsWith('/api/orders/') ||
    url.pathname.startsWith('/api/payments/') ||
    url.pathname === '/api/enquiries' ||
    url.pathname === '/api/pincode/check' ||
    url.pathname === '/api/analytics/abandoned-cart' ||
    url.pathname === '/api/coupons/validate' ||
    /^\/api\/products\/[^/]+\/reviews$/.test(url.pathname) ||
    url.pathname === '/api/admin/orders' ||
    url.pathname.startsWith('/api/admin/orders/') ||
    url.pathname === '/api/admin/customers' ||
    url.pathname === '/api/admin/enquiries' ||
    url.pathname.startsWith('/api/admin/enquiries/') ||
    url.pathname === '/api/admin/overview' ||
    url.pathname === '/api/admin/backup' ||
    url.pathname === '/api/admin/marketing' ||
    url.pathname === '/api/admin/coupons' ||
    url.pathname.startsWith('/api/admin/coupons/');
  if (personalDataEndpoints) {
    res.status(410).json({
      error: 'ERAMORA does not collect orders or customer details on this website. Please use the WhatsApp concierge.',
    });
    return withSecurityHeaders(res.toResponse(), url.protocol === 'https:');
  }

  const match = router.match(request.method, url.pathname);
  if (!match) {
    res.status(404).json({ error: 'Endpoint not found.' });
    return withSecurityHeaders(res.toResponse(), url.protocol === 'https:');
  }

  const maxBodyBytes = url.pathname === '/api/admin/upload' ? 2.5 * 1024 * 1024 : 64 * 1024;
  const contentLengthHeader = request.headers.get('content-length');
  const contentLength = contentLengthHeader === null ? 0 : Number(contentLengthHeader);
  if (
    (contentLengthHeader !== null && !Number.isSafeInteger(contentLength)) ||
    (Number.isFinite(contentLength) && contentLength > maxBodyBytes)
  ) {
    res.status(413).json({ error: 'Request body is too large.' });
    return withSecurityHeaders(res.toResponse(), url.protocol === 'https:');
  }

  let rawBody = '';
  let body: any = {};

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const limitedBody = await readLimitedBody(request, maxBodyBytes);
    if (limitedBody === null) {
      res.status(413).json({ error: 'Request body is too large.' });
      return withSecurityHeaders(res.toResponse(), url.protocol === 'https:');
    }
    rawBody = limitedBody;
    const contentType = request.headers.get('content-type') || '';
    if (rawBody && contentType.includes('application/json')) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        res.status(400).json({ error: 'Invalid JSON body.' });
        return withSecurityHeaders(res.toResponse(), url.protocol === 'https:');
      }
    }
  }

  const cookies = parseCookies(request.headers.get('cookie') || undefined);
  const authorization = request.headers.get('authorization');
  const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

  const ctx: RequestContext = {
    req: request,
    env,
    url,
    params: match.params,
    query: Object.fromEntries(url.searchParams.entries()),
    body: body ?? {},
    rawBody,
    session: await verifySessionToken(env, bearer || cookies[SESSION_COOKIE]),
    ip: request.headers.get('cf-connecting-ip') || 'unknown',
    header: (name) => request.headers.get(name) ?? undefined,
  };

  try {
    for (const step of match.steps) {
      const outcome = await step(ctx, res);
      if (outcome === false) break;
    }
  } catch (err) {
    if (err instanceof HttpError) {
      res.statusCode = err.status;
      res.json({ error: err.message });
    } else {
      console.error('ERAMORA API error:', err);
      res.statusCode = 500;
      res.json({ error: 'An unexpected error occurred. Please try again.' });
    }
  }

  return withSecurityHeaders(res.toResponse(), url.protocol === 'https:');
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (isScannerProbePath(url.pathname)) {
    return withSecurityHeaders(
      new Response('Not Found', {
        status: 404,
        headers: { 'cache-control': 'no-store' },
      }),
      url.protocol === 'https:'
    );
  }
  if (env.ENVIRONMENT === 'production' && url.protocol !== 'https:') {
    if (request.method === 'GET' || request.method === 'HEAD') {
      url.protocol = 'https:';
      return withSecurityHeaders(
        new Response(null, {
          status: 308,
          headers: {
            location: url.toString(),
            'cache-control': 'no-store',
          },
        }),
        false
      );
    }

    return withSecurityHeaders(
      new Response('HTTPS is required.', {
        status: 400,
        headers: { 'cache-control': 'no-store' },
      }),
      false
    );
  }
  const pathname = url.pathname;

  try {
    if (pathname.startsWith('/api/')) {
      await initDb(env);
      return await handleApi(request, env, url);
    }

    if (pathname === '/sitemap.xml') {
      await initDb(env);
      return withSecurityHeaders(renderSitemap(), url.protocol === 'https:');
    }

    if (pathname === '/products.json') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
      }
      await initDb(env);
      const feed = renderProductFeed();
      const response =
        request.method === 'HEAD'
          ? new Response(null, { status: feed.status, headers: feed.headers })
          : feed;
      return withSecurityHeaders(response, url.protocol === 'https:');
    }

    if (pathname.startsWith('/uploads/')) {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
      }
      return withSecurityHeaders(await serveUpload(env, url), url.protocol === 'https:');
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
    }

    const routePath = pathname.replace(/\/+$/, '') || '/';
    const productMatch = request.method === 'GET' ? /^\/product\/([a-z0-9-]+)$/.exec(routePath) : null;
    let metadata = PAGE_SEO[routePath];
    if (productMatch) {
      await initDb(env);
      const product = getDb().products.find(
        (entry) =>
          entry.slug === productMatch[1] &&
          !entry.isArchived &&
          isEligibleForPublicListing(entry)
      );
      if (!product) {
        const notFound = await env.ASSETS.fetch(request);
        return withSecurityHeaders(
          new Response(notFound.body, {
            status: 404,
            statusText: 'Not Found',
            headers: notFound.headers,
          }),
          url.protocol === 'https:'
        );
      }
      metadata = {
        title: product.seoTitle || `${product.name} | ERAMORA`,
        description: getProductSeoDescription(product),
        canonicalPath: `/product/${encodeURIComponent(product.slug)}`,
        image: product.images[0],
        productPage: true,
        noIndex: product.isShowcaseDemo,
        structuredData: createProductStructuredData(product),
      };
    }

    const asset = await env.ASSETS.fetch(request);
    const response = request.method === 'GET' && metadata ? renderSeoHtml(asset, metadata) : asset;
    return withSecurityHeaders(response, url.protocol === 'https:');
  } catch (err) {
    console.error('ERAMORA request error:', err);
    return withSecurityHeaders(new Response(JSON.stringify({ error: 'Service temporarily unavailable.' }), {
      status: 503,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    }), url.protocol === 'https:');
  }
}
