/**
 * The Monster Encounters demo: a static site for GitHub Pages.
 *
 *   node_modules/.bin/vite --config vite.demo.config.ts            dev server
 *   node_modules/.bin/vite build --config vite.demo.config.ts      static build in dist-demo/
 *
 * The page lives in demo/ (demo/index.html, demo/public/ for models and stories); its code is in
 * src/host/ (demo/main.ts imports it). A relative base path lets the build work under any Pages subpath.
 *
 * The dev server also serves tests/fixtures/ at /tests/fixtures/, for `?qc=1&stories=fixtures`
 * (src/host/main.ts). The build does not carry the fixtures.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./demo', import.meta.url));
const FIXTURES = fileURLToPath(new URL('./tests/fixtures', import.meta.url));

const FIXTURE_TYPES: Record<string, string> = {
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
};

/** Dev server only: the test stories at /tests/fixtures/ (without it, the page answers the path). */
function serveFixtures(): Plugin {
  return {
    name: 'qc-fixtures',
    configureServer(server) {
      server.middlewares.use('/tests/fixtures/', (req, res, next) => {
        const rel = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
        const file = normalize(join(FIXTURES, rel));
        if (!file.startsWith(FIXTURES + sep) || !existsSync(file) || !statSync(file).isFile()) return next();
        res.setHeader('content-type', FIXTURE_TYPES[extname(file)] ?? 'application/octet-stream');
        res.end(readFileSync(file));
      });
    },
  };
}

export default defineConfig({
  root,
  base: './',
  publicDir: 'public',
  plugins: [serveFixtures()],
  server: { host: '127.0.0.1', port: 5190, fs: { allow: ['..'] } },
  // Phaser loads lazily (2D views only); pre-bundle it so the first 2D mount does not re-optimize.
  optimizeDeps: { include: ['phaser'] },
  build: {
    outDir: fileURLToPath(new URL('./dist-demo', import.meta.url)),
    emptyOutDir: true,
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
  },
});
