// Record shots of the tavern scene (needs the dev server on 5199: node_modules/.bin/vite --port 5199).
//   node scripts/shoot-tavern.mjs [name ...]
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:5199/hamlet.html';
const all = [
  ['3q', 'scene=tavern&clean&az=35&el=44&dist=19&tx=0&tz=0'],
  ['top', 'scene=tavern&clean&az=0&el=86&dist=17&tx=0&tz=0'],
  ['fireplace', 'scene=tavern&clean&az=10&el=24&dist=6&tx=-3&tz=-2.6'],
  ['feast-table', 'scene=tavern&clean&az=30&el=40&dist=5.5&tx=-1&tz=1.2'],
  ['bar', 'scene=tavern&clean&az=20&el=30&dist=7&tx=4&tz=-1.8'],
];
const want = process.argv.slice(2);
const shots = want.length ? all.filter(([n]) => want.includes(n)) : all;

const browser = await chromium.launch({
  args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('page error:', msg.text());
});
for (const [name, query] of shots) {
  await page.goto(`${base}?${query}`);
  await page.waitForFunction('window.__hamletReady === true', { timeout: 120000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `docs/tavern-mockups/render-${name}.png` });
  console.log('shot', name);
}
await browser.close();
