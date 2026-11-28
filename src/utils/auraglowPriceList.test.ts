import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AURAGLOW_PRICE_LIST_SECTIONS,
  DEFAULT_DISCOUNT_PERCENT,
  buildPriceListWhatsAppText,
  calculateDiscountedPrice,
  formatEgpAmount,
} from '../data/auraglowPriceList';

test('calculateDiscountedPrice handles standard 20% discount and edge cases', () => {
  assert.equal(calculateDiscountedPrice(180, 20), 144);
  assert.equal(calculateDiscountedPrice(220, 20), 176);
  assert.equal(calculateDiscountedPrice(150, 20), 120);
  assert.equal(calculateDiscountedPrice(80, 20), 64);
  assert.equal(calculateDiscountedPrice(130, 20), 104);
  assert.equal(calculateDiscountedPrice(190, 20), 152);
  assert.equal(calculateDiscountedPrice(70, 20), 56);
  assert.equal(calculateDiscountedPrice(140, 20), 112);

  assert.equal(calculateDiscountedPrice(0, 20), 0);
  assert.equal(calculateDiscountedPrice(-50, 20), 0);
  assert.equal(calculateDiscountedPrice(100, 0), 100);
  assert.equal(calculateDiscountedPrice(100, 100), 0);
  assert.equal(calculateDiscountedPrice(100, 120), 0);
});

test('all 3 price list sections contain all 19 items with exact -20% prices', () => {
  assert.equal(AURAGLOW_PRICE_LIST_SECTIONS.length, 3);
  const allItems = AURAGLOW_PRICE_LIST_SECTIONS.flatMap((s) => s.items);
  assert.equal(allItems.length, 19);

  const expectedPrices = [
    180, 180, 220, 150, 180, 220, 80, // Hair (7)
    150, 150, 130, 130, 130, 150, 190, 190, 70, // Skin (9, incl. #13 oily moisturizer at 150)
    130, 140, 130, // Body & Hands (3)
  ];
  const expectedAfter20 = [
    144, 144, 176, 120, 144, 176, 64,
    120, 120, 104, 104, 104, 120, 152, 152, 56,
    104, 112, 104,
  ];

  allItems.forEach((item, idx) => {
    assert.equal(item.originalPrice, expectedPrices[idx], `Item ${item.id} base price`);
    assert.equal(
      calculateDiscountedPrice(item.originalPrice, DEFAULT_DISCOUNT_PERCENT),
      expectedAfter20[idx],
      `Item ${item.id} after 20% discount`
    );
    assert.ok(item.imagePaths.length >= 1, `Item ${item.id} has studio image(s)`);
  });

  // Body & Hands section has 3 studio variant images per row
  const bodyItems = AURAGLOW_PRICE_LIST_SECTIONS[2].items;
  bodyItems.forEach((item) => {
    assert.equal(item.imagePaths.length, 3, `${item.id} shows all 3 studio variants`);
  });
});

test('buildPriceListWhatsAppText respects overrides and includes opening offer terms', () => {
  const text = buildPriceListWhatsAppText(
    AURAGLOW_PRICE_LIST_SECTIONS,
    { 'pl-13-gel-oily-mixed': 160 },
    20
  );
  assert.match(text, /خصم الافتتاح 20%/);
  assert.match(text, /متاح التوصيل لأي مكان/);
  assert.match(text, /التوصيل مجاني في حالة طلب 3 منتجات/);
  assert.match(text, /160 ج.*128 ج/);
  assert.equal(formatEgpAmount(144), '144');
  assert.equal(formatEgpAmount(144.5), '144.5');
});
