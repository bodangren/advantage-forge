#!/usr/bin/env node
// Audit gate for track chore_dependency_refresh_20261121 (T1 Red).
//
// Runs `pnpm audit --json` and exits 0 when critical=0 and high=0, 1 otherwise.
// Exit 2 with `audit unavailable` means the audit is inconclusive. Exit 2 never
// satisfies AC2. Exit 2 also covers a missing or inconsistent audit document.
//
//   node scripts/audit-gate.mjs                 live check (needs the network)
//   node scripts/audit-gate.mjs --input <file>  check a saved audit JSON file
//
// AUDIT_GATE_PNPM names the pnpm binary for the live path. Tests use it to
// simulate a binary that cannot run. `pnpm audit` exits non-zero when advisories
// exist; the live path reads stdout JSON regardless of the child exit code.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];
const TIMEOUT_MS = 120000;

function unavailable() {
  console.error('audit unavailable');
  process.exit(2);
}

function zeroCounts() {
  return { info: 0, low: 0, moderate: 0, high: 0, critical: 0 };
}

// metadata.vulnerabilities must hold all five counts as non-negative integers.
function countFromMetadata(vulnerabilities) {
  if (!vulnerabilities || typeof vulnerabilities !== 'object' || Array.isArray(vulnerabilities)) {
    return null;
  }
  const counts = zeroCounts();
  for (const key of SEVERITIES) {
    const value = vulnerabilities[key];
    if (!Number.isInteger(value) || value < 0) return null;
    counts[key] = value;
  }
  return counts;
}

// Every advisory must be an object with a severity in the five known values.
function countFromAdvisories(advisories) {
  if (advisories === undefined) return zeroCounts();
  if (!advisories || typeof advisories !== 'object' || Array.isArray(advisories)) {
    return null;
  }
  const counts = zeroCounts();
  for (const advisory of Object.values(advisories)) {
    if (!advisory || typeof advisory !== 'object' || Array.isArray(advisory)) return null;
    if (typeof advisory.severity !== 'string' || !SEVERITIES.includes(advisory.severity)) {
      return null;
    }
    counts[advisory.severity] += 1;
  }
  return counts;
}

// Require both sources and require them to agree. A disagreement is inconclusive.
function countVulnerabilities(doc) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return null;
  const meta = countFromMetadata(doc.metadata && doc.metadata.vulnerabilities);
  if (!meta) return null;
  const adv = countFromAdvisories(doc.advisories);
  if (!adv) return null;
  for (const key of SEVERITIES) {
    if (meta[key] !== adv[key]) return null;
  }
  return meta;
}

// JSON.parse keeps only the last value for a duplicate key, which can hide a
// nonzero severity count. Scan the raw text and fail closed on any repeated key
// in any object. Escapes are consumed so braces inside strings cannot end an
// object early. Callers pass text that already parsed successfully.
function hasDuplicateKeys(text) {
  let i = 0;
  let found = false;

  const skipSpace = () => {
    while (i < text.length && /\s/.test(text[i])) i += 1;
  };
  const readString = () => {
    i += 1; // opening quote
    let value = '';
    while (i < text.length) {
      const ch = text[i];
      if (ch === '\\') {
        value += text.slice(i, i + 2);
        i += 2;
      } else if (ch === '"') {
        i += 1;
        return value;
      } else {
        value += ch;
        i += 1;
      }
    }
    return value;
  };
  const readPrimitive = () => {
    while (i < text.length && text[i] !== ',' && text[i] !== ']' && text[i] !== '}') {
      i += 1;
    }
  };
  const readArray = () => {
    i += 1;
    skipSpace();
    while (i < text.length && text[i] !== ']') {
      readValue();
      skipSpace();
      if (text[i] === ',') {
        i += 1;
        skipSpace();
      }
    }
    i += 1;
  };
  const readObject = () => {
    i += 1;
    skipSpace();
    const seen = new Set();
    while (i < text.length && text[i] !== '}') {
      skipSpace();
      const key = readString();
      if (seen.has(key)) {
        found = true;
        return;
      }
      seen.add(key);
      skipSpace();
      i += 1; // colon
      readValue();
      skipSpace();
      if (text[i] === ',') {
        i += 1;
        skipSpace();
      }
    }
    i += 1;
  };
  const readValue = () => {
    skipSpace();
    const ch = text[i];
    if (ch === '{') readObject();
    else if (ch === '[') readArray();
    else if (ch === '"') readString();
    else readPrimitive();
  };

  readValue();
  return found;
}

function main() {
  const args = process.argv.slice(2);
  const flag = args.indexOf('--input');
  let raw = null;
  if (flag !== -1) {
    const file = args[flag + 1];
    if (!file) unavailable();
    try {
      raw = readFileSync(file, 'utf8');
    } catch {
      unavailable();
    }
  } else {
    const pnpm = process.env.AUDIT_GATE_PNPM || 'pnpm';
    try {
      raw = execFileSync(pnpm, ['audit', '--json'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: TIMEOUT_MS,
      });
    } catch (err) {
      // A timeout, a signal, or a binary that cannot start is inconclusive.
      if (err && (err.timedOut || err.killed || err.signal)) unavailable();
      // pnpm audit exits non-zero when advisories exist; stdout still holds JSON.
      raw = err && typeof err.stdout === 'string' ? err.stdout : '';
      if (!raw) unavailable();
    }
  }
  let doc;
  try {
    doc = JSON.parse(raw);
  } catch {
    unavailable();
  }
  try {
    if (hasDuplicateKeys(raw)) unavailable();
  } catch {
    unavailable();
  }
  const counts = countVulnerabilities(doc);
  if (!counts) unavailable();
  const line =
    `critical=${counts.critical} high=${counts.high} ` +
    `moderate=${counts.moderate} low=${counts.low} info=${counts.info}`;
  console.log(line);
  if (counts.critical > 0 || counts.high > 0) process.exit(1);
  process.exit(0);
}

main();
