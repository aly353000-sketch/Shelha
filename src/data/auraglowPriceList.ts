export type PriceListSectionId = 'hair' | 'skin' | 'body';

export interface PriceListItem {
  id: string;
  orderNumber: number;
  nameArabic: string;
  variantsSubtitle?: string;
  volumeArabic: string;
  originalPrice: number;
  imagePaths: string[];
  needsPriceReview?: boolean;
  reviewNoteArabic?: string;
}

export interface PriceListSection {
  id: PriceListSectionId;
  pageNumber: number;
  totalPages: number;
  titleArabic: string;
  subtitleEnglish: string;
  downloadFilename: string;
  items: PriceListItem[];
}

export const DEFAULT_DISCOUNT_PERCENT = 20;

export const OPENING_OFFER_HIGHLIGHTS = {
  badgeArabic: 'خصم الافتتاح 20%',
  deliveryArabic: 'متاح التوصيل لأي مكان',
  freeShippingArabic: 'التوصيل مجاني في حالة طلب 3 منتجات',
  fullBannerArabic:
    'عرض الافتتاح: خصم 20% على جميع المنتجات · متاح التوصيل لأي مكان · التوصيل مجاني عند طلب 3 منتجات',
} as const;

export const AURAGLOW_PRICE_LIST_SECTIONS: PriceListSection[] = [
  {
    id: 'hair',
    pageNumber: 1,
    totalPages: 3,
    titleArabic: 'العناية بالشعر',
    subtitleEnglish: 'Hair Care Collection',
    downloadFilename: 'auraglow-price-list-01-hair-care.jpg',
    items: [
      {
        id: 'pl-01-hair-loss-shampoo',
        orderNumber: 1,
        nameArabic: 'شامبو ضد التساقط',
        volumeArabic: '250 مل',
        originalPrice: 180,
        imagePaths: ['/assets/auraglow/studio/01_shampoo_hair_loss.jpg'],
      },
      {
        id: 'pl-02-dandruff-shampoo',
        orderNumber: 2,
        nameArabic: 'شامبو ضد القشرة',
        volumeArabic: '250 مل',
        originalPrice: 180,
        imagePaths: ['/assets/auraglow/studio/02_shampoo_dandruff.jpg'],
      },
      {
        id: 'pl-03-hair-mask',
        orderNumber: 3,
        nameArabic: 'ماسك ترميم',
        volumeArabic: '500 جم',
        originalPrice: 220,
        imagePaths: ['/assets/auraglow/studio/03_hair_mask.jpg'],
      },
      {
        id: 'pl-04-dry-hair-cream',
        orderNumber: 4,
        nameArabic: 'كريم الشعر الجاف',
        volumeArabic: '100 مل',
        originalPrice: 150,
        imagePaths: ['/assets/auraglow/studio/04_dry_hair_cream.jpg'],
      },
      {
        id: 'pl-05-hair-balm',
        orderNumber: 5,
        nameArabic: 'بالم الشعر بالزبد',
        volumeArabic: '100 مل',
        originalPrice: 180,
        imagePaths: ['/assets/auraglow/studio/05_hair_balm.jpg'],
      },
      {
        id: 'pl-06-hair-oil-blend',
        orderNumber: 6,
        nameArabic: 'ميكس زيوت تكثيف',
        volumeArabic: '125 مل',
        originalPrice: 220,
        imagePaths: ['/assets/auraglow/studio/06_hair_oil_blend.jpg'],
      },
      {
        id: 'pl-07-dandruff-lotion',
        orderNumber: 7,
        nameArabic: 'لوشن قشرة',
        volumeArabic: '50 مل',
        originalPrice: 80,
        imagePaths: ['/assets/auraglow/studio/02b_dandruff_lotion.jpg'],
      },
    ],
  },
  {
    id: 'skin',
    pageNumber: 2,
    totalPages: 3,
    titleArabic: 'العناية بالبشرة',
    subtitleEnglish: 'Skin Care Collection',
    downloadFilename: 'auraglow-price-list-02-skin-care.jpg',
    items: [
      {
        id: 'pl-08-cleanser-normal-dry',
        orderNumber: 8,
        nameArabic: 'غسول جل - بشرة عادية وجافة',
        volumeArabic: '125 مل',
        originalPrice: 150,
        imagePaths: ['/assets/auraglow/studio/07_cleanser_normal_dry.jpg'],
      },
      {
        id: 'pl-09-cleanser-oily',
        orderNumber: 9,
        nameArabic: 'غسول جل - بشرة دهنية',
        volumeArabic: '125 مل',
        originalPrice: 150,
        imagePaths: ['/assets/auraglow/studio/08_cleanser_oily.jpg'],
      },
      {
        id: 'pl-10-toner-normal-dry',
        orderNumber: 10,
        nameArabic: 'تونر - عادية وجافة',
        volumeArabic: '125 مل',
        originalPrice: 130,
        imagePaths: ['/assets/auraglow/studio/09_toner_normal_dry.jpg'],
      },
      {
        id: 'pl-11-toner-oily-mixed',
        orderNumber: 11,
        nameArabic: 'تونر - دهنية ومختلطة',
        volumeArabic: '125 مل',
        originalPrice: 130,
        imagePaths: ['/assets/auraglow/studio/10_toner_oily_mixed.jpg'],
      },
      {
        id: 'pl-12-cream-normal-dry',
        orderNumber: 12,
        nameArabic: 'كريم مرطب - عادية وجافة',
        volumeArabic: '100 جم',
        originalPrice: 130,
        imagePaths: ['/assets/auraglow/studio/11_cream_normal_dry.jpg'],
      },
      {
        id: 'pl-13-gel-oily-mixed',
        orderNumber: 13,
        nameArabic: 'كريم مرطب - دهنية (جل مرطب)',
        volumeArabic: '125 مل',
        originalPrice: 150,
        imagePaths: ['/assets/auraglow/studio/12_gel_oily_mixed.jpg'],
        needsPriceReview: true,
        reviewNoteArabic: 'محتفظ بالسعر السابق (150) — قابل للتعديل مباشرة',
      },
      {
        id: 'pl-14-sunscreen-spf70',
        orderNumber: 14,
        nameArabic: 'صن سكرين 70',
        volumeArabic: '50 مل',
        originalPrice: 190,
        imagePaths: ['/assets/auraglow/studio/13_sunscreen_spf70.jpg'],
      },
      {
        id: 'pl-15-brightening-serum',
        orderNumber: 15,
        nameArabic: 'سيروم تفتيح',
        volumeArabic: 'قطارة 30 مل',
        originalPrice: 190,
        imagePaths: ['/assets/auraglow/studio/14_brightening_serum.jpg'],
      },
      {
        id: 'pl-16-lip-balm',
        orderNumber: 16,
        nameArabic: 'ليب بالم',
        volumeArabic: 'قلم',
        originalPrice: 70,
        imagePaths: ['/assets/auraglow/studio/15_lip_balm.jpg'],
      },
    ],
  },
  {
    id: 'body',
    pageNumber: 3,
    totalPages: 3,
    titleArabic: 'الجسم واليدين',
    subtitleEnglish: 'Body & Hands Collection',
    downloadFilename: 'auraglow-price-list-03-body-hands.jpg',
    items: [
      {
        id: 'pl-17-shower-gel',
        orderNumber: 17,
        nameArabic: 'جل دش',
        variantsSubtitle: 'فراولة · خوخ · لافندر',
        volumeArabic: '500 مل',
        originalPrice: 130,
        imagePaths: [
          '/assets/auraglow/studio/16_shower_gel_strawberry.jpg',
          '/assets/auraglow/studio/17_shower_gel_peach.jpg',
          '/assets/auraglow/studio/18_shower_gel_lavender.jpg',
        ],
      },
      {
        id: 'pl-18-body-butter',
        orderNumber: 18,
        nameArabic: 'بادي باتر',
        variantsSubtitle: 'توت بري · مسك · رمان',
        volumeArabic: '90 جم',
        originalPrice: 140,
        imagePaths: [
          '/assets/auraglow/studio/19_body_butter_berry.jpg',
          '/assets/auraglow/studio/20_body_butter_musk.jpg',
          '/assets/auraglow/studio/21_body_butter_pomegranate.jpg',
        ],
      },
      {
        id: 'pl-19-hand-cream',
        orderNumber: 19,
        nameArabic: 'هاند كريم',
        variantsSubtitle: 'مينت · أصفر · بينك',
        volumeArabic: '60 مل',
        originalPrice: 130,
        imagePaths: [
          '/assets/auraglow/studio/22_hand_cream_mint.jpg',
          '/assets/auraglow/studio/23_hand_cream_yellow.jpg',
          '/assets/auraglow/studio/24_hand_cream_pink.jpg',
        ],
      },
    ],
  },
];

