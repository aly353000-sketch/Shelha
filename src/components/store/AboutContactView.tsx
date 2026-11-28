import React from 'react';
import { MessageCircle, Truck, ShieldCheck, Leaf, ExternalLink } from 'lucide-react';
import type { StoreSettings } from '../../types/store';
import { buildWhatsAppUrl, formatDisplayEgyptPhone } from '../../utils/storefrontLogic';
import type { ActiveRoute } from './StoreHeader';

interface AboutContactViewProps {
  settings: StoreSettings;
  onNavigate: (next: ActiveRoute) => void;
}

export function AboutContactView({ settings, onNavigate }: AboutContactViewProps) {
  const directWhatsappUrl = buildWhatsAppUrl(
    settings.whatsappNumber,
    'مرحباً أوراجلو Auraglow 🌿 حابة أستفسر عن منتجات العناية بالبشرة والشعر.'
  );

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Story Card */}
        <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-7 sm:p-10">
          <div className="flex items-center gap-4 mb-6">
            <img
              src="/assets/auraglow/auraglow-logo.png"
              alt="شعار أوراجلو Auraglow"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-contain border border-[#D4C5AA] bg-white shrink-0"
            />
            <div>
              <p className="text-xs font-semibold text-[#785E32]">من نحن · أوراجلو Auraglow</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#16221B] mt-0.5">
                عناية يومية ناعمة مستوحاة من الطبيعة
              </h1>
            </div>
          </div>

          <p className="text-sm sm:text-base text-[#4A574F] leading-relaxed">
            بدأت علامة <strong>أوراجلو (Auraglow)</strong> بفكرة بسيطة وواضحة: تقديم منتجات عناية
            يومية بالشعر والبشرة والجسم للبنات والسيدات في مصر بتركيبات لطيفة، روائح هادئة،
            ومكونات معروفة ومكتوبة بكل شفافية على كل عبوة.
          </p>
          <p className="text-sm sm:text-base text-[#4A574F] leading-relaxed mt-3">
            نؤمن بأن العناية اليومية لحظة راحة واهتمام بنفسك — لذلك نحرص على تنوّع المنتجات لتناسب
            مختلف أنواع البشرة والشعر بأسعار مناسبة وجودة ثابتة، مع تجربة طلب سهلة وسريعة تصلك
            لأي مكان في مصر.
          </p>

          <div className="mt-7 pt-6 border-t border-[#E8DEC9] grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
            <div className="flex items-start gap-2.5">
              <Truck className="w-5 h-5 text-[#785E32] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-[#16221B]">توصيل لكل المحافظات</h2>
                <p className="text-xs text-[#55645B] mt-1">
                  شحن مجاني عند طلب {settings.freeShippingMinItems} منتجات أو أكثر.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#785E32] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-[#16221B]">الدفع عند الاستلام</h2>
                <p className="text-xs text-[#55645B] mt-1">
                  تأكيد سهل للطلب بدون الحاجة لبطاقات بنكية.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Leaf className="w-5 h-5 text-[#785E32] shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold text-[#16221B]">شفافية في المكونات</h2>
                <p className="text-xs text-[#55645B] mt-1">
                  كل منتج موضح به المكونات وطريقة الاستخدام بوضوح.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Social Channels */}
        <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-7 sm:p-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[#16221B]">تواصلي معنا</h2>
          <p className="text-sm text-[#4D5C53] mt-1.5">
            يسعدنا مساعدتك في اختيار الروتين المناسب لنوع بشرتك أو شعرك عبر قنواتنا الرسمية:
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              data-testid="about-whatsapp-link"
              href={directWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col justify-between p-5 rounded-2xl bg-[#182B22] text-[#FBF7F0] hover:bg-[#223B2F] transition-colors"
            >
              <div className="flex items-center justify-between">
                <MessageCircle className="w-6 h-6 text-[#E4C78A]" />
                <ExternalLink className="w-4 h-4 text-white/60" />
              </div>
              <div className="mt-5">
                <span className="block text-base font-bold">واتساب أوراجلو</span>
                <span dir="ltr" className="block text-xs font-semibold text-[#E4C78A] mt-1 text-right tabular-nums">
                  {formatDisplayEgyptPhone(settings.whatsappNumber)}
                </span>
                <span className="block text-xs text-white/75 mt-0.5">
                  للطلبات والاستفسار السريع
                </span>
              </div>
            </a>

            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col justify-between p-5 rounded-2xl bg-[#F3ECE0] border border-[#D8CBB4] text-[#16221B] hover:bg-[#EAE0CE] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#785E32]">Instagram</span>
                  <ExternalLink className="w-4 h-4 text-[#785E32]" />
                </div>
                <div className="mt-5">
                  <span className="block text-base font-bold">إنستجرام</span>
                  <span className="block text-xs text-[#55645B] mt-1">
                    تابعي نصائح الروتين والمنتجات الجديدة
                  </span>
                </div>
              </a>
            )}

            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col justify-between p-5 rounded-2xl bg-[#F3ECE0] border border-[#D8CBB4] text-[#16221B] hover:bg-[#EAE0CE] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#785E32]">Facebook</span>
                  <ExternalLink className="w-4 h-4 text-[#785E32]" />
                </div>
                <div className="mt-5">
                  <span className="block text-base font-bold">فيسبوك</span>
                  <span className="block text-xs text-[#55645B] mt-1">
                    انضمي لمجتمع أوراجلو وتابعي العروض
                  </span>
                </div>
              </a>
            )}
          </div>

          <div className="mt-7 pt-6 border-t border-[#E8DEC9] flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-[#55645B]">
              جاهزة لتجربة منتجات أوراجلو؟ تصفحي التشكيلة الكاملة واطلبي في دقيقة واحدة.
            </p>
            <button
              type="button"
              onClick={() => onNavigate({ page: 'products', category: 'all' })}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-[#FBF7F0] bg-[#182B22] hover:bg-[#223B2F] rounded-xl transition-colors cursor-pointer"
            >
              تصفحي المنتجات
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
