// Port-collision probe: decoy server on 127.0.0.1:5199 inside this one process group.
// The script must fail fast via --strictPort child exit, leave no orphan, and free the port.
import { spawn } from 'node:child_process';
import http from 'node:http';

const decoy = http.createServer((req, res) => res.end('decoy'));
await new Promise((resolve) => decoy.listen(5199, '127.0.0.1', resolve));
console.log('decoy listening on 127.0.0.1:5199');

const started = Date.now();
const run = spawn(process.execPath, ['scripts/old-browser-check.mjs', '--game', 'spellweavers-run'], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
});
let out = '';
run.stdout.on('data', (c) => (out += c));
run.stderr.on('data', (c) => (out += c));
const code = await new Promise((resolve) => run.on('exit', resolve));
const elapsedMs = Date.now() - started;
console.log(`script exit=${code} elapsedMs=${elapsedMs}`);
console.log(`script output: ${out.trim().slice(0, 300)}`);

decoy.close();
await new Promise((resolve) => setTimeout(resolve, 1500));

import { execFileSync } from 'node:child_process';
const ss = execFileSync('ss', ['-tln'], { encoding: 'utf8' });
console.log(ss.includes(':5199') ? 'PORT 5199 STILL BOUND' : 'port 5199 free after decoy close');
const vite = execFileSync('pgrep', ['-fa', 'vite.js'], { encoding: 'utf8' }).trim();
console.log(vite ? `vite still running: ${vite.split('\n')[0]}` : 'no vite process');
const chrome = execFileSync('pgrep', ['-f', 'chrome-headless-shell'], { encoding: 'utf8' }).trim();
console.log(chrome ? `chromium still running (${chrome.split('\n').length} procs)` : 'no chromium process');