export function calculateDiscountedPrice(
  originalPrice: number,
  discountPercent: number = DEFAULT_DISCOUNT_PERCENT
): number {
  if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
    return 0;
  }
  const safeDiscount = Number.isFinite(discountPercent)
    ? Math.min(Math.max(discountPercent, 0), 100)
    : DEFAULT_DISCOUNT_PERCENT;
  const raw = originalPrice * (1 - safeDiscount / 100);
  return Math.round(raw * 100) / 100;
}

export function formatEgpAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return '0';
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '');
}

export function buildPriceListWhatsAppText(
  sections: PriceListSection[],
  priceOverrides: Record<string, number>,
  discountPercent: number = DEFAULT_DISCOUNT_PERCENT
): string {
  const safeDiscount = Number.isFinite(discountPercent)
    ? Math.min(Math.max(discountPercent, 0), 100)
    : DEFAULT_DISCOUNT_PERCENT;

  const blocks = sections.map((section) => {
    const rows = section.items.map((item) => {
      const basePrice = priceOverrides[item.id] ?? item.originalPrice;
      const finalPrice = calculateDiscountedPrice(basePrice, safeDiscount);
      const label = item.variantsSubtitle
        ? `${item.nameArabic} (${item.variantsSubtitle})`
        : item.nameArabic;
      return `• ${label} (${item.volumeArabic}) — قبل: ~${formatEgpAmount(basePrice)} ج~ | بعد الخصم: *${formatEgpAmount(finalPrice)} ج*`;
    });
    return `🌿 *${section.titleArabic}*\n${rows.join('\n')}`;
  });

  return [
    `✨ *قائمة أسعار أوراجلو (Auraglow) — خصم الافتتاح ${formatEgpAmount(safeDiscount)}%* ✨`,
    '',
    ...blocks.flatMap((block) => [block, '']),
    `🚚 ${OPENING_OFFER_HIGHLIGHTS.deliveryArabic}`,
    `🎁 ${OPENING_OFFER_HIGHLIGHTS.freeShippingArabic}`,
    '📩 للطلب ابعتيلنا رسالة باسم المنتجات دلوقتي',
  ].join('\n');
}
