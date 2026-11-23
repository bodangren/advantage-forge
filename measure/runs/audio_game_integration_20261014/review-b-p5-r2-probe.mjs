// Review B round 2 probe for Phase 5 T8g (audit head df7f01bf).
// Run: HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node measure/runs/audio_game_integration_20261014/review-b-p5-r2-probe.mjs'
// Builds fixture copies of the two sound folders under the run directory, patches a COPY of
// scripts/audio-handoff.mjs to point at the fixtures, and exercises the symlink rejection and
// the inventory allowlist. No live edit of demo/public or sounds/.
import { execFileSync } from 'node:child_process';
import { existsSync, cpSync, lstatSync, mkdirSync, readFileSync, rmSync, symlinkSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RUN = 'measure/runs/audio_game_integration_20261014';
const FIX = join(RUN, 'handoff-fixture');
const FIX_DEMO = join(FIX, 'demo');
const FIX_SOURCE = join(FIX, 'source');
const FIX_OUT = join(FIX, 'out');
const PROBE = join(RUN, 'review-b-p5-r2-handoff-copy.mjs');
const REAL_DEMO = 'demo/public/audio/chibi';
const REAL_SOURCE = 'sounds/chibi';

const script = readFileSync('scripts/audio-handoff.mjs', 'utf8');
const patched = script
  .replace("const SOURCE = join(ROOT, 'sounds', 'chibi');", `const SOURCE = ${JSON.stringify(FIX_SOURCE)};`)
  .replace("const DEMO = join(ROOT, 'demo', 'public', 'audio', 'chibi');", `const DEMO = ${JSON.stringify(FIX_DEMO)};`)
  .replace("const HANDOFF = join(ROOT, 'out', 'apk-audio-handoff', 'chibi');", `const HANDOFF = ${JSON.stringify(FIX_OUT)};`);
if (patched === script) throw new Error('probe setup: path constants not patched');
writeFileSync(PROBE, patched);

function reset(extra) {
  rmSync(FIX, { recursive: true, force: true });
  mkdirSync(FIX_DEMO, { recursive: true });
  mkdirSync(FIX_SOURCE, { recursive: true });
  for (const name of readdirSync(REAL_DEMO)) {
    cpSync(join(REAL_DEMO, name), join(FIX_DEMO, name));
    cpSync(join(REAL_SOURCE, name), join(FIX_SOURCE, name));
  }
  if (extra) extra();
}

function runProbe(label) {
  let code = 0;
  let stderr = '';
  try {
    execFileSync(process.execPath, [PROBE], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    code = error.status ?? -1;
    stderr = (error.stderr ?? '').toString().split('\n').slice(0, 3).join(' | ');
  }
  const outExists = existsSync(FIX_OUT);
  const outIsLink = outExists && lstatSync(FIX_OUT).isSymbolicLink();
  console.log(`${label}: exit=${code} out-exists=${outExists}${outIsLink ? ' (symlink!)' : ''} stderr=${stderr}`);
  return { code, outExists };
}

// A: a symlink in both fixture folders must die before any write.
reset(() => {
  rmSync(join(FIX_DEMO, 'tap.ogg'));
  rmSync(join(FIX_SOURCE, 'tap.ogg'));
  symlinkSync('/etc/hostname', join(FIX_DEMO, 'tap.ogg'));
  symlinkSync('/etc/hostname', join(FIX_SOURCE, 'tap.ogg'));
});
const a = runProbe('A-symlink-both');

// B: a symlink in the demo folder only must also die (bytes would have matched).
reset(() => {
  rmSync(join(FIX_DEMO, 'tap.ogg'));
  symlinkSync('/etc/hostname', join(FIX_DEMO, 'tap.ogg'));
});
const b = runProbe('B-symlink-demo-only');

// C: an extra 15th name in both folders must fail the allowlist.
reset(() => {
  cpSync(join(FIX_DEMO, 'tap.ogg'), join(FIX_DEMO, 'zz-extra.ogg'));
  cpSync(join(FIX_SOURCE, 'tap.ogg'), join(FIX_SOURCE, 'zz-extra.ogg'));
});
const c = runProbe('C-extra-name');

// D: a case-changed name (TAP.ogg for tap.ogg) in both folders must fail the allowlist.
reset(() => {
  cpSync(join(FIX_DEMO, 'tap.ogg'), join(FIX_DEMO, 'TAP.ogg'));
  rmSync(join(FIX_DEMO, 'tap.ogg'));
  cpSync(join(FIX_SOURCE, 'tap.ogg'), join(FIX_SOURCE, 'TAP.ogg'));
  rmSync(join(FIX_SOURCE, 'tap.ogg'));
});
const d = runProbe('D-case-change');

// E: a clean fixture run must succeed and prove the patched copy is faithful.
reset();
const e = runProbe('E-clean-fixture');
if (e.code === 0) {
  const entries = readdirSync(FIX_OUT).sort();
  console.log(`E-clean-fixture: entries=${entries.length}`);
  try {
    execFileSync('sha256sum', ['-c', 'MANIFEST.sha256'], { cwd: FIX_OUT, stdio: ['ignore', 'pipe', 'pipe'] });
    console.log('E-clean-fixture: sha256sum -c exit=0');
  } catch (error) {
    console.log(`E-clean-fixture: sha256sum -c exit=${error.status}`);
  }
}

const pass =
  a.code === 1 && !a.outExists &&
  b.code === 1 && !b.outExists &&
  c.code === 1 && !c.outExists &&
  d.code === 1 && !d.outExists &&
  e.code === 0;
console.log(`probe-verdict:${pass ? 'PASS' : 'FAIL'}`);
rmSync(FIX, { recursive: true, force: true });
process.exit(pass ? 0 : 1);
