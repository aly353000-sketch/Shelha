import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type {
  BulkPriceUpdateItem,
  OrderItemSnapshot,
  OrderStatus,
  ProductCategory,
  ProductVariant,
  StoreOrder,
  StoreProduct,
  StoreSettings,
} from '../src/types/store.ts';
import { SEED_PRODUCTS } from './seedProducts.ts';

const VALID_CATEGORIES = new Set<ProductCategory>(['hair', 'skin', 'body']);
const VALID_ORDER_STATUSES = new Set<OrderStatus>([
  'new',
  'confirmed',
  'shipping',
  'delivered',
  'cancelled',
]);

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  openingDiscountEnabled: true,
  openingDiscountPercent: 20,
  freeShippingMinItems: 3,
  shippingFeeEgp: 60,
  whatsappNumber: '201127266860',
  facebookUrl: 'https://www.facebook.com/',
  instagramUrl: 'https://www.instagram.com/',
  announcementText: 'عرض الافتتاح: خصم 20% على جميع المنتجات · التوصيل مجاني عند طلب 3 منتجات أو أكثر',
  teaserEnabled: true,
  teaserTitle: 'قريبًا في أوراجلو ✨',
  teaserSubtitle: 'منتجات جديدة وعروض ومفاجآت حلوة في الطريق، خليكي قريبة!',
  teaserBarText: 'تابعينا، مفاجآت أوراجلو جاية قريب',
};

interface ProductRow {
  id: string;
  name: string;
  category: string;
  volume: string;
  original_price: number;
  discounted_price: number;
  images_json: string;
  variants_json: string;
  description: string;
  usage_text: string;
  ingredients_json: string;
  in_stock: number;
  sort_order: number;
  featured: number;
}

interface OrderRow {
  id: number;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  governorate: string;
  address: string;
  notes: string;
  items_json: string;
  total_items_count: number;
  subtotal_original: number;
  subtotal_final: number;
  discount_total: number;
  shipping_fee: number;
  grand_total: number;
  status: string;
  is_read?: number;
  created_at: string;
}

export function sanitizeImagePath(url: string): string | null {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/assets/') && !trimmed.includes('..')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}

export function sanitizeExternalUrl(url: string): string {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return '';
  }
  return '';
}

