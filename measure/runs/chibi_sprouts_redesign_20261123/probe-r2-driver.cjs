// Review-b round-2 probes for the chibi_sprouts_redesign T3r remediation.
// Every ./forge render below runs through heavy-run.sh (each render acquires and releases the
// heavy lock itself). Pure node probes (TOCTOU, NUL) run inline.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = '/home/daniebo/Desktop/forge-worktrees/sprouts-redesign';
const HEAVY_RUN = '/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh';
const RUNS = path.join(ROOT, 'measure', 'runs', 'chibi_sprouts_redesign_20261123');
const P = path.join(RUNS, 'probe-r2');
const MARKER = path.join(P, 'marker.txt');
const report = [];

fs.rmSync(P, { recursive: true, force: true });
fs.mkdirSync(P, { recursive: true });
let markerExclusive = true;
try {
  fs.writeFileSync(MARKER, 'probe-marker\n', { flag: 'wx' });
} catch {
  markerExclusive = false;
}

const ESCAPE = path.join(P, 'escape-asset.ts');
fs.writeFileSync(
  ESCAPE,
  `import { defineAsset, sdf } from '../../../src/index.js';

export default defineAsset({
  name: 'escape-asset',
  texture: false,
  build(k) {
    k.body('body', sdf.box([0.2, 0.2, 0.2]).at(0, 0.1, 0), { color: '#3f8fd0' });
  },
});
`,
);

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

function forge(args) {
  const q = args.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(' ');
  return spawnSync('bash', [HEAVY_RUN, '-c', `./forge ${q}`], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 600_000,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
  });
}

function summarize(label, res, extra) {
  const combined = `${res.stdout || ''}\n${res.stderr || ''}`;
  const lines = combined.split('\n').map((s) => s.trim()).filter(Boolean);
  const markerNow = fs.existsSync(MARKER);
  report.push({
    label,
    exit: res.status,
    lineCount: lines.length,
    firstLine: lines[0] || '',
    markerSurvives: markerNow,
    ...extra,
  });
}

// 1. Re-run of the round-1 traversal probe (the escape asset file exists, as in r1).
summarize(
  'r1-traversal-rerun',
  forge([
    'render',
    '../measure/runs/chibi_sprouts_redesign_20261123/probe-r2/escape-asset',
    '--fast',
    '--bg',
    'none',
    '--flat',
    '--views',
    'front-level',
    '--size',
    '64',
  ]),
);

// 2. Hostile name shapes.
const nameCases = [
  ['backslash', 'a\\b'],
  ['absolute', '/tmp/evil'],
  ['dotdot-segment', '..'],
  ['single-dot', '.'],
  ['newline', 'li\nne'],
  ['fullwidth-slash', 'sprout／pip'],
];
for (const [label, name] of nameCases) {
  summarize(label, forge(['render', name, '--fast']));
}
summarize('dot-start', forge(['render', '.hidden', '--fast']));

// 3. NUL byte: the OS cannot pass it in argv.
try {
  const r = forge(['render', 'a\0b', '--fast']);
  report.push({ label: 'nul-byte', exit: r.status, note: 'spawn unexpectedly ran' });
} catch (e) {
  report.push({ label: 'nul-byte', spawnError: String(e.message).slice(0, 80) });
}

// 4. Fixture-name happy path: the documented fixture shape is accepted and confined.
const PIN = `_flat-render-pin-rb${process.pid}`;
fs.writeFileSync(path.join(ROOT, 'assets', `${PIN}.ts`), pinSource(PIN), { flag: 'wx' });
const outDir = path.join(ROOT, 'out', PIN);
const flatDir = path.join(outDir, 'flat');
let r = forge(['render', PIN, '--fast', '--bg', 'none', '--flat', '--views', 'front-level', '--size', '64']);
const tree1 = fs.existsSync(outDir)
  ? (function walk(d) {
      return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(d, e.name)).map((x) => `${e.name}/${x}`) : [e.name],
      );
    })(outDir).sort()
  : [];
summarize('pin-happy-path-1', r, { tree: tree1 });

// Second run must remove a REAL flat dir under out/<name> and rewrite it.
fs.writeFileSync(path.join(flatDir, 'sentinel.txt'), 'x');
r = forge(['render', PIN, '--fast', '--bg', 'none', '--flat', '--views', 'front-level', '--size', '64']);
summarize('pin-happy-path-2-removes-real-flat', r, {
  sentinelGone: !fs.existsSync(path.join(flatDir, 'sentinel.txt')),
  flatRewritten: fs.existsSync(path.join(flatDir, 'front-level.png')),
});

