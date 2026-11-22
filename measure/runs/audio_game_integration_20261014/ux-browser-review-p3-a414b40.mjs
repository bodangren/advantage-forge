import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const baseUrl = 'http://127.0.0.1:5199/demo/';
const screenshotPath =
  '/home/daniebo/Desktop/advantage-forge/measure/runs/audio_game_integration_20261014/ux-browser-review-p3-a414b40.png';
const outputPath =
  '/home/daniebo/Desktop/advantage-forge/measure/runs/audio_game_integration_20261014/ux-browser-review-p3-a414b40-probe.json';
const setEntries = new Set([
  'level-end',
  'pop',
  'right',
  'star',
  'tap',
  'whoosh',
  'wrong',
]);
const browser = await chromium.launch({
  headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const audioRequests = [];
const consoleErrors = [];
const pageErrors = [];
const interactions = [];
page.on('request', (request) => {
  if (/\.(ogg|mp3)(?:$|\?)/i.test(request.url())) {
    audioRequests.push({ url: request.url(), status: null });
  }
});
page.on('requestfinished', async (request) => {
  const record = audioRequests.find((item) => item.url === request.url() && item.status === null);
  if (!record) return;
  try {
    record.status = (await request.response())?.status() ?? null;
  } catch {
    record.status = null;
  }
});
page.on('requestfailed', (request) => {
  const record = audioRequests.find((item) => item.url === request.url() && item.status === null);
  if (record) record.status = `failed: ${request.failure()?.errorText ?? 'unknown'}`;
});
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.stack ?? String(error)));

let result;
try {
  const url = `${baseUrl}index.html?renderer=phaser`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__apk3dReady === true, { timeout: 60000 });
  await page.waitForSelector('[data-game]:not(.soon)', { timeout: 60000 });
  const runeMatch = page.locator('[data-game="rune-match"]:not(.soon)');
  const gameCard = (await runeMatch.count()) > 0 ? runeMatch : page.locator('[data-game]:not(.soon)').first();
  const gameId = await gameCard.getAttribute('data-game');
  const gameName = (await gameCard.innerText()).replace(/\s+/g, ' ').trim();
  await gameCard.click();
  interactions.push(`Selected the 2D game ${gameId} (${gameName}) from the game list.`);
  await page.waitForFunction(() => !document.querySelector('[data-read]')?.disabled, {
    timeout: 30000,
  });
  await page.locator('[data-read]').click();
  interactions.push('Clicked Read to open the selected story.');
  await page.waitForSelector('[data-next]', { timeout: 60000 });
  await page.locator('[data-next]').click();
  interactions.push('Clicked the reader Next button to open the game briefing.');
  await page.waitForSelector('[data-start]', { timeout: 30000 });
  await page.locator('[data-start]').click();
  interactions.push(`Clicked Start to mount ${gameId} in the 2D renderer.`);
  await page.waitForFunction(
    () => window.__apk3d?.renderer?.() === 'phaser' && window.__apk3d?.game?.(),
    { timeout: 60000 },
  );
  await page.waitForTimeout(1500);
  const canvas = page.locator('.game-layer canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 30000 });
  const box = await canvas.boundingBox();
  if (!box) throw new Error('The 2D game canvas has no visible bounds.');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  interactions.push('Clicked the center of the 2D game canvas once as the audio unlock gesture.');
  await page.keyboard.press('Space');
  interactions.push('Pressed Space once to provide game input.');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const accessibilitySnapshot = await page.locator('body').ariaSnapshot();
  const invalidRequests = audioRequests.filter((item) => {
    const url = new URL(item.url);
    const filename = url.pathname.split('/').at(-1) ?? '';
    const name = filename.replace(/\.(ogg|mp3)$/i, '');
    return !url.pathname.startsWith('/demo/audio/chibi/') || !setEntries.has(name);
  });
  const successful = audioRequests.filter(
    (item) => item.status === 200 && new URL(item.url).pathname.startsWith('/demo/audio/chibi/'),
  );
  const pass =
    successful.length > 0 &&
    audioRequests.every((item) => /\.ogg(?:$|\?)/i.test(item.url)) &&
    invalidRequests.length === 0 &&
    consoleErrors.length === 0 &&
    pageErrors.length === 0;
  result = {
    status: pass ? 'pass' : 'fail',
    dev_url: url,
    viewport: { width: 1280, height: 800 },
    audio_requests: audioRequests,
    console_errors: consoleErrors,
    page_errors: pageErrors,
    invalid_audio_requests: invalidRequests,
    interactions,
    accessibility_snapshot: accessibilitySnapshot,
    screenshot: screenshotPath,
    limitation: 'Muted headless playback proves file requests and runtime flow, not audible quality.',
  };
} catch (error) {
  result = {
    status: 'fail',
    dev_url: page.url(),
    audio_requests: audioRequests,
    console_errors: consoleErrors,
    page_errors: pageErrors,
    interactions,
    failure: error.stack ?? String(error),
  };
} finally {
  mkdirSync(new URL('.', `file://${outputPath}`).pathname, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  await browser.close();
}
console.log(JSON.stringify(result, null, 2));
if (result.status !== 'pass') process.exitCode = 1;
