// r2 argument-handling probe: every bad case exits 1 with usage, --help exits 0,
// nothing spawns or writes for any case.
import { spawnSync } from 'node:child_process';

const cases = [
  ['bad-path value', ['--game', '../../etc'], 1],
  ['missing value', ['--game'], 1],
  ['no arguments', [], 1],
  ['injection attempt', ['--game', 'spellweavers-run; touch /tmp/p3-r2-owned'], 1],
  ['unknown game', ['--game', 'rune-match'], 1],
  ['unknown extra flag', ['--game', 'spellweavers-run', '--nope'], 1],
  ['help', ['--help'], 0],
];
for (const [name, args, want] of cases) {
  const run = spawnSync(process.execPath, ['scripts/old-browser-check.mjs', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 15000,
  });
  const first = String(run.status === 0 ? run.stdout : run.stderr).split('\n')[0]?.slice(0, 80);
  console.log(`${name}: exit=${run.status} want=${want} first-line=${first}`);
}
