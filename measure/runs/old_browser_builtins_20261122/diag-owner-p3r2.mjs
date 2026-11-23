// Diagnostic for listener ownership. Not committed.
import { execFileSync, spawn } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const child = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--config', 'vite.demo.config.ts', '--port', '5199', '--strictPort', '--base', '/demo/'],
  { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
);
let log = '';
child.stdout.on('data', (c) => (log += c.toString()));
child.stderr.on('data', (c) => (log += c.toString()));
await new Promise((r) => setTimeout(r, 3000));
const ss = execFileSync('ss', ['-ltnp'], { encoding: 'utf8' });
console.log('CHILD_PID', child.pid, 'EXIT', child.exitCode);
console.log('SS_LINES', JSON.stringify(ss.split('\n').filter((l) => l.includes('5199'))));
console.log('VITE_LOG', JSON.stringify(log.slice(-600)));
const names = readdirSync('/proc').filter((n) => /^\d+$/.test(n));
const parent = new Map();
for (const n of names) {
  try {
    const stat = readFileSync(`/proc/${n}/stat`, 'utf8');
    const close = stat.lastIndexOf(')');
    const fields = stat.slice(close + 2).trim().split(/\s+/);
    parent.set(Number(n), Number(fields[1]));
  } catch {}
}
const tree = new Set([child.pid]);
let grew = true;
while (grew) {
  grew = false;
  for (const [pid, ppid] of parent) {
    if (!tree.has(pid) && tree.has(ppid)) {
      tree.add(pid);
      grew = true;
    }
  }
}
console.log('TREE', [...tree].join(','));
child.kill('SIGTERM');
await new Promise((r) => child.once('exit', r));
