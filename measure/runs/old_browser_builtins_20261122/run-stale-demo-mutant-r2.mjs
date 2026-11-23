import {createServer} from 'node:http';
import {appendFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
appendFileSync('/home/daniebo/Desktop/advantage-forge/measure/runs/old_browser_builtins_20261122/pids-ad56865.log', `${process.pid} node stale-demo decoy listener on 127.0.0.1:5199\n`);
const server=createServer((req,res)=>{
  res.writeHead(200,{'content-type':'text/html'});
  res.end('<html><head><script type="module" src="/@vite/client"></script></head><body>stale demo from another session</body></html>');
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(5199,'127.0.0.1',resolve);});
let result;
try {
 result=spawnSync(process.execPath,['measure/runs/old_browser_builtins_20261122/mutant-r2-all-inputs-blocked.mjs','--game','spellweavers-run'],{encoding:'utf8',timeout:30000});
 console.log(result.stdout ?? '');
 console.error(result.stderr ?? '');
 console.log(`STALE_DEMO_MUTANT_EXIT=${result.status}`);
 if(result.error) throw result.error;
 if(result.status===0) process.exitCode=7;
} finally {
 await new Promise(resolve=>server.close(resolve));
}
