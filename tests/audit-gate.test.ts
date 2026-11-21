// Audit gate Red test for track chore_dependency_refresh_20261121 (T1).
// The script under test is scripts/audit-gate.mjs; the fixtures live in
// tests/fixtures/. The live check (`node scripts/audit-gate.mjs` without
// --input) is the Red failure and runs outside this file.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const GATE = join(ROOT, 'scripts', 'audit-gate.mjs');
const fixture = (name: string) => join(ROOT, 'tests', 'fixtures', name);

function run(args: string[]) {
  return spawnSync(process.execPath, [GATE, ...args], { encoding: 'utf8' });
}

describe('audit gate', () => {
  it('exits 1 when high findings exist', () => {
    const result = run(['--input', fixture('audit-high.json')]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('critical=0');
    expect(result.stdout).toContain('high=2');
  });

  it('exits 0 when critical and high are both zero', () => {
    const result = run(['--input', fixture('audit-clean.json')]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('critical=0');
    expect(result.stdout).toContain('high=0');
  });

  it('exits 2 with `audit unavailable` when the JSON cannot parse', () => {
    const result = run(['--input', fixture('audit-invalid.json')]);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('audit unavailable');
  });

  it('exits 2 with `audit unavailable` when the input file is missing', () => {
    const result = run(['--input', fixture('does-not-exist.json')]);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('audit unavailable');
  });
});
