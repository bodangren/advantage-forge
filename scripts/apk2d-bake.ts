/**
 * Bakes the 2D backgrounds: each game's static set, rendered from its 3D set code with the 2D
 * camera (orthographic, elevation 45, 64 pixels per meter). Writes
 * out/apk2d/backgrounds/<game>/{background.png, background.json} (the projection);
 * scripts/apk2d-pack.ts turns them into APK sprite packs.
 *
 *   node --import tsx scripts/apk2d-bake.ts [game ...]     (default: every game with a bake set)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const ROOT = process.cwd();
const GAMES = ['potion-rush', 'dungeon-liberator', 'devourer-slime', 'hero-vs-zombie'];
export const ELEVATION = 45;
export const PPM = 64;

const games = process.argv.slice(2).length ? process.argv.slice(2) : GAMES;
const server = await createServer({ configFile: join(ROOT, 'vite.demo.config.ts'), logLevel: 'error', server: { port: 5190 + Math.floor(Math.random() * 200), strictPort: false, hmr: false } });
await server.listen();
const url = server.resolvedUrls!.local[0]!;
const browser = await chromium.launch({ args: ['--use-angle=gl', '--enable-unsafe-swiftshader'] });
for (const game of games) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error(`${game}: ${e.message}`));
  await page.goto(`${url}bake.html?game=${game}&el=${ELEVATION}&ppm=${PPM}`, { timeout: 180_000 });
  await page.waitForFunction(() => (window as any).__bake || (window as any).__bakeError, undefined, { timeout: 300_000, polling: 500 });
  const result = await page.evaluate(() => (window as any).__bake ?? { error: (window as any).__bakeError });
  if (result.error) throw new Error(`${game}: ${result.error}`);
  const dir = join(ROOT, 'out', 'apk2d', 'backgrounds', game);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'background.png'), Buffer.from(result.png.split(',')[1], 'base64'));
  writeFileSync(join(dir, 'background.json'), JSON.stringify(result.projection, null, 2) + '\n');
  console.log(`bake   ${game}  ${result.projection.width}x${result.projection.height}`);
  await page.close();
}
await browser.close();
await server.close();
