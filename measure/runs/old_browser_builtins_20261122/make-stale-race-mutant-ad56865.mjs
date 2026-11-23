import { readFileSync, writeFileSync } from 'node:fs';
const path = 'scripts/old-browser-check.mjs';
let text = readFileSync(path, 'utf8');
text = text.replace(
  "const OUT_DIR = join(ROOT, 'out', 'old-browser');",
  "const OUT_DIR = join(ROOT, 'measure', 'runs', 'old_browser_builtins_20261122', 'mutant-r2-stale-demo-race');",
);
text = text.replace('let serverExit = null;', 'let serverExit = null;\nlet raceServer = null;');
text = text.replace(
  '  if (await portAnswering()) throw new Error(`port ${PORT} already in use`);\n  mkdirSync(OUT_DIR, { recursive: true });\n  startServer();',
  `  if (await portAnswering()) throw new Error('port already in use');
  mkdirSync(OUT_DIR, { recursive: true });
  raceServer = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'vite.demo.config.ts', '--port', String(PORT), '--strictPort', '--base', '/demo/'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  process.stderr.write('RACE_DECOY_PID=' + raceServer.pid + '\\n');
  await new Promise((resolve, reject) => {
    const deadline = Date.now() + 30000;
    const poll = async () => {
      try {
        const response = await fetch(BASE, { signal: AbortSignal.timeout(1000) });
        if (response.ok && (await response.text()).includes('/@vite/client')) return resolve();
      } catch {}
      if (raceServer.exitCode !== null) return reject(new Error('race decoy Vite exited'));
      if (Date.now() > deadline) return reject(new Error('race decoy Vite did not start'));
      setTimeout(poll, 100);
    };
    poll();
  });
  server = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  process.stderr.write('OWNED_CHILD_PID=' + server.pid + '\\n');
  server.on('exit', (code, signal) => { serverExit = { code, signal, log: 'delayed owned-child mutant' }; });`,
);
text = text.replace(
  '  await stopServer();\n  try {',
  `  await stopServer();
  if (raceServer && raceServer.exitCode === null && raceServer.signalCode === null) {
    raceServer.kill('SIGTERM');
    await new Promise((resolve) => raceServer.once('exit', resolve));
  }
  try {`,
);
if (!text.includes('RACE_DECOY_PID=') || !text.includes('delayed owned-child mutant')) throw new Error('stale race mutation did not apply');
writeFileSync('measure/runs/old_browser_builtins_20261122/mutant-r2-stale-demo-race.mjs', text);
