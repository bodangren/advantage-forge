import { chromium } from 'playwright';

const base = 'http://127.0.0.1:5199/hamlet.html';
const shots = [
  ['3q', 'scene=tavern&clean&az=25&el=50&dist=20&tx=3&tz=2'],
  ['top', 'scene=tavern&clean&az=0&el=85&dist=24&tx=3&tz=2'],
  ['fireplace', 'scene=tavern&clean&az=180&el=25&dist=8&tx=3&tz=4.5'],
  ['feast-table', 'scene=tavern&clean&az=80&el=45&dist=6&tx=2.6&tz=2.4'],
];

const browser = await chromium.launch({
  args: ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
page.on('console', (msg) => {
  if (msg.type() === 'error') console.log('page error:', msg.text());
});
for (const [name, query] of shots) {
  await page.goto(`${base}?${query}`);
  await page.waitForFunction('window.__hamletReady === true', { timeout: 90000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `/home/daniebo/Desktop/fantasy-asset-forge/docs/tavern-mockups/render-${name}.png` });
  console.log('shot', name);
}
await browser.close();