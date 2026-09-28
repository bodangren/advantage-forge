/**
 * The Monster Encounters demo: a static site for GitHub Pages.
 *
 *   node_modules/.bin/vite --config vite.demo.config.ts            dev server
 *   node_modules/.bin/vite build --config vite.demo.config.ts      static build in dist-demo/
 *
 * The page lives in demo/ (demo/index.html, demo/public/ for models and stories); its code is in
 * src/host/ (demo/main.ts imports it). A relative base path lets the build work under any Pages subpath.
 */
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./demo', import.meta.url));

export default defineConfig({
  root,
  base: './',
  publicDir: 'public',
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
