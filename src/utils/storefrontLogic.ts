import type {
  CartItem,
  OrderStatus,
  ProductCategory,
  StoreOrder,
  StoreProduct,
  StoreSettings,
} from '../types/store';

export const CATEGORY_LABELS: Record<ProductCategory, { arabic: string; english: string; blurb: string }> = {
  hair: {
    arabic: 'العناية بالشعر',
    english: 'Hair Care',
    blurb: 'شامبوهات خالية من السلفات، ماسك ترميم، كريمات وزيوت طبيعية لنعومة ولمعان شعرك',
  },
  skin: {
    arabic: 'العناية بالبشرة',
    english: 'Skin Care',
    blurb: 'غسولات لطيفة، تونر، مرطبات، سيروم إشراقة وواقي شمس لروتين بشرة يومي متكامل',
  },
  body: {
    arabic: 'الجسم واليدين',
    english: 'Body & Hands',
    blurb: 'شاور جل برغوة كريمية، بادي باتر مخفوق، وهاند كريم بعبوات أنيقة وعملية',
  },
};

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; toneClass: string }> = {
  new: { label: 'طلب جديد', toneClass: 'bg-[#F5EBD6] text-[#7D5817]' },
  confirmed: { label: 'تم التأكيد', toneClass: 'bg-[#E1EFE6] text-[#1D5B3A]' },
  shipping: { label: 'قيد الشحن', toneClass: 'bg-[#E2EDF7] text-[#1E4F7A]' },
  delivered: { label: 'تم التسليم', toneClass: 'bg-[#1E3228] text-[#F7F3EA]' },
  cancelled: { label: 'ملغي', toneClass: 'bg-[#F7E5E3] text-[#8F342A]' },
};

export const EGYPT_GOVERNORATES: string[] = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'القليوبية',
  'الشرقية',
  'الدقهلية',
  'الغربية',
  'المنوفية',
  'البحيرة',
  'كفر الشيخ',
  'دمياط',
  'بورسعيد',
  'الإسماعيلية',
  'السويس',
  'الفيوم',
  'بني سويف',
  'المنيا',
  'أسيوط',
  'سوهاج',
  'قنا',
  'الأقصر',
  'أسوان',
  'البحر الأحمر',
  'الوادي الجديد',
  'مطروح',
  'شمال سيناء',
  'جنوب سيناء',
];

export function formatEgp(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return '0';
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '');
}

export function getEffectiveUnitPrice(
  product: Pick<StoreProduct, 'originalPrice' | 'discountedPrice'>,
  settings: Pick<StoreSettings, 'openingDiscountEnabled'>
): number {
  return settings.openingDiscountEnabled ? product.discountedPrice : product.originalPrice;
}

export interface CartSummary {
  detailedItems: Array<{
    product: StoreProduct;
    variantLabel?: string;
    image: string;
    quantity: number;
    unitOriginalPrice: number;
    unitFinalPrice: number;
    lineTotal: number;
  }>;
  totalItemsCount: number;
  subtotalOriginal: number;
  subtotalFinal: number;
  discountTotal: number;
  shippingFee: number;
  isFreeShipping: boolean;
  itemsNeededForFreeShipping: number;
  grandTotal: number;
}

