import { appendFileSync } from 'node:fs';
import { createRequire, syncBuiltinESMExports } from 'node:module';
const require = createRequire(import.meta.url);
const childProcess = require('node:child_process');
const originalSpawn = childProcess.spawn;
childProcess.spawn = function (command, args, options) {
  const child = originalSpawn.call(childProcess, command, args, options);
  const line = [command, ...(Array.isArray(args) ? args : [])].join(' ');
  if (line.includes('vite.js') || line.includes('chrome-headless-shell')) {
    appendFileSync('/home/daniebo/Desktop/advantage-forge/measure/runs/old_browser_builtins_20261122/pids-ad56865.log', `${child.pid} ${line}\n`);
  }
  return child;
};
syncBuiltinESMExports();
