import React, { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  Archive,
  Check,
  Copy,
  Download,
  Eye,
  Percent,
  RotateCcw,
  Truck,
  X,
} from 'lucide-react';
import { AURAGLOW_LOGO_PATH } from '../data/auraglowAssets';
import {
  AURAGLOW_PRICE_LIST_SECTIONS,
  DEFAULT_DISCOUNT_PERCENT,
  OPENING_OFFER_HIGHLIGHTS,
  PriceListSection,
  PriceListSectionId,
  buildPriceListWhatsAppText,
  calculateDiscountedPrice,
  formatEgpAmount,
} from '../data/auraglowPriceList';
import {
  renderPriceListPageBlob,
  renderPriceListPageCanvas,
} from '../utils/priceListRenderer';

type SectionFilter = 'all' | PriceListSectionId;

export function AuraglowPriceList() {
  const [activeTab, setActiveTab] = useState<SectionFilter>('all');
  const [discountPercent, setDiscountPercent] = useState<number>(DEFAULT_DISCOUNT_PERCENT);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [busyPageId, setBusyPageId] = useState<string | null>(null);
  const [zipProgress, setZipProgress] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [previewSection, setPreviewSection] = useState<PriceListSection | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const visibleSections = useMemo(() => {
    if (activeTab === 'all') return AURAGLOW_PRICE_LIST_SECTIONS;
    return AURAGLOW_PRICE_LIST_SECTIONS.filter((s) => s.id === activeTab);
  }, [activeTab]);

  const hasCustomEdits =
    discountPercent !== DEFAULT_DISCOUNT_PERCENT || Object.keys(priceOverrides).length > 0;

  useEffect(() => {
    if (!previewSection || !previewCanvasRef.current) return;
    let cancelled = false;
    renderPriceListPageCanvas(previewCanvasRef.current, previewSection, {
      priceOverrides,
      discountPercent,
      logoPath: AURAGLOW_LOGO_PATH,
    }).catch(() => {
      if (!cancelled) {
        // Ignore transient font/image load errors
      }
    });
    return () => {
      cancelled = true;
    };
  }, [previewSection, priceOverrides, discountPercent]);

  const handlePriceChange = (itemId: string, rawValue: string) => {
    const cleaned = rawValue.replace(/[^\d.]/g, '');
    if (cleaned === '') {
      setPriceOverrides((prev) => ({ ...prev, [itemId]: 0 }));
      return;
    }
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100000) {
      setPriceOverrides((prev) => ({ ...prev, [itemId]: parsed }));
    }
  };

  const handleDiscountChange = (rawValue: string) => {
    const cleaned = rawValue.replace(/[^\d.]/g, '');
    if (cleaned === '') {
      setDiscountPercent(0);
      return;
    }
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) {
      setDiscountPercent(Math.min(Math.max(parsed, 0), 90));
    }
  };

  const handleReset = () => {
    setDiscountPercent(DEFAULT_DISCOUNT_PERCENT);
    setPriceOverrides({});
  };

  const handleDownloadSinglePage = async (section: PriceListSection) => {
    if (busyPageId) return;
    setBusyPageId(section.id);
    try {
      const blob = await renderPriceListPageBlob(section, {
        priceOverrides,
        discountPercent,
        logoPath: AURAGLOW_LOGO_PATH,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = section.downloadFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } finally {
      setBusyPageId(null);
    }
  };

  const handleDownloadAllPagesZip = async () => {
    if (zipProgress) return;
    setZipProgress('جاري تجهيز الصفحات...');
    try {
      const zip = new JSZip();
      const folder = zip.folder('auraglow-price-list-20-percent-off');
      if (!folder) return;

      for (let i = 0; i < AURAGLOW_PRICE_LIST_SECTIONS.length; i++) {
        const section = AURAGLOW_PRICE_LIST_SECTIONS[i];
        setZipProgress(`تجهيز صفحة ${i + 1} / ${AURAGLOW_PRICE_LIST_SECTIONS.length}`);
        const blob = await renderPriceListPageBlob(section, {
          priceOverrides,
          discountPercent,
          logoPath: AURAGLOW_LOGO_PATH,
        });
        folder.file(section.downloadFilename, blob);
      }

      const whatsappText = buildPriceListWhatsAppText(
        AURAGLOW_PRICE_LIST_SECTIONS,
        priceOverrides,
        discountPercent
      );
      folder.file('auraglow-price-list-whatsapp.txt', whatsappText);

      setZipProgress('جاري ضغط الملف...');
      const archive = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(archive);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'auraglow-updated-price-list-3-pages.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 6000);
    } finally {
      setZipProgress(null);
    }
  };

  const handleCopyWhatsAppText = async () => {
    const text = buildPriceListWhatsAppText(
      AURAGLOW_PRICE_LIST_SECTIONS,
      priceOverrides,
      discountPercent
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  return (
    <section
      id="price-list-section"
      aria-labelledby="price-list-heading"
      className="py-12 md:py-16 border-t border-[#E4DEC9] bg-[#F7F5F0]"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header + Global Actions */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold tracking-wider text-[#7B6538]">
              01 · قائمة الأسعار الرسمية المحدّثة
            </span>
            <h2
              id="price-list-heading"
              className="text-2xl md:text-3xl font-bold text-[#1B241E] mt-1.5"
            >
              قائمة أسعار أوراجلو بالصور الجديدة وخصم الافتتاح {formatEgpAmount(discountPercent)}%
            </h2>
            <p className="text-sm text-[#525E56] mt-2 leading-relaxed">
              جميع الأصناف الـ 19 بصور الاستوديو الرسمية مع عمودين للأسعار (قبل الخصم وبعد خصم{' '}
              {formatEgpAmount(discountPercent)}%). يمكنك تعديل أي سعر مباشرة وسيتحدث الخصم وصورة
              القائمة تلقائياً.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadAllPagesZip}
              disabled={Boolean(zipProgress)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#F8F5EE] bg-[#202823] rounded-lg hover:bg-[#2C3730] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap tabular-nums"
            >
              <Archive className="w-4 h-4 text-[#D2B77E] shrink-0" />
              {zipProgress ? zipProgress : 'تحميل الـ 3 صفحات كصور (ZIP)'}
            </button>

            <button
              type="button"
              onClick={handleCopyWhatsAppText}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#1B241E] bg-white border border-[#DCD4C3] rounded-lg hover:bg-[#F3EFE6] transition-colors cursor-pointer whitespace-nowrap"
            >
              {copiedText ? (
                <>
                  <Check className="w-4 h-4 text-[#1F5E3B]" />
                  تم النسخ للواتساب
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#7B6538]" />
                  نسخ القائمة نصياً للواتساب
                </>
              )}
            </button>
          </div>
        </div>

        {/* Offer Bar + Filter Tabs + Live Discount Control */}
        <div className="bg-white border border-[#E4DEC9] rounded-xl p-4 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Page Filter Tabs */}
          <div
            role="tablist"
            aria-label="تصفية صفحات قائمة الأسعار"
            className="flex flex-wrap items-center gap-1.5"
          >
            {(
              [
                { id: 'all', label: 'الكل (3 صفحات · 19 صنف)' },
                { id: 'hair', label: '1. العناية بالشعر (7)' },
                { id: 'skin', label: '2. العناية بالبشرة (9)' },
                { id: 'body', label: '3. الجسم واليدين (3)' },
              ] as const
            ).map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#202823] text-[#F8F5EE]'
                      : 'bg-[#F5F2EB] text-[#4D5A52] hover:bg-[#EAE4D6] hover:text-[#1B241E]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Discount % Editor & Reset */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label
              htmlFor="global-discount-percent"
              className="inline-flex items-center gap-1.5 font-medium text-[#4D5A52]"
            >
              <Percent className="w-3.5 h-3.5 text-[#7B6538]" />
              نسبة الخصم:
            </label>
            <div className="relative flex items-center">
              <input
                id="global-discount-percent"
                type="number"
                min={0}
                max={90}
                step={1}
                value={discountPercent}
                onChange={(e) => handleDiscountChange(e.target.value)}
                className="w-20 px-2.5 py-1.5 text-center font-bold text-[#1B241E] bg-[#FAF8F4] border border-[#DCD4C3] rounded-lg focus:outline-none focus:border-[#202823] tabular-nums"
              />
              <span className="mr-1.5 font-semibold text-[#6B756E]">%</span>
            </div>

            {hasCustomEdits && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#7B6538] hover:text-[#1B241E] bg-[#F7F3EA] rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                استعادة الافتراضي
              </button>
            )}
          </div>
        </div>

        {/* 3 Updated Price List Pages */}
        <div className="space-y-8">
          {visibleSections.map((section) => {
            const isDownloading = busyPageId === section.id;
            return (
              <article
                key={section.id}
                data-testid={`price-list-page-${section.id}`}
                className="bg-white border border-[#E2DACB] rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(27,36,30,0.04)]"
              >
                {/* Page Brand Banner */}
                <div className="bg-[#202823] text-[#F8F5EE] px-5 sm:px-7 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D2B77E]/30">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={AURAGLOW_LOGO_PATH}
                      alt="شعار أوراجلو"
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-contain bg-white border border-[#D2B77E] shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-[#D2B77E] font-medium">
                        <span>صفحة {section.pageNumber} من {section.totalPages}</span>
                        <span aria-hidden="true">·</span>
                        <span>{section.subtitleEnglish}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-[#F8F5EE] mt-0.5">
                        {section.titleArabic}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewSection(section)}
                      aria-label={`معاينة صورة قائمة ${section.titleArabic}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#F8F5EE] bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#D2B77E]" />
                      معاينة الصورة
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadSinglePage(section)}
                      disabled={Boolean(busyPageId)}
                      aria-label={`تحميل قائمة ${section.titleArabic} كصورة JPG`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#1B241E] bg-[#D2B77E] hover:bg-[#DFC690] disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isDownloading ? 'جاري التجهيز...' : 'تحميل الصفحة (JPG)'}
                    </button>
                  </div>
                </div>

                {/* Responsive RTL Price Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#EFE9DC] text-[#1B241E] text-xs font-bold border-b border-[#E2DACB]">
                        <th className="py-3.5 px-4 sm:px-6 text-center w-36 sm:w-52">المنتج</th>
                        <th className="py-3.5 px-4">الصنف</th>
                        <th className="py-3.5 px-4 text-center whitespace-nowrap">الحجم</th>
                        <th className="py-3.5 px-4 text-center whitespace-nowrap">قبل الخصم</th>
                        <th className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap bg-[#E6DEC9] text-[#1A3527]">
                          بعد خصم {formatEgpAmount(discountPercent)}%
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFECE4]">
                      {section.items.map((item, idx) => {
                        const basePrice = priceOverrides[item.id] ?? item.originalPrice;
                        const discountedPrice = calculateDiscountedPrice(
                          basePrice,
                          discountPercent
                        );
                        const isMulti = item.imagePaths.length > 1;

                        return (
                          <tr
                            key={item.id}
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F4]'}
                          >
                            {/* Product Studio Packshot(s) */}
                            <td className="py-3 px-4 sm:px-6">
                              <div
                                className={`flex items-center justify-center ${
                                  isMulti ? 'gap-1.5' : ''
                                }`}
                              >
                                {item.imagePaths.map((imgSrc, imgIndex) => (
                                  <div
                                    key={imgSrc}
                                    className={`${
                                      isMulti
                                        ? 'w-14 h-[74px] sm:w-16 sm:h-[84px]'
                                        : 'w-16 h-[84px] sm:w-[70px] sm:h-[92px]'
                                    } rounded-lg overflow-hidden bg-[#E7EAEE] border border-[#E2DACB] shrink-0`}
                                  >
                                    <img
                                      src={imgSrc}
                                      alt={`${item.nameArabic}${
                                        isMulti ? ` — شكل ${imgIndex + 1}` : ''
                                      }`}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                ))}
                              </div>
                            </td>

                            {/* Item Name & Variant Subtitle */}
                            <td className="py-3 px-4 align-middle">
                              <div className="font-bold text-sm sm:text-base text-[#1B241E]">
                                {item.nameArabic}
                              </div>
                              {item.variantsSubtitle && (
                                <div className="text-xs text-[#6B756E] mt-1">
                                  {item.variantsSubtitle}
                                </div>
                              )}
                              {item.needsPriceReview && (
                                <div className="text-[11px] text-[#8A6422] mt-1">
                                  {item.reviewNoteArabic}
                                </div>
                              )}
                            </td>

                            {/* Volume */}
                            <td className="py-3 px-4 text-center align-middle text-xs sm:text-sm font-medium text-[#4D5A52] whitespace-nowrap">
                              {item.volumeArabic}
                            </td>

                            {/* Before Discount (Editable Input + Strikethrough Indicator) */}
                            <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                              <div className="inline-flex flex-col items-center gap-1">
                                <div className="inline-flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    aria-label={`السعر قبل الخصم لـ ${item.nameArabic}`}
                                    value={basePrice}
                                    onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                    className="w-20 px-2 py-1 text-center text-sm font-semibold text-[#6F6A61] bg-[#F7F5F0] border border-[#DFD8C8] rounded-md focus:outline-none focus:border-[#202823] tabular-nums"
                                  />
                                  <span className="text-xs text-[#7D776C]">ج.م</span>
                                </div>
                                <span className="text-[11px] text-[#A25042] line-through tabular-nums">
                                  {formatEgpAmount(basePrice)} ج.م
                                </span>
                              </div>
                            </td>

                            {/* After Discount */}
                            <td className="py-3 px-4 sm:px-6 text-center align-middle whitespace-nowrap bg-[#F6F2E8]/60">
                              <span
                                data-testid={`discounted-price-${item.id}`}
                                className="inline-flex items-center justify-center min-w-[92px] px-3.5 py-2 rounded-lg bg-[#1F3A2D] text-[#F8F5EE] text-sm sm:text-base font-bold tabular-nums border border-[#D2B77E]/40"
                              >
                                {formatEgpAmount(discountedPrice)} ج.م
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Page Footer Offer Strip */}
                <div className="bg-[#FAF8F3] border-t border-[#E6DFD0] px-5 sm:px-7 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#4D5A52]">
                  <span className="inline-flex items-center gap-2 font-semibold text-[#1B241E]">
                    <Truck className="w-4 h-4 text-[#7B6538] shrink-0" />
                    {OPENING_OFFER_HIGHLIGHTS.deliveryArabic} ·{' '}
                    {OPENING_OFFER_HIGHLIGHTS.freeShippingArabic}
                  </span>
                  <span className="text-[#7B6538] font-semibold">
                    خصم {formatEgpAmount(discountPercent)}% بمناسبة الافتتاح
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Live Final JPG Preview Modal */}
      {previewSection && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="price-list-preview-title"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#F7F5F0] border border-[#DCD4C3] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-white border-b border-[#E4DEC9] flex items-center justify-between gap-4">
              <div>
                <h3
                  id="price-list-preview-title"
                  className="text-base font-bold text-[#1B241E]"
                >
                  معاينة الصورة الجاهزة للواتساب — {previewSection.titleArabic}
                </h3>
                <p className="text-xs text-[#6B756E]">
                  صفحة {previewSection.pageNumber} من {previewSection.totalPages} · دقة عالية
                  مناسبة للواتساب والإنستجرام
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadSinglePage(previewSection)}
                  disabled={Boolean(busyPageId)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#F8F5EE] bg-[#202823] hover:bg-[#2C3730] rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#D2B77E]" />
                  تحميل الصورة (JPG)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSection(null)}
                  aria-label="إغلاق المعاينة"
                  className="p-2 text-[#4D5A52] hover:text-[#1B241E] bg-[#F3EFE6] rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex justify-center bg-[#EAE5DA]">
              <canvas
                ref={previewCanvasRef}
                data-testid="price-list-preview-canvas"
                className="max-w-full h-auto rounded-xl shadow-lg border border-[#D8CEB8]"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
