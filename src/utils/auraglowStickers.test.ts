import test from 'node:test';
import assert from 'node:assert/strict';
import { AURAGLOW_STICKERS } from '../data/auraglowStickers';
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  SHEET_MARGIN_MM,
  buildA4PrintPdfHtml,
  buildAuraglowStudioHtml,
  buildCatalogPdfHtml,
  buildIndividualRollPdfHtml,
  buildSingleProductA4Sheet,
  packStickersIntoA4Sheets,
  validateAuraglowCatalog,
} from './auraglowStickers';

test('Auraglow catalog passes all business & print validation rules', () => {
  const errors = validateAuraglowCatalog(AURAGLOW_STICKERS);
  assert.deepEqual(errors, []);
  assert.equal(AURAGLOW_STICKERS.length, 22);
});

test('Auraglow catalog excludes dandruff lotion and uses Anti-Hair Loss shampoo', () => {
  assert.equal(
    AURAGLOW_STICKERS.some((s) => s.nameAr.includes('لوشن') || s.id.includes('lotion')),
    false
  );
  const shampoo = AURAGLOW_STICKERS.find((s) => s.id === 'hair-anti-hairloss-shampoo');
  assert.ok(shampoo);
  assert.match(shampoo.nameAr, /تساقط/);
  assert.equal(shampoo.sizeAr, '250 مل');
  assert.equal(shampoo.widthMm, 80);
  assert.equal(shampoo.heightMm, 110);
});

test('All 22 stickers have exact expiry 11/2030 and exact handwritten measurements', () => {
  for (const s of AURAGLOW_STICKERS) {
    assert.equal(s.expiry, '11/2030');
  }
  const serum = AURAGLOW_STICKERS.find((s) => s.id === 'skin-brightening-serum');
  assert.ok(serum);
  assert.equal(serum.widthMm, 60);
  assert.equal(serum.heightMm, 40);

  const lipBalm = AURAGLOW_STICKERS.find((s) => s.id === 'skin-lip-balm');
  assert.ok(lipBalm);
  assert.equal(lipBalm.widthMm, 40);
  assert.equal(lipBalm.heightMm, 40);

  const slimBands = AURAGLOW_STICKERS.filter((s) => s.template === 'slim-band');
  assert.equal(slimBands.length, 6);
  for (const b of slimBands) {
    assert.equal(b.widthMm, 140);
    assert.equal(b.heightMm, 20);
  }
});

test('A4 1:1 millimeter bin-packing fits every sticker cleanly within printable A4 bounds without overlap', () => {
  const sheets = packStickersIntoA4Sheets(AURAGLOW_STICKERS);
  assert.ok(sheets.length >= 2 && sheets.length <= 6);

  const placedIds = new Set<string>();
  for (const sheet of sheets) {
    for (let i = 0; i < sheet.placements.length; i++) {
      const a = sheet.placements[i];
      placedIds.add(a.sticker.id);
      assert.ok(a.xMm >= SHEET_MARGIN_MM - 0.01);
      assert.ok(a.yMm >= SHEET_MARGIN_MM - 0.01);
      assert.ok(a.xMm + a.widthMm <= A4_WIDTH_MM - SHEET_MARGIN_MM + 0.01);
      assert.ok(a.yMm + a.heightMm <= A4_HEIGHT_MM - SHEET_MARGIN_MM + 0.01);

      for (let j = i + 1; j < sheet.placements.length; j++) {
        const b = sheet.placements[j];
        const overlaps =
          a.xMm < b.xMm + b.widthMm &&
          a.xMm + a.widthMm > b.xMm &&
          a.yMm < b.yMm + b.heightMm &&
          a.yMm + a.heightMm > b.yMm;
        assert.equal(overlaps, false, `Overlap between ${a.sticker.id} and ${b.sticker.id}`);
      }
    }
  }
  assert.equal(placedIds.size, 22);
});

