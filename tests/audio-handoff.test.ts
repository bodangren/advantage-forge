import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Covers spec AC6: the 14 demo files match the 14 sources, the docs row names
// the proposed target, the monorepo holds no track path, and the hand-off
// folder carries checksums and a README. Cases 1 to 3 run in the default
// suite. Cases 4 to 8 need the ignored artifact folder: run
// scripts/audio-handoff.mjs first, then AUDIO_HANDOFF_ARTIFACTS=1.
// No script output or folder is written here.

const SOUNDS_DIR = join('sounds', 'chibi');
const DEMO_DIR = join('demo', 'public', 'audio', 'chibi');
const HANDOFF_DIR = join('out', 'apk-audio-handoff', 'chibi');
const DOCS_PATH = join('docs', 'apk-port.md');
const MONOREPO_DIR = join('..', 'reading-advantage-monorepo');
const PROPOSED_TARGET = 'apps/advantage-games/public/audio/chibi/';

// The artifact cases need the ignored hand-off folder: build it with
// scripts/audio-handoff.mjs first, then AUDIO_HANDOFF_ARTIFACTS=1.
const ARTIFACTS_ENABLED = process.env.AUDIO_HANDOFF_ARTIFACTS === '1';

const artifactsIt = ARTIFACTS_ENABLED ? it : it.skip;

const SOUND_NAMES = [
  'level-end.mp3',
  'level-end.ogg',
  'pop.mp3',
  'pop.ogg',
  'right.mp3',
  'right.ogg',
  'star.mp3',
  'star.ogg',
  'tap.mp3',
  'tap.ogg',
  'whoosh.mp3',
  'whoosh.ogg',
  'wrong.mp3',
  'wrong.ogg',
];

const CHECKSUM_PATTERN = /^([0-9a-f]{64})  ([^ ]+)$/;

function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function readHandoffNames(): string[] {
  return readdirSync(HANDOFF_DIR).sort();
}

