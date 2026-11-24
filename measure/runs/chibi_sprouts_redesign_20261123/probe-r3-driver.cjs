// Review-b round-3 probes for the chibi_sprouts_redesign T3r2 remediation (0fbd781b).
// Every ./forge render runs through heavy-run.sh. Temp targets live under the track run dir,
// created exclusively and removed after.
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = '/home/daniebo/Desktop/forge-worktrees/sprouts-redesign';
const HEAVY_RUN = '/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh';
const RUNS = path.join(ROOT, 'measure', 'runs', 'chibi_sprouts_redesign_20261123');
const P = path.join(RUNS, 'probe-r3');
const report = [];

fs.rmSync(P, { recursive: true, force: true });
fs.mkdirSync(P, { recursive: true });

function pinSource(name) {
  return `import { defineAsset, sdf } from '../src/index.js';

export default defineAsset({
  name: '${name}',
  texture: false,
  build(k) {
    k.body('body', sdf.box([0.2, 0.2, 0.2]).at(0, 0.1, 0), { color: '#3f8fd0' });
  },
});
`;
}

function forgeSync(args) {
  const q = args.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(' ');
  return spawnSync('bash', [HEAVY_RUN, '-c', `./forge ${q}`], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 600_000,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
  });
}

function oneLine(res) {
  const combined = `${res.stdout || ''}\n${res.stderr || ''}`;
  const lines = combined.split('\n').map((s) => s.trim()).filter(Boolean);
  return { exit: res.status, lineCount: lines.length, firstLine: lines[0] || '' };
}

// 1. Asset-name regression probes (must still refuse, one line, before the build).
for (const [label, name] of [
  ['traversal', '../measure/runs/chibi_sprouts_redesign_20261123/probe-r3/x'],
  ['backslash', 'a\\b'],
  ['absolute', '/tmp/evil'],
]) {
  report.push({ label, ...oneLine(forgeSync(['render', name, '--fast'])) });
}

// 2. Prototype-pollution-style view names (were truthy on the plain table lookup).
const PIN = `_flat-render-pin3-rb${process.pid}`;
fs.writeFileSync(path.join(ROOT, 'assets', `${PIN}.ts`), pinSource(PIN), { flag: 'wx' });
for (const v of ['constructor', '__proto__', 'prototype', 'hasOwnProperty', 'toString']) {
  report.push({ label: `view-${v}`, ...oneLine(forgeSync(['render', PIN, '--fast', '--views', v])) });
}
report.push({ label: 'view-empty-commas', ...oneLine(forgeSync(['render', PIN, '--fast', '--views', ',,,'])) });
report.push({ label: 'view-trailing-comma', ...oneLine(forgeSync(['render', PIN, '--fast', '--views', 'front,', '--bg', 'none', '--size', '32'])) });

// 3. Linked output refusal: symlink at out/<name>/flat (real out/<name>).
const outDir = path.join(ROOT, 'out', PIN);
const flatDir = path.join(outDir, 'flat');
const T1 = path.join(P, 'target-flat');
fs.mkdirSync(T1, { recursive: true });
fs.writeFileSync(path.join(T1, 'marker.txt'), 'precious\n', { flag: 'wx' });
fs.mkdirSync(outDir, { recursive: true });
fs.symlinkSync(T1, flatDir);
let r = forgeSync(['render', PIN, '--fast', '--bg', 'none', '--flat', '--views', 'front-level', '--size', '64']);
report.push({
  label: 'linked-flat-refused',
  ...oneLine(r),
  markerSurvives: fs.existsSync(path.join(T1, 'marker.txt')),
  wroteIntoTarget: fs.existsSync(path.join(T1, 'front-level.png')),
  builtNothing: !fs.existsSync(path.join(outDir, 'stats.json')),
  flatStillSymlink: fs.lstatSync(flatDir).isSymbolicLink(),
});
fs.rmSync(flatDir, { force: true });

