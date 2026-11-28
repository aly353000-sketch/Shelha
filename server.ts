import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import path from 'node:path';
import {
  clearFailedLogins,
  extractBearerToken,
  getEnvAdminPassword,
  hashPasswordScrypt,
  isRateLimited,
  issueAdminToken,
  recordFailedLogin,
  revokeAdminToken,
  verifyAdminToken,
  verifyPasswordScrypt,
  verifyPlaintextConstantTime,
} from './server/auth.ts';
import { StoreRepository } from './server/storeDb.ts';
import type { OrderStatus } from './src/types/store.ts';

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const repo = new StoreRepository();
const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);
  const check = verifyAdminToken(token);
  if (!check.valid) {
    res.status(401).json({ error: 'يرجى تسجيل الدخول إلى لوحة التحكم أولاً.' });
    return;
  }
  next();
}

// ==================== PUBLIC STOREFRONT API ====================

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/storefront', (_req, res) => {
  res.json({
    products: repo.listProducts(),
    settings: repo.getSettings(),
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = repo.getProductById(String(req.params.id));
  if (!product) {
    res.status(404).json({ error: 'المنتج غير موجود.' });
    return;
  }
  res.json({ product, settings: repo.getSettings() });
});

app.post('/api/orders', (req, res) => {
  try {
    const order = repo.createOrder(req.body);
    res.status(201).json({ order, settings: repo.getSettings() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'تعذر تسجيل الطلب.';
    res.status(400).json({ error: message });
  }
});

// ==================== ADMIN AUTH API ====================

app.get('/api/admin/auth/status', (req, res) => {
  const envPass = getEnvAdminPassword();
  const dbHash = repo.getAdminPasswordHash();
  const token = extractBearerToken(req.headers.authorization);
  const authCheck = verifyAdminToken(token);

  res.json({
    isConfigured: Boolean(envPass || dbHash),
    usesEnvSecret: Boolean(envPass),
    authenticated: authCheck.valid,
  });
});

app.post('/api/admin/auth/setup', (req, res) => {
  const envPass = getEnvAdminPassword();
  if (envPass || repo.getAdminPasswordHash()) {
    res.status(409).json({ error: 'تم إعداد كلمة مرور لوحة التحكم مسبقاً.' });
    return;
  }

  const password = String(req.body?.password ?? '').trim();
  if (password.length < 6 || password.length > 100) {
    res.status(400).json({ error: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.' });
    return;
  }

  const hash = hashPasswordScrypt(password);
  const claimed = repo.claimAdminPasswordHash(hash);
  if (!claimed) {
    res.status(409).json({ error: 'تم إعداد كلمة مرور لوحة التحكم مسبقاً.' });
    return;
  }

  const token = issueAdminToken();
  res.status(201).json({ token });
});

app.post('/api/admin/auth/login', (req, res) => {
  const clientKey = req.ip || 'unknown';
  if (isRateLimited(clientKey)) {
    res.status(429).json({
      error: 'محاولات دخول كثيرة خاطئة. يرجى الانتظار بضع دقائق ثم المحاولة مجدداً.',
    });
    return;
  }

  const password = String(req.body?.password ?? '').trim();
  if (!password) {
    res.status(400).json({ error: 'يرجى إدخال كلمة المرور.' });
    return;
  }

  const envPass = getEnvAdminPassword();
  const dbHash = repo.getAdminPasswordHash();

  if (!envPass && !dbHash) {
    res.status(400).json({ error: 'لم يتم إعداد كلمة مرور بعد. قومي بإعدادها أولاً.' });
    return;
  }

  const valid = envPass
    ? verifyPlaintextConstantTime(password, envPass)
    : dbHash
      ? verifyPasswordScrypt(password, dbHash)
      : false;

  if (!valid) {
    recordFailedLogin(clientKey);
    res.status(401).json({ error: 'كلمة المرور غير صحيحة.' });
    return;
  }

  clearFailedLogins(clientKey);
  const token = issueAdminToken();
  res.json({ token });
});

app.post('/api/admin/auth/logout', (req, res) => {
  const token = extractBearerToken(req.headers.authorization);
  revokeAdminToken(token);
  res.json({ ok: true });
});

// ==================== PROTECTED ADMIN API ====================

app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
  res.json({
    products: repo.listProducts(),
    orders: repo.listOrders(),
    settings: repo.getSettings(),
  });
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  try {
    const product = repo.createProduct(req.body);
    res.status(201).json({ product });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'تعذر إضافة المنتج.';
    res.status(400).json({ error: message });
  }
});

app.put('/api/admin/products/prices', requireAdmin, (req, res) => {
  try {
    const products = repo.bulkUpdateProductPrices(req.body?.items);
    res.json({ products });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'تعذر حفظ الأسعار الجديدة.';
    res.status(400).json({ error: message });
  }
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  try {
    const updated = repo.updateProduct(String(req.params.id), req.body);
    if (!updated) {
      res.status(404).json({ error: 'المنتج غير موجود.' });
      return;
    }
    res.json({ product: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'تعذر تعديل المنتج.';
    res.status(400).json({ error: message });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const deleted = repo.deleteProduct(String(req.params.id));
  if (!deleted) {
    res.status(404).json({ error: 'المنتج غير موجود.' });
    return;
  }
  res.json({ ok: true });
});

app.post('/api/admin/orders/mark-all-read', requireAdmin, (_req, res) => {
  repo.markAllOrdersRead();
  res.json({ orders: repo.listOrders() });
});

app.patch('/api/admin/orders/:id/read', requireAdmin, (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    res.status(400).json({ error: 'رقم الطلب غير صالح.' });
    return;
  }
  const updated = repo.markOrderRead(orderId, req.body?.isRead !== false);
  if (!updated) {
    res.status(404).json({ error: 'الطلب غير موجود.' });
    return;
  }
  res.json({ order: updated });
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      res.status(400).json({ error: 'رقم الطلب غير صالح.' });
      return;
    }
    const updated = repo.updateOrderStatus(orderId, req.body?.status as OrderStatus);
    if (!updated) {
      res.status(404).json({ error: 'الطلب غير موجود.' });
      return;
    }
    res.json({ order: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'تعذر تحديث حالة الطلب.';
    res.status(400).json({ error: message });
  }
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  try {
    const settings = repo.updateSettings(req.body ?? {});
    res.json({ settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'تعذر تحديث الإعدادات.';
    res.status(400).json({ error: message });
  }
});

// ==================== FRONTEND SERVING (DEV VITE / PROD DIST) ====================

async function startServer(): Promise<void> {
  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const fs = await import('node:fs');
    const zlib = await import('node:zlib');
    const distDir = path.resolve(process.cwd(), 'dist');

    const compressibleRe = /\.(html|js|mjs|css|svg|json|xml|txt|webmanifest)$/i;
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.json': 'application/json; charset=utf-8',
      '.xml': 'application/xml; charset=utf-8',
      '.txt': 'text/plain; charset=utf-8',
      '.webmanifest': 'application/manifest+json; charset=utf-8',
    };

    const sendCompressedOrFile = (req: Request, res: Response, filePath: string, cacheControl: string) => {
      res.setHeader('Cache-Control', cacheControl);
      const ext = path.extname(filePath).toLowerCase();
      const acceptEncoding = String(req.headers['accept-encoding'] || '');
      if (req.method === 'GET' && compressibleRe.test(ext) && acceptEncoding.includes('gzip')) {
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        fs.createReadStream(filePath).pipe(zlib.createGzip({ level: 6 })).pipe(res);
        return;
      }
      res.sendFile(filePath);
    };

    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next();
        return;
      }
      const cleanPath = req.path === '/' ? '/index.html' : req.path;
      const isArticleRoute = cleanPath === '/articles' || cleanPath.startsWith('/articles/');
      const candidateRel = isArticleRoute
        ? (cleanPath.endsWith('/') ? `${cleanPath}index.html` : `${cleanPath}/index.html`).replace(/^\//, '')
        : cleanPath.replace(/^\//, '');
      const resolved = path.resolve(distDir, candidateRel);
      if (!resolved.startsWith(distDir + path.sep) && resolved !== path.join(distDir, 'index.html')) {
        next();
        return;
      }
      if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
        const isHashedAsset = cleanPath.startsWith('/assets/') && /-[a-zA-Z0-9_-]{6,}\.(js|css)$/.test(cleanPath);
        const cacheControl = isHashedAsset
          ? 'public, max-age=31536000, immutable'
          : cleanPath.endsWith('.html') || isArticleRoute
            ? 'public, max-age=300'
            : 'public, max-age=604800';
        sendCompressedOrFile(req, res, resolved, cacheControl);
        return;
      }
      next();
    });

    app.use(express.static(distDir, { maxAge: '7d' }));
    app.get('/{*splat}', (req, res) => {
      sendCompressedOrFile(req, res, path.join(distDir, 'index.html'), 'public, max-age=300');
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Royal Movers VIP server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Royal Movers VIP server:', err);
  process.exit(1);
});
