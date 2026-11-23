import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync('scripts/old-browser-check.mjs','utf8');
const dir='measure/runs/old_browser_builtins_20261122';
const root="const ROOT = '/home/daniebo/Desktop/advantage-forge';";
function base(name){return source.replace("const ROOT = fileURLToPath(new URL('..', import.meta.url));",root).replace("const OUT_DIR = join(ROOT, 'out', 'old-browser');",`const OUT_DIR = join(ROOT, 'measure', 'runs', 'old_browser_builtins_20261122', 'mutant-r2-${name}');`);}
const cases={};
cases['all-inputs-blocked']=base('all-inputs-blocked').replace('    await input.play();','    await Promise.resolve();');
cases['clock-only-change']=base('clock-only-change').replace('    await input.play();','    await Promise.resolve();').replace(/async function actionMark\(page\) \{[\s\S]*?\n\}\n\nfunction acceptedAction/,`async function actionMark() { return { timeMs: Date.now() }; }\n\nfunction acceptedAction`);
cases['time-field-only']=base('time-field-only').replace(/async function actionMark\(page\) \{[\s\S]*?\n\}\n\nfunction acceptedAction/,`async function actionMark() { return { timeMs: Date.now() }; }\n\nfunction acceptedAction`);
cases['post-move-error']=base('post-move-error').replace('  const digestAfter = await stateDigest(page);',`  await page.evaluate(() => setTimeout(() => { throw new TypeError('post-move injected failure'); }, 0));
  await page.waitForTimeout(100);
  const digestAfter = await stateDigest(page);`);
cases['builtin-still-defined']=base('builtin-still-defined').replace('    delete globalThis.structuredClone;','    // mutant: leave structuredClone defined');
cases['console-error']=base('console-error').replace('  result.started = true;','  result.started = true;\n  await page.evaluate(() => console.error("injected console TypeError: missing structuredClone"));');
cases['blank-200-page']=base('blank-200-page').replace(/function startServer\(\) \{[\s\S]*?\n\}\n\nasync function stopServer/,`function startServer() {
  server = spawn(process.execPath, ['-e', "require('http').createServer((req,res)=>{res.writeHead(200, {'Content-Type':'text/html'});res.end('<html><body>blank non-demo page</body></html>')}).listen(5199,'127.0.0.1')"], { cwd: ROOT, stdio: ['ignore','pipe','pipe'] });
  let log = '';
  const collect = chunk => { log = String(chunk).slice(-4000); };
  server.stdout.on('data', collect); server.stderr.on('data', collect);
  server.on('exit', (code,signal) => { serverExit = {code,signal,log}; });
}

async function stopServer`).replace('const deadline = Date.now() + 60000;','const deadline = Date.now() + 2500;');
cases['wrong-game-card']=base('wrong-game-card').replace('[data-game="${GAME}"]:not(.soon)','[data-game="not-the-target"]:not(.soon)').replaceAll('timeout: 60000','timeout: 1500').replaceAll('timeout: 90000','timeout: 1500').replaceAll('timeout: 180000','timeout: 1500');
cases['harness-mutates-score-no-input']=base('harness-mutates-score-no-input').replace('    await input.play();','    await Promise.resolve();').replace('    const mark = await actionMark(page);',`    await page.evaluate(() => { const state = window.__apk3d?.game?.()?.state?.(); if (state) state.score += 1; });
    const mark = await actionMark(page);`);
for(const [name,text] of Object.entries(cases)){
 if(text===source) throw new Error(`no mutant change: ${name}`);
 writeFileSync(`${dir}/mutant-r2-${name}.mjs`,text);
 console.log(`WROTE ${dir}/mutant-r2-${name}.mjs`);
}
