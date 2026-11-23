import { AURAGLOW_BRAND, type AuraglowSticker } from '../data/auraglowStickers';

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const SHEET_MARGIN_MM = 8;
export const STICKER_GAP_MM = 4;

export interface PlacedSticker {
  sticker: AuraglowSticker;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  rotated?: boolean;
}

export interface A4Sheet {
  pageNumber: number;
  titleAr: string;
  placements: PlacedSticker[];
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function validateAuraglowCatalog(stickers: AuraglowSticker[]): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  if (stickers.length !== 22) {
    errors.push(`Expected 22 Auraglow stickers (all variants excluding dandruff lotion), found ${stickers.length}.`);
  }

  for (const s of stickers) {
    if (seenIds.has(s.id)) {
      errors.push(`Duplicate sticker ID: ${s.id}`);
    }
    seenIds.add(s.id);

    if (s.nameAr.includes('لوشن') || s.id.includes('lotion')) {
      errors.push(`Dandruff lotion must be excluded per user request: ${s.id}`);
    }
    if (s.nameAr.includes('مغذي') && s.nameAr.includes('شامبو')) {
      errors.push(`Shampoo must be Anti-Hair Loss (شامبو تساقط), not nourishing (شامبو مغذي): ${s.id}`);
    }
    if (s.expiry !== '11/2030') {
      errors.push(`Invalid expiry on ${s.id}: expected 11/2030, got ${s.expiry}`);
    }
    if (s.widthMm <= 0 || s.heightMm <= 0) {
      errors.push(`Invalid dimensions on ${s.id}: ${s.widthMm}x${s.heightMm}mm`);
    }
    if (s.widthMm > A4_WIDTH_MM - 2 * SHEET_MARGIN_MM || s.heightMm > A4_HEIGHT_MM - 2 * SHEET_MARGIN_MM) {
      errors.push(`Sticker ${s.id} exceeds printable A4 area.`);
    }
    if (!s.nameAr.trim() || !s.nameEn.trim() || !s.sizeAr.trim() || !s.usageAr.trim() || !s.taglineAr.trim() || s.ingredients.length < 3) {
      errors.push(`Incomplete label copy on ${s.id}`);
    }
    if (!s.artworkSourcePath || !s.artworkSourcePath.trim()) {
      errors.push(`Missing bespoke product artwork path on ${s.id}`);
    }
    if (s.taglineAr.includes('جمالك يبدأ من أوراجلو') || s.taglineAr.includes('هالةُ نقاء')) {
      errors.push(`Deprecated tagline still present on ${s.id}`);
    }
  }

  return errors;
}

/**
 * Shelf-packs all stickers onto 210x297mm A4 print sheets at exact 1:1 mm scale
 * with 10mm outer page margins and 5mm cutting gap between stickers.
 */
export function packStickersIntoA4Sheets(stickers: AuraglowSticker[]): A4Sheet[] {
  const printableWidth = A4_WIDTH_MM - 2 * SHEET_MARGIN_MM;
  const headerReserveMm = 9; // clean top sheet title strip
  const printableTop = SHEET_MARGIN_MM + headerReserveMm;
  const printableBottom = A4_HEIGHT_MM - SHEET_MARGIN_MM;

  // Sort by height descending, then width descending for tight, tidy print rows
  const ordered = [...stickers].sort((a, b) => {
    if (b.heightMm !== a.heightMm) return b.heightMm - a.heightMm;
    return b.widthMm - a.widthMm;
  });

  const sheets: A4Sheet[] = [];
  let currentPlacements: PlacedSticker[] = [];
  let cursorX = SHEET_MARGIN_MM;
  let cursorY = printableTop;
  let rowHeight = 0;

  const pushSheet = () => {
    if (currentPlacements.length > 0) {
      sheets.push({
        pageNumber: sheets.length + 1,
        titleAr: `فرخ طباعة A4 رقم ${sheets.length + 1} · مقاس حقيقي 1:1 بالمللي`,
        placements: currentPlacements,
      });
    }
    currentPlacements = [];
    cursorX = SHEET_MARGIN_MM;
    cursorY = printableTop;
    rowHeight = 0;
  };

  for (const sticker of ordered) {
    const w = sticker.widthMm;
    const h = sticker.heightMm;

    if (cursorX + w > SHEET_MARGIN_MM + printableWidth + 0.01) {
      cursorX = SHEET_MARGIN_MM;
      cursorY += rowHeight + STICKER_GAP_MM;
      rowHeight = 0;
    }

    if (cursorY + h > printableBottom + 0.01) {
      pushSheet();
    }

    currentPlacements.push({
      sticker,
      xMm: Number(cursorX.toFixed(2)),
      yMm: Number(cursorY.toFixed(2)),
      widthMm: w,
      heightMm: h,
    });

    cursorX += w + STICKER_GAP_MM;
    if (h > rowHeight) rowHeight = h;
  }

  pushSheet();
  return sheets;
}

/**
 * Computes maximum copies of ONE sticker that fit cleanly on a single A4 sheet
 * with 10mm margins and 4mm cutting gaps.
 */
export function buildSingleProductA4Sheet(sticker: AuraglowSticker): {
  cols: number;
  rows: number;
  count: number;
  placements: PlacedSticker[];
} {
  const gap = 4;
  const headerReserveMm = 9;
  const usableW = A4_WIDTH_MM - 2 * SHEET_MARGIN_MM;
  const usableH = A4_HEIGHT_MM - 2 * SHEET_MARGIN_MM - headerReserveMm;

  const cols = Math.max(1, Math.floor((usableW + gap) / (sticker.widthMm + gap)));
  const rows = Math.max(1, Math.floor((usableH + gap) / (sticker.heightMm + gap)));

  const totalGridW = cols * sticker.widthMm + (cols - 1) * gap;
  const startX = (A4_WIDTH_MM - totalGridW) / 2;
  const startY = SHEET_MARGIN_MM + headerReserveMm;

  const placements: PlacedSticker[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      placements.push({
        sticker,
        xMm: Number((startX + c * (sticker.widthMm + gap)).toFixed(2)),
        yMm: Number((startY + r * (sticker.heightMm + gap)).toFixed(2)),
        widthMm: sticker.widthMm,
        heightMm: sticker.heightMm,
      });
    }
  }

  return { cols, rows, count: placements.length, placements };
}

export function getStickerArtworkPublicSrc(sticker: AuraglowSticker): string {
  return `./art/${sticker.id}.jpg`;
}

function formatMixedTitle(title: string): string {
  return escapeHtml(title).replace(
    /([A-Za-z][A-Za-z0-9\s/+.-]*[A-Za-z0-9+])/g,
    '<span class="ag-ltr-inline" dir="ltr">$1</span>'
  );
}

