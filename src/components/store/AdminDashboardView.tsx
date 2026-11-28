import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Edit3,
  Lock,
  LogOut,
  Package,
  Plus,
  Save,
  Settings,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AdminAuthStatus,
  BulkPriceUpdateItem,
  OrderStatus,
  ProductCategory,
  StoreOrder,
  StoreProduct,
  StoreSettings,
} from '../../types/store';
import {
  CATEGORY_LABELS,
  ORDER_STATUS_META,
  formatEgp,
} from '../../utils/storefrontLogic';
import {
  AdminProductFormInput,
  bulkUpdateAdminProductPrices,
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminAuthStatus,
  fetchAdminDashboard,
  loginAdmin,
  logoutAdmin,
  markAdminOrderRead,
  markAllAdminOrdersRead,
  setupAdminPassword,
  updateAdminOrderStatus,
  updateAdminProduct,
  updateAdminSettings,
} from '../../utils/storeApi';

interface AdminDashboardViewProps {
  adminToken: string | null;
  onChangeToken: (token: string | null) => void;
  onStorefrontChanged: () => void;
}

type AdminTab = 'orders' | 'products' | 'settings';

interface PriceDraft {
  originalPrice: string;
  discountedPrice: string;
}

const STUDIO_IMAGE_PRESETS = [
  '/assets/auraglow/studio/01_shampoo_hair_loss.jpg',
  '/assets/auraglow/studio/02_shampoo_dandruff.jpg',
  '/assets/auraglow/studio/02b_dandruff_lotion.jpg',
  '/assets/auraglow/studio/03_hair_mask.jpg',
  '/assets/auraglow/studio/04_dry_hair_cream.jpg',
  '/assets/auraglow/studio/05_hair_balm.jpg',
  '/assets/auraglow/studio/06_hair_oil_blend.jpg',
  '/assets/auraglow/studio/07_cleanser_normal_dry.jpg',
  '/assets/auraglow/studio/08_cleanser_oily.jpg',
  '/assets/auraglow/studio/09_toner_normal_dry.jpg',
  '/assets/auraglow/studio/10_toner_oily_mixed.jpg',
  '/assets/auraglow/studio/11_cream_normal_dry.jpg',
  '/assets/auraglow/studio/12_gel_oily_mixed.jpg',
  '/assets/auraglow/studio/13_sunscreen_spf70.jpg',
  '/assets/auraglow/studio/14_brightening_serum.jpg',
  '/assets/auraglow/studio/15_lip_balm.jpg',
  '/assets/auraglow/studio/16_shower_gel_strawberry.jpg',
  '/assets/auraglow/studio/17_shower_gel_peach.jpg',
  '/assets/auraglow/studio/18_shower_gel_lavender.jpg',
  '/assets/auraglow/studio/19_body_butter_berry.jpg',
  '/assets/auraglow/studio/20_body_butter_musk.jpg',
  '/assets/auraglow/studio/21_body_butter_pomegranate.jpg',
  '/assets/auraglow/studio/22_hand_cream_mint.jpg',
  '/assets/auraglow/studio/23_hand_cream_yellow.jpg',
  '/assets/auraglow/studio/24_hand_cream_pink.jpg',
];

interface EditorState {
  mode: 'create' | 'edit';
  editingId?: string;
  name: string;
  category: ProductCategory;
  volume: string;
  originalPrice: string;
  discountedPrice: string;
  imagesText: string;
  description: string;
  usage: string;
  ingredientsText: string;
  inStock: boolean;
  featured: boolean;
}

const EMPTY_EDITOR: EditorState = {
  mode: 'create',
  name: '',
  category: 'skin',
  volume: '125 مل',
  originalPrice: '150',
  discountedPrice: '120',
  imagesText: '/assets/auraglow/studio/14_brightening_serum.jpg',
  description: '',
  usage: '',
  ingredientsText: 'Panthenol, Aloe Vera Extract, Vitamin E',
  inStock: true,
  featured: false,
};

