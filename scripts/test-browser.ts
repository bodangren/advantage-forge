import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const workspaceRoot = resolve(import.meta.dirname, '..');
const port = 5317 + (process.pid % 1000);
const browserUrl = `http://127.0.0.1:${port}`;
const vite = await createServer({
  root: workspaceRoot,
  logLevel: 'error',
  server: { host: '127.0.0.1', port, strictPort: true },
});
await vite.listen();

try {
  const playwrightCli = resolve(
    workspaceRoot,
    'node_modules/@playwright/test/cli.js',
  );
  const child = spawn(process.execPath, [playwrightCli, 'test'], {
    cwd: workspaceRoot,
    env: { ...process.env, PLAYWRIGHT_BASE_URL: browserUrl },
    stdio: 'inherit',
  });
  const exitCode = await new Promise<number>((resolveExit, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (signal !== null)
        reject(new Error(`Playwright exited from signal ${signal}.`));
      else resolveExit(code ?? 1);
    });
  });
  process.exitCode = exitCode;
} finally {
  await vite.close();
}