export function renderStickerMarkup(
  sticker: AuraglowSticker,
  logoSrc: string,
  artworkSrc: string = getStickerArtworkPublicSrc(sticker)
): string {
  const p = sticker.palette;
  const styleVars = [
    `width:${sticker.widthMm}mm`,
    `height:${sticker.heightMm}mm`,
    `--c-bg:${p.canvas}`,
    `--c-tint:${p.surfaceTint}`,
    `--c-accent:${p.accent}`,
    `--c-deep:${p.accentDeep}`,
    `--c-border:${p.border}`,
    `--c-text:${p.text}`,
    `--c-muted:${p.muted}`,
  ].join(';');

  const ingredientsInline = escapeHtml(sticker.ingredients.join(' · '));
  const brandLogo = `<img class="ag-logo" src="${logoSrc}" alt="${escapeHtml(AURAGLOW_BRAND.nameAr)}" />`;
  const blendClass = sticker.artworkBlendMode === 'screen' ? 'ag-art-screen' : 'ag-art-multiply';
  const productArtwork = `<img class="ag-artwork ${blendClass}" src="${escapeHtml(artworkSrc)}" alt="${escapeHtml(sticker.nameAr)}" />`;

  if (sticker.template === 'slim-band') {
    // 140mm x 20mm horizontal jar belly-band — precision 4-zone layout with bilingual decorative titles
    return `
      <div class="ag-sticker ag-tpl-slim-band" data-id="${escapeHtml(sticker.id)}" style="${styleVars}">
        <div class="ag-frame ag-slim-grid">
          <div class="ag-slim-brand">
            ${brandLogo}
          </div>
          <div class="ag-slim-center">
            <div class="ag-slim-title">${formatMixedTitle(sticker.nameAr)}</div>
            <div class="ag-slim-title-en" dir="ltr">${escapeHtml(sticker.nameEn)}</div>
            <div class="ag-slim-desc">${escapeHtml(sticker.descriptionAr)}</div>
            <div class="ag-slim-meta">
              <span>${escapeHtml(sticker.sizeAr)}</span>
              <span>·</span>
              <span dir="ltr">EXP: ${escapeHtml(sticker.expiry)}</span>
              <span>·</span>
              <span class="ag-slim-tag">${escapeHtml(sticker.taglineAr)}</span>
            </div>
          </div>
          <div class="ag-slim-art-cell">
            ${productArtwork}
          </div>
          <div class="ag-slim-details">
            <div class="ag-slim-ing"><strong class="ag-ar-lbl">المكونات:</strong> <span dir="ltr">${ingredientsInline}</span></div>
            <div class="ag-slim-usage"><strong class="ag-ar-lbl">الاستخدام:</strong> ${escapeHtml(sticker.usageAr)}</div>
          </div>
        </div>
      </div>`;
  }

  if (sticker.template === 'wide-jar') {
    // 100mm x 50mm wide jar label (ماسك ترميم الشعر 500 جم)
    return `
      <div class="ag-sticker ag-tpl-wide-jar" data-id="${escapeHtml(sticker.id)}" style="${styleVars}">
        <div class="ag-frame ag-wide-grid">
          <div class="ag-wide-hero">
            <div class="ag-wide-visuals">
              ${brandLogo}
              ${productArtwork}
            </div>
            <div class="ag-wide-title">${formatMixedTitle(sticker.nameAr)}</div>
            <div class="ag-wide-title-en" dir="ltr">${escapeHtml(sticker.nameEn)}</div>
            <div class="ag-wide-sub">${escapeHtml(sticker.subtitleAr)}</div>
            <div class="ag-wide-tagline">${escapeHtml(sticker.taglineAr)}</div>
            <div class="ag-wide-footer">
              <span>${escapeHtml(sticker.sizeAr)}</span>
              <span>·</span>
              <span dir="ltr">EXP: ${escapeHtml(sticker.expiry)}</span>
            </div>
          </div>
          <div class="ag-wide-info">
            <div class="ag-wide-desc">${escapeHtml(sticker.descriptionAr)}</div>
            <div class="ag-sec-head">المواد الفعالة الأساسية</div>
            <div class="ag-ing-text" dir="ltr">${ingredientsInline}</div>
            <div class="ag-sec-head">طريقة الاستخدام</div>
            <div class="ag-usage-text">${escapeHtml(sticker.usageAr)}</div>
          </div>
        </div>
      </div>`;
  }

  if (sticker.template === 'mini-landscape') {
    // 60mm x 40mm Obsidian & Gold luxury 30ml dropper bottle (سيروم تفتيح)
    return `
      <div class="ag-sticker ag-tpl-mini-landscape ${p.isDark ? 'ag-dark' : ''}" data-id="${escapeHtml(sticker.id)}" style="${styleVars}">
        <div class="ag-frame ag-minil-grid">
          <div class="ag-minil-hero">
            <div class="ag-minil-visuals">
              ${brandLogo}
              ${productArtwork}
            </div>
            <div class="ag-minil-title">${formatMixedTitle(sticker.nameAr)}</div>
            <div class="ag-minil-title-en" dir="ltr">${escapeHtml(sticker.nameEn)}</div>
            <div class="ag-minil-sub">${escapeHtml(sticker.subtitleAr)}</div>
            <div class="ag-minil-meta">
              <span>${escapeHtml(sticker.sizeAr)}</span> · <span dir="ltr">EXP ${escapeHtml(sticker.expiry)}</span>
            </div>
            <div class="ag-minil-tagline">${escapeHtml(sticker.taglineAr)}</div>
          </div>
          <div class="ag-minil-info">
            <div class="ag-minil-head">Active Ingredients</div>
            <div class="ag-minil-ing" dir="ltr">${ingredientsInline}</div>
            <div class="ag-minil-head-ar">طريقة الاستخدام</div>
            <div class="ag-minil-usage">${escapeHtml(sticker.usageAr)}</div>
          </div>
        </div>
      </div>`;
  }

  if (sticker.template === 'mini-square') {
    // 40mm x 40mm Lip Balm stick
    return `
      <div class="ag-sticker ag-tpl-mini-square" data-id="${escapeHtml(sticker.id)}" style="${styleVars}">
        <div class="ag-frame ag-minisq-body">
          <div class="ag-minisq-top">
            ${brandLogo}
            ${productArtwork}
          </div>
          <div class="ag-minisq-title">${formatMixedTitle(sticker.nameAr)}</div>
          <div class="ag-minisq-title-en" dir="ltr">${escapeHtml(sticker.nameEn)}</div>
          <div class="ag-minisq-desc">${escapeHtml(sticker.descriptionAr)}</div>
          <div class="ag-minisq-ing" dir="ltr">${ingredientsInline}</div>
          <div class="ag-minisq-foot">
            <span>${escapeHtml(sticker.sizeAr)}</span> · <span dir="ltr">EXP ${escapeHtml(sticker.expiry)}</span>
          </div>
          <div class="ag-minisq-tag">${escapeHtml(sticker.taglineAr)}</div>
        </div>
      </div>`;
  }

  if (sticker.template === 'square') {
    // 70mm x 70mm Sunscreen SPF 70+
    return `
      <div class="ag-sticker ag-tpl-square" data-id="${escapeHtml(sticker.id)}" style="${styleVars}">
        <div class="ag-frame ag-sq-body">
          <div class="ag-sq-header">
            <div class="ag-hero-lockup">
              ${brandLogo}
              <span class="ag-lockup-sep" aria-hidden="true"></span>
              ${productArtwork}
            </div>
            <div class="ag-sq-title">${formatMixedTitle(sticker.nameAr)}</div>
            <div class="ag-sq-title-en" dir="ltr">${escapeHtml(sticker.nameEn)}</div>
            <div class="ag-sq-sub">${escapeHtml(sticker.subtitleAr)}</div>
          </div>
          <div class="ag-divider"></div>
          <div class="ag-sq-desc">${escapeHtml(sticker.descriptionAr)}</div>
          <div class="ag-sec-head">التركيبة والحماية</div>
          <div class="ag-ing-text" dir="ltr">${ingredientsInline}</div>
          <div class="ag-sec-head">طريقة الاستخدام</div>
          <div class="ag-usage-text">${escapeHtml(sticker.usageAr)}</div>
          <div class="ag-foot-bar">
            <span class="ag-foot-tagline">${escapeHtml(sticker.taglineAr)}</span>
            <span class="ag-foot-meta">${escapeHtml(sticker.sizeAr)} · <span dir="ltr">EXP ${escapeHtml(sticker.expiry)}</span></span>
          </div>
        </div>
      </div>`;
  }

  if (sticker.template === 'tall-compact') {
    // 40mm x 60mm Hand Cream 60ml
    return `
      <div class="ag-sticker ag-tpl-tall-compact" data-id="${escapeHtml(sticker.id)}" style="${styleVars}">
        <div class="ag-frame ag-tc-body">
          <div class="ag-tc-visuals">
            ${brandLogo}
            ${productArtwork}
          </div>
          <div class="ag-tc-title">${formatMixedTitle(sticker.nameAr)}</div>
          <div class="ag-tc-title-en" dir="ltr">${escapeHtml(sticker.nameEn)}</div>
          <div class="ag-tc-sub">${escapeHtml(sticker.subtitleAr)}</div>
          <div class="ag-divider"></div>
          <div class="ag-tc-desc">${escapeHtml(sticker.descriptionAr)}</div>
          <div class="ag-tc-ing" dir="ltr">${ingredientsInline}</div>
          <div class="ag-tc-usage"><strong>الاستخدام:</strong> ${escapeHtml(sticker.usageAr)}</div>
          <div class="ag-tc-foot">
            <div>${escapeHtml(sticker.sizeAr)} · <span dir="ltr">EXP ${escapeHtml(sticker.expiry)}</span></div>
            <div class="ag-tc-tag">${escapeHtml(sticker.taglineAr)}</div>
          </div>
        </div>
      </div>`;
  }

  // Tall Large (80x110, 90x120, 100x110) & Tall Medium (60x90, 70x80, 70x90, 80x90)
  const isLarge = sticker.template === 'tall-large';
  const isNarrow = sticker.widthMm <= 65;
  const isShort = !isLarge && sticker.heightMm <= 82;
  const isWideTall = isLarge && sticker.widthMm >= 90;

  return `
    <div class="ag-sticker ${isLarge ? 'ag-tpl-tall-large' : 'ag-tpl-tall-medium'} ${isNarrow ? 'ag-narrow' : ''} ${isShort ? 'ag-short' : ''} ${isWideTall ? 'ag-wide-tall' : ''}" data-id="${escapeHtml(sticker.id)}" style="${styleVars}">
      <div class="ag-frame ag-tall-body">
        <div class="ag-top-strip"></div>
        <div class="ag-tall-header">
          <div class="ag-hero-lockup">
            ${brandLogo}
            <span class="ag-lockup-sep" aria-hidden="true"></span>
            ${productArtwork}
          </div>
          <div class="ag-brand-kicker">${escapeHtml(AURAGLOW_BRAND.nameEn)} · ${escapeHtml(AURAGLOW_BRAND.subtitleEn)}</div>
          <div class="ag-tall-title">${formatMixedTitle(sticker.nameAr)}</div>
          <div class="ag-tall-title-en" dir="ltr">${escapeHtml(sticker.nameEn)}</div>
          <div class="ag-tall-sub">${escapeHtml(sticker.subtitleAr)}</div>
        </div>
        <div class="ag-divider"></div>
        <div class="ag-tall-desc">${escapeHtml(sticker.descriptionAr)}</div>
        <div class="ag-tall-section">
          <div class="ag-sec-head">المواد الفعالة الأساسية</div>
          <div class="ag-ing-text" dir="ltr">${ingredientsInline}</div>
        </div>
        <div class="ag-tall-section">
          <div class="ag-sec-head">طريقة الاستخدام</div>
          <div class="ag-usage-text">${escapeHtml(sticker.usageAr)}</div>
        </div>
        <div class="ag-foot-bar">
          <span class="ag-foot-tagline">${escapeHtml(sticker.taglineAr)}</span>
          <span class="ag-foot-meta">${escapeHtml(sticker.sizeAr)} · <span dir="ltr">EXP: ${escapeHtml(sticker.expiry)}</span></span>
        </div>
      </div>
    </div>`;
}

