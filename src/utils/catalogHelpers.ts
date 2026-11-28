export type ProductCategory = 'all' | 'hair' | 'skin' | 'body';

export interface AuraglowProduct {
  id: string;
  order: number;
  category: Exclude<ProductCategory, 'all'>;
  categoryArabic: string;
  nameArabic: string;
  nameEnglish: string;
  taglineArabic: string;
  volumeArabic: string;
  stickerSizeCm: string;
  descriptionArabic: string;
  keyIngredients: string[];
  usageArabic: string;
  accentHex: string;
  studioImagePath: string;
  stickerImagePath: string;
  originalPhotoPath?: string;
  downloadFilename: string;
  variantLabel?: string;
}

export interface CategorySummary {
  id: ProductCategory;
  labelArabic: string;
  count: number;
}

export function getCategorySummaries(products: AuraglowProduct[]): CategorySummary[] {
  const hairCount = products.filter((p) => p.category === 'hair').length;
  const skinCount = products.filter((p) => p.category === 'skin').length;
  const bodyCount = products.filter((p) => p.category === 'body').length;

  return [
    { id: 'all', labelArabic: 'جميع المنتجات', count: products.length },
    { id: 'hair', labelArabic: 'العناية بالشعر', count: hairCount },
    { id: 'skin', labelArabic: 'العناية بالبشرة', count: skinCount },
    { id: 'body', labelArabic: 'الجسم واليدين', count: bodyCount },
  ];
}

export function filterAuraglowProducts(
  products: AuraglowProduct[],
  category: ProductCategory,
  searchQuery: string
): AuraglowProduct[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    if (category !== 'all' && product.category !== category) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      product.nameArabic,
      product.nameEnglish,
      product.taglineArabic,
      product.categoryArabic,
      product.volumeArabic,
      product.variantLabel ?? '',
      product.descriptionArabic,
      ...product.keyIngredients,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function buildWhatsAppCaption(
  product: AuraglowProduct,
  options?: { priceEgp?: string; whatsappNote?: string }
): string {
  const titleLine = product.variantLabel
    ? `${product.nameArabic} (${product.variantLabel}) — ${product.volumeArabic}`
    : `${product.nameArabic} — ${product.volumeArabic}`;

  const topIngredients = product.keyIngredients.slice(0, 5).join(' • ');
  const trimmedPrice = options?.priceEgp?.trim();
  const trimmedNote = options?.whatsappNote?.trim();

  const lines: string[] = [
    `أوراجلو Auraglow | ${titleLine}`,
    product.taglineArabic,
    '',
    product.descriptionArabic,
    '',
    `أهم المواد الفعالة: ${topIngredients}`,
    `طريقة الاستخدام: ${product.usageArabic}`,
  ];

  if (trimmedPrice) {
    lines.push('', `السعر: ${trimmedPrice} جنيه`);
  }

  if (trimmedNote) {
    lines.push(trimmedNote);
  } else {
    lines.push(
      '',
      '🎉 عرض الافتتاح: خصم 20% على جميع المنتجات لفترة محدودة!',
      '🚚 متاح التوصيل لأي مكان — والتوصيل مجاني في حالة طلب 3 منتجات.',
      '📩 للطلب أو معرفة الأنسب ليكي ابعتيلنا رسالة خاص دلوقتي.'
    );
  }

  return lines.join('\n');
}
