import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function crc32Buffer(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildStoreZip(entries: { name: string; data: Buffer }[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const crc = crc32Buffer(entry.data);
    const size = entry.data.length;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x5621, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(size, 18);
    localHeader.writeUInt32LE(size, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuf, entry.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x5621, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(size, 20);
    centralHeader.writeUInt32LE(size, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuf);

    offset += localHeader.length + nameBuf.length + size;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

function serveStaticArticlesPlugin(): Plugin {
  const rewriteArticles = (req: { url?: string }, res: { statusCode?: number; setHeader: (k: string, v: string) => void; end: (b: string | Buffer) => void }, next: () => void, rootDir: string) => {
    const cleanUrl = (req.url || '').split('?')[0];
    if (cleanUrl === '/articles' || cleanUrl.startsWith('/articles/')) {
      const normalized = cleanUrl.endsWith('/') ? `${cleanUrl}index.html` : `${cleanUrl}/index.html`;
      const targetPath = path.resolve(rootDir, normalized.replace(/^\//, ''));
      if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(fs.readFileSync(targetPath, 'utf8'));
        return;
      }
    }
    if (cleanUrl === '/auraglow-posters') {
      res.statusCode = 302;
      res.setHeader('Location', '/auraglow-posters/');
      res.end('');
      return;
    }
    if (cleanUrl === '/auraglow-posters/') {
      const targetPath = path.resolve(rootDir, 'auraglow-posters/index.html');
      if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(fs.readFileSync(targetPath, 'utf8'));
        return;
      }
    }
    if (cleanUrl === '/auraglow-stickers') {
      res.statusCode = 302;
      res.setHeader('Location', '/auraglow-stickers/');
      res.end('');
      return;
    }
    if (cleanUrl === '/auraglow-stickers/') {
      const targetPath = path.resolve(rootDir, 'auraglow-stickers/index.html');
      if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(fs.readFileSync(targetPath, 'utf8'));
        return;
      }
    }
    if (cleanUrl === '/auraglow-stickers/auraglow-all-22-stickers-individual.zip') {
      const indivDir = path.resolve(rootDir, 'auraglow-stickers/individual');
      if (fs.existsSync(indivDir) && fs.statSync(indivDir).isDirectory()) {
        const files = fs.readdirSync(indivDir).filter((f) => f.endsWith('.pdf')).sort();
        if (files.length > 0) {
          const entries = files.map((file, idx) => ({
            name: `Auraglow-Stickers/${String(idx + 1).padStart(2, '0')}-${file}`,
            data: fs.readFileSync(path.join(indivDir, file)),
          }));
          const zipBuf = buildStoreZip(entries);
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', 'attachment; filename="Auraglow-22-Individual-Stickers-PDF.zip"');
          res.setHeader('Content-Length', String(zipBuf.length));
          res.end(zipBuf);
          return;
        }
      }
    }
    next();
  };

  return {
    name: 'serve-static-articles',
    configureServer(server) {
      server.middlewares.use((req, res, next) =>
        rewriteArticles(req, res, next, path.resolve(__dirname, 'public'))
      );
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) =>
        rewriteArticles(req, res, next, path.resolve(__dirname, 'dist'))
      );
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [serveStaticArticlesPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/motion/')) {
              return 'vendor-motion';
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'vendor-icons';
            }
          },
        },
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
    },
  };
});
