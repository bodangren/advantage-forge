import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const ROOT='/home/daniebo/Desktop/advantage-forge';
const RUN=`${ROOT}/measure/runs/old_browser_builtins_20261122`;
const source=readFileSync(`${ROOT}/scripts/old-browser-check.mjs`,'utf8');
function output(name){
 let text=source.replace("const ROOT = fileURLToPath(new URL('..', import.meta.url));",`const ROOT = '${ROOT}';`);
 if(text===source)throw new Error('ROOT source line was not found');
 text=text.replace("const OUT_DIR = join(ROOT, 'out', 'old-browser');",`const OUT_DIR = join(ROOT, 'measure', 'runs', 'old_browser_builtins_20261122', 'mutant-r3-${name}-out');`);
 return text;
}
function replace(text, from, to, name){if(!text.includes(from))throw new Error(`${name}: missing pattern ${from.slice(0,80)}`);return text.replace(from,to);}
function save(name,text){mkdirSync(`${RUN}/mutant-r3-${name}-out`,{recursive:true});writeFileSync(`${RUN}/mutant-r3-${name}.mjs`,text);}
function timeouts(text){return text.replaceAll('timeout: 180000','timeout: 1200').replaceAll('timeout: 90000','timeout: 1200').replaceAll('timeout: 60000','timeout: 1200');}
const lineInput='    await input.play();';
const beforeMark='    const markBefore = await actionMark(page);';
const scoreHarness=`    await page.evaluate(() => { const s = window.__apk3d?.game?.()?.state?.(); if (s) s.score += 1; });`;
const blockAppInput=`  await page.evaluate(() => { for (const type of ['keydown', 'pointerdown']) window.addEventListener(type, event => event.stopImmediatePropagation(), true); });`;

// Nine earlier adversarial cases, regenerated from the current implementation.
{
 let t=output('all-inputs-blocked'); t=replace(t,lineInput,'    await Promise.resolve();','all-inputs-blocked'); save('all-inputs-blocked',t);
}
{
 let t=output('clock-only-change'); t=replace(t,lineInput,'    await Promise.resolve();','clock-only-change');
 t=replace(t,'      word: state.word,','      timeMs: state.timeMs,\n      distance: state.distance,\n      word: state.word,','clock-only-change'); save('clock-only-change',t);
}
{
 let t=output('time-field-only'); t=replace(t,'      word: state.word,','      timeMs: state.timeMs,\n      word: state.word,','time-field-only');
 t=replace(t,'  if (!inputWasSent) return false;','  if (!inputWasSent) return false;\n  if (after.timeMs > before.timeMs) return true;','time-field-only'); save('time-field-only',t);
}
{
 let t=output('post-move-error'); t=replace(t,lineInput,`${lineInput}\n    await page.evaluate(() => setTimeout(() => { throw new Error('post-move injected'); }, 0));\n    await page.waitForTimeout(60);`,'post-move-error'); save('post-move-error',t);
}
{
 let t=output('builtin-still-defined'); t=replace(t,'    delete globalThis.structuredClone;','    // mutant: preserve structuredClone','builtin-still-defined'); save('builtin-still-defined',t);
}
{
 let t=output('console-error'); t=replace(t,'  result.started = true;','  result.started = true;\n  await page.evaluate(() => console.error("injected console error"));','console-error'); save('console-error',t);
}
{
 let t=output('blank-200-page');
 const viteCall="      'node_modules/vite/bin/vite.js',";
 const blankServer="      '-e',\n      \"require('node:http').createServer((q,s)=>{s.writeHead(200,{'content-type':'text/html'});s.end('<html><script src=\\\"/@vite/client\\\"></script></html>')}).listen(5199,'127.0.0.1')\",\n      'node_modules/vite/bin/vite.js',";
 t=replace(t,viteCall,blankServer,'blank-200-page'); t=timeouts(t); save('blank-200-page',t);
}
{
 let t=output('wrong-game-card'); t=replace(t,'`[data-game="${GAME}"]:not(.soon)`','`[data-game="not-the-target"]:not(.soon)`','wrong-game-card'); t=timeouts(t); save('wrong-game-card',t);
}
{
 let t=output('harness-score-before-input'); t=replace(t,lineInput,'    await Promise.resolve();','harness-score-before-input');
 t=replace(t,beforeMark,`${beforeMark}\n    await page.evaluate(() => { const s = window.__apk3d?.game?.()?.state?.(); if (s) s.score += 1; });`,'harness-score-before-input'); save('harness-score-before-input',t);
}

