import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AuraglowProduct,
  buildWhatsAppCaption,
  filterAuraglowProducts,
  getCategorySummaries,
} from './catalogHelpers.ts';

const SAMPLE_PRODUCTS: AuraglowProduct[] = [
  {
    id: 'shampoo-hair-loss',
    order: 1,
    category: 'hair',
    categoryArabic: 'العناية بالشعر',
    nameArabic: 'شامبو تساقط وترميم',
    nameEnglish: 'Anti-Hair Loss & Repair Shampoo',
    taglineArabic: 'خالي من السلفات • بتكنولوجيا الفايبرهانس',
    volumeArabic: '250 مل',
    stickerSizeCm: '8 × 11 سم',
    descriptionArabic: 'شامبو علاجي للتساقط غني بالكافيين وخلاصة الروزماري وبذور العنب.',
    keyIngredients: ['Caffeine', 'Rosemary Extract', 'Grape Seed Extract', 'Fiberhance', 'Panthenol'],
    usageArabic: 'يدلك به الشعر وفروة الرأس المبللة لمدة دقيقتين ثم يشطف جيداً بالماء.',
    accentHex: '#4E6B4F',
    studioImagePath: '/assets/auraglow/studio/01_shampoo_hair_loss.jpg',
    stickerImagePath: '/assets/auraglow/stickers/01_shampoo_hair_loss.png',
    originalPhotoPath: '/assets/aistudio/________________f9bb2ed8.jpg',
    downloadFilename: 'auraglow-01-anti-hair-loss-shampoo.jpg',
  },
  {
    id: 'brightening-serum',
    order: 14,
    category: 'skin',
    categoryArabic: 'العناية بالبشرة',
    nameArabic: 'سيروم تفتيح البشرة',
    nameEnglish: 'Radiance Brightening Serum',
    taglineArabic: 'إشراقة فورية وتوحيد لون البشرة',
    volumeArabic: '30 مل',
    stickerSizeCm: '6 × 4 سم',
    descriptionArabic: 'سيروم مركز لتفتيح البشرة وتوحيد اللون بمضادات الأكسدة.',
    keyIngredients: ['Alpha Arbutin', 'Niacinamide', 'Vitamin C', 'Licorice Extract'],
    usageArabic: 'توضع 3 قطرات على بشرة نظيفة مساءً قبل المرطب.',
    accentHex: '#2C3D2E',
    studioImagePath: '/assets/auraglow/studio/14_brightening_serum.jpg',
    stickerImagePath: '/assets/auraglow/stickers/14_brightening_serum.png',
    originalPhotoPath: '/assets/aistudio/________________875f02c3.jpg',
    downloadFilename: 'auraglow-14-brightening-serum.jpg',
  },
  {
    id: 'hand-cream-mint',
    order: 22,
    category: 'body',
    categoryArabic: 'الجسم واليدين',
    nameArabic: 'هاند كريم مرطب',
    nameEnglish: 'Nourishing Hand Cream',
    taglineArabic: 'نعومة فائقة لليدين طوال اليوم',
    volumeArabic: '60 مل',
    stickerSizeCm: '4 × 6 سم',
    descriptionArabic: 'كريم مرطب يومي لليدين غني بالزيوت الطبيعية وزبدة الشيا.',
    keyIngredients: ['Sweet Almond Oil', 'Jojoba Oil', 'Shea Butter', 'Panthenol'],
    usageArabic: 'يدهن على اليدين عند الحاجة وخصوصاً بعد غسل اليدين.',
    accentHex: '#5E8A78',
    studioImagePath: '/assets/auraglow/studio/22_hand_cream_mint.jpg',
    stickerImagePath: '/assets/auraglow/stickers/22_hand_cream.png',
    originalPhotoPath: '/assets/aistudio/________________239c8ea0.jpg',
    downloadFilename: 'auraglow-22-hand-cream-mint.jpg',
    variantLabel: 'مينت جرين',
  },
];

describe('catalogHelpers', () => {
  it('computes accurate category summaries', () => {
    const summaries = getCategorySummaries(SAMPLE_PRODUCTS);
    assert.deepEqual(
      summaries.map((s) => [s.id, s.count]),
      [
        ['all', 3],
        ['hair', 1],
        ['skin', 1],
        ['body', 1],
      ]
    );
  });

  it('filters by category and Arabic or English search query', () => {
    assert.equal(filterAuraglowProducts(SAMPLE_PRODUCTS, 'hair', '').length, 1);
    assert.equal(filterAuraglowProducts(SAMPLE_PRODUCTS, 'all', 'سيروم').length, 1);
    assert.equal(filterAuraglowProducts(SAMPLE_PRODUCTS, 'all', 'niacinamide').length, 1);
    assert.equal(filterAuraglowProducts(SAMPLE_PRODUCTS, 'body', 'مينت').length, 1);
    assert.equal(filterAuraglowProducts(SAMPLE_PRODUCTS, 'skin', 'شامبو').length, 0);
  });

  it('builds formatted WhatsApp marketing caption with optional price and variant', () => {
    const captionWithPrice = buildWhatsAppCaption(SAMPLE_PRODUCTS[2], { priceEgp: '145' });
    assert.match(captionWithPrice, /هاند كريم مرطب \(مينت جرين\) — 60 مل/);
    assert.match(captionWithPrice, /السعر: 145 جنيه/);
    assert.match(captionWithPrice, /Sweet Almond Oil/);

    const captionNoPrice = buildWhatsAppCaption(SAMPLE_PRODUCTS[0]);
    assert.doesNotMatch(captionNoPrice, /السعر:/);
    assert.match(captionNoPrice, /شامبو تساقط وترميم — 250 مل/);
    assert.match(captionNoPrice, /خصم 20%/);
    assert.match(captionNoPrice, /3 منتجات/);
  });
});
