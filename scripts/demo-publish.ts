/**
 * Publishes the Monster Encounters demo to GitHub Pages: builds dist-demo/ and pushes it as the
 * only commit of the `gh-pages` branch (the built files never enter master's history).
 *
 *   node --import tsx scripts/demo-publish.ts            build and push
 *   node --import tsx scripts/demo-publish.ts --dry-run  build and prepare, but do not push
 *
 * One-time setup (already done for bodangren/advantage-forge): GitHub Pages serves the
 * gh-pages branch from its root. The page is then at https://<owner>.github.io/<repo>/.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist-demo');
const dry = process.argv.includes('--dry-run');

const run = (cmd: string, args: string[], cwd = ROOT): string => execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString().trim();

run(join(ROOT, 'node_modules/.bin/vite'), ['build', '--config', 'vite.demo.config.ts']);
if (!existsSync(join(DIST, 'index.html'))) throw new Error('The build did not write dist-demo/index.html.');
// No Jekyll processing: serve the files exactly as built.
writeFileSync(join(DIST, '.nojekyll'), '');

const origin = run('git', ['remote', 'get-url', 'origin']);
const source = run('git', ['rev-parse', '--short', 'HEAD']);
rmSync(join(DIST, '.git'), { recursive: true, force: true });
run('git', ['init', '-q', '-b', 'gh-pages'], DIST);
run('git', ['add', '-A'], DIST);
run('git', ['-c', 'user.name=Daniel Bo', '-c', `user.email=${run('git', ['config', 'user.email'])}`, 'commit', '-q', '-m', `Monster Encounters demo, built from ${source}`], DIST);
if (dry) console.log(`dry run: dist-demo/ is ready as a gh-pages commit (not pushed to ${origin})`);
else {
  run('git', ['push', '-f', origin, 'gh-pages'], DIST);
  console.log(`pushed gh-pages (${source}) to ${origin}`);
}
rmSync(join(DIST, '.git'), { recursive: true, force: true });
