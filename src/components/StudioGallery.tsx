import React, { useState } from 'react';
import { Download, Eye, Layers, X } from 'lucide-react';
import {
  BOTTLE_STUDIO_ASSETS,
  StudioPhotoAsset,
  TRIO_HERO_ASSET,
} from '../data/auraglowAssets';

export const StudioGallery: React.FC = () => {
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});
  const [lightboxAsset, setLightboxAsset] = useState<StudioPhotoAsset | null>(null);

  const toggleOriginal = (id: string) => {
    setShowOriginalMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allShowingOriginal = BOTTLE_STUDIO_ASSETS.every(
    (asset) => showOriginalMap[asset.id]
  );

  const toggleAllComparison = () => {
    const nextValue = !allShowingOriginal;
    const nextState: Record<string, boolean> = {};
    for (const asset of BOTTLE_STUDIO_ASSETS) {
      nextState[asset.id] = nextValue;
    }
    setShowOriginalMap(nextState);
  };

  return (
    <section
      id="studio-photos"
      aria-labelledby="studio-gallery-heading"
      className="py-16 md:py-20 border-t border-[#E4DEC9]"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#7B6538] tracking-wide mb-2">
              01. تصوير المنتجات الاستوديو · إزالة اليد والخلفية بالكامل
            </p>
            <h2
              id="studio-gallery-heading"
              className="text-2xl md:text-4xl font-bold text-[#1B241E] leading-tight"
              style={{ textWrap: 'balance' }}
            >
              صور استوديو معزولة جاهزة للمتجر والإعلانات
            </h2>
            <p className="text-sm md:text-base text-[#556159] mt-3 leading-relaxed">
              تم تحويل صور العبوات الثلاث إلى تصوير تجاري نظيف بخلفية استوديو ناعمة وإضاءة
              متوازنة وإزالة كاملة لليد والأرضية، مع تحسين الحدة وإصلاح الاهتزاز في العبوة
              الوردية.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleAllComparison}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#1B241E] bg-white border border-[#D8D0BE] rounded-lg hover:bg-[#F3EFE4] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#8A703C]" />
              {allShowingOriginal ? 'عرض صور الاستوديو' : 'مقارنة بالصور الأصلية'}
            </button>
          </div>
        </div>

        {/* 3-Column Uniform Product Studio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {BOTTLE_STUDIO_ASSETS.map((asset) => {
            const isOriginal = Boolean(showOriginalMap[asset.id]);
            const activeSrc = isOriginal && asset.originalSrc ? asset.originalSrc : asset.studioSrc;

            return (
              <article
                key={asset.id}
                className="bg-white border border-[#E5DFD2] rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="relative aspect-[3/4] bg-[#F5F2EB] overflow-hidden">
                  <img
                    src={activeSrc}
                    alt={`${asset.titleArabic} — ${isOriginal ? 'قبل التعديل' : 'تصوير استوديو'}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />

                  {/* Subtle top-right action bar for quick lightbox inspect */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLightboxAsset(asset)}
                      aria-label={`معاينة ${asset.titleArabic} بحجم كبير`}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/90 text-[#1B241E] border border-[#E2DACB] hover:bg-white transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#6B756E] mb-1.5">
                      <span
                        className="inline-block w-3 h-3 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: asset.swatchHex }}
                        aria-hidden="true"
                      />
                      <span>{isOriginal ? 'الصورة الأصلية (قبل)' : 'تصوير استوديو (بعد)'}</span>
                      <span aria-hidden="true">·</span>
                      <span>JPG عالية الدقة</span>
                    </div>
                    <h3 className="text-base font-bold text-[#1B241E]">
                      {asset.titleArabic}
                    </h3>
                    <p className="text-xs text-[#5E6A62] mt-1 leading-relaxed">
                      {asset.subtitleArabic}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#EFECE4]">
                    <a
                      href={asset.downloadHref}
                      download={asset.downloadFilename}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#F8F5EE] bg-[#202823] rounded-lg hover:bg-[#2C3730] transition-colors whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5 text-[#D2B77E]" />
                      تحميل الصورة
                    </a>
                    {asset.originalSrc && (
                      <button
                        type="button"
                        onClick={() => toggleOriginal(asset.id)}
                        className="px-3.5 py-2.5 text-xs font-medium text-[#2E3932] bg-[#F5F2EB] border border-[#E2DACB] rounded-lg hover:bg-[#ECE6D8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isOriginal ? 'عرض الاستوديو' : 'قبل / بعد'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Editorial Trio Campaign Banner */}
        <div className="mt-8 bg-white border border-[#E5DFD2] rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 bg-[#EFECE4] overflow-hidden">
            <img
              src={TRIO_HERO_ASSET.studioSrc}
              alt={TRIO_HERO_ASSET.titleArabic}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover aspect-[4/3] lg:aspect-auto"
            />
          </div>
          <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs text-[#7B6538] font-medium mb-2">
                لقطة جماعية · 4:3 · جاهزة لغلاف المتجر والسوشيال ميديا
              </p>
              <h3 className="text-xl md:text-2xl font-bold text-[#1B241E]">
                {TRIO_HERO_ASSET.titleArabic}
              </h3>
              <p className="text-sm text-[#556159] mt-3 leading-relaxed">
                {TRIO_HERO_ASSET.subtitleArabic}. تجمع العبوات الثلاث بتكوين متوازن على سطح
                ترافرتين دافئ مع ظلال أوراق نباتية طبيعية لتقديم خط الهاند كريم بشكل احترافي.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={TRIO_HERO_ASSET.downloadHref}
                download={TRIO_HERO_ASSET.downloadFilename}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#F8F5EE] bg-[#202823] rounded-lg hover:bg-[#2C3730] transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-[#D2B77E]" />
                تحميل اللقطة الجماعية
              </a>
              <button
                type="button"
                onClick={() => setLightboxAsset(TRIO_HERO_ASSET)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#1B241E] bg-[#F5F2EB] border border-[#E2DACB] rounded-lg hover:bg-[#ECE6D8] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                تكبير الصورة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* High-Resolution Lightbox Modal */}
      {lightboxAsset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`معاينة ${lightboxAsset.titleArabic}`}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 md:p-8"
          onClick={() => setLightboxAsset(null)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full overflow-hidden border border-[#E5DFD2]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EFECE4]">
              <div>
                <h3 className="text-base font-bold text-[#1B241E]">
                  {lightboxAsset.titleArabic}
                </h3>
                <p className="text-xs text-[#6B756E]">{lightboxAsset.subtitleArabic}</p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxAsset(null)}
                aria-label="إغلاق المعاينة"
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#1B241E] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#F5F2EB] flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={lightboxAsset.studioSrc}
                alt={lightboxAsset.titleArabic}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="px-5 py-4 flex items-center justify-between bg-white border-t border-[#EFECE4]">
              <span className="text-xs text-[#6B756E]">
                ملف استوديو عالي الجودة · جاهز للنشر والطباعة
              </span>
              <a
                href={lightboxAsset.downloadHref}
                download={lightboxAsset.downloadFilename}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#F8F5EE] bg-[#202823] rounded-lg hover:bg-[#2C3730] transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-[#D2B77E]" />
                تحميل JPG
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
