import { chromium } from 'playwright';

// Review shots for the Old Oak Clearing (?scene=forest). Angles chosen to
// mirror the v3 mockup: stream on the west edge, campfire SW, oak center-north,
// the S-curved footpath.
const base = 'http://127.0.0.1:5199/hamlet.html';
const shots = [
  ['forest-3q', 'scene=forest&clean&az=25&el=50&dist=32&tx=0&tz=0'],
  ['forest-top', 'scene=forest&clean&az=0&el=88&dist=36&tx=0&tz=0'],
  ['forest-oak', 'scene=forest&clean&az=25&el=16&dist=14&tx=-2.5&tz=-3.5'],
  ['forest-camp', 'scene=forest&clean&az=120&el=26&dist=10&tx=-6.5&tz=3.5'],
  ['forest-entry', 'scene=forest&clean&az=190&el=22&dist=9&tx=3&tz=6'],
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
  const missing = await page.evaluate('window.__hamletMissing');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `/tmp/opencode/${name}.png` });
  console.log('shot', name, missing?.length ? 'MISSING: ' + missing.join(',') : 'all placed');
}
await browser.close();
