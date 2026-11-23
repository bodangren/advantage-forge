import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const root=process.cwd();
const source=readFileSync('tests/apk3d/no-unpolyfilled-builtins.test.ts','utf8');
const begin=source.indexOf('function strip(code: string): string {');
const end=source.indexOf("it('uses no unpolyfilled ES2022+ built-ins under SCAN_ROOT'");
assert(begin>=0&&end>begin);
const modulePath='measure/runs/old_browser_builtins_20261122/probe-exclusion-r4.ts';
writeFileSync(modulePath,`${source.slice(begin,end)}\nexport {strip,scanText,EXCLUSIONS,applyExclusions,PAGE_263,PAGE_440,PAGE_447};\n`);
const {strip,scanText,EXCLUSIONS,applyExclusions,PAGE_263,PAGE_440,PAGE_447}=await import(pathToFileURL(`${root}/${modulePath}`));
const label='Set .union('; const reason='r4 probe';
const entry=(file='<fixture>',line=1,text=PAGE_263)=>({file,line,label,text,reason});
function run(text, ex=[entry()], file='<fixture>') {
 const stripped=strip(text); const raw=scanText(stripped,file);
 return {raw:raw.map(h=>`${h.path}:${h.line}: ${h.label}`),problems:applyExclusions(raw,ex,(p,l)=>p===file?(stripped.split('\n')[l-1]??null):null)};
}
function expectHit(name,text,ex=[entry()],file='<fixture>') {
 const r=run(text,ex,file); assert(r.problems.some(x=>x.endsWith(label)),`${name}: expected hit, got ${JSON.stringify(r)}`); console.log(`PROBE PASS ${name}: hit preserved ${JSON.stringify(r.problems)}`);
}
function expectNoHit(name,text,ex=[entry()],file='<fixture>') {
 const r=run(text,ex,file); assert(!r.problems.some(x=>x.endsWith(label)),`${name}: expected no hit, got ${JSON.stringify(r)}`); console.log(`PROBE PASS ${name}: no built-in hit ${JSON.stringify(r.problems)}`);
}
for (const [name,text] of [
 ['holder receiver','holder.box.union(b);'],['non-ASCII receiver','λbox.union(b);'],['otherbox','otherbox.union(b);'],['mybox','mybox.union(b);'],['box2','box2.union(b);']]) expectHit(name,text);
const shifted='const x = 1;\n'+PAGE_263;
expectHit('allowed text on different line number',shifted,[entry('<fixture>',1,PAGE_263)]);
expectHit('allowed text in different file',PAGE_263,[entry('src/other.ts',1,PAGE_263)]);
expectHit('allowed text with trailing code',`${PAGE_263} structuredClone(s);`);
for(const [name,text] of [
 ['leading tab indentation',`\t${PAGE_263}`],
 ['CRLF ending',`${PAGE_263}\r\n`],
 ['trailing comment',`${PAGE_263} // explanatory comment`],
]) {
 const r=run(text); assert(!r.problems.some(x=>x.endsWith(label)),`${name}: ${JSON.stringify(r)}`); console.log(`PROBE PASS ${name}: accepted only after trimming/stripping ${JSON.stringify(r.problems)}`);
}
expectHit('internal tab differs from allowed spaces','if (!b.isEmpty())\tbox.union(b);');
expectHit('one-character edit','if (!b.isEmpty()) box.union(c);');
const twice=`${PAGE_263}\n${PAGE_263}`;
const twiceResult=run(twice,[entry('<fixture>',1,PAGE_263)]);
assert.deepEqual(twiceResult.problems,['<fixture>:2: Set .union(']);
console.log(`PROBE PASS repeated allowed text in file: second line remains ${JSON.stringify(twiceResult.problems)}`);
const moved=run(`const x = 0;\n${PAGE_263}`,[entry('src/render/page.ts',1,PAGE_263)],'src/render/page.ts');
assert(moved.problems[0]?.startsWith('stale exclusion src/render/page.ts:1:'));
assert(moved.problems.includes('src/render/page.ts:2: Set .union('));
console.log(`PROBE PASS moved line names stale entry ${JSON.stringify(moved.problems)}`);
expectNoHit('inside template literal','const t = `box.union(b)`;');
expectNoHit('inside line comment','// box.union(b)');
expectNoHit('inside block comment','/* box.union(b) */');
const page=readFileSync('src/render/page.ts','utf8');
const realProblems=applyExclusions(scanText(strip(page),'src/render/page.ts'),EXCLUSIONS,(p,l)=>p==='src/render/page.ts'?strip(page).split('\n')[l-1]??null:null);
assert.deepEqual(realProblems,[]);
const actual=page.split('\n');
for(const e of EXCLUSIONS){assert.equal(actual[e.line-1]?.trim(),e.text);}
const allRaw=[]; const linesByPath=new Map();
for(const file of readdirSync('src',{recursive:true}).filter(f=>f.endsWith('.ts')&&!f.endsWith('.gen.ts'))){
 const path=`src/${file}`; const text=strip(readFileSync(path,'utf8')); linesByPath.set(path,text.split('\n')); allRaw.push(...scanText(text,path));
}
const allProblems=applyExclusions(allRaw,EXCLUSIONS,(p,l)=>linesByPath.get(p)?.[l-1]??null);
assert.deepEqual(allProblems,[]);
assert.equal(allRaw.length,3);
console.log(`SOURCE PASS: real page exclusions ${JSON.stringify(EXCLUSIONS.map(e=>({file:e.file,line:e.line,text:e.text})))}; src raw hits=${allRaw.length}, residual=${allProblems.length}`);
