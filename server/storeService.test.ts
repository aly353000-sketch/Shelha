import test from 'node:test';
import assert from 'node:assert/strict';
import { StoreRepository, sanitizeImagePath } from './storeDb.ts';
import {
  hashPasswordScrypt,
  issueAdminToken,
  revokeAdminToken,
  verifyAdminToken,
  verifyPasswordScrypt,
} from './auth.ts';

test('StoreRepository seeds all 19 official Auraglow products with exact prices and medical-claims-free copy', () => {
  const repo = new StoreRepository(':memory:');
  try {
    const products = repo.listProducts();
    assert.equal(products.length, 19);

    assert.equal(products.filter((p) => p.category === 'hair').length, 7);
    assert.equal(products.filter((p) => p.category === 'skin').length, 9);
    assert.equal(products.filter((p) => p.category === 'body').length, 3);

    const expectedPairs = [
      ['شامبو ضد التساقط', 180, 144],
      ['شامبو ضد القشرة', 180, 144],
      ['ماسك ترميم', 220, 176],
      ['كريم الشعر الجاف', 150, 120],
      ['بالم الشعر بالزبد', 180, 144],
      ['ميكس زيوت تكثيف', 220, 176],
      ['لوشن قشرة', 80, 64],
      ['غسول جل بشرة عادية وجافة', 150, 120],
      ['غسول جل بشرة دهنية', 150, 120],
      ['تونر عادية وجافة', 130, 104],
      ['تونر دهنية ومختلطة', 130, 104],
      ['كريم مرطب عادية وجافة', 130, 104],
      ['كريم مرطب دهنية (جل مرطب)', 150, 120],
      ['صن سكرين 70', 190, 152],
      ['سيروم تفتيح', 190, 152],
      ['ليب بالم', 70, 56],
      ['جل دش (فراولة، خوخ، لافندر)', 130, 104],
      ['بادي باتر (توت بري، مسك، رمان)', 140, 112],
      ['هاند كريم (مينت، أصفر، بينك)', 130, 104],
    ] as const;

    expectedPairs.forEach(([name, orig, disc], i) => {
      assert.equal(products[i].name, name);
      assert.equal(products[i].originalPrice, orig);
      assert.equal(products[i].discountedPrice, disc);
      assert.ok(products[i].ingredients.length >= 3);
      assert.ok(products[i].usage.length > 5);
      // Verify no medical treatment claims remain
      assert.doesNotMatch(products[i].description, /علاجي|لعلاج|يعالج|مضمون/);
    });
  } finally {
    repo.close();
  }
});

test('StoreRepository calculates server-side totals, free shipping at 3+ items, and supports product CRUD & order status updates', () => {
  const repo = new StoreRepository(':memory:');
  try {
    // 3 items -> free shipping
    const order = repo.createOrder({
      customerName: 'مريم حسن',
      customerPhone: '01098765432',
      governorate: 'الجيزة',
      address: 'الدقي - شارع التحرير عمارة 12',
      notes: 'توصيل بعد العصر',
      items: [
        { productId: 'brightening-serum', quantity: 1 }, // 152
        { productId: 'shower-gel', variantLabel: 'خوخ', quantity: 2 }, // 208
      ],
    });
    assert.equal(order.orderCode, 'AG-1001');
    assert.equal(order.totalItemsCount, 3);
    assert.equal(order.subtotalFinal, 360);
    assert.equal(order.shippingFee, 0);
    assert.equal(order.grandTotal, 360);

    const updatedOrder = repo.updateOrderStatus(order.id, 'confirmed');
    assert.equal(updatedOrder?.status, 'confirmed');

    // Toggle opening discount OFF -> next order charges original price + shipping for < 3 items
    repo.updateSettings({ openingDiscountEnabled: false });
    const order2 = repo.createOrder({
      customerName: 'نور طارق',
      customerPhone: '01122334455',
      governorate: 'الإسكندرية',
      address: 'سموحة - شارع فوزي معاذ',
      items: [{ productId: 'lip-balm', quantity: 1 }], // 70 original + 60 shipping = 130
    });
    assert.equal(order2.subtotalFinal, 70);
    assert.equal(order2.shippingFee, 60);
    assert.equal(order2.grandTotal, 130);

    // Product CRUD
    const created = repo.createProduct({
      name: 'ماسك الطمي المغربي',
      category: 'skin',
      volume: '100 جم',
      originalPrice: 160,
      discountedPrice: 128,
      images: ['/assets/auraglow/studio/11_cream_normal_dry.jpg'],
      description: 'ماسك لطيف للعناية الأسبوعية بالبشرة.',
      usage: 'يوضع لمدة 10 دقائق ثم يشطف بالماء الفاتر.',
      ingredients: ['Moroccan Clay', 'Rose Water'],
      inStock: true,
    });
    assert.ok(repo.getProductById(created.id));
    assert.equal(repo.deleteProduct(created.id), true);
    assert.equal(repo.getProductById(created.id), null);

    // URL sanitizer blocks javascript: and data:
    assert.equal(sanitizeImagePath('javascript:alert(1)'), null);
    assert.equal(sanitizeImagePath('data:text/html,<script>'), null);
    assert.equal(sanitizeImagePath('/assets/auraglow/studio/01_shampoo_hair_loss.jpg'), '/assets/auraglow/studio/01_shampoo_hair_loss.jpg');
  } finally {
    repo.close();
  }
});

