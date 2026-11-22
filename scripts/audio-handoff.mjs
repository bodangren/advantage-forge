/**
 * Builds the PM hand-off folder for the Chibi audio set (spec AC6).
 * The script reads only the two sound folders. It writes only under out/.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE = join(ROOT, 'sounds', 'chibi');
const DEMO = join(ROOT, 'demo', 'public', 'audio', 'chibi');
const HANDOFF = join(ROOT, 'out', 'apk-audio-handoff', 'chibi');
const TARGET = 'apps/advantage-games/public/audio/chibi/';
const COUNT = 14;

const names = readdirSync(DEMO).sort();
const sourceNames = readdirSync(SOURCE).sort();
if (names.length !== COUNT || sourceNames.length !== COUNT) {
  throw new Error(
    `audio-handoff: expected ${COUNT} files, found ${names.length} demo and ${sourceNames.length} sources`,
  );
}
if (names.join('\n') !== sourceNames.join('\n')) {
  throw new Error(
    `audio-handoff: demo and source names differ: ${names.join(', ')} vs ${sourceNames.join(', ')}`,
  );
}
for (const name of names) {
  const demoBytes = readFileSync(join(DEMO, name));
  const sourceBytes = readFileSync(join(SOURCE, name));
  if (!demoBytes.equals(sourceBytes)) throw new Error(`audio-handoff: ${name} differs from its source`);
}

rmSync(HANDOFF, { recursive: true, force: true });
mkdirSync(HANDOFF, { recursive: true });

const rows = [];
for (const name of names) {
  copyFileSync(join(DEMO, name), join(HANDOFF, name));
  const bytes = readFileSync(join(HANDOFF, name));
  const hash = createHash('sha256').update(bytes).digest('hex');
  const format = name.endsWith('.ogg') ? 'ogg' : 'mp3';
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

Load rule (spec AC4):
- The bus asks canPlayType once, in the first unlock. It tries audio/ogg; codecs="vorbis" first, then audio/mpeg. The first nonempty answer wins. Two empty answers keep every event on synth.
- A file URL is <base><entry>.<ext>, for example tap.ogg. The site base is /demo/. The wiring helper appends audio/chibi/ once.
- play(name) starts one decoded buffer through the master gain. Before decode, or when no file is mapped, the synth recipe sounds. A failed fetch or a failed decode marks the event, and synth serves every later call.

The model pack row in docs/apk-port.md names apps/advantage-games/public/packs/. This hand-off follows the same pattern with a proposed target.
`;
writeFileSync(join(HANDOFF, 'README.md'), readme);

console.log(`audio-handoff: ${HANDOFF}: ${COUNT} sounds, MANIFEST.tsv, MANIFEST.sha256, README.md`);
