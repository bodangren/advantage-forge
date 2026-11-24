import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = '/home/daniebo/Desktop/forge-worktrees/sprouts-redesign/measure/runs/chibi_sprouts_redesign_20261123/view-probe-fc823ed';
const runner = '/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh';
const name = '_view-validation-probe';
const out = join(root, 'out', name);
const cases = [
  ['unknown-among-valid-render', `render ${name} --fast --bg none --size 64 --views front,nosuch,side`, false],
  ['empty-render-list', `render ${name} --fast --bg none --size 64 --views ''`, false],
  ['duplicate-render-views', `render ${name} --fast --bg none --size 64 --views front,front`, true],
  ['valid-named-view-animate', `animate ${name} --fast --bg none --size 64 --views front-level --clip idle --frames 1`, true],
  ['unknown-animate-view', `animate ${name} --fast --bg none --size 64 --views front,nosuch --clip idle --frames 1`, false],
  ['irrelevant-view-list-sprites', `sprites ${name} --fast --bg none --size 32 --dirs 1 --views nosuch`, true],
];
const lines = [];
let failed = 0;
for (const [label, command, expectedSuccess] of cases) {
  if (existsSync(out)) rmSync(out, { recursive: true, force: true });
  const child = spawnSync('bash', [runner, '-c', `cd ${root} && ./forge ${command}`], {
    cwd: root,
    encoding: 'utf8',
    timeout: 600_000,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500', FORGE_DEBUG: '1' },
  });
  const output = `${child.stdout ?? ''}${child.stderr ?? ''}`;
  const succeeded = child.status === 0;
  const preflightFailedBeforeServer = !expectedSuccess && !output.includes('vite server created');
  const ok = expectedSuccess ? succeeded : child.status !== 0 && preflightFailedBeforeServer;
  if (!ok) failed += 1;
  lines.push(`${label}: pid=${child.pid ?? 'none'} exit=${child.status} expected=${expectedSuccess ? 'success' : 'preflight-failure'} result=${ok ? 'PASS' : 'FAIL'}`);
  if (!ok) lines.push(output.slice(0, 1600));
}
lines.push(`TOTAL=${cases.length} FAILED=${failed}`);
console.log(lines.join('\n'));
if (failed) process.exitCode = 1;
