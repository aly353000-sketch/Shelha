import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, Image as ImageIcon, MessageCircle, X } from 'lucide-react';
import { AuraglowProduct, buildWhatsAppCaption } from '../utils/catalogHelpers';
import {
  renderSocialPostCardCanvas,
  SocialCardFormat,
  SocialCardTheme,
} from '../utils/socialCardRenderer';
import { AURAGLOW_LOGO_PATH } from '../data/auraglowAssets';

interface SocialPostBuilderModalProps {
  product: AuraglowProduct | null;
  onClose: () => void;
}

export const SocialPostBuilderModal: React.FC<SocialPostBuilderModalProps> = ({
  product,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<'clean' | 'card'>('clean');
  const [format, setFormat] = useState<SocialCardFormat>('portrait');
  const [theme, setTheme] = useState<SocialCardTheme>('ivory');
  const [priceEgp, setPriceEgp] = useState<string>('');
  const [promoLine, setPromoLine] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const captionText = useMemo(() => {
    if (!product) return '';
    return buildWhatsAppCaption(product, {
      priceEgp,
      whatsappNote: promoLine,
    });
  }, [product, priceEgp, promoLine]);

  useEffect(() => {
    if (!product || mode !== 'card' || !canvasRef.current) return;
    let cancelled = false;
    setIsRendering(true);

    const draw = async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
      if (cancelled || !canvasRef.current) return;
      await renderSocialPostCardCanvas(canvasRef.current, product, {
        format,
        theme,
        priceEgp,
        promoLine,
        logoPath: AURAGLOW_LOGO_PATH,
      });
      if (!cancelled) setIsRendering(false);
    };

    draw().catch(() => {
      if (!cancelled) setIsRendering(false);
    });

    return () => {
      cancelled = true;
    };
  }, [product, mode, format, theme, priceEgp, promoLine]);

  useEffect(() => {
    if (!product) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [product, onClose]);

  if (!product) return null;

  const displayTitle = product.variantLabel
    ? `${product.nameArabic} (${product.variantLabel})`
    : product.nameArabic;

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(captionText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = captionText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadCard = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/jpeg', 0.94);
    const link = document.createElement('a');
    link.href = url;
    link.download = `post-${format}-${product.downloadFilename}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`تجهيز ونشر ${displayTitle}`}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 md:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF8F4] border border-[#DFD7C8] rounded-xl max-w-5xl w-full overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-[#EAE3D5]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-[#7B6538] mb-0.5">
              <span>{product.categoryArabic}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{product.volumeArabic}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">مقاس الاستيكر {product.stickerSizeCm}</span>
            </div>
            <h3 className="text-lg font-bold text-[#1B241E] truncate">{displayTitle}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة التجهيز"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#1B241E] hover:bg-[#F3EFE6] transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1">
          {/* Preview Column */}
          <div className="lg:col-span-6 bg-[#EDE7DC] p-6 flex flex-col items-center justify-center gap-4 border-b lg:border-b-0 lg:border-l border-[#E2DACB]">
            {/* View Mode Segmented Control */}
            <div
              role="tablist"
              aria-label="نوع الصورة الجاهزة"
              className="inline-flex items-center gap-1 p-1 bg-white border border-[#DFD7C8] rounded-lg"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'clean'}
                onClick={() => setMode('clean')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'clean'
                    ? 'bg-[#202823] text-[#F8F5EE]'
                    : 'text-[#4D5A52] hover:text-[#1B241E]'
                }`}
              >
                صورة استوديو نظيفة
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'card'}
                onClick={() => setMode('card')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === 'card'
                    ? 'bg-[#202823] text-[#F8F5EE]'
                    : 'text-[#4D5A52] hover:text-[#1B241E]'
                }`}
              >
                كارت بوست سوشيال ميديا
              </button>
            </div>

            {mode === 'clean' ? (
              <div className="w-full max-w-[380px] aspect-[3/4] rounded-xl overflow-hidden bg-white border border-[#DFD7C8]">
                <img
                  src={product.studioImagePath}
                  alt={`تصوير استوديو ${displayTitle}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="relative w-full max-w-[380px] rounded-xl overflow-hidden bg-white border border-[#DFD7C8]">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto block"
                  aria-label={`معاينة كارت سوشيال ميديا ${displayTitle}`}
                />
                {isRendering && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs font-medium text-[#1B241E]">
                    جاري تحديث التصميم...
                  </div>
                )}
              </div>
            )}

            {/* Primary Download Action */}
            <div className="w-full max-w-[380px] flex items-center gap-3">
              {mode === 'clean' ? (
                <a
                  href={product.studioImagePath}
                  download={product.downloadFilename}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#F8F5EE] bg-[#202823] rounded-lg hover:bg-[#2C3730] transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4 text-[#D2B77E]" />
                  تحميل صورة الاستوديو (JPG)
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#F8F5EE] bg-[#202823] rounded-lg hover:bg-[#2C3730] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-[#D2B77E]" />
                  تحميل كارت البوست (JPG)
                </button>
              )}
            </div>
          </div>

          {/* Controls & WhatsApp Caption Column */}
          <div className="lg:col-span-6 p-6 flex flex-col gap-6 bg-white">
            {/* Optional Card Customization */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#1B241E]">
                  إعدادات البوست ورسالة واتساب
                </h4>
                <p className="text-xs text-[#647068] mt-1">
                  يمكنك إضافة السعر أو جملة عرض اختيارية لتظهر تلقائياً في الكارت ورسالة واتساب.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-[#4D5A52] mb-1.5">
                    السعر بالجنيه (اختياري)
                  </span>
                  <input
                    type="text"
                    value={priceEgp}
                    onChange={(e) => setPriceEgp(e.target.value)}
                    placeholder="مثال: 185"
                    className="w-full px-3.5 py-2.5 text-sm text-[#1B241E] bg-[#FAF8F4] border border-[#DDD5C6] rounded-lg focus:outline-none focus:border-[#202823] tabular-nums"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs font-medium text-[#4D5A52] mb-1.5">
                    سطر عرض أو تواصل (اختياري)
                  </span>
                  <input
                    type="text"
                    value={promoLine}
                    onChange={(e) => setPromoLine(e.target.value)}
                    placeholder="مثال: عرض خاص لجروب الواتساب"
                    className="w-full px-3.5 py-2.5 text-sm text-[#1B241E] bg-[#FAF8F4] border border-[#DDD5C6] rounded-lg focus:outline-none focus:border-[#202823]"
                  />
                </label>
              </div>

              {mode === 'card' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="block text-xs font-medium text-[#4D5A52] mb-1.5">
                      مقاس الكارت
                    </span>
                    <div className="flex items-center gap-1 p-1 bg-[#F3EFE6] rounded-lg">
                      <button
                        type="button"
                        onClick={() => setFormat('portrait')}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          format === 'portrait'
                            ? 'bg-white text-[#1B241E] shadow-xs'
                            : 'text-[#556159] hover:text-[#1B241E]'
                        }`}
                      >
                        4:5 واتساب وإنستجرام
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormat('square')}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          format === 'square'
                            ? 'bg-white text-[#1B241E] shadow-xs'
                            : 'text-[#556159] hover:text-[#1B241E]'
                        }`}
                      >
                        1:1 مربع
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-[#4D5A52] mb-1.5">
                      لون الإطار
                    </span>
                    <div className="flex items-center gap-1 p-1 bg-[#F3EFE6] rounded-lg">
                      <button
                        type="button"
                        onClick={() => setTheme('ivory')}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          theme === 'ivory'
                            ? 'bg-white text-[#1B241E] shadow-xs'
                            : 'text-[#556159] hover:text-[#1B241E]'
                        }`}
                      >
                        ترافرتين فاتح
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('emerald')}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          theme === 'emerald'
                            ? 'bg-white text-[#1B241E] shadow-xs'
                            : 'text-[#556159] hover:text-[#1B241E]'
                        }`}
                      >
                        زمردي فاخر
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ready-to-Send WhatsApp Message */}
            <div className="pt-5 border-t border-[#EFECE4] flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1B241E]">
                  <MessageCircle className="w-4 h-4 text-[#2A6F4E]" />
                  رسالة جاهزة لجروبات واتساب والسوشيال
                </span>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1B241E] bg-[#F3EFE6] border border-[#DDD5C6] rounded-lg hover:bg-[#EAE3D5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2A6F4E]" />
                      تم نسخ النص
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      نسخ الرسالة
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                rows={9}
                value={captionText}
                aria-label="نص رسالة واتساب الجاهزة"
                className="w-full p-3.5 text-xs leading-relaxed text-[#2A342D] bg-[#FAF8F4] border border-[#E5DFD2] rounded-lg resize-none focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