// New causal and server-owner cases.
{
 let t=output('score-during-window'); t=replace(t,'  result.started = true;','  result.started = true;\n'+blockAppInput,'score-during-window');
 t=replace(t,lineInput,`${lineInput}\n    await page.evaluate(() => { const s = window.__apk3d?.game?.()?.state?.(); if (s) s.score += 1; });`,'score-during-window'); save('score-during-window',t);
}
{
 let t=output('time-jump-after-input'); t=replace(t,'  result.started = true;','  result.started = true;\n'+blockAppInput,'time-jump-after-input');
 t=replace(t,lineInput,`${lineInput}\n    await page.evaluate(() => { const s = window.__apk3d?.game?.()?.state?.(); if (s) s.timeMs = (s.timeMs ?? 0) + 60000; });`,'time-jump-after-input'); save('time-jump-after-input',t);
}
{
 let t=output('ignored-input-score-change'); t=replace(t,'  result.started = true;','  result.started = true;\n'+blockAppInput,'ignored-input-score-change');
 t=replace(t,lineInput,`${lineInput}\n    await page.evaluate(() => { const s = window.__apk3d?.game?.()?.state?.(); if (s) s.collected += 1; });`,'ignored-input-score-change'); save('ignored-input-score-change',t);
}
{
 let t=output('foreign-after-preflight');
 const from='  if (await portAnswering()) throw new Error(`port ${PORT} already in use`);\n  mkdirSync(OUT_DIR, { recursive: true });';
 const to=`  if (await portAnswering()) throw new Error('port already in use');
  const { createServer } = await import('node:http');
  const foreign = createServer((request, response) => { response.writeHead(200, {'content-type':'text/html'}); response.end('<html><script src="/@vite/client"></script></html>'); });
  await new Promise((resolve) => foreign.listen(PORT, '127.0.0.1', resolve));
  globalThis.__r3foreign = foreign;
  mkdirSync(OUT_DIR, { recursive: true });`;
 t=replace(t,from,to,'foreign-after-preflight');
 t=replace(t,'  await stopServer();\n  try {',"  await stopServer();\n  if (globalThis.__r3foreign) await new Promise((resolve) => globalThis.__r3foreign.close(resolve));\n  try {",'foreign-after-preflight'); save('foreign-after-preflight',t);
}
{
 let t=output('child-exits-after-readiness');
 t=replace(t,'  await waitForOwnedServer();','  await waitForOwnedServer();\n  server.kill(\'SIGTERM\');\n  await new Promise((resolve) => server.once(\'exit\', resolve));','child-exits-after-readiness'); save('child-exits-after-readiness',t);
}
{
 let t=output('pid-reuse');
 t=replace(t,'  startServer();\n  await waitForOwnedServer();',`  startServer();
  const pidDecoy = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 30000)'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  process.stderr.write('PID_REUSE_DECOY=' + pidDecoy.pid + '\\n');
  server.pid = pidDecoy.pid;
  await waitForOwnedServer();`,'pid-reuse');
 t=replace(t,'  await stopServer();\n  try {',`  await stopServer();
  if (typeof pidDecoy !== 'undefined' && pidDecoy.exitCode === null) { pidDecoy.kill('SIGTERM'); await new Promise((resolve) => pidDecoy.once('exit', resolve)); }
  try {`,'pid-reuse');
 // Move the decoy binding to module scope so finally can close it.
 t=replace(t,'let serverExit = null;','let serverExit = null;\nlet pidDecoy = null;','pid-reuse');
 t=t.replace('  const pidDecoy = spawn(', '  pidDecoy = spawn(').replace("if (typeof pidDecoy !== 'undefined' && pidDecoy.exitCode === null)","if (pidDecoy && pidDecoy.exitCode === null)");
 save('pid-reuse',t);
}
const fakeServerCode="require('node:http').createServer((q,s)=>{s.writeHead(200,{'content-type':'text/html'});s.end('<html><script src=\\\"/@vite/client\\\"></script></html>')}).listen(5199,'127.0.0.1')";
{
 let t=output('descendant-not-dev-server');
 t=replace(t,"      'node_modules/vite/bin/vite.js',",`      '-e',\n      ${JSON.stringify(fakeServerCode)},\n      'node_modules/vite/bin/vite.js',`,'descendant-not-dev-server');
 t=timeouts(t); save('descendant-not-dev-server',t);
}
{
 let t=output('foreign-server-child-wrapper');
 const startStart='function startServer() {'; const startEnd='\n}\n\nasync function stopServer()';
 const i=t.indexOf(startStart), j=t.indexOf(startEnd,i); if(i<0||j<0)throw new Error('wrapper: startServer block missing');
 const wrapperCode=`const { spawn } = require('node:child_process'); const child = spawn(process.execPath, ['-e', ${JSON.stringify(fakeServerCode)}], { stdio: 'ignore' }); process.on('SIGTERM', () => { child.kill('SIGTERM'); child.once('exit', () => process.exit(0)); }); setInterval(() => {}, 1000);`;
 const replacement=`function startServer() {\n  server = spawn(process.execPath, ['-e', ${JSON.stringify(wrapperCode)}], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });\n  server.on('exit', (code, signal) => { serverExit = { code, signal, log: 'wrapper fixture' }; });`;
 t=t.slice(0,i)+replacement+t.slice(j);
 t=timeouts(t); save('foreign-server-child-wrapper',t);
}
{
 let t=output('shorter-than-game-tick');
 const delayed=`  result.started = true;
  await page.evaluate(() => {
    for (const type of ['keydown', 'pointerdown']) {
      window.addEventListener(type, event => {
        event.stopImmediatePropagation();
        setTimeout(() => {
          const s = window.__apk3d?.game?.()?.state?.();
          if (s) s.score += 1;
        }, 1500);
      }, true);
    }
  });`;
 t=replace(t,'  result.started = true;',delayed,'shorter-than-game-tick');
 t=replace(t,'    await page.waitForTimeout(500);','    await page.waitForTimeout(0);','shorter-than-game-tick');
 save('shorter-than-game-tick',t);
}
console.log('Generated 18 current-source mutant copies.');
