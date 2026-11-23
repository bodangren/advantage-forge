import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync('scripts/old-browser-check.mjs','utf8');
const dir='measure/runs/old_browser_builtins_20261122';
const root="const ROOT = '/home/daniebo/Desktop/advantage-forge';";
function base(name){return source.replace("const ROOT = fileURLToPath(new URL('..', import.meta.url));",root).replace("const OUT_DIR = join(ROOT, 'out', 'old-browser');",`const OUT_DIR = join(ROOT, 'measure', 'runs', 'old_browser_builtins_20261122', 'mutant-${name}');`).replaceAll('timeout: 90000','timeout: 1500').replaceAll('timeout: 60000','timeout: 1500').replaceAll('timeout: 180000','timeout: 1500');}
const cases={};
cases['init-fails-silently']=base('init-fails-silently').replace('delete globalThis.structuredClone;','// mutant: leave structuredClone defined');
cases['equal-state-digest']=base('equal-state-digest').replace(/async function stateDigest\(page\) \{[\s\S]*?\n\}\n\nconst result/,`async function stateDigest() { return JSON.stringify({ stable: true }); }\n\nconst result`);
cases['missing-builtins-console-errors']=base('missing-builtins-console-errors').replace('  result.started = true;',`  result.started = true;
  await page.evaluate(() => {
    const calls = [
      ['structuredClone', () => globalThis.structuredClone({})],
      ['Array.prototype.at', () => [1].at(0)],
      ['Array.prototype.findLastIndex', () => [1].findLastIndex(() => true)],
      ['Object.hasOwn', () => Object.hasOwn({}, 'x')],
    ];
    for (const [name, call] of calls) {
      try { call(); } catch (error) { console.error('MISSING_BUILTIN ' + name + ': ' + error); }
    }
  });`);
cases['error-after-move']=base('error-after-move').replace('  const after = await stateDigest(page);',`  await page.evaluate(() => setTimeout(() => { throw new TypeError('injected post-move error'); }, 0));
  await page.waitForTimeout(100);
  const after = await stateDigest(page);`);
cases['blank-200-page']=base('blank-200-page').replace(/function startServer\(\) \{[\s\S]*?\n\}\n\nasync function stopServer/,`function startServer() {
  server = spawn(process.execPath, ['-e', "require('http').createServer((req,res)=>{res.writeHead(200, {'Content-Type':'text/html'});res.end('<html><body>blank wrong page</body></html>')}).listen(5199,'127.0.0.1')"], { cwd: ROOT, stdio: ['ignore','pipe','pipe'] });
  let log = '';
  const collect = chunk => { log = String(chunk).slice(-4000); };
  server.stdout.on('data', collect); server.stderr.on('data', collect);
  server.on('exit', (code,signal) => { serverExit = {code,signal,log}; });
}

async function stopServer`);
cases['wrong-game-selector']=base('wrong-game-selector').replace('[data-game="${GAME}"]:not(.soon)','[data-game="wrong-game-id"]:not(.soon)');
for(const [name,text] of Object.entries(cases)){
 if(text===source) throw new Error(`no mutant change: ${name}`);
 writeFileSync(`${dir}/mutant-${name}.mjs`,text);
 console.log(`WROTE ${dir}/mutant-${name}.mjs`);
}