// 5. A symlink planted at out/<name>/flat: removal must refuse; marker must survive.
fs.rmSync(flatDir, { recursive: true, force: true });
const FT = path.join(P, 'flat-target');
fs.mkdirSync(FT);
fs.writeFileSync(path.join(FT, 'target-marker.txt'), 'precious\n');
fs.symlinkSync(FT, flatDir);
r = forge(['render', PIN, '--fast', '--bg', 'none', '--flat', '--views', 'front-level', '--size', '64']);
summarize('flat-symlink-refused', r, {
  targetMarkerSurvives: fs.existsSync(path.join(FT, 'target-marker.txt')),
  wroteIntoSymlinkTarget: fs.existsSync(path.join(FT, 'front-level.png')),
  flatStillSymlink: fs.lstatSync(flatDir).isSymbolicLink(),
});
fs.rmSync(flatDir, { force: true });

// 6. out/<name> itself a symlink at a temp folder: removal must refuse.
const PIN2 = `_flat-render-outlink-rb${process.pid}`;
fs.writeFileSync(path.join(ROOT, 'assets', `${PIN2}.ts`), pinSource(PIN2), { flag: 'wx' });
const OT = path.join(P, 'outlink-target');
fs.mkdirSync(path.join(OT, 'flat'), { recursive: true });
fs.writeFileSync(path.join(OT, 'flat', 'marker2.txt'), 'precious\n');
fs.symlinkSync(OT, outDir.replace(PIN, PIN2));
r = forge(['render', PIN2, '--fast', '--bg', 'none', '--flat', '--views', 'front-level', '--size', '64']);
summarize('outname-symlink-refused', r, {
  targetMarkerSurvives: fs.existsSync(path.join(OT, 'flat', 'marker2.txt')),
  wroteIntoSymlinkTarget: fs.existsSync(path.join(OT, 'flat', 'front-level.png')),
});

// 7. An asset file under assets/ that is a symlink to a source outside assets/.
const SL = `probe-symlink-rb${process.pid}`;
fs.symlinkSync(ESCAPE, path.join(ROOT, 'assets', `${SL}.ts`));
r = forge(['render', SL, '--fast', '--bg', 'none', '--flat', '--views', 'front-level', '--size', '64']);
summarize('asset-file-symlink', r, {
  accepted: r.status === 0,
  wroteUnderOutOnly: fs.existsSync(path.join(ROOT, 'out', SL, 'flat', 'front-level.png')) &&
    !fs.existsSync(path.join(P, 'escape-asset')),
});

// 8. TOCTOU semantics of rmSync: symlink swaps must not be followed.
const T = path.join(P, 'toctou');
fs.mkdirSync(path.join(T, 'a', 'flat'), { recursive: true });
fs.writeFileSync(path.join(T, 'a', 'flat', 'm.txt'), 'x');
fs.mkdirSync(path.join(T, 'b', 'flat'), { recursive: true });
fs.writeFileSync(path.join(T, 'b', 'flat', 'precious.txt'), 'precious\n');
const rpLeaf = fs.realpathSync(path.join(T, 'a', 'flat'));
fs.rmSync(path.join(T, 'a', 'flat'), { recursive: true, force: true });
fs.symlinkSync(path.join(T, 'b', 'flat'), path.join(T, 'a', 'flat'));
fs.rmSync(rpLeaf, { recursive: true, force: true });
const leafSwapPreciousSurvives = fs.existsSync(path.join(T, 'b', 'flat', 'precious.txt'));
fs.mkdirSync(path.join(T, 'c', 'name', 'flat'), { recursive: true });
fs.writeFileSync(path.join(T, 'c', 'name', 'flat', 'm2.txt'), 'x');
fs.mkdirSync(path.join(T, 'd', 'name', 'flat'), { recursive: true });
fs.writeFileSync(path.join(T, 'd', 'name', 'flat', 'precious2.txt'), 'precious\n');
const rpMid = fs.realpathSync(path.join(T, 'c', 'name', 'flat'));
fs.rmSync(path.join(T, 'c', 'name'), { recursive: true, force: true });
fs.symlinkSync(path.join(T, 'd', 'name'), path.join(T, 'c', 'name'));
fs.rmSync(rpMid, { recursive: true, force: true });
const midSwapPreciousSurvives = fs.existsSync(path.join(T, 'd', 'name', 'flat', 'precious2.txt'));
report.push({ label: 'toctou-rmsync-symlink-semantics', leafSwapPreciousSurvives, midSwapPreciousSurvives });

// Cleanup: fixtures, symlinks, and this probe dir.
for (const f of [SL, PIN, PIN2]) {
  try {
    fs.unlinkSync(path.join(ROOT, 'assets', `${f}.ts`));
  } catch {}
}
try {
  fs.rmSync(path.join(ROOT, 'out', PIN), { recursive: true, force: true });
} catch {}
try {
  fs.rmSync(path.join(ROOT, 'out', PIN2), { force: true });
} catch {}
const escapeOutUntouched = !fs.existsSync(path.join(P, 'escape-asset'));
fs.rmSync(P, { recursive: true, force: true });
report.push({ label: 'cleanup', markerExclusive, escapeOutUntouched, probeDirRemoved: !fs.existsSync(P) });

console.log(JSON.stringify(report, null, 2));
