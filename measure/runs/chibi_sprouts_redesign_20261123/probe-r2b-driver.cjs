// Re-probe: an asset file under assets/ that is a symlink to a source outside assets/.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = '/home/daniebo/Desktop/forge-worktrees/sprouts-redesign';
const HEAVY_RUN = '/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh';
const RUNS = path.join(ROOT, 'measure', 'runs', 'chibi_sprouts_redesign_20261123');
const P = path.join(RUNS, 'probe-r2b');
fs.rmSync(P, { recursive: true, force: true });
fs.mkdirSync(P, { recursive: true });

// escape-asset.ts sits at RUNS/probe-r2b/escape-asset.ts: up 3 = worktree root.
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

const SL = `probe-symlink-rb${process.pid}`;
fs.symlinkSync(ESCAPE, path.join(ROOT, 'assets', `${SL}.ts`));
const q = ['render', SL, '--fast', '--bg', 'none', '--flat', '--views', 'front-level', '--size', '64']
  .map((a) => `'${a}'`)
  .join(' ');
const r = spawnSync('bash', [HEAVY_RUN, '-c', `./forge ${q}`], {
  cwd: ROOT,
  encoding: 'utf8',
  timeout: 600_000,
  env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
});
const out = {
  label: 'asset-file-symlink-corrected',
  exit: r.status,
  accepted: r.status === 0,
  wroteUnderOutOnly:
    fs.existsSync(path.join(ROOT, 'out', SL, 'flat', 'front-level.png')) &&
    !fs.existsSync(path.join(P, 'escape-asset')),
  escapeDirCreatedOutsideOut: fs.existsSync(path.join(P, 'escape-asset')),
};
console.log(JSON.stringify(out, null, 2));
fs.unlinkSync(path.join(ROOT, 'assets', `${SL}.ts`));
fs.rmSync(path.join(ROOT, 'out', SL), { recursive: true, force: true });
fs.rmSync(P, { recursive: true, force: true });
