import type {
  AdminAuthStatus,
  BulkPriceUpdateItem,
  OrderStatus,
  ProductCategory,
  ProductVariant,
  StoreOrder,
  StoreProduct,
  StoreSettings,
  StorefrontPayload,
} from '../types/store';

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(data.error || 'حدث خطأ أثناء الاتصال بالخادم.');
  }
  return data;
}

export async function fetchStorefront(): Promise<StorefrontPayload> {
  const res = await fetch('/api/storefront');
  return parseJson<StorefrontPayload>(res);
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  governorate: string;
  address: string;
  notes: string;
  items: Array<{
    productId: string;
    variantLabel?: string;
    quantity: number;
  }>;
}

export async function submitOrder(
  payload: CreateOrderRequest
): Promise<{ order: StoreOrder; settings: StoreSettings }> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson<{ order: StoreOrder; settings: StoreSettings }>(res);
}

// ==================== ADMIN API ====================

export async function fetchAdminAuthStatus(token: string | null): Promise<AdminAuthStatus> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch('/api/admin/auth/status', { headers });
  return parseJson<AdminAuthStatus>(res);
}

export async function setupAdminPassword(password: string): Promise<{ token: string }> {
  const res = await fetch('/api/admin/auth/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return parseJson<{ token: string }>(res);
}

export async function loginAdmin(password: string): Promise<{ token: string }> {
  const res = await fetch('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return parseJson<{ token: string }>(res);
}

export async function logoutAdmin(token: string): Promise<void> {
  await fetch('/api/admin/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface AdminDashboardPayload {
  products: StoreProduct[];
  orders: StoreOrder[];
  settings: StoreSettings;
}

export async function fetchAdminDashboard(token: string): Promise<AdminDashboardPayload> {
  const res = await fetch('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseJson<AdminDashboardPayload>(res);
}

export interface AdminProductFormInput {
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
  featured: boolean;
}

export async function createAdminProduct(
  token: string,
  payload: AdminProductFormInput
): Promise<{ product: StoreProduct }> {
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return parseJson<{ product: StoreProduct }>(res);
}

export async function updateAdminProduct(
  token: string,
  id: string,
  payload: AdminProductFormInput
): Promise<{ product: StoreProduct }> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return parseJson<{ product: StoreProduct }>(res);
}

export async function deleteAdminProduct(token: string, id: string): Promise<void> {
  const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  await parseJson<{ ok: boolean }>(res);
}

export async function bulkUpdateAdminProductPrices(
  token: string,
  items: BulkPriceUpdateItem[]
): Promise<{ products: StoreProduct[] }> {
  const res = await fetch('/api/admin/products/prices', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items }),
  });
  return parseJson<{ products: StoreProduct[] }>(res);
}

export async function updateAdminOrderStatus(
  token: string,
  orderId: number,
  status: OrderStatus
): Promise<{ order: StoreOrder }> {
  const res = await fetch(`/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  return parseJson<{ order: StoreOrder }>(res);
}

export async function markAdminOrderRead(
  token: string,
  orderId: number,
  isRead: boolean = true
): Promise<{ order: StoreOrder }> {
  const res = await fetch(`/api/admin/orders/${orderId}/read`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isRead }),
  });
  return parseJson<{ order: StoreOrder }>(res);
}

export async function markAllAdminOrdersRead(
  token: string
): Promise<{ orders: StoreOrder[] }> {
  const res = await fetch('/api/admin/orders/mark-all-read', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseJson<{ orders: StoreOrder[] }>(res);
}

export async function updateAdminSettings(
  token: string,
  patch: Partial<StoreSettings>
): Promise<{ settings: StoreSettings }> {
  const res = await fetch('/api/admin/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });
  return parseJson<{ settings: StoreSettings }>(res);
}
