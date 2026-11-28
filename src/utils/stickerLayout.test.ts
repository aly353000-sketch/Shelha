import test from 'node:test';
import assert from 'node:assert/strict';
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  DEFAULT_STICKER_DATA,
  STICKER_HEIGHT_MM,
  STICKER_WIDTH_MM,
  computeA4Imposition,
  isDefaultPrintConfig,
  mmToPxAtDpi,
  parseIngredientsList,
} from './stickerLayout';

test('4x4 A4 imposition places 16 exact 40x60mm stickers with safe symmetric margins', () => {
  const layout = computeA4Imposition('4x4');
  assert.equal(layout.pageWidthMm, A4_WIDTH_MM);
  assert.equal(layout.pageHeightMm, A4_HEIGHT_MM);
  assert.equal(layout.stickerWidthMm, STICKER_WIDTH_MM);
  assert.equal(layout.stickerHeightMm, STICKER_HEIGHT_MM);
  assert.equal(layout.totalStickers, 16);
  assert.equal(layout.cells.length, 16);
  assert.equal(layout.marginXMm, 16);
  assert.equal(layout.marginYMm, 19.5);
  assert.equal(layout.fitsSafely, true);

  // First and last cell bounds stay strictly inside A4 sheet
  const first = layout.cells[0];
  const last = layout.cells[15];
  assert.equal(first.xMm, 16);
  assert.equal(first.yMm, 19.5);
  assert.equal(last.xMm + last.widthMm, A4_WIDTH_MM - 16);
  assert.equal(last.yMm + last.heightMm, A4_HEIGHT_MM - 19.5);
});

test('4x3 A4 imposition places 12 exact 40x60mm stickers with generous cutting margins', () => {
  const layout = computeA4Imposition('4x3');
  assert.equal(layout.totalStickers, 12);
  assert.equal(layout.cells.length, 12);
  assert.equal(layout.fitsSafely, true);
  assert.ok(layout.marginXMm >= 10);
  assert.ok(layout.marginYMm >= 40);
});

test('default sticker data preserves all 11 active ingredients from the product brief', () => {
  const ingredients = parseIngredientsList(DEFAULT_STICKER_DATA.ingredientsList);
  assert.equal(ingredients.length, 11);
  assert.equal(ingredients[0], 'Sweet Almond Oil');
  assert.equal(ingredients[3], 'Shea Butter');
  assert.equal(ingredients[10], 'Perfume (Low)');
});

test('isDefaultPrintConfig detects custom edits accurately', () => {
  assert.equal(
    isDefaultPrintConfig(DEFAULT_STICKER_DATA, 'emerald', '4x4', true),
    true
  );
  assert.equal(
    isDefaultPrintConfig(
      { ...DEFAULT_STICKER_DATA, volumeText: '60 مل' },
      'emerald',
      '4x4',
      true
    ),
    false
  );
  assert.equal(
    isDefaultPrintConfig(DEFAULT_STICKER_DATA, 'ivory', '4x4', true),
    false
  );
  assert.equal(
    isDefaultPrintConfig(DEFAULT_STICKER_DATA, 'emerald', '4x3', true),
    false
  );
});

test('mmToPxAtDpi converts A4 and 4x6cm dimensions accurately at 300 DPI', () => {
  assert.equal(Math.round(mmToPxAtDpi(A4_WIDTH_MM, 300)), 2480);
  assert.equal(Math.round(mmToPxAtDpi(A4_HEIGHT_MM, 300)), 3508);
  assert.equal(Math.round(mmToPxAtDpi(STICKER_WIDTH_MM, 300)), 472);
  assert.equal(Math.round(mmToPxAtDpi(STICKER_HEIGHT_MM, 300)), 709);
});
