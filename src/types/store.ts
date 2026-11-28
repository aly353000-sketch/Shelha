export type ProductCategory = 'hair' | 'skin' | 'body';

export type OrderStatus = 'new' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';

export interface ProductVariant {
  label: string;
  image: string;
}

export interface StoreProduct {
  id: string;
  name: string;
  category: ProductCategory;
  volume: string;
  originalPrice: number;
  discountedPrice: number;
  images: string[];
  variants: ProductVariant[];
  description: string;
  usage: string;
  ingredients: string[];
  inStock: boolean;
  sortOrder: number;
  featured: boolean;
}

export interface StoreSettings {
  openingDiscountEnabled: boolean;
  openingDiscountPercent: number;
  freeShippingMinItems: number;
  shippingFeeEgp: number;
  whatsappNumber: string;
  facebookUrl: string;
  instagramUrl: string;
  announcementText: string;
  teaserEnabled: boolean;
  teaserTitle: string;
  teaserSubtitle: string;
  teaserBarText: string;
}

export interface BulkPriceUpdateItem {
  id: string;
  originalPrice: number;
  discountedPrice: number;
}

export interface CartItem {
  productId: string;
  variantLabel?: string;
  quantity: number;
}

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  variantLabel?: string;
  volume: string;
  unitOriginalPrice: number;
  unitFinalPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface StoreOrder {
  id: number;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  governorate: string;
  address: string;
  notes: string;
  items: OrderItemSnapshot[];
  totalItemsCount: number;
  subtotalOriginal: number;
  subtotalFinal: number;
  discountTotal: number;
  shippingFee: number;
  grandTotal: number;
  status: OrderStatus;
  isRead: boolean;
  createdAt: string;
}

export interface StorefrontPayload {
  products: StoreProduct[];
  settings: StoreSettings;
}

export interface AdminAuthStatus {
  isConfigured: boolean;
  usesEnvSecret: boolean;
  authenticated: boolean;
}
