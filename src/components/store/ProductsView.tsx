import React, { useMemo, useState } from 'react';
import { Search, ShoppingBag, X } from 'lucide-react';
import type { ProductCategory, StoreProduct, StoreSettings } from '../../types/store';
import {
  CATEGORY_LABELS,
  filterStoreProducts,
  formatEgp,
  getEffectiveUnitPrice,
} from '../../utils/storefrontLogic';
import type { ActiveRoute } from './StoreHeader';

interface ProductsViewProps {
  products: StoreProduct[];
  settings: StoreSettings;
  initialCategory?: 'all' | ProductCategory;
  onNavigate: (next: ActiveRoute) => void;
  onAddToCart: (product: StoreProduct, variantLabel?: string) => void;
}

export function ProductsView({
  products,
  settings,
  initialCategory = 'all',
  onNavigate,
  onAddToCart,
}: ProductsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProductCategory>(
    initialCategory
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  React.useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const filteredProducts = useMemo(
    () => filterStoreProducts(products, selectedCategory, searchQuery),
    [products, selectedCategory, searchQuery]
  );

  const counts = useMemo(
    () => ({
      all: products.length,
      hair: products.filter((p) => p.category === 'hair').length,
      skin: products.filter((p) => p.category === 'skin').length,
      body: products.filter((p) => p.category === 'body').length,
    }),
    [products]
  );

  return (
    <section className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-7">
          <p className="text-xs font-semibold text-[#785E32]">متجر أوراجلو الكامل</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#16221B] mt-1">
            جميع منتجات العناية بالشعر والبشرة والجسم
          </h1>
          <p className="text-sm text-[#4D5C53] mt-2">
            {settings.openingDiscountEnabled
              ? `الأسعار شاملة خصم الافتتاح ${settings.openingDiscountPercent}% · الشحن مجاني عند طلب ${settings.freeShippingMinItems} منتجات أو أكثر.`
              : `التوصيل لأي مكان في مصر · الشحن مجاني عند طلب ${settings.freeShippingMinItems} منتجات أو أكثر.`}
          </p>
        </div>

        {/* Category Tabs + Search Bar */}
        <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-2xl p-4 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="تصفية المنتجات حسب القسم"
            className="flex flex-wrap items-center gap-1.5"
          >
            {(
              [
                { id: 'all', label: `الكل (${counts.all})` },
                { id: 'hair', label: `الشعر (${counts.hair})` },
                { id: 'skin', label: `البشرة (${counts.skin})` },
                { id: 'body', label: `الجسم واليدين (${counts.body})` },
              ] as const
            ).map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#182B22] text-[#FBF7F0]'
                      : 'bg-[#EFE6D5] text-[#415047] hover:bg-[#E5D9C3] hover:text-[#16221B]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-[#6E7C74] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="ابحثي عن منتج أو مكون"
              placeholder="ابحثي باسم المنتج أو المكون..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-9 py-2.5 text-sm bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl text-[#16221B] placeholder:text-[#78857D] focus:outline-none focus:border-[#182B22]"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="مسح البحث"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-[#637168] hover:text-[#16221B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-12 text-center">
            <p className="text-base font-bold text-[#16221B]">لم نجد منتجات مطابقة لبحثك</p>
            <p className="text-sm text-[#55645B] mt-1.5">
              جرّبي كلمة بحث أخرى أو استعرضي جميع أقسام أوراجلو.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-5 px-5 py-2.5 text-sm font-semibold text-[#FBF7F0] bg-[#182B22] rounded-xl cursor-pointer"
            >
              عرض جميع المنتجات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              const activeVariantLabel =
                selectedVariants[product.id] ?? product.variants[0]?.label;
              const activeVariantObj = product.variants.find(
                (v) => v.label === activeVariantLabel
              );
              const displayImg = activeVariantObj?.image || product.images[0];
              const effectivePrice = getEffectiveUnitPrice(product, settings);

              return (
                <article
                  key={product.id}
                  data-testid={`product-card-${product.id}`}
                  className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <button
                    type="button"
                    onClick={() => onNavigate({ page: 'product', productId: product.id })}
                    className="relative block w-full aspect-[3/4] bg-[#E7EAEE] overflow-hidden cursor-pointer"
                  >
                    <img
                      src={displayImg}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain transition-transform duration-300 hover:scale-[1.03]"
                    />
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-[#16221B]/45 flex items-center justify-center">
                        <span className="bg-white/95 text-[#16221B] text-xs font-bold px-3.5 py-1.5 rounded-lg">
                          غير متوفر حالياً
                        </span>
                      </div>
                    )}
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
                        className="block text-right mt-1 text-sm sm:text-base font-bold text-[#16221B] hover:text-[#785E32] transition-colors cursor-pointer"
                      >
                        {product.name}
                      </button>

                      {/* Interactive Variant Picker when multi-variant */}
                      {product.variants.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {product.variants.map((variant) => {
                            const isPicked = activeVariantLabel === variant.label;
                            return (
                              <button
                                key={variant.label}
                                type="button"
                                onClick={() =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [product.id]: variant.label,
                                  }))
                                }
                                className={`px-2 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer ${
                                  isPicked
                                    ? 'bg-[#182B22] text-[#FBF7F0] border-[#182B22]'
                                    : 'bg-[#F3ECE0] text-[#46564C] border-[#D4C5AA] hover:border-[#182B22]'
                                }`}
                              >
                                {variant.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E8DEC9] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="tabular-nums">
                        <span
                          data-testid={`card-price-final-${product.id}`}
                          className="text-base sm:text-lg font-bold text-[#182B22]"
                        >
                          {formatEgp(effectivePrice)} ج.م
                        </span>
                        {settings.openingDiscountEnabled &&
                          product.discountedPrice < product.originalPrice && (
                            <span
                              data-testid={`card-price-original-${product.id}`}
                              className="block sm:inline sm:mr-2 text-xs text-[#8C8173] line-through"
                            >
                              {formatEgp(product.originalPrice)} ج.م
                            </span>
                          )}
                      </div>

                      <button
                        type="button"
                        disabled={!product.inStock}
                        onClick={() => onAddToCart(product, activeVariantLabel)}
                        aria-label={`إضافة ${product.name} إلى السلة`}
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
        )}
      </div>
    </section>
  );
}
