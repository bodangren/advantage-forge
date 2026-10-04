/**
 * The avatar portrait layers (docs/avatar-system.md, section 9): renders the base layers, every
 * piece, every hair style (full, capped, and tucked, in each hair color), and every head piece that
 * keeps the full hair over each style, of the avatar pack at the fixed portrait camera
 * (portrait.html, src/avatar-review/portraits.ts) into out/packs/avatar/<version>/:
 *
 *   portraits/<layer>.webp        the color: WebP with alpha, in the default colors
 *   portraits/<layer>.mask.webp   the tint mask: lossless WebP, opaque, R G B on top and A below
 *   portraits.json                the size, the camera, the draw order, and the files of each layer
 *
 * A client draws a loadout with `portraitPlan`, `recolorLayer`, and `stackLayers`
 * (src/apk3d/avatar/portrait.ts). Run it after scripts/avatar-pack.ts, which rewrites the pack folder.
 *
 *   node --import tsx scripts/avatar-portraits.ts            every layer
 *   node --import tsx scripts/avatar-portraits.ts base knight-helm avatar-hair-long.capped@teal
 *   node --import tsx scripts/avatar-portraits.ts --check    the starter portraits against 3D renders
 *   node --import tsx scripts/avatar-portraits.ts --hair     capped or tucked hair through each head piece
 *
 * A layer run fails when a layer is empty, touches the frame edge, or exceeds its budget. The check
 * composes each starter set from its layers (as a client does), renders the same loadout in 3D at
 * the portrait camera, prints the difference over the figure, and writes both side by side to
 * out/avatar-review/portrait-check.png. The hair check wears each hair style under each head piece
 * that caps or tucks the hair (the reduced GLBs of the pack) and counts the hair pixels inside the
 * piece silhouette from five views; more than HAIR_LIMIT in a view fails, and the worst view goes to
 * out/avatar-review/hair/<piece>+<style>.png (hair red, piece green, base blue, through yellow).
 * Deterministic: no timestamp.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright';
import sharp from 'sharp';
import { createServer } from 'vite';
import { AVATAR_PACK_VERSION, avatarPackPath } from '../src/apk3d/avatar/pack.js';
import { BASE_LAYERS, hairLayer, overHairLayer, PORTRAIT_CAMERA, PORTRAIT_ORDER, PORTRAIT_SIZE, portraitPlan, recolorLayer, stackLayers, type PortraitItem } from '../src/apk3d/avatar/portrait.js';
import { STARTER_SETS } from '../src/apk3d/avatar/starters.js';
import type { HairForm } from '../src/apk3d/avatar/hair.js';
import type { VariantTable } from '../src/apk3d/avatar/tint.js';
import type { HairCheckSpec, HairCheckView, LayerImage, LayerSpec, LoadoutSpec } from '../src/avatar-review/portraits.js';

const ROOT = process.cwd();
const DEST = join(ROOT, 'out', avatarPackPath());
/** A color layer under 48 KB, a mask under 24 KB (one avatar of eight layers stays near 500 KB). */
const BUDGET = { color: 48 * 1024, mask: 24 * 1024 } as const;
/** The check background (the review page figure color), and a pixel that differs by more than this is wrong. */
const BACKGROUND = [0xae, 0xb3, 0xba] as const;
const WRONG = 48;
const N = PORTRAIT_SIZE;

interface CatalogItem {
  id: string;
  slot: string;
  equip: { hides: string[]; hair: HairForm } | null;
  dyes: VariantTable | null;
  files: { model: string; capped?: string; tucked?: string };
}
interface Catalog {
  base: { variants: VariantTable | null };
  items: CatalogItem[];
}
type Index = { layers: Record<string, { color: string; mask: string }> };

const CHECK = process.argv.includes('--check');
const HAIR = process.argv.includes('--hair');
/**
 * Hair pixels inside a piece silhouette (of 1024 x 1024 for a 0.64 m head frame) that fail the hair
 * check: 100 pixels is a spot of about 6 x 6 mm, less than one pixel of a 128 px sprite.
 */
