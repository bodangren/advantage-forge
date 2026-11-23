import {spawnSync} from 'node:child_process';
const names=[
 'all-inputs-blocked',
 'clock-only-change',
 'time-field-only',
 'post-move-error',
 'builtin-still-defined',
 'console-error',
 'blank-200-page',
 'wrong-game-card',
 'harness-mutates-score-no-input',
];
let falsePass=false;
for(const name of names){
 const file=`measure/runs/old_browser_builtins_20261122/mutant-r2-${name}.mjs`;
 const run=spawnSync(process.execPath,[file,'--game','spellweavers-run'],{encoding:'utf8'});
 if(run.stdout) process.stdout.write(run.stdout);
 if(run.stderr) process.stderr.write(run.stderr);
 console.log(`MUTANT_RESULT ${name}: exit=${run.status}`);
 if(run.error) throw run.error;
 if(run.status===0){console.log(`FALSE_PASS ${name}`);falsePass=true;}
 if(run.status===null) throw new Error(`${name}: child did not return an exit status`);
}
const stale=spawnSync(process.execPath,['measure/runs/old_browser_builtins_20261122/run-stale-demo-mutant-r2.mjs'],{encoding:'utf8'});
if(stale.stdout) process.stdout.write(stale.stdout);
if(stale.stderr) process.stderr.write(stale.stderr);
console.log(`MUTANT_RESULT stale-demo-on-5199: driver exit=${stale.status}`);
if(stale.error) throw stale.error;
if(stale.status!==0) throw new Error(`stale demo driver failed with status ${stale.status}`);
if(stale.stdout?.includes('STALE_DEMO_MUTANT_EXIT=0')){console.log('FALSE_PASS stale-demo-on-5199');falsePass=true;}
else if(!stale.stdout?.includes('STALE_DEMO_MUTANT_EXIT=1')) throw new Error('stale demo mutant did not report its check exit status');
if(stale.status===null) throw new Error('stale demo driver did not return an exit status');
process.exitCode=falsePass?9:0;
