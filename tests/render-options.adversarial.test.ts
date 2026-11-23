import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { createServer, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ROOT = '/home/daniebo/Desktop/forge-worktrees/sprouts-redesign';
const HEAVY_RUN = '/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh';
const PIN_NAME = `_flat-restore-pin-${process.pid}`;
const FIXTURE_PATH = join(ROOT, 'assets', `${PIN_NAME}.ts`);
const OUT_DIR = join(ROOT, 'out', PIN_NAME);
const GLB_PATH = join(OUT_DIR, `${PIN_NAME}.glb`);
const CACHE_DIR = join(
  ROOT,
  'measure/runs/chibi_sprouts_redesign_20261123',
  `vite-adversarial-cache-${process.pid}`,
);

let server: ViteDevServer | null = null;
let browser: Browser | null = null;
let page: Page | null = null;
let createdCache = false;
let createdFixture = false;
let ownsOutputPath = false;
let threeModuleUrl = '';

function pinSource(): string {
  return `import { defineAsset, sdf } from '../src/index.js';

export default defineAsset({
  name: '${PIN_NAME}',
  texture: false,
  build(k) {
    k.body('body', sdf.box([0.4, 1.0, 0.2]).at(0, 0.5, 0), { color: '#3f8fd0' });
  },
});
`;
}

function runForge(args: string): SpawnSyncReturns<string> {
  return spawnSync('bash', [HEAVY_RUN, '-c', `./forge ${args}`], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 600_000,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
  });
}

beforeAll(async () => {
  if (existsSync(OUT_DIR)) throw new Error(`fixture output path exists: ${OUT_DIR}`);
  try {
    writeFileSync(FIXTURE_PATH, pinSource(), { flag: 'wx' });
  } catch (error) {
    const e = error as NodeJS.ErrnoException;
    if (e.code === 'EEXIST') throw new Error(`fixture path exists: ${FIXTURE_PATH}`);
    throw error;
  }
  createdFixture = true;
  ownsOutputPath = true;
  const built = runForge(`build ${PIN_NAME} --fast`);
  if (built.status !== 0) throw new Error(built.stderr || built.stdout || 'fixture build failed');
  if (!existsSync(GLB_PATH)) throw new Error(`missing ${GLB_PATH}`);

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
  page.on('request', (request) => {
    const url = request.url();
    if (!threeModuleUrl && url.toLowerCase().includes('three')) threeModuleUrl = url;
  });
  await page.route('**/__forge/asset.glb*', (route) =>
    route.fulfill({ body: readFileSync(GLB_PATH), contentType: 'model/gltf-binary' }),
  );
  await page.goto(`${url}render.html`, { timeout: 180_000 });
  await page.waitForFunction(() => window.forge?.ready === true, undefined, { timeout: 180_000 });
}, 600_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
  if (createdCache) rmSync(CACHE_DIR, { recursive: true, force: true });
  if (createdFixture) rmSync(FIXTURE_PATH, { force: true });
  if (ownsOutputPath) rmSync(OUT_DIR, { recursive: true, force: true });
});

describe('flat render state restoration (same browser page)', () => {
  it('restores live mesh materials after the flat render pass', async () => {
    if (!page) throw new Error('render page did not start');
    if (!threeModuleUrl) throw new Error('Three.js module request was not found.');
    const materials = (await page.evaluate(`(async () => {
      const THREE = await import(${JSON.stringify(threeModuleUrl)});
      const proto = THREE.Mesh.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'material');
      const original = new WeakMap();
      const current = new WeakMap();
      const meshes = [];
      const isFlat = (material) =>
        Array.isArray(material)
          ? material.some((item) => item.type === 'MeshBasicMaterial')
          : material?.type === 'MeshBasicMaterial';
      Object.defineProperty(proto, 'material', {
        configurable: true,
        get() { return current.get(this); },
        set(value) {
          if (!original.has(this) && isFlat(value)) {
            original.set(this, current.get(this));
            meshes.push(this);
          }
          current.set(this, value);
        },
      });
      try {
        await window.forge.renderViews({
          glbUrl: '/__forge/asset.glb?restore-test=1',
          views: [{ name: 'front-level', azimuth: 0, elevation: 0 }],
          size: 128,
          background: 'none',
          ortho: true,
          flat: true,
        });
        return meshes.map((mesh) => ({
          restored: current.get(mesh) === original.get(mesh),
          type: mesh.material.type,
        }));
      } finally {
        if (descriptor) Object.defineProperty(proto, 'material', descriptor);
        else delete proto.material;
      }
    })()`)) as { restored: boolean; type: string }[];

    expect(materials.length).toBeGreaterThan(0);
    expect(materials.every((material) => material.restored)).toBe(true);
  }, 600_000);

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
