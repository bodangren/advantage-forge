/**
 * Screenshots and the frame rate of the avatar review page (avatar.html, src/avatar-review/main.ts)
 * for the evidence of the avatar track.
 *
 *   node --import tsx scripts/avatar-review.ts out/avatar-review/idle.png                  the starter sets in idle
 *   node --import tsx scripts/avatar-review.ts out/avatar-review/walk.png "clip=walk&t=0.3"
 *   node --import tsx scripts/avatar-review.ts out/avatar-review/portraits.png portraits
 *   node --import tsx scripts/avatar-review.ts - bench=30                                   the frame rate only
 *
 * Prints the loadout errors and, for `bench`, the mean frame rate over 5 s. Uses the real GPU when
 * there is one (as the forge renders do); FORGE_GL=software forces SwiftShader.
 */
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import type {} from '../src/avatar-review/main.js';

const [file = '-', query = ''] = process.argv.slice(2);
const server = await createServer({
  root: process.cwd(),
  configFile: false,
  logLevel: 'error',
  optimizeDeps: { entries: ['avatar.html'] },
  server: { port: 6100 + Math.floor(Math.random() * 300), strictPort: false, hmr: false, watch: null },
});
await server.listen();
const gpu = process.env.FORGE_GL === 'software' ? ['--enable-unsafe-swiftshader'] : ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'];
const browser = await chromium.launch({ args: gpu });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', (e) => console.error(`[page] ${e.message}`));
  await page.goto(`${server.resolvedUrls!.local[0]}avatar.html?${query}`, { timeout: 180_000 });
  await page.waitForFunction(() => window.__avatarReady === true, undefined, { timeout: 300_000 });
  const errors = await page.evaluate(() => window.__avatarErrors ?? []);
  for (const e of errors) console.error(`loadout ${e}`);
  console.log(`bar    ${await page.locator('#bar').textContent()}`);
  if (query.includes('bench')) {
    await page.waitForFunction(() => window.__avatarFps !== undefined, undefined, { timeout: 60_000 });
    const { fps, load } = await page.evaluate(() => ({ fps: window.__avatarFps!, load: window.__avatarLoad! }));
    console.log(`fps    ${fps.toFixed(1)} (${load.calls} draw calls, ${load.triangles} triangles in a frame)`);
  }
  if (file !== '-') {
    mkdirSync(dirname(file), { recursive: true });
    await page.screenshot({ path: file, fullPage: query.includes('portraits') });
    console.log(`wrote  ${file}`);
  }
  if (errors.length > 0) process.exitCode = 1;
} finally {
  await browser.close();
  await server.close();
}