export function calculateCartSummary(
  cartItems: CartItem[],
  products: StoreProduct[],
  settings: StoreSettings
): CartSummary {
  const byId = new Map(products.map((p) => [p.id, p]));
  const detailedItems: CartSummary['detailedItems'] = [];
  let totalItemsCount = 0;
  let subtotalOriginal = 0;
  let subtotalFinal = 0;

  for (const entry of cartItems) {
    const product = byId.get(entry.productId);
    if (!product || entry.quantity <= 0) continue;

    const matchedVariant = entry.variantLabel
      ? product.variants.find((v) => v.label === entry.variantLabel)
      : product.variants[0];
    const image = matchedVariant?.image || product.images[0] || '/assets/auraglow/auraglow-logo.png';
    const unitOriginalPrice = product.originalPrice;
    const unitFinalPrice = getEffectiveUnitPrice(product, settings);
    const lineTotal = Math.round(unitFinalPrice * entry.quantity * 100) / 100;

    totalItemsCount += entry.quantity;
    subtotalOriginal += unitOriginalPrice * entry.quantity;
    subtotalFinal += lineTotal;

    detailedItems.push({
      product,
      variantLabel: entry.variantLabel,
      image,
      quantity: entry.quantity,
      unitOriginalPrice,
      unitFinalPrice,
      lineTotal,
    });
  }

  subtotalOriginal = Math.round(subtotalOriginal * 100) / 100;
  subtotalFinal = Math.round(subtotalFinal * 100) / 100;
  const discountTotal = Math.max(0, Math.round((subtotalOriginal - subtotalFinal) * 100) / 100);
  const isFreeShipping = totalItemsCount >= settings.freeShippingMinItems;
  const itemsNeededForFreeShipping = Math.max(0, settings.freeShippingMinItems - totalItemsCount);
  const shippingFee = totalItemsCount === 0 || isFreeShipping ? 0 : settings.shippingFeeEgp;
  const grandTotal = Math.round((subtotalFinal + shippingFee) * 100) / 100;

  return {
    detailedItems,
    totalItemsCount,
    subtotalOriginal,
    subtotalFinal,
    discountTotal,
    shippingFee,
    isFreeShipping,
    itemsNeededForFreeShipping,
    grandTotal,
  };
}

export function normalizeEgyptMobile(raw: string): string {
  const latin = raw
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^\d+]/g, '');
  if (latin.startsWith('+20')) return `0${latin.slice(3)}`;
  if (latin.startsWith('20') && latin.length === 12) return `0${latin.slice(2)}`;
  return latin;
}

export function isValidEgyptMobile(raw: string): boolean {
  return /^01[0125]\d{8}$/.test(normalizeEgyptMobile(raw));
}

export function filterStoreProducts(
  products: StoreProduct[],
  category: 'all' | ProductCategory,
  query: string
): StoreProduct[] {
  const q = query.trim().toLowerCase();
  return products.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (!q) return true;
    const haystack = [
      p.name,
      p.volume,
      p.description,
      CATEGORY_LABELS[p.category].arabic,
      ...p.ingredients,
      ...p.variants.map((v) => v.label),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function buildWhatsAppOrderMessage(order: StoreOrder): string {
  const itemLines = order.items.map((item, idx) => {
    const variantPart = item.variantLabel ? ` (${item.variantLabel})` : '';
    return `${idx + 1}. ${item.productName}${variantPart} — ${item.volume} × ${item.quantity} = ${formatEgp(item.lineTotal)} ج.م`;
  });

  const shippingLine =
    order.shippingFee === 0
      ? 'الشحن: مجاني (طلب 3 منتجات أو أكثر) 🎁'
      : `الشحن: ${formatEgp(order.shippingFee)} ج.م`;

  const lines = [
    `مرحباً أوراجلو Auraglow 🌿`,
    `طلب جديد من المتجر الإلكتروني — رقم الطلب: *${order.orderCode}*`,
    '',
    '🛍️ *تفاصيل المنتجات:*',
    ...itemLines,
    '',
    order.discountTotal > 0 ? `✨ توفير خصم الافتتاح: ${formatEgp(order.discountTotal)} ج.م` : '',
    `🚚 ${shippingLine}`,
    `💳 *الإجمالي المطلوب (الدفع عند الاستلام): ${formatEgp(order.grandTotal)} ج.م*`,
    '',
    '📍 *بيانات التوصيل:*',
    `الاسم: ${order.customerName}`,
    `الموبايل: ${order.customerPhone}`,
    `المحافظة: ${order.governorate}`,
    `العنوان: ${order.address}`,
    order.notes ? `ملاحظات: ${order.notes}` : '',
  ].filter((line, index, arr) => !(line === '' && arr[index - 1] === ''));

  return lines.join('\n').trim();
}

export function buildWhatsAppUrl(whatsappNumber: string, message: string): string {
  const digits = whatsappNumber.replace(/[^\d]/g, '');
  const intl = digits.startsWith('01') && digits.length === 11 ? `2${digits}` : digits;
  return `https://wa.me/${intl || '201127266860'}?text=${encodeURIComponent(message)}`;
}

export function formatDisplayEgyptPhone(whatsappNumber: string): string {
  const digits = whatsappNumber.replace(/[^\d]/g, '');
  if (digits.startsWith('20') && digits.length === 12) {
    return `0${digits.slice(2)}`;
  }
  return digits || '01127266860';
}
