import React, { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import type { StoreSettings } from '../../types/store';

export type ActiveRoute =
  | { page: 'home' }
  | { page: 'products'; category?: 'all' | 'hair' | 'skin' | 'body' }
  | { page: 'product'; productId: string }
  | { page: 'cart' }
  | { page: 'about' }
  | { page: 'admin' };

interface StoreHeaderProps {
  route: ActiveRoute;
  settings: StoreSettings;
  cartCount: number;
  onNavigate: (next: ActiveRoute) => void;
}

export function StoreHeader({ route, settings, cartCount, onNavigate }: StoreHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const go = (next: ActiveRoute) => {
    setMobileMenuOpen(false);
    onNavigate(next);
  };

  const navItems: Array<{ label: string; active: boolean; target: ActiveRoute }> = [
    { label: 'الرئيسية', active: route.page === 'home', target: { page: 'home' } },
    {
      label: 'المنتجات',
      active: route.page === 'products' || route.page === 'product',
      target: { page: 'products', category: 'all' },
    },
    { label: 'من نحن', active: route.page === 'about', target: { page: 'about' } },
    { label: 'السلة والطلب', active: route.page === 'cart', target: { page: 'cart' } },
    { label: 'لوحة التحكم', active: route.page === 'admin', target: { page: 'admin' } },
  ];

  const teaserPhrase =
    settings.teaserBarText?.trim() || 'تابعينا، مفاجآت أوراجلو جاية قريب';

  return (
    <div className="sticky top-0 z-40">
      {/* Slim Repeating Top Teaser Strip (Toggleable from Admin) */}
      {settings.teaserEnabled && (
        <div
          data-testid="top-teaser-bar"
          className="bg-[#E8DCCA] text-[#8E431E] border-b border-[#D7C6AC] overflow-hidden py-1.5"
        >
          <div className="animate-auraglow-ticker items-center text-[11px] sm:text-xs font-semibold">
            {Array.from({ length: 8 }).map((_, idx) => (
              <span
                key={idx}
                className="inline-flex items-center whitespace-nowrap mx-5"
              >
                <span>{teaserPhrase}</span>
                <span className="mr-5 text-[#B48948]" aria-hidden="true">
                  ✦
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Slim Dynamic Opening Offer Announcement Bar */}
      {settings.openingDiscountEnabled ? (
        <div
          data-testid="opening-offer-bar"
          className="bg-[#182B22] text-[#F5EFE2] text-[11px] sm:text-xs py-2 px-3 sm:px-4 text-center border-b border-[#C9A968]/35"
        >
          <span className="font-semibold text-[#E4C78A]">
            خصم الافتتاح {settings.openingDiscountPercent}%
          </span>
          <span className="mx-1.5 sm:mx-2 text-white/40" aria-hidden="true">
            ·
          </span>
          <span>
            التوصيل لأي مكان في مصر — شحن مجاني عند طلب {settings.freeShippingMinItems} منتجات أو أكثر
          </span>
        </div>
      ) : (
        <div
          data-testid="opening-offer-bar"
          className="bg-[#233A2F] text-[#F5EFE2] text-[11px] sm:text-xs py-2 px-3 sm:px-4 text-center"
        >
          <span>
            التوصيل لأي مكان في مصر · شحن مجاني عند طلب {settings.freeShippingMinItems} منتجات أو
            أكثر · الدفع عند الاستلام
          </span>
        </div>
      )}

      {/* Strict 3-Zone Top Bar */}
      <header className="bg-[#F7F1E5]/95 backdrop-blur-md border-b border-[#DDD0BA]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-[68px] sm:min-h-[76px] py-2 flex items-center justify-between gap-2 sm:gap-5">
          {/* Zone 1: Logo + Bilingual Brand Name + Calligraphic Terracotta Tagline */}
          <button
            type="button"
            onClick={() => go({ page: 'home' })}
            data-testid="header-brand-button"
            className="inline-flex items-center gap-2 sm:gap-3 text-right min-w-0 shrink cursor-pointer"
          >
            <img
              src="/assets/auraglow/auraglow-logo.png"
              alt="شعار أوراجلو Auraglow"
              referrerPolicy="no-referrer"
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-contain border border-[#D4C5AA] bg-white shrink-0"
            />
            <span className="flex flex-col items-start min-w-0">
              <span className="text-[13px] sm:text-[17px] font-bold tracking-tight text-[#1A3327] leading-tight whitespace-nowrap">
                أوراجلو
                <span className="mx-1 sm:mx-1.5 text-[#B4945B] font-normal" aria-hidden="true">
                  |
                </span>
                <span className="font-semibold">Auraglow</span>
              </span>
              <span
                data-testid="header-tagline"
                className="font-tagline-script text-[12px] sm:text-[15px] font-bold text-[#A85426] leading-snug mt-0.5 whitespace-nowrap"
              >
                لأن جمالك يستحق الأفضل
              </span>
            </span>
          </button>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="التنقل الرئيسي"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#46564C]"
          >
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => go(item.target)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  item.active
                    ? 'text-[#16221B] font-bold border-b-2 border-[#B99453]'
                    : 'hover:text-[#16221B]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Single Primary Action (Shopping Bag) + Mobile Menu Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => go({ page: 'cart' })}
              aria-label={`سلة المشتريات (${cartCount} منتج)`}
              data-testid="header-cart-button"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[#FBF7F0] bg-[#182B22] hover:bg-[#223B2F] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
            >
              <ShoppingBag className="w-4 h-4 text-[#E4C78A]" />
              <span className="hidden sm:inline">السلة</span>
              <span
                data-testid="header-cart-count"
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#C9A968] text-[#16221B] text-[11px] font-bold tabular-nums"
              >
                {cartCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 sm:p-2.5 rounded-xl border border-[#D8CBB4] bg-[#FBF7F0] text-[#16221B] hover:bg-[#EFE6D5] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Collapsible Navigation */}
        {mobileMenuOpen && (
          <nav
            aria-label="قائمة الجوال"
            className="lg:hidden border-t border-[#DDD0BA] bg-[#FBF7F0] px-4 py-3 flex flex-col gap-1"
          >
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => go(item.target)}
                className={`w-full text-right px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  item.active
                    ? 'bg-[#E9DEC9] text-[#16221B] font-bold'
                    : 'text-[#46564C] hover:bg-[#F3ECE0]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </header>
    </div>
  );
}
