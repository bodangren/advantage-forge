import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Passing Phase 1 regression: the scrapped sources, their exported contracts,
 * and Mom's preset stay byte-for-byte equal to the T0 baseline.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx');
const BASELINE = JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', 'cast-baseline.json'), 'utf8'));

function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

/** Match T0's fixture format, including closure source text. */
function serialize(value: unknown): unknown {
  if (typeof value === 'function') return `fn:${Function.prototype.toString.call(value)}`;
  if (Array.isArray(value)) return value.map(serialize);
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  return value;
}

/** T0 read the exports through tsx; Vitest reformats function source text. */
function loadContracts(): any {
  const moduleUrl = pathToFileURL(join(ROOT, 'assets', 'parts', 'humanoid-kind.ts')).href;
  const code = [
    `import { ADULT, AGE5, HERO } from ${JSON.stringify(moduleUrl)};`,
    `const serialize = ${serialize.toString()};`,
    'console.log(JSON.stringify({ ADULT: serialize(ADULT), AGE5: serialize(AGE5), HERO: serialize(HERO) }));',
  ].join('\n');
  const result = spawnSync(TSX, ['--eval', code], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 300_000,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
  });
  expect(result.status, `${result.stdout || ''}${result.stderr || ''}${result.error || ''}`).toBe(0);
  return JSON.parse(result.stdout);
}

describe('cast isolation baseline (passing regression)', () => {
  it('every scrapped source keeps its baseline SHA-256', () => {
    for (const [file, expected] of Object.entries(BASELINE.sources) as Array<[string, string]>) {
      const actual = sha256(join(ROOT, file));
      expect(actual, `source changed: ${file}; expected ${expected}; actual ${actual}`).toBe(expected);
    }
  });

  it('ADULT, AGE5 and HERO keep their serialized export values', () => {
    const contracts = loadContracts();
    for (const name of ['ADULT', 'AGE5', 'HERO'] as const) {
      const expected = BASELINE.contracts[name];
      const actual = contracts[name];
      expect(
        actual,
        `contract changed: ${name}; expected ${JSON.stringify(expected)}; actual ${JSON.stringify(actual)}`,
      ).toEqual(expected);
    }
  });

  it("Mom's preset entry stays equal to the T0 baseline", () => {
    const pin = JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', 'preset-pin.json'), 'utf8'));
    expect(pin.assets['sprout-mom-kim'], 'Mom preset changed').toEqual(BASELINE.momPreset);
  });
});
