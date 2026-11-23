// r2 full-run probe: green run, then measure port freedom within ~0.3 s of parent exit.
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const portBound = () => execFileSync('ss', ['-tln'], { encoding: 'utf8' }).includes(':5199');

const started = Date.now();
const run = spawn(process.execPath, ['scripts/old-browser-check.mjs', '--game', 'spellweavers-run'], {
  cwd: process.cwd(),
  stdio: ['ignore', 'pipe', 'pipe'],
});
let out = '';
run.stdout.on('data', (c) => (out += c));
run.stderr.on('data', (c) => (out += c));
const code = await new Promise((resolve) => run.on('exit', resolve));
const atExitBound = portBound();
const result = JSON.parse(out.trim().split('\n').at(-1) ?? '{}');
console.log(
  `exit=${code} elapsedMs=${Date.now() - started} started=${result.started} moves=${result.moves} state_changed=${result.state_changed} errors=${result.errors?.length}`,
);
console.log(`action_inputs: ${JSON.stringify(result.action_inputs)}`);
console.log(`absent_in_page: ${JSON.stringify(result.absent_in_page)}`);
let freedMs = null;
for (let i = 0; i < 30; i++) {
  if (!portBound()) {
    freedMs = i * 100;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
}
console.log(`port bound at parent exit: ${atExitBound}; freed after ~${freedMs ?? '>3000'}ms`);
const check = readFileSync('out/old-browser/check.json', 'utf8');
console.log(`check.json has /home/: ${check.includes('/home/')}; has user name: ${check.includes('daniebo')}`);
