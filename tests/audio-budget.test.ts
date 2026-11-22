import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Covers spec AC5: the README byte column matches the committed files and the
// Rune Match budget JSON holds the measured bytes, files, and seconds.
// Red: cases 1 to 3 pass on the committed README and files, case 4 fails with
// ENOENT for out/audio-budget/rune-match.json. No script or JSON is written here.

const README_PATH = join('sounds', 'README.md');
const SETS_PATH = join('sounds', 'sets', 'chibi.json');
const BUDGET_PATH = join('out', 'audio-budget', 'rune-match.json');

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
// victory->level-end, whoosh, spawn->pop.
const RUNE_MATCH_FILES = ['tap', 'right', 'wrong', 'level-end', 'whoosh', 'pop'];

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

  it('holds the Rune Match measurement of six files within budget', () => {
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
    const parsed = JSON.parse(raw) as { bytes?: unknown; files?: unknown; seconds?: unknown };
    expect(typeof parsed.bytes, 'rune-match bytes is a labeled number').toBe('number');
    expect(typeof parsed.files, 'rune-match files is a labeled number').toBe('number');
    expect(typeof parsed.seconds, 'rune-match seconds is a labeled number').toBe('number');
    const bytes = parsed.bytes as number;
    const files = parsed.files as number;
    const seconds = parsed.seconds as number;
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
  });
});
