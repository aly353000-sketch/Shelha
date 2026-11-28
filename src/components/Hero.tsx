import React from 'react';
import { CONTACT_INFO } from '../data/contactInfo';
import { TrustBadges } from './TrustBadges';
import { HeroMediaSlider } from './HeroMediaSlider';
import { WhatsAppIcon } from './WhatsAppIcon';
import { useApp } from '../context/AppContext';
import { handlePhoneCallClick } from '../utils/analytics';

interface HeroProps {
  onOpenGoldenTips?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenGoldenTips }) => {
  const { t } = useApp();

  const handleGoldenTipsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenGoldenTips) {
      onOpenGoldenTips();
    } else {
      const el = document.getElementById('prep-guide') || document.getElementById('moving-tips');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const chip =
    'px-3 py-1.5 rounded-full bg-white border border-[#E9DFC9] text-xs sm:text-sm font-bold text-slate-600 shadow-sm';

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-32 pb-10 lg:pt-32 lg:pb-12 border-b transition-colors duration-300 bg-gradient-to-b from-[#020b18] via-[#041633] to-[#020b18] border-blue-900/60 text-white"
    >
      {/* Compact hero (approved demo design): pill, short headline, one-line sub, chips, CTAs */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-4">
        {/* Kick Pill */}
        <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-black shadow-sm border bg-amber-500/15 border-amber-400/40 text-amber-300">
          <span>👑</span>
          <span>{t('متاحون 24 ساعة · معاينة مسبقة', 'Available 24/7 · Pre-visit survey')}</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-snug tracking-tight text-white">
          {t('مش مجرد عمال نقل..', 'Not just movers..')}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-400 via-yellow-300 to-amber-500">
            {t('إحنا حراس لرفاهيتك!', 'We guard your comfort!')}
          </span>
        </h1>

        {/* One-line Sub */}
        <p className="text-sm sm:text-base font-bold leading-relaxed text-slate-200">
          {t(
            'خدمة نقل وتغليف فندقية تليق ببيتك — عناية فائقة بالتحف والنجف والصالونات في التجمع، زايد، مدينتي، الرحاب، أكتوبر والمعادي ✨',
            'Hotel-grade moving & packing that suits your home — supreme care for antiques, chandeliers & salons across New Cairo, Zayed, Madinaty, Rehab, October & Maadi ✨'
          )}
        </p>

        {/* Feature Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className={chip}>{t('تغليف 5 طبقات', '5-ply packing')}</span>
          <span className={chip}>{t('فك وتركيب', 'Disassembly & assembly')}</span>
          <span className={chip}>{t('ونش هيدروليكي', 'Hydraulic winch')}</span>
        </div>

        {/* CTAs: WhatsApp + direct calls */}
        <div className="max-w-xs sm:max-w-sm mx-auto w-full space-y-2.5 pt-1">
          <a
            href={`https://wa.me/${CONTACT_INFO.whatsappInternational}?text=${encodeURIComponent(
              t(
                'السلام عليكم، أرغب في حجز خدمة النقل والتغليف الفندقي VIP مع رويال موفرز',
                'Hello, I would like to book VIP white-glove moving & packing with Royal Movers'
              )
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-3.5 rounded-xl font-black text-sm sm:text-base shadow-xl shadow-emerald-700/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <WhatsAppIcon className="w-5 h-5 text-white shrink-0" />
            <span>{t('احجز خدمتك عبر واتساب', 'Book your move via WhatsApp')}</span>
          </a>
          <div className="text-sm sm:text-base font-bold text-slate-200">
            {t('أو اتصل:', 'Or call:')}{' '}
            <a
              href="tel:01233391255"
              onClick={(e) => handlePhoneCallClick(e, 'tel:01233391255', 'القسم الرئيسي (اتصال 1)')}
              className="font-mono font-black text-amber-300 hover:underline underline-offset-4"
              dir="ltr"
            >
              01233391255
            </a>
            {' · '}
            <a
              href="tel:01128418399"
              onClick={(e) => handlePhoneCallClick(e, 'tel:01128418399', 'القسم الرئيسي (اتصال 2)')}
              className="font-mono font-black text-amber-300 hover:underline underline-offset-4"
              dir="ltr"
            >
              01128418399
            </a>
          </div>
        </div>

        {/* Golden Tips shortcut */}
        <div>
          <button
            type="button"
            onClick={handleGoldenTipsClick}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black transition-colors cursor-pointer border border-amber-300 shadow-sm"
          >
            📖 {t('نصائح ذهبية لحماية أثاثك', 'Golden Pre-Move Tips')}
          </button>
        </div>
      </div>

      {/* Real Media Slider (demo carousel card) */}
      <div className="max-w-md sm:max-w-xl mx-auto px-4 sm:px-6 mt-6 relative z-10">
        <HeroMediaSlider />
      </div>

      {/* Trust Icon Badges */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 relative z-10">
        <TrustBadges />
      </div>
    </section>
  );
};
