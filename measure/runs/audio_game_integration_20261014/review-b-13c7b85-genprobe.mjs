// Review B security probe for the Phase 3 generator (audit head 13c7b85c).
// Run: node measure/runs/audio_game_integration_20261014/review-b-13c7b85-genprobe.mjs
// Verifies in a copied tree: write mode writes only the generated file, --check
// writes nothing, drift in either direction fails --check with a named event,
// and the generated entries stay inside the seven set names.
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REPO = process.cwd();
const tmp = mkdtempSync(join(tmpdir(), 'review-b-genprobe-'));
let pass = 0;
let fail = 0;
const results = [];

function check(id, condition, detail = '') {
  if (condition) {
    pass += 1;
    results.push(`ok ${id}`);
  } else {
    fail += 1;
    results.push(`FAIL ${id} ${detail}`);
  }
}

function run(args, cwd) {
  try {
    const stdout = execFileSync(process.execPath, args, { cwd, encoding: 'utf8' });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return { code: err.status ?? -1, stdout: err.stdout ?? '', stderr: err.stderr ?? '' };
  }
}

function treeFiles(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else out.push(path.slice(root.length + 1));
    }
  };
  walk(root);
  return out.sort();
}

try {
  // Build a copied tree: scripts/, docs/, and the target folder, as the script resolves ROOT.
  cpSync(join(REPO, 'scripts', 'audio-event-map.mjs'), join(tmp, 'scripts', 'audio-event-map.mjs'));
  cpSync(join(REPO, 'docs', 'sound-event-map.tsv'), join(tmp, 'docs', 'sound-event-map.tsv'));
  mkdirSync(join(tmp, 'src', 'apk3d', 'audio'), { recursive: true });
  const script = join('scripts', 'audio-event-map.mjs');

  // G1: write mode writes exactly one file.
  const before = treeFiles(tmp);
  const write = run([script], tmp);
  const after = treeFiles(tmp);
  check(
    'G1.write.singleFile',
    write.code === 0 &&
      after.length === before.length + 1 &&
      after.includes(join('src', 'apk3d', 'audio', 'chibi-events.gen.ts')),
    `code=${write.code} new=${after.filter((f) => !before.includes(f)).join(',')}`,
  );

  // G2: --check exits 0 on the fresh write and writes nothing.
  const preCheck = treeFiles(tmp).map(
    (f) => `${f}:${statSync(join(tmp, f)).mtimeMs}:${statSync(join(tmp, f)).size}`,
  );
  const checkRun = run([script, '--check'], tmp);
  const postCheck = treeFiles(tmp).map(
    (f) => `${f}:${statSync(join(tmp, f)).mtimeMs}:${statSync(join(tmp, f)).size}`,
  );
  check(
    'G2.check.clean',
    checkRun.code === 0 &&
      preCheck.length === postCheck.length &&
      postCheck.every((f) => preCheck.includes(f)),
    `code=${checkRun.code}`,
  );

  // G3: a changed TSV row makes --check exit 1 and name the event.
  const tsvPath = join(tmp, 'docs', 'sound-event-map.tsv');
  const tsv = readFileSync(tsvPath, 'utf8');
  writeFileSync(tsvPath, tsv.replace('tap\tchibi/tap', 'tap\tchibi/star'));
  const drifted = run([script, '--check'], tmp);
  check(
    'G3.check.driftSource',
    drifted.code === 1 && drifted.stderr.includes('tap: expected star, found tap'),
    `code=${drifted.code} stderr=${drifted.stderr.trim()}`,
  );

  // G4: an extra key in the generated file makes --check exit 1.
  const genPath = join(tmp, 'src', 'apk3d', 'audio', 'chibi-events.gen.ts');
  writeFileSync(tsvPath, tsv);
  writeFileSync(genPath, `${readFileSync(genPath, 'utf8')}  evil: 'tap',\n`);
  const extra = run([script, '--check'], tmp);
  check(
    'G4.check.extraKey',
    extra.code === 1 && extra.stderr.includes('evil: not in docs/sound-event-map.tsv'),
    `code=${extra.code} stderr=${extra.stderr.trim()}`,
  );

  // G5: --check with the generated file absent exits 1 and writes nothing.
  rmSync(genPath);
  const missingFiles = treeFiles(tmp).length;
  const missing = run([script, '--check'], tmp);
  check(
    'G5.check.missingTarget',
    missing.code === 1 && missing.stderr.includes('cannot read') && treeFiles(tmp).length === missingFiles,
    `code=${missing.code} stderr=${missing.stderr.trim()}`,
  );

  // G6: regenerated content matches the committed generated file byte for byte.
  run([script], tmp);
  const committed = readFileSync(join(REPO, 'src', 'apk3d', 'audio', 'chibi-events.gen.ts'), 'utf8');
  const generated = readFileSync(genPath, 'utf8');
  check('G6.gen.matchesCommitted', generated === committed);

  // G7: every generated entry is one of the seven set names (no URL injection at generation time).
  const setNames = JSON.parse(readFileSync(join(REPO, 'sounds/sets/chibi.json'), 'utf8')).sounds.map(
    (s) => s.name,
  );
  const entries = [...generated.matchAll(/^\s*([A-Za-z0-9_-]+):\s*'([^']+)',/gm)].map((m) => [m[1], m[2]]);
  check(
    'G7.entries.areSetNames',
    entries.length === 31 && entries.every(([, entry]) => setNames.includes(entry)),
    `entries=${entries.length}`,
  );
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log(results.join('\n'));
console.log(`SUMMARY pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