export function slugifyProductId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || 'product'}-${suffix}`;
}

export interface ProductPayloadInput {
  name: string;
  category: ProductCategory;
  volume: string;
  originalPrice: number;
  discountedPrice: number;
  images: string[];
  variants?: ProductVariant[];
  description: string;
  usage: string;
  ingredients: string[];
  inStock: boolean;
  featured?: boolean;
}

export interface OrderCreateInput {
  customerName: string;
  customerPhone: string;
  governorate: string;
  address: string;
  notes?: string;
  items: Array<{
    productId: string;
    variantLabel?: string;
    quantity: number;
  }>;
}

export class StoreRepository {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolvedPath =
      dbPath ?? path.resolve(process.cwd(), 'data', 'auraglow.db');
    if (resolvedPath !== ':memory:') {
      fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    }
    this.db = new Database(resolvedPath);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
    this.seedDefaultsIfEmpty();
  }

  close(): void {
    this.db.close();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        volume TEXT NOT NULL,
        original_price REAL NOT NULL,
        discounted_price REAL NOT NULL,
        images_json TEXT NOT NULL,
        variants_json TEXT NOT NULL DEFAULT '[]',
        description TEXT NOT NULL,
        usage_text TEXT NOT NULL,
        ingredients_json TEXT NOT NULL,
        in_stock INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 100,
        featured INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code TEXT NOT NULL UNIQUE,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        governorate TEXT NOT NULL,
        address TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        items_json TEXT NOT NULL,
        total_items_count INTEGER NOT NULL,
        subtotal_original REAL NOT NULL,
        subtotal_final REAL NOT NULL,
        discount_total REAL NOT NULL,
        shipping_fee REAL NOT NULL,
        grand_total REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS store_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    const orderCols = this.db
      .prepare('PRAGMA table_info(orders)')
      .all() as Array<{ name: string }>;
    if (!orderCols.some((col) => col.name === 'is_read')) {
      this.db.exec('ALTER TABLE orders ADD COLUMN is_read INTEGER NOT NULL DEFAULT 0');
    }
  }

  private seedDefaultsIfEmpty(): void {
    const countRow = this.db.prepare('SELECT COUNT(*) AS cnt FROM products').get() as {
      cnt: number;
    };

    if (countRow.cnt === 0) {
      const insertProduct = this.db.prepare(`
        INSERT INTO products (
          id, name, category, volume, original_price, discounted_price,
          images_json, variants_json, description, usage_text, ingredients_json,
          in_stock, sort_order, featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const seedTx = this.db.transaction(() => {
        for (const item of SEED_PRODUCTS) {
          insertProduct.run(
            item.id,
            item.name,
            item.category,
            item.volume,
            item.originalPrice,
            item.discountedPrice,
            JSON.stringify(item.images),
            JSON.stringify(item.variants),
            item.description,
            item.usage,
            JSON.stringify(item.ingredients),
            item.inStock ? 1 : 0,
            item.sortOrder,
            item.featured ? 1 : 0
          );
        }
      });
      seedTx();
    }

    const insertSetting = this.db.prepare(
      'INSERT OR IGNORE INTO store_settings (key, value) VALUES (?, ?)'
    );
    const defaultPairs: Array<[string, string]> = [
      ['opening_discount_enabled', String(DEFAULT_STORE_SETTINGS.openingDiscountEnabled)],
      ['opening_discount_percent', String(DEFAULT_STORE_SETTINGS.openingDiscountPercent)],
      ['free_shipping_min_items', String(DEFAULT_STORE_SETTINGS.freeShippingMinItems)],
      ['shipping_fee_egp', String(DEFAULT_STORE_SETTINGS.shippingFeeEgp)],
      ['whatsapp_number', DEFAULT_STORE_SETTINGS.whatsappNumber],
      ['facebook_url', DEFAULT_STORE_SETTINGS.facebookUrl],
      ['instagram_url', DEFAULT_STORE_SETTINGS.instagramUrl],
      ['announcement_text', DEFAULT_STORE_SETTINGS.announcementText],
      ['teaser_enabled', String(DEFAULT_STORE_SETTINGS.teaserEnabled)],
      ['teaser_title', DEFAULT_STORE_SETTINGS.teaserTitle],
      ['teaser_subtitle', DEFAULT_STORE_SETTINGS.teaserSubtitle],
      ['teaser_bar_text', DEFAULT_STORE_SETTINGS.teaserBarText],
    ];
    for (const [k, v] of defaultPairs) {
      insertSetting.run(k, v);
    }

    // Upgrade legacy placeholder WhatsApp number to official Auraglow number
    this.db
      .prepare(
        `UPDATE store_settings SET value = ? WHERE key = 'whatsapp_number' AND (value = '' OR value = '201000000000')`
      )
      .run(DEFAULT_STORE_SETTINGS.whatsappNumber);
  }

  private mapProductRow(row: ProductRow): StoreProduct {
    return {
      id: row.id,
      name: row.name,
      category: VALID_CATEGORIES.has(row.category as ProductCategory)
        ? (row.category as ProductCategory)
        : 'skin',
      volume: row.volume,
      originalPrice: Number(row.original_price),
      discountedPrice: Number(row.discounted_price),
      images: JSON.parse(row.images_json) as string[],
      variants: JSON.parse(row.variants_json || '[]') as ProductVariant[],
      description: row.description,
      usage: row.usage_text,
      ingredients: JSON.parse(row.ingredients_json) as string[],
      inStock: row.in_stock === 1,
      sortOrder: Number(row.sort_order),
      featured: row.featured === 1,
    };
  }

  private mapOrderRow(row: OrderRow): StoreOrder {
    return {
      id: row.id,
      orderCode: row.order_code,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      governorate: row.governorate,
      address: row.address,
      notes: row.notes,
      items: JSON.parse(row.items_json) as OrderItemSnapshot[],
      totalItemsCount: Number(row.total_items_count),
      subtotalOriginal: Number(row.subtotal_original),
      subtotalFinal: Number(row.subtotal_final),
      discountTotal: Number(row.discount_total),
      shippingFee: Number(row.shipping_fee),
      grandTotal: Number(row.grand_total),
      status: VALID_ORDER_STATUSES.has(row.status as OrderStatus)
        ? (row.status as OrderStatus)
        : 'new',
      isRead: Number(row.is_read ?? 0) === 1,
      createdAt: row.created_at,
    };
  }

  // ---------- Settings & Admin Password Hash ----------

  getSettings(): StoreSettings {
    const rows = this.db
      .prepare('SELECT key, value FROM store_settings WHERE key != ?')
      .all('admin_password_hash') as Array<{ key: string; value: string }>;
    const map = new Map(rows.map((r) => [r.key, r.value]));

    return {
      openingDiscountEnabled: map.get('opening_discount_enabled') !== 'false',
      openingDiscountPercent: Number(
        map.get('opening_discount_percent') ?? DEFAULT_STORE_SETTINGS.openingDiscountPercent
      ),
      freeShippingMinItems: Number(
        map.get('free_shipping_min_items') ?? DEFAULT_STORE_SETTINGS.freeShippingMinItems
      ),
      shippingFeeEgp: Number(
        map.get('shipping_fee_egp') ?? DEFAULT_STORE_SETTINGS.shippingFeeEgp
      ),
      whatsappNumber: map.get('whatsapp_number') ?? DEFAULT_STORE_SETTINGS.whatsappNumber,
      facebookUrl: map.get('facebook_url') ?? DEFAULT_STORE_SETTINGS.facebookUrl,
      instagramUrl: map.get('instagram_url') ?? DEFAULT_STORE_SETTINGS.instagramUrl,
      announcementText: map.get('announcement_text') ?? DEFAULT_STORE_SETTINGS.announcementText,
      teaserEnabled: map.get('teaser_enabled') !== 'false',
      teaserTitle: map.get('teaser_title') ?? DEFAULT_STORE_SETTINGS.teaserTitle,
      teaserSubtitle: map.get('teaser_subtitle') ?? DEFAULT_STORE_SETTINGS.teaserSubtitle,
      teaserBarText: map.get('teaser_bar_text') ?? DEFAULT_STORE_SETTINGS.teaserBarText,
    };
  }

  updateSettings(patch: Partial<StoreSettings>): StoreSettings {
    const current = this.getSettings();
    const next: StoreSettings = {
      openingDiscountEnabled:
        typeof patch.openingDiscountEnabled === 'boolean'
          ? patch.openingDiscountEnabled
          : current.openingDiscountEnabled,
      openingDiscountPercent:
        typeof patch.openingDiscountPercent === 'number' &&
        Number.isFinite(patch.openingDiscountPercent)
          ? Math.min(Math.max(Math.round(patch.openingDiscountPercent), 0), 90)
          : current.openingDiscountPercent,
      freeShippingMinItems:
        typeof patch.freeShippingMinItems === 'number' &&
        Number.isFinite(patch.freeShippingMinItems)
          ? Math.min(Math.max(Math.round(patch.freeShippingMinItems), 1), 20)
          : current.freeShippingMinItems,
      shippingFeeEgp:
        typeof patch.shippingFeeEgp === 'number' && Number.isFinite(patch.shippingFeeEgp)
          ? Math.min(Math.max(Math.round(patch.shippingFeeEgp), 0), 1000)
          : current.shippingFeeEgp,
      whatsappNumber:
        typeof patch.whatsappNumber === 'string'
          ? patch.whatsappNumber.replace(/[^\d]/g, '').slice(0, 16) || current.whatsappNumber
          : current.whatsappNumber,
      facebookUrl:
        typeof patch.facebookUrl === 'string'
          ? sanitizeExternalUrl(patch.facebookUrl)
          : current.facebookUrl,
      instagramUrl:
        typeof patch.instagramUrl === 'string'
          ? sanitizeExternalUrl(patch.instagramUrl)
          : current.instagramUrl,
      announcementText:
        typeof patch.announcementText === 'string' && patch.announcementText.trim()
          ? patch.announcementText.trim().slice(0, 220)
          : current.announcementText,
      teaserEnabled:
        typeof patch.teaserEnabled === 'boolean' ? patch.teaserEnabled : current.teaserEnabled,
      teaserTitle:
        typeof patch.teaserTitle === 'string' && patch.teaserTitle.trim()
          ? patch.teaserTitle.trim().slice(0, 120)
          : current.teaserTitle,
      teaserSubtitle:
        typeof patch.teaserSubtitle === 'string' && patch.teaserSubtitle.trim()
          ? patch.teaserSubtitle.trim().slice(0, 320)
          : current.teaserSubtitle,
      teaserBarText:
        typeof patch.teaserBarText === 'string' && patch.teaserBarText.trim()
          ? patch.teaserBarText.trim().slice(0, 160)
          : current.teaserBarText,
    };

    const upsert = this.db.prepare(
      'INSERT INTO store_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    );
    const tx = this.db.transaction(() => {
      upsert.run('opening_discount_enabled', String(next.openingDiscountEnabled));
      upsert.run('opening_discount_percent', String(next.openingDiscountPercent));
      upsert.run('free_shipping_min_items', String(next.freeShippingMinItems));
      upsert.run('shipping_fee_egp', String(next.shippingFeeEgp));
      upsert.run('whatsapp_number', next.whatsappNumber);
      upsert.run('facebook_url', next.facebookUrl);
      upsert.run('instagram_url', next.instagramUrl);
      upsert.run('announcement_text', next.announcementText);
      upsert.run('teaser_enabled', String(next.teaserEnabled));
      upsert.run('teaser_title', next.teaserTitle);
      upsert.run('teaser_subtitle', next.teaserSubtitle);
      upsert.run('teaser_bar_text', next.teaserBarText);
    });
    tx();

    return this.getSettings();
  }

  getAdminPasswordHash(): string | null {
    const row = this.db
      .prepare('SELECT value FROM store_settings WHERE key = ?')
      .get('admin_password_hash') as { value: string } | undefined;
    return row?.value ?? null;
  }

  claimAdminPasswordHash(hash: string): boolean {
    const res = this.db
      .prepare('INSERT OR IGNORE INTO store_settings (key, value) VALUES (?, ?)')
      .run('admin_password_hash', hash);
    return res.changes === 1;
  }

  // ---------- Products CRUD ----------

  listProducts(): StoreProduct[] {
    const rows = this.db
      .prepare('SELECT * FROM products ORDER BY sort_order ASC, rowid ASC')
      .all() as ProductRow[];
    return rows.map((row) => this.mapProductRow(row));
  }

  getProductById(id: string): StoreProduct | null {
    const row = this.db
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(id) as ProductRow | undefined;
    return row ? this.mapProductRow(row) : null;
  }

  private validateProductPayload(input: ProductPayloadInput): ProductPayloadInput {
    const name = String(input.name ?? '').trim();
    if (name.length < 2 || name.length > 140) {
      throw new Error('اسم المنتج مطلوب ويجب أن يكون بين حرفين و140 حرفاً.');
    }
    if (!VALID_CATEGORIES.has(input.category)) {
      throw new Error('القسم المختار غير صحيح.');
    }
    const volume = String(input.volume ?? '').trim();
    if (!volume || volume.length > 40) {
      throw new Error('حجم المنتج مطلوب.');
    }
    const originalPrice = Number(input.originalPrice);
    const discountedPrice = Number(input.discountedPrice);
    if (!Number.isFinite(originalPrice) || originalPrice <= 0 || originalPrice > 100000) {
      throw new Error('السعر قبل الخصم يجب أن يكون رقماً صحيحاً أكبر من صفر.');
    }
    if (!Number.isFinite(discountedPrice) || discountedPrice <= 0 || discountedPrice > originalPrice) {
      throw new Error('السعر بعد الخصم يجب أن يكون أكبر من صفر ولا يتجاوز السعر قبل الخصم.');
    }

    const sanitizedImages = (Array.isArray(input.images) ? input.images : [])
      .map((img) => sanitizeImagePath(img))
      .filter((img): img is string => Boolean(img));

    if (sanitizedImages.length === 0) {
      throw new Error('يجب إضافة صورة واحدة صحيحة على الأقل للمنتج.');
    }

    const sanitizedVariants: ProductVariant[] = (Array.isArray(input.variants) ? input.variants : [])
      .map((v) => {
        const label = String(v?.label ?? '').trim().slice(0, 50);
        const image = sanitizeImagePath(v?.image ?? '') ?? sanitizedImages[0];
        return label ? { label, image } : null;
      })
      .filter((v): v is ProductVariant => Boolean(v));

    const description = String(input.description ?? '').trim().slice(0, 1200);
    const usage = String(input.usage ?? '').trim().slice(0, 800);
    const ingredients = (Array.isArray(input.ingredients) ? input.ingredients : [])
      .map((ing) => String(ing).trim())
      .filter(Boolean)
      .slice(0, 25);

    return {
      name,
      category: input.category,
      volume,
      originalPrice: Math.round(originalPrice * 100) / 100,
      discountedPrice: Math.round(discountedPrice * 100) / 100,
      images: sanitizedImages,
      variants: sanitizedVariants,
      description,
      usage,
      ingredients,
      inStock: Boolean(input.inStock),
      featured: Boolean(input.featured),
    };
  }

  createProduct(input: ProductPayloadInput): StoreProduct {
    const clean = this.validateProductPayload(input);
    const id = slugifyProductId(clean.name);
    const maxSortRow = this.db
      .prepare('SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM products')
      .get() as { max_sort: number };

    this.db
      .prepare(`
        INSERT INTO products (
          id, name, category, volume, original_price, discounted_price,
          images_json, variants_json, description, usage_text, ingredients_json,
          in_stock, sort_order, featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        id,
        clean.name,
        clean.category,
        clean.volume,
        clean.originalPrice,
        clean.discountedPrice,
        JSON.stringify(clean.images),
        JSON.stringify(clean.variants ?? []),
        clean.description,
        clean.usage,
        JSON.stringify(clean.ingredients),
        clean.inStock ? 1 : 0,
        maxSortRow.max_sort + 1,
        clean.featured ? 1 : 0
      );

    const created = this.getProductById(id);
    if (!created) throw new Error('تعذر حفظ المنتج الجديد.');
    return created;
  }

  updateProduct(id: string, input: ProductPayloadInput): StoreProduct | null {
    const existing = this.getProductById(id);
    if (!existing) return null;
    const clean = this.validateProductPayload(input);

    this.db
      .prepare(`
        UPDATE products SET
          name = ?,
          category = ?,
          volume = ?,
          original_price = ?,
          discounted_price = ?,
          images_json = ?,
          variants_json = ?,
          description = ?,
          usage_text = ?,
          ingredients_json = ?,
          in_stock = ?,
          featured = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `)
      .run(
        clean.name,
        clean.category,
        clean.volume,
        clean.originalPrice,
        clean.discountedPrice,
        JSON.stringify(clean.images),
        JSON.stringify(clean.variants ?? []),
        clean.description,
        clean.usage,
        JSON.stringify(clean.ingredients),
        clean.inStock ? 1 : 0,
        clean.featured ? 1 : 0,
        id
      );

    return this.getProductById(id);
  }

  deleteProduct(id: string): boolean {
    const res = this.db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return res.changes > 0;
  }

  bulkUpdateProductPrices(items: BulkPriceUpdateItem[]): StoreProduct[] {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('لم يتم إرسال أي أسعار للتحديث.');
    }

    const validated = items.map((entry) => {
      const id = String(entry?.id ?? '').trim();
      const originalPrice = Number(entry?.originalPrice);
      const discountedPrice = Number(entry?.discountedPrice);
      if (!id) {
        throw new Error('معرّف أحد المنتجات غير صالح.');
      }
      if (!Number.isFinite(originalPrice) || originalPrice <= 0 || originalPrice > 100000) {
        throw new Error('السعر قبل الخصم يجب أن يكون رقماً أكبر من صفر.');
      }
      if (
        !Number.isFinite(discountedPrice) ||
        discountedPrice <= 0 ||
        discountedPrice > originalPrice
      ) {
        throw new Error(
          'السعر بعد الخصم يجب أن يكون أكبر من صفر ولا يتجاوز السعر قبل الخصم.'
        );
      }
      return {
        id,
        originalPrice: Math.round(originalPrice * 100) / 100,
        discountedPrice: Math.round(discountedPrice * 100) / 100,
      };
    });

    const stmt = this.db.prepare(`
      UPDATE products
      SET original_price = ?, discounted_price = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    const tx = this.db.transaction(() => {
      for (const item of validated) {
        stmt.run(item.originalPrice, item.discountedPrice, item.id);
      }
    });
    tx();

    return this.listProducts();
  }

  // ---------- Orders ----------

  listOrders(): StoreOrder[] {
    const rows = this.db
      .prepare('SELECT * FROM orders ORDER BY is_read ASC, id DESC')
      .all() as OrderRow[];
    return rows.map((row) => this.mapOrderRow(row));
  }

  createOrder(input: OrderCreateInput): StoreOrder {
    const customerName = String(input.customerName ?? '').trim();
    const rawPhone = String(input.customerPhone ?? '')
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .replace(/[^\d+]/g, '')
      .trim();
    const governorate = String(input.governorate ?? '').trim();
    const address = String(input.address ?? '').trim();
    const notes = String(input.notes ?? '').trim().slice(0, 600);

    if (customerName.length < 2 || customerName.length > 100) {
      throw new Error('يرجى إدخال الاسم بالكامل.');
    }
    const normalizedPhone = rawPhone.startsWith('+20')
      ? `0${rawPhone.slice(3)}`
      : rawPhone.startsWith('20') && rawPhone.length === 12
        ? `0${rawPhone.slice(2)}`
        : rawPhone;

    if (!/^01[0125]\d{8}$/.test(normalizedPhone)) {
      throw new Error('يرجى إدخال رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01).');
    }
    if (!governorate || governorate.length > 60) {
      throw new Error('يرجى اختيار المحافظة.');
    }
    if (address.length < 5 || address.length > 350) {
      throw new Error('يرجى كتابة العنوان بالتفصيل لتسهيل التوصيل.');
    }
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new Error('السلة فارغة — أضيفي منتجاً واحداً على الأقل لإتمام الطلب.');
    }

    const settings = this.getSettings();
    const snapshots: OrderItemSnapshot[] = [];
    let totalItemsCount = 0;
    let subtotalOriginal = 0;
    let subtotalFinal = 0;

    for (const reqItem of input.items) {
      const qty = Math.floor(Number(reqItem.quantity));
      if (!Number.isFinite(qty) || qty < 1 || qty > 50) {
        throw new Error('كمية المنتج غير صالحة.');
      }
      const product = this.getProductById(String(reqItem.productId ?? ''));
      if (!product) {
        throw new Error('أحد المنتجات المختارة غير موجود حالياً.');
      }
      if (!product.inStock) {
        throw new Error(`المنتج "${product.name}" غير متوفر حالياً.`);
      }

      const unitOriginal = product.originalPrice;
      const unitFinal = settings.openingDiscountEnabled
        ? product.discountedPrice
        : product.originalPrice;
      const lineTotal = Math.round(unitFinal * qty * 100) / 100;

      totalItemsCount += qty;
      subtotalOriginal += unitOriginal * qty;
      subtotalFinal += lineTotal;

      snapshots.push({
        productId: product.id,
        productName: product.name,
        variantLabel: reqItem.variantLabel ? String(reqItem.variantLabel).trim().slice(0, 50) : undefined,
        volume: product.volume,
        unitOriginalPrice: unitOriginal,
        unitFinalPrice: unitFinal,
        quantity: qty,
        lineTotal,
      });
    }

    subtotalOriginal = Math.round(subtotalOriginal * 100) / 100;
    subtotalFinal = Math.round(subtotalFinal * 100) / 100;
    const discountTotal = Math.max(0, Math.round((subtotalOriginal - subtotalFinal) * 100) / 100);
    const shippingFee =
      totalItemsCount >= settings.freeShippingMinItems ? 0 : settings.shippingFeeEgp;
    const grandTotal = Math.round((subtotalFinal + shippingFee) * 100) / 100;

    const maxIdRow = this.db
      .prepare('SELECT COALESCE(MAX(id), 0) AS max_id FROM orders')
      .get() as { max_id: number };
    const orderCode = `AG-${1001 + maxIdRow.max_id}`;

    const info = this.db
      .prepare(`
        INSERT INTO orders (
          order_code, customer_name, customer_phone, governorate, address, notes,
          items_json, total_items_count, subtotal_original, subtotal_final,
          discount_total, shipping_fee, grand_total, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
      `)
      .run(
        orderCode,
        customerName,
        normalizedPhone,
        governorate,
        address,
        notes,
        JSON.stringify(snapshots),
        totalItemsCount,
        subtotalOriginal,
        subtotalFinal,
        discountTotal,
        shippingFee,
        grandTotal
      );

    const row = this.db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .get(info.lastInsertRowid) as OrderRow;
    return this.mapOrderRow(row);
  }

  updateOrderStatus(id: number, status: OrderStatus): StoreOrder | null {
    if (!VALID_ORDER_STATUSES.has(status)) {
      throw new Error('حالة الطلب غير صالحة.');
    }
    const res = this.db
      .prepare('UPDATE orders SET status = ?, is_read = 1 WHERE id = ?')
      .run(status, id);
    if (res.changes === 0) return null;
    const row = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
    return this.mapOrderRow(row);
  }

  markOrderRead(id: number, isRead: boolean): StoreOrder | null {
    const res = this.db
      .prepare('UPDATE orders SET is_read = ? WHERE id = ?')
      .run(isRead ? 1 : 0, id);
    if (res.changes === 0) return null;
    const row = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow;
    return this.mapOrderRow(row);
  }

  markAllOrdersRead(): number {
    const res = this.db.prepare('UPDATE orders SET is_read = 1 WHERE is_read = 0').run();
    return res.changes;
  }
}