export const SHARED_STICKER_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Cairo:wght@400;600;700;800&family=Dancing+Script:wght@600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,500&display=swap');

  .ag-sticker {
    position: relative;
    box-sizing: border-box;
    background: var(--c-bg);
    color: var(--c-text);
    font-family: 'Cairo', sans-serif;
    direction: rtl;
    overflow: hidden;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .ag-sticker *, .ag-sticker *::before, .ag-sticker *::after {
    box-sizing: border-box;
  }

  .ag-frame {
    position: relative;
    width: 100%;
    height: 100%;
    border: 0.45mm solid var(--c-border);
    background: linear-gradient(180deg, var(--c-tint) 0%, var(--c-bg) 38%, var(--c-bg) 100%);
  }

  .ag-frame::after {
    content: '';
    position: absolute;
    inset: 1.05mm;
    border: 0.22mm solid var(--c-border);
    opacity: 0.55;
    pointer-events: none;
  }

  .ag-logo {
    display: block;
    border-radius: 50%;
    object-fit: cover;
    border: 0.38mm solid var(--c-border);
    background: #95ab8c;
    flex-shrink: 0;
  }

  .ag-artwork {
    display: block;
    object-fit: contain;
    flex-shrink: 0;
    pointer-events: none;
  }
  .ag-art-multiply {
    mix-blend-mode: multiply;
  }
  .ag-art-screen {
    mix-blend-mode: screen;
  }

  .ag-ltr-inline {
    display: inline-block;
    direction: ltr;
    unicode-bidi: isolate;
    white-space: nowrap;
  }

  .ag-hero-lockup {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .ag-lockup-sep {
    width: 0.24mm;
    background: linear-gradient(180deg, transparent 0%, var(--c-border) 25%, var(--c-accent) 50%, var(--c-border) 75%, transparent 100%);
    opacity: 0.65;
    flex-shrink: 0;
  }

  .ag-divider {
    height: 0.25mm;
    width: 100%;
    background: linear-gradient(90deg, transparent 0%, var(--c-border) 20%, var(--c-accent) 50%, var(--c-border) 80%, transparent 100%);
    opacity: 0.7;
  }

  .ag-sec-head {
    font-weight: 800;
    color: var(--c-accent);
    line-height: 1.15;
  }

  .ag-ing-text {
    font-family: 'Cairo', sans-serif;
    color: var(--c-muted);
    line-height: 1.24;
    text-align: left;
  }

  .ag-usage-text {
    color: var(--c-text);
    line-height: 1.28;
  }

  .ag-foot-bar {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.2mm;
    border-top: 0.25mm solid var(--c-border);
    padding-top: 1.1mm;
  }

  .ag-foot-tagline {
    font-family: 'Aref Ruqaa', 'Cairo', serif;
    font-weight: 700;
    color: var(--c-accent);
    white-space: nowrap;
  }

  .ag-foot-meta {
    font-weight: 800;
    color: var(--c-deep);
    white-space: nowrap;
  }

  /* ---- TALL LARGE (80x110, 90x120, 100x110 mm) ---- */
  .ag-tpl-tall-large .ag-tall-body {
    display: flex;
    flex-direction: column;
    padding: 3.1mm 4.1mm 2.8mm;
    gap: 1.45mm;
  }
  .ag-tpl-tall-large .ag-top-strip {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1.9mm;
    background: var(--c-accent);
  }
  .ag-tpl-tall-large .ag-tall-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-top: 0.6mm;
  }
  .ag-tpl-tall-large .ag-hero-lockup {
    gap: 3mm;
    margin-bottom: 0.9mm;
  }
  .ag-tpl-tall-large .ag-lockup-sep {
    height: 21mm;
  }
  .ag-tpl-tall-large .ag-logo {
    width: 28.5mm;
    height: 28.5mm;
  }
  .ag-tpl-tall-large .ag-artwork {
    width: 29.5mm;
    height: 29.5mm;
  }
  .ag-tpl-tall-large.ag-wide-tall .ag-hero-lockup {
    gap: 4mm;
  }
  .ag-tpl-tall-large.ag-wide-tall .ag-logo {
    width: 31.5mm;
    height: 31.5mm;
  }
  .ag-tpl-tall-large.ag-wide-tall .ag-artwork {
    width: 33mm;
    height: 33mm;
  }
  .ag-tpl-tall-large .ag-brand-kicker {
    font-family: 'Playfair Display', serif;
    font-size: 5.5pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--c-muted);
    margin-bottom: 0.2mm;
  }
  .ag-tpl-tall-large .ag-tall-title {
    font-family: 'Aref Ruqaa', serif;
    font-size: 15.5pt;
    font-weight: 700;
    color: var(--c-deep);
    line-height: 1.22;
  }
  .ag-tpl-tall-large.ag-wide-tall .ag-tall-title {
    font-size: 17pt;
  }
  .ag-tpl-tall-large .ag-tall-title-en {
    font-family: 'Dancing Script', cursive;
    font-size: 10.6pt;
    font-weight: 700;
    color: var(--c-accent);
    line-height: 1.15;
    margin-top: 0.15mm;
  }
  .ag-tpl-tall-large.ag-wide-tall .ag-tall-title-en {
    font-size: 11.8pt;
  }
  .ag-tpl-tall-large .ag-tall-sub {
    font-size: 6.9pt;
    font-weight: 700;
    color: var(--c-muted);
    line-height: 1.2;
    margin-top: 0.35mm;
  }
  .ag-tpl-tall-large .ag-tall-desc {
    font-size: 6.8pt;
    line-height: 1.38;
    text-align: center;
    color: var(--c-text);
  }
  .ag-tpl-tall-large .ag-tall-section {
    background: rgba(255, 255, 255, 0.58);
    border: 0.22mm solid var(--c-border);
    padding: 1.65mm 2.3mm;
  }
  .ag-tpl-tall-large .ag-sec-head { font-size: 6.8pt; margin-bottom: 0.55mm; }
  .ag-tpl-tall-large .ag-ing-text { font-size: 6pt; line-height: 1.26; }
  .ag-tpl-tall-large .ag-usage-text { font-size: 6.7pt; line-height: 1.3; }
  .ag-tpl-tall-large .ag-foot-tagline { font-size: 8.2pt; }
  .ag-tpl-tall-large .ag-foot-meta { font-size: 6.7pt; }

  /* ---- TALL MEDIUM (60x90, 70x80, 70x90, 80x90 mm) ---- */
  .ag-tpl-tall-medium .ag-tall-body {
    display: flex;
    flex-direction: column;
    padding: 2mm 2.7mm 1.9mm;
    gap: 0.85mm;
  }
  .ag-tpl-tall-medium .ag-top-strip {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1.3mm;
    background: var(--c-accent);
  }
  .ag-tpl-tall-medium .ag-tall-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-top: 0.35mm;
  }
  .ag-tpl-tall-medium .ag-hero-lockup {
    gap: 2.1mm;
    margin-bottom: 0.5mm;
  }
  .ag-tpl-tall-medium .ag-lockup-sep {
    height: 15mm;
  }
  .ag-tpl-tall-medium .ag-logo {
    width: 19.5mm;
    height: 19.5mm;
  }
  .ag-tpl-tall-medium .ag-artwork {
    width: 20.5mm;
    height: 20.5mm;
  }
  .ag-tpl-tall-medium .ag-brand-kicker {
    font-family: 'Playfair Display', serif;
    font-size: 4.2pt;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--c-muted);
  }
  .ag-tpl-tall-medium .ag-tall-title {
    font-family: 'Aref Ruqaa', serif;
    font-size: 10.6pt;
    font-weight: 700;
    color: var(--c-deep);
    line-height: 1.2;
    margin-top: 0.1mm;
  }
  .ag-tpl-tall-medium .ag-tall-title-en {
    font-family: 'Dancing Script', cursive;
    font-size: 7.8pt;
    font-weight: 700;
    color: var(--c-accent);
    line-height: 1.12;
  }
  .ag-tpl-tall-medium .ag-tall-sub {
    font-size: 5.1pt;
    font-weight: 700;
    color: var(--c-muted);
    line-height: 1.15;
    margin-top: 0.15mm;
  }
  .ag-tpl-tall-medium .ag-tall-desc {
    font-size: 5.1pt;
    line-height: 1.25;
    text-align: center;
    color: var(--c-text);
  }
  .ag-tpl-tall-medium .ag-tall-section {
    background: rgba(255, 255, 255, 0.56);
    border: 0.18mm solid var(--c-border);
    padding: 0.85mm 1.45mm;
  }
  .ag-tpl-tall-medium .ag-sec-head { font-size: 5pt; margin-bottom: 0.3mm; }
  .ag-tpl-tall-medium .ag-ing-text { font-size: 4.65pt; line-height: 1.16; }
  .ag-tpl-tall-medium .ag-usage-text { font-size: 4.95pt; line-height: 1.2; }
  .ag-tpl-tall-medium .ag-foot-tagline { font-size: 6.2pt; }
  .ag-tpl-tall-medium .ag-foot-meta { font-size: 4.9pt; }

  .ag-tpl-tall-medium.ag-narrow .ag-hero-lockup { gap: 1.5mm; }
  .ag-tpl-tall-medium.ag-narrow .ag-logo { width: 18mm; height: 18mm; }
  .ag-tpl-tall-medium.ag-narrow .ag-artwork { width: 18.8mm; height: 18.8mm; }
  .ag-tpl-tall-medium.ag-narrow .ag-tall-title { font-size: 9.8pt; }
  .ag-tpl-tall-medium.ag-narrow .ag-tall-title-en { font-size: 7pt; }
  .ag-tpl-tall-medium.ag-narrow .ag-tall-sub { font-size: 4.75pt; }
  .ag-tpl-tall-medium.ag-narrow .ag-foot-tagline { font-size: 5.6pt; }
  .ag-tpl-tall-medium.ag-narrow .ag-foot-meta { font-size: 4.55pt; }

  .ag-tpl-tall-medium.ag-short .ag-tall-body { padding: 1.8mm 2.5mm 1.65mm; gap: 0.62mm; }
  .ag-tpl-tall-medium.ag-short .ag-logo { width: 18mm; height: 18mm; }
  .ag-tpl-tall-medium.ag-short .ag-artwork { width: 18.5mm; height: 18.5mm; }
  .ag-tpl-tall-medium.ag-short .ag-tall-title { font-size: 10pt; }
  .ag-tpl-tall-medium.ag-short .ag-tall-title-en { font-size: 7.2pt; }
  .ag-tpl-tall-medium.ag-short .ag-tall-desc { font-size: 4.85pt; line-height: 1.2; }
  .ag-tpl-tall-medium.ag-short .ag-ing-text { font-size: 4.5pt; line-height: 1.14; }
  .ag-tpl-tall-medium.ag-short .ag-usage-text { font-size: 4.75pt; line-height: 1.16; }

  /* ---- TALL COMPACT (40x60 mm — Hand Cream) ---- */
  .ag-tpl-tall-compact .ag-frame::after { inset: 0.75mm; }
  .ag-tpl-tall-compact .ag-tc-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1.5mm 1.8mm 1.4mm;
    gap: 0.5mm;
  }
  .ag-tpl-tall-compact .ag-tc-visuals {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.3mm;
  }
  .ag-tpl-tall-compact .ag-logo { width: 13.8mm; height: 13.8mm; }
  .ag-tpl-tall-compact .ag-artwork { width: 14.2mm; height: 14.2mm; }
  .ag-tpl-tall-compact .ag-tc-title {
    font-family: 'Aref Ruqaa', serif;
    font-size: 9pt;
    font-weight: 700;
    color: var(--c-deep);
    line-height: 1.15;
  }
  .ag-tpl-tall-compact .ag-tc-title-en {
    font-family: 'Dancing Script', cursive;
    font-size: 6.5pt;
    font-weight: 700;
    color: var(--c-accent);
    line-height: 1.08;
  }
  .ag-tpl-tall-compact .ag-tc-sub { font-size: 4.45pt; font-weight: 700; color: var(--c-muted); line-height: 1.12; }
  .ag-tpl-tall-compact .ag-tc-desc { font-size: 4.35pt; line-height: 1.2; color: var(--c-text); }
  .ag-tpl-tall-compact .ag-tc-ing { font-size: 3.95pt; line-height: 1.14; color: var(--c-muted); text-align: center; }
  .ag-tpl-tall-compact .ag-tc-usage { font-size: 4.25pt; line-height: 1.16; color: var(--c-text); }
  .ag-tpl-tall-compact .ag-tc-foot {
    margin-top: auto;
    width: 100%;
    border-top: 0.2mm solid var(--c-border);
    padding-top: 0.55mm;
    font-size: 4.4pt;
    font-weight: 800;
    color: var(--c-deep);
    line-height: 1.18;
  }
  .ag-tpl-tall-compact .ag-tc-tag {
    font-family: 'Aref Ruqaa', 'Cairo', serif;
    color: var(--c-accent);
    font-weight: 700;
    font-size: 5.2pt;
  }

  /* ---- SQUARE (70x70 mm — Sunscreen SPF 70+) ---- */
  .ag-tpl-square .ag-sq-body {
    display: flex;
    flex-direction: column;
    padding: 1.8mm 2.5mm 1.65mm;
    gap: 0.55mm;
  }
  .ag-tpl-square .ag-sq-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.15mm;
  }
  .ag-tpl-square .ag-hero-lockup {
    gap: 2.1mm;
    margin-bottom: 0.15mm;
  }
  .ag-tpl-square .ag-lockup-sep {
    height: 13mm;
  }
  .ag-tpl-square .ag-logo { width: 16.4mm; height: 16.4mm; }
  .ag-tpl-square .ag-artwork { width: 16.4mm; height: 16.4mm; }
  .ag-tpl-square .ag-sq-title {
    font-family: 'Aref Ruqaa', serif;
    font-size: 11pt;
    font-weight: 700;
    color: var(--c-deep);
    line-height: 1.15;
    white-space: nowrap;
  }
  .ag-tpl-square .ag-sq-title-en {
    font-family: 'Dancing Script', cursive;
    font-size: 7.5pt;
    font-weight: 700;
    color: var(--c-accent);
    line-height: 1.1;
    white-space: nowrap;
  }
  .ag-tpl-square .ag-sq-sub { font-size: 4.75pt; font-weight: 700; color: var(--c-muted); line-height: 1.12; white-space: nowrap; }
  .ag-tpl-square .ag-sq-desc { font-size: 4.8pt; line-height: 1.2; color: var(--c-text); text-align: center; }
  .ag-tpl-square .ag-sec-head { font-size: 4.85pt; }
  .ag-tpl-square .ag-ing-text { font-size: 4.5pt; line-height: 1.14; }
  .ag-tpl-square .ag-usage-text { font-size: 4.8pt; line-height: 1.16; }
  .ag-tpl-square .ag-foot-tagline { font-size: 5.9pt; }
  .ag-tpl-square .ag-foot-meta { font-size: 4.85pt; }

  /* ---- WIDE JAR (100x50 mm — Repair Hair Mask 500g) ---- */
  .ag-tpl-wide-jar .ag-wide-grid {
    display: grid;
    grid-template-columns: 44.5mm 1fr;
    align-items: stretch;
    padding: 1.85mm 2.3mm;
    gap: 2.1mm;
  }
  .ag-tpl-wide-jar .ag-wide-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-left: 0.25mm solid var(--c-border);
    padding-left: 1.9mm;
    gap: 0.3mm;
  }
  .ag-tpl-wide-jar .ag-wide-visuals {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.7mm;
  }
  .ag-tpl-wide-jar .ag-logo { width: 18mm; height: 18mm; }
  .ag-tpl-wide-jar .ag-artwork { width: 17.8mm; height: 17.8mm; }
  .ag-tpl-wide-jar .ag-wide-title {
    font-family: 'Aref Ruqaa', serif;
    font-size: 10.8pt;
    font-weight: 700;
    color: var(--c-deep);
    line-height: 1.18;
  }
  .ag-tpl-wide-jar .ag-wide-title-en {
    font-family: 'Dancing Script', cursive;
    font-size: 7.8pt;
    font-weight: 700;
    color: var(--c-accent);
    line-height: 1.1;
  }
  .ag-tpl-wide-jar .ag-wide-sub { font-size: 4.8pt; font-weight: 700; color: var(--c-muted); line-height: 1.14; }
  .ag-tpl-wide-jar .ag-wide-tagline {
    font-family: 'Aref Ruqaa', 'Cairo', serif;
    font-size: 6pt;
    font-weight: 700;
    color: var(--c-deep);
    margin-top: 0.15mm;
  }
  .ag-tpl-wide-jar .ag-wide-footer {
    display: flex;
    gap: 1.2mm;
    font-size: 5pt;
    font-weight: 800;
    color: var(--c-accent);
  }
  .ag-tpl-wide-jar .ag-wide-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.7mm;
  }
  .ag-tpl-wide-jar .ag-wide-desc { font-size: 5.2pt; line-height: 1.22; color: var(--c-text); }
  .ag-tpl-wide-jar .ag-sec-head { font-size: 5pt; }
  .ag-tpl-wide-jar .ag-ing-text { font-size: 4.7pt; line-height: 1.17; }
  .ag-tpl-wide-jar .ag-usage-text { font-size: 4.95pt; line-height: 1.2; }

  /* ---- ULTRA-SLIM JAR BAND (140x20 mm — 6 jar products) ---- */
  .ag-tpl-slim-band .ag-frame::after { inset: 0.65mm; }
  .ag-tpl-slim-band .ag-slim-grid {
    display: grid;
    grid-template-columns: 18.5mm 50mm 17.8mm 1fr;
    align-items: center;
    padding: 1.05mm 1.9mm;
    gap: 1.45mm;
  }
  .ag-tpl-slim-band .ag-slim-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 0.22mm solid var(--c-border);
    padding-left: 1.3mm;
    height: 100%;
  }
  .ag-tpl-slim-band .ag-logo { width: 15.8mm; height: 15.8mm; }
  .ag-tpl-slim-band .ag-slim-center {
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-left: 0.22mm solid var(--c-border);
    padding-left: 1.4mm;
    height: 100%;
    gap: 0.1mm;
    min-width: 0;
  }
  .ag-tpl-slim-band .ag-slim-title {
    font-family: 'Aref Ruqaa', serif;
    font-size: 8.1pt;
    font-weight: 700;
    color: var(--c-deep);
    line-height: 1.12;
    white-space: nowrap;
  }
  .ag-tpl-slim-band .ag-slim-title-en {
    font-family: 'Dancing Script', cursive;
    font-size: 6.2pt;
    font-weight: 700;
    color: var(--c-accent);
    line-height: 1.06;
    text-align: right;
    white-space: nowrap;
  }
  .ag-tpl-slim-band .ag-slim-desc {
    font-size: 4.1pt;
    line-height: 1.12;
    color: var(--c-text);
  }
  .ag-tpl-slim-band .ag-slim-meta {
    display: flex;
    align-items: center;
    gap: 0.8mm;
    font-size: 4.15pt;
    font-weight: 800;
    color: var(--c-accent);
    white-space: nowrap;
  }
  .ag-tpl-slim-band .ag-slim-tag {
    font-family: 'Aref Ruqaa', 'Cairo', serif;
    font-size: 4.85pt;
    font-weight: 700;
    color: var(--c-deep);
  }
  .ag-tpl-slim-band .ag-slim-art-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 0.22mm solid var(--c-border);
    padding-left: 1.15mm;
    height: 100%;
  }
  .ag-tpl-slim-band .ag-artwork {
    width: 15.6mm;
    height: 15.6mm;
  }
  .ag-tpl-slim-band .ag-slim-details {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.35mm;
    min-width: 0;
  }
  .ag-tpl-slim-band .ag-slim-ing {
    font-size: 4pt;
    line-height: 1.13;
    color: var(--c-muted);
  }
  .ag-tpl-slim-band .ag-slim-usage {
    font-size: 4.2pt;
    line-height: 1.15;
    color: var(--c-text);
  }
  .ag-tpl-slim-band .ag-ar-lbl {
    color: var(--c-accent);
    font-weight: 800;
  }

  /* ---- MINI LANDSCAPE (60x40 mm — Obsidian & Gold Serum) ---- */
  .ag-tpl-mini-landscape .ag-frame {
    background: linear-gradient(135deg, var(--c-tint) 0%, var(--c-bg) 100%);
  }
  .ag-tpl-mini-landscape .ag-frame::after { inset: 0.8mm; }
  .ag-tpl-mini-landscape .ag-minil-grid {
    display: grid;
    grid-template-columns: 28mm 1fr;
    align-items: stretch;
    padding: 1.55mm 1.85mm;
    gap: 1.45mm;
  }
  .ag-tpl-mini-landscape .ag-minil-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-left: 0.22mm solid var(--c-border);
    padding-left: 1.35mm;
    gap: 0.22mm;
  }
  .ag-tpl-mini-landscape .ag-minil-visuals {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5mm;
  }
  .ag-tpl-mini-landscape .ag-logo { width: 13.8mm; height: 13.8mm; border-color: var(--c-accent); }
  .ag-tpl-mini-landscape .ag-artwork { width: 11mm; height: 11mm; }
  .ag-tpl-mini-landscape .ag-minil-title {
    font-family: 'Aref Ruqaa', serif;
    font-size: 8.3pt;
    font-weight: 700;
    color: var(--c-deep);
    line-height: 1.15;
  }
  .ag-tpl-mini-landscape .ag-minil-title-en {
    font-family: 'Dancing Script', cursive;
    font-size: 6pt;
    font-weight: 700;
    color: var(--c-accent);
    line-height: 1.08;
    white-space: nowrap;
  }
  .ag-tpl-mini-landscape .ag-minil-sub { font-size: 4pt; color: var(--c-muted); line-height: 1.12; }
  .ag-tpl-mini-landscape .ag-minil-meta { font-size: 4.3pt; font-weight: 800; color: var(--c-accent); margin-top: 0.15mm; }
  .ag-tpl-mini-landscape .ag-minil-tagline {
    font-family: 'Aref Ruqaa', 'Cairo', serif;
    font-size: 4.9pt;
    font-weight: 700;
    color: var(--c-text);
  }
  .ag-tpl-mini-landscape .ag-minil-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5mm;
  }
  .ag-tpl-mini-landscape .ag-minil-head {
    font-family: 'Playfair Display', serif;
    font-size: 4.45pt;
    font-weight: 700;
    color: var(--c-accent);
    text-align: left;
  }
  .ag-tpl-mini-landscape .ag-minil-ing {
    font-size: 4pt;
    line-height: 1.15;
    color: var(--c-muted);
    text-align: left;
  }
  .ag-tpl-mini-landscape .ag-minil-head-ar {
    font-size: 4.4pt;
    font-weight: 800;
    color: var(--c-accent);
    margin-top: 0.2mm;
  }
  .ag-tpl-mini-landscape .ag-minil-usage {
    font-size: 4.2pt;
    line-height: 1.18;
    color: var(--c-text);
  }

  /* ---- MINI SQUARE (40x40 mm — Lip Balm Stick) ---- */
  .ag-tpl-mini-square .ag-frame::after { inset: 0.7mm; }
  .ag-tpl-mini-square .ag-minisq-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1.25mm 1.5mm;
    gap: 0.24mm;
  }
  .ag-tpl-mini-square .ag-minisq-top {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.1mm;
  }
  .ag-tpl-mini-square .ag-logo { width: 12.6mm; height: 12.6mm; }
  .ag-tpl-mini-square .ag-artwork { width: 12.6mm; height: 12.6mm; }
  .ag-tpl-mini-square .ag-minisq-title {
    font-family: 'Aref Ruqaa', serif;
    font-size: 8.2pt;
    font-weight: 700;
    color: var(--c-deep);
    line-height: 1.12;
  }
  .ag-tpl-mini-square .ag-minisq-title-en {
    font-family: 'Dancing Script', cursive;
    font-size: 5.8pt;
    font-weight: 700;
    color: var(--c-accent);
    line-height: 1.06;
    white-space: nowrap;
  }
  .ag-tpl-mini-square .ag-minisq-desc { font-size: 4.05pt; line-height: 1.12; color: var(--c-text); }
  .ag-tpl-mini-square .ag-minisq-ing { font-size: 3.75pt; line-height: 1.1; color: var(--c-muted); }
  .ag-tpl-mini-square .ag-minisq-foot { font-size: 4.15pt; font-weight: 800; color: var(--c-deep); margin-top: 0.12mm; }
  .ag-tpl-mini-square .ag-minisq-tag {
    font-family: 'Aref Ruqaa', 'Cairo', serif;
    font-size: 4.9pt;
    font-weight: 700;
    color: var(--c-accent);
  }
