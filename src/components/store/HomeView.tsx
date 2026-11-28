import React, { useMemo } from 'react';
import { ArrowLeft, ShoppingBag, Truck, ShieldCheck, Leaf, Sparkles } from 'lucide-react';
import type { ProductCategory, StoreProduct, StoreSettings } from '../../types/store';
import {
  CATEGORY_LABELS,
  formatEgp,
  getEffectiveUnitPrice,
} from '../../utils/storefrontLogic';
import type { ActiveRoute } from './StoreHeader';

interface HomeViewProps {
  products: StoreProduct[];
  settings: StoreSettings;
  onNavigate: (next: ActiveRoute) => void;
  onAddToCart: (product: StoreProduct, variantLabel?: string) => void;
}

const CATEGORY_PREVIEW_IMAGES: Record<ProductCategory, string> = {
  hair: '/assets/auraglow/studio/01_shampoo_hair_loss.jpg',
  skin: '/assets/auraglow/studio/14_brightening_serum.jpg',
  body: '/assets/auraglow/studio/16_shower_gel_strawberry.jpg',
};

export function HomeView({ products, settings, onNavigate, onAddToCart }: HomeViewProps) {
  const heroProducts = useMemo(() => {
    const preferredIds = [
      'brightening-serum',
      'cleanser-normal-dry',
      'hair-loss-shampoo',
      'hand-cream',
    ];
    const picked = preferredIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is StoreProduct => Boolean(p));
    return picked.length >= 4 ? picked : products.slice(0, 4);
  }, [products]);

  const featuredProducts = useMemo(() => {
    const flagged = products.filter((p) => p.featured);
    return (flagged.length >= 4 ? flagged : products).slice(0, 6);
  }, [products]);

  const categoryCounts = useMemo(() => {
    return {
      hair: products.filter((p) => p.category === 'hair').length,
      skin: products.filter((p) => p.category === 'skin').length,
      body: products.filter((p) => p.category === 'body').length,
    };
  }, [products]);

  return (
    <div>
      {/* 1. Boutique Hero Section */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-stretch">
            {/* Editorial Welcome Card */}
            <div className="lg:col-span-6 bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-6 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-6">
                  <img
                    src="/assets/auraglow/auraglow-logo.png"
                    alt="شعار أوراجلو Auraglow"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-full object-contain border border-[#D4C5AA] bg-white shrink-0"
                  />
                  <div>
                    <p
                      className="text-xs tracking-[0.18em] text-[#785E32] font-semibold"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      AURAGLOW NATURAL CARE
                    </p>
                    <p className="text-sm font-bold text-[#16221B] mt-0.5">
                      أوراجلو للعناية بالبشرة والشعر
                    </p>
                  </div>
                </div>

                <h1
                  className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#16221B] leading-[1.25]"
                  style={{ textWrap: 'balance' }}
                >
                  روتينك اليومي الهادئ لإشراقة بشرتك وجمال شعرك
                </h1>

                <p className="text-sm sm:text-base text-[#4A574F] mt-4 leading-relaxed max-w-xl">
                  منتجات عناية يومية بتركيبات لطيفة غنية بالزيوت والزبد والمستخلصات الطبيعية،
                  مختارة بعناية لتناسب البنات والسيدات في مصر — اطلبي بسهولة في خطوات بسيطة والدفع
                  عند الاستلام.
                </p>

                {settings.openingDiscountEnabled && (
                  <div className="mt-6 rounded-2xl bg-[#EFE5D3] border border-[#DACAA9] px-4 py-3.5 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="font-bold text-[#182B22]">
                      عرض الافتتاح متاح الآن: خصم {settings.openingDiscountPercent}% على كل المنتجات
                    </span>
                    <span className="text-[#785E32] font-semibold">
                      شحن مجاني لـ {settings.freeShippingMinItems} منتجات فأكثر
                    </span>
                  </div>
                )}

                <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate({ page: 'products', category: 'all' })}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-[#FBF7F0] bg-[#182B22] hover:bg-[#223B2F] rounded-2xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    تصفحي كل المنتجات ({products.length})
                    <ArrowLeft className="w-4 h-4 text-[#E4C78A]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate({ page: 'about' })}
                    className="inline-flex items-center justify-center px-5 py-3.5 text-sm font-semibold text-[#16221B] bg-[#EFE6D5] hover:bg-[#E5D9C3] border border-[#D8CBB4] rounded-2xl transition-colors cursor-pointer whitespace-nowrap"
                  >
                    تعرّفي على أوراجلو
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-[#E6DAC5] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#55645B]">
                <span>التوصيل لجميع محافظات مصر</span>
                <span aria-hidden="true">·</span>
                <span>الدفع عند الاستلام</span>
                <span aria-hidden="true">·</span>
                <span>شحن مجاني لـ {settings.freeShippingMinItems} منتجات فأكثر</span>
              </div>
            </div>

            {/* 2x2 Curated Studio Packshot Showcase (images untouched) */}
            <div className="lg:col-span-6 bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-3.5 grid grid-cols-2 gap-3.5">
              {heroProducts.map((product) => {
                const effectivePrice = getEffectiveUnitPrice(product, settings);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => onNavigate({ page: 'product', productId: product.id })}
                    className="group relative rounded-2xl overflow-hidden bg-[#E7EAEE] aspect-[3/4] text-right cursor-pointer"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#16221B]/85 via-[#16221B]/45 to-transparent px-3.5 py-3">
                      <span className="block text-xs sm:text-sm font-bold text-white truncate">
                        {product.name}
                      </span>
                      <span className="block text-xs text-[#E8CE96] font-semibold mt-0.5 tabular-nums">
                        {formatEgp(effectivePrice)} ج.م
                        {settings.openingDiscountEnabled &&
                          product.discountedPrice < product.originalPrice && (
                            <span className="mr-2 text-[11px] text-white/70 line-through">
                              {formatEgp(product.originalPrice)} ج.م
                            </span>
                          )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop by Category (Hair / Skin / Body & Hands) */}
      <section className="py-10 sm:py-14 border-t border-[#DFD2BC] bg-[#F8F2E7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-[#785E32]">أقسام أوراجلو</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#16221B] mt-1">
                اختاري حسب احتياج روتينك
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ page: 'products', category: 'all' })}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#182B22] hover:text-[#785E32] transition-colors cursor-pointer self-start sm:self-auto"
            >
              عرض جميع الأقسام
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['hair', 'skin', 'body'] as ProductCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onNavigate({ page: 'products', category: cat })}
                className="group text-right bg-[#F3ECE0] hover:bg-[#ECE2D0] border border-[#DDD0BA] rounded-3xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col"
              >
                <div className="aspect-[4/3] w-full bg-[#E7EAEE] overflow-hidden">
                  <img
                    src={CATEGORY_PREVIEW_IMAGES[cat]}
                    alt={CATEGORY_LABELS[cat].arabic}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-[#5E6D64]">
                      <span>{CATEGORY_LABELS[cat].english}</span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span className="tabular-nums">{categoryCounts[cat]} منتجات</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#16221B] mt-1">
                      {CATEGORY_LABELS[cat].arabic}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#4D5C53] mt-2 leading-relaxed">
                      {CATEGORY_LABELS[cat].blurb}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#182B22] mt-4">
                    تصفحي القسم
                    <ArrowLeft className="w-3.5 h-3.5 text-[#8A6A35]" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Collection Grid */}
      <section className="py-12 sm:py-16 border-t border-[#DFD2BC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-[#785E32]">الأكثر طلباً في أوراجلو</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#16221B] mt-1">
                منتجات مختارة لبداية روتينك
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate({ page: 'products', category: 'all' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-[#16221B] bg-[#FBF7F0] border border-[#D8CBB4] hover:bg-[#ECE2D0] rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
            >
              كل المنتجات ({products.length})
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {featuredProducts.map((product) => {
              const effectivePrice = getEffectiveUnitPrice(product, settings);
              return (
                <article
                  key={product.id}
                  className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <button
                    type="button"
                    onClick={() => onNavigate({ page: 'product', productId: product.id })}
                    className="block w-full aspect-[3/4] bg-[#E7EAEE] overflow-hidden cursor-pointer"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain transition-transform duration-300 hover:scale-[1.03]"
                    />
                  </button>

                  <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] sm:text-xs text-[#5E6D64] truncate">
                        <span>{CATEGORY_LABELS[product.category].arabic}</span>
                        <span className="mx-1.5" aria-hidden="true">
                          ·
                        </span>
                        <span>{product.volume}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate({ page: 'product', productId: product.id })}
                        className="block text-right mt-1 text-sm sm:text-base font-bold text-[#16221B] hover:text-[#785E32] transition-colors cursor-pointer line-clamp-2"
                      >
                        {product.name}
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E8DEC9] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="tabular-nums">
                        <span className="text-base sm:text-lg font-bold text-[#182B22]">
                          {formatEgp(effectivePrice)} ج.م
                        </span>
                        {settings.openingDiscountEnabled &&
                          product.discountedPrice < product.originalPrice && (
                            <span className="block sm:inline sm:mr-2 text-xs text-[#8C8173] line-through">
                              {formatEgp(product.originalPrice)} ج.م
                            </span>
                          )}
                      </div>

                      <button
                        type="button"
                        disabled={!product.inStock}
                        onClick={() => onAddToCart(product, product.variants[0]?.label)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#FBF7F0] bg-[#182B22] hover:bg-[#223B2F] disabled:bg-[#C9CFCB] disabled:text-[#5F6C64] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#E4C78A]" />
                        {product.inStock ? 'أضيفي للسلة' : 'غير متوفر'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Coming Soon Teaser Section (Editable & Toggleable from Admin) */}
      {settings.teaserEnabled && (
        <section
          data-testid="home-teaser-section"
          className="py-10 sm:py-14 border-t border-[#DFD2BC] bg-[#EDE3D2]"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="relative overflow-hidden bg-[#FBF7F0] border border-[#D6C3A3] rounded-3xl px-6 py-10 sm:px-12 sm:py-12 text-center">
              <div
                aria-hidden="true"
                className="mx-auto mb-4 h-1 w-14 rounded-full bg-[#A85426]/75"
              />
              <p className="text-xs font-semibold tracking-wide text-[#A85426]">
                مفاجآت أوراجلو القادمة
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#16221B] mt-2">
                {settings.teaserTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#4A574F] mt-3 max-w-2xl mx-auto leading-relaxed">
                {settings.teaserSubtitle}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'products', category: 'all' })}
                  className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-[#FBF7F0] bg-[#182B22] hover:bg-[#223B2F] rounded-2xl transition-colors cursor-pointer"
                >
                  تصفحي التشكيلة الحالية
                  <ArrowLeft className="w-4 h-4 text-[#E4C78A]" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate({ page: 'about' })}
                  className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-[#16221B] bg-[#EFE6D5] hover:bg-[#E5D9C3] border border-[#D8CBB4] rounded-2xl transition-colors cursor-pointer"
                >
                  تابعينا على صفحاتنا
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Quiet Trust & Delivery Strip */}
      <section className="py-10 border-t border-[#DFD2BC] bg-[#F8F2E7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-[#785E32] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#16221B]">توصيل لأي مكان في مصر</h3>
              <p className="text-xs text-[#55645B] mt-1 leading-relaxed">
                شحن سريع لجميع المحافظات حتى باب البيت.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#785E32] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#16221B]">
                شحن مجاني لـ {settings.freeShippingMinItems} منتجات فأكثر
              </h3>
              <p className="text-xs text-[#55645B] mt-1 leading-relaxed">
                اجمعي روتينك الكامل واستمتعي بتوصيل مجاني تماماً.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#785E32] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#16221B]">الدفع عند الاستلام</h3>
              <p className="text-xs text-[#55645B] mt-1 leading-relaxed">
                اطلبي بكل اطمئنان وادفعي عند استلام طلبك.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Leaf className="w-5 h-5 text-[#785E32] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#16221B]">مكونات مختارة بعناية</h3>
              <p className="text-xs text-[#55645B] mt-1 leading-relaxed">
                تركيبات لطيفة غنية بالزيوت والزبد والمستخلصات الطبيعية.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
