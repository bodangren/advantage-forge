import { spawnSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Covers spec AC5: the README byte column matches the committed files and the
// Rune Match budget JSON holds the measured bytes, files, and seconds.
// Review r1: the JSON case runs only with AUDIO_BUDGET_JSON=1 (A-F1), requires
// decoded and fileEffect evidence (A-F2, C-F1), and the CLI case pins usage
// text with no stack trace (C-F4 nit). Review r2: the JSON case also requires
// decodeSeconds within 1.5 s (A-F4) and the before-launch effect marker with
// the first file-backed effect (C-F4). No script or JSON is written here.

const README_PATH = join('sounds', 'README.md');
const SETS_PATH = join('sounds', 'sets', 'chibi.json');
const BUDGET_PATH = join('out', 'audio-budget', 'rune-match.json');
const SCRIPT_PATH = join('scripts', 'audio-budget.mjs');

// The JSON case needs the ignored browser artifact: run
// scripts/audio-budget.mjs first, then AUDIO_BUDGET_JSON=1.
const JSON_ENABLED = process.env.AUDIO_BUDGET_JSON === '1';

// Row-anchored on the Bytes column: | `file` | `design` | <bytes> | <duration> s |
const ROW_PATTERN = /^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*([0-9]+)\s*\|\s*([0-9]+\.[0-9]+)\s*s\s*\|$/;

interface ReadmeRow {
  file: string;
  bytes: number;
}

function readTables(): { oggRows: ReadmeRow[]; mp3Rows: ReadmeRow[] } {
  const text = readFileSync(README_PATH, 'utf8');
  const lines = text.split('\n');
  const oggHeader = lines.findIndex((line) => line.trim() === 'Ogg files:');
  const mp3Header = lines.findIndex((line) => line.trim() === 'MP3 files:');
  expect(oggHeader, 'sounds/README.md holds the Ogg files table').toBeGreaterThanOrEqual(0);
  expect(mp3Header, 'sounds/README.md holds the MP3 files table').toBeGreaterThanOrEqual(0);
  expect(mp3Header, 'the MP3 table follows the Ogg table').toBeGreaterThan(oggHeader);
  const oggRows: ReadmeRow[] = [];
  for (const line of lines.slice(oggHeader + 1, mp3Header)) {
    const match = ROW_PATTERN.exec(line.trim());
    if (match) oggRows.push({ file: match[1]!, bytes: Number.parseInt(match[3]!, 10) });
  }
  const mp3Rows: ReadmeRow[] = [];
  for (const line of lines.slice(mp3Header + 1)) {
    const match = ROW_PATTERN.exec(line.trim());
    if (match) mp3Rows.push({ file: match[1]!, bytes: Number.parseInt(match[3]!, 10) });
  }
  return { oggRows, mp3Rows };
}

function readSetNames(): string[] {
  const parsed = JSON.parse(readFileSync(SETS_PATH, 'utf8')) as {
    sounds: { name: string }[];
  };
  return parsed.sounds.map((sound) => sound.name);
}

// The six Rune Match mapped entries: tap, correct->right, wrong,
// victory->level-end, whoosh, spawn->pop. The first file-backed game effect
// must be one of these effect files, in either served format, never a music file.
const RUNE_MATCH_FILES = ['tap', 'right', 'wrong', 'level-end', 'whoosh', 'pop'];
const RUNE_MATCH_EFFECT_FILES = RUNE_MATCH_FILES.flatMap((name) => [`${name}.ogg`, `${name}.mp3`]);

const jsonIt = JSON_ENABLED ? it : it.skip;

describe('audio preload budget', () => {
  it('lists seven Ogg rows and seven MP3 rows for the seven set entries', () => {
    const setNames = readSetNames();
    expect(setNames.length).toBe(7);
    const { oggRows, mp3Rows } = readTables();
    expect(oggRows.length).toBe(7);
    expect(mp3Rows.length).toBe(7);
    expect(oggRows.map((row) => row.file).sort()).toEqual(setNames.map((name) => `${name}.ogg`).sort());
    expect(mp3Rows.map((row) => row.file).sort()).toEqual(setNames.map((name) => `${name}.mp3`).sort());
  });

  it('matches the README byte column to statSync for all 14 files', () => {
    const { oggRows, mp3Rows } = readTables();
    const rows = [...oggRows, ...mp3Rows];
    expect(rows.length).toBe(14);
    for (const row of rows) {
      const ext = row.file.endsWith('.ogg') ? '.ogg' : '.mp3';
      expect(ext === '.ogg' || ext === '.mp3', `${row.file} ends .ogg or .mp3`).toBe(true);
      const diskBytes = statSync(join('sounds', 'chibi', row.file)).size;
      expect(diskBytes, `${row.file}: README bytes ${row.bytes} vs statSync bytes ${diskBytes}`).toBe(
        row.bytes,
      );
    }
  });

  it('keeps each format total above zero and at most 100000 bytes', () => {
    const { oggRows, mp3Rows } = readTables();
    expect(oggRows.length).toBe(7);
    expect(mp3Rows.length).toBe(7);
    const oggTotal = oggRows.reduce((sum, row) => sum + row.bytes, 0);
    const mp3Total = mp3Rows.reduce((sum, row) => sum + row.bytes, 0);
    expect(oggTotal, `Ogg format total bytes ${oggTotal}`).toBeGreaterThan(0);
    expect(mp3Total, `MP3 format total bytes ${mp3Total}`).toBeGreaterThan(0);
    expect(oggTotal, `Ogg format total bytes ${oggTotal}`).toBeLessThanOrEqual(100000);
    expect(mp3Total, `MP3 format total bytes ${mp3Total}`).toBeLessThanOrEqual(100000);
  });

  jsonIt(
    'holds the Rune Match measurement of six decoded files within budget (needs AUDIO_BUDGET_JSON=1: run scripts/audio-budget.mjs, then AUDIO_BUDGET_JSON=1)',
    () => {
      const { oggRows, mp3Rows } = readTables();
      const oggByFile = new Map(oggRows.map((row) => [row.file, row.bytes]));
      const mp3ByFile = new Map(mp3Rows.map((row) => [row.file, row.bytes]));
      const oggSix = RUNE_MATCH_FILES.map((name) => oggByFile.get(`${name}.ogg`) ?? NaN).reduce(
        (sum, value) => sum + value,
        0,
      );
      const mp3Six = RUNE_MATCH_FILES.map((name) => mp3ByFile.get(`${name}.mp3`) ?? NaN).reduce(
        (sum, value) => sum + value,
        0,
      );
      expect(Number.isInteger(oggSix), `Ogg six-file README sum ${oggSix}`).toBe(true);
      expect(Number.isInteger(mp3Six), `MP3 six-file README sum ${mp3Six}`).toBe(true);
      const raw = readFileSync(BUDGET_PATH, 'utf8');
      const parsed = JSON.parse(raw) as {
        bytes?: unknown;
        files?: unknown;
        seconds?: unknown;
        decoded?: unknown;
        fileEffect?: unknown;
        decodeSeconds?: unknown;
        effectMarker?: unknown;
        firstEffect?: unknown;
      };
      expect(typeof parsed.bytes, 'rune-match bytes is a labeled number').toBe('number');
      expect(typeof parsed.files, 'rune-match files is a labeled number').toBe('number');
      expect(typeof parsed.seconds, 'rune-match seconds is a labeled number').toBe('number');
      expect(typeof parsed.decoded, 'rune-match decoded is a labeled number').toBe('number');
      expect(typeof parsed.fileEffect, 'rune-match fileEffect is a labeled boolean').toBe('boolean');
      expect(typeof parsed.decodeSeconds, 'rune-match decodeSeconds is a labeled number').toBe('number');
      expect(parsed.effectMarker, 'rune-match effectMarker is set before the Start action').toBe(
        'before-launch',
      );
      expect(typeof parsed.firstEffect, 'rune-match firstEffect is a labeled file name').toBe('string');
      const bytes = parsed.bytes as number;
      const files = parsed.files as number;
      const seconds = parsed.seconds as number;
      const decoded = parsed.decoded as number;
      const fileEffect = parsed.fileEffect as boolean;
      const decodeSeconds = parsed.decodeSeconds as number;
      const firstEffect = parsed.firstEffect as string;
      expect(Number.isInteger(files), `rune-match files count ${String(files)}`).toBe(true);
      expect(files, `rune-match files count ${String(files)}`).toBe(6);
      expect(Number.isInteger(bytes), `rune-match bytes ${String(bytes)}`).toBe(true);
      expect(bytes, `rune-match bytes ${String(bytes)}`).toBeGreaterThan(0);
      expect(
        bytes === oggSix || bytes === mp3Six,
        `rune-match bytes ${String(bytes)} equals an Ogg (${String(oggSix)}) or MP3 (${String(mp3Six)}) six-file sum`,
      ).toBe(true);
      expect(bytes, `rune-match bytes ${String(bytes)}`).toBeLessThanOrEqual(100000);
      expect(seconds, `rune-match seconds ${String(seconds)}`).toBeGreaterThan(0);
      expect(seconds, `rune-match seconds ${String(seconds)}`).toBeLessThanOrEqual(1.5);
      expect(Number.isInteger(decoded), `rune-match decoded count ${String(decoded)}`).toBe(true);
      expect(decoded, `rune-match decoded count ${String(decoded)}`).toBe(files);
      expect(fileEffect, 'rune-match fileEffect plays the first effect from a decoded file').toBe(true);
      expect(decodeSeconds, `rune-match decodeSeconds ${String(decodeSeconds)}`).toBeGreaterThan(0);
      expect(decodeSeconds, `rune-match decodeSeconds ${String(decodeSeconds)}`).toBeLessThanOrEqual(1.5);
      expect(
        RUNE_MATCH_EFFECT_FILES.includes(firstEffect),
        `rune-match firstEffect ${firstEffect} is one of the six Rune Match effect files`,
      ).toBe(true);
    },
  );

  it('prints usage for --help and rejects a bad --game without a stack trace', () => {
    const help = spawnSync(process.execPath, [SCRIPT_PATH, '--help'], { encoding: 'utf8' });
    expect(help.status, '--help exits 0').toBe(0);
    const helpLines = help.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    expect(
      helpLines.some((line) => /usage/i.test(line)),
      '--help prints a usage line on stdout',
    ).toBe(true);
    const bad = spawnSync(process.execPath, [SCRIPT_PATH, '--game', 'not-a-game'], {
      encoding: 'utf8',
    });
    expect(bad.status, 'bad --game exits 1').toBe(1);
    const errLines = bad.stderr
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    expect(errLines.length, `bad --game prints one usage line on stderr`).toBe(1);
    expect(/usage/i.test(errLines[0]!), 'bad --game usage line names the usage').toBe(true);
    expect(bad.stderr.includes('at '), 'bad --game prints no stack trace').toBe(false);
    expect(bad.stdout.includes('at '), 'bad --game stdout holds no stack trace').toBe(false);
  });
});
