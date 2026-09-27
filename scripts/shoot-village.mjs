// Record shots of the village scene (needs the dev server on 5199: node_modules/.bin/vite --port 5199).
//   node scripts/shoot-village.mjs [name ...]
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:5199/hamlet.html';
const all = [
  ['3q', 'scene=village&clean&az=28&el=46&dist=48&tx=0&tz=1'],
  ['top', 'scene=village&clean&az=0&el=86&dist=34&tx=0&tz=0'],
  ['market', 'scene=village&clean&az=20&el=32&dist=11&tx=0.5&tz=-2.5'],
  ['inn', 'scene=village&clean&az=210&el=34&dist=9&tx=13.2&tz=7'],
  ['farm', 'scene=village&clean&az=160&el=38&dist=15&tx=-10.5&tz=8.5'],
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
  await page.screenshot({ path: `docs/village-mockups/render-${name}.png` });
  console.log('shot', name);
}
await browser.close();