const HAIR_LIMIT = 100;
const catalog = JSON.parse(readFileSync(join(DEST, 'catalog.json'), 'utf8')) as Catalog;
const indexFile = join(DEST, 'portraits.json');

async function openPage(): Promise<{ page: Page; close: () => Promise<void> }> {
  const server = await createServer({
    root: ROOT,
    configFile: false,
    logLevel: 'error',
    optimizeDeps: { entries: ['portrait.html'] },
    server: { port: 5800 + Math.floor(Math.random() * 300), strictPort: false, hmr: false, watch: null },
  });
  await server.listen();
  const browser = await chromium.launch({ args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const close = async () => {
    await browser.close();
    await server.close();
  };
  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error(`[page] ${e.message}`));
    await page.goto(`${server.resolvedUrls!.local[0]}portrait.html`, { timeout: 180_000 });
    await page.waitForFunction(() => window.__portraitReady || window.__portraitError, undefined, { timeout: 180_000 });
    const failed = await page.evaluate(() => window.__portraitError);
    if (failed) throw new Error(failed);
    return { page, close };
  } catch (e) {
    await close();
    throw e;
  }
}

async function renderLayers(page: Page, only: string[]): Promise<string[]> {
  const styles = catalog.items.filter((i) => i.slot === 'hair');
  const specs: LayerSpec[] = [
    ...BASE_LAYERS.map((name): LayerSpec => ({ name, kind: 'base' })),
    ...catalog.items.flatMap((item): LayerSpec[] =>
      item.slot === 'hair'
        ? Object.keys(item.dyes?.slots.hair?.options ?? { default: 0 }).flatMap((color): LayerSpec[] => [
            { name: hairLayer(item.id, 'full', color), kind: 'hair', id: item.id, file: item.files.model, dyes: { hair: color } },
            ...(['capped', 'tucked'] as const).map((form): LayerSpec => ({ name: hairLayer(item.id, form, color), kind: 'hair', id: item.id, file: item.files[form]!, form, dyes: { hair: color } })),
          ])
        : [
            { name: item.id, kind: 'piece', id: item.id, file: item.files.model },
            // A head piece that keeps the full hair: one layer over each hair style.
            ...(item.slot === 'head' && item.equip?.hair === 'full'
              ? styles.map((style): LayerSpec => ({ name: overHairLayer(item.id, style.id), kind: 'piece', id: item.id, file: item.files.model, overHair: { id: style.id, file: style.files.model } }))
              : []),
          ],
    ),
  ];
  const todo = only.length > 0 ? specs.filter((s) => only.includes(s.name)) : specs;
  if (todo.length !== (only.length || specs.length)) throw new Error(`unknown layer(s): ${only.filter((n) => !specs.some((s) => s.name === n)).join(', ')}`);

  const errors: string[] = [];
  const layers: Index['layers'] = {};
  mkdirSync(join(DEST, 'portraits'), { recursive: true });
  for (const spec of todo) {
    const image: LayerImage = await page.evaluate((s) => window.renderPortraitLayer!(s), spec);
    const raw = (b64: string, height: number) => sharp(Buffer.from(b64, 'base64'), { raw: { width: N, height, channels: 4 } });
    const color = await raw(image.color, N).webp({ quality: 86, alphaQuality: 100, effort: 6 }).toBuffer();
    const mask = await raw(image.mask, N * 2).webp({ lossless: true, effort: 6 }).toBuffer();
    const files = { color: `portraits/${spec.name}.webp`, mask: `portraits/${spec.name}.mask.webp` };
    writeFileSync(join(DEST, files.color), color);
    writeFileSync(join(DEST, files.mask), mask);
    layers[spec.name] = files;
    const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`.padStart(8);
    console.log(`layer  ${spec.name.padEnd(34)} ${String(image.pixels).padStart(7)} px ${kb(color.length)} ${kb(mask.length)}${image.clipped ? '  CLIPPED' : ''}`);
    if (image.pixels === 0) errors.push(`${spec.name}: empty`);
    if (image.clipped) errors.push(`${spec.name}: touches the frame edge`);
    if (color.length > BUDGET.color) errors.push(`${spec.name}: color ${Math.round(color.length / 1024)} KB exceeds ${BUDGET.color / 1024} KB`);
    if (mask.length > BUDGET.mask) errors.push(`${spec.name}: mask ${Math.round(mask.length / 1024)} KB exceeds ${BUDGET.mask / 1024} KB`);
  }

  // A partial run adds to the layers of the last full run.
  const previous = only.length > 0 ? (JSON.parse(readFileSync(indexFile, 'utf8')) as Index).layers : {};
  const all = { ...previous, ...layers };
  const index = {
    version: AVATAR_PACK_VERSION,
    size: N,
    camera: PORTRAIT_CAMERA,
    order: PORTRAIT_ORDER,
    layers: Object.fromEntries(Object.keys(all).sort().map((k) => [k, all[k]!])),
  };
  writeFileSync(indexFile, `${JSON.stringify(index, null, 1)}\n`);
  console.log(`wrote  ${todo.length} layer(s), ${Object.keys(all).length} in ${indexFile}`);
  return errors;
}

/** RGBA pixels over the check background. */
const flatten = (px: Uint8ClampedArray) => {
  const out = new Uint8ClampedArray((px.length / 4) * 3);
  for (let i = 0, j = 0; i < px.length; i += 4, j += 3) {
    const a = px[i + 3]! / 255;
    for (let c = 0; c < 3; c++) out[j + c] = Math.round(px[i + c]! * a + BACKGROUND[c]! * (1 - a));
  }
  return out;
};

async function check(page: Page): Promise<string[]> {
  const index = JSON.parse(readFileSync(indexFile, 'utf8')) as Index;
  const items = new Map(catalog.items.map((i) => [i.id, i]));
  const pixels = async (file: string) => new Uint8ClampedArray(await sharp(join(DEST, file)).ensureAlpha().raw().toBuffer());
  const firstDyes = (item: CatalogItem) => (item.dyes ? Object.fromEntries(Object.entries(item.dyes.slots).map(([slot, s]) => [slot, Object.keys(s.options)[0]!])) : {});
  const itemOf = (id: string): PortraitItem => {
    const item = items.get(id)!;
    return { id, slot: item.slot, hides: item.equip!.hides, hair: item.equip!.hair, table: item.dyes, dyes: firstDyes(item) };
  };
  const fileOf = (id: string) => {
    const item = items.get(id)!;
    return { id, file: item.files.model, ...(item.files.capped ? { capped: item.files.capped } : {}), ...(item.files.tucked ? { tucked: item.files.tucked } : {}) };
  };

  const tiles: sharp.OverlayOptions[] = [];
  const errors: string[] = [];
  for (const [i, set] of STARTER_SETS.entries()) {
    const plan = portraitPlan({ base: catalog.base.variants, tints: set.tints, pieces: set.pieces.map(itemOf), defaultHair: itemOf('avatar-hair-swept') });
    const layers = await Promise.all(plan.map(async ({ layer, scales }) => recolorLayer(await pixels(index.layers[layer]!.color), await pixels(index.layers[layer]!.mask), scales)));
    const portrait = stackLayers(layers);
    const spec: LoadoutSpec = { tints: set.tints, pieces: set.pieces.map((id) => ({ ...fileOf(id), dyes: firstDyes(items.get(id)!) })), defaultHair: fileOf('avatar-hair-swept') };
    const reference = new Uint8ClampedArray(Buffer.from(await page.evaluate((s) => window.renderPortraitLoadout!(s), spec), 'base64'));

    // The difference over the figure: every pixel that either image covers.
    const a = flatten(portrait);
    const b = flatten(reference);
    let figure = 0;
    let sum = 0;
    let wrong = 0;
    for (let p = 0; p < N * N; p++) {
      if (portrait[p * 4 + 3] === 0 && reference[p * 4 + 3] === 0) continue;
      figure++;
      let worst = 0;
      for (let c = 0; c < 3; c++) {
        const d = Math.abs(a[p * 3 + c]! - b[p * 3 + c]!);
        sum += d / 3;
        worst = Math.max(worst, d);
      }
      if (worst > WRONG) wrong++;
    }
    const share = (100 * wrong) / figure;
    console.log(`check  ${set.id.padEnd(16)} ${String(plan.length).padStart(2)} layers  mean ${(sum / figure).toFixed(1).padStart(5)}  wrong ${share.toFixed(2).padStart(5)} %`);
    if (share > 2) errors.push(`${set.id}: ${share.toFixed(2)} % of the figure differs from the 3D render by more than ${WRONG}`);

    const tile = (rgb: Uint8ClampedArray) => sharp(Buffer.from(rgb), { raw: { width: N, height: N, channels: 3 } }).extract({ left: 96, top: 32, width: 320, height: 448 }).png().toBuffer();
    const x = (i % 5) * 660;
    const y = Math.floor(i / 5) * 480;
    const label = Buffer.from(`<svg width="640" height="28"><text x="6" y="20" font-family="sans-serif" font-size="18" font-weight="700">${set.id}: layers | 3D (${share.toFixed(1)} %)</text></svg>`);
    tiles.push({ input: await tile(a), left: x, top: y + 28 }, { input: await tile(b), left: x + 320, top: y + 28 }, { input: label, left: x, top: y });
  }
  const file = join(ROOT, 'out', 'avatar-review', 'portrait-check.png');
  mkdirSync(join(file, '..'), { recursive: true });
  await sharp({ create: { width: 5 * 660, height: 3 * 480, channels: 3, background: '#ffffff' } }).composite(tiles).png().toFile(file);
  console.log(`wrote  ${file}`);
  return errors;
}

async function hairCheck(page: Page): Promise<string[]> {
  const styles = catalog.items.filter((i) => i.slot === 'hair');
  const heads = catalog.items.filter((i) => i.slot === 'head' && (i.equip?.hair === 'capped' || i.equip?.hair === 'tucked'));
  const errors: string[] = [];
  for (const head of heads)
    for (const style of styles) {
      const spec: HairCheckSpec = { piece: { id: head.id, file: head.files.model }, style: { id: style.id, file: style.files.model, capped: style.files.capped!, tucked: style.files.tucked! } };
      const views: HairCheckView[] = await page.evaluate((s) => window.checkHairThrough!(s), spec);
      const worst = views.reduce((w, v) => (v.through > w.through ? v : w));
      console.log(`hair   ${head.id.padEnd(24)} ${style.id.padEnd(22)} ${views.map((v) => `${v.view} ${v.through}`).join(', ')}`);
      if (worst.through > HAIR_LIMIT) {
        errors.push(`${head.id} over ${style.id}: ${worst.through} hair pixels through the piece (${worst.view} view)`);
        const file = join(ROOT, 'out', 'avatar-review', 'hair', `${head.id}+${style.id}.png`);
        mkdirSync(join(file, '..'), { recursive: true });
        await sharp(Buffer.from(worst.image, 'base64'), { raw: { width: 512, height: 512, channels: 4 } }).flip().png().toFile(file);
      }
    }
  console.log(`checked ${heads.length} head pieces x ${styles.length} styles`);
  return errors;
}

const { page, close } = await openPage();
let errors: string[];
try {
  errors = HAIR ? await hairCheck(page) : CHECK ? await check(page) : await renderLayers(page, process.argv.slice(2).filter((a) => !a.startsWith('-')));
} finally {
  await close();
}
for (const e of errors) console.error(`fail   ${e}`);
if (errors.length > 0) process.exit(1);
