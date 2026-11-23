import fs from 'fs';
import path from 'path';
import { AURAGLOW_BRAND, AURAGLOW_STICKERS } from '../src/data/auraglowStickers';
import {
  buildA4PrintPdfHtml,
  buildAuraglowStudioHtml,
  buildCatalogPdfHtml,
  buildIndividualRollPdfHtml,
  packStickersIntoA4Sheets,
  validateAuraglowCatalog,
} from '../src/utils/auraglowStickers';

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'public', 'auraglow-stickers');
const artOutDir = path.join(outDir, 'art');
const logoSource = path.join(rootDir, AURAGLOW_BRAND.logoSourcePath);

const errors = validateAuraglowCatalog(AURAGLOW_STICKERS);
if (errors.length > 0) {
  console.error('❌ Auraglow sticker validation failed:');
  for (const err of errors) console.error('  -', err);
  process.exit(1);
}

if (!fs.existsSync(logoSource)) {
  console.error('❌ Auraglow logo file missing at:', logoSource);
  process.exit(1);
}

fs.mkdirSync(artOutDir, { recursive: true });

// Validate and copy all 22 bespoke product illustrations into public/auraglow-stickers/art/
for (const sticker of AURAGLOW_STICKERS) {
  const srcPath = path.join(rootDir, sticker.artworkSourcePath);
  if (!fs.existsSync(srcPath)) {
    console.error(`❌ Missing artwork file for ${sticker.id}: ${srcPath}`);
    process.exit(1);
  }
  const destPath = path.join(artOutDir, `${sticker.id}.jpg`);
  fs.copyFileSync(srcPath, destPath);
}

// Copy Auraglow logo once as a persistent JPEG asset so index.html stays lightweight and survives container restarts
const logoDestPath = path.join(artOutDir, 'auraglow-logo.jpg');
fs.copyFileSync(logoSource, logoDestPath);
const logoPublicHref = './art/auraglow-logo.jpg';

fs.writeFileSync(
  path.join(outDir, 'index.html'),
  buildAuraglowStudioHtml(AURAGLOW_STICKERS, logoPublicHref),
  'utf8'
);
fs.writeFileSync(
  path.join(outDir, '_print-a4.html'),
  buildA4PrintPdfHtml(AURAGLOW_STICKERS, logoPublicHref),
  'utf8'
);
fs.writeFileSync(
  path.join(outDir, '_print-individual.html'),
  buildIndividualRollPdfHtml(AURAGLOW_STICKERS, logoPublicHref),
  'utf8'
);
fs.writeFileSync(
  path.join(outDir, '_print-catalog.html'),
  buildCatalogPdfHtml(AURAGLOW_STICKERS, logoPublicHref),
  'utf8'
);

const sheets = packStickersIntoA4Sheets(AURAGLOW_STICKERS);
console.log(`✓ Validated all ${AURAGLOW_STICKERS.length} Auraglow stickers + copied ${AURAGLOW_STICKERS.length} custom botanical artworks.`);
console.log(`✓ Generated /public/auraglow-stickers/index.html, _print-a4.html (${sheets.length} A4 sheets), _print-individual.html (${AURAGLOW_STICKERS.length} roll pages), and _print-catalog.html.`);
