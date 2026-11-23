/**
 * Builds the PM hand-off folder for the Chibi audio set (spec AC6).
 * The script reads only the two sound folders. It writes only under out/.
 */
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = 'usage: node scripts/audio-handoff.mjs';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = "measure/runs/audio_game_integration_20261014/handoff-fixture/source";
const DEMO = "measure/runs/audio_game_integration_20261014/handoff-fixture/demo";
const HANDOFF = "measure/runs/audio_game_integration_20261014/handoff-fixture/out";
const TARGET = 'apps/advantage-games/public/audio/chibi/';
const SOUND_NAMES = ['tap', 'right', 'wrong', 'star', 'pop', 'whoosh', 'level-end'];
const APPROVED = SOUND_NAMES.flatMap((name) => [`${name}.ogg`, `${name}.mp3`]).sort();
const COUNT = APPROVED.length;

/** Prints one diagnostic and exits before any write. */
function die(message) {
  console.error(`audio-handoff: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(USAGE);
  process.exit(0);
}
if (args.length > 0) {
  console.error(USAGE);
  process.exit(1);
}

/** Lists a sound folder and rejects a symlink before any read or copy. */
function inventory(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch (error) {
    die(`cannot read ${dir}: ${error.message}`);
  }
  for (const name of entries) {
    if (lstatSync(join(dir, name)).isSymbolicLink()) die(`symlink in ${dir}: ${name}`);
  }
  return entries.sort();
}

const names = inventory(DEMO);
const sourceNames = inventory(SOURCE);
if (
  names.length !== COUNT ||
  sourceNames.length !== COUNT ||
  names.join('\n') !== APPROVED.join('\n') ||
  sourceNames.join('\n') !== APPROVED.join('\n')
) {
  die(
    `unsupported sound inventory: expected ${APPROVED.join(', ')}; demo has ${names.join(', ')}; sources have ${sourceNames.join(', ')}`,
  );
}
for (const name of names) {
  const demoBytes = readFileSync(join(DEMO, name));
  const sourceBytes = readFileSync(join(SOURCE, name));
  if (!demoBytes.equals(sourceBytes)) die(`${name} differs from its source`);
}

rmSync(HANDOFF, { recursive: true, force: true });
mkdirSync(HANDOFF, { recursive: true });

const rows = [];
for (const name of names) {
  copyFileSync(join(DEMO, name), join(HANDOFF, name));
  const bytes = readFileSync(join(HANDOFF, name));
  const hash = createHash('sha256').update(bytes).digest('hex');
  let format;
  if (name.endsWith('.ogg')) format = 'ogg';
  else if (name.endsWith('.mp3')) format = 'mp3';
  else die(`unsupported format for ${name}`);
  rows.push({
    name,
    bytes: statSync(join(HANDOFF, name)).size,
    hash,
    format,
    source: `sounds/chibi/${name}`,
    target: `proposed: ${TARGET}${name}`,
  });
}

const checksum = rows.map((row) => `${row.hash}  ${row.name}\n`).join('');
writeFileSync(join(HANDOFF, 'MANIFEST.sha256'), checksum);

const header = 'file\tbytes\tsha256\tformat\tsource\ttarget\n';
const manifest = rows
  .map((row) => [row.name, row.bytes, row.hash, row.format, row.source, row.target].join('\t'))
  .join('\n');
writeFileSync(join(HANDOFF, 'MANIFEST.tsv'), `${header}${manifest}\n`);

const readme = `# Chibi audio hand-off

This folder holds ${COUNT} rendered sound files for the Chibi games: seven Ogg files and seven MP3 files.

Proposed target: ${TARGET}
The PM or the Monorepo session confirms or replaces this path. It stays proposed until a dated PM answer.

Load rule (spec AC4 and AC9):
- The bus probes both formats once with canPlayType and prefers Ogg when the Ogg answer is nonempty. It then tries MP3. Two empty answers keep every event on synth. The bus will keep the choice for the rest of the session.
- A preload can resolve the format before the first unlock. The first unlock reuses that choice. No second probe runs.
- A file URL is <base><entry>.<ext>, for example tap.ogg. The site base is /demo/. The wiring helper appends audio/chibi/ once.
- play(name) starts one decoded buffer through the master gain. Before decode, or when no file is mapped, the synth recipe sounds. A failed fetch or a failed decode marks the event, and synth serves every later call.

Recipient steps:
- Verify the bundle: from inside the folder, run sha256sum -c MANIFEST.sha256. The checksum file lists the 14 sound files by name.
- After the PM or Monorepo session confirms the target, copy the 14 sound files to the confirmed target. The manifests stay with the hand-off record.

The model pack row in docs/apk-port.md names apps/advantage-games/public/packs/. This hand-off follows the same pattern with a proposed target.
`;
writeFileSync(join(HANDOFF, 'README.md'), readme);

console.log(`audio-handoff: ${HANDOFF}: ${COUNT} sounds, MANIFEST.tsv, MANIFEST.sha256, README.md`);
