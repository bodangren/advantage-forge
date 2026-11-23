import { appendFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
const root='/home/daniebo/Desktop/advantage-forge';
const run=`${root}/measure/runs/old_browser_builtins_20261122`;
const all=[
 'all-inputs-blocked','clock-only-change','time-field-only','post-move-error','builtin-still-defined','console-error','blank-200-page','wrong-game-card','harness-score-before-input',
 'score-during-window','time-jump-after-input','ignored-input-score-change','foreign-after-preflight','child-exits-after-readiness','pid-reuse','descendant-not-dev-server','foreign-server-child-wrapper','shorter-than-game-tick'
];
const selected=process.argv.slice(2);
const names=selected.length?selected:all;
let falsePass=false;
function runCopy(name,label=name){
 const file=`${run}/mutant-r3-${name}.mjs`;
 const r=spawnSync(process.execPath,[file,'--game','spellweavers-run'],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024,timeout:240000});
 if(r.stdout)appendFileSync(`${run}/mutants-r3.log`,`\n--- ${label} stdout ---\n${r.stdout}`);
 if(r.stderr)appendFileSync(`${run}/mutants-r3.log`,`\n--- ${label} stderr ---\n${r.stderr}`);
 if(r.error)throw r.error;
 console.log(`MUTANT_RESULT ${label}: exit=${r.status}`);
 if(r.status===0){console.log(`FALSE_PASS ${label}`);falsePass=true;}
 if(r.status===null)throw new Error(`${label} timed out or had no exit status`);
}
for(const name of names){
 if(name==='foreign-before-preflight'){
   const decoy=createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.end('<html><script src="/@vite/client"></script></html>');});
   await new Promise((resolve,reject)=>{decoy.once('error',reject);decoy.listen(5199,'127.0.0.1',resolve);});
   appendFileSync(`${run}/pids-r3.log`,`${process.pid} parent Node runner HTTP decoy for foreign-before-preflight\n`);
   try{runCopy('all-inputs-blocked',name);}finally{await new Promise(resolve=>decoy.close(resolve));}
 }else runCopy(name);
}
process.exitCode=falsePass?9:0;
