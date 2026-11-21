// Audit gate Red tests for track chore_dependency_refresh_20261121 (T1, r2).
// The script under test is scripts/audit-gate.mjs; the fixtures live in
// tests/fixtures/. The live check (`node scripts/audit-gate.mjs` without
// --input) is the Red failure and runs outside this file.
//
// Fail-closed contract (Green must implement): the gate exits 2 with
// `audit unavailable` unless metadata.vulnerabilities holds all five counts
// (info, low, moderate, high, critical) as non-negative integers, every
// advisory entry is well-formed with a severity inside
// info/low/moderate/high/critical, and the metadata counts agree with the
// advisories. A critical-only document exits 1. The live path runs pnpm, or
// the binary named by AUDIT_GATE_PNPM when that env var is set; when the
// binary cannot run, the gate exits 2 with `audit unavailable`.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const GATE = join(ROOT, 'scripts', 'audit-gate.mjs');
const fixture = (name: string) => join(ROOT, 'tests', 'fixtures', name);

function run(args: string[], env?: NodeJS.ProcessEnv) {
  return spawnSync(process.execPath, [GATE, ...args], {
    encoding: 'utf8',
    env: env ?? process.env,
  });
}

function expectUnavailable(args: string[], env?: NodeJS.ProcessEnv) {
  const result = run(args, env);
  expect(result.status).toBe(2);
  expect(result.stderr).toContain('audit unavailable');
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
    const result = run(['--input', fixture('audit-invalid.txt')]);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('audit unavailable');
  });

  it('exits 2 with `audit unavailable` when the input file is missing', () => {
    const result = run(['--input', fixture('does-not-exist.json')]);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('audit unavailable');
  });
});

describe('audit gate fail-closed regressions', () => {
  it('exits 2 when metadata.vulnerabilities is missing', () => {
    expectUnavailable(['--input', fixture('audit-meta-missing.json')]);
  });

  it('exits 2 when metadata.vulnerabilities is an empty object', () => {
    expectUnavailable(['--input', fixture('audit-meta-empty.json')]);
  });

  it('exits 2 when metadata.vulnerabilities is an array', () => {
    expectUnavailable(['--input', fixture('audit-meta-array.json')]);
  });

  it('exits 2 when a count is missing', () => {
    expectUnavailable(['--input', fixture('audit-meta-count-missing.json')]);
  });

  it('exits 2 when a count is not a number', () => {
    expectUnavailable(['--input', fixture('audit-meta-string-count.json')]);
  });

  it('exits 2 when a count is negative', () => {
    expectUnavailable(['--input', fixture('audit-meta-negative.json')]);
  });

  it('exits 2 when a count is not an integer', () => {
    expectUnavailable(['--input', fixture('audit-meta-float.json')]);
  });

  it('exits 2 for a malformed advisory entry', () => {
    expectUnavailable(['--input', fixture('audit-advisory-malformed.json')]);
  });

  it('exits 2 for an out-of-range advisory severity', () => {
    expectUnavailable(['--input', fixture('audit-advisory-bad-severity.json')]);
  });

  it('exits 2 when zero metadata hides a critical advisory', () => {
    expectUnavailable(['--input', fixture('audit-meta-zero-with-critical.json')]);
  });

  it('exits 2 for empty advisories with no metadata', () => {
    expectUnavailable(['--input', fixture('audit-advisories-empty-no-meta.json')]);
  });

  it('exits 1 when only a critical finding exists', () => {
    const result = run(['--input', fixture('audit-critical.json')]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('critical=1');
    expect(result.stdout).toContain('high=0');
  });

  it('exits 2 with `audit unavailable` when the pnpm override cannot run', { timeout: 120000 }, () => {
    expectUnavailable([], {
      ...process.env,
      AUDIT_GATE_PNPM: '/nonexistent-audit-gate-pnpm',
    });
  });
});
