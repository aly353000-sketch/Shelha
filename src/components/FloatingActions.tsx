import React from 'react';
import { Phone } from 'lucide-react';
import { CONTACT_INFO } from '../data/contactInfo';
import { WhatsAppIcon } from './WhatsAppIcon';
import { useApp } from '../context/AppContext';
import { handlePhoneCallClick, trackWhatsAppClick } from '../utils/analytics';

export const FloatingActions: React.FC = () => {
  const { t } = useApp();

  const primary = CONTACT_INFO.primaryPhone;
  const secondary = CONTACT_INFO.secondaryPhone;

  const waUrl = `https://wa.me/${CONTACT_INFO.whatsappInternational}?text=${encodeURIComponent(
    t(
      'السلام عليكم، استفسار عن خدمات وأسعار نقل وتغليف الأثاث مع رويال موفرز VIP',
      'Hello, inquiry about VIP moving services with Royal Movers Egypt.'
    )
  )}`;

  const callPill = (number: string, tone: 'blue' | 'ink') => (
    <a
      key={number}
      href={`tel:${number}`}
      onClick={(e) => handlePhoneCallClick(e, `tel:${number}`, `زر الاتصال العائم ${number}`)}
      className={`float-pill ${tone === 'blue' ? 'float-call' : 'float-call2'} flex-1 min-w-0 flex items-center justify-center gap-1.5 h-11 rounded-full px-2 shadow-xl active:scale-95 transition-transform`}
      aria-label={t(`اتصل الآن على ${number}`, `Call ${number}`)}
    >
      <Phone className="w-4 h-4 shrink-0" />
      <span className="text-[11px] font-black whitespace-nowrap" dir="ltr">
        {number}
      </span>
    </a>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-2.5 pb-2.5 pt-2 bg-gradient-to-t from-[#FAF6EE] via-[#FAF6EE]/95 to-transparent">
      <div className="flex items-stretch gap-1.5 max-w-md mx-auto" dir="rtl">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsAppClick(waUrl, 'زر الواتساب العائم')}
          className="float-pill float-wa flex-[1.15] min-w-0 flex items-center justify-center gap-1.5 h-11 rounded-full px-2 shadow-xl active:scale-95 transition-transform"
          aria-label={t('تواصل عبر الواتساب الآن', 'Chat on WhatsApp')}
        >
          <WhatsAppIcon className="w-4 h-4 fill-current shrink-0" />
          <span className="text-[11px] font-black whitespace-nowrap">
            {t('واتساب', 'WhatsApp')}
          </span>
        </a>
        {callPill(primary, 'blue')}
        {callPill(secondary, 'ink')}
      </div>
    </div>
  );
};
