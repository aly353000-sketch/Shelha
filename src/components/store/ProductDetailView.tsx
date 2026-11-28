import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Truck,
  Sparkles,
} from 'lucide-react';
import type { StoreProduct, StoreSettings } from '../../types/store';
import {
  buildWhatsAppUrl,
  CATEGORY_LABELS,
  formatEgp,
  getEffectiveUnitPrice,
} from '../../utils/storefrontLogic';
import type { ActiveRoute } from './StoreHeader';

interface ProductDetailViewProps {
  product: StoreProduct;
  allProducts: StoreProduct[];
  settings: StoreSettings;
  onNavigate: (next: ActiveRoute) => void;
  onAddToCart: (product: StoreProduct, variantLabel?: string, qty?: number) => void;
  onBuyNow: (product: StoreProduct, variantLabel?: string, qty?: number) => void;
}

export function ProductDetailView({
  product,
  allProducts,
  settings,
  onNavigate,
  onAddToCart,
  onBuyNow,
}: ProductDetailViewProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    product.variants[0]?.label
  );
  const [activeImage, setActiveImage] = useState<string>(
    product.variants[0]?.image || product.images[0]
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  useEffect(() => {
    setSelectedVariant(product.variants[0]?.label);
    setActiveImage(product.variants[0]?.image || product.images[0]);
    setQuantity(1);
    setJustAdded(false);
  }, [product]);

  const effectivePrice = getEffectiveUnitPrice(product, settings);
  const savings = Math.max(0, product.originalPrice - effectivePrice);

  const galleryImages = useMemo(() => {
    const set = new Set<string>(product.images);
    product.variants.forEach((v) => set.add(v.image));
    return Array.from(set);
  }, [product]);

  const relatedProducts = useMemo(
    () =>
      allProducts
        .filter((p) => p.category === product.category && p.id !== product.id)
        .slice(0, 3),
    [allProducts, product]
  );

  const handleVariantPick = (label: string, image: string) => {
    setSelectedVariant(label);
    setActiveImage(image);
  };

  const handleAdd = () => {
    onAddToCart(product, selectedVariant, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <section className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Back Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs sm:text-sm text-[#4F5E55]">
          <button
            type="button"
            onClick={() => onNavigate({ page: 'products', category: product.category })}
            className="inline-flex items-center gap-1.5 font-semibold text-[#182B22] hover:text-[#785E32] transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            العودة إلى {CATEGORY_LABELS[product.category].arabic}
          </button>
          <span aria-hidden="true">/</span>
          <span className="truncate text-[#5E6D64]">{product.name}</span>
        </div>

        {/* Contiguous 2-Column Purchase Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Gallery Side (images untouched) */}
          <div className="lg:col-span-5 bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-4 sm:p-5">
            <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#E7EAEE]">
              <img
                src={activeImage}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>

            {galleryImages.length > 1 && (
              <div className="mt-3.5 grid grid-cols-3 gap-2.5">
                {galleryImages.map((imgSrc, idx) => {
                  const matchedVariant = product.variants.find((v) => v.image === imgSrc);
                  const isActive = activeImage === imgSrc;
                  return (
                    <button
                      key={imgSrc}
                      type="button"
                      onClick={() => {
                        setActiveImage(imgSrc);
                        if (matchedVariant) setSelectedVariant(matchedVariant.label);
                      }}
                      className={`rounded-xl overflow-hidden bg-[#E7EAEE] aspect-[3/4] border-2 transition-all cursor-pointer ${
                        isActive ? 'border-[#182B22]' : 'border-transparent hover:border-[#C9A968]'
                      }`}
                    >
                      <img
                        src={imgSrc}
                        alt={matchedVariant ? `${product.name} — ${matchedVariant.label}` : `${product.name} ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Purchase Module + Details Side */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-6 sm:p-8">
              <div className="text-xs text-[#5E6D64] flex flex-wrap items-center gap-2">
                <span>{CATEGORY_LABELS[product.category].arabic}</span>
                <span aria-hidden="true">·</span>
                <span>الحجم: {product.volume}</span>
                <span aria-hidden="true">·</span>
                <span className={product.inStock ? 'text-[#1C5536] font-semibold' : 'text-[#9B3E33] font-semibold'}>
                  {product.inStock ? 'متوفر للطلب' : 'غير متوفر حالياً'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#16221B] mt-2">
                {product.name}
              </h1>

              {/* Pricing Block */}
              <div className="mt-5 pb-5 border-b border-[#E8DEC9] flex flex-wrap items-baseline gap-3 tabular-nums">
                <span
                  data-testid="pdp-final-price"
                  className="text-3xl font-bold text-[#182B22]"
                >
                  {formatEgp(effectivePrice)} ج.م
                </span>

                {settings.openingDiscountEnabled && savings > 0 && (
                  <>
                    <span className="text-lg text-[#8C8173] line-through">
                      {formatEgp(product.originalPrice)} ج.م
                    </span>
                    <span className="text-xs font-semibold text-[#785E32]">
                      وفّري {formatEgp(savings)} ج.م (خصم الافتتاح {settings.openingDiscountPercent}%)
                    </span>
                  </>
                )}
              </div>

              {/* Variant Selector */}
              {product.variants.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-[#45554C] mb-2.5">
                    اختاري الشكل / الرائحة: <strong className="text-[#16221B]">{selectedVariant}</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                      const isSelected = selectedVariant === variant.label;
                      return (
                        <button
                          key={variant.label}
                          type="button"
                          onClick={() => handleVariantPick(variant.label, variant.image)}
                          className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#182B22] text-[#FBF7F0] border-[#182B22]'
                              : 'bg-[#F3ECE0] text-[#45554C] border-[#D4C5AA] hover:border-[#182B22]'
                          }`}
                        >
                          {variant.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity + Buy CTAs */}
              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="inline-flex items-center justify-between sm:justify-center border border-[#D4C5AA] bg-[#F3ECE0] rounded-xl px-2 py-1.5">
                  <button
                    type="button"
                    aria-label="زيادة الكمية"
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    className="p-2 text-[#16221B] hover:bg-[#E5D9C3] rounded-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span
                    data-testid="pdp-qty"
                    className="w-10 text-center text-sm font-bold text-[#16221B] tabular-nums"
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="تقليل الكمية"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 text-[#16221B] hover:bg-[#E5D9C3] rounded-lg cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={() => onBuyNow(product, selectedVariant, quantity)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-[#FBF7F0] bg-[#182B22] hover:bg-[#223B2F] disabled:bg-[#C9CFCB] disabled:text-[#5F6C64] rounded-xl transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#E4C78A]" />
                  اطلبي الآن
                </button>

                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={handleAdd}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-[#16221B] bg-[#EFE5D3] hover:bg-[#E5D9C3] border border-[#D8CBB4] disabled:opacity-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4 text-[#1C5536]" />
                      تمت الإضافة للسلة
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-[#785E32]" />
                      أضيفي للسلة
                    </>
                  )}
                </button>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E8DEC9] flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5 text-xs text-[#4D5C53]">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#785E32]" />
                    التوصيل لأي مكان · شحن مجاني عند طلب {settings.freeShippingMinItems} منتجات أو أكثر
                  </span>
                  <span>الدفع عند الاستلام</span>
                </div>

                <a
                  data-testid="pdp-whatsapp-inquiry"
                  href={buildWhatsAppUrl(
                    settings.whatsappNumber,
                    `مرحباً أوراجلو Auraglow 🌿 حابة أستفسر أو أطلب "${product.name}"${selectedVariant ? ` (${selectedVariant})` : ''} — ${product.volume}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-[#182B22] hover:text-[#A85426] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#1C5536]" />
                  استفسار أو طلب عبر واتساب
                </a>
              </div>
            </div>

            {/* Product Details: Description, Usage, Ingredients */}
            <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#16221B]">عن المنتج والاستخدام</h2>
                <p className="text-sm text-[#4A574F] mt-2 leading-relaxed">{product.description}</p>
              </div>

              <div className="pt-5 border-t border-[#E8DEC9]">
                <h2 className="text-base font-bold text-[#16221B]">طريقة الاستخدام</h2>
                <p className="text-sm text-[#4A574F] mt-2 leading-relaxed">{product.usage}</p>
              </div>

              <div className="pt-5 border-t border-[#E8DEC9]">
                <h2 className="text-base font-bold text-[#16221B]">المكونات الرئيسية</h2>
                <p
                  dir="ltr"
                  className="text-sm text-[#4A574F] mt-2 leading-relaxed text-right"
                >
                  {product.ingredients.join(' · ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-14 pt-10 border-t border-[#DFD2BC]">
            <h2 className="text-xl font-bold text-[#16221B] mb-6">منتجات أخرى قد تناسب روتينك</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {relatedProducts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate({ page: 'product', productId: item.id })}
                  className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-2xl overflow-hidden text-right hover:-translate-y-0.5 transition-transform cursor-pointer"
                >
                  <div className="aspect-[3/4] bg-[#E7EAEE]">
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-[#5E6D64]">{item.volume}</div>
                    <div className="text-sm font-bold text-[#16221B] mt-0.5 truncate">
                      {item.name}
                    </div>
                    <div className="text-sm font-bold text-[#182B22] mt-2 tabular-nums">
                      {formatEgp(getEffectiveUnitPrice(item, settings))} ج.م
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
