// F3 probe: a decoy HTTP server on 127.0.0.1:5199 inside one heavy-run call.
// It must make the real script exit 1 quickly with a collision message. Not committed.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../..', import.meta.url));
const decoy = createServer((request, response) => {
  response.writeHead(200, { 'content-type': 'text/html' });
  response.end('<html><body>decoy</body></html>');
});
await new Promise((resolve, reject) => {
  decoy.once('error', reject);
  decoy.listen(5199, '127.0.0.1', resolve);
});

const started = Date.now();
let child;
let timedOut = false;
try {
  child = spawn(
    process.execPath,
    ['scripts/old-browser-check.mjs', '--game', 'spellweavers-run'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let out = '';
  child.stdout.on('data', (chunk) => {
    out += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    out += chunk.toString();
  });
  const code = await new Promise((resolve) => {
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
      resolve('TIMEOUT');
    }, 20000);
    child.once('exit', (value) => {
      clearTimeout(timer);
      resolve(value);
    });
  });
  const elapsed = Date.now() - started;
  console.log(`decoy collision: exit=${code} elapsed_ms=${elapsed} timed_out=${timedOut}`);
  console.log(`output: ${out.replace(/\s+/g, ' ').trim().slice(0, 400)}`);
  console.log(
    `verdict: ${
      code === 1 && !timedOut && out.includes('port 5199 already in use') && elapsed < 5000
        ? 'EXPECTED_FAIL_collision'
        : 'UNEXPECTED'
    }`,
  );
} finally {
  if (child && child.exitCode === null) child.kill('SIGKILL');
  await new Promise((resolve) => decoy.close(resolve));
}
