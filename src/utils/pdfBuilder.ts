import {
  A4_HEIGHT_MM,
  A4_HEIGHT_PT,
  A4_WIDTH_MM,
  A4_WIDTH_PT,
  GridPreset,
  StickerData,
  StickerTheme,
  computeA4Imposition,
  mmToPxAtDpi,
} from './stickerLayout';

/**
 * Wraps a JPEG byte buffer into a standards-compliant single-page A4 PDF (210mm x 297mm).
 * Pure TypeScript with zero external dependencies, deterministic byte offsets.
 */
export function buildSinglePageA4Pdf(
  jpegBytes: Uint8Array,
  imageWidthPx: number,
  imageHeightPx: number
): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0]; // object 0 is always free
  let currentLength = 0;

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    currentLength += bytes.length;
  };

  const pushText = (text: string) => {
    pushBytes(encoder.encode(text));
  };

  // PDF 1.4 Header + binary comment
  pushText('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Object 1: Catalog
  offsets.push(currentLength);
  pushText('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  offsets.push(currentLength);
  pushText('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 3: A4 Page (595.28 x 841.89 pt = 210mm x 297mm exact)
  offsets.push(currentLength);
  pushText(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH_PT} ${A4_HEIGHT_PT}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // Object 4: High-DPI JPEG Image XObject
  offsets.push(currentLength);
  pushText(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidthPx} /Height ${imageHeightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushText('\nendstream\nendobj\n');

  // Object 5: Page Content Stream scaling the full-bleed A4 raster to exact A4 points
  const contentStream = `q\n${A4_WIDTH_PT} 0 0 ${A4_HEIGHT_PT} 0 0 cm\n/Im0 Do\nQ\n`;
  const contentBytes = encoder.encode(contentStream);
  offsets.push(currentLength);
  pushText(
    `5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contentStream}endstream\nendobj\n`
  );

  // XRef table
  const xrefStart = currentLength;
  pushText(`xref\n0 ${offsets.length}\n`);
  pushText('0000000000 65535 f \n');
  for (let i = 1; i < offsets.length; i++) {
    pushText(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }

  // Trailer
  pushText(
    `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
  );

  const output = new Uint8Array(new ArrayBuffer(currentLength));
  let cursor = 0;
  for (const chunk of chunks) {
    output.set(chunk, cursor);
    cursor += chunk.length;
  }
  return output;
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawSingleStickerOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  data: StickerData,
  theme: StickerTheme,
  logoImage: HTMLImageElement | null,
  dpi: number
) {
  const mm = (val: number) => mmToPxAtDpi(val, dpi);
  const pt = (val: number) => (val / 72) * dpi;

  const palette =
    theme === 'emerald'
      ? {
          bg: '#202823',
          bgAccent: '#19201B',
          gold: '#D2B77E',
          goldMuted: '#9F8859',
          title: '#F7F4EC',
          body: '#EAE5D9',
          subtle: '#C9C2B3',
        }
      : {
          bg: '#FAF7F0',
          bgAccent: '#F3EDE0',
          gold: '#AD8D4C',
          goldMuted: '#C7AE78',
          title: '#1E2922',
          body: '#333F37',
          subtle: '#58645C',
        };

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // Solid base background + subtle vertical luxury sheen
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, palette.bg);
  grad.addColorStop(1, palette.bgAccent);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Double hairline gold frame
  ctx.strokeStyle = palette.gold;
  ctx.lineWidth = mm(0.32);
  ctx.strokeRect(x + mm(1.4), y + mm(1.4), w - mm(2.8), h - mm(2.8));

  ctx.strokeStyle = palette.goldMuted;
  ctx.lineWidth = mm(0.14);
  ctx.strokeRect(x + mm(2.15), y + mm(2.15), w - mm(4.3), h - mm(4.3));

  const cx = x + w / 2;
  const innerWidth = w - mm(6.2);

  // 1. Authentic Auraglow Circular Logo Badge
  const logoSize = mm(11.6);
  const logoY = y + mm(3.3);
  if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
    ctx.drawImage(logoImage, cx - logoSize / 2, logoY, logoSize, logoSize);
  }

  // 2. Arabic Calligraphic Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.direction = 'rtl';
  ctx.fillStyle = palette.title;
  ctx.font = `700 ${pt(10.2)}px "Aref Ruqaa", "Alexandria", serif`;
  ctx.fillText(data.titleArabic, cx, y + mm(15.6));

  // 3. English Luxury Subtitle
  ctx.direction = 'ltr';
  ctx.fillStyle = palette.gold;
  ctx.font = `italic 600 ${pt(5.5)}px "Cormorant Garamond", Georgia, serif`;
  ctx.fillText(data.subtitleEnglish, cx, y + mm(20.6));

  // 4. Arabic Description
  ctx.direction = 'rtl';
  ctx.fillStyle = palette.body;
  ctx.font = `400 ${pt(4.35)}px "Alexandria", sans-serif`;
  const descLines = wrapTextLines(ctx, data.descriptionArabic, innerWidth).slice(0, 3);
  let cursorY = y + mm(23.5);
  for (const line of descLines) {
    ctx.fillText(line, cx, cursorY);
    cursorY += mm(2.35);
  }

  // Gold divider 1
  const div1Y = y + mm(31.2);
  ctx.strokeStyle = palette.goldMuted;
  ctx.lineWidth = mm(0.16);
  ctx.beginPath();
  ctx.moveTo(x + mm(5.5), div1Y);
  ctx.lineTo(x + w - mm(5.5), div1Y);
  ctx.stroke();

  // 5. Active Ingredients
  ctx.direction = 'ltr';
  ctx.fillStyle = palette.gold;
  ctx.font = `700 ${pt(5.1)}px "Cormorant Garamond", Georgia, serif`;
  ctx.fillText(data.ingredientsTitle, cx, div1Y + mm(1.1));

  ctx.fillStyle = palette.body;
  ctx.font = `400 ${pt(4.05)}px "Plus Jakarta Sans", sans-serif`;
  const ingLines = wrapTextLines(ctx, data.ingredientsList, innerWidth).slice(0, 5);
  let ingY = div1Y + mm(3.6);
  for (const line of ingLines) {
    ctx.fillText(line, cx, ingY);
    ingY += mm(2.15);
  }

  // Gold divider 2
  const div2Y = y + mm(46.2);
  ctx.strokeStyle = palette.goldMuted;
  ctx.lineWidth = mm(0.16);
  ctx.beginPath();
  ctx.moveTo(x + mm(5.5), div2Y);
  ctx.lineTo(x + w - mm(5.5), div2Y);
  ctx.stroke();

  // 6. Usage Instructions
  ctx.direction = 'rtl';
  ctx.fillStyle = palette.gold;
  ctx.font = `700 ${pt(4.7)}px "Alexandria", sans-serif`;
  ctx.fillText(data.usageTitle, cx, div2Y + mm(0.9));

  ctx.fillStyle = palette.body;
  ctx.font = `400 ${pt(4.25)}px "Alexandria", sans-serif`;
  const usageLines = wrapTextLines(ctx, data.usageText, innerWidth).slice(0, 2);
  let usageY = div2Y + mm(3.3);
  for (const line of usageLines) {
    ctx.fillText(line, cx, usageY);
    usageY += mm(2.2);
  }

  // 7. Volume, Expiry & Brand Slogan Footer
  ctx.direction = 'ltr';
  ctx.fillStyle = palette.gold;
  ctx.font = `700 ${pt(4.5)}px "Alexandria", sans-serif`;
  ctx.fillText(`${data.volumeText}  ·  ${data.expiryText}`, cx, y + mm(53.4));

  ctx.direction = 'rtl';
  ctx.fillStyle = palette.title;
  ctx.font = `700 ${pt(5.4)}px "Aref Ruqaa", serif`;
  ctx.fillText(data.sloganArabic, cx, y + mm(55.6));

  ctx.restore();
}

function drawCropMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  dpi: number
) {
  const mm = (val: number) => mmToPxAtDpi(val, dpi);
  const offset = mm(0.8);
  const len = mm(2.2);

  ctx.save();
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = mm(0.15);
  ctx.beginPath();

  // Top-left
  ctx.moveTo(x - offset - len, y);
  ctx.lineTo(x - offset, y);
  ctx.moveTo(x, y - offset - len);
  ctx.lineTo(x, y - offset);

  // Top-right
  ctx.moveTo(x + w + offset, y);
  ctx.lineTo(x + w + offset + len, y);
  ctx.moveTo(x + w, y - offset - len);
  ctx.lineTo(x + w, y - offset);

  // Bottom-left
  ctx.moveTo(x - offset - len, y + h);
  ctx.lineTo(x - offset, y + h);
  ctx.moveTo(x, y + h + offset);
  ctx.lineTo(x, y + h + offset + len);

  // Bottom-right
  ctx.moveTo(x + w + offset, y + h);
  ctx.lineTo(x + w + offset + len, y + h);
  ctx.moveTo(x + w, y + h + offset);
  ctx.lineTo(x + w, y + h + offset + len);

  ctx.stroke();
  ctx.restore();
}

/**
 * Renders a 300-DPI exact-millimeter A4 print sheet (210x297mm) with 40x60mm stickers
 * and returns a downloadable PDF Blob.
 */
export async function generateCustomA4PdfBlob(
  data: StickerData,
  theme: StickerTheme,
  gridPreset: GridPreset,
  showCropMarks: boolean,
  logoSrc: string
): Promise<Blob> {
  const dpi = 300;
  const pageW = Math.round(mmToPxAtDpi(A4_WIDTH_MM, dpi)); // 2480
  const pageH = Math.round(mmToPxAtDpi(A4_HEIGHT_MM, dpi)); // 3508

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const logoImage = await new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = logoSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pageW;
  canvas.height = pageH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not initialize 2D canvas context for PDF export.');
  }

  // Crisp pure white A4 paper background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, pageW, pageH);

  const layout = computeA4Imposition(gridPreset);
  const mm = (val: number) => mmToPxAtDpi(val, dpi);

  // Subtle top print-shop specification header inside top margin
  ctx.save();
  ctx.fillStyle = '#64748B';
  ctx.font = `500 ${(6.5 / 72) * dpi}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `Auraglow Hand Cream · Print-Ready A4 (210 × 297 mm) · Sticker Trim Size: 40 × 60 mm (4 × 6 cm) · ${layout.totalStickers} Labels · Print at 100% Actual Size`,
    pageW / 2,
    mm(8.5)
  );
  ctx.restore();

  for (const cell of layout.cells) {
    const x = mm(cell.xMm);
    const y = mm(cell.yMm);
    const w = mm(cell.widthMm);
    const h = mm(cell.heightMm);
    drawSingleStickerOnCanvas(ctx, x, y, w, h, data, theme, logoImage, dpi);
    if (showCropMarks) {
      drawCropMarks(ctx, x, y, w, h, dpi);
    }
  }

  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to encode A4 canvas.'))),
      'image/jpeg',
      0.96
    );
  });
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  const pdfBytes = buildSinglePageA4Pdf(jpegBytes, pageW, pageH);
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
