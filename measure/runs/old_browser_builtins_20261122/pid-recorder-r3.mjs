import { appendFileSync } from 'node:fs';
import { createRequire, syncBuiltinESMExports } from 'node:module';
const require=createRequire(import.meta.url);
const cp=require('node:child_process');
const original=cp.spawn;
cp.spawn=function(command,args,options){
 const child=original.call(cp,command,args,options);
 const line=[command,...(Array.isArray(args)?args:[])].join(' ');
 if(line.includes('vite.js')||line.includes('chrome-headless-shell')||line.includes('node -e')){
   appendFileSync('/home/daniebo/Desktop/advantage-forge/measure/runs/old_browser_builtins_20261122/pids-r3.log',`${child.pid} ${line}\n`);
 }
 return child;
};
syncBuiltinESMExports();