test('Single-product repeated A4 sheet packer computes exact copy counts', () => {
  const lipBalm = AURAGLOW_STICKERS.find((s) => s.id === 'skin-lip-balm')!;
  const lipSheet = buildSingleProductA4Sheet(lipBalm);
  assert.ok(lipSheet.count >= 20, `Expected >=20 lip balm stickers per A4, got ${lipSheet.count}`);

  const bodyButter = AURAGLOW_STICKERS.find((s) => s.id === 'body-butter-berry')!;
  const butterSheet = buildSingleProductA4Sheet(bodyButter);
  assert.ok(butterSheet.count >= 10, `Expected >=10 slim bands per A4, got ${butterSheet.count}`);
});

test('HTML builders emit all 22 stickers with bespoke artwork, bilingual decorative fonts (Aref Ruqaa + Dancing Script), tagline #1, and renamed oily moisturizing gel', () => {
  const dummyLogo = 'data:image/png;base64,AAAA';
  const a4Html = buildA4PrintPdfHtml(AURAGLOW_STICKERS, dummyLogo);
  const catHtml = buildCatalogPdfHtml(AURAGLOW_STICKERS, dummyLogo);
  const studioHtml = buildAuraglowStudioHtml(AURAGLOW_STICKERS, dummyLogo);

  for (const s of AURAGLOW_STICKERS) {
    assert.ok(s.artworkSourcePath.startsWith('src/assets/images/ag_'));
    assert.equal(s.taglineAr, 'لأن جمالكِ يستحق الأفضل');
    assert.ok(s.nameEn.trim().length > 0);
  }

  const oilyGel = AURAGLOW_STICKERS.find((s) => s.id === 'skin-moisturizer-oily');
  assert.ok(oilyGel);
  assert.equal(oilyGel.nameAr, 'جل مرطب للبشرة الدهنية والمختلطة');
  assert.equal(oilyGel.nameEn, 'Moisturizing Gel · Oily & Mixed Skin');

  const rollHtml = buildIndividualRollPdfHtml(AURAGLOW_STICKERS, dummyLogo);
  for (const html of [a4Html, catHtml, studioHtml, rollHtml]) {
    assert.ok(html.includes('11/2030'));
    assert.ok(html.includes('لأن جمالكِ يستحق الأفضل'));
    assert.ok(!html.includes('جمالك يبدأ من أوراجلو'));
    assert.ok(!html.includes('هالةُ نقاء'));
    assert.ok(html.includes('Aref+Ruqaa'));
    assert.ok(html.includes('Dancing+Script'));
    assert.ok(html.includes('Moisturizing Gel · Oily &amp; Mixed Skin'));
    assert.ok(html.includes('جل مرطب للبشرة الدهنية والمختلطة'));
    assert.ok(html.includes('ag-artwork'));
    assert.ok(html.includes('./art/body-shower-gel-strawberry.jpg'));
    assert.ok(html.includes('شامبو تساقط وترميم'));
    assert.ok(!html.includes('undefined'));
  }
  assert.equal((rollHtml.match(/class="roll-page"/g) || []).length, 22);
  assert.ok(rollHtml.includes('@page ag_roll_0 { size: 80mm 110mm; margin: 0; }'));
  assert.ok(rollHtml.includes('size: 140mm 20mm; margin: 0;'));
  assert.ok(rollHtml.includes('size: 40mm 40mm; margin: 0;'));
  assert.ok(studioHtml.includes('./individual/hair-anti-hairloss-shampoo.pdf'));
  assert.ok(studioHtml.includes('./auraglow-all-22-stickers-individual.zip'));
  assert.ok(studioHtml.includes('./auraglow-stickers-individual-roll.pdf'));
  assert.ok(studioHtml.includes('./auraglow-a4-print-sheets.pdf'));
  assert.ok(studioHtml.includes('./auraglow-stickers-catalog.pdf'));
});
