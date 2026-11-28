import React, { useMemo, useState } from 'react';
import JSZip from 'jszip';
import {
  Archive,
  Check,
  Copy,
  Download,
  Eye,
  Layers,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { AURAGLOW_PRODUCTS_CATALOG } from '../data/auraglowCatalog';
import {
  AuraglowProduct,
  buildWhatsAppCaption,
  filterAuraglowProducts,
  getCategorySummaries,
  ProductCategory,
} from '../utils/catalogHelpers';
import { SocialPostBuilderModal } from './SocialPostBuilderModal';

type CardPreviewMode = 'studio' | 'original' | 'sticker';

export const AuraglowCatalogGallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [globalCompareOriginal, setGlobalCompareOriginal] = useState<boolean>(false);
  const [cardModeMap, setCardModeMap] = useState<Record<string, CardPreviewMode>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeModalProduct, setActiveModalProduct] = useState<AuraglowProduct | null>(null);
  const [zipProgress, setZipProgress] = useState<string | null>(null);

  const categorySummaries = useMemo(
    () => getCategorySummaries(AURAGLOW_PRODUCTS_CATALOG),
    []
  );

  const filteredProducts = useMemo(
    () => filterAuraglowProducts(AURAGLOW_PRODUCTS_CATALOG, selectedCategory, searchQuery),
    [selectedCategory, searchQuery]
  );

  const getEffectiveCardMode = (product: AuraglowProduct): CardPreviewMode => {
    const explicit = cardModeMap[product.id];
    if (explicit) return explicit;
    if (globalCompareOriginal && product.originalPhotoPath) return 'original';
    return 'studio';
  };

  const setCardMode = (productId: string, mode: CardPreviewMode) => {
    setCardModeMap((prev) => ({ ...prev, [productId]: mode }));
  };

  const handleToggleGlobalCompare = () => {
    setCardModeMap({});
    setGlobalCompareOriginal((prev) => !prev);
  };

  const handleCopyWhatsApp = async (product: AuraglowProduct) => {
    const caption = buildWhatsAppCaption(product);
    try {
      await navigator.clipboard.writeText(caption);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = caption;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopiedId(product.id);
    setTimeout(() => {
      setCopiedId((current) => (current === product.id ? null : current));
    }, 2000);
  };

  const handleDownloadZip = async (productsToPack: AuraglowProduct[], label: string) => {
    if (zipProgress || productsToPack.length === 0) return;
    setZipProgress(`جاري تجهيز ${productsToPack.length} صورة...`);
    try {
      const zip = new JSZip();
      const folder = zip.folder('auraglow-studio-photos');
      if (!folder) return;

      for (let i = 0; i < productsToPack.length; i++) {
        const p = productsToPack[i];
        setZipProgress(`تجهيز ${i + 1} / ${productsToPack.length}...`);
        const res = await fetch(p.studioImagePath);
        if (!res.ok) continue;
        const blob = await res.blob();
        folder.file(p.downloadFilename, blob);
      }

      // Also include a ready-to-paste WhatsApp captions text file for all packed products
      const captionsText = productsToPack
        .map((p, idx) => `===== ${idx + 1}. ${p.nameArabic} =====\n${buildWhatsAppCaption(p)}`)
        .join('\n\n\n');
      folder.file('whatsapp-captions-arabic.txt', captionsText);

      setZipProgress('جاري ضغط الملف...');
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `auraglow-studio-${label}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 6000);
    } finally {
      setZipProgress(null);
    }
  };

  return (
    <section
      id="catalog-gallery"
      aria-labelledby="catalog-gallery-heading"
      className="py-14 md:py-18 border-t border-[#E4DEC9]"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-9">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#7B6538] tracking-wide mb-2">
              01. المعرض الكامل لمنتجات أوراجلو · 24 صورة استوديو بالاستيكر المطابق
            </p>
            <h2
              id="catalog-gallery-heading"
              className="text-2xl md:text-4xl font-bold text-[#1B241E] leading-tight"
              style={{ textWrap: 'balance' }}
            >
              صور استوديو نهائية جاهزة لرسائل واتساب وصفحات السوشيال ميديا
            </h2>
            <p className="text-sm md:text-base text-[#556159] mt-3 leading-relaxed">
              تم إزالة اليد والأرضية بالكامل وتوحيد الإضاءة والخلفية المحايدة النظيفة لجميع
              المنتجات مع مطابقة ألوان العبوة والغطاء ولصق الاستيكر الرسمي بكامل نصوصه الواضحة
              بدقة طباعة 1800×2400؛ يمكنك مقارنة كل منتج بالأصل وتحميله أو تصميم كارت بوست بالسعر.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleToggleGlobalCompare}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-medium text-[#1B241E] bg-white border border-[#D8D0BE] rounded-lg hover:bg-[#F3EFE4] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#8A703C]" />
              {globalCompareOriginal ? 'العودة لصور الاستوديو' : 'مقارنة بالصور الأصلية'}
            </button>

            <button
              type="button"
              disabled={Boolean(zipProgress)}
              onClick={() =>
                handleDownloadZip(
                  filteredProducts,
                  selectedCategory === 'all' ? 'all-24-products' : selectedCategory
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-semibold text-[#F8F5EE] bg-[#202823] rounded-lg hover:bg-[#2C3730] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Archive className="w-4 h-4 text-[#D2B77E]" />
              {zipProgress
                ? zipProgress
                : `تحميل المعروض (${filteredProducts.length}) في ملف ZIP`}
            </button>
          </div>
        </div>

        {/* Category Filter Bar + Live Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#E5DFD2]">
          <div
            role="tablist"
            aria-label="تصفية المنتجات حسب القسم"
            className="flex flex-wrap items-center gap-1.5 p-1 bg-[#EDE7DC] rounded-lg"
          >
            {categorySummaries.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1B241E] shadow-xs font-semibold'
                      : 'text-[#4D5A52] hover:text-[#1B241E]'
                  }`}
                >
                  {cat.labelArabic} ({cat.count})
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <Search
              className="w-4 h-4 text-[#758078] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المنتج أو المادة الفعالة..."
              aria-label="البحث في منتجات أوراجلو"
              className="w-full pr-10 pl-4 py-2.5 text-sm text-[#1B241E] bg-white border border-[#DDD5C6] rounded-lg placeholder:text-[#869089] focus:outline-none focus:border-[#202823]"
            />
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#E5DFD2] rounded-xl p-12 text-center">
            <p className="text-base font-semibold text-[#1B241E]">
              لا توجد منتجات مطابقة لبحثك "{searchQuery}"
            </p>
            <p className="text-sm text-[#647068] mt-1.5">
              جرّب البحث باسم مختلف مثل "شامبو"، "سيروم"، "شاور جل"، أو "بادي باتر".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-5 px-4 py-2 text-xs font-semibold text-[#F8F5EE] bg-[#202823] rounded-lg hover:bg-[#2C3730] transition-colors cursor-pointer"
            >
              عرض جميع المنتجات (24)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product) => {
              const mode = getEffectiveCardMode(product);
              const displayTitle = product.variantLabel
                ? `${product.nameArabic} (${product.variantLabel})`
                : product.nameArabic;

              const activeImgSrc =
                mode === 'original' && product.originalPhotoPath
                  ? product.originalPhotoPath
                  : mode === 'sticker'
                  ? product.stickerImagePath
                  : product.studioImagePath;

              const activeAlt =
                mode === 'original'
                  ? `${displayTitle} — الصورة الأصلية قبل التعديل`
                  : mode === 'sticker'
                  ? `${displayTitle} — الاستيكر الرسمي المطابق`
                  : `${displayTitle} — تصوير استوديو نهائي بالاستيكر`;

              return (
                <article
                  key={product.id}
                  className="bg-white border border-[#E5DFD2] rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                >
                  {/* Visual Anchor (3:4 studio product shot) */}
                  <div className="relative aspect-[3/4] bg-[#ECE6DA] overflow-hidden">
                    <img
                      src={activeImgSrc}
                      alt={activeAlt}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className={`w-full h-full ${
                        mode === 'sticker'
                          ? 'object-contain p-5 bg-[#FAF8F4]'
                          : 'object-cover'
                      }`}
                    />

                    {/* Top-left Quick Inspect Button */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveModalProduct(product)}
                        aria-label={`معاينة وتصميم بوست ${displayTitle}`}
                        title="معاينة وتصميم بوست سوشيال"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/92 text-[#1B241E] border border-[#E2DACB] hover:bg-white transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bottom View Switcher Bar inside Image Frame */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-center">
                      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-white/92 backdrop-blur-xs border border-[#E2DACB]">
                        <button
                          type="button"
                          onClick={() => setCardMode(product.id, 'studio')}
                          className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            mode === 'studio'
                              ? 'bg-[#202823] text-[#F8F5EE]'
                              : 'text-[#4D5A52] hover:text-[#1B241E]'
                          }`}
                        >
                          الاستوديو
                        </button>
                        {product.originalPhotoPath && (
                          <button
                            type="button"
                            onClick={() => setCardMode(product.id, 'original')}
                            className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                              mode === 'original'
                                ? 'bg-[#202823] text-[#F8F5EE]'
                                : 'text-[#4D5A52] hover:text-[#1B241E]'
                            }`}
                          >
                            قبل (الأصلية)
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setCardMode(product.id, 'sticker')}
                          className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                            mode === 'sticker'
                              ? 'bg-[#202823] text-[#F8F5EE]'
                              : 'text-[#4D5A52] hover:text-[#1B241E]'
                          }`}
                        >
                          الاستيكر
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Details (Unboxed Metadata + Clean Hierarchy) */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#6B756E] mb-1.5 tabular-nums">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: product.accentHex }}
                          aria-hidden="true"
                        />
                        <span>{product.categoryArabic}</span>
                        <span aria-hidden="true">·</span>
                        <span>{product.volumeArabic}</span>
                        <span aria-hidden="true">·</span>
                        <span>#{String(product.order).padStart(2, '0')}</span>
                      </div>

                      <h3 className="text-base font-bold text-[#1B241E] leading-snug">
                        {displayTitle}
                      </h3>
                      <p className="text-xs font-medium text-[#7B6538] mt-0.5">
                        {product.nameEnglish}
                      </p>
                      <p className="text-xs text-[#556159] mt-2 leading-relaxed line-clamp-2">
                        {product.taglineArabic}
                      </p>
                    </div>

                    {/* Action Row */}
                    <div className="pt-3.5 border-t border-[#EFECE4] flex flex-wrap items-center gap-2">
                      <a
                        href={product.studioImagePath}
                        download={product.downloadFilename}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#F8F5EE] bg-[#202823] rounded-lg hover:bg-[#2C3730] transition-colors whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5 text-[#D2B77E]" />
                        تحميل JPG
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyWhatsApp(product)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-[#1B241E] bg-[#F5F2EB] border border-[#E2DACB] rounded-lg hover:bg-[#ECE6D8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {copiedId === product.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#2A6F4E]" />
                            تم النسخ
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            نص واتساب
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveModalProduct(product)}
                        aria-label={`تصميم بوست سوشيال لـ ${displayTitle}`}
                        title="تصميم كارت بوست بالسعر"
                        className="inline-flex items-center justify-center w-10 h-10 text-[#1B241E] bg-[#F5F2EB] border border-[#E2DACB] rounded-lg hover:bg-[#ECE6D8] transition-colors shrink-0 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Social Post Card Builder & Lightbox Modal */}
      <SocialPostBuilderModal
        product={activeModalProduct}
        onClose={() => setActiveModalProduct(null)}
      />
    </section>
  );
};
