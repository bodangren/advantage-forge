/**
 * Create a run directory: the model-visible candidate tree, the pristine hashes used for the file
 * contract, and the exact task prompt.
 *
 *   tsx bench/prepare.ts <run-dir> <brief.json> <arm a|b> <vision 0|1> <minutes>
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { copyRepo, hashTree, writeJson } from './lib.js';
import { loadBrief, taskPrompt } from './prompt.js';

const [runDir, briefPath, arm, vision, minutes] = process.argv.slice(2);
if (!runDir || !briefPath || !arm || !vision || !minutes)
  throw new Error('usage: prepare.ts <run-dir> <brief.json> <a|b> <0|1> <minutes>');
const brief = loadBrief(briefPath);
const cand = join(runDir, 'candidate');
rmSync(cand, { recursive: true, force: true });
copyRepo(cand);

// Never show a model an existing answer for its own brief.
rmSync(join(cand, 'assets', `${brief.id}.ts`), { force: true });
// Both arms read the same AGENTS.md; the skill itself is only mounted in arm b.
const agents = join(cand, 'AGENTS.md');
writeFileSync(
  agents,
  readFileSync(agents, 'utf8').replace(
    /For the full creative process[^\n]*\n[^\n]*\n/,
    'If a `forge-assets` skill is available, use it for the full creative process.\n',
  ),
);
mkdirSync(join(cand, 'node_modules'), { recursive: true }); // mount point for read-only deps
mkdirSync(join(cand, 'out'), { recursive: true });

writeJson(join(runDir, 'pristine.json'), hashTree(cand, new Set(['node_modules', 'out'])));
writeFileSync(join(runDir, 'prompt.md'), taskPrompt(brief, Number(minutes), vision === '1'));
writeJson(join(runDir, 'brief.json'), brief);
console.log(`prepared ${cand} (arm ${arm})`);
