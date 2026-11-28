import {
  DEFAULT_DISCOUNT_PERCENT,
  OPENING_OFFER_HIGHLIGHTS,
  PriceListSection,
  calculateDiscountedPrice,
  formatEgpAmount,
} from '../data/auraglowPriceList';

export interface PriceListRenderOptions {
  priceOverrides: Record<string, number>;
  discountPercent?: number;
  logoPath?: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawContainImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  radius: number
) {
  ctx.save();
  drawRoundedRect(ctx, boxX, boxY, boxW, boxH, radius);
  ctx.clip();

  const grad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
  grad.addColorStop(0, '#E3E6EB');
  grad.addColorStop(0.55, '#ECEEF2');
  grad.addColorStop(1, '#D8DCE3');
  ctx.fillStyle = grad;
  ctx.fillRect(boxX, boxY, boxW, boxH);

  const imgAspect = img.naturalWidth / Math.max(img.naturalHeight, 1);
  const boxAspect = boxW / Math.max(boxH, 1);
  let drawW = boxW;
  let drawH = boxH;
  let drawX = boxX;
  let drawY = boxY;

  if (imgAspect > boxAspect) {
    drawW = boxW;
    drawH = boxW / imgAspect;
    drawY = boxY + (boxH - drawH) / 2;
  } else {
    drawH = boxH;
    drawW = boxH * imgAspect;
    drawX = boxX + (boxW - drawW) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();

  ctx.strokeStyle = '#DFD8C8';
  ctx.lineWidth = 1.25;
  drawRoundedRect(ctx, boxX, boxY, boxW, boxH, radius);
  ctx.stroke();
}

export async function renderPriceListPageCanvas(
  canvas: HTMLCanvasElement,
  section: PriceListSection,
  options: PriceListRenderOptions
): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const discountPercent = options.discountPercent ?? DEFAULT_DISCOUNT_PERCENT;
  const isMultiVariantSection = section.id === 'body';

  const width = 1240;
  const outerPad = 42;
  const headerH = 190;
  const sectionBarH = 74;
  const tableHeaderH = 62;
  const rowH = isMultiVariantSection ? 228 : 154;
  const footerH = 128;
  const tableGapTop = 22;
  const footerGapTop = 26;

  const height =
    outerPad * 2 +
    headerH +
    tableGapTop +
    sectionBarH +
    tableHeaderH +
    section.items.length * rowH +
    footerGapTop +
    footerH;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Preload logo + all product images
  const uniquePaths = Array.from(
    new Set(section.items.flatMap((item) => item.imagePaths))
  );
  const [logoImg, loadedImages] = await Promise.all([
    options.logoPath ? loadImage(options.logoPath).catch(() => null) : Promise.resolve(null),
    Promise.all(
      uniquePaths.map(async (src) => {
        try {
          const img = await loadImage(src);
          return [src, img] as const;
        } catch {
          return [src, null] as const;
        }
      })
    ),
  ]);

  const imageMap = new Map<string, HTMLImageElement | null>(loadedImages);

  // Page background (warm alabaster)
  ctx.fillStyle = '#F7F5F0';
  ctx.fillRect(0, 0, width, height);

  // Outer editorial frame border
  ctx.strokeStyle = '#D8CEB8';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 18, 18, width - 36, height - 36, 26);
  ctx.stroke();

  const contentX = outerPad;
  const contentW = width - outerPad * 2;
  let cursorY = outerPad;

  // 1. Brand Header Card (deep forest emerald)
  ctx.fillStyle = '#202823';
  drawRoundedRect(ctx, contentX, cursorY, contentW, headerH, 22);
  ctx.fill();

  ctx.strokeStyle = 'rgba(210, 183, 126, 0.42)';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, contentX + 10, cursorY + 10, contentW - 20, headerH - 20, 16);
  ctx.stroke();

  // Logo on RTL start (right side)
  const logoSize = 112;
  const logoX = contentX + contentW - 36 - logoSize;
  const logoY = cursorY + (headerH - logoSize) / 2;
  if (logoImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.clip();
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    ctx.restore();

    ctx.strokeStyle = '#D2B77E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Brand title & subtitle
  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  const headerTextRight = logoX - 28;

  ctx.fillStyle = '#D2B77E';
  ctx.font = '600 20px Alexandria, sans-serif';
  ctx.fillText('أوراجلو للعناية الطبيعية · AURAGLOW', headerTextRight, cursorY + 62);

  ctx.fillStyle = '#F8F5EE';
  ctx.font = '700 40px Alexandria, sans-serif';
  ctx.fillText('قائمة الأسعار الرسمية', headerTextRight, cursorY + 112);

  ctx.fillStyle = '#C9D2CC';
  ctx.font = '500 20px Alexandria, sans-serif';
  ctx.fillText(
    'أسعار محدثة بالصور الرسمية — شاملة خصم الافتتاح',
    headerTextRight,
    cursorY + 150
  );
  ctx.restore();

  // Discount badge on RTL end (left side)
  const badgeW = 248;
  const badgeH = 110;
  const badgeX = contentX + 34;
  const badgeY = cursorY + (headerH - badgeH) / 2;
  ctx.fillStyle = '#D2B77E';
  drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 18);
  ctx.fill();

  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1B241E';
  ctx.font = '700 20px Alexandria, sans-serif';
  ctx.fillText('عرض الافتتاح', badgeX + badgeW / 2, badgeY + 40);

  ctx.font = '800 36px Alexandria, sans-serif';
  ctx.fillText(`خصم ${formatEgpAmount(discountPercent)}%`, badgeX + badgeW / 2, badgeY + 86);
  ctx.restore();

  cursorY += headerH + tableGapTop;

  // 2. Table Container
  const tableTotalH = sectionBarH + tableHeaderH + section.items.length * rowH;
  ctx.fillStyle = '#FFFFFF';
  drawRoundedRect(ctx, contentX, cursorY, contentW, tableTotalH, 20);
  ctx.fill();

  ctx.strokeStyle = '#E0D7C5';
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, contentX, cursorY, contentW, tableTotalH, 20);
  ctx.stroke();

  // Clip inside table container for clean top header corners
  ctx.save();
  drawRoundedRect(ctx, contentX, cursorY, contentW, tableTotalH, 20);
  ctx.clip();

  // Section Banner Bar
  ctx.fillStyle = '#EFE9DC';
  ctx.fillRect(contentX, cursorY, contentW, sectionBarH);

  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#1B241E';
  ctx.font = '700 30px Alexandria, sans-serif';
  ctx.fillText(section.titleArabic, contentX + contentW - 30, cursorY + 47);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#7B6538';
  ctx.font = '600 20px Alexandria, sans-serif';
  ctx.fillText(
    `صفحة ${section.pageNumber} من ${section.totalPages} · ${section.subtitleEnglish}`,
    contentX + 30,
    cursorY + 46
  );
  ctx.restore();

  cursorY += sectionBarH;

  // Column x-ranges (left to right in canvas pixels, reading RTL right-to-left)
  // Total contentW = 1156
  // [After 20%: 190] [Before: 165] [Volume: 155] [Name: 330/270] [Photo: 316/376]
  const colAfterW = 198;
  const colBeforeW = 164;
  const colVolumeW = 152;
  const colPhotoW = isMultiVariantSection ? 386 : 196;
  const colNameW = contentW - colAfterW - colBeforeW - colVolumeW - colPhotoW;

  const colAfterX = contentX;
  const colBeforeX = colAfterX + colAfterW;
  const colVolumeX = colBeforeX + colBeforeW;
  const colNameX = colVolumeX + colVolumeW;
  const colPhotoX = colNameX + colNameW;

  // Table Header Row
  ctx.fillStyle = '#2B3630';
  ctx.fillRect(contentX, cursorY, contentW, tableHeaderH);

  ctx.save();
  ctx.direction = 'rtl';
  ctx.fillStyle = '#F8F5EE';
  ctx.font = '700 21px Alexandria, sans-serif';
  ctx.textAlign = 'center';

  const thTextY = cursorY + 39;
  ctx.fillText('المنتج', colPhotoX + colPhotoW / 2, thTextY);
  ctx.textAlign = 'right';
  ctx.fillText('الصنف', colNameX + colNameW - 22, thTextY);
  ctx.textAlign = 'center';
  ctx.fillText('الحجم', colVolumeX + colVolumeW / 2, thTextY);
  ctx.fillText('قبل الخصم', colBeforeX + colBeforeW / 2, thTextY);

  ctx.fillStyle = '#E8CE96';
  ctx.fillText(
    `بعد خصم ${formatEgpAmount(discountPercent)}%`,
    colAfterX + colAfterW / 2,
    thTextY
  );
  ctx.restore();

  cursorY += tableHeaderH;

  // Table Data Rows
  section.items.forEach((item, index) => {
    const rowY = cursorY + index * rowH;

    // Alternating subtle row tint
    ctx.fillStyle = index % 2 === 0 ? '#FFFFFF' : '#FAF8F3';
    ctx.fillRect(contentX, rowY, contentW, rowH);

    // Bottom hairline divider
    if (index < section.items.length - 1) {
      ctx.strokeStyle = '#EAE3D5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(contentX + 18, rowY + rowH);
      ctx.lineTo(contentX + contentW - 18, rowY + rowH);
      ctx.stroke();
    }

    // Product Image(s)
    const imgCount = item.imagePaths.length;
    if (imgCount === 1) {
      const boxW = 118;
      const boxH = rowH - 20;
      const boxX = colPhotoX + (colPhotoW - boxW) / 2;
      const boxY = rowY + 10;
      const img = imageMap.get(item.imagePaths[0]);
      if (img) {
        drawContainImage(ctx, img, boxX, boxY, boxW, boxH, 12);
      }
    } else {
      const gap = 10;
      const sidePad = 18;
      const availW = colPhotoW - sidePad * 2 - gap * (imgCount - 1);
      const boxW = Math.floor(availW / imgCount);
      const boxH = rowH - 36;
      const boxY = rowY + 18;
      item.imagePaths.forEach((src, imgIdx) => {
        const img = imageMap.get(src);
        const boxX = colPhotoX + sidePad + imgIdx * (boxW + gap);
        if (img) {
          drawContainImage(ctx, img, boxX, boxY, boxW, boxH, 12);
        }
      });
    }

    // Product Name (+ Variants subtitle if present)
    ctx.save();
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    const nameRightX = colNameX + colNameW - 22;
    const centerY = rowY + rowH / 2;

    ctx.fillStyle = '#1B241E';
    if (item.variantsSubtitle) {
      ctx.font = '700 28px Alexandria, sans-serif';
      ctx.fillText(item.nameArabic, nameRightX, centerY - 8);

      ctx.fillStyle = '#6E7A72';
      ctx.font = '500 21px Alexandria, sans-serif';
      ctx.fillText(item.variantsSubtitle, nameRightX, centerY + 30);
    } else {
      ctx.font = '700 25px Alexandria, sans-serif';
      ctx.fillText(item.nameArabic, nameRightX, centerY + 9);
    }

    // Volume
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4B5750';
    ctx.font = '600 22px Alexandria, sans-serif';
    ctx.fillText(item.volumeArabic, colVolumeX + colVolumeW / 2, centerY + 8);

    // Before Discount Price (with crisp diagonal/horizontal strikethrough)
    const basePrice = options.priceOverrides[item.id] ?? item.originalPrice;
    const afterPrice = calculateDiscountedPrice(basePrice, discountPercent);
    const beforeLabel = `${formatEgpAmount(basePrice)} ج.م`;
    const beforeCenterX = colBeforeX + colBeforeW / 2;

    ctx.fillStyle = '#8A8378';
    ctx.font = '600 24px Alexandria, sans-serif';
    ctx.fillText(beforeLabel, beforeCenterX, centerY + 8);

    const textWidth = Math.max(ctx.measureText(beforeLabel).width, 74);
    ctx.strokeStyle = '#B85A4A';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(beforeCenterX - textWidth / 2 - 6, centerY + 2);
    ctx.lineTo(beforeCenterX + textWidth / 2 + 6, centerY - 4);
    ctx.stroke();

    // After Discount Price Pill Block (high-contrast emerald + ivory/gold)
    const pillW = 152;
    const pillH = 62;
    const pillX = colAfterX + (colAfterW - pillW) / 2;
    const pillY = centerY - pillH / 2;
    ctx.fillStyle = '#1F3A2D';
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 14);
    ctx.fill();

    ctx.strokeStyle = 'rgba(210, 183, 126, 0.55)';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 14);
    ctx.stroke();

    ctx.fillStyle = '#F8F4EA';
    ctx.font = '800 27px Alexandria, sans-serif';
    ctx.fillText(`${formatEgpAmount(afterPrice)} ج.م`, colAfterX + colAfterW / 2, centerY + 10);

    ctx.restore();
  });

  ctx.restore(); // end table container clip

  // 3. Bottom Opening Offer Footer Strip
  const footerY = cursorY + section.items.length * rowH + footerGapTop;
  ctx.fillStyle = '#202823';
  drawRoundedRect(ctx, contentX, footerY, contentW, footerH, 20);
  ctx.fill();

  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';

  ctx.fillStyle = '#E8CE96';
  ctx.font = '700 26px Alexandria, sans-serif';
  ctx.fillText(
    `${OPENING_OFFER_HIGHLIGHTS.deliveryArabic}  ·  ${OPENING_OFFER_HIGHLIGHTS.freeShippingArabic}`,
    width / 2,
    footerY + 54
  );

  ctx.fillStyle = '#D4DCD6';
  ctx.font = '500 20px Alexandria, sans-serif';
  ctx.fillText(
    `عرض الافتتاح ساري بخصم ${formatEgpAmount(discountPercent)}% على جميع المنتجات · للطلب ابعتيلنا رسالة دلوقتي`,
    width / 2,
    footerY + 96
  );
  ctx.restore();
}

export async function renderPriceListPageBlob(
  section: PriceListSection,
  options: PriceListRenderOptions
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  await renderPriceListPageCanvas(canvas, section, options);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('تعذر تجهيز صورة قائمة الأسعار'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.95
    );
  });
}
