import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const V3 = 'tests/fixtures/storytime/pictures-v3.json';
const V7 = 'tests/fixtures/storytime/pictures-v7.json';
const V3_SHA = 'c3e23cfdace136c7ed602b3aefee83383241833537ba56f0257668eb1e2c686b';
const V7_SHA = 'ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf';
const digest = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');

describe('storytime card fixtures (CF)', () => {
  it('CF1 pins the v3 fixture bytes to the source test pin', () => {
    const source = read('tests/storytime-book-pictures.test.ts');
    const pin = source.match(/const LIST_V3_SHA256 = '([a-f0-9]{64})'/)?.[1];
    expect(existsSync(path.join(ROOT, V3))).toBe(true);
    expect(pin).toBe(V3_SHA);
    expect(digest(read(V3))).toBe(V3_SHA);
  });

  it('CF2 pins the v7 fixture bytes', () => {
    expect(existsSync(path.join(ROOT, V7))).toBe(true);
    expect(digest(read(V7))).toBe(V7_SHA);
  });

  it('CF3 points both v3 constants at the repository fixture', () => {
    for (const [file, constant] of [
      ['tests/storytime-book-pictures.test.ts', 'LIST_V3_SHADOW_FILE'],
      ['tests/storytime-stage-check.test.ts', 'V3_SHADOW_FILE'],
    ]) {
      const source = read(file);
      const declaration = source.match(new RegExp(`const ${constant} = ([^;]+);`))?.[1] ?? '';
      expect(declaration).toContain('fixtures/storytime/pictures-v3.json');
      expect(declaration).not.toContain('/tmp');
    }
  });

  it('CF4 finds no old shadow path and flags a seeded occurrence', () => {
    const needle = 'wb' + '-shadow';
    const scan = (root: string): string[] => {
      const hits: string[] = [];
      const visit = (dir: string) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) visit(full);
          else if (/\.(?:ts|mjs|js|mts)$/.test(entry.name) && readFileSync(full, 'utf8').includes(needle)) hits.push(full);
        }
      };
      for (const rel of ['tests', 'scripts', 'src']) visit(path.join(root, rel));
      return hits;
    };
    const temp = mkdtempSync(path.join(os.tmpdir(), 'storytime-card-scan-'));
    try {
      for (const dir of ['tests', 'scripts', 'src']) mkdirSync(path.join(temp, dir));
      writeFileSync(path.join(temp, 'tests', 'seed.test.ts'), `const seeded = '${needle}';`);
      expect(scan(temp)).toHaveLength(1);
      expect(scan(ROOT)).toEqual([]);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  it('CF5 keeps both fixture files out of git ignore rules', () => {
    for (const fixture of [V3, V7]) {
      const result = spawnSync('git', ['check-ignore', '-q', fixture], { cwd: ROOT });
      expect(result.status, `${fixture} must not be ignored`).toBe(1);
    }
  });
});
