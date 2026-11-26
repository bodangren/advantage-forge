import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NAME = 'sprout-tom-kim';
const SCRIPT = join(ROOT, 'scripts', 'proportion-check.mjs');
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx');
const RECORD_FILE = join(ROOT, 'out', 'chibi-sprouts', 'cast', `${NAME}-measure.json`);
const CHILD_TABLE = [
  { name: 'heightInHeads', lo: 2.79, hi: 3.03 },
  { name: 'armToTorso', lo: 1.08, hi: 1.51 },
  { name: 'legShare', lo: 0.3, hi: 0.39 },
  { name: 'headToShoulders', lo: 1.83, hi: 2.35 },
  { name: 'wrist', lo: -0.3, hi: 0.16 },
  { name: 'fingertips', lo: 0.25, hi: 0.71 },
  { name: 'eyeLine', lo: 0.61, hi: 0.68 },
  { name: 'eyeHeight', lo: 0.12, hi: 0.16 },
  { name: 'spacingHead', lo: 0.28, hi: 0.36 },
  { name: 'eyeWidthFace', lo: 0.22, hi: 0.24 },
  { name: 'spacingFace', lo: 0.45, hi: 0.51 },
];

type TableRow = { name: string; lo: number; hi: number };

function runMeasure(): { status: number | null; output: string } {
  const result = spawnSync(
    TSX,
    [
      SCRIPT,
      '--asset',
      NAME,
      '--base',
      'humanoid-kim-child',
      '--table',
      'child',
      '--record',
      `out/chibi-sprouts/cast/${NAME}-measure.json`,
    ],
    {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 300_000,
      env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
    },
  );
  return {
    status: result.status,
    output: `${result.stdout || ''}\n${result.stderr || ''}${result.error?.message || ''}`,
  };
}

function readRecord(): any {
  expect(existsSync(RECORD_FILE), `record ${NAME}: not built: ${RECORD_FILE}`).toBe(true);
  return JSON.parse(readFileSync(RECORD_FILE, 'utf8'));
}

describe(`${NAME} child pin`, () => {
  it('measures eleven child rows, both palms, and the named record', { timeout: 300_000 }, async () => {
    const result = runMeasure();
    expect(result.status, result.output).toBe(0);
    const record = readRecord();
    const mod = (await import(pathToFileURL(SCRIPT).href)) as { TABLES: { child: TableRow[] } };
    const table = mod.TABLES.child;
    expect(table).toEqual(CHILD_TABLE);
    expect(record.asset).toBe(NAME);
    expect(record.base).toBe('humanoid-kim-child');
    expect(Object.keys(record.rows)).toEqual([...table.map((row) => row.name), 'lit']);
    for (const row of table) {
      expect(record.rows[row.name].value, row.name).toBeGreaterThanOrEqual(row.lo);
      expect(record.rows[row.name].value, row.name).toBeLessThanOrEqual(row.hi);
      expect(record.rows[row.name].lo, row.name).toBe(row.lo);
      expect(record.rows[row.name].hi, row.name).toBe(row.hi);
      expect(record.rows[row.name].pass, row.name).toBe(true);
    }
    expect(record.palms.L.ok).toBe(true);
    expect(record.palms.R.ok).toBe(true);
  });
});
