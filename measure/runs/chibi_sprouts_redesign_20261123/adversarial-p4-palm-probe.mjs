import { palmCheck } from '/home/daniebo/Desktop/forge-worktrees/sprouts-redesign/scripts/proportion-check.mjs';
function fixture(mirror=false){
 const positions=[]; const indices=[]; const n=16;
 for(const x of [0.15,0.19]){
  const base=positions.length/3;
  for(let i=0;i<=n;i++)for(let j=0;j<=n;j++)positions.push(x,0.48+0.04*i/n,0.03+0.04*j/n);
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){
   const a=base+i*(n+1)+j,b=base+(i+1)*(n+1)+j,c=base+i*(n+1)+j+1,d=base+(i+1)*(n+1)+j+1;
   if(x===0.15)indices.push(a,c,b,b,c,d); else indices.push(a,b,c,b,d,c);
  }
 }
 let p=new Float32Array(positions);let ix=new Uint32Array(indices);
 const map=(v)=> mirror ? -v : v;
 if(mirror){for(let i=0;i<p.length;i+=3)p[i]=map(p[i]);for(let t=0;t<ix.length;t+=3){const q=ix[t+1];ix[t+1]=ix[t+2];ix[t+2]=q;}}
 const l={palmCentre:[map(.15),.5,.05],thumbTip:[map(.19),.5,.07],fingerTip:[map(.17),.48,.03]};
 return {mesh:{positions:p,indices:ix},landmarks:l};
}
const cases=[];
for(const side of ['L','R']){const {mesh,landmarks}=fixture(side==='R'); const r=palmCheck(side,mesh,landmarks);cases.push({case:`normal-${side}`,result:r});}
{
 const {mesh,landmarks}=fixture(); const bad={...landmarks,thumbTip:[.19,.5,.03]};cases.push({case:'thumb-backward',result:palmCheck('L',mesh,bad)});
}
{
 const {mesh,landmarks}=fixture();cases.push({case:'empty-indices',result:palmCheck('L',{positions:mesh.positions,indices:new Uint32Array()},landmarks)});
}
{
 const {mesh,landmarks}=fixture();const idx=new Uint32Array(mesh.indices.length);for(let i=0;i<idx.length;i+=3){idx[i]=0;idx[i+1]=0;idx[i+2]=0;}cases.push({case:'degenerate-triangles',result:palmCheck('L',{positions:mesh.positions,indices:idx},landmarks)});
}
{
 const {mesh,landmarks}=fixture();const bad=new Float32Array(mesh.positions.length);bad.fill(.15);cases.push({case:'degenerate-cloud',result:palmCheck('L',{positions:bad,indices:mesh.indices},landmarks)});
}
console.log(JSON.stringify(cases,null,2));
