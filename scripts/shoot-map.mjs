// Shoot views of a sample map. Needs a dev server (node_modules/.bin/vite --port 5199).
//   node scripts/shoot-map.mjs <outdir> <name>=<query> ...
//   example: node scripts/shoot-map.mjs /tmp/shots 'top=scene=forest&clean&az=0&el=88&dist=36&tx=0&tz=0'
// FORGE_SHOT_BASE overrides the page URL. Each view gets two attempts; the status line is printed.
import { chromium } from 'playwright';
const base = process.env.FORGE_SHOT_BASE ?? 'http://127.0.0.1:5199/hamlet.html';
const [outdir, ...specs] = process.argv.slice(2);
const browser = await chromium.launch({
  args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
page.setDefaultTimeout(240000);
page.on('console', (msg) => { if (msg.type() === 'error') console.log('page error:', msg.text()); });
for (const spec of specs) {
  const i = spec.indexOf('=');
  const name = spec.slice(0, i), query = spec.slice(i + 1);
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await page.goto(`${base}?${query}`);
      await page.waitForFunction('window.__hamletReady === true', { timeout: 240000 });
      await page.waitForTimeout(1500);
      const status = await page.evaluate(() => document.querySelector('#status, .status, [data-status]')?.textContent ?? '');
      await page.screenshot({ path: `${outdir}/${name}.png` });
      console.log('shot', name, status.trim().slice(0, 200));
      break;
    } catch (e) {
      console.log('fail', name, attempt, String(e).slice(0, 200));
    }
  }
}
await browser.close();
