import { base64ToBytes, randomHex } from './crypto';
import {
  getDb,
  initDb,
  sanitizeString,
  saveDb,
  signSessionToken,
  verifySessionToken,
  SESSION_COOKIE,
  type SessionPayload,
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
import { DEFAULT_ADMIN_HASH, hashPassword, verifyPassword } from './seed';
import {
  createGatewayOrder,
  getRazorpayPublicKeyId,
  isRazorpayLiveConfigured,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from './razorpay';
import {
  calculatePricingBreakdown,
  validateIndianMobile,
} from '../src/utils/commerce';
import {
  absolutePublicUrl,
  CANONICAL_SITE_URL,
  canonicalUrl,
  createProductStructuredData,
} from '../src/utils/seo';
import type {
  CartItem,
  Category,
  Coupon,
  IndianAddress,
  Order,
  OrderItemSnapshot,
  OrderStatus,
  PaymentStatus,
  Product,
  ProductVariant,
} from '../src/types/store';

const WHATSAPP_ONLY_PRIVACY_POLICY =
  'This website does not collect new customer accounts, order details, delivery addresses, contact enquiries, product reviews, or abandoned-cart information. Your bag and optional gift note remain in this browser until you clear them. If you choose to order or ask a question, you will be redirected to WhatsApp and any information you send there is handled by WhatsApp and ERAMORA outside this website. The site uses an administrator sign-in only to manage the product catalogue and store settings. Historical records created before these features were disabled have not been purged.';

const router = new Router();

function canManageOrder(req: RequestContext, order: Order): boolean {
  if (!req.session) return false;
  if (req.session.role === 'admin') return true;
  if (order.customerId && order.customerId === req.session.userId) return true;
  return order.address.email.toLowerCase() === req.session.email.toLowerCase();
}

/** Next sequential order number derived from the highest committed number. */
function nextOrderNumber(orders: Order[], prefix = 'ERA'): string {
  let highest = 1043;
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  for (const order of orders) {
    const match = pattern.exec(order.orderNumber);
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return `${prefix}-${highest + 1}`;
}

function getOrderCustomers(orders: Order[]) {
  const customers = new Map<
    string,
    { id: string; name: string; email: string; mobile: string; ordersCount: number; totalSpent: number }
  >();

  for (const order of orders) {
    const mobile = order.address.mobile.replace(/\D/g, '');
    const email = order.address.email.trim().toLowerCase();
    const key = mobile || email || order.id;
    const customer = customers.get(key) || {
      id: key,
      name: order.address.fullName,
      email,
      mobile: order.address.mobile,
      ordersCount: 0,
      totalSpent: 0,
    };
    customer.ordersCount += 1;
    if (order.orderStatus !== 'cancelled' && order.orderStatus !== 'refunded') {
      customer.totalSpent += order.totalAmount;
    }
    customers.set(key, customer);
  }

  return [...customers.values()].sort((a, b) => b.ordersCount - a.ordersCount);
}

function parseProductVariants(value: unknown): ProductVariant[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 30) return null;

  const variants: ProductVariant[] = [];
  const ids = new Set<string>();
  const skus = new Set<string>();

  for (const entry of value) {
    if (!entry || typeof entry !== 'object') return null;
    const candidate = entry as Record<string, unknown>;
    const label = sanitizeString(candidate.label, 120);
    const size = sanitizeString(candidate.size, 80);
    const price = Number(candidate.price);
    const stock = Number(candidate.stock);
    const id = sanitizeString(candidate.id, 80) || `var-${randomHex(3)}`;
    const sku = sanitizeString(candidate.sku, 80) || `ERA-${randomHex(2).toUpperCase()}`;
    const compareAtPrice =
      candidate.compareAtPrice === undefined || candidate.compareAtPrice === null || candidate.compareAtPrice === ''
        ? undefined
        : Number(candidate.compareAtPrice);

    if (
      !label ||
      !size ||
      !Number.isFinite(price) ||
      price <= 0 ||
      price > 10_000_000 ||
      !Number.isSafeInteger(stock) ||
      stock < 0 ||
      stock > 1_000_000 ||
      (compareAtPrice !== undefined &&
        (!Number.isFinite(compareAtPrice) || compareAtPrice <= price || compareAtPrice > 10_000_000)) ||
      ids.has(id) ||
      skus.has(sku)
    ) {
      return null;
    }

    ids.add(id);
    skus.add(sku);
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
router.get('/api/config/public', (req, res) => {
  const db = getDb();
  const settings = {
    ...db.settings,
    policies: { ...db.settings.policies, privacy: WHATSAPP_ONLY_PRIVACY_POLICY },
  };
  res.json({
    settings,
    banners: db.banners,
    razorpayConfigured: isRazorpayLiveConfigured(req.env),
    razorpayKeyId: getRazorpayPublicKeyId(req.env),
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

  let list = db.products.filter((p) => !p.isArchived);

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
  const product = db.products.find((p) => p.slug === req.params.slug && !p.isArchived);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const related = db.products
    .filter((p) => p.id !== product.id && !p.isArchived && p.categoryId === product.categoryId)
    .slice(0, 3);
  const recommendations = db.products
    .filter((p) => p.id !== product.id && !p.isArchived && p.categoryId !== product.categoryId)
    .slice(0, 3);
  res.json({ product, related, recommendations });
});

router.post(
  '/api/products/:id/reviews',
  rateLimit(10, 60_000),
  async (req, res) => {
    const productId = req.params.id;
    const authorName = sanitizeString(req.body.authorName, 80);
    const title = sanitizeString(req.body.title, 120);
    const comment = sanitizeString(req.body.comment, 800);
    const rating = Number(req.body.rating);

    if (!authorName || !comment || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Please provide your name, a rating (1–5), and review text.' });
    }

    const db = getDb();
    const exists = db.products.find((p) => p.id === productId);
    if (!exists) return res.status(404).json({ error: 'Product not found.' });

    const newReview = {
      id: `rev-${randomHex(4)}`,
      productId,
      authorName,
      rating: Math.round(rating),
      title: title || 'Verified Experience',
      comment,
      verifiedPurchase: Boolean(req.session),
      createdAt: new Date().toISOString(),
    };

    await saveDb((draft) => {
      draft.reviews.unshift(newReview);
      const prod = draft.products.find((p) => p.id === productId);
      if (prod) {
        const productReviews = draft.reviews.filter((r) => r.productId === productId);
        prod.reviewCount = productReviews.length;
        prod.ratingAverage = Number(
          (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1)
        );
      }
    });

    res.status(201).json(newReview);
  }
);

// ---------- UTILITIES: COUPONS, PINCODE, ENQUIRIES ----------
router.post('/api/coupons/validate', (req, res) => {
  const code = sanitizeString(req.body.code, 40).toUpperCase();
  const subtotal = Number(req.body.subtotal || 0);
  if (!code) return res.status(400).json({ error: 'Please enter a coupon code.' });

  const db = getDb();
  const coupon = db.coupons.find((c) => c.code.toUpperCase() === code && c.active);
  if (!coupon) {
    return res.status(404).json({ error: 'This coupon code is invalid or no longer active.' });
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return res.status(400).json({ error: 'This coupon code has expired.' });
  }
  if (subtotal < coupon.minOrderAmount) {
    return res.status(400).json({
      error: `Minimum order value of ₹${coupon.minOrderAmount.toLocaleString('en-IN')} required for ${coupon.code}.`,
    });
  }
  res.json({ coupon });
});

router.post(
  '/api/enquiries',
  rateLimit(10, 60_000),
  async (req, res) => {
    const type = ['contact', 'custom_gifting', 'back_in_stock'].includes(req.body.type)
      ? (req.body.type as 'contact' | 'custom_gifting' | 'back_in_stock')
      : 'contact';
    const name = sanitizeString(req.body.name, 100);
    const email = sanitizeString(req.body.email, 120).toLowerCase();
    const mobile = sanitizeString(req.body.mobile, 20);
    const subject = sanitizeString(req.body.subject, 160);
    const message = sanitizeString(req.body.message, 1200);
    const productId = sanitizeString(req.body.productId, 80);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (type !== 'back_in_stock' && (!name || !message)) {
      return res.status(400).json({ error: 'Please complete your name and message.' });
    }

    const enquiry = {
      id: `enq-${randomHex(4)}`,
      type,
      name: name || 'Store Guest',
      email,
      mobile,
      subject: subject || (type === 'back_in_stock' ? 'Back in Stock Notification' : 'General Enquiry'),
      message: message || 'Please notify me when this fragrance returns to stock.',
      productId: productId || undefined,
      status: 'open' as const,
      createdAt: new Date().toISOString(),
    };

    await saveDb((db) => {
      db.enquiries.unshift(enquiry);
    });
    res.status(201).json({ ok: true, enquiry });
  }
);

router.post('/api/analytics/abandoned-cart', async (req, res) => {
  if (req.body.consent !== true) {
    return res.status(400).json({ error: 'Explicit consent required.' });
  }
  const itemsCount = Number(req.body.itemsCount || 0);
  const subtotal = Number(req.body.subtotal || 0);
  if (itemsCount <= 0) return res.json({ ok: true });

  await saveDb((db) => {
    db.abandonedCarts.unshift({
      id: `ab-${randomHex(4)}`,
      email: sanitizeString(req.body.email, 120),
      mobile: sanitizeString(req.body.mobile, 20),
      itemsCount,
      subtotal,
      consentedAt: new Date().toISOString(),
    });
    if (db.abandonedCarts.length > 100) db.abandonedCarts.length = 100;
  });
  res.json({ ok: true });
});

// ---------- ADMIN AUTHENTICATION ----------
router.post(
  '/api/auth/login',
  rateLimit(5, 15 * 60_000),
  async (req, res) => {
    if (
      req.env.ENVIRONMENT === 'production' &&
      (!req.env.ADMIN_DEMO_PASSWORD ||
        req.env.ADMIN_DEMO_PASSWORD.length < 12 ||
        req.env.ADMIN_DEMO_PASSWORD.length > 256)
    ) {
      return res.status(503).json({ error: 'Administrator access is not configured with a valid password.' });
    }

    const email = sanitizeString(req.body.email, 120).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (password.length > 256) return res.status(401).json({ error: 'Invalid administrator credentials.' });
    let user = getDb().users.find((u) => u.email === email);

    if (
      req.env.ENVIRONMENT === 'production' &&
      req.env.ADMIN_DEMO_PASSWORD &&
      user?.passwordHash === DEFAULT_ADMIN_HASH
    ) {
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
    setSessionCookie(res, token, req.url.protocol === 'https:');
    const { passwordHash: _ph, ...safeUser } = user;
    res.json({ user: safeUser });
  }
);

router.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE);
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

// ---------- ORDERS & PAYMENTS ----------
router.post(
  '/api/orders',
  rateLimit(15, 60_000),
  async (req, res) => {
    try {
      const db = getDb();
      const rawItems = Array.isArray(req.body.items)
        ? (req.body.items as Array<{ productId: string; variantId: string; quantity: number }>)
        : [];
      const address = req.body.address as IndianAddress | undefined;
      const paymentMethod = req.body.paymentMethod as 'razorpay' | 'cod';
      const couponCode = sanitizeString(req.body.couponCode, 40).toUpperCase();
      const giftWrapSelected = Boolean(req.body.giftWrapSelected);
      const giftMessage = sanitizeString(req.body.giftMessage, 250);

      if (rawItems.length === 0) {
        return res.status(400).json({ error: 'Your shopping bag is empty.' });
      }
      if (!address) {
        return res.status(400).json({ error: 'Delivery address is required.' });
      }
      if (!sanitizeString(address.fullName, 100)) {
        return res.status(400).json({ error: 'Full name is required.' });
      }
      if (!validateIndianMobile(address.mobile || '')) {
        return res.status(400).json({ error: 'Please provide a valid 10-digit Indian mobile number.' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email || '')) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }
      if (
        !sanitizeString(address.houseFlat, 160) ||
        !sanitizeString(address.street, 200) ||
        !sanitizeString(address.city, 80) ||
        !sanitizeString(address.state, 80)
      ) {
        return res
          .status(400)
          .json({ error: 'Complete house/flat, street, city, and state fields are required.' });
      }
      if (paymentMethod !== 'razorpay' && paymentMethod !== 'cod') {
        return res.status(400).json({ error: 'Unsupported payment method.' });
      }
      if (paymentMethod === 'cod' && !db.settings.codEnabled) {
        return res.status(400).json({ error: 'Cash on Delivery is currently disabled.' });
      }
      if (paymentMethod === 'razorpay' && !db.settings.razorpayEnabled) {
        return res.status(400).json({
          error:
            'Online payment is currently unavailable. Please choose Cash on Delivery or contact the concierge.',
        });
      }

      // Consolidate duplicate rows so one variant cannot exceed stock across lines.
      const requestedLines = new Map<string, { productId: string; variantId: string; quantity: number }>();
      for (const reqItem of rawItems) {
        const quantity = Math.floor(Number(reqItem.quantity ?? 1));
        if (!Number.isFinite(quantity) || quantity < 1) {
          return res.status(400).json({ error: 'Please select a valid quantity for each item.' });
        }
        const key = `${reqItem.productId}::${reqItem.variantId}`;
        const existingLine = requestedLines.get(key);
        requestedLines.set(key, {
          productId: reqItem.productId,
          variantId: reqItem.variantId,
          quantity: (existingLine?.quantity || 0) + quantity,
        });
      }

      // Server-side authoritative product, price, and stock resolution.
      const snapshots: OrderItemSnapshot[] = [];
      const calcItems: CartItem[] = [];
      for (const reqItem of requestedLines.values()) {
        const qty = reqItem.quantity;
        if (qty > 20) {
          return res.status(400).json({
            error: 'For quantities above 20 units, please contact our concierge for a bespoke order.',
          });
        }
        const prod = db.products.find((p) => p.id === reqItem.productId && !p.isArchived);
        if (!prod) return res.status(400).json({ error: 'One of the selected products is unavailable.' });
        const variant = prod.variants.find((v) => v.id === reqItem.variantId);
        if (!variant) return res.status(400).json({ error: `Variant unavailable for ${prod.name}.` });
        if (variant.stock < qty) {
          return res.status(400).json({
            error: `Insufficient stock for ${prod.name} (${variant.label}). Only ${variant.stock} left.`,
          });
        }
        snapshots.push({
          productId: prod.id,
          productName: prod.name,
          variantId: variant.id,
          variantLabel: variant.label,
          quantity: qty,
          unitPrice: variant.price,
          lineTotal: variant.price * qty,
          image: prod.images[0] || '',
        });
        calcItems.push({
          productId: prod.id,
          slug: prod.slug,
          name: prod.name,
          image: prod.images[0] || '',
          variantId: variant.id,
          variantLabel: variant.label,
          unitPrice: variant.price,
          quantity: qty,
          maxStock: variant.stock,
        });
      }

      const subtotalCheck = snapshots.reduce((sum, item) => sum + item.lineTotal, 0);
      let appliedCoupon: Coupon | null = null;
      if (couponCode) {
        const found = db.coupons.find((c) => c.code.toUpperCase() === couponCode && c.active);
        if (found && subtotalCheck >= found.minOrderAmount) {
          appliedCoupon = found;
        }
      }

      const breakdown = calculatePricingBreakdown(calcItems, appliedCoupon, db.settings, giftWrapSelected);
      const now = new Date().toISOString();

      const newOrder: Order = {
        id: `ord-${randomHex(5)}`,
        orderNumber: '',
        channel: 'online',
        customerId: req.session?.userId,
        address: {
          fullName: sanitizeString(address.fullName, 100),
          mobile: sanitizeString(address.mobile, 15),
          email: sanitizeString(address.email, 120).toLowerCase(),
          houseFlat: sanitizeString(address.houseFlat, 160),
          street: sanitizeString(address.street, 200),
          landmark: sanitizeString(address.landmark || '', 120),
          city: sanitizeString(address.city, 80),
          state: sanitizeString(address.state, 80),
          pincode: sanitizeString(address.pincode, 10),
        },
        items: snapshots,
        subtotal: breakdown.subtotal,
        discountAmount: breakdown.discountAmount,
        couponCode: appliedCoupon?.code,
        giftWrapSelected,
        giftWrapFee: breakdown.giftWrapFee,
        giftMessage: giftMessage || undefined,
        shippingFee: breakdown.shippingFee,
        taxAmount: breakdown.taxAmount,
        totalAmount: breakdown.totalAmount,
        paymentMethod,
        // Never mark an order paid at creation time; verification happens serverside.
        paymentStatus: 'pending',
        orderStatus: paymentMethod === 'cod' ? 'processing' : 'pending',
        createdAt: now,
        updatedAt: now,
      };

      await saveDb((draft) => {
        // Re-check inside the commit so concurrent checkouts cannot oversell.
        for (const snapshot of snapshots) {
          const product = draft.products.find((p) => p.id === snapshot.productId);
          const variant = product?.variants.find((v) => v.id === snapshot.variantId);
          if (!variant) {
            throw new HttpError(409, `${snapshot.productName} is no longer available.`);
          }
          if (variant.stock < snapshot.quantity) {
            throw new HttpError(
              409,
              `Insufficient stock for ${snapshot.productName} (${snapshot.variantLabel}). Only ${variant.stock} left.`
            );
          }
          variant.stock -= snapshot.quantity;
        }
        newOrder.orderNumber = nextOrderNumber(draft.orders);
        draft.orders.unshift(newOrder);
      });

      res.status(201).json({ order: newOrder });
    } catch (err) {
      if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message });
      }
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

router.post(
  '/api/payments/razorpay/webhook',
  async (req, res) => {
    try {
      const rawBody = req.rawBody;
      const signature = req.header('x-razorpay-signature');
      if (!(await verifyRazorpayWebhookSignature(req.env, rawBody, signature))) {
        return res.status(400).json({ error: 'Invalid webhook signature.' });
      }

      const event = JSON.parse(rawBody) as {
        event: string;
        payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string } } };
      };
      const entity = event.payload?.payment?.entity;

      if (entity?.order_id) {
        await saveDb((db) => {
          const order = db.orders.find((o) => o.razorpayOrderId === entity.order_id);
          if (!order) return;
          if (event.event === 'payment.captured') {
            order.paymentStatus = 'paid';
            order.razorpayPaymentId = entity.id || order.razorpayPaymentId;
            if (order.orderStatus === 'pending') order.orderStatus = 'processing';
            order.updatedAt = new Date().toISOString();
          } else if (event.event === 'payment.failed') {
            order.paymentStatus = 'failed';
            order.updatedAt = new Date().toISOString();
          } else if (event.event === 'refund.processed') {
            order.paymentStatus = 'refunded';
            order.orderStatus = 'refunded';
            order.updatedAt = new Date().toISOString();
          }
        });
      }

      res.json({ received: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

router.post('/api/payments/razorpay/create-order', async (req, res) => {
  try {
    const orderId = sanitizeString(req.body.orderId, 80);
    const db = getDb();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const gatewayOrder = await createGatewayOrder(req.env, {
      amountInPaise: Math.round(order.totalAmount * 100),
      receipt: order.orderNumber,
    });

    await saveDb((draft) => {
      const target = draft.orders.find((o) => o.id === orderId);
      if (target) {
        target.razorpayOrderId = gatewayOrder.id;
        target.updatedAt = new Date().toISOString();
      }
    });

    res.json({
      razorpayOrderId: gatewayOrder.id,
      amount: gatewayOrder.amount,
      currency: gatewayOrder.currency,
      mode: gatewayOrder.mode,
      keyId: getRazorpayPublicKeyId(req.env),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Server-side cryptographic verification for a live Razorpay Checkout response.
router.post('/api/payments/razorpay/verify', async (req, res) => {
  const orderId = sanitizeString(req.body.orderId, 80);
  const razorpayOrderId = sanitizeString(req.body.razorpay_order_id, 100);
  const razorpayPaymentId = sanitizeString(req.body.razorpay_payment_id, 100);
  const razorpaySignature = sanitizeString(req.body.razorpay_signature, 200);

  const db = getDb();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order || order.razorpayOrderId !== razorpayOrderId) {
    return res.status(404).json({ error: 'Matching gateway order not found.' });
  }

  const valid = await verifyRazorpayPaymentSignature(req.env, {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!valid) {
    await saveDb((draft) => {
      const target = draft.orders.find((o) => o.id === orderId);
      if (target) {
        target.paymentStatus = 'failed';
        target.updatedAt = new Date().toISOString();
      }
    });
    return res
      .status(400)
      .json({ error: 'Payment signature verification failed. Order has NOT been marked paid.' });
  }

  await saveDb((draft) => {
    const target = draft.orders.find((o) => o.id === orderId);
    if (target) {
      target.paymentStatus = 'paid';
      target.razorpayPaymentId = razorpayPaymentId;
      target.orderStatus = 'processing';
      target.updatedAt = new Date().toISOString();
    }
  });

  res.json({ verified: true, order: getDb().orders.find((o) => o.id === orderId) });
});

router.get('/api/orders/track', rateLimit(10, 60_000), (req, res) => {
  const orderNumber = sanitizeString(req.query.orderNumber, 40).toUpperCase();
  const contact = sanitizeString(req.query.contact, 120).toLowerCase();
  if (!orderNumber) return res.status(400).json({ error: 'Order number is required.' });
  if (!contact) {
    return res.status(400).json({ error: 'Please enter the email or mobile used for this order.' });
  }

  const db = getDb();
  const order = db.orders.find((o) => o.orderNumber.toUpperCase() === orderNumber);
  if (!order) return res.status(404).json({ error: 'No order found matching that order number.' });

  const matchesEmail = order.address.email.toLowerCase() === contact;
  const digits = contact.replace(/\D/g, '');
  const orderDigits = order.address.mobile.replace(/\D/g, '');
  const matchesPhone = digits.length >= 10 && orderDigits.endsWith(digits.slice(-10));
  if (!matchesEmail && !matchesPhone) {
    return res.status(403).json({ error: 'Contact email or mobile does not match this order.' });
  }
  res.json({
    order: {
      ...order,
      customerId: undefined,
      adminNotes: undefined,
      cancellationReason: undefined,
      returnReason: undefined,
      giftMessage: undefined,
      razorpayOrderId: undefined,
      razorpayPaymentId: undefined,
      address: {
        ...order.address,
        fullName: '',
        mobile: '',
        email: '',
        houseFlat: '',
        street: '',
        landmark: '',
      },
    },
  });
});

router.post('/api/orders/:orderNumber/cancel', async (req, res) => {
  const orderNumber = sanitizeString(req.params.orderNumber, 40).toUpperCase();
  const reason = sanitizeString(req.body.reason, 300) || 'Customer requested cancellation';
  const db = getDb();
  const existing = db.orders.find((o) => o.orderNumber.toUpperCase() === orderNumber);
  if (!existing) return res.status(404).json({ error: 'Order not found.' });
  if (!req.session) {
    return res
      .status(401)
      .json({ error: 'Please sign in to manage this order, or contact the concierge on WhatsApp.' });
  }
  if (!canManageOrder(req, existing)) {
    return res.status(403).json({ error: 'You can only manage orders placed with this account.' });
  }
  if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(existing.orderStatus)) {
    return res.status(400).json({ error: `Cannot cancel order in "${existing.orderStatus}" status.` });
  }

  const saved = await saveDb((draft) => {
    const target = draft.orders.find((o) => o.orderNumber.toUpperCase() === orderNumber);
    if (!target) throw new HttpError(404, 'Order not found.');
    if (target.orderStatus === 'cancelled') return;
    if (['shipped', 'delivered', 'refunded'].includes(target.orderStatus)) {
      throw new HttpError(400, `Cannot cancel order in "${target.orderStatus}" status.`);
    }

    target.orderStatus = 'cancelled';
    target.cancellationReason = reason;
    if (target.paymentStatus === 'paid') target.paymentStatus = 'refunded';
    target.updatedAt = new Date().toISOString();
    for (const item of target.items) {
      const product = draft.products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      if (variant) variant.stock += item.quantity;
    }
  });

  res.json({ order: saved.orders.find((o) => o.orderNumber.toUpperCase() === orderNumber) });
});

router.post('/api/orders/:orderNumber/return', async (req, res) => {
  const orderNumber = sanitizeString(req.params.orderNumber, 40).toUpperCase();
  const reason = sanitizeString(req.body.reason, 400);
  if (!reason) return res.status(400).json({ error: 'Please specify a reason for return or refund.' });

  const db = getDb();
  const existing = db.orders.find((o) => o.orderNumber.toUpperCase() === orderNumber);
  if (!existing) return res.status(404).json({ error: 'Order not found.' });
  if (!req.session) {
    return res
      .status(401)
      .json({ error: 'Please sign in to manage this order, or contact the concierge on WhatsApp.' });
  }
  if (!canManageOrder(req, existing)) {
    return res.status(403).json({ error: 'You can only manage orders placed with this account.' });
  }
  if (existing.orderStatus !== 'delivered') {
    return res
      .status(400)
      .json({ error: 'Return requests can only be submitted for delivered orders.' });
  }

  await saveDb((draft) => {
    const target = draft.orders.find((o) => o.orderNumber.toUpperCase() === orderNumber);
    if (target) {
      target.orderStatus = 'return_requested';
      target.returnReason = reason;
      target.updatedAt = new Date().toISOString();
    }
  });

  res.json({ order: getDb().orders.find((o) => o.orderNumber.toUpperCase() === orderNumber) });
});

// ---------- ADMIN DASHBOARD ----------
router.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const db = getDb();
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const monthPrefix = new Date().toISOString().slice(0, 7);

  const validOrders = db.orders.filter(
    (o) => o.orderStatus !== 'cancelled' && o.orderStatus !== 'refunded'
  );
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const todaySales = validOrders
    .filter((o) => o.createdAt.startsWith(todayPrefix))
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const monthlySales = validOrders
    .filter((o) => o.createdAt.startsWith(monthPrefix))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const statusCounts = {
    pending: db.orders.filter((o) => o.orderStatus === 'pending').length,
    processing: db.orders.filter((o) => o.orderStatus === 'processing').length,
    shipped: db.orders.filter((o) => o.orderStatus === 'shipped').length,
    delivered: db.orders.filter((o) => o.orderStatus === 'delivered').length,
    cancelled: db.orders.filter((o) => o.orderStatus === 'cancelled').length,
    return_requested: db.orders.filter((o) => o.orderStatus === 'return_requested').length,
  };

  const productSales = new Map<string, { productId: string; name: string; units: number; revenue: number }>();
  for (const order of validOrders) {
    for (const item of order.items) {
      const current = productSales.get(item.productId) || {
        productId: item.productId,
        name: item.productName,
        units: 0,
        revenue: 0,
      };
      current.units += item.quantity;
      current.revenue += item.lineTotal;
      productSales.set(item.productId, current);
    }
  }
  const bestsellingProducts = [...productSales.values()].sort((a, b) => b.units - a.units).slice(0, 5);

  const threshold = db.settings.lowStockThreshold || 8;
  const lowStockProducts = db.products
    .filter((p) => !p.isArchived)
    .flatMap((p) =>
      p.variants
        .filter((v) => v.stock <= threshold)
        .map((v) => ({ productId: p.id, productName: p.name, variantLabel: v.label, stock: v.stock, sku: v.sku }))
    );

  res.json({
    totalOrders: db.orders.length,
    totalRevenue,
    todaySales,
    monthlySales,
    totalCustomers: getOrderCustomers(db.orders).length,
    statusCounts,
    bestsellingProducts,
    lowStockProducts,
  });
});

router.get('/api/admin/products', requireAdmin, (_req, res) => {
  res.json(getDb().products);
});

router.post('/api/admin/products', requireAdmin, async (req, res) => {
  const body = req.body as Partial<Product>;
  const name = sanitizeString(body.name, 140);
  if (!name) return res.status(400).json({ error: 'Product name is required.' });
  const db = getDb();
  const cat = db.categories.find((c) => c.id === body.categoryId) || db.categories[0];
  if (!cat) return res.status(400).json({ error: 'Create a category before adding products.' });
  const variants =
    body.variants === undefined
      ? [
          {
            id: `var-${randomHex(3)}`,
            label: 'Standard',
            size: 'Standard',
            price: 1950,
            stock: 10,
            sku: `ERA-${randomHex(2).toUpperCase()}`,
          },
        ]
      : parseProductVariants(body.variants);
  if (!variants) return res.status(400).json({ error: 'Enter valid variant labels, prices, stock, and SKUs.' });
  const images =
    body.images === undefined
      ? ['/src/assets/images/product_candle_oud_velvet_1794827351032.jpg']
      : parseProductImages(body.images);
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
    subtitle: sanitizeString(body.subtitle || '', 160),
    categoryId: cat.id,
    categoryName: cat.name,
    description: sanitizeString(body.description || '', 2000),
    specifications: body.specifications || {},
    fragranceNotes: body.fragranceNotes,
    ingredientsOrMaterials: sanitizeString(body.ingredientsOrMaterials || '', 600),
    images,
    variants,
    badges: Array.isArray(body.badges) ? body.badges : [],
    isShowcaseDemo: Boolean(body.isShowcaseDemo),
    isFeatured: Boolean(body.isFeatured),
    isBestseller: Boolean(body.isBestseller),
    isNewArrival: Boolean(body.isNewArrival),
    isArchived: false,
    seoTitle: sanitizeString(body.seoTitle || `${name} | ERAMORA`, 120),
    seoDescription: sanitizeString(body.seoDescription || body.subtitle || '', 220),
    ratingAverage: 5.0,
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
  if (body.name !== undefined && !sanitizeString(body.name, 140)) {
    return res.status(400).json({ error: 'Product name cannot be empty.' });
  }
  const variants = body.variants === undefined ? undefined : parseProductVariants(body.variants);
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
    if (body.name) target.name = sanitizeString(body.name, 140);
    if (body.subtitle !== undefined) target.subtitle = sanitizeString(body.subtitle, 160);
    if (body.description !== undefined) target.description = sanitizeString(body.description, 2000);
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
      req.body.image || '/src/assets/images/product_candle_oud_velvet_1794827351032.jpg',
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
  await saveDb((db) => {
    db.categories = db.categories.filter((c) => c.id !== req.params.id);
  });
  res.json({ ok: true });
});

router.get('/api/admin/orders', requireAdmin, (req, res) => {
  const db = getDb();
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const q = typeof req.query.q === 'string' ? req.query.q.toLowerCase().trim() : '';
  let orders = [...db.orders];
  if (status && status !== 'all') {
    orders = orders.filter((o) => o.orderStatus === status);
  }
  if (q) {
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.address.fullName.toLowerCase().includes(q) ||
        o.address.mobile.includes(q) ||
        o.address.email.toLowerCase().includes(q)
    );
  }
  res.json(orders);
});

router.patch('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const db = getDb();
  if (!db.orders.some((o) => o.id === id)) return res.status(404).json({ error: 'Order not found.' });
  const allowedFields = ['orderStatus', 'paymentStatus', 'trackingNumber', 'courierName', 'adminNotes'];
  if (!allowedFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field))) {
    return res.status(400).json({ error: 'Choose an order field to update.' });
  }
  const allowedOrderStatuses: OrderStatus[] = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'return_requested',
    'refunded',
  ];
  const allowedPaymentStatuses: PaymentStatus[] = [
    'pending',
    'awaiting_verification',
    'paid',
    'failed',
    'refunded',
  ];
  if (req.body.orderStatus !== undefined && !allowedOrderStatuses.includes(req.body.orderStatus)) {
    return res.status(400).json({ error: 'Choose a valid order status.' });
  }
  if (req.body.paymentStatus !== undefined && !allowedPaymentStatuses.includes(req.body.paymentStatus)) {
    return res.status(400).json({ error: 'Choose a valid payment status.' });
  }

  const saved = await saveDb((draft) => {
    const target = draft.orders.find((o) => o.id === id);
    if (!target) throw new HttpError(404, 'Order not found.');
    if (req.body.orderStatus !== undefined) target.orderStatus = req.body.orderStatus as OrderStatus;
    if (req.body.paymentStatus !== undefined) target.paymentStatus = req.body.paymentStatus as PaymentStatus;
    if (req.body.trackingNumber !== undefined) {
      target.trackingNumber = sanitizeString(req.body.trackingNumber, 100);
    }
    if (req.body.courierName !== undefined) {
      target.courierName = sanitizeString(req.body.courierName, 100);
    }
    if (req.body.adminNotes !== undefined) target.adminNotes = sanitizeString(req.body.adminNotes, 500);
    target.updatedAt = new Date().toISOString();
  });

  const updatedOrder = saved.orders.find((o) => o.id === id);
  if (!updatedOrder) return res.status(404).json({ error: 'Order not found.' });
  res.json(updatedOrder);
});

router.post('/api/admin/orders/whatsapp', requireAdmin, async (req, res) => {
  const customerName = sanitizeString(req.body.customerName, 100);
  const mobile = sanitizeString(req.body.mobile, 20);
  const email = sanitizeString(req.body.email, 120).toLowerCase();
  const city = sanitizeString(req.body.city, 80);
  const state = sanitizeString(req.body.state, 80);
  const pincode = sanitizeString(req.body.pincode, 10);
  const houseFlat = sanitizeString(req.body.houseFlat, 160);
  const street = sanitizeString(req.body.street, 200);
  const landmark = sanitizeString(req.body.landmark, 160);
  const paymentStatus = req.body.paymentStatus as PaymentStatus;
  const giftWrapSelected = req.body.giftWrapSelected === true;
  const giftMessage = sanitizeString(req.body.giftMessage, 250);
  const rawItems: unknown[] = Array.isArray(req.body.items)
    ? req.body.items
    : [{ productId: req.body.productId, variantId: req.body.variantId, quantity: req.body.quantity }];
  if (!customerName || !validateIndianMobile(mobile) || !houseFlat || !street || !city || !state) {
    return res.status(400).json({ error: 'Provide the customer name, valid mobile, and complete delivery address.' });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address or leave it blank.' });
  }
  if (rawItems.length === 0 || rawItems.length > 20) {
    return res.status(400).json({ error: 'An order must contain between 1 and 20 product lines.' });
  }
  if (paymentStatus !== 'awaiting_verification' && paymentStatus !== 'paid') {
    return res.status(400).json({ error: 'Choose a supported WhatsApp payment status.' });
  }

  const requestedItems = new Map<string, { productId: string; variantId: string; quantity: number }>();
  for (const rawItem of rawItems) {
    if (!rawItem || typeof rawItem !== 'object') {
      return res.status(400).json({ error: 'Every order line must include a product, variant, and quantity.' });
    }
    const item = rawItem as Record<string, unknown>;
    const productId = sanitizeString(item.productId, 80);
    const variantId = sanitizeString(item.variantId, 80);
    const quantity = Number(item.quantity);
    if (!productId || !variantId || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({ error: 'Every order line needs a valid product, variant, and quantity.' });
    }
    const key = `${productId}::${variantId}`;
    const currentQuantity = (requestedItems.get(key)?.quantity || 0) + quantity;
    if (currentQuantity > 20) {
      return res.status(400).json({ error: 'Quantities above 20 units require a bespoke order.' });
    }
    requestedItems.set(key, { productId, variantId, quantity: currentQuantity });
  }

  const db = getDb();
  const orderItems: OrderItemSnapshot[] = [];
  let subtotal = 0;
  for (const item of requestedItems.values()) {
    const product = db.products.find((candidate) => candidate.id === item.productId && !candidate.isArchived);
    const variant = product?.variants.find((candidate) => candidate.id === item.variantId);
    if (!product || !variant) return res.status(404).json({ error: 'One of the selected products is unavailable.' });
    if (variant.stock < item.quantity) {
      return res.status(400).json({ error: `Only ${variant.stock} units of ${product.name} are in stock.` });
    }
    const lineTotal = variant.price * item.quantity;
    subtotal += lineTotal;
    orderItems.push({
      productId: product.id,
      productName: product.name,
      variantId: variant.id,
      variantLabel: variant.label,
      quantity: item.quantity,
      unitPrice: variant.price,
      lineTotal,
      image: product.images[0] || '',
    });
  }

  const shippingFee = subtotal >= db.settings.freeShippingThreshold ? 0 : db.settings.standardShippingFee;
  const giftWrapFee = giftWrapSelected ? db.settings.giftWrapFee : 0;
  const totalAmount = subtotal + shippingFee + giftWrapFee;
  const now = new Date().toISOString();

  const order: Order = {
    id: `ord-${randomHex(5)}`,
    orderNumber: '',
    channel: 'whatsapp',
    address: {
      fullName: customerName,
      mobile,
      email,
      houseFlat,
      street,
      landmark,
      city,
      state,
      pincode,
    },
    items: orderItems,
    subtotal,
    discountAmount: 0,
    giftWrapSelected,
    giftWrapFee,
    giftMessage: giftMessage || undefined,
    shippingFee,
    taxAmount: Math.round(subtotal - subtotal / (1 + db.settings.gstRatePercent / 100)),
    totalAmount,
    paymentMethod: 'whatsapp_manual',
    paymentStatus,
    orderStatus: paymentStatus === 'paid' ? 'processing' : 'pending',
    adminNotes: sanitizeString(req.body.notes || 'Recorded from WhatsApp Concierge desk.', 400),
    createdAt: now,
    updatedAt: now,
  };

  await saveDb((draft) => {
    for (const item of orderItems) {
      const targetProduct = draft.products.find((product) => product.id === item.productId);
      const targetVariant = targetProduct?.variants.find((variant) => variant.id === item.variantId);
      if (!targetVariant || targetVariant.stock < item.quantity) {
        throw new HttpError(
          409,
          `Only ${targetVariant?.stock ?? 0} units of ${item.productName} are in stock.`
        );
      }
    }
    for (const item of orderItems) {
      const targetProduct = draft.products.find((product) => product.id === item.productId);
      const targetVariant = targetProduct?.variants.find((variant) => variant.id === item.variantId);
      if (targetVariant) {
        targetVariant.stock -= item.quantity;
      }
    }
    order.orderNumber = nextOrderNumber(draft.orders, 'ERA-WA');
    draft.orders.unshift(order);
  });

  res.status(201).json(order);
});

router.get('/api/admin/customers', requireAdmin, (_req, res) => {
  const db = getDb();
  res.json({ customers: getOrderCustomers(db.orders), enquiries: db.enquiries });
});

router.patch('/api/admin/enquiries/:id', requireAdmin, async (req, res) => {
  await saveDb((db) => {
    const enquiry = db.enquiries.find((e) => e.id === req.params.id);
    if (enquiry && ['open', 'responded', 'closed'].includes(req.body.status)) {
      enquiry.status = req.body.status;
    }
  });
  res.json({ ok: true });
});

router.get('/api/admin/marketing', requireAdmin, (_req, res) => {
  const db = getDb();
  res.json({
    coupons: db.coupons,
    banners: db.banners,
  });
});

router.post('/api/admin/coupons', requireAdmin, async (req, res) => {
  const code = sanitizeString(req.body.code, 40).toUpperCase();
  if (!code) return res.status(400).json({ error: 'Coupon code is required.' });
  const coupon: Coupon = {
    id: `cpn-${randomHex(3)}`,
    code,
    description: sanitizeString(req.body.description || `${code} Offer`, 160),
    discountType: req.body.discountType === 'flat' ? 'flat' : 'percentage',
    discountValue: Math.max(1, Number(req.body.discountValue || 10)),
    minOrderAmount: Math.max(0, Number(req.body.minOrderAmount || 0)),
    maxDiscount: req.body.maxDiscount ? Number(req.body.maxDiscount) : undefined,
    active: true,
  };
  await saveDb((db) => {
    db.coupons.unshift(coupon);
  });
  res.status(201).json(coupon);
});

router.delete('/api/admin/coupons/:id', requireAdmin, async (req, res) => {
  await saveDb((db) => {
    db.coupons = db.coupons.filter((c) => c.id !== req.params.id);
  });
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
    if (req.body.freeShippingThreshold !== undefined) {
      settings.freeShippingThreshold = Math.max(0, Number(req.body.freeShippingThreshold));
    }
    if (req.body.standardShippingFee !== undefined) {
      settings.standardShippingFee = Math.max(0, Number(req.body.standardShippingFee));
    }
    if (req.body.giftWrapFee !== undefined) {
      settings.giftWrapFee = Math.max(0, Number(req.body.giftWrapFee));
    }
    if (req.body.gstRatePercent !== undefined) {
      settings.gstRatePercent = Math.max(0, Number(req.body.gstRatePercent));
    }
    if (req.body.taxInclusive !== undefined) settings.taxInclusive = Boolean(req.body.taxInclusive);
    if (req.body.codEnabled !== undefined) settings.codEnabled = Boolean(req.body.codEnabled);
    if (req.body.razorpayEnabled !== undefined) {
      settings.razorpayEnabled = Boolean(req.body.razorpayEnabled);
    }
    if (req.body.whatsappOrderingEnabled !== undefined) {
      settings.whatsappOrderingEnabled = Boolean(req.body.whatsappOrderingEnabled);
    }
    if (req.body.lowStockThreshold !== undefined) {
      settings.lowStockThreshold = Math.max(1, Number(req.body.lowStockThreshold));
    }
    if (req.body.policies) {
      settings.policies = {
        shipping: sanitizeString(req.body.policies.shipping ?? settings.policies.shipping, 2000),
        returns: sanitizeString(req.body.policies.returns ?? settings.policies.returns, 2000),
        privacy: WHATSAPP_ONLY_PRIVACY_POLICY,
        terms: sanitizeString(req.body.policies.terms ?? settings.policies.terms, 2000),
      };
    }
  });
  res.json(getDb().settings);
});

router.get('/api/admin/backup', requireAdmin, (_req, res) => {
  const db = getDb();
  const safeUsers = db.users.map(({ passwordHash: _ph, ...u }) => u);
  const snapshot = { ...db, users: safeUsers, exportedAt: new Date().toISOString() };
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="eramora-backup-${new Date().toISOString().slice(0, 10)}.json"`
  );
  res.json(snapshot);
});

// ---------- SITEMAP, MEDIA, ASSETS ----------
interface SeoMetadata {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  noIndex?: boolean;
  productPage?: boolean;
  structuredData?: Array<Record<string, unknown>>;
}

const PAGE_SEO: Record<string, SeoMetadata> = {
  '/': {
    title: 'ERAMORA — Where Fragrance Meets Emotion | Luxury Candles & Perfume',
    description:
      "Explore ERAMORA's curated fragrances, candles and gifting. Where fragrance meets emotion—make every moment memorable.",
    canonicalPath: '/',
  },
  '/collections': {
    title: 'The Collections | ERAMORA',
    description:
      'Explore ERAMORA collections: curated fragrances, scented candles, sculptural candles, DIY colouring kits and gifting.',
    canonicalPath: '/collections',
  },
  '/gifting': {
    title: 'The Gifting Atelier | ERAMORA',
    description:
      'Wedding, corporate and personal fragrance gifting enquiries by ERAMORA.',
    canonicalPath: '/gifting',
  },
  '/shop': {
    title: 'Shop All Creations | ERAMORA',
    description:
      'Explore ERAMORA curated fragrances, scented candles, sculptural candles, DIY colouring kits and gifting.',
    canonicalPath: '/shop',
  },
  '/about': {
    title: 'About ERAMORA — Where Fragrance Meets Emotion',
    description: "Discover ERAMORA's philosophy of emotional fragrance, quiet craftsmanship, and meaningful gifting.",
    canonicalPath: '/about',
  },
  '/contact': {
    title: 'Contact & Custom Gifting | ERAMORA',
    description:
      'Reach ERAMORA concierge for product advice, order support, or bespoke wedding & corporate gifting.',
    canonicalPath: '/contact',
  },
  '/account': {
    title: 'Contact & Custom Gifting | ERAMORA',
    description:
      'Reach ERAMORA concierge for product advice, order support, or bespoke wedding & corporate gifting.',
    canonicalPath: '/contact',
  },
  '/faq': {
    title: 'Frequently Asked Questions | ERAMORA',
    description: 'Answers on ERAMORA demo catalogue items, WhatsApp enquiries and gifting concierge.',
    canonicalPath: '/faq',
  },
  '/shipping-policy': {
    title: 'Shipping Policy | ERAMORA',
    description: 'Read the ERAMORA shipping policy.',
    canonicalPath: '/shipping-policy',
  },
  '/returns-policy': {
    title: 'Returns Policy | ERAMORA',
    description: 'Read the ERAMORA returns policy.',
    canonicalPath: '/returns-policy',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | ERAMORA',
    description: 'Read the ERAMORA privacy policy.',
    canonicalPath: '/privacy-policy',
  },
  '/terms': {
    title: 'Terms & Conditions | ERAMORA',
    description: 'Read the ERAMORA terms and conditions.',
    canonicalPath: '/terms',
  },
  '/cart': {
    title: 'Shopping Bag | ERAMORA',
    description: 'Review your ERAMORA selection and book directly with our WhatsApp concierge.',
    canonicalPath: '/cart',
    noIndex: true,
  },
  '/checkout': {
    title: 'Checkout | ERAMORA',
    description:
      'Send your ERAMORA order request to our WhatsApp concierge. No customer account or online payment is required.',
    canonicalPath: '/checkout',
    noIndex: true,
  },
  '/wishlist': {
    title: 'Wishlist | ERAMORA',
    description: 'Your saved ERAMORA fragrances and scented candles.',
    canonicalPath: '/wishlist',
    noIndex: true,
  },
  '/admin': {
    title: 'Admin Portal | ERAMORA',
    description: 'ERAMORA Atelier Management Portal',
    canonicalPath: '/admin',
    noIndex: true,
  },
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
  const staticPaths = [
    '/',
    '/collections',
    '/gifting',
    '/shop',
    '/about',
    '/contact',
    '/faq',
    '/shipping-policy',
    '/returns-policy',
    '/privacy-policy',
    '/terms',
  ];
  const urls = [
    ...staticPaths.map(
      (path) => `<url><loc>${xmlEscape(canonicalUrl(path))}</loc><changefreq>weekly</changefreq></url>`
    ),
    ...db.products
      .filter((product) => !product.isArchived)
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
    .map((product) => ({
      name: product.name,
      slug: product.slug,
      url: canonicalUrl(`/product/${encodeURIComponent(product.slug)}`),
      category: product.categoryName,
      description: product.description || product.subtitle,
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
    /^\/api\/products\/[^/]+\/reviews$/.test(url.pathname) ||
    url.pathname === '/api/admin/orders' ||
    url.pathname.startsWith('/api/admin/orders/') ||
    url.pathname === '/api/admin/customers' ||
    url.pathname === '/api/admin/enquiries' ||
    url.pathname.startsWith('/api/admin/enquiries/') ||
    url.pathname === '/api/admin/overview' ||
    url.pathname === '/api/admin/backup';
  if (personalDataEndpoints) {
    res.status(410).json({
      error: 'ERAMORA does not collect orders or customer details on this website. Please use the WhatsApp concierge.',
    });
    return withSecurityHeaders(res.toResponse(), url.protocol === 'https:');
  }

  if (
    request.method === 'POST' &&
    (url.pathname === '/api/orders' || url.pathname.startsWith('/api/payments/'))
  ) {
    res.status(410).json({ error: 'Please submit order requests through the ERAMORA WhatsApp concierge.' });
    return withSecurityHeaders(res.toResponse(), url.protocol === 'https:');
  }

  const match = router.match(request.method, url.pathname);
  if (!match) {
    res.status(404).json({ error: 'Endpoint not found.' });
    return withSecurityHeaders(res.toResponse(), url.protocol === 'https:');
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > 6 * 1024 * 1024) {
    res.status(413).json({ error: 'Request body is too large.' });
    return withSecurityHeaders(res.toResponse(), url.protocol === 'https:');
  }

  let rawBody = '';
  let body: any = {};

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    rawBody = await request.text();
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
        (entry) => entry.slug === productMatch[1] && !entry.isArchived
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
        description: product.seoDescription || product.subtitle || product.description,
        canonicalPath: `/product/${encodeURIComponent(product.slug)}`,
        image: product.images[0],
        productPage: true,
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
