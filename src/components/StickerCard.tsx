import React from 'react';
import { AURAGLOW_LOGO_PATH } from '../data/auraglowAssets';
import { StickerData, StickerTheme } from '../utils/stickerLayout';

interface StickerCardProps {
  data: StickerData;
  theme: StickerTheme;
  /**
   * Sets the CSS font-size unit corresponding to 1mm of the 40mm x 60mm sticker.
   * For exact physical print: "1mm".
   * For magnified screen proof (e.g. 260px wide): "6.5px".
   */
  mmUnit?: string;
  className?: string;
}

export const StickerCard: React.FC<StickerCardProps> = ({
  data,
  theme,
  mmUnit = '1mm',
  className = '',
}) => {
  const isEmerald = theme === 'emerald';

  const colors = isEmerald
    ? {
        bg: 'linear-gradient(180deg, #212A24 0%, #19201C 100%)',
        outerBorder: '#D2B77E',
        innerBorder: 'rgba(210, 183, 126, 0.52)',
        gold: '#D6BC84',
        divider: 'rgba(210, 183, 126, 0.45)',
        title: '#F8F5EE',
        body: '#EBE6DA',
        muted: '#CFC8B8',
      }
    : {
        bg: 'linear-gradient(180deg, #FAF7F0 0%, #F2ECDF 100%)',
        outerBorder: '#B1904F',
        innerBorder: 'rgba(177, 144, 79, 0.45)',
        gold: '#9A7939',
        divider: 'rgba(177, 144, 79, 0.45)',
        title: '#1C2620',
        body: '#2F3B33',
        muted: '#536057',
      };

  return (
    <div
      dir="rtl"
      className={`relative overflow-hidden select-none shrink-0 ${className}`}
      style={{
        fontSize: mmUnit,
        width: '40em',
        height: '60em',
        background: colors.bg,
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* Outer hairline gold frame (1.35mm inset) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '1.35em',
          border: `0.3em solid ${colors.outerBorder}`,
          pointerEvents: 'none',
        }}
      />

      {/* Inner hairline gold frame (2.1em inset) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '2.1em',
          border: `0.14em solid ${colors.innerBorder}`,
          pointerEvents: 'none',
        }}
      />

      {/* Subtle corner diamond accents matching luxury cosmetic print */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '1.12em',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: '0.52em',
          height: '0.52em',
          backgroundColor: colors.outerBorder,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '1.12em',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: '0.52em',
          height: '0.52em',
          backgroundColor: colors.outerBorder,
          pointerEvents: 'none',
        }}
      />

      {/* Content Stack strictly fitted inside 34.4em x 53.6em safe zone */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          padding: '3.0em 3.0em 3.3em',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Authentic Auraglow Circular Emblem */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.45em',
            width: '100%',
          }}
        >
          <img
            src={AURAGLOW_LOGO_PATH}
            alt="شعار أوراجلو Auraglow"
            referrerPolicy="no-referrer"
            style={{
              width: '10.8em',
              height: '10.8em',
              objectFit: 'contain',
              borderRadius: '9999px',
              display: 'block',
            }}
          />

          {/* Product Name (Arabic Calligraphic + English Serif Italic) */}
          <div style={{ lineHeight: 1.08 }}>
            <div
              style={{
                fontFamily: "'Aref Ruqaa', 'Alexandria', serif",
                fontSize: '3.65em',
                fontWeight: 700,
                color: colors.title,
                lineHeight: 1.15,
              }}
            >
              {data.titleArabic}
            </div>
            <div
              dir="ltr"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 600,
                fontSize: '2.0em',
                color: colors.gold,
                letterSpacing: '0.02em',
                marginTop: '0.12em',
                lineHeight: 1.15,
              }}
            >
              {data.subtitleEnglish}
            </div>
          </div>

          {/* Product Description */}
          <p
            style={{
              fontFamily: "'Alexandria', sans-serif",
              fontSize: '1.34em',
              fontWeight: 400,
              color: colors.body,
              lineHeight: 1.42,
              margin: '0.2em 0 0',
              maxWidth: '100%',
            }}
          >
            {data.descriptionArabic}
          </p>
        </div>

        {/* Hairline Gold Divider */}
        <div
          aria-hidden="true"
          style={{
            width: '74%',
            height: '0.14em',
            background: `linear-gradient(90deg, transparent, ${colors.divider}, transparent)`,
          }}
        />

        {/* Active Ingredients */}
        <div style={{ width: '100%' }}>
          <div
            dir="ltr"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.85em',
              fontWeight: 700,
              color: colors.gold,
              letterSpacing: '0.03em',
              marginBottom: '0.28em',
              lineHeight: 1.1,
            }}
          >
            {data.ingredientsTitle}
          </div>
          <p
            dir="ltr"
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Alexandria', sans-serif",
              fontSize: '1.33em',
              fontWeight: 400,
              color: colors.body,
              lineHeight: 1.4,
              margin: 0,
              wordSpacing: '0.02em',
            }}
          >
            {data.ingredientsList}
          </p>
        </div>

        {/* Hairline Gold Divider */}
        <div
          aria-hidden="true"
          style={{
            width: '74%',
            height: '0.14em',
            background: `linear-gradient(90deg, transparent, ${colors.divider}, transparent)`,
          }}
        />

        {/* Usage Instructions & Footer */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25em',
          }}
        >
          <div
            style={{
              fontFamily: "'Alexandria', sans-serif",
              fontSize: '1.52em',
              fontWeight: 700,
              color: colors.gold,
              lineHeight: 1.2,
            }}
          >
            {data.usageTitle}
          </div>
          <p
            style={{
              fontFamily: "'Alexandria', sans-serif",
              fontSize: '1.34em',
              fontWeight: 400,
              color: colors.body,
              lineHeight: 1.38,
              margin: 0,
            }}
          >
            {data.usageText}
          </p>

          {/* Volume + Expiry + Brand Slogan */}
          <div
            style={{
              marginTop: '0.38em',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.15em',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45em',
                fontFamily: "'Alexandria', sans-serif",
                fontSize: '1.42em',
                fontWeight: 700,
                color: colors.gold,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
                lineHeight: 1.15,
              }}
            >
              <span dir="rtl">{data.volumeText}</span>
              <span aria-hidden="true">·</span>
              <span dir="ltr">{data.expiryText}</span>
            </div>
            <div
              style={{
                fontFamily: "'Aref Ruqaa', 'Alexandria', serif",
                fontSize: '1.92em',
                fontWeight: 700,
                color: colors.title,
                lineHeight: 1.2,
              }}
            >
              {data.sloganArabic}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
