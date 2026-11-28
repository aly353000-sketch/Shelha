import mintStudioImg from '../assets/images/auraglow_mint_studio_1795442948330.jpg';
import pinkStudioImg from '../assets/images/auraglow_pink_studio_1795442947437.jpg';
import yellowStudioImg from '../assets/images/auraglow_yellow_studio_1795442947677.jpg';
import trioStudioImg from '../assets/images/auraglow_trio_studio_1795442955672.jpg';

export interface StudioPhotoAsset {
  id: 'trio' | 'mint' | 'pink' | 'yellow';
  titleArabic: string;
  subtitleArabic: string;
  swatchHex: string;
  studioSrc: string;
  downloadHref: string;
  downloadFilename: string;
  originalSrc?: string;
  aspectClass: string;
  isPortrait: boolean;
}

export const AURAGLOW_LOGO_PATH = '/assets/auraglow/auraglow-logo.png';
export const PREBUILT_A4_PDF_PATH = '/downloads/auraglow-hand-cream-a4-4x6cm.pdf';

export const TRIO_HERO_ASSET: StudioPhotoAsset = {
  id: 'trio',
  titleArabic: 'المجموعة الكاملة — لقطة حملة استوديو',
  subtitleArabic: 'الألوان الثلاثة معاً بإضاءة ناعمة على خلفية حجرية فاخرة',
  swatchHex: '#D8CFC2',
  studioSrc: trioStudioImg,
  downloadHref: '/assets/auraglow/auraglow-hand-cream-trio-studio.jpg',
  downloadFilename: 'auraglow-hand-cream-trio-studio.jpg',
  aspectClass: 'aspect-[4/3]',
  isPortrait: false,
};

export const BOTTLE_STUDIO_ASSETS: StudioPhotoAsset[] = [
  {
    id: 'mint',
    titleArabic: 'عبوة مينت جرين (أخضر نعناعي)',
    subtitleArabic: 'تصوير استوديو معزول — بدون يد أو خلفية',
    swatchHex: '#BFE4D7',
    studioSrc: mintStudioImg,
    downloadHref: '/assets/auraglow/auraglow-hand-cream-mint-studio.jpg',
    downloadFilename: 'auraglow-hand-cream-mint-studio.jpg',
    originalSrc: '/assets/aistudio/IMG-20261120-WA0013_91f29a33.jpg',
    aspectClass: 'aspect-[3/4]',
    isPortrait: true,
  },
  {
    id: 'pink',
    titleArabic: 'عبوة باستيل بينك (وردي ناعم)',
    subtitleArabic: 'تصوير استوديو عالي الحدة — بدون يد أو اهتزاز',
    swatchHex: '#F4C5CB',
    studioSrc: pinkStudioImg,
    downloadHref: '/assets/auraglow/auraglow-hand-cream-pink-studio.jpg',
    downloadFilename: 'auraglow-hand-cream-pink-studio.jpg',
    originalSrc: '/assets/aistudio/IMG-20261120-WA0015_9926fb8b.jpg',
    aspectClass: 'aspect-[3/4]',
    isPortrait: true,
  },
  {
    id: 'yellow',
    titleArabic: 'عبوة باتر كريم (أصفر كريمي)',
    subtitleArabic: 'تصوير استوديو معزول — بدون يد أو خلفية',
    swatchHex: '#F4E5A9',
    studioSrc: yellowStudioImg,
    downloadHref: '/assets/auraglow/auraglow-hand-cream-yellow-studio.jpg',
    downloadFilename: 'auraglow-hand-cream-yellow-studio.jpg',
    originalSrc: '/assets/aistudio/IMG-20261120-WA0014_53756263.jpg',
    aspectClass: 'aspect-[3/4]',
    isPortrait: true,
  },
];