// 4. Linked output refusal: symlink at out/<name> (dangling and real targets).
const T2 = path.join(P, 'target-out');
fs.mkdirSync(T2, { recursive: true });
fs.writeFileSync(path.join(T2, 'marker2.txt'), 'precious\n', { flag: 'wx' });
fs.rmSync(outDir, { recursive: true, force: true });
fs.symlinkSync(T2, outDir);
r = forgeSync(['render', PIN, '--fast', '--bg', 'none', '--flat', '--views', 'front-level', '--size', '64']);
report.push({
  label: 'linked-outname-refused',
  ...oneLine(r),
  markerSurvives: fs.existsSync(path.join(T2, 'marker2.txt')),
  builtNothing: !fs.existsSync(path.join(T2, 'stats.json')),
});
fs.rmSync(outDir, { force: true });

// 5. Dangling symlinks at both spots.
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.symlinkSync(path.join(P, 'nowhere-flat'), flatDir);
r = forgeSync(['render', PIN, '--fast', '--bg', 'none', '--flat', '--views', 'front-level', '--size', '64']);
report.push({ label: 'dangling-flat-refused', ...oneLine(r) });
fs.rmSync(flatDir, { force: true });
fs.rmSync(outDir, { recursive: true, force: true });
fs.symlinkSync(path.join(P, 'nowhere-out'), outDir);
r = forgeSync(['render', PIN, '--fast', '--bg', 'none', '--flat', '--views', 'front-level', '--size', '64']);
report.push({ label: 'dangling-outname-refused', ...oneLine(r) });
fs.rmSync(outDir, { force: true });

// 6. Happy path regression: clean render, writes confined.
r = forgeSync(['render', PIN, '--fast', '--bg', 'none', '--flat', '--views', 'front-level', '--size', '64']);
report.push({
  label: 'happy-path',
  ...oneLine(r),
  wroteFlat: fs.existsSync(path.join(flatDir, 'front-level.png')),
});

// 7. Write-side TOCTOU: swap a symlink into out/<name>/flat between the pre-build check and the
//    late mkdirSync/writePng. A concurrent local actor model.
const RACE = `_flat-render-race-rb${process.pid}`;
fs.writeFileSync(path.join(ROOT, 'assets', `${RACE}.ts`), pinSource(RACE), { flag: 'wx' });
const RACE_OUT = path.join(ROOT, 'out', RACE);
const RT = path.join(P, 'race-target');
fs.mkdirSync(RT, { recursive: true });
fs.writeFileSync(path.join(RT, 'race-marker.txt'), 'precious\n', { flag: 'wx' });
const q = ['render', RACE, '--fast', '--bg', 'none', '--flat', '--views', 'front-level', '--size', '64']
  .map((a) => `'${a}'`)
  .join(' ');
const child = spawn('bash', [HEAVY_RUN, '-c', `./forge ${q}`], {
  cwd: ROOT,
  env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
});
(async () => {
let swapped = false;
const poller = setInterval(() => {
  if (!swapped && fs.existsSync(RACE_OUT) && fs.statSync(RACE_OUT).isDirectory()) {
    try {
      fs.symlinkSync(RT, path.join(RACE_OUT, 'flat'));
      swapped = true;
    } catch {}
  }
}, 15);
const raceResult = await new Promise((resolve) => {
  let out = '';
  child.stdout.on('data', (d) => (out += d));
  child.stderr.on('data', (d) => (out += d));
  child.on('close', (code) => resolve({ code, out }));
});
clearInterval(poller);
report.push({
  label: 'write-side-toctou-race',
  swapped: swapped,
  exit: raceResult.code,
  pngInTarget: fs.existsSync(path.join(RT, 'front-level.png')),
  raceMarkerSurvives: fs.existsSync(path.join(RT, 'race-marker.txt')),
});

// Cleanup.
for (const f of [PIN, RACE]) {
  try {
    fs.unlinkSync(path.join(ROOT, 'assets', `${f}.ts`));
  } catch {}
  try {
    const st = fs.lstatSync(path.join(ROOT, 'out', f));
    if (st.isSymbolicLink()) fs.unlinkSync(path.join(ROOT, 'out', f));
    else fs.rmSync(path.join(ROOT, 'out', f), { recursive: true, force: true });
  } catch {}
}
fs.rmSync(P, { recursive: true, force: true });
console.log(JSON.stringify(report, null, 2));
})();
