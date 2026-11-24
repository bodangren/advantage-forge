import { checkRows, palmCheck, measurePixels } from '/home/daniebo/Desktop/forge-worktrees/sprouts-redesign/scripts/proportion-check.mjs';
const spec = [
  ['heightInHeads', 3.54, 3.74], ['armToTorso', 1.25, 1.41], ['legShare', .36, .42],
  ['headToShoulders', 1.11, 1.27], ['wrist', -.16, .04], ['fingertips', .41, .61],
  ['eyeLine', .59, .65], ['eyeHeight', .09, .13], ['spacingHead', .35, .41],
  ['eyeWidthFace', .22, .24], ['spacingFace', .44, .50],
];
const row=(name,value,lo,hi)=>({name,value,lo,hi});
const out=[];
for (const [name,lo,hi] of spec) {
  for (const [label,v,pass] of [['lo',lo,true],['hi',hi,true],['below',lo-1e-9,false],['above',hi+1e-9,false]]) {
    const got=checkRows([row(name,v,lo,hi)]);
    out.push({case:`${name}:${label}`, expected:pass?'pass':`FAIL ${name}`, got:got.length?got[0]:'pass', ok:pass?got.length===0:got.length===1&&got[0].startsWith(`FAIL ${name}:`)});
  }
  for(const [label,v] of [['NaN',NaN],['negative',-1],['zero',0]]) {
    const got=checkRows([row(name,v,lo,hi)]);
    const expectedPass = Number.isFinite(v) && v >= lo && v <= hi;
    out.push({case:`${name}:${label}`,got:got.length?got[0]:'pass',ok:expectedPass?got.length===0:got.length===1});
  }
  const got=checkRows([row(name,String((lo+hi)/2),lo,hi)]);
  out.push({case:`${name}:numeric-string`,got:got.length?got[0]:'pass',ok:got.length===1});
}
const full=spec.map(([n,lo,hi])=>row(n,(lo+hi)/2,lo,hi));
for(const [label,rows] of [['missing-row',full.slice(1)],['extra-row',[...full,row('unexpected',1,0,2)]],['duplicate-row',[...full,row('heightInHeads',3.6,3.54,3.74)]],['empty',[]]]) {
 const got=checkRows(rows); out.push({case:`table:${label}`,got:got.length?got:'pass',ok:false});
}
out.push({case:'five-synthetic-figures',got:measurePixels().map(x=>({name:x.name,ok:x.ok,failures:x.failures,guards:x.guards})),ok:measurePixels().every(x=>x.name==='pass'?x.ok:!x.ok)});
console.log(JSON.stringify(out,null,2));
console.log(`SUMMARY cases=${out.length} failed=${out.filter(x=>!x.ok).length}`);
