import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const GATE = join(ROOT, 'scripts', 'audit-gate.mjs');
const FIXTURES = join(ROOT, 'tests', 'fixtures');

function run(args: string[], cwd = ROOT, env: NodeJS.ProcessEnv = process.env) {
  return spawnSync(process.execPath, [GATE, ...args], { cwd, encoding: 'utf8', env });
}

function auditDocument(severity: string | null = null) {
  const advisories: Record<string, { severity: string }> = {};
  if (severity) advisories.advisory = { severity };
  return {
    metadata: {
      vulnerabilities: {
        info: 0,
        low: 0,
        moderate: 0,
        high: severity === 'high' ? 1 : 0,
        critical: severity === 'critical' ? 1 : 0,
      },
    },
    advisories,
  };
}

function withPnpm(stdout: string, exitCode: number, callback: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'audit-gate-pnpm-'));
  const executable = join(dir, 'pnpm-fixture.mjs');
  writeFileSync(
    executable,
    `#!/usr/bin/env node\nprocess.stdout.write(${JSON.stringify(stdout)}); process.exit(${exitCode});\n`,
    { mode: 0o755 },
  );
  try {
    callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function withCwdSensitivePnpm(callback: (dir: string) => void) {
  const dir = mkdtempSync(join(tmpdir(), 'audit-gate-pnpm-cwd-'));
  const executable = join(dir, 'pnpm-fixture.mjs');
  writeFileSync(
    executable,
    `#!/usr/bin/env node\nconst root = ${JSON.stringify(ROOT)};\n` +
      `const clean = ${JSON.stringify(JSON.stringify(auditDocument()))};\n` +
      `const high = ${JSON.stringify(JSON.stringify(auditDocument('high')))};\n` +
      `process.stdout.write(process.cwd() === root ? clean : high);\n` +
      `process.exit(process.cwd() === root ? 0 : 1);\n`,
    { mode: 0o755 },
  );
  try {
    callback(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('audit gate adversarial boundaries', () => {
  it('audits the repository lockfile when invoked from another working directory', () => {
    withCwdSensitivePnpm((pnpmDir) => {
      const elsewhere = mkdtempSync(join(tmpdir(), 'audit-gate-cwd-'));
      try {
        const result = run([], elsewhere, {
          ...process.env,
          AUDIT_GATE_PNPM: join(pnpmDir, 'pnpm-fixture.mjs'),
        });
        expect(result.status).toBe(0);
        expect(result.stdout).toContain('critical=0 high=0');
      } finally {
        rmSync(elsewhere, { recursive: true, force: true });
      }
    });
  });

  it('fails closed when pnpm writes a warning before otherwise valid JSON on stdout', () => {
    withPnpm(`WARN from pnpm\n${JSON.stringify(auditDocument())}`, 0, (pnpmDir) => {
      const result = run([], ROOT, {
        ...process.env,
        AUDIT_GATE_PNPM: join(pnpmDir, 'pnpm-fixture.mjs'),
      });
      expect(result.status).toBe(2);
      expect(result.stderr).toContain('audit unavailable');
      expect(result.stdout).not.toContain('critical=0');
    });
  });

  it('reads valid advisory JSON even when pnpm exits non-zero', () => {
    withPnpm(JSON.stringify(auditDocument('high')), 1, (pnpmDir) => {
      const result = run([], ROOT, {
        ...process.env,
        AUDIT_GATE_PNPM: join(pnpmDir, 'pnpm-fixture.mjs'),
      });
      expect(result.status).toBe(1);
      expect(result.stdout).toContain('critical=0 high=1');
      expect(result.stderr).not.toContain('audit unavailable');
    });
  });

  it('preserves exact counts for a large advisory set', () => {
    const advisories: Record<string, { severity: string }> = {};
    const total = 12_000;
    for (let index = 0; index < total; index += 1) {
      advisories[`GHSA-${index}`] = { severity: 'moderate' };
    }
    const document = {
      metadata: { vulnerabilities: { info: 0, low: 0, moderate: total, high: 0, critical: 0 } },
      advisories,
    };
    const path = join(FIXTURES, 'audit-large-counts.tmp.json');
    writeFileSync(path, JSON.stringify(document));
    try {
      const result = run(['--input', path]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain(`moderate=${total}`);
    } finally {
      rmSync(path, { force: true });
    }
  });

  it('rejects duplicate severity keys instead of accepting the last value', () => {
    const result = run(['--input', join(FIXTURES, 'audit-duplicate-count-keys.json')]);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('audit unavailable');
    expect(result.stdout).not.toContain('critical=0');
  });
});

describe('audit gate duplicate-key regressions (r3)', () => {
  function withDocument(raw: string, callback: (path: string) => void) {
    const dir = mkdtempSync(join(tmpdir(), 'audit-gate-r3-'));
    const path = join(dir, 'audit.json');
    writeFileSync(path, raw);
    try {
      callback(path);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  function expectUnavailable(path: string) {
    const result = run(['--input', path]);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('audit unavailable');
  }

  it('rejects an escape-spelled duplicate high key', () => {
    withDocument(
      '{"metadata":{"vulnerabilities":{"info":0,"low":0,"moderate":0,"high":3,"h\\u0069gh":0,"critical":0}},"advisories":{}}',
      (path) => {
        expectUnavailable(path);
      },
    );
  });

  it('rejects an escape-spelled duplicate critical key', () => {
    withDocument(
      '{"metadata":{"vulnerabilities":{"info":0,"low":0,"moderate":0,"high":0,"critical":5,"critica\\u006c":0}},"advisories":{}}',
      (path) => {
        expectUnavailable(path);
      },
    );
  });

  it('rejects a solidus-escape duplicate key', () => {
    withDocument(
      '{"metadata":{"vulnerabilities":{"info":0,"low":0,"moderate":0,"high":0,"critical":0}},"advisories":{},"x":{"a/b":1,"a\\/b":2}}',
      (path) => {
        expectUnavailable(path);
      },
    );
  });

  it('rejects an uppercase-hex-escape duplicate key', () => {
    withDocument(
      '{"metadata":{"vulnerabilities":{"info":0,"low":0,"moderate":0,"high":0,"critical":5,"critica\\u006C":0}},"advisories":{}}',
      (path) => {
        expectUnavailable(path);
      },
    );
  });

  it('rejects a duplicate key inside an object inside an array without hanging', () => {
    withDocument(
      '{"metadata":{"vulnerabilities":{"info":0,"low":0,"moderate":0,"high":0,"critical":0}},"advisories":{},"x":[{"k":1,"k":2}]}',
      (path) => {
        const result = spawnSync(process.execPath, [GATE, '--input', path], {
          encoding: 'utf8',
          timeout: 10000,
        });
        expect(result.error).toBeUndefined();
        expect(result.signal).toBeFalsy();
        expect(result.status).toBe(2);
        expect(result.stderr).toContain('audit unavailable');
      },
    );
  });

  it('accepts the same key name in two sibling advisory objects (clean)', () => {
    withDocument(
      '{"metadata":{"vulnerabilities":{"info":0,"low":1,"moderate":1,"high":0,"critical":0}},"advisories":{"A-1":{"severity":"moderate"},"A-2":{"severity":"low"}}}',
      (path) => {
        const result = run(['--input', path]);
        expect(result.status).toBe(0);
        expect(result.stdout).toContain('critical=0 high=0');
      },
    );
  });

  it('accepts the same key name in two sibling advisory objects (high)', () => {
    withDocument(
      '{"metadata":{"vulnerabilities":{"info":0,"low":0,"moderate":1,"high":1,"critical":0}},"advisories":{"A-1":{"severity":"high"},"A-2":{"severity":"moderate"}}}',
      (path) => {
        const result = run(['--input', path]);
        expect(result.status).toBe(1);
        expect(result.stdout).toContain('critical=0 high=1');
      },
    );
  });
});
