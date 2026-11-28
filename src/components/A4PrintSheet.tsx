import React from 'react';
import {
  GridPreset,
  StickerData,
  StickerTheme,
  computeA4Imposition,
} from '../utils/stickerLayout';
import { StickerCard } from './StickerCard';

interface A4PrintSheetProps {
  data: StickerData;
  theme: StickerTheme;
  gridPreset: GridPreset;
  showCropMarks: boolean;
  /**
   * "print" renders exact physical 210mm x 297mm dimensions (1em = 1mm).
   * "preview" scales cleanly to the given previewWidthPx while preserving exact A4 ratio.
   */
  mode: 'print' | 'preview';
  previewWidthPx?: number;
}

export const A4PrintSheet: React.FC<A4PrintSheetProps> = ({
  data,
  theme,
  gridPreset,
  showCropMarks,
  mode,
  previewWidthPx = 560,
}) => {
  const layout = computeA4Imposition(gridPreset);
  const mmUnit = mode === 'print' ? '1mm' : `${previewWidthPx / 210}px`;

  return (
    <div
      dir="ltr"
      data-testid={mode === 'print' ? 'a4-print-sheet' : 'a4-preview-sheet'}
      style={{
        fontSize: mmUnit,
        width: '210em',
        height: '297em',
        backgroundColor: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* Print-shop header info inside the top margin (strictly 1em = 1mm positioning) */}
      <div
        style={{
          position: 'absolute',
          top: '6.5em',
          left: '16em',
          right: '16em',
          height: '4em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: "'Plus Jakarta Sans', 'Alexandria', sans-serif",
          color: '#64748B',
          letterSpacing: '0.02em',
        }}
      >
        <span style={{ fontSize: '2.2em', lineHeight: 1, whiteSpace: 'nowrap' }}>
          Auraglow Hand Cream · A4 (210 × 297 mm)
        </span>
        <span style={{ fontSize: '2.2em', lineHeight: 1, whiteSpace: 'nowrap' }}>
          Sticker Trim: 40 × 60 mm (4 × 6 cm) · {layout.totalStickers} Labels · Print 100% Actual Size
        </span>
      </div>

      {/* Exact millimeter positioned sticker cells */}
      {layout.cells.map((cell) => (
        <div
          key={cell.index}
          style={{
            position: 'absolute',
            left: `${cell.xMm}em`,
            top: `${cell.yMm}em`,
            width: `${cell.widthMm}em`,
            height: `${cell.heightMm}em`,
          }}
        >
          <StickerCard data={data} theme={theme} mmUnit={mmUnit} />

          {/* Precision hairline crop marks outside the 40x60mm trim edge */}
          {showCropMarks && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
              }}
            >
              {/* Top-left */}
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-2.6em',
                  width: '1.9em',
                  height: '0.16em',
                  backgroundColor: '#64748B',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '-2.6em',
                  left: 0,
                  width: '0.16em',
                  height: '1.9em',
                  backgroundColor: '#64748B',
                }}
              />
              {/* Top-right */}
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  right: '-2.6em',
                  width: '1.9em',
                  height: '0.16em',
                  backgroundColor: '#64748B',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '-2.6em',
                  right: 0,
                  width: '0.16em',
                  height: '1.9em',
                  backgroundColor: '#64748B',
                }}
              />
              {/* Bottom-left */}
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '-2.6em',
                  width: '1.9em',
                  height: '0.16em',
                  backgroundColor: '#64748B',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2.6em',
                  left: 0,
                  width: '0.16em',
                  height: '1.9em',
                  backgroundColor: '#64748B',
                }}
              />
              {/* Bottom-right */}
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: '-2.6em',
                  width: '1.9em',
                  height: '0.16em',
                  backgroundColor: '#64748B',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2.6em',
                  right: 0,
                  width: '0.16em',
                  height: '1.9em',
                  backgroundColor: '#64748B',
                }}
              />
            </div>
          )}
        </div>
      ))}

      {/* Bottom footer measurement scale bar (exact 40mm = 4cm calibration ruler) */}
      <div
        style={{
          position: 'absolute',
          bottom: '6.5em',
          left: '16em',
          right: '16em',
          height: '4em',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: "'Plus Jakarta Sans', 'Alexandria', sans-serif",
          color: '#64748B',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '3em' }}>
          <span
            style={{
              display: 'inline-block',
              width: '40em',
              height: '0.32em',
              backgroundColor: '#334155',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: '-0.85em',
                width: '0.26em',
                height: '2em',
                backgroundColor: '#334155',
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: 0,
                top: '-0.85em',
                width: '0.26em',
                height: '2em',
                backgroundColor: '#334155',
              }}
            />
          </span>
          <span style={{ fontSize: '2.1em', lineHeight: 1, whiteSpace: 'nowrap' }}>
            Scale Check: 40 mm (4 cm exact)
          </span>
        </div>
        <span style={{ fontSize: '2.1em', lineHeight: 1, whiteSpace: 'nowrap' }}>
          Margins: {layout.marginXMm}mm L/R · {layout.marginYMm}mm T/B
        </span>
      </div>
    </div>
  );
};
