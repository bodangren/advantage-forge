import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ROOT = '/home/daniebo/Desktop/forge-worktrees/sprouts-redesign';
const CACHE_DIR = join(
  ROOT,
  'measure/runs/chibi_sprouts_redesign_20261123',
  `vite-adversarial-cache-${process.pid}`,
);

let server: ViteDevServer | null = null;
let browser: Browser | null = null;
let page: Page | null = null;
let createdCache = false;

beforeAll(async () => {
  mkdirSync(CACHE_DIR);
  createdCache = true;
  server = await createServer({
    root: ROOT,
    configFile: false,
    logLevel: 'error',
    cacheDir: CACHE_DIR,
    optimizeDeps: { entries: ['render.html'] },
    server: { port: 0, strictPort: false, hmr: false, watch: null },
  });
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error('Could not start the render server.');

  browser = await chromium.launch({
    args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
  });
  page = await browser.newPage();
  await page.goto(`${url}render.html`, { timeout: 180_000 });
  await page.waitForFunction(() => window.forge?.ready === true, undefined, { timeout: 180_000 });
}, 600_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
  if (createdCache) rmSync(CACHE_DIR, { recursive: true, force: true });
});

describe('flat render state restoration (same browser page)', () => {
  it('restores the original material and ground visibility', async () => {
    if (!page) throw new Error('render page did not start');
    const state = (await page.evaluate(`(async () => {
      const THREE = await import('/node_modules/.vite/deps/three.js');
      const { useFlatMaterials } = await import('/src/render/page.ts');
      const root = new THREE.Group();
      const mesh = new THREE.Mesh(
        new THREE.BufferGeometry(),
        new THREE.MeshStandardMaterial({ color: '#3f8fd0' }),
      );
      const ground = new THREE.Object3D();
      root.add(mesh);
      ground.visible = true;
      const original = mesh.material;
      const restore = useFlatMaterials(root, ground);
      const swapped = mesh.material !== original;
      const flatIsUnlit = mesh.material.toneMapped === false;
      restore();
      return {
        swapped,
        flatIsUnlit,
        materialRestored: mesh.material === original,
        groundRestored: ground.visible,
      };
    })()`)) as {
      swapped: boolean;
      flatIsUnlit: boolean;
      materialRestored: boolean;
      groundRestored: boolean;
    };

    expect(state.swapped).toBe(true);
    expect(state.flatIsUnlit).toBe(true);
    expect(state.materialRestored).toBe(true);
    expect(state.groundRestored).toBe(true);
  }, 600_000);
});
