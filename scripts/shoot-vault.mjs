import { chromium } from 'playwright';

const base = 'http://127.0.0.1:5199/hamlet.html';
const shots = [
  ['vault-top', 'scene=vault&clean&az=0&el=88&dist=42&tx=0&tz=0'],
  ['vault-3q', 'scene=vault&clean&az=32&el=50&dist=36&tx=0&tz=1'],
  ['vault-gatehouse', 'scene=vault&clean&az=195&el=26&dist=13&tx=1&tz=7'],
  ['vault-hall', 'scene=vault&clean&az=190&el=32&dist=11&tx=0&tz=2'],
  ['vault-sanctum', 'scene=vault&clean&az=178&el=34&dist=11&tx=1&tz=-6'],
  ['vault-cells', 'scene=vault&clean&az=145&el=32&dist=11&tx=-7&tz=1'],
  ['vault-treasury', 'scene=vault&clean&az=205&el=32&dist=12&tx=8&tz=2'],
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
