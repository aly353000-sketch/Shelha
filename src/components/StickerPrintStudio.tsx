import React, { useEffect, useRef, useState } from 'react';
import { Download, Printer, RotateCcw, Scissors } from 'lucide-react';
import {
  AURAGLOW_LOGO_PATH,
  BOTTLE_STUDIO_ASSETS,
  PREBUILT_A4_PDF_PATH,
} from '../data/auraglowAssets';
import {
  DEFAULT_STICKER_DATA,
  GridPreset,
  StickerData,
  StickerTheme,
  computeA4Imposition,
  isDefaultPrintConfig,
} from '../utils/stickerLayout';
import { generateCustomA4PdfBlob } from '../utils/pdfBuilder';
import { StickerCard } from './StickerCard';
import { A4PrintSheet } from './A4PrintSheet';

interface StickerPrintStudioProps {
  data: StickerData;
  onChangeData: (next: StickerData) => void;
  theme: StickerTheme;
  onChangeTheme: (next: StickerTheme) => void;
  gridPreset: GridPreset;
  onChangeGridPreset: (next: GridPreset) => void;
  showCropMarks: boolean;
  onChangeShowCropMarks: (next: boolean) => void;
}

export const StickerPrintStudio: React.FC<StickerPrintStudioProps> = ({
  data,
  onChangeData,
  theme,
  onChangeTheme,
  gridPreset,
  onChangeGridPreset,
  showCropMarks,
  onChangeShowCropMarks,
}) => {
  const [selectedBottleId, setSelectedBottleId] = useState<'mint' | 'pink' | 'yellow'>('mint');
  const [previewMode, setPreviewMode] = useState<'proof' | 'bottle'>('proof');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const a4ContainerRef = useRef<HTMLDivElement | null>(null);
  const [a4PreviewWidth, setA4PreviewWidth] = useState(520);

  const imposition = computeA4Imposition(gridPreset);
  const isDefault = isDefaultPrintConfig(data, theme, gridPreset, showCropMarks);
  const activeBottle =
    BOTTLE_STUDIO_ASSETS.find((b) => b.id === selectedBottleId) ?? BOTTLE_STUDIO_ASSETS[0];

  useEffect(() => {
    const updateWidth = () => {
      if (!a4ContainerRef.current) return;
      const available = a4ContainerRef.current.clientWidth - 32;
      setA4PreviewWidth(Math.max(280, Math.min(560, available)));
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const updateField = <K extends keyof StickerData>(key: K, value: StickerData[K]) => {
    onChangeData({ ...data, [key]: value });
  };

  const handleReset = () => {
    onChangeData(DEFAULT_STICKER_DATA);
    onChangeTheme('emerald');
    onChangeGridPreset('4x4');
    onChangeShowCropMarks(true);
    setExportStatus('تمت استعادة التصميم الأصلي المطابق لهوية أوراجلو.');
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    setExportStatus(null);
    try {
      if (isDefault) {
        // Check if our Chromium true-vector pre-built PDF is present; otherwise generate high-DPI PDF live
        const probe = await fetch(PREBUILT_A4_PDF_PATH, { method: 'HEAD' });
        if (probe.ok) {
          const link = document.createElement('a');
          link.href = PREBUILT_A4_PDF_PATH;
          link.download = 'auraglow-hand-cream-stickers-a4-4x6cm.pdf';
          document.body.appendChild(link);
          link.click();
          link.remove();
          setExportStatus(
            'تم تحميل ملف PDF فيكتور جاهز للطباعة على ورق A4 بمقاس 4 × 6 سم (16 استيكر).'
          );
          return;
        }
      }

      const blob = await generateCustomA4PdfBlob(
        data,
        theme,
        gridPreset,
        showCropMarks,
        AURAGLOW_LOGO_PATH
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `auraglow-hand-cream-a4-4x6cm-${gridPreset}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setExportStatus(
        `تم إنشاء وتحميل ملف PDF بدقة 300 DPI بمقاس A4 (${imposition.totalStickers} استيكر × 4×6 سم).`
      );
    } catch {
      setExportStatus('حدث خطأ أثناء إنشاء ملف PDF. يمكنك استخدام زر الطباعة المباشرة A4.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <section
      id="sticker-studio"
      aria-labelledby="sticker-studio-heading"
      className="py-16 md:py-20 border-t border-[#E4DEC9]"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#7B6538] tracking-wide mb-2">
              02. تصميم الاستيكر وورقة الطباعة A4 · مقاس فعلي عرض 4 سم × ارتفاع 6 سم
            </p>
            <h2
              id="sticker-studio-heading"
              className="text-2xl md:text-4xl font-bold text-[#1B241E] leading-tight"
              style={{ textWrap: 'balance' }}
            >
              استيكر هاند كريم أوراجلو جاهز للطباعة PDF
            </h2>
            <p className="text-sm md:text-base text-[#556159] mt-3 leading-relaxed">
              مصمم بنفس هوية خط أوراجلو (الأخضر الداكن والإطار الذهبي المزدوج والشعار الأصلي)
              شاملاً الوصف والمواد الفعالة الـ11 وطريقة الاستخدام، ومضبوط بدقة ملليمترية على
              ورقة A4.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-[#F8F5EE] bg-[#202823] rounded-lg hover:bg-[#2C3730] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#D2B77E]" />
              {isExportingPdf ? 'جاري تجهيز ملف PDF...' : 'تحميل ملف PDF للطباعة (A4)'}
            </button>
            <button
              type="button"
              onClick={handleDirectPrint}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-[#1B241E] bg-white border border-[#D8D0BE] rounded-lg hover:bg-[#F3EFE4] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#8A703C]" />
              طباعة مباشرة A4
            </button>
          </div>
        </div>

        {exportStatus && (
          <div
            role="status"
            className="mb-8 px-4 py-3 text-sm text-[#1E3A2A] bg-[#EAF2EC] border border-[#C6DBC9] rounded-lg"
          >
            {exportStatus}
          </div>
        )}

        {/* Main 2-Column Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Column 1 (5 cols): Single Sticker Proof + Bottle Mockup + Text Customizer */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Proof / Bottle Preview Card */}
            <div className="bg-white border border-[#E5DFD2] rounded-xl p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-base font-bold text-[#1B241E]">معاينة الاستيكر</h3>
                  <p className="text-xs text-[#6B756E] mt-0.5 tabular-nums">
                    المقاس الفعلي: عرض 40 مم × ارتفاع 60 مم (4 × 6 سم)
                  </p>
                </div>

                {/* Segmented Interactive Switcher */}
                <div className="flex items-center gap-1 p-1 bg-[#F3EFE4] rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('proof')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      previewMode === 'proof'
                        ? 'bg-white text-[#1B241E] shadow-xs'
                        : 'text-[#5E6A62] hover:text-[#1B241E]'
                    }`}
                  >
                    بروفة مكبرة
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('bottle')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      previewMode === 'bottle'
                        ? 'bg-white text-[#1B241E] shadow-xs'
                        : 'text-[#5E6A62] hover:text-[#1B241E]'
                    }`}
                  >
                    على العبوة
                  </button>
                </div>
              </div>

              {previewMode === 'proof' ? (
                <div className="bg-[#F5F2EB] rounded-lg py-8 px-4 flex flex-col items-center justify-center">
                  <div className="shadow-md">
                    <StickerCard data={data} theme={theme} mmUnit="6.2px" />
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-xs text-[#6B756E] tabular-nums">
                    <span>العرض: 4 سم</span>
                    <span aria-hidden="true">·</span>
                    <span>الارتفاع: 6 سم</span>
                    <span aria-hidden="true">·</span>
                    <span>دقة الطباعة: 300 DPI</span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F5F2EB] rounded-lg p-5 flex flex-col items-center">
                  <div className="relative w-full max-w-[300px] aspect-[3/4] rounded-lg overflow-hidden">
                    <img
                      src={activeBottle.studioSrc}
                      alt={activeBottle.titleArabic}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {/* Live Sticker Placement Overlay on the Studio Squeeze Tube */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 rounded-[4px] overflow-hidden shadow-sm"
                      style={{
                        top: '29%',
                        opacity: 0.96,
                      }}
                    >
                      <StickerCard data={data} theme={theme} mmUnit="2.35px" />
                    </div>
                  </div>

                  {/* Bottle Color Selector */}
                  <div className="mt-4 flex items-center gap-2">
                    {BOTTLE_STUDIO_ASSETS.map((bottle) => (
                      <button
                        key={bottle.id}
                        type="button"
                        onClick={() => setSelectedBottleId(bottle.id as 'mint' | 'pink' | 'yellow')}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                          selectedBottleId === bottle.id
                            ? 'bg-[#202823] text-[#F8F5EE] border-[#202823]'
                            : 'bg-white text-[#2E3932] border-[#DED6C5] hover:bg-[#FAF8F3]'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/15"
                          style={{ backgroundColor: bottle.swatchHex }}
                          aria-hidden="true"
                        />
                        {bottle.id === 'mint'
                          ? 'أخضر'
                          : bottle.id === 'pink'
                          ? 'وردي'
                          : 'كريمي'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Print Options & Content Customizer */}
            <div className="bg-white border border-[#E5DFD2] rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#EFECE4]">
                <h3 className="text-base font-bold text-[#1B241E]">
                  تخصيص بيانات الاستيكر والطباعة
                </h3>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7B6538] hover:text-[#1B241E] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  استعادة الافتراضي
                </button>
              </div>

              {/* Theme & Sheet Density Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold text-[#3C4840] mb-2">
                    لون خلفية الاستيكر
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F3EFE4] rounded-lg">
                    <button
                      type="button"
                      onClick={() => onChangeTheme('emerald')}
                      className={`py-2 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        theme === 'emerald'
                          ? 'bg-[#202823] text-[#F8F5EE]'
                          : 'text-[#4C5850] hover:text-[#1B241E]'
                      }`}
                    >
                      أوراجلو الداكن
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeTheme('ivory')}
                      className={`py-2 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        theme === 'ivory'
                          ? 'bg-white text-[#1B241E] shadow-xs'
                          : 'text-[#4C5850] hover:text-[#1B241E]'
                      }`}
                    >
                      عاجي ذهبي
                    </button>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-semibold text-[#3C4840] mb-2">
                    عدد الاستيكرات في ورقة A4
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F3EFE4] rounded-lg">
                    <button
                      type="button"
                      onClick={() => onChangeGridPreset('4x4')}
                      className={`py-2 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                        gridPreset === '4x4'
                          ? 'bg-white text-[#1B241E] shadow-xs'
                          : 'text-[#4C5850] hover:text-[#1B241E]'
                      }`}
                    >
                      16 استيكر (4×4)
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeGridPreset('4x3')}
                      className={`py-2 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                        gridPreset === '4x3'
                          ? 'bg-white text-[#1B241E] shadow-xs'
                          : 'text-[#4C5850] hover:text-[#1B241E]'
                      }`}
                    >
                      12 استيكر (4×3)
                    </button>
                  </div>
                </div>
              </div>

              {/* Crop Marks Checkbox */}
              <label className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-[#FAF8F3] border border-[#EAE3D5] rounded-lg cursor-pointer">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-[#2E3932]">
                  <Scissors className="w-3.5 h-3.5 text-[#8A703C]" />
                  إظهار علامات القص الاحترافية (Crop Marks) حول كل استيكر
                </span>
                <input
                  type="checkbox"
                  checked={showCropMarks}
                  onChange={(e) => onChangeShowCropMarks(e.target.checked)}
                  className="w-4 h-4 accent-[#202823] cursor-pointer"
                />
              </label>

              {/* Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="sticker-title-ar"
                    className="block text-xs font-semibold text-[#3C4840] mb-1.5"
                  >
                    اسم المنتج (عربي)
                  </label>
                  <input
                    id="sticker-title-ar"
                    type="text"
                    value={data.titleArabic}
                    onChange={(e) => updateField('titleArabic', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-[#1B241E] bg-[#FAF8F3] border border-[#DDD5C4] rounded-lg focus:outline-none focus:border-[#202823]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sticker-subtitle-en"
                    className="block text-xs font-semibold text-[#3C4840] mb-1.5"
                  >
                    الاسم الإنجليزي
                  </label>
                  <input
                    id="sticker-subtitle-en"
                    type="text"
                    dir="ltr"
                    value={data.subtitleEnglish}
                    onChange={(e) => updateField('subtitleEnglish', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-[#1B241E] bg-[#FAF8F3] border border-[#DDD5C4] rounded-lg focus:outline-none focus:border-[#202823]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="sticker-desc"
                  className="block text-xs font-semibold text-[#3C4840] mb-1.5"
                >
                  الوصف
                </label>
                <textarea
                  id="sticker-desc"
                  rows={2}
                  value={data.descriptionArabic}
                  onChange={(e) => updateField('descriptionArabic', e.target.value)}
                  className="w-full px-3 py-2 text-xs leading-relaxed text-[#1B241E] bg-[#FAF8F3] border border-[#DDD5C4] rounded-lg focus:outline-none focus:border-[#202823]"
                />
              </div>

              <div>
                <label
                  htmlFor="sticker-ingredients"
                  className="block text-xs font-semibold text-[#3C4840] mb-1.5"
                >
                  المواد الفعالة الأساسية (Active Ingredients)
                </label>
                <textarea
                  id="sticker-ingredients"
                  rows={3}
                  dir="ltr"
                  value={data.ingredientsList}
                  onChange={(e) => updateField('ingredientsList', e.target.value)}
                  className="w-full px-3 py-2 text-xs leading-relaxed text-[#1B241E] bg-[#FAF8F3] border border-[#DDD5C4] rounded-lg focus:outline-none focus:border-[#202823]"
                />
              </div>

              <div>
                <label
                  htmlFor="sticker-usage"
                  className="block text-xs font-semibold text-[#3C4840] mb-1.5"
                >
                  طريقة الاستخدام
                </label>
                <input
                  id="sticker-usage"
                  type="text"
                  value={data.usageText}
                  onChange={(e) => updateField('usageText', e.target.value)}
                  className="w-full px-3 py-2 text-sm text-[#1B241E] bg-[#FAF8F3] border border-[#DDD5C4] rounded-lg focus:outline-none focus:border-[#202823]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="sticker-volume"
                    className="block text-xs font-semibold text-[#3C4840] mb-1.5"
                  >
                    حجم العبوة
                  </label>
                  <input
                    id="sticker-volume"
                    type="text"
                    value={data.volumeText}
                    onChange={(e) => updateField('volumeText', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-[#1B241E] bg-[#FAF8F3] border border-[#DDD5C4] rounded-lg focus:outline-none focus:border-[#202823]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sticker-expiry"
                    className="block text-xs font-semibold text-[#3C4840] mb-1.5"
                  >
                    تاريخ الصلاحية
                  </label>
                  <input
                    id="sticker-expiry"
                    type="text"
                    dir="ltr"
                    value={data.expiryText}
                    onChange={(e) => updateField('expiryText', e.target.value)}
                    className="w-full px-3 py-2 text-sm text-[#1B241E] bg-[#FAF8F3] border border-[#DDD5C4] rounded-lg focus:outline-none focus:border-[#202823]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 (7 cols): Live Proportional A4 Print Sheet Preview */}
          <div id="a4-sheet-section" className="lg:col-span-7">
            <div className="bg-white border border-[#E5DFD2] rounded-xl p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#EFECE4]">
                <div>
                  <h3 className="text-base font-bold text-[#1B241E]">
                    معاينة ورقة الطباعة A4 (210 × 297 مم)
                  </h3>
                  <p className="text-xs text-[#6B756E] mt-1 tabular-nums">
                    {imposition.totalStickers} استيكر ({imposition.columns} أعمدة ×{' '}
                    {imposition.rows} صفوف) · مقاس كل استيكر 4 × 6 سم · هوامش أمان{' '}
                    {imposition.marginXMm} مم
                  </p>
                </div>
                <span className="text-xs font-medium text-[#7B6538] whitespace-nowrap">
                  اطبع بنسبة 100% (Actual Size)
                </span>
              </div>

              <div
                ref={a4ContainerRef}
                className="bg-[#ECE8DD] rounded-lg p-4 md:p-6 flex items-center justify-center overflow-hidden"
              >
                <div className="shadow-lg ring-1 ring-black/10">
                  <A4PrintSheet
                    data={data}
                    theme={theme}
                    gridPreset={gridPreset}
                    showCropMarks={showCropMarks}
                    mode="preview"
                    previewWidthPx={a4PreviewWidth}
                  />
                </div>
              </div>

              {/* Print-Shop Technical Specification Strip */}
              <div className="mt-5 pt-4 border-t border-[#EFECE4] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="block text-[#6B756E]">مقاس الورق</span>
                  <span className="font-bold text-[#1B241E] tabular-nums">A4 · 21 × 29.7 سم</span>
                </div>
                <div>
                  <span className="block text-[#6B756E]">مقاس الاستيكر</span>
                  <span className="font-bold text-[#1B241E] tabular-nums">عرض 4 × ارتفاع 6 سم</span>
                </div>
                <div>
                  <span className="block text-[#6B756E]">العدد في الورقة</span>
                  <span className="font-bold text-[#1B241E] tabular-nums">
                    {imposition.totalStickers} استيكر
                  </span>
                </div>
                <div>
                  <span className="block text-[#6B756E]">نوع الورق المقترح</span>
                  <span className="font-bold text-[#1B241E]">ستيكر فينيل مقاوم للماء</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
