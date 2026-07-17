import { spawnSync } from 'node:child_process';
import process from 'node:process';

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', 'scripts/generate.ts', ...process.argv.slice(2)],
  { stdio: 'inherit' },
);
process.exitCode = result.status ?? 1;