test('scrypt password hashing, setup-once lock, and Bearer token verification/revocation', () => {
  const repo = new StoreRepository(':memory:');
  try {
    const hash = hashPasswordScrypt('AuraPass2026!');
    assert.equal(verifyPasswordScrypt('AuraPass2026!', hash), true);
    assert.equal(verifyPasswordScrypt('WrongPass', hash), false);

    assert.equal(repo.claimAdminPasswordHash(hash), true);
    // Second claim must fail atomically
    assert.equal(repo.claimAdminPasswordHash(hashPasswordScrypt('OtherPass')), false);

    const token = issueAdminToken();
    assert.equal(verifyAdminToken(token).valid, true);
    revokeAdminToken(token);
    assert.equal(verifyAdminToken(token).valid, false);
  } finally {
    repo.close();
  }
});

test('bulkUpdateProductPrices updates seeded products while preserving historical order prices, and tracks unread orders & teaser settings', () => {
  const repo = new StoreRepository(':memory:');
  try {
    // Default teaser settings exist
    const initialSettings = repo.getSettings();
    assert.equal(initialSettings.teaserEnabled, true);
    assert.equal(initialSettings.teaserTitle, 'قريبًا في أوراجلو ✨');
    assert.match(initialSettings.teaserBarText, /مفاجآت أوراجلو/);

    // Place an order at original seeded prices: hair-loss-shampoo (180 -> 144) x 3 = 432 (free shipping)
    const firstOrder = repo.createOrder({
      customerName: 'هدى سامي',
      customerPhone: '01011223344',
      governorate: 'القاهرة',
      address: 'المعادي - شارع 9',
      items: [{ productId: 'hair-loss-shampoo', quantity: 3 }],
    });
    assert.equal(firstOrder.isRead, false);
    assert.equal(firstOrder.grandTotal, 432);
    assert.equal(firstOrder.items[0].unitOriginalPrice, 180);
    assert.equal(firstOrder.items[0].unitFinalPrice, 144);

    // Bulk update prices for existing seeded products
    const updatedProducts = repo.bulkUpdateProductPrices([
      { id: 'hair-loss-shampoo', originalPrice: 210, discountedPrice: 168 },
      { id: 'lip-balm', originalPrice: 90, discountedPrice: 72 },
    ]);
    const updatedShampoo = updatedProducts.find((p) => p.id === 'hair-loss-shampoo');
    const updatedBalm = updatedProducts.find((p) => p.id === 'lip-balm');
    assert.equal(updatedShampoo?.originalPrice, 210);
    assert.equal(updatedShampoo?.discountedPrice, 168);
    assert.equal(updatedBalm?.originalPrice, 90);
    assert.equal(updatedBalm?.discountedPrice, 72);

    // Reject invalid bulk price where discountedPrice > originalPrice
    assert.throws(() => {
      repo.bulkUpdateProductPrices([
        { id: 'hair-loss-shampoo', originalPrice: 100, discountedPrice: 150 },
      ]);
    });

    // Historical order MUST retain its exact original prices & total
    const ordersAfterPriceEdit = repo.listOrders();
    const preservedOrder = ordersAfterPriceEdit.find((o) => o.id === firstOrder.id);
    assert.ok(preservedOrder);
    assert.equal(preservedOrder.grandTotal, 432);
    assert.equal(preservedOrder.items[0].unitOriginalPrice, 180);
    assert.equal(preservedOrder.items[0].unitFinalPrice, 144);

    // New order after bulk price change uses the NEW prices (168 * 3 = 504)
    const secondOrder = repo.createOrder({
      customerName: 'سلمى عادل',
      customerPhone: '01233445566',
      governorate: 'الإسكندرية',
      address: 'ستانلي - الكورنيش',
      items: [{ productId: 'hair-loss-shampoo', quantity: 3 }],
    });
    assert.equal(secondOrder.grandTotal, 504);
    assert.equal(secondOrder.isRead, false);

    // Unread sorting: mark secondOrder read -> firstOrder (unread) sorts first
    repo.markOrderRead(secondOrder.id, true);
    const sortedOrders = repo.listOrders();
    assert.equal(sortedOrders[0].id, firstOrder.id);
    assert.equal(sortedOrders[0].isRead, false);
    assert.equal(sortedOrders[1].id, secondOrder.id);
    assert.equal(sortedOrders[1].isRead, true);

    // Mark all read
    repo.markAllOrdersRead();
    assert.equal(repo.listOrders().filter((o) => !o.isRead).length, 0);

    // Teaser settings update
    const updatedSettings = repo.updateSettings({
      teaserEnabled: false,
      teaserTitle: 'قريبًا مفاجآت الصيف ✨',
      teaserSubtitle: 'مجموعة جديدة قريبًا.',
      teaserBarText: 'انتظرونا قريبًا',
    });
    assert.equal(updatedSettings.teaserEnabled, false);
    assert.equal(updatedSettings.teaserTitle, 'قريبًا مفاجآت الصيف ✨');
    assert.equal(updatedSettings.teaserBarText, 'انتظرونا قريبًا');
  } finally {
    repo.close();
  }
});

