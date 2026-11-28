import React, { useState } from 'react';
import {
  CheckCircle2,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react';
import type { CartItem, StoreOrder, StoreProduct, StoreSettings } from '../../types/store';
import {
  EGYPT_GOVERNORATES,
  buildWhatsAppUrl,
  calculateCartSummary,
  formatDisplayEgyptPhone,
  formatEgp,
  isValidEgyptMobile,
} from '../../utils/storefrontLogic';
import { submitOrder } from '../../utils/storeApi';
import type { ActiveRoute } from './StoreHeader';

interface CartCheckoutViewProps {
  cartItems: CartItem[];
  products: StoreProduct[];
  settings: StoreSettings;
  onUpdateQty: (productId: string, variantLabel: string | undefined, nextQty: number) => void;
  onRemoveItem: (productId: string, variantLabel: string | undefined) => void;
  onClearCart: () => void;
  onNavigate: (next: ActiveRoute) => void;
}

export function CartCheckoutView({
  cartItems,
  products,
  settings,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onNavigate,
}: CartCheckoutViewProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<StoreOrder | null>(null);

  const summary = calculateCartSummary(cartItems, products, settings);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (summary.detailedItems.length === 0) {
      setFormError('السلة فارغة حالياً — أضيفي منتجاً واحداً على الأقل.');
      return;
    }
    if (customerName.trim().length < 2) {
      setFormError('يرجى كتابة الاسم بالكامل.');
      return;
    }
    if (!isValidEgyptMobile(customerPhone)) {
      setFormError('يرجى كتابة رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01).');
      return;
    }
    if (address.trim().length < 5) {
      setFormError('يرجى كتابة العنوان بالتفصيل لتسهيل التوصيل.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        governorate,
        address: address.trim(),
        notes: notes.trim(),
        items: summary.detailedItems.map((item) => ({
          productId: item.product.id,
          variantLabel: item.variantLabel,
          quantity: item.quantity,
        })),
      });
      setConfirmedOrder(res.order);
      onClearCart();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'تعذر تسجيل الطلب حالياً.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <section className="py-10 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div
            data-testid="order-confirmed-card"
            className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-6 sm:p-10 text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-[#E1EFE6] text-[#1C5536] flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#16221B] mt-5">
              شكراً لطلبك من أوراجلو
            </h1>
            <p
              data-testid="order-thank-you-message"
              className="text-base sm:text-lg font-semibold text-[#182B22] mt-2.5"
            >
              تم استلام طلبك وسنتواصل معك قريبًا
            </p>

            <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-4 py-2.5 rounded-2xl bg-[#EFE5D3] border border-[#DACAA9] text-sm text-[#4A574F]">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span>رقم الطلب:</span>
                <strong
                  dir="ltr"
                  data-testid="confirmed-order-code"
                  className="text-base font-bold text-[#182B22] tabular-nums whitespace-nowrap"
                >
                  {confirmedOrder.orderCode}
                </strong>
              </span>
              <span className="text-[#B4945B]" aria-hidden="true">
                ·
              </span>
              <span className="whitespace-nowrap">الدفع عند الاستلام</span>
            </div>

            {/* Order Summary Box */}
            <div className="mt-6 text-right bg-[#F3ECE0] border border-[#DDD0BA] rounded-2xl p-5 space-y-2.5 text-sm">
              {confirmedOrder.items.map((item, i) => (
                <div
                  key={`${item.productId}-${item.variantLabel || i}`}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-[#16221B] font-medium">
                    {item.productName}
                    {item.variantLabel ? ` (${item.variantLabel})` : ''} × {item.quantity}
                  </span>
                  <span className="font-bold text-[#182B22] tabular-nums whitespace-nowrap">
                    {formatEgp(item.lineTotal)} ج.م
                  </span>
                </div>
              ))}

              <div className="pt-3 border-t border-[#DDD0BA] flex items-center justify-between text-xs text-[#4D5C53]">
                <span>الشحن ({confirmedOrder.governorate})</span>
                <span className="font-semibold text-[#182B22]">
                  {confirmedOrder.shippingFee === 0
                    ? 'مجاني'
                    : `${formatEgp(confirmedOrder.shippingFee)} ج.م`}
                </span>
              </div>

              <div className="flex items-center justify-between text-base font-bold text-[#16221B] pt-1">
                <span>الإجمالي عند الاستلام</span>
                <span className="tabular-nums text-[#182B22]">
                  {formatEgp(confirmedOrder.grandTotal)} ج.م
                </span>
              </div>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate({ page: 'products', category: 'all' })}
                className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold text-[#FBF7F0] bg-[#182B22] hover:bg-[#223B2F] rounded-2xl transition-colors cursor-pointer"
              >
                العودة للتسوق في أوراجلو
              </button>
              <button
                type="button"
                onClick={() => onNavigate({ page: 'home' })}
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-[#16221B] bg-[#EFE6D5] hover:bg-[#E5D9C3] border border-[#D8CBB4] rounded-2xl transition-colors cursor-pointer"
              >
                الصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (summary.detailedItems.length === 0) {
    return (
      <section className="py-12 sm:py-20">
        <div className="max-w-xl mx-auto px-4 sm:px-6 text-center bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-10">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#EFE5D3] text-[#785E32] flex items-center justify-center">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-[#16221B] mt-4">سلة المشتريات فارغة</h1>
          <p className="text-sm text-[#4D5C53] mt-2 leading-relaxed">
            ابدئي بإضافة منتجاتك المفضلة من أوراجلو، واستفيدي من الشحن المجاني عند طلب{' '}
            {settings.freeShippingMinItems} منتجات أو أكثر.
          </p>
          <button
            type="button"
            onClick={() => onNavigate({ page: 'products', category: 'all' })}
            className="mt-6 px-6 py-3 text-sm font-bold text-[#FBF7F0] bg-[#182B22] hover:bg-[#223B2F] rounded-2xl transition-colors cursor-pointer"
          >
            تصفحي المنتجات الآن
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-7">
          <p className="text-xs font-semibold text-[#785E32]">إتمام الطلب بسهولة</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#16221B] mt-1">
            سلة المشتريات وتأكيد الطلب
          </h1>
        </div>

        {/* Free Shipping Progress Notice */}
        <div
          data-testid="shipping-progress-banner"
          className={`mb-7 rounded-2xl border px-5 py-3.5 flex items-center gap-3 text-xs sm:text-sm ${
            summary.isFreeShipping
              ? 'bg-[#E2EFE7] border-[#B2D3BE] text-[#184B2F]'
              : 'bg-[#EFE5D3] border-[#DACAA9] text-[#594118]'
          }`}
        >
          <Truck className="w-5 h-5 shrink-0" />
          {summary.isFreeShipping ? (
            <span className="font-bold">
              مبروك! طلبك يشمل الشحن المجاني بالكامل ({summary.totalItemsCount} منتجات).
            </span>
          ) : (
            <span>
              أضيفي{' '}
              <strong className="tabular-nums">{summary.itemsNeededForFreeShipping}</strong>{' '}
              {summary.itemsNeededForFreeShipping === 1 ? 'منتج إضافي' : 'منتجات إضافية'} للحصول على{' '}
              <strong>شحن مجاني</strong> بدلاً من {formatEgp(settings.shippingFeeEgp)} ج.م.
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl divide-y divide-[#E8DEC9]">
              {summary.detailedItems.map((entry) => (
                <div
                  key={`${entry.product.id}-${entry.variantLabel || 'default'}`}
                  className="p-4 sm:p-5 flex items-center gap-4"
                >
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate({ page: 'product', productId: entry.product.id })
                    }
                    className="w-20 h-24 rounded-xl overflow-hidden bg-[#E7EAEE] border border-[#DDD0BA] shrink-0 cursor-pointer"
                  >
                    <img
                      src={entry.image}
                      alt={entry.product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold text-[#16221B]">
                          {entry.product.name}
                        </h2>
                        <p className="text-xs text-[#5E6D64] mt-0.5">
                          {entry.product.volume}
                          {entry.variantLabel ? ` · ${entry.variantLabel}` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={`حذف ${entry.product.name} من السلة`}
                        onClick={() => onRemoveItem(entry.product.id, entry.variantLabel)}
                        className="p-1.5 text-[#85776A] hover:text-[#9E382D] rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center border border-[#D4C5AA] bg-[#F3ECE0] rounded-xl">
                        <button
                          type="button"
                          aria-label={`زيادة كمية ${entry.product.name}`}
                          onClick={() =>
                            onUpdateQty(
                              entry.product.id,
                              entry.variantLabel,
                              entry.quantity + 1
                            )
                          }
                          className="p-2 text-[#16221B] hover:bg-[#E5D9C3] rounded-r-xl cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold tabular-nums">
                          {entry.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`تقليل كمية ${entry.product.name}`}
                          onClick={() =>
                            onUpdateQty(
                              entry.product.id,
                              entry.variantLabel,
                              entry.quantity - 1
                            )
                          }
                          className="p-2 text-[#16221B] hover:bg-[#E5D9C3] rounded-l-xl cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-left tabular-nums">
                        <span className="text-sm sm:text-base font-bold text-[#182B22]">
                          {formatEgp(entry.lineTotal)} ج.م
                        </span>
                        {entry.unitFinalPrice < entry.unitOriginalPrice && (
                          <span className="mr-2 text-xs text-[#8C8173] line-through">
                            {formatEgp(entry.unitOriginalPrice * entry.quantity)} ج.م
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals Summary */}
            <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-5 sm:p-6 space-y-3 text-sm">
              <div className="flex items-center justify-between text-[#4D5C53]">
                <span>عدد المنتجات</span>
                <span className="font-semibold text-[#16221B] tabular-nums">
                  {summary.totalItemsCount}
                </span>
              </div>
              {summary.discountTotal > 0 && (
                <div className="flex items-center justify-between text-[#1C5536]">
                  <span>توفير خصم الافتتاح ({settings.openingDiscountPercent}%)</span>
                  <span className="font-bold tabular-nums">
                    - {formatEgp(summary.discountTotal)} ج.م
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-[#4D5C53]">
                <span>رسوم الشحن</span>
                <span
                  data-testid="cart-shipping-fee"
                  className={`font-bold tabular-nums ${
                    summary.shippingFee === 0 ? 'text-[#1C5536]' : 'text-[#16221B]'
                  }`}
                >
                  {summary.shippingFee === 0
                    ? 'مجاني'
                    : `${formatEgp(summary.shippingFee)} ج.م`}
                </span>
              </div>
              <div className="pt-3 border-t border-[#E8DEC9] flex items-center justify-between text-base sm:text-lg font-bold text-[#16221B]">
                <span>الإجمالي (الدفع عند الاستلام)</span>
                <span data-testid="cart-grand-total" className="text-[#182B22] tabular-nums">
                  {formatEgp(summary.grandTotal)} ج.م
                </span>
              </div>
              <div className="pt-3 border-t border-[#E8DEC9] flex items-center justify-between gap-2 text-xs text-[#4D5C53]">
                <span>عندك استفسار قبل تأكيد الطلب؟</span>
                <a
                  data-testid="cart-whatsapp-inquiry"
                  href={buildWhatsAppUrl(
                    settings.whatsappNumber,
                    'مرحباً أوراجلو Auraglow 🌿 عندي استفسار بخصوص الطلب في السلة.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-[#182B22] hover:text-[#A85426] transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#1C5536]" />
                  واتساب (<span dir="ltr">{formatDisplayEgyptPhone(settings.whatsappNumber)}</span>)
                </a>
              </div>
            </div>
          </div>

          {/* Checkout Form Column */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="lg:col-span-5 bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-6 sm:p-7 space-y-4"
          >
            <div>
              <h2 className="text-lg font-bold text-[#16221B]">بيانات التوصيل</h2>
              <p className="text-xs text-[#55645B] mt-1">
                الدفع عند الاستلام — بعد التأكيد يُحفظ طلبك مباشرة وسنتواصل معك قريبًا لتأكيد
                التوصيل.
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-xl bg-[#FDF0EE] border border-[#ECC6C0] px-4 py-3 text-xs font-semibold text-[#8F342A]"
              >
                {formError}
              </div>
            )}

            <div>
              <label
                htmlFor="checkout-name"
                className="block text-xs font-semibold text-[#36443C] mb-1.5"
              >
                الاسم بالكامل *
              </label>
              <input
                id="checkout-name"
                type="text"
                required
                placeholder="مثال: سارة محمود"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl focus:outline-none focus:border-[#182B22]"
              />
            </div>

            <div>
              <label
                htmlFor="checkout-phone"
                className="block text-xs font-semibold text-[#36443C] mb-1.5"
              >
                رقم الموبايل (اتصال / واتساب) *
              </label>
              <input
                id="checkout-phone"
                type="tel"
                required
                dir="ltr"
                placeholder="01012345678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm text-right bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl focus:outline-none focus:border-[#182B22] tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="checkout-governorate"
                className="block text-xs font-semibold text-[#36443C] mb-1.5"
              >
                المحافظة *
              </label>
              <select
                id="checkout-governorate"
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl focus:outline-none focus:border-[#182B22]"
              >
                {EGYPT_GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="checkout-address"
                className="block text-xs font-semibold text-[#36443C] mb-1.5"
              >
                العنوان بالتفصيل *
              </label>
              <textarea
                id="checkout-address"
                required
                rows={3}
                placeholder="المدينة / المنطقة، اسم الشارع، رقم العمارة والدور وأقرب علامة مميزة"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl focus:outline-none focus:border-[#182B22]"
              />
            </div>

            <div>
              <label
                htmlFor="checkout-notes"
                className="block text-xs font-semibold text-[#36443C] mb-1.5"
              >
                ملاحظات إضافية (اختياري)
              </label>
              <input
                id="checkout-notes"
                type="text"
                placeholder="مثال: التواصل قبل الوصول بساعة"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl focus:outline-none focus:border-[#182B22]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-[#FBF7F0] bg-[#182B22] hover:bg-[#223B2F] disabled:opacity-60 rounded-2xl transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#E4C78A]" />
              {submitting
                ? 'جاري تسجيل الطلب...'
                : `تأكيد الطلب (${formatEgp(summary.grandTotal)} ج.م عند الاستلام)`}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