`;

function renderCropMarksHtml(): string {
  return `
    <span class="crop tl-h"></span><span class="crop tl-v"></span>
    <span class="crop tr-h"></span><span class="crop tr-v"></span>
    <span class="crop bl-h"></span><span class="crop bl-v"></span>
    <span class="crop br-h"></span><span class="crop br-v"></span>
  `;
}

/**
 * Generates the exact 1:1 millimeter A4 Print Sheets HTML (for Playwright PDF export).
 */
export function buildA4PrintPdfHtml(stickers: AuraglowSticker[], logoSrc: string): string {
  const sheets = packStickersIntoA4Sheets(stickers);

  const pagesHtml = sheets
    .map(
      (sheet) => `
      <section class="a4-sheet">
        <div class="sheet-bar">
          <span><strong>أوراجلو Auraglow</strong> — ملف طباعة استيكرات المنتجات (مقاس حقيقي 1:1)</span>
          <span>صفحة ${sheet.pageNumber} من ${sheets.length} · EXP 11/2030</span>
        </div>
        ${sheet.placements
          .map(
            (pl) => `
          <div class="placed-wrap" style="left:${pl.xMm}mm;top:${pl.yMm}mm;width:${pl.widthMm}mm;height:${pl.heightMm}mm;">
            ${renderCropMarksHtml()}
            ${renderStickerMarkup(pl.sticker, logoSrc)}
          </div>`
          )
          .join('')}
      </section>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>Auraglow Stickers — A4 Print Sheets (1:1 mm)</title>
  <style>
    ${SHARED_STICKER_CSS}
    @page { size: A4 portrait; margin: 0; }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Cairo', sans-serif;
    }
    .a4-sheet {
      position: relative;
      width: ${A4_WIDTH_MM}mm;
      height: ${A4_HEIGHT_MM}mm;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      background: #ffffff;
    }
    .a4-sheet:last-child { page-break-after: auto; break-after: auto; }
    .sheet-bar {
      position: absolute;
      top: 5mm;
      left: ${SHEET_MARGIN_MM}mm;
      right: ${SHEET_MARGIN_MM}mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7pt;
      color: #5d6e58;
      border-bottom: 0.2mm solid #d8e0d5;
      padding-bottom: 1.2mm;
    }
    .placed-wrap {
      position: absolute;
    }
    .crop {
      position: absolute;
      background: #6f7c6b;
      pointer-events: none;
    }
    .crop.tl-h { top: 0; left: -2.4mm; width: 1.8mm; height: 0.18mm; }
    .crop.tl-v { top: -2.4mm; left: 0; width: 0.18mm; height: 1.8mm; }
    .crop.tr-h { top: 0; right: -2.4mm; width: 1.8mm; height: 0.18mm; }
    .crop.tr-v { top: -2.4mm; right: 0; width: 0.18mm; height: 1.8mm; }
    .crop.bl-h { bottom: 0; left: -2.4mm; width: 1.8mm; height: 0.18mm; }
    .crop.bl-v { bottom: -2.4mm; left: 0; width: 0.18mm; height: 1.8mm; }
    .crop.br-h { bottom: 0; right: -2.4mm; width: 1.8mm; height: 0.18mm; }
    .crop.br-v { bottom: -2.4mm; right: 0; width: 0.18mm; height: 1.8mm; }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}