export function AdminDashboardView({
  adminToken,
  onChangeToken,
  onStorefrontChanged,
}: AdminDashboardViewProps) {
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, PriceDraft>>({});
  const [savingAllPrices, setSavingAllPrices] = useState(false);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loadingDash, setLoadingDash] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [dashError, setDashError] = useState<string | null>(null);

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const syncPriceDrafts = (list: StoreProduct[]) => {
    const next: Record<string, PriceDraft> = {};
    for (const p of list) {
      next[p.id] = {
        originalPrice: String(p.originalPrice),
        discountedPrice: String(p.discountedPrice),
      };
    }
    setPriceDrafts(next);
  };

  const unreadOrdersCount = useMemo(
    () => orders.filter((o) => !o.isRead).length,
    [orders]
  );

  const modifiedPricesCount = useMemo(() => {
    let count = 0;
    for (const p of products) {
      const draft = priceDrafts[p.id];
      if (!draft) continue;
      if (
        Number(draft.originalPrice) !== p.originalPrice ||
        Number(draft.discountedPrice) !== p.discountedPrice
      ) {
        count += 1;
      }
    }
    return count;
  }, [products, priceDrafts]);

  const showNotice = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3200);
  };

  useEffect(() => {
    let active = true;
    fetchAdminAuthStatus(adminToken)
      .then((status) => {
        if (!active) return;
        setAuthStatus(status);
        if (!status.authenticated && adminToken) {
          onChangeToken(null);
        }
      })
      .catch(() => {
        if (active) setAuthError('تعذر الاتصال بخدمة لوحة التحكم.');
      });
    return () => {
      active = false;
    };
  }, [adminToken, onChangeToken]);

  const loadDashboard = async (token: string) => {
    setLoadingDash(true);
    setDashError(null);
    try {
      const data = await fetchAdminDashboard(token);
      setProducts(data.products);
      syncPriceDrafts(data.products);
      setOrders(data.orders);
      setSettings(data.settings);
    } catch (err) {
      setDashError(err instanceof Error ? err.message : 'تعذر تحميل بيانات لوحة التحكم.');
    } finally {
      setLoadingDash(false);
    }
  };

  useEffect(() => {
    if (adminToken && authStatus?.authenticated) {
      loadDashboard(adminToken);
    }
  }, [adminToken, authStatus?.authenticated]);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (passwordInput.trim().length < 6) {
      setAuthError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('كلمتا المرور غير متطابقتين.');
      return;
    }
    setAuthBusy(true);
    try {
      const res = await setupAdminPassword(passwordInput.trim());
      setPasswordInput('');
      setConfirmPasswordInput('');
      onChangeToken(res.token);
      setAuthStatus({ isConfigured: true, usesEnvSecret: false, authenticated: true });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'تعذر إعداد كلمة المرور.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!passwordInput.trim()) {
      setAuthError('يرجى إدخال كلمة المرور.');
      return;
    }
    setAuthBusy(true);
    try {
      const res = await loginAdmin(passwordInput.trim());
      setPasswordInput('');
      onChangeToken(res.token);
      setAuthStatus((prev) =>
        prev ? { ...prev, authenticated: true } : { isConfigured: true, usesEnvSecret: false, authenticated: true }
      );
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'كلمة المرور غير صحيحة.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    if (adminToken) {
      await logoutAdmin(adminToken).catch(() => {});
    }
    onChangeToken(null);
    setAuthStatus((prev) => (prev ? { ...prev, authenticated: false } : null));
  };

  const openEditModal = (product: StoreProduct) => {
    setEditor({
      mode: 'edit',
      editingId: product.id,
      name: product.name,
      category: product.category,
      volume: product.volume,
      originalPrice: String(product.originalPrice),
      discountedPrice: String(product.discountedPrice),
      imagesText: product.images.join('\n'),
      description: product.description,
      usage: product.usage,
      ingredientsText: product.ingredients.join(', '),
      inStock: product.inStock,
      featured: product.featured,
    });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !editor) return;
    setSavingProduct(true);
    setDashError(null);

    try {
      const existing = editor.editingId
        ? products.find((p) => p.id === editor.editingId)
        : undefined;

      const images = editor.imagesText
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const ingredients = editor.ingredientsText
        .split(/[,،\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: AdminProductFormInput = {
        name: editor.name.trim(),
        category: editor.category,
        volume: editor.volume.trim(),
        originalPrice: Number(editor.originalPrice),
        discountedPrice: Number(editor.discountedPrice),
        images,
        variants: existing?.variants ?? [],
        description: editor.description.trim(),
        usage: editor.usage.trim(),
        ingredients,
        inStock: editor.inStock,
        featured: editor.featured,
      };

      if (editor.mode === 'create') {
        const res = await createAdminProduct(adminToken, payload);
        const nextProducts = [...products, res.product];
        setProducts(nextProducts);
        syncPriceDrafts(nextProducts);
        showNotice('تمت إضافة المنتج بنجاح.');
      } else if (editor.editingId) {
        const res = await updateAdminProduct(adminToken, editor.editingId, payload);
        const nextProducts = products.map((p) => (p.id === res.product.id ? res.product : p));
        setProducts(nextProducts);
        syncPriceDrafts(nextProducts);
        showNotice('تم حفظ تعديلات المنتج.');
      }
      setEditor(null);
      onStorefrontChanged();
    } catch (err) {
      setDashError(err instanceof Error ? err.message : 'تعذر حفظ المنتج.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handlePriceDraftChange = (
    productId: string,
    field: 'originalPrice' | 'discountedPrice',
    value: string
  ) => {
    setPriceDrafts((prev) => ({
      ...prev,
      [productId]: {
        originalPrice: prev[productId]?.originalPrice ?? '',
        discountedPrice: prev[productId]?.discountedPrice ?? '',
        [field]: value,
      },
    }));
  };

  const handleSaveAllPrices = async () => {
    if (!adminToken) return;
    setDashError(null);
    const items: BulkPriceUpdateItem[] = [];
    for (const p of products) {
      const draft = priceDrafts[p.id];
      const originalPrice = Number(draft?.originalPrice ?? p.originalPrice);
      const discountedPrice = Number(draft?.discountedPrice ?? p.discountedPrice);
      if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
        setDashError(`السعر قبل الخصم غير صالح للمنتج "${p.name}".`);
        return;
      }
      if (
        !Number.isFinite(discountedPrice) ||
        discountedPrice <= 0 ||
        discountedPrice > originalPrice
      ) {
        setDashError(
          `السعر بعد الخصم للمنتج "${p.name}" يجب أن يكون أكبر من صفر ولا يتجاوز السعر قبل الخصم.`
        );
        return;
      }
      items.push({ id: p.id, originalPrice, discountedPrice });
    }

    setSavingAllPrices(true);
    try {
      const res = await bulkUpdateAdminProductPrices(adminToken, items);
      setProducts(res.products);
      syncPriceDrafts(res.products);
      onStorefrontChanged();
      showNotice('تم حفظ جميع الأسعار الجديدة وظهرت فورًا في المتجر.');
    } catch (err) {
      setDashError(err instanceof Error ? err.message : 'تعذر حفظ الأسعار الجديدة.');
    } finally {
      setSavingAllPrices(false);
    }
  };

  const handleToggleInStock = async (product: StoreProduct) => {
    if (!adminToken) return;
    setDashError(null);
    try {
      const res = await updateAdminProduct(adminToken, product.id, {
        name: product.name,
        category: product.category,
        volume: product.volume,
        originalPrice: product.originalPrice,
        discountedPrice: product.discountedPrice,
        images: product.images,
        variants: product.variants,
        description: product.description,
        usage: product.usage,
        ingredients: product.ingredients,
        inStock: !product.inStock,
        featured: product.featured,
      });
      setProducts((prev) => prev.map((p) => (p.id === res.product.id ? res.product : p)));
      onStorefrontChanged();
      showNotice(res.product.inStock ? 'تم تفعيل توفر المنتج.' : 'تم تحويل المنتج إلى غير متوفر.');
    } catch (err) {
      setDashError(err instanceof Error ? err.message : 'تعذر تحديث توفر المنتج.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!adminToken) return;
    setDashError(null);
    try {
      await deleteAdminProduct(adminToken, id);
      const nextProducts = products.filter((p) => p.id !== id);
      setProducts(nextProducts);
      syncPriceDrafts(nextProducts);
      setConfirmDeleteId(null);
      onStorefrontChanged();
      showNotice('تم حذف المنتج.');
    } catch (err) {
      setDashError(err instanceof Error ? err.message : 'تعذر حذف المنتج.');
    }
  };

  const sortOrdersUnreadFirst = (list: StoreOrder[]) =>
    [...list].sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return b.id - a.id;
    });

  const handleOrderStatusChange = async (orderId: number, status: OrderStatus) => {
    if (!adminToken) return;
    setDashError(null);
    try {
      const res = await updateAdminOrderStatus(adminToken, orderId, status);
      setOrders((prev) =>
        sortOrdersUnreadFirst(prev.map((o) => (o.id === orderId ? res.order : o)))
      );
      showNotice(`تم تحديث حالة الطلب ${res.order.orderCode}.`);
    } catch (err) {
      setDashError(err instanceof Error ? err.message : 'تعذر تحديث حالة الطلب.');
    }
  };

  const handleMarkOrderRead = async (orderId: number) => {
    if (!adminToken) return;
    setDashError(null);
    try {
      const res = await markAdminOrderRead(adminToken, orderId, true);
      setOrders((prev) =>
        sortOrdersUnreadFirst(prev.map((o) => (o.id === orderId ? res.order : o)))
      );
    } catch (err) {
      setDashError(err instanceof Error ? err.message : 'تعذر تحديث حالة القراءة.');
    }
  };

  const handleMarkAllRead = async () => {
    if (!adminToken) return;
    setDashError(null);
    try {
      const res = await markAllAdminOrdersRead(adminToken);
      setOrders(res.orders);
      showNotice('تم تحديد جميع الطلبات كمقروءة.');
    } catch (err) {
      setDashError(err instanceof Error ? err.message : 'تعذر تحديث الطلبات.');
    }
  };

  const handleQuickToggleDiscount = async () => {
    if (!adminToken || !settings) return;
    setSavingSettings(true);
    setDashError(null);
    try {
      const res = await updateAdminSettings(adminToken, {
        openingDiscountEnabled: !settings.openingDiscountEnabled,
      });
      setSettings(res.settings);
      onStorefrontChanged();
      showNotice(
        res.settings.openingDiscountEnabled
          ? 'تم تشغيل خصم الافتتاح على المتجر بالكامل.'
          : 'تم إيقاف خصم الافتتاح مؤقتاً.'
      );
    } catch (err) {
      setDashError(err instanceof Error ? err.message : 'تعذر تحديث حالة العرض.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !settings) return;
    setSavingSettings(true);
    setDashError(null);
    try {
      const res = await updateAdminSettings(adminToken, settings);
      setSettings(res.settings);
      onStorefrontChanged();
      showNotice('تم حفظ إعدادات المتجر بنجاح.');
    } catch (err) {
      setDashError(err instanceof Error ? err.message : 'تعذر حفظ الإعدادات.');
    } finally {
      setSavingSettings(false);
    }
  };

  // ==================== AUTH GATE ====================
  if (!authStatus) {
    return (
      <section className="py-16 text-center text-sm text-[#58685E]">
        جاري التحقق من حالة لوحة التحكم...
      </section>
    );
  }

  if (!authStatus.authenticated) {
    const needsSetup = !authStatus.isConfigured;
    return (
      <section className="py-12 sm:py-16">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-7 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-[#EFE5D3] text-[#182B22] flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#16221B]">
              {needsSetup ? 'إعداد كلمة مرور لوحة التحكم' : 'تسجيل الدخول للوحة التحكم'}
            </h1>
            <p className="text-xs sm:text-sm text-[#4D5C53] mt-1.5 leading-relaxed">
              {needsSetup
                ? 'لأول مرة فقط: اختاري كلمة مرور قوية لإدارة منتجات وطلبات وعروض متجر أوراجلو.'
                : 'أدخلي كلمة مرور إدارة متجر أوراجلو للوصول إلى المنتجات والطلبات وإعدادات العرض.'}
            </p>

            {authError && (
              <div
                role="alert"
                className="mt-4 rounded-xl bg-[#FDF0EE] border border-[#ECC6C0] px-3.5 py-2.5 text-xs font-semibold text-[#8F342A]"
              >
                {authError}
              </div>
            )}

            <form
              onSubmit={needsSetup ? handleSetupSubmit : handleLoginSubmit}
              className="mt-5 space-y-4"
            >
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-[#36443C] mb-1.5"
                >
                  كلمة المرور
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  minLength={6}
                  placeholder={needsSetup ? '6 أحرف على الأقل' : 'أدخلي كلمة المرور'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl focus:outline-none focus:border-[#182B22]"
                />
              </div>

              {needsSetup && (
                <div>
                  <label
                    htmlFor="admin-password-confirm"
                    className="block text-xs font-semibold text-[#36443C] mb-1.5"
                  >
                    تأكيد كلمة المرور
                  </label>
                  <input
                    id="admin-password-confirm"
                    type="password"
                    required
                    minLength={6}
                    placeholder="أعيدي كتابة كلمة المرور"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl focus:outline-none focus:border-[#182B22]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authBusy}
                className="w-full py-3 text-sm font-bold text-[#FBF7F0] bg-[#182B22] hover:bg-[#223B2F] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
              >
                {authBusy
                  ? 'جاري التحقق...'
                  : needsSetup
                    ? 'حفظ كلمة المرور والدخول'
                    : 'دخول لوحة التحكم'}
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  // ==================== AUTHENTICATED DASHBOARD ====================
  return (
    <section className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold text-[#785E32]">لوحة إدارة متجر أوراجلو</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#16221B] mt-0.5">
              التحكم بالطلبات والأسعار والعروض
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {settings && (
              <button
                type="button"
                disabled={savingSettings}
                onClick={handleQuickToggleDiscount}
                data-testid="admin-toggle-discount"
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                  settings.openingDiscountEnabled
                    ? 'bg-[#182B22] text-[#E8CE96] border-[#182B22]'
                    : 'bg-[#FBF7F0] text-[#45554C] border-[#D4C5AA]'
                }`}
              >
                {settings.openingDiscountEnabled
                  ? `خصم الافتتاح (${settings.openingDiscountPercent}%): مفعّل`
                  : 'خصم الافتتاح: متوقف'}
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#5C4944] bg-[#FBF7F0] border border-[#D8CBB4] hover:bg-[#FAF0EE] rounded-xl cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              تسجيل الخروج
            </button>
          </div>
        </div>

        {/* Feedback / Error */}
        {feedback && (
          <div className="mb-5 rounded-xl bg-[#E2EFE7] border border-[#B2D3BE] px-4 py-3 text-xs font-semibold text-[#184B2F] flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            {feedback}
          </div>
        )}
        {dashError && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-[#FDF0EE] border border-[#ECC6C0] px-4 py-3 text-xs font-semibold text-[#8F342A]"
          >
            {dashError}
          </div>
        )}

        {/* Admin Navigation Tabs (Orders First with Unread Counter) */}
        <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-2xl p-2 mb-6 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            data-testid="admin-tab-orders"
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#182B22] text-[#FBF7F0]'
                : 'text-[#45554C] hover:bg-[#EFE6D5]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>الطلبات ({orders.length})</span>
            {unreadOrdersCount > 0 && (
              <span
                data-testid="unread-orders-count"
                className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-[#A85426] text-white text-[11px] font-bold tabular-nums"
              >
                {unreadOrdersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            data-testid="admin-tab-products"
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#182B22] text-[#FBF7F0]'
                : 'text-[#45554C] hover:bg-[#EFE6D5]'
            }`}
          >
            <Package className="w-4 h-4" />
            المنتجات والأسعار ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            data-testid="admin-tab-settings"
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-[#182B22] text-[#FBF7F0]'
                : 'text-[#45554C] hover:bg-[#EFE6D5]'
            }`}
          >
            <Settings className="w-4 h-4" />
            إعدادات العرض والتشويق
          </button>
        </div>

        {loadingDash ? (
          <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-10 text-center text-sm text-[#4D5C53]">
            جاري تحميل البيانات...
          </div>
        ) : activeTab === 'orders' ? (
          <div className="space-y-4">
            {/* Unread Orders Summary Bar */}
            <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    unreadOrdersCount > 0
                      ? 'bg-[#F8E7DD] text-[#A85426]'
                      : 'bg-[#E2EFE7] text-[#1C5536]'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#16221B]">
                    الطلبات الجديدة غير المقروءة:{' '}
                    <span
                      data-testid="unread-orders-summary"
                      className="text-[#A85426] tabular-nums"
                    >
                      {unreadOrdersCount}
                    </span>
                  </p>
                  <p className="text-xs text-[#55645B] mt-0.5">
                    إجمالي الطلبات المسجلة: {orders.length} · الطلبات الجديدة تظهر في أعلى القائمة
                    وتحتفظ بأسعارها وقت الطلب.
                  </p>
                </div>
              </div>

              {unreadOrdersCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#182B22] bg-[#EFE5D3] hover:bg-[#E5D9C3] border border-[#D8CBB4] rounded-xl transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4 text-[#785E32]" />
                  تحديد الكل كمقروء
                </button>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-12 text-center text-sm text-[#4D5C53]">
                لا توجد طلبات مسجلة حتى الآن. ستظهر هنا جميع طلبات الزبونات تلقائياً فور تأكيدها.
              </div>
            ) : (
              orders.map((order) => (
                <article
                  key={order.id}
                  data-testid={`admin-order-${order.orderCode}`}
                  className={`rounded-3xl p-5 sm:p-6 border transition-colors ${
                    !order.isRead
                      ? 'bg-[#FFFBF4] border-[#A85426]/55 shadow-xs'
                      : 'bg-[#FBF7F0] border-[#DDD0BA]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8DEC9]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-[#16221B] tabular-nums">
                          {order.orderCode}
                        </span>
                        {!order.isRead && (
                          <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-[#A85426] text-white">
                            طلب جديد · غير مقروء
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg ${ORDER_STATUS_META[order.status].toneClass}`}
                        >
                          {ORDER_STATUS_META[order.status].label}
                        </span>
                        <span className="text-xs text-[#5E6D64] tabular-nums">
                          {order.createdAt}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#16221B] mt-1.5">
                        {order.customerName} ·{' '}
                        <span dir="ltr" className="tabular-nums">
                          {order.customerPhone}
                        </span>
                      </p>
                      <p className="text-xs text-[#4D5C53] mt-0.5">
                        {order.governorate} — {order.address}
                        {order.notes ? ` · ملاحظات: ${order.notes}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!order.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkOrderRead(order.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-[#182B22] bg-[#EFE5D3] hover:bg-[#E5D9C3] border border-[#D8CBB4] rounded-xl cursor-pointer"
                        >
                          تحديد كمقروء
                        </button>
                      )}
                      <label
                        htmlFor={`order-status-${order.id}`}
                        className="text-xs font-semibold text-[#45554C]"
                      >
                        الحالة:
                      </label>
                      <select
                        id={`order-status-${order.id}`}
                        value={order.status}
                        onChange={(e) =>
                          handleOrderStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className="px-3 py-1.5 text-xs font-semibold bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl focus:outline-none focus:border-[#182B22]"
                      >
                        {(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map((st) => (
                          <option key={st} value={st}>
                            {ORDER_STATUS_META[st].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs sm:text-sm">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3">
                        <span className="text-[#36443C]">
                          {it.productName}
                          {it.variantLabel ? ` (${it.variantLabel})` : ''} × {it.quantity}
                          <span className="text-[11px] text-[#6B7A71] mr-1.5 tabular-nums">
                            ({formatEgp(it.unitFinalPrice)} ج.م للقطعة)
                          </span>
                        </span>
                        <span className="font-semibold tabular-nums text-[#16221B] whitespace-nowrap">
                          {formatEgp(it.lineTotal)} ج.م
                        </span>
                      </div>
                    ))}
                    <div className="pt-2.5 mt-2 border-t border-[#E8DEC9] flex flex-wrap items-center justify-between gap-2 font-bold text-[#182B22]">
                      <span>
                        الشحن:{' '}
                        {order.shippingFee === 0
                          ? 'مجاني'
                          : `${formatEgp(order.shippingFee)} ج.م`}
                      </span>
                      <span
                        data-testid={`admin-order-total-${order.orderCode}`}
                        className="tabular-nums"
                      >
                        الإجمالي: {formatEgp(order.grandTotal)} ج.م
                      </span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : activeTab === 'products' ? (
          <div className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8DEC9] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#16221B]">
                  إدارة المنتجات وتعديل الأسعار
                </h2>
                <p className="text-xs text-[#55645B] mt-0.5">
                  عدّلي السعر قبل الخصم وبعد الخصم لأي منتج واضغطي «حفظ الكل» لتظهر فورًا في
                  المتجر دون تغيير أسعار الطلبات السابقة.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={savingAllPrices}
                  onClick={handleSaveAllPrices}
                  data-testid="admin-save-all-prices"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#A85426] hover:bg-[#8E431E] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {savingAllPrices
                    ? 'جاري حفظ الأسعار...'
                    : modifiedPricesCount > 0
                      ? `حفظ الكل (${modifiedPricesCount} تعديل)`
                      : 'حفظ الكل'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditor(EMPTY_EDITOR)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#FBF7F0] bg-[#182B22] hover:bg-[#223B2F] rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#E4C78A]" />
                  إضافة منتج جديد
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm border-collapse">
                <thead>
                  <tr className="bg-[#EFE5D3] text-xs font-bold text-[#36443C] border-b border-[#DDD0BA]">
                    <th className="py-3 px-4">المنتج</th>
                    <th className="py-3 px-4">القسم</th>
                    <th className="py-3 px-4 text-center">السعر قبل الخصم (ج.م)</th>
                    <th className="py-3 px-4 text-center">السعر بعد الخصم (ج.م)</th>
                    <th className="py-3 px-4 text-center">التوفر</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DEC9]">
                  {products.map((p) => {
                    const draft = priceDrafts[p.id] ?? {
                      originalPrice: String(p.originalPrice),
                      discountedPrice: String(p.discountedPrice),
                    };
                    const isDirty =
                      Number(draft.originalPrice) !== p.originalPrice ||
                      Number(draft.discountedPrice) !== p.discountedPrice;
                    return (
                      <tr
                        key={p.id}
                        className={isDirty ? 'bg-[#FDF4E7]' : 'hover:bg-[#F5EEE1]'}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-11 h-14 rounded-lg object-contain bg-[#E7EAEE] border border-[#D8CBB4] shrink-0"
                            />
                            <div>
                              <div className="font-bold text-[#16221B]">{p.name}</div>
                              <div className="text-xs text-[#5E6D64]">{p.volume}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#45554C] whitespace-nowrap">
                          {CATEGORY_LABELS[p.category].arabic}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min={1}
                            step="any"
                            aria-label={`السعر قبل الخصم - ${p.name}`}
                            data-testid={`price-before-${p.id}`}
                            value={draft.originalPrice}
                            onChange={(e) =>
                              handlePriceDraftChange(p.id, 'originalPrice', e.target.value)
                            }
                            className="w-24 px-2.5 py-1.5 text-center text-sm font-semibold bg-[#F3ECE0] border border-[#D4C5AA] rounded-lg tabular-nums focus:outline-none focus:border-[#182B22]"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min={1}
                            step="any"
                            aria-label={`السعر بعد الخصم - ${p.name}`}
                            data-testid={`price-after-${p.id}`}
                            value={draft.discountedPrice}
                            onChange={(e) =>
                              handlePriceDraftChange(p.id, 'discountedPrice', e.target.value)
                            }
                            className="w-24 px-2.5 py-1.5 text-center text-sm font-bold text-[#182B22] bg-[#F3ECE0] border border-[#D4C5AA] rounded-lg tabular-nums focus:outline-none focus:border-[#182B22]"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleInStock(p)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                              p.inStock
                                ? 'bg-[#E2EFE7] text-[#1C5536]'
                                : 'bg-[#F7E5E3] text-[#8F342A]'
                            }`}
                          >
                            {p.inStock ? 'متوفر' : 'غير متوفر'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              aria-label={`تعديل ${p.name}`}
                              className="p-2 text-[#182B22] hover:bg-[#E5D9C3] rounded-lg cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {confirmDeleteId === p.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="px-2.5 py-1 text-xs font-bold text-white bg-[#A33D32] rounded-lg cursor-pointer"
                                >
                                  تأكيد الحذف
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 text-xs text-[#4D5C53] bg-[#EFE5D3] rounded-lg cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(p.id)}
                                aria-label={`حذف ${p.name}`}
                                className="p-2 text-[#85776A] hover:text-[#A33D32] hover:bg-[#FDF0EE] rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3.5 border-t border-[#E8DEC9] bg-[#F5EEE1] flex items-center justify-end">
              <button
                type="button"
                disabled={savingAllPrices}
                onClick={handleSaveAllPrices}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#A85426] hover:bg-[#8E431E] disabled:opacity-60 rounded-xl transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {savingAllPrices ? 'جاري الحفظ...' : 'حفظ الكل'}
              </button>
            </div>
          </div>
        ) : (
          settings && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-[#FBF7F0] border border-[#DDD0BA] rounded-3xl p-6 sm:p-8 max-w-3xl space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold text-[#16221B]">
                  إعدادات عرض الافتتاح والشحن والتواصل
                </h2>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F3ECE0] border border-[#DDD0BA]">
                <div>
                  <p className="text-sm font-bold text-[#16221B]">
                    تفعيل خصم الافتتاح على جميع المنتجات
                  </p>
                  <p className="text-xs text-[#55645B] mt-0.5">
                    عند الإيقاف يعرض المتجر السعر الأصلي فقط ويخفي شريط الخصم تلقائياً.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.openingDiscountEnabled}
                  onClick={() =>
                    setSettings((prev) =>
                      prev
                        ? { ...prev, openingDiscountEnabled: !prev.openingDiscountEnabled }
                        : prev
                    )
                  }
                  className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-colors ${
                    settings.openingDiscountEnabled
                      ? 'bg-[#182B22] text-[#E4C78A]'
                      : 'bg-[#DDD0BA] text-[#45554C]'
                  }`}
                >
                  {settings.openingDiscountEnabled ? 'مفعّل' : 'متوقف'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="set-discount-pct"
                    className="block text-xs font-semibold text-[#36443C] mb-1.5"
                  >
                    نسبة الخصم (%)
                  </label>
                  <input
                    id="set-discount-pct"
                    type="number"
                    min={0}
                    max={90}
                    value={settings.openingDiscountPercent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        openingDiscountPercent: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="set-free-ship"
                    className="block text-xs font-semibold text-[#36443C] mb-1.5"
                  >
                    الحد الأدنى للشحن المجاني (عدد منتجات)
                  </label>
                  <input
                    id="set-free-ship"
                    type="number"
                    min={1}
                    max={20}
                    value={settings.freeShippingMinItems}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        freeShippingMinItems: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="set-ship-fee"
                    className="block text-xs font-semibold text-[#36443C] mb-1.5"
                  >
                    رسوم الشحن العادية (ج.م)
                  </label>
                  <input
                    id="set-ship-fee"
                    type="number"
                    min={0}
                    max={500}
                    value={settings.shippingFeeEgp}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        shippingFeeEgp: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl tabular-nums"
                  />
                </div>
              </div>

              {/* Coming Soon Teaser Section Controls */}
              <div className="pt-5 border-t border-[#E6DAC5] space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#A85426]" />
                  <h3 className="text-base font-bold text-[#16221B]">
                    قسم التشويق والشريط العلوي
                  </h3>
                </div>

                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F3ECE0] border border-[#DDD0BA]">
                  <div>
                    <p className="text-sm font-bold text-[#16221B]">
                      إظهار قسم «قريبًا في أوراجلو» والشريط العلوي
                    </p>
                    <p className="text-xs text-[#55645B] mt-0.5">
                      يمكنك إظهار أو إخفاء قسم التشويق والشريط المتكرر أعلى الموقع في أي وقت.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.teaserEnabled}
                    data-testid="admin-toggle-teaser"
                    onClick={() =>
                      setSettings((prev) =>
                        prev ? { ...prev, teaserEnabled: !prev.teaserEnabled } : prev
                      )
                    }
                    className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-colors ${
                      settings.teaserEnabled
                        ? 'bg-[#A85426] text-white'
                        : 'bg-[#DDD0BA] text-[#45554C]'
                    }`}
                  >
                    {settings.teaserEnabled ? 'ظاهر في الموقع' : 'مخفي'}
                  </button>
                </div>

                <div>
                  <label
                    htmlFor="set-teaser-title"
                    className="block text-xs font-semibold text-[#36443C] mb-1.5"
                  >
                    عنوان قسم التشويق في الرئيسية
                  </label>
                  <input
                    id="set-teaser-title"
                    type="text"
                    value={settings.teaserTitle}
                    onChange={(e) =>
                      setSettings({ ...settings, teaserTitle: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl"
                  />
                </div>

                <div>
                  <label
                    htmlFor="set-teaser-subtitle"
                    className="block text-xs font-semibold text-[#36443C] mb-1.5"
                  >
                    نص قسم التشويق في الرئيسية
                  </label>
                  <textarea
                    id="set-teaser-subtitle"
                    rows={2}
                    value={settings.teaserSubtitle}
                    onChange={(e) =>
                      setSettings({ ...settings, teaserSubtitle: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl"
                  />
                </div>

                <div>
                  <label
                    htmlFor="set-teaser-bar"
                    className="block text-xs font-semibold text-[#36443C] mb-1.5"
                  >
                    نص الشريط الصغير المتكرر أعلى الموقع
                  </label>
                  <input
                    id="set-teaser-bar"
                    type="text"
                    value={settings.teaserBarText}
                    onChange={(e) =>
                      setSettings({ ...settings, teaserBarText: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-5 border-t border-[#E6DAC5] space-y-4">
                <div>
                  <label
                    htmlFor="set-whatsapp"
                    className="block text-xs font-semibold text-[#36443C] mb-1.5"
                  >
                    رقم واتساب التواصل والطلب والاستفسارات (بالكود الدولي مثل 201127266860)
                  </label>
                  <input
                    id="set-whatsapp"
                    type="text"
                    dir="ltr"
                    value={settings.whatsappNumber}
                    onChange={(e) =>
                      setSettings({ ...settings, whatsappNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm text-right bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl tabular-nums"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="set-fb"
                      className="block text-xs font-semibold text-[#36443C] mb-1.5"
                    >
                      رابط صفحة فيسبوك
                    </label>
                    <input
                      id="set-fb"
                      type="url"
                      dir="ltr"
                      value={settings.facebookUrl}
                      onChange={(e) =>
                        setSettings({ ...settings, facebookUrl: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm text-right bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="set-ig"
                      className="block text-xs font-semibold text-[#36443C] mb-1.5"
                    >
                      رابط حساب إنستجرام
                    </label>
                    <input
                      id="set-ig"
                      type="url"
                      dir="ltr"
                      value={settings.instagramUrl}
                      onChange={(e) =>
                        setSettings({ ...settings, instagramUrl: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-sm text-right bg-[#F3ECE0] border border-[#D4C5AA] rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                data-testid="admin-save-settings"
                className="px-6 py-3 text-sm font-bold text-[#FBF7F0] bg-[#182B22] hover:bg-[#223B2F] disabled:opacity-60 rounded-xl cursor-pointer"
              >
                {savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </form>
          )
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {editor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-editor-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E6DFD1] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EFEAE0] flex items-center justify-between">
              <h3 id="product-editor-title" className="text-base font-bold text-[#1B2620]">
                {editor.mode === 'create' ? 'إضافة منتج جديد' : 'تعديل بيانات المنتج'}
              </h3>
              <button
                type="button"
                aria-label="إغلاق نافذة المنتج"
                onClick={() => setEditor(null)}
                className="p-2 text-[#58685E] hover:bg-[#F5F1E8] rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              className="p-6 overflow-y-auto space-y-4 text-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3C4B42] mb-1">
                    اسم المنتج *
                  </label>
                  <input
                    type="text"
                    required
                    value={editor.name}
                    onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DFD8C8] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C4B42] mb-1">
                    القسم *
                  </label>
                  <select
                    value={editor.category}
                    onChange={(e) =>
                      setEditor({ ...editor, category: e.target.value as ProductCategory })
                    }
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DFD8C8] rounded-xl"
                  >
                    <option value="hair">العناية بالشعر</option>
                    <option value="skin">العناية بالبشرة</option>
                    <option value="body">الجسم واليدين</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3C4B42] mb-1">
                    الحجم *
                  </label>
                  <input
                    type="text"
                    required
                    value={editor.volume}
                    onChange={(e) => setEditor({ ...editor, volume: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DFD8C8] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C4B42] mb-1">
                    السعر قبل الخصم (ج.م) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editor.originalPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      const pct = settings?.openingDiscountPercent ?? 20;
                      const autoAfter =
                        Number.isFinite(num) && num > 0
                          ? String(Math.round(num * (1 - pct / 100)))
                          : editor.discountedPrice;
                      setEditor({ ...editor, originalPrice: val, discountedPrice: autoAfter });
                    }}
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DFD8C8] rounded-xl tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3C4B42] mb-1">
                    السعر بعد الخصم (ج.م) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editor.discountedPrice}
                    onChange={(e) =>
                      setEditor({ ...editor, discountedPrice: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DFD8C8] rounded-xl tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C4B42] mb-1">
                  مسار الصور (سطر لكل صورة، أو اختاري من صور الاستوديو)
                </label>
                <textarea
                  rows={2}
                  dir="ltr"
                  required
                  value={editor.imagesText}
                  onChange={(e) => setEditor({ ...editor, imagesText: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DFD8C8] rounded-xl text-xs"
                />
                <select
                  aria-label="اختيار صورة من مكتبة أوراجلو"
                  defaultValue=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setEditor({ ...editor, imagesText: e.target.value });
                  }}
                  className="mt-1.5 w-full px-3 py-1.5 text-xs bg-white border border-[#E2DACB] rounded-lg"
                >
                  <option value="">+ اختيار صورة جاهزة من صور الاستوديو</option>
                  {STUDIO_IMAGE_PRESETS.map((src) => (
                    <option key={src} value={src}>
                      {src.split('/').pop()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C4B42] mb-1">
                  الوصف والاستخدام
                </label>
                <textarea
                  rows={3}
                  value={editor.description}
                  onChange={(e) => setEditor({ ...editor, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DFD8C8] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C4B42] mb-1">
                  طريقة الاستخدام
                </label>
                <textarea
                  rows={2}
                  value={editor.usage}
                  onChange={(e) => setEditor({ ...editor, usage: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DFD8C8] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3C4B42] mb-1">
                  المكونات (مفصولة بفاصلة)
                </label>
                <input
                  type="text"
                  value={editor.ingredientsText}
                  onChange={(e) => setEditor({ ...editor, ingredientsText: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F4] border border-[#DFD8C8] rounded-xl"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1B2620] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editor.inStock}
                    onChange={(e) => setEditor({ ...editor, inStock: e.target.checked })}
                  />
                  المنتج متوفر حالياً
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1B2620] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editor.featured}
                    onChange={(e) => setEditor({ ...editor, featured: e.target.checked })}
                  />
                  عرض في قسم المختارات بالرئيسية
                </label>
              </div>

              <div className="pt-3 border-t border-[#EFEAE0] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#58685E] bg-[#F4EFE4] rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 text-xs font-bold text-[#FAF8F4] bg-[#1E3228] hover:bg-[#2A4437] disabled:opacity-60 rounded-xl cursor-pointer"
                >
                  {savingProduct ? 'جاري الحفظ...' : 'حفظ المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
