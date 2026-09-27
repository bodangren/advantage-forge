import { chromium } from 'playwright';

const base = 'http://127.0.0.1:5199/hamlet.html';
const shots = [
  ['3q', 'scene=dungeon&clean&az=32&el=50&dist=30&tx=-4&tz=1'],
  ['top', 'scene=dungeon&clean&az=0&el=88&dist=26&tx=-4&tz=1'],
  ['corner-nw', 'scene=dungeon&clean&az=210&el=35&dist=9&tx=-11&tz=-3'],
  ['t-junction', 'scene=dungeon&clean&az=170&el=30&dist=11&tx=-4&tz=-3'],
  ['gate-gap', 'scene=dungeon&clean&az=195&el=28&dist=12&tx=1&tz=7'],
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
  await page.waitForTimeout(900);
  await page.screenshot({ path: `/tmp/opencode/dungeon-check-${name}.png` });
  console.log('shot', name);
}
await browser.close();
