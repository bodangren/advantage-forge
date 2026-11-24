import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = '/home/daniebo/Desktop/forge-worktrees/sprouts-redesign';
const runner = '/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh';
const runDir = `${root}/measure/runs/chibi_sprouts_redesign_20261123`;
const commands = ['render', 'build', 'sprites', 'animate', 'all', 'inspect', 'check', 'cutout'];
const names = [
  ['trailing-dot', 'avatar-base.'],
  ['trailing-space', 'avatar-base '],
  ['windows-drive-relative', 'C:avatar-base'],
  ['windows-drive-absolute', 'C:\\avatar-base'],
  ['very-long', 'a'.repeat(300)],
  ['reserved-out', 'out'],
  ['reserved-assets', 'assets'],
  ['case-mismatch', 'Avatar-base'],
];
const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;
const report = [];
let failures = 0;
for (const command of commands) {
  for (const [label, name] of names) {
    const args = [command, name];
    if (command === 'cutout') args.push('--out', join(runDir, `cutout-probe-${process.pid}`));
    const line = `./forge ${args.map(quote).join(' ')}`;
    const child = spawnSync('bash', [runner, '-c', line], {
      cwd: root,
      encoding: 'utf8',
      timeout: 600_000,
      env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500', FORGE_DEBUG: '1' },
    });
    const output = `${child.stdout ?? ''}${child.stderr ?? ''}`;
    const passed = child.status !== 0 && !output.includes('vite server created');
    if (!passed) failures += 1;
    report.push(`${command}/${label}: pid=${child.pid ?? 'none'} exit=${child.status} preflight=${passed ? 'yes' : 'NO'} signal=${child.signal ?? 'none'}`);
    if (!passed) report.push(output.slice(0, 1200));
  }
}
const text = `${report.join('\n')}\nTOTAL=${commands.length * names.length} FAILED=${failures}\n`;
writeFileSync(join(runDir, 'asset-boundary-probe.log'), text);
console.log(text);
if (failures) process.exitCode = 1;

