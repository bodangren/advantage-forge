// Argument-handling probe for scripts/old-browser-check.mjs.
// Every case must exit 1 with the usage line and must spawn nothing and write nothing.
import { spawnSync } from 'node:child_process';

const cases = [
  ['bad-path value', ['--game', '../../etc']],
  ['missing value', ['--game']],
  ['no arguments', []],
  ['injection attempt', ['--game', 'spellweavers-run; touch /tmp/p3-owned']],
  ['unknown game', ['--game', 'rune-match']],
];
for (const [name, args] of cases) {
  const run = spawnSync(process.execPath, ['scripts/old-browser-check.mjs', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: 15000,
  });
  console.log(
    `${name}: exit=${run.status} stderr-first=${String(run.stderr).split('\n')[0]?.slice(0, 90)}`,
  );
}
