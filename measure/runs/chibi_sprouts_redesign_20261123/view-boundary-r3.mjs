import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';

const root = '/home/daniebo/Desktop/forge-worktrees/sprouts-redesign/measure/runs/chibi_sprouts_redesign_20261123/view-probe-r3';
const runner = '/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh';
const runDir = '/home/daniebo/Desktop/forge-worktrees/sprouts-redesign/measure/runs/chibi_sprouts_redesign_20261123';
const quote = (s) => `'${String(s).replaceAll("'", "'\\''")}'`;
const cases = [];
const run = (label, args, expected) => {
  const output = `${root}/out/avatar-base`;
  if (existsSync(output)) rmSync(output, { recursive: true, force: true });
  const cmd = `cd ${quote(root)} && ./forge ${args.map(quote).join(' ')}`;
  let child;
  do {
    child = spawnSync('bash', [runner, '-c', cmd], {
      cwd: root,
      encoding: 'utf8',
      timeout: 600_000,
      env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500', FORGE_DEBUG: '1' },
    });
  } while (child.status === 75);
  const text = `${child.stdout ?? ''}${child.stderr ?? ''}`;
  const lines = text.split('\n').map((x) => x.trim()).filter((x) => x && !/^\[\d+ ms\]/.test(x));
  const ok = expected === 'success'
    ? child.status === 0
    : expected === 'empty-fallback'
      ? child.status === 0 && text.includes('vite server created')
      : child.status !== 0 && lines.length === 1 && lines[0].includes(expected) && !text.includes('vite server created');
  cases.push(`${label}: pid=${child.pid ?? 'none'} exit=${child.status} expected=${expected} ${ok ? 'PASS' : 'FAIL'}`);
  if (!ok) cases.push(text.slice(0, 1600));
  if (label === 'whitespace-members' && (!existsSync(`${output}/views/front.png`) || !existsSync(`${output}/views/side.png`))) cases.push('FAIL: missing whitespace-normalized view files');
  if (label === 'duplicate-members' && !existsSync(`${output}/views/front.png`)) cases.push('FAIL: duplicate view did not render');
  return { status: child.status, text, output };
};
run('empty-render-list', ['render','avatar-base','--fast','--views','','--size','32','--bg','none'], "Unknown view ''");
run('only-commas-render', ['render','avatar-base','--fast','--views',',,,','--size','32','--bg','none'], "Unknown view ''");
run('whitespace-members', ['render','avatar-base','--fast','--views',' front , side ','--size','32','--bg','none'], 'success');
run('duplicate-members', ['render','avatar-base','--fast','--views','front,front','--size','32','--bg','none'], 'success');
run('case-sensitive', ['render','avatar-base','--fast','--views','Front','--size','32','--bg','none'], "Unknown view 'Front'");
run('unicode-member', ['render','avatar-base','--fast','--views','frönt','--size','32','--bg','none'], "Unknown view 'frönt'");
const longList = `${'front,'.repeat(2500)}nosuch`;
run('very-long-list', ['render','avatar-base','--fast','--views',longList,'--size','32','--bg','none'], "Unknown view 'nosuch'");
for (const name of ['__proto__','constructor','toString','valueOf','hasOwnProperty','prototype']) {
  run(`own-property-${name}`, ['render','avatar-base','--fast','--views',name,'--size','32','--bg','none'], `Unknown view '${name}'`);
}
run('top-valid-inspect', ['inspect','avatar-base','--fast','--views','top'], 'success');
run('top-valid-render', ['render','avatar-base','--fast','--views','top','--size','32','--bg','none'], 'success');
run('front-level-animate', ['animate','adventurer','--fast','--views','front-level','--clip','idle','--frames','1','--size','32'], 'success');
const emptyAnimate = run('empty-animate-list', ['animate','adventurer','--fast','--views','','--clip','idle','--frames','1','--size','32'], 'empty-fallback');
run('empty-inspect-list', ['inspect','avatar-base','--fast','--views',''], 'empty-fallback');
const cutout = join(runDir, 'cutout-whitespace-r3');
mkdirSync(cutout, { recursive: true });
let child;
do {
 child = spawnSync('bash', [runner, '-c', `cd ${quote(root)} && ./forge cutout avatar-base --fast --out ${quote(cutout)} --views ${quote(' front , side ')} --canvas 32x32 --ppm 16`], {cwd: root, encoding:'utf8', timeout:600_000, env:{...process.env, HEAVY_MIN_AVAIL_MB:'1500', FORGE_DEBUG:'1'}});
} while (child.status===75);
cases.push(`cutout-whitespace-members: pid=${child.pid ?? 'none'} exit=${child.status} ${child.status===0?'PASS':'FAIL'}`);
rmSync(cutout,{recursive:true,force:true});

const out = join(root,'out','avatar-base');
const flatTarget = join(runDir,'dangling-flat-target-r3');
if (existsSync(out)) rmSync(out,{recursive:true,force:true});
mkdirSync(out,{recursive:true});
symlinkSync(flatTarget,join(out,'flat'),'dir');
let dangling;
do { dangling=spawnSync('bash',[runner,'-c',`cd ${quote(root)} && ./forge render avatar-base --fast --flat --bg none --views front-level --size 32`],{cwd:root,encoding:'utf8',timeout:600_000,env:{...process.env,HEAVY_MIN_AVAIL_MB:'1500',FORGE_DEBUG:'1'}}); } while(dangling.status===75);
const danglingText=`${dangling.stdout??''}${dangling.stderr??''}`;
const danglingLines=danglingText.split('\n').map(x=>x.trim()).filter(x=>x&&!/^\[\d+ ms\]/.test(x));
cases.push(`dangling-flat-link: pid=${dangling.pid??'none'} exit=${dangling.status} one-line=${danglingLines.length===1} refused=${danglingLines[0]?.includes('output folder is a link')} target-created=${existsSync(flatTarget)}`);
rmSync(out,{recursive:true,force:true});
const result=`${cases.join('\n')}\nTOTAL=${cases.length}\nEMPTY_ANIMATE_USED_DEFAULT=${emptyAnimate.text.includes('three-quarter') && emptyAnimate.text.includes('side')}\n`;
console.log(result);
