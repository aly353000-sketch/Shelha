import { AuraglowProduct } from './catalogHelpers';

export type SocialCardFormat = 'portrait' | 'square';
export type SocialCardTheme = 'ivory' | 'emerald';

export interface SocialCardOptions {
  format: SocialCardFormat;
  theme: SocialCardTheme;
  priceEgp?: string;
  promoLine?: string;
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
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function renderSocialPostCardCanvas(
  canvas: HTMLCanvasElement,
  product: AuraglowProduct,
  options: SocialCardOptions
): Promise<void> {
  const width = 1080;
  const height = options.format === 'portrait' ? 1350 : 1080;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const isEmerald = options.theme === 'emerald';
  const bgColor = isEmerald ? '#1B251F' : '#F4EFE6';
  const cardBg = isEmerald ? '#222F27' : '#FFFFFF';
  const borderColor = isEmerald ? 'rgba(210, 183, 126, 0.35)' : '#E2DACB';
  const titleColor = isEmerald ? '#F7F4EC' : '#1B241E';
  const subtitleColor = isEmerald ? '#D2B77E' : '#7B6538';
  const bodyColor = isEmerald ? '#C8D0CA' : '#525E56';

  // Canvas background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Outer editorial frame
  const pad = 44;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, pad, pad, width - pad * 2, height - pad * 2, 24);
  ctx.stroke();

  // Load studio image & optional logo
  const [studioImg, logoImg] = await Promise.all([
    loadImage(product.studioImagePath),
    options.logoPath ? loadImage(options.logoPath).catch(() => null) : Promise.resolve(null),
  ]);

  // Top Header Strip (inside frame)
  const headerY = pad + 32;
  ctx.save();
  ctx.direction = 'rtl';

  if (logoImg) {
    const logoSize = 72;
    ctx.save();
    ctx.beginPath();
    ctx.arc(width - pad - 36 - logoSize / 2, headerY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, width - pad - 36 - logoSize, headerY, logoSize, logoSize);
    ctx.restore();
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = titleColor;
  ctx.font = '700 28px Alexandria, sans-serif';
  ctx.fillText('أوراجلو · Auraglow', width - pad - 124, headerY + 32);

  ctx.fillStyle = subtitleColor;
  ctx.font = '500 20px Alexandria, sans-serif';
  ctx.fillText(`${product.categoryArabic} · ${product.volumeArabic}`, width - pad - 124, headerY + 62);

  // Price display on top-left if provided
  const cleanPrice = options.priceEgp?.trim();
  if (cleanPrice) {
    const badgeW = 210;
    const badgeH = 64;
    const badgeX = pad + 34;
    const badgeY = headerY + 4;
    ctx.fillStyle = isEmerald ? '#D2B77E' : '#202823';
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 14);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = isEmerald ? '#1B241E' : '#F8F5EE';
    ctx.font = '700 26px Alexandria, sans-serif';
    ctx.fillText(`${cleanPrice} ج.م`, badgeX + badgeW / 2, badgeY + 42);
  }
  ctx.restore();

  // Studio Image Frame
  const imgX = pad + 36;
  const imgY = headerY + 96;
  const imgW = width - (pad + 36) * 2;
  const footerHeight = options.format === 'portrait' ? 275 : 230;
  const imgH = height - imgY - footerHeight - pad;

  ctx.save();
  drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 20);
  ctx.clip();

  // Fill frame with matching neutral studio edge tone, then contain-fit so caps & plinths never clip
  const frameGrad = ctx.createLinearGradient(imgX, imgY, imgX, imgY + imgH);
  frameGrad.addColorStop(0, '#E3E6EB');
  frameGrad.addColorStop(0.55, '#ECEEF2');
  frameGrad.addColorStop(1, '#D8DCE3');
  ctx.fillStyle = frameGrad;
  ctx.fillRect(imgX, imgY, imgW, imgH);

  const imgAspect = studioImg.naturalWidth / studioImg.naturalHeight;
  const boxAspect = imgW / imgH;
  let drawW = imgW;
  let drawH = imgH;
  let drawX = imgX;
  let drawY = imgY;

  if (imgAspect > boxAspect) {
    drawW = imgW;
    drawH = imgW / imgAspect;
    drawY = imgY + (imgH - drawH) / 2;
  } else {
    drawH = imgH;
    drawW = imgH * imgAspect;
    drawX = imgX + (imgW - drawW) / 2;
  }
  ctx.drawImage(studioImg, drawX, drawY, drawW, drawH);
  ctx.restore();

  // Subtle frame border on image
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 20);
  ctx.stroke();

  // Bottom Editorial Info Block
  const infoY = imgY + imgH + 28;
  const infoH = height - infoY - pad - 24;
  ctx.fillStyle = cardBg;
  drawRoundedRect(ctx, imgX, infoY, imgW, infoH, 18);
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.save();
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  const textRight = imgX + imgW - 34;

  const displayTitle = product.variantLabel
    ? `${product.nameArabic} (${product.variantLabel})`
    : product.nameArabic;

  ctx.fillStyle = titleColor;
  ctx.font = options.format === 'portrait' ? '700 38px Alexandria, sans-serif' : '700 34px Alexandria, sans-serif';
  ctx.fillText(displayTitle, textRight, infoY + 56);

  ctx.fillStyle = subtitleColor;
  ctx.font = '600 22px Alexandria, sans-serif';
  ctx.fillText(product.taglineArabic, textRight, infoY + 96);

  const ingredientsLine = product.keyIngredients.slice(0, 4).join(' · ');
  ctx.fillStyle = bodyColor;
  ctx.font = '500 20px Plus Jakarta Sans, sans-serif';
  ctx.fillText(ingredientsLine, textRight, infoY + 138);

  const promoText =
    options.promoLine?.trim() || 'منتج طبيعي أصلي من أوراجلو · للطلب ابعتيلنا رسالة دلوقتي';
  ctx.fillStyle = isEmerald ? '#D2B77E' : '#202823';
  ctx.font = '600 22px Alexandria, sans-serif';
  ctx.fillText(promoText, textRight, infoY + infoH - 28);
  ctx.restore();
}
