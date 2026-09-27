// Record shots of the blacksmith shop scene (needs the dev server on 5199: node_modules/.bin/vite --port 5199).
//   node scripts/shoot-blacksmith.mjs [name ...]
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:5199/hamlet.html';
const all = [
  ['3q', 'scene=blacksmith&clean&az=35&el=42&dist=15&tx=0&tz=-0.3'],
  ['top', 'scene=blacksmith&clean&az=0&el=86&dist=14&tx=0&tz=0'],
  ['forge', 'scene=blacksmith&clean&az=15&el=25&dist=6&tx=-2&tz=-1.6'],
  ['anvil', 'scene=blacksmith&clean&az=40&el=30&dist=5&tx=0.4&tz=-0.3'],
];
const want = process.argv.slice(2);
const shots = want.length ? all.filter(([n]) => want.includes(n)) : all;

const browser = await chromium.launch({
  args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
page.setDefaultTimeout(180000);
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('page error:', msg.text());
});
for (const [name, query] of shots) {
  await page.goto(`${base}?${query}`);
  await page.waitForFunction('window.__hamletReady === true', { timeout: 120000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `docs/blacksmith-mockups/render-${name}.png` });
  console.log('shot', name);
}
await browser.close();
