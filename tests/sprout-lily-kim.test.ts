import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { AssetDefinition } from '../src/asset.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NAME = 'sprout-lily-kim';
const ASSET_FILE = join(ROOT, 'assets', `${NAME}.ts`);
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

async function loadAsset(): Promise<{ default: AssetDefinition }> {
  expect(existsSync(ASSET_FILE), `asset ${NAME}: not built: ${ASSET_FILE}`).toBe(true);
  return (await import(pathToFileURL(ASSET_FILE).href)) as { default: AssetDefinition };
}

describe(`${NAME} child pin`, () => {
  it(
    'measures child rows and palms with hair declared and all Lily guards absent',
    { timeout: 300_000 },
    async () => {
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
      expect(record.guards).not.toContain('GUARD lily side chin: hair at the front');
      expect(record.guards).not.toContain('GUARD lily bangs: hair in the eye window');
      expect(
        record.guards.some((line: string) =>
          /^GUARD lily chin: hair crosses the chin at row \d+$/.test(line),
        ),
        'Lily chin hair guard',
      ).toBe(false);

      const asset = await loadAsset();
      const hair = Object.values(asset.default.variants?.hair ?? {})[0];
      expect(typeof hair, 'variants.hair first option').toBe('string');
      expect(hair).toMatch(/^#[0-9a-f]{6}$/i);
      expect(Number.isFinite(record.detail.chinRow), 'detail.chinRow').toBe(true);
      expect(Number.isFinite(record.detail.headHeight), 'detail.headHeight').toBe(true);
      expect(record.detail.chinRow).toBeGreaterThan(0);
      expect(record.detail.headHeight).toBeGreaterThan(0);
    },
  );
});
