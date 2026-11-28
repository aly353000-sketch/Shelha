export interface StickerData {
  brandArabic: string;
  brandEnglish: string;
  titleArabic: string;
  subtitleEnglish: string;
  descriptionArabic: string;
  ingredientsTitle: string;
  ingredientsList: string;
  usageTitle: string;
  usageText: string;
  volumeText: string;
  expiryText: string;
  sloganArabic: string;
}

export type StickerTheme = 'emerald' | 'ivory';
export type GridPreset = '4x4' | '4x3';

export interface A4LayoutConfig {
  stickerWidthMm: number;
  stickerHeightMm: number;
  columns: number;
  rows: number;
  gapXMm: number;
  gapYMm: number;
  showCropMarks: boolean;
}

export interface StickerCellPosition {
  index: number;
  row: number;
  col: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

export interface A4ImpositionResult {
  pageWidthMm: number;
  pageHeightMm: number;
  stickerWidthMm: number;
  stickerHeightMm: number;
  columns: number;
  rows: number;
  totalStickers: number;
  contentWidthMm: number;
  contentHeightMm: number;
  marginXMm: number;
  marginYMm: number;
  gapXMm: number;
  gapYMm: number;
  fitsSafely: boolean;
  cells: StickerCellPosition[];
}

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const STICKER_WIDTH_MM = 40; // 4 cm
export const STICKER_HEIGHT_MM = 60; // 6 cm
export const MM_TO_PT = 72 / 25.4;
export const A4_WIDTH_PT = Number((A4_WIDTH_MM * MM_TO_PT).toFixed(2)); // 595.28
export const A4_HEIGHT_PT = Number((A4_HEIGHT_MM * MM_TO_PT).toFixed(2)); // 841.89

export const DEFAULT_STICKER_DATA: StickerData = {
  brandArabic: 'أوراجلو',
  brandEnglish: 'Auraglow',
  titleArabic: 'هاند كريم',
  subtitleEnglish: 'Daily Moisturizing Hand Cream',
  descriptionArabic:
    'كريم مرطب يومي لليدين غني بالزيوت الطبيعية والمرطبات المائية، يقدم في عبوة سكويز أنيقة ومناسبة للحمل خارج المنزل.',
  ingredientsTitle: 'Active Ingredients',
  ingredientsList:
    'Sweet Almond Oil · Jojoba Oil · CCT · Shea Butter · Panthenol · Aloe Vera Extract · Cucumber Extract · Glycerin · Lanoline Hydrous · Allantoin · Perfume (Low)',
  usageTitle: 'طريقة الاستخدام',
  usageText: 'يُدهن عند الحاجة، وخصوصاً بعد غسيل اليدين والمواعين.',
  volumeText: '50 مل',
  expiryText: 'EXP 11/2030',
  sloganArabic: 'لأن جمالكِ يستحق الأفضل',
};

export const GRID_PRESETS: Record<GridPreset, Omit<A4LayoutConfig, 'showCropMarks'>> = {
  '4x4': {
    stickerWidthMm: STICKER_WIDTH_MM,
    stickerHeightMm: STICKER_HEIGHT_MM,
    columns: 4,
    rows: 4,
    gapXMm: 6,
    gapYMm: 6,
  },
  '4x3': {
    stickerWidthMm: STICKER_WIDTH_MM,
    stickerHeightMm: STICKER_HEIGHT_MM,
    columns: 4,
    rows: 3,
    gapXMm: 8,
    gapYMm: 12,
  },
};

export function mmToPxAtDpi(mm: number, dpi: number): number {
  return (mm / 25.4) * dpi;
}

export function computeA4Imposition(
  preset: GridPreset = '4x4',
  minSafeMarginMm = 5
): A4ImpositionResult {
  const cfg = GRID_PRESETS[preset];
  const contentWidthMm =
    cfg.columns * cfg.stickerWidthMm + (cfg.columns - 1) * cfg.gapXMm;
  const contentHeightMm =
    cfg.rows * cfg.stickerHeightMm + (cfg.rows - 1) * cfg.gapYMm;

  const marginXMm = Number(((A4_WIDTH_MM - contentWidthMm) / 2).toFixed(2));
  const marginYMm = Number(((A4_HEIGHT_MM - contentHeightMm) / 2).toFixed(2));
  const fitsSafely =
    marginXMm >= minSafeMarginMm && marginYMm >= minSafeMarginMm;

  const cells: StickerCellPosition[] = [];
  let index = 0;
  for (let row = 0; row < cfg.rows; row++) {
    for (let col = 0; col < cfg.columns; col++) {
      const xMm = Number(
        (marginXMm + col * (cfg.stickerWidthMm + cfg.gapXMm)).toFixed(2)
      );
      const yMm = Number(
        (marginYMm + row * (cfg.stickerHeightMm + cfg.gapYMm)).toFixed(2)
      );
      cells.push({
        index,
        row,
        col,
        xMm,
        yMm,
        widthMm: cfg.stickerWidthMm,
        heightMm: cfg.stickerHeightMm,
      });
      index++;
    }
  }

  return {
    pageWidthMm: A4_WIDTH_MM,
    pageHeightMm: A4_HEIGHT_MM,
    stickerWidthMm: cfg.stickerWidthMm,
    stickerHeightMm: cfg.stickerHeightMm,
    columns: cfg.columns,
    rows: cfg.rows,
    totalStickers: cfg.columns * cfg.rows,
    contentWidthMm,
    contentHeightMm,
    marginXMm,
    marginYMm,
    gapXMm: cfg.gapXMm,
    gapYMm: cfg.gapYMm,
    fitsSafely,
    cells,
  };
}

export function isDefaultPrintConfig(
  data: StickerData,
  theme: StickerTheme,
  gridPreset: GridPreset,
  showCropMarks: boolean
): boolean {
  if (theme !== 'emerald' || gridPreset !== '4x4' || !showCropMarks) {
    return false;
  }
  const keys = Object.keys(DEFAULT_STICKER_DATA) as Array<keyof StickerData>;
  return keys.every((key) => data[key].trim() === DEFAULT_STICKER_DATA[key].trim());
}

export function parseIngredientsList(ingredientsList: string): string[] {
  return ingredientsList
    .split(/[·,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