/**
 * Generates a 22-page 1:1 millimeter Roll-Print PDF HTML where each sticker sits on its
 * own exact-dimension page (named @page size = widthMm × heightMm, 0mm margin) with no
 * headers, footers, or A4 sheet borders — ideal for roll vinyl printers & plotter RIPs.
 */
export function buildIndividualRollPdfHtml(stickers: AuraglowSticker[], logoSrc: string): string {
  const namedPageRules = stickers
    .map(
      (s, i) =>
        `@page ag_roll_${i} { size: ${s.widthMm}mm ${s.heightMm}mm; margin: 0; }`
    )
    .join('\n    ');

  const pagesHtml = stickers
    .map(
      (s, i) => `
      <section class="roll-page" data-sticker-id="${s.id}" style="page: ag_roll_${i}; width:${s.widthMm}mm; height:${s.heightMm}mm;">
        ${renderStickerMarkup(s, logoSrc)}
      </section>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>Auraglow Stickers — Individual Roll Print PDF (22 Pages, 1:1 mm)</title>
  <style>
    ${SHARED_STICKER_CSS}
    ${namedPageRules}
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Cairo', sans-serif;
    }
    .roll-page {
      position: relative;
      margin: 0;
      padding: 0;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
      background: #ffffff;
    }
    .roll-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .roll-page .ag-sticker {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}

/**
 * Generates an executive 2-per-page Review & Individual Print Catalog PDF HTML
 * showing each sticker at exact 1:1 scale with its print specs & product sheet.
 */
export function buildCatalogPdfHtml(stickers: AuraglowSticker[], logoSrc: string): string {
  const pairs: AuraglowSticker[][] = [];
  for (let i = 0; i < stickers.length; i += 2) {
    pairs.push(stickers.slice(i, i + 2));
  }

  const pagesHtml = pairs
    .map(
      (pair, idx) => `
      <section class="cat-page">
        <header class="cat-header">
          <div>
            <strong>كتالوج استيكرات أوراجلو Auraglow — معاينة ومراجعة الطباعة</strong>
            <div class="cat-sub">مقاس حقيقي 1:1 · وجه واحد · صلاحية موحدة EXP: 11/2030</div>
          </div>
          <div class="cat-pg">صفحة ${idx + 1} من ${pairs.length}</div>
        </header>
        <div class="cat-list">
          ${pair
            .map((s) => {
              const repeat = buildSingleProductA4Sheet(s);
              return `
            <article class="cat-item">
              <div class="cat-meta">
                <div class="cat-name">${escapeHtml(s.nameAr)}</div>
                <div class="cat-specs">
                  <span>${escapeHtml(s.categoryAr)}</span> ·
                  <span>الحجم: ${escapeHtml(s.sizeAr)}</span> ·
                  <span dir="ltr">${s.widthMm / 10} × ${s.heightMm / 10} cm</span> ·
                  <span>يسع ${repeat.count} نسخة / فرخ A4</span>
                </div>
              </div>
              <div class="cat-stage">
                <div class="cat-crop-box" style="width:${s.widthMm}mm;height:${s.heightMm}mm;">
                  ${renderCropMarksHtml()}
                  ${renderStickerMarkup(s, logoSrc)}
                </div>
              </div>
            </article>`;
            })
            .join('')}
        </div>
      </section>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>Auraglow Stickers — Detailed Review Catalog</title>
  <style>
    ${SHARED_STICKER_CSS}
    @page { size: A4 portrait; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; font-family: 'Cairo', sans-serif; }
    .cat-page {
      width: ${A4_WIDTH_MM}mm;
      height: ${A4_HEIGHT_MM}mm;
      padding: 10mm 12mm;
      box-sizing: border-box;
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
      gap: 5mm;
    }
    .cat-page:last-child { page-break-after: auto; break-after: auto; }
    .cat-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 0.35mm solid #8fa885;
      padding-bottom: 2.5mm;
      color: #263922;
      font-size: 9pt;
    }
    .cat-sub { font-size: 7pt; color: #5b6e56; margin-top: 0.5mm; }
    .cat-pg { font-size: 7.5pt; font-weight: 700; color: #5b6e56; }
    .cat-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 5mm;
    }
    .cat-item {
      flex: 1;
      border: 0.25mm solid #dbe3d8;
      background: #fbfcf9;
      padding: 4mm 5mm;
      display: flex;
      flex-direction: column;
      gap: 3mm;
    }
    .cat-meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 0.2mm solid #e5ece2;
      padding-bottom: 2mm;
    }
    .cat-name { font-size: 10pt; font-weight: 800; color: #1f331c; }
    .cat-specs { font-size: 7.2pt; color: #53664f; font-weight: 600; }
    .cat-stage {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cat-crop-box { position: relative; }
    .crop { position: absolute; background: #748470; }
    .crop.tl-h { top: 0; left: -2.4mm; width: 1.8mm; height: 0.18mm; }
    .crop.tl-v { top: -2.4mm; left: 0; width: 0.18mm; height: 1.8mm; }
    .crop.tr-h { top: 0; right: -2.4mm; width: 1.8mm; height: 0.18mm; }
    .crop.tr-v { top: -2.4mm; right: 0; width: 0.18mm; height: 1.8mm; }
    .crop.bl-h { bottom: 0; left: -2.4mm; width: 1.8mm; height: 0.18mm; }
    .crop.bl-v { bottom: -2.4mm; left: 0; width: 0.18mm; height: 1.8mm; }
    .crop.br-h { bottom: 0; right: -2.4mm; width: 1.8mm; height: 0.18mm; }
    .crop.br-v { bottom: -2.4mm; right: 0; width: 0.18mm; height: 1.8mm; }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}

/**
 * Generates the interactive standalone Auraglow Print Studio HTML page
 * with direct PDF downloads, live previews, category filters, and 1-click
 * single-product repeated A4 print sheets.
 */
export function buildAuraglowStudioHtml(stickers: AuraglowSticker[], logoSrc: string): string {
  const sheets = packStickersIntoA4Sheets(stickers);
  const hairCount = stickers.filter((s) => s.category === 'hair').length;
  const skinCount = stickers.filter((s) => s.category === 'skin').length;
  const bodyCount = stickers.filter((s) => s.category === 'body').length;

  const cardsHtml = stickers
    .map((s) => {
      const singleSheet = buildSingleProductA4Sheet(s);
      // Calculate responsive preview scale so tall/wide stickers display crisply in gallery
      return `
        <article class="studio-card" data-category="${s.category}" data-id="${escapeHtml(s.id)}">
          <div class="card-head">
            <div>
              <div class="card-meta">${escapeHtml(s.categoryAr)} · ${escapeHtml(s.sizeAr)} · <span dir="ltr">${s.widthMm / 10} × ${s.heightMm / 10} cm</span></div>
              <h2 class="card-title">${escapeHtml(s.nameAr)}</h2>
            </div>
            <div class="card-actions">
              <a class="btn-download-one" href="./individual/${escapeHtml(s.id)}.pdf" download="Auraglow-${escapeHtml(s.id)}.pdf">
                تحميل PDF
              </a>
              <button type="button" class="btn-print-one" data-print-id="${escapeHtml(s.id)}" title="طباعة فرخ A4 مكرر لهذا المنتج فقط">
                فرخ A4 (${singleSheet.count} نسخة)
              </button>
            </div>
          </div>
          <div class="card-stage">
            <div class="stage-inner" style="--w-mm:${s.widthMm};--h-mm:${s.heightMm};">
              ${renderStickerMarkup(s, logoSrc)}
            </div>
          </div>
          <div class="card-foot">
            <span>وجه واحد · EXP 11/2030</span>
            <span>${escapeHtml(s.taglineAr)}</span>
          </div>
        </article>`;
    })
    .join('');

  // Precompute single-product repeated sheet HTML templates in JSON for instant print-on-demand
  const singleSheetPayloads = stickers.reduce<Record<string, { nameAr: string; count: number; html: string }>>(
    (acc, s) => {
      const sheet = buildSingleProductA4Sheet(s);
      const html = `
        <section class="a4-print-single">
          <div class="sheet-bar">
            <span><strong>أوراجلو Auraglow</strong> — ${escapeHtml(s.nameAr)} (${escapeHtml(s.sizeAr)} · ${s.widthMm / 10}×${s.heightMm / 10} سم)</span>
            <span>${sheet.count} نسخة على فرخ A4 · مقاس 1:1 · EXP 11/2030</span>
          </div>
          ${sheet.placements
            .map(
              (pl) => `
            <div class="placed-wrap" style="left:${pl.xMm}mm;top:${pl.yMm}mm;width:${pl.widthMm}mm;height:${pl.heightMm}mm;">
              ${renderCropMarksHtml()}
              ${renderStickerMarkup(pl.sticker, logoSrc)}
            </div>`
            )
            .join('')}
        </section>`;
      acc[s.id] = { nameAr: s.nameAr, count: sheet.count, html };
      return acc;
    },
    {}
  );

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>أوراجلو Auraglow — استوديو طباعة الاستيكرات (PDF جاهز للمطبعة)</title>
  <meta name="robots" content="noindex, nofollow" />
  <style>
    ${SHARED_STICKER_CSS}
    :root {
      --bg: #f6f7f3;
      --surface: #ffffff;
      --sage: #5c7a56;
      --sage-deep: #2a3f26;
      --sage-soft: #eaf0e7;
      --border: #dce3d8;
      --text: #1c271a;
      --muted: #566653;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: 'Cairo', sans-serif;
      line-height: 1.6;
      overflow-x: hidden;
      width: 100%;
    }

    /* Top Bar — Clean 3-Zone Contract */
    .topbar {
      position: sticky;
      top: 0;
      z-index: 30;
      background: rgba(255, 255, 255, 0.96);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(8px);
    }
    .topbar-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 14px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }
    .brand-mark {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--sage-deep);
      text-decoration: none;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .top-nav {
      display: flex;
      align-items: center;
      gap: 22px;
    }
    .top-nav a {
      color: var(--muted);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .top-nav a:hover { color: var(--sage-deep); text-decoration: underline; }
    .top-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 9px 18px;
      background: var(--sage-deep);
      color: #fff;
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 700;
      border-radius: 8px;
      white-space: nowrap;
      flex-shrink: 0;
      transition: opacity 0.15s ease;
    }
    .top-cta:hover { opacity: 0.9; }

    /* Hero */
    .wrap {
      max-width: 1280px;
      margin: 0 auto;
      padding: 36px 24px 72px;
    }
    .hero {
      display: grid;
      grid-template-columns: 1.25fr 0.75fr;
      gap: 32px;
      align-items: center;
      padding-bottom: 32px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 32px;
    }
    .hero > * { min-width: 0; }
    .hero-kicker {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--sage);
      margin-bottom: 8px;
    }
    .hero h1 {
      margin: 0 0 12px;
      font-size: clamp(1.75rem, 3vw, 2.5rem);
      line-height: 1.25;
      color: var(--sage-deep);
      text-wrap: balance;
    }
    .hero p {
      margin: 0 0 22px;
      color: var(--muted);
      font-size: 0.98rem;
      max-width: 60ch;
    }
    .download-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .btn-primary, .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 22px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.94rem;
      text-decoration: none;
      cursor: pointer;
      border: 1px solid transparent;
      font-family: inherit;
      white-space: nowrap;
      min-height: 44px;
    }
    .btn-primary {
      background: var(--sage-deep);
      color: #fff;
    }
    .btn-primary:hover { background: #1e311b; }
    .btn-secondary {
      background: var(--surface);
      color: var(--sage-deep);
      border-color: var(--border);
    }
    .btn-secondary:hover { background: var(--sage-soft); }

    .hero-brand-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .hero-brand-card img {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      border: 2px solid var(--border);
      flex-shrink: 0;
    }
    .hero-stats {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 18px;
      font-size: 0.86rem;
      color: var(--muted);
    }
    .hero-stats strong {
      display: block;
      font-size: 1.05rem;
      color: var(--sage-deep);
      font-variant-numeric: tabular-nums;
    }

    /* Filter Toolbar */
    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 24px;
    }
    .seg {
      display: inline-flex;
      background: #e9efe6;
      padding: 4px;
      border-radius: 10px;
      gap: 4px;
      flex-wrap: wrap;
    }
    .seg button {
      border: 0;
      background: transparent;
      color: var(--muted);
      font-family: inherit;
      font-weight: 700;
      font-size: 0.88rem;
      padding: 8px 16px;
      border-radius: 7px;
      cursor: pointer;
      white-space: nowrap;
      min-height: 40px;
    }
    .seg button.active {
      background: #fff;
      color: var(--sage-deep);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .toolbar-note {
      font-size: 0.86rem;
      color: var(--muted);
    }

    /* Sticker Gallery Grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
    }
    .studio-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
      max-width: 100%;
    }
    .studio-card.hidden { display: none; }
    .card-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .card-head > div { min-width: 0; }
    .card-meta {
      font-size: 0.8rem;
      color: var(--muted);
      font-weight: 600;
    }
    .card-title {
      margin: 2px 0 0;
      font-size: 1.08rem;
      font-weight: 800;
      color: var(--sage-deep);
    }
    .card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      flex-shrink: 0;
    }
    .btn-download-one {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--sage-deep);
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 7px 14px;
      border-radius: 8px;
      white-space: nowrap;
      min-height: 40px;
      border: 1px solid var(--sage-deep);
    }
    .btn-download-one:hover {
      background: #1c281c;
    }
    .btn-print-one {
      border: 1px solid var(--border);
      background: var(--sage-soft);
      color: var(--sage-deep);
      font-family: inherit;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 7px 12px;
      border-radius: 8px;
      cursor: pointer;
      white-space: nowrap;
      min-height: 40px;
      flex-shrink: 0;
    }
    .btn-print-one:hover {
      background: var(--sage-deep);
      color: #fff;
      border-color: var(--sage-deep);
    }
    .card-stage {
      background: #f0f3ee;
      border-radius: 10px;
      padding: 18px 12px;
      min-height: 180px;
      width: 100%;
      max-width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .stage-inner {
      display: inline-flex;
      box-shadow: 0 8px 24px rgba(24, 38, 22, 0.12);
      flex-shrink: 0;
    }
    @media (max-width: 640px) {
      .card-stage { justify-content: flex-start; padding: 14px 10px; }
      .download-row { flex-direction: column; }
      .btn-primary, .btn-secondary { width: 100%; white-space: normal; text-align: center; }
      .studio-card { padding: 14px; }
    }
    .card-foot {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 0.8rem;
      color: var(--muted);
      border-top: 1px solid #eef2ec;
      padding-top: 10px;
    }

    /* Specs Table */
    .specs-sec {
      margin-top: 48px;
      padding-top: 32px;
      border-top: 1px solid var(--border);
    }
    .specs-sec h2 {
      margin: 0 0 14px;
      font-size: 1.3rem;
      color: var(--sage-deep);
    }
    .table-wrap {
      overflow-x: auto;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    th, td {
      padding: 11px 14px;
      text-align: right;
      border-bottom: 1px solid #edf1eb;
      font-variant-numeric: tabular-nums;
    }
    th {
      background: #f3f6f1;
      color: var(--sage-deep);
      font-weight: 800;
    }

    /* Dedicated Hidden Print Stage for Single-Product A4 Sheet */
    #print-mount { display: none; }

    @media print {
      @page { size: A4 portrait; margin: 0; }
      body > *:not(#print-mount) { display: none !important; }
      #print-mount { display: block !important; }
      .a4-print-single {
        position: relative;
        width: ${A4_WIDTH_MM}mm;
        height: ${A4_HEIGHT_MM}mm;
        background: #ffffff;
        overflow: hidden;
      }
      .sheet-bar {
        position: absolute;
        top: 5mm;
        left: ${SHEET_MARGIN_MM}mm;
        right: ${SHEET_MARGIN_MM}mm;
        display: flex;
        justify-content: space-between;
        font-size: 7pt;
        color: #5d6e58;
        border-bottom: 0.2mm solid #d8e0d5;
        padding-bottom: 1.2mm;
      }
      .placed-wrap { position: absolute; }
      .crop { position: absolute; background: #6f7c6b; }
      .crop.tl-h { top: 0; left: -2.4mm; width: 1.8mm; height: 0.18mm; }
      .crop.tl-v { top: -2.4mm; left: 0; width: 0.18mm; height: 1.8mm; }
      .crop.tr-h { top: 0; right: -2.4mm; width: 1.8mm; height: 0.18mm; }
      .crop.tr-v { top: -2.4mm; right: 0; width: 0.18mm; height: 1.8mm; }
      .crop.bl-h { bottom: 0; left: -2.4mm; width: 1.8mm; height: 0.18mm; }
      .crop.bl-v { bottom: -2.4mm; left: 0; width: 0.18mm; height: 1.8mm; }
      .crop.br-h { bottom: 0; right: -2.4mm; width: 1.8mm; height: 0.18mm; }
      .crop.br-v { bottom: -2.4mm; right: 0; width: 0.18mm; height: 1.8mm; }
    }

    @media (max-width: 900px) {
      .hero { grid-template-columns: 1fr; }
      .grid { grid-template-columns: 1fr; }
      .top-nav { display: none; }
      .topbar-inner { padding: 10px 16px; }
      .wrap { padding: 24px 16px 56px; }
      .hero-brand-card { flex-direction: column; text-align: center; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand-mark" href="#top">أوراجلو Auraglow</a>
      <nav class="top-nav" aria-label="التنقل">
        <a href="#downloads">تحميل PDF</a>
        <a href="#stickers">الاستيكرات (22)</a>
        <a href="#specs">جدول المقاسات</a>
        <a href="./auraglow-stickers-catalog.pdf" target="_blank" rel="noopener">كتالوج المراجعة</a>
      </nav>
      <a class="top-cta" href="./auraglow-a4-print-sheets.pdf" download="Auraglow-Stickers-A4-Print-Sheets.pdf">تحميل PDF للطباعة</a>
    </div>
  </header>

  <main id="top" class="wrap">
    <section id="downloads" class="hero">
      <div>
        <div class="hero-kicker">أوراجلو للعناية بالبشرة والشعر · جاهز للمطبعة بدقة 1:1 بالمللي</div>
        <h1>استيكرات منتجات أوراجلو الجاهزة للطباعة والقص</h1>
        <p>
          كل الـ 22 استيكر (شاملة روائح الشاور جل والبادي باتر، وباستبعاد لوشن القشرة، مع شامبو التساقط والترميم)
          مصممة بوجه واحد متناسق مع هوية أوراجلو ولون كل عبوة، وصلاحية موحدة <strong>11/2030</strong>، وعلامات قص جاهزة للمطبعة.
        </p>
        <div class="download-row">
          <a class="btn-primary" href="./auraglow-all-22-stickers-individual.zip" download="Auraglow-22-Individual-Stickers-PDF.zip">
            تحميل الـ 22 استيكر كملفات منفصلة (ZIP)
          </a>
          <a class="btn-secondary" href="./auraglow-stickers-individual-roll.pdf" download="Auraglow-Stickers-Roll-22-Pages.pdf">
            ملف مطبعة الرول (22 صفحة)
          </a>
          <a class="btn-secondary" href="./auraglow-a4-print-sheets.pdf" download="Auraglow-Stickers-A4-Print-Sheets.pdf">
            ملف أفرخ A4 (${sheets.length} صفحات)
          </a>
          <a class="btn-secondary" href="./auraglow-stickers-catalog.pdf" download="Auraglow-Stickers-Catalog-Proof.pdf">
            كتالوج المراجعة (PDF)
          </a>
        </div>
      </div>
      <div class="hero-brand-card">
        <img src="${logoSrc}" alt="لوجو أوراجلو" />
        <div class="hero-stats">
          <div><strong>${stickers.length}</strong> استيكر جاهز للطباعة</div>
          <div><strong>${sheets.length} أفرخ</strong> مقاس A4 (1:1)</div>
          <div><strong>11/2030</strong> تاريخ الصلاحية الموحد</div>
          <div><strong>وجه واحد</strong> بعلامات قص دقيقة</div>
        </div>
      </div>
    </section>

    <section id="stickers">
      <div class="toolbar">
        <div class="seg" role="tablist" aria-label="تصفية الأقسام">
          <button type="button" class="active" data-filter="all">الكل (${stickers.length})</button>
          <button type="button" data-filter="hair">العناية بالشعر (${hairCount})</button>
          <button type="button" data-filter="skin">العناية بالبشرة (${skinCount})</button>
          <button type="button" data-filter="body">الجسم واليدين (${bodyCount})</button>
        </div>
        <div class="toolbar-note">اضغط «فرخ A4» على أي منتج لطباعة فرخ كامل مكرر من هذا المنتج فقط</div>
      </div>

      <div class="grid">
        ${cardsHtml}
      </div>
    </section>

    <section id="specs" class="specs-sec">
      <h2>جدول المقاسات والأحجام المعتمدة للطباعة</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>المنتج</th>
              <th>القسم</th>
              <th>الحجم</th>
              <th>المقاس (عرض × ارتفاع)</th>
              <th>نسخ / فرخ A4</th>
              <th>الصلاحية</th>
            </tr>
          </thead>
          <tbody>
            ${stickers
              .map((s, i) => {
                const rep = buildSingleProductA4Sheet(s);
                return `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${escapeHtml(s.nameAr)}</strong></td>
                <td>${escapeHtml(s.categoryAr)}</td>
                <td>${escapeHtml(s.sizeAr)}</td>
                <td dir="ltr">${s.widthMm / 10} × ${s.heightMm / 10} cm</td>
                <td>${rep.count} نسخة</td>
                <td dir="ltr">${escapeHtml(s.expiry)}</td>
              </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    </section>
  </main>

  <div id="print-mount" aria-hidden="true"></div>

  <script>
    const SINGLE_SHEETS = ${JSON.stringify(singleSheetPayloads)};
    const filterButtons = document.querySelectorAll('[data-filter]');
    const cards = document.querySelectorAll('.studio-card');
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-filter');
        filterButtons.forEach((b) => b.classList.toggle('active', b === btn));
        cards.forEach((card) => {
          const match = cat === 'all' || card.getAttribute('data-category') === cat;
          card.classList.toggle('hidden', !match);
        });
      });
    });

    const printMount = document.getElementById('print-mount');
    document.querySelectorAll('[data-print-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-print-id');
        const payload = SINGLE_SHEETS[id];
        if (!payload || !printMount) return;
        printMount.innerHTML = payload.html;
        window.print();
      });
    });
  </script>
</body>
</html>`;
}
