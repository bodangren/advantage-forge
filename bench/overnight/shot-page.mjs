// Screenshot a local HTML page: node bench/overnight/shot-page.mjs <file> <out.png> [width] [height]
import { chromium } from 'playwright';
const [file, out, w = '1400', h = '1800'] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
await page.goto('file://' + file);
await page.waitForTimeout(1500);
await page.screenshot({ path: out });
await browser.close();
