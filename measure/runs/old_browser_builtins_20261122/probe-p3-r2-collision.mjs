// r2 collision probe: decoy on 127.0.0.1:5199; the script must fail fast (1-2 s),
// leave no orphan, and check.json plus the script output must contain no /home/ or user name.
import { spawn, execFileSync } from 'node:child_process';
import http from 'node:http';
import { readFileSync } from 'node:fs';

const pids = (pattern) => {
  try {
    return new Set(
      execFileSync('pgrep', ['-f', pattern], { encoding: 'utf8' }).trim().split('\n').filter(Boolean),
    );
  } catch {
    return new Set();
  }
};

const decoy = http.createServer((req, res) => res.end('decoy'));
await new Promise((resolve) => decoy.listen(5199, '127.0.0.1', resolve));
console.log('decoy listening on 127.0.0.1:5199');

const viteBefore = pids('vite.js');
const chromeBefore = pids('chrome-headless-shell');
const started = Date.now();
const run = spawn(process.execPath, ['scripts/old-browser-check.mjs', '--game', 'spellweavers-run'], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
});
let out = '';
run.stdout.on('data', (c) => (out += c));
run.stderr.on('data', (c) => (out += c));
const code = await new Promise((resolve) => run.on('exit', resolve));
console.log(`script exit=${code} elapsedMs=${Date.now() - started}`);
console.log(`output: ${out.trim().slice(0, 400)}`);

decoy.close();
await new Promise((resolve) => setTimeout(resolve, 1500));

const check = readFileSync('out/old-browser/check.json', 'utf8');
console.log(`check.json has /home/: ${check.includes('/home/')}; has user name: ${check.includes('daniebo')}`);
console.log(`output has /home/: ${out.includes('/home/')}; has user name: ${out.includes('daniebo')}`);
const viteAfter = pids('vite.js');
const myViteLeft = [...viteAfter].filter((pid) => !viteBefore.has(pid));
const chromeAfter = pids('chrome-headless-shell');
const myChromeLeft = [...chromeAfter].filter((pid) => !chromeBefore.has(pid));
console.log(`my vite left: ${myViteLeft.join(',') || 'none'}; my chromium left: ${myChromeLeft.join(',') || 'none'}`);
console.log(
  `port after: ${execFileSync('ss', ['-tln'], { encoding: 'utf8' }).includes(':5199') ? 'STILL BOUND' : 'free'}`,
);
