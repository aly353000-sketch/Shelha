import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_PRODUCTS } from '../../server/seedProducts';
import { DEFAULT_STORE_SETTINGS } from '../../server/storeDb';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  calculateCartSummary,
  filterStoreProducts,
  formatDisplayEgyptPhone,
  isValidEgyptMobile,
  normalizeEgyptMobile,
} from './storefrontLogic';

test('calculateCartSummary applies 20% discount when enabled and free shipping at 3+ items', () => {
  const twoItems = calculateCartSummary(
    [
      { productId: 'hair-loss-shampoo', quantity: 1 }, // 180 -> 144
      { productId: 'brightening-serum', quantity: 1 }, // 190 -> 152
    ],
    SEED_PRODUCTS,
    DEFAULT_STORE_SETTINGS
  );
  assert.equal(twoItems.totalItemsCount, 2);
  assert.equal(twoItems.subtotalOriginal, 370);
  assert.equal(twoItems.subtotalFinal, 296);
  assert.equal(twoItems.discountTotal, 74);
  assert.equal(twoItems.isFreeShipping, false);
  assert.equal(twoItems.itemsNeededForFreeShipping, 1);
  assert.equal(twoItems.shippingFee, 60);
  assert.equal(twoItems.grandTotal, 356);

  const threeItems = calculateCartSummary(
    [
      { productId: 'hair-loss-shampoo', quantity: 1 }, // 144
      { productId: 'brightening-serum', quantity: 1 }, // 152
      { productId: 'lip-balm', quantity: 1 }, // 56
    ],
    SEED_PRODUCTS,
    DEFAULT_STORE_SETTINGS
  );
  assert.equal(threeItems.totalItemsCount, 3);
  assert.equal(threeItems.isFreeShipping, true);
  assert.equal(threeItems.shippingFee, 0);
  assert.equal(threeItems.grandTotal, 352);

  // When opening discount is switched OFF, original prices apply
  const noDiscount = calculateCartSummary(
    [{ productId: 'hair-loss-shampoo', quantity: 3 }],
    SEED_PRODUCTS,
    { ...DEFAULT_STORE_SETTINGS, openingDiscountEnabled: false }
  );
  assert.equal(noDiscount.subtotalFinal, 540);
  assert.equal(noDiscount.discountTotal, 0);
  assert.equal(noDiscount.shippingFee, 0);
  assert.equal(noDiscount.grandTotal, 540);
});

test('Egyptian mobile number normalization and validation', () => {
  assert.equal(normalizeEgyptMobile('٠١٠١٢٣٤٥٦٧٨'), '01012345678');
  assert.equal(normalizeEgyptMobile('+201112345678'), '01112345678');
  assert.equal(isValidEgyptMobile('01012345678'), true);
  assert.equal(isValidEgyptMobile('01234567890'), true);
  assert.equal(isValidEgyptMobile('01555555555'), true);
  assert.equal(isValidEgyptMobile('01912345678'), false);
  assert.equal(isValidEgyptMobile('12345'), false);
});

test('filterStoreProducts filters by category and Arabic/English query', () => {
  const bodyOnly = filterStoreProducts(SEED_PRODUCTS, 'body', '');
  assert.equal(bodyOnly.length, 3);

  const searchLavender = filterStoreProducts(SEED_PRODUCTS, 'all', 'لافندر');
  assert.equal(searchLavender.length, 1);
  assert.equal(searchLavender[0].id, 'shower-gel');

  const searchIngredient = filterStoreProducts(SEED_PRODUCTS, 'skin', 'Niacinamide');
  assert.ok(searchIngredient.length >= 3);
});

test('buildWhatsAppOrderMessage and URL encode order details cleanly', () => {
  const msg = buildWhatsAppOrderMessage({
    id: 1,
    orderCode: 'AG-1001',
    customerName: 'سارة علي',
    customerPhone: '01012345678',
    governorate: 'القاهرة',
    address: 'مدينة نصر - شارع عباس العقاد',
    notes: 'الاتصال قبل الوصول',
    items: [
      {
        productId: 'shower-gel',
        productName: 'جل دش (فراولة، خوخ، لافندر)',
        variantLabel: 'خوخ',
        volume: '500 مل',
        unitOriginalPrice: 130,
        unitFinalPrice: 104,
        quantity: 3,
        lineTotal: 312,
      },
    ],
    totalItemsCount: 3,
    subtotalOriginal: 390,
    subtotalFinal: 312,
    discountTotal: 78,
    shippingFee: 0,
    grandTotal: 312,
    status: 'new',
    isRead: false,
    createdAt: '2026-11-24',
  });
  assert.match(msg, /AG-1001/);
  assert.match(msg, /خوخ/);
  assert.match(msg, /مجاني/);
  assert.match(msg, /312 ج\.م/);
  const url = buildWhatsAppUrl('01127266860', msg);
  assert.ok(url.startsWith('https://wa.me/201127266860?text='));
  assert.equal(DEFAULT_STORE_SETTINGS.whatsappNumber, '201127266860');
  assert.equal(formatDisplayEgyptPhone('201127266860'), '01127266860');
  assert.ok(buildWhatsAppUrl('', 'test').startsWith('https://wa.me/201127266860?text='));
});
