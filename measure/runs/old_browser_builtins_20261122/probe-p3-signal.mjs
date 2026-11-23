// SIGTERM/SIGINT orphan probe for scripts/old-browser-check.mjs.
// Sends the signal to the Node parent only, then diffs vite/chromium PID sets
// so processes of other sessions on this shared machine are never touched.
import { spawn, execFileSync } from 'node:child_process';

const SIGNAL = process.argv[2] === 'int' ? 'SIGINT' : 'SIGTERM';
const pids = (pattern) => {
  try {
    return new Set(
      execFileSync('pgrep', ['-f', pattern], { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(Boolean),
    );
  } catch {
    return new Set();
  }
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const viteBefore = pids('vite.js');
const chromeBefore = pids('chrome-headless-shell');
console.log(`before: vite=${viteBefore.size} chromium=${chromeBefore.size}`);

const run = spawn(process.execPath, ['scripts/old-browser-check.mjs', '--game', 'spellweavers-run'], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
});
let out = '';
run.stdout.on('data', (c) => (out += c));
run.stderr.on('data', (c) => (out += c));

await sleep(15000);
const midVite = pids('vite.js');
const myVite = [...midVite].filter((pid) => !viteBefore.has(pid));
console.log(`at 15s: new vite pids from my run: ${myVite.join(',') || 'none'}`);
console.log(
  `port 5199 during run: ${execFileSync('ss', ['-tln'], { encoding: 'utf8' }).includes(':5199')}`,
);

run.kill(SIGNAL);
const code = await new Promise((resolve) => run.on('exit', resolve));
console.log(`script exit after ${SIGNAL}: ${code}`);

let freedAt = null;
for (let i = 1; i <= 10; i++) {
  await sleep(2000);
  const viteNow = pids('vite.js');
  const mineLeft = [...myVite].filter((pid) => viteNow.has(pid));
  if (mineLeft.length === 0 && freedAt === null) freedAt = i * 2;
}
const viteAfter = pids('vite.js');
const chromeAfter = pids('chrome-headless-shell');
const myViteLeft = [...myVite].filter((pid) => viteAfter.has(pid));
const myChromeBefore = new Set([...chromeBefore].filter((pid) => !chromeAfter.has(pid)));
const myChromeLeft = [...chromeAfter].filter((pid) => !chromeBefore.has(pid));
console.log(`my vite still alive: ${myViteLeft.join(',') || 'none'} (freed after ~${freedAt}s)`);
console.log(
  `chromium pids not in baseline: ${myChromeLeft.length ? myChromeLeft.join(',') : 'none'}; baseline chromium gone: ${myChromeBefore.size}`,
);
console.log(`script output tail: ${out.trim().slice(-260)}`);