describe('audio hand-off to the PM', () => {
  it('ships the 14 demo files byte-identical to the 14 sources', () => {
    const demoNames = readdirSync(DEMO_DIR).sort();
    const sourceNames = readdirSync(SOUNDS_DIR).sort();
    expect(demoNames.length).toBe(14);
    expect(sourceNames.length).toBe(14);
    expect(demoNames).toEqual(SOUND_NAMES);
    expect(sourceNames).toEqual(SOUND_NAMES);
    for (const name of SOUND_NAMES) {
      const demoBytes = readFileSync(join(DEMO_DIR, name));
      const sourceBytes = readFileSync(join(SOUNDS_DIR, name));
      expect(demoBytes.equals(sourceBytes), `${name} is byte-identical in demo and sounds`).toBe(true);
    }
  });

  it('holds one docs row from the demo folder to the proposed target', () => {
    const text = readFileSync(DOCS_PATH, 'utf8');
    const rows = text.split('\n').filter((line) => line.includes('demo/public/audio/chibi/'));
    expect(rows.length).toBe(1);
    const cells = rows[0]!.split('|').map((cell) => cell.trim());
    expect(cells).toContain('`demo/public/audio/chibi/`');
    expect(cells).toContain('proposed: `apps/advantage-games/public/audio/chibi/`');
    expect(text.includes('apps/advantage-games/public/packs/')).toBe(true);
  });

  it('lists no track-named path in the monorepo status', () => {
    const status = spawnSync('git', ['-C', MONOREPO_DIR, 'status', '--short'], {
      encoding: 'utf8',
    });
    expect(status.status).toBe(0);
    const hits = status.stdout
      .split('\n')
      .filter((line) => line.includes(PROPOSED_TARGET) || SOUND_NAMES.some((name) => line.includes(name)));
    expect(hits.join('\n')).toBe('');
  });

  artifactsIt(
    'holds exactly the 14 sounds plus the manifest, checksum, and README (needs AUDIO_HANDOFF_ARTIFACTS=1: run scripts/audio-handoff.mjs, then AUDIO_HANDOFF_ARTIFACTS=1)',
    () => {
      const names = readHandoffNames();
      expect(names.length).toBe(17);
      expect(names).toEqual([...SOUND_NAMES, 'MANIFEST.sha256', 'MANIFEST.tsv', 'README.md'].sort());
    },
  );

  artifactsIt(
    'ships each hand-off file byte-identical to its source (needs AUDIO_HANDOFF_ARTIFACTS=1: run scripts/audio-handoff.mjs, then AUDIO_HANDOFF_ARTIFACTS=1)',
    () => {
      for (const name of SOUND_NAMES) {
        const shipped = readFileSync(join(HANDOFF_DIR, name));
        const source = readFileSync(join(SOUNDS_DIR, name));
        expect(shipped.equals(source), `${name} matches sounds/chibi/${name}`).toBe(true);
      }
    },
  );

  artifactsIt(
    'verifies every checksum line and passes sha256sum -c (needs AUDIO_HANDOFF_ARTIFACTS=1: run scripts/audio-handoff.mjs, then AUDIO_HANDOFF_ARTIFACTS=1)',
    () => {
      const lines = readFileSync(join(HANDOFF_DIR, 'MANIFEST.sha256'), 'utf8')
        .split('\n')
        .filter((line) => line.length > 0);
      expect(lines.length).toBe(14);
      const seen: string[] = [];
      for (const line of lines) {
        const match = CHECKSUM_PATTERN.exec(line);
        expect(match !== null, `checksum line has 64 lowercase hex, two spaces, name: ${line}`).toBe(true);
        const name = match![2]!;
        expect(SOUND_NAMES.includes(name), `${name} is one of the 14 sounds`).toBe(true);
        seen.push(name);
        const hex = sha256Hex(readFileSync(join(HANDOFF_DIR, name)));
        expect(hex, `${name} hash ${hex} matches ${match![1]}`).toBe(match![1]);
      }
      expect(seen.sort()).toEqual(SOUND_NAMES);
      const check = spawnSync('sha256sum', ['-c', 'MANIFEST.sha256'], {
        cwd: HANDOFF_DIR,
        encoding: 'utf8',
      });
      expect(check.status).toBe(0);
    },
  );

  artifactsIt(
    'holds a six-column manifest with matching bytes, hashes, and proposed targets (needs AUDIO_HANDOFF_ARTIFACTS=1: run scripts/audio-handoff.mjs, then AUDIO_HANDOFF_ARTIFACTS=1)',
    () => {
      const checksumByName = new Map<string, string>();
      for (const line of readFileSync(join(HANDOFF_DIR, 'MANIFEST.sha256'), 'utf8')
        .split('\n')
        .filter((entry) => entry.length > 0)) {
        const match = CHECKSUM_PATTERN.exec(line);
        expect(match !== null, `checksum line parses: ${line}`).toBe(true);
        checksumByName.set(match![2]!, match![1]!);
      }
      const rows = readFileSync(join(HANDOFF_DIR, 'MANIFEST.tsv'), 'utf8')
        .split('\n')
        .filter((entry) => entry.length > 0);
      expect(rows[0]).toBe('file\tbytes\tsha256\tformat\tsource\ttarget');
      const data = rows.slice(1);
      expect(data.length).toBe(14);
      const seen: string[] = [];
      for (const row of data) {
        const fields = row.split('\t');
        expect(fields.length, `six tab fields for ${row}`).toBe(6);
        const [file, bytes, sha256, format, source, target] = fields as [
          string,
          string,
          string,
          string,
          string,
          string,
        ];
        expect(SOUND_NAMES.includes(file), `${file} is one of the 14 sounds`).toBe(true);
        seen.push(file);
        const diskBytes = statSync(join(HANDOFF_DIR, file)).size;
        expect(Number.parseInt(bytes, 10), `${file} bytes ${bytes} matches stat`).toBe(diskBytes);
        expect(sha256, `${file} sha256 matches the checksum line`).toBe(checksumByName.get(file));
        expect(format, `${file} format matches its extension`).toBe(file.endsWith('.ogg') ? 'ogg' : 'mp3');
        expect(source, `${file} source names its sounds path`).toBe(`sounds/chibi/${file}`);
        expect(target, `${file} target names the proposed path`).toBe(`proposed: ${PROPOSED_TARGET}${file}`);
      }
      expect(seen.sort()).toEqual(SOUND_NAMES);
    },
  );

  artifactsIt(
    'names the proposed target, the load rule, and the model-pack row in the README (needs AUDIO_HANDOFF_ARTIFACTS=1: run scripts/audio-handoff.mjs, then AUDIO_HANDOFF_ARTIFACTS=1)',
    () => {
      const readme = readFileSync(join(HANDOFF_DIR, 'README.md'), 'utf8');
      for (const expected of [
        PROPOSED_TARGET,
        'synth',
        'canPlayType',
        'docs/apk-port.md',
        'apps/advantage-games/public/packs/',
      ]) {
        expect(readme.includes(expected), `README names ${expected}`).toBe(true);
      }
      const named = SOUND_NAMES.filter((name) => readme.includes(name));
      expect(named.length, 'README names at least one <entry>.<ext> file').toBeGreaterThan(0);
    },
  );
});
