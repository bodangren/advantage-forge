#!/usr/bin/env node
// Audit gate for track chore_dependency_refresh_20261121 (T1 Red).
//
// Runs `pnpm audit --json` and exits 0 when critical=0 and high=0, 1 otherwise.
// Exits 2 with `audit unavailable` when the audit cannot run or its JSON cannot
// parse. Exit 2 is inconclusive and never satisfies AC2.
//
//   node scripts/audit-gate.mjs                 live check (needs the network)
//   node scripts/audit-gate.mjs --input <file>  check a saved audit JSON file
//
// Note: `pnpm audit` exits non-zero when it finds advisories, so the live path
// reads stdout JSON regardless of the child exit code.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function countFromMetadata(vulnerabilities) {
  if (!vulnerabilities || typeof vulnerabilities !== 'object') return null;
  const pick = (key) =>
    Number.isInteger(vulnerabilities[key]) && vulnerabilities[key] >= 0
      ? vulnerabilities[key]
      : 0;
  return {
    critical: pick('critical'),
    high: pick('high'),
    moderate: pick('moderate'),
    low: pick('low'),
    info: pick('info'),
  };
}

function countFromAdvisories(advisories) {
  const list = Array.isArray(advisories)
    ? advisories
    : advisories && typeof advisories === 'object'
      ? Object.values(advisories)
      : null;
  if (!list) return null;
  const counts = { critical: 0, high: 0, moderate: 0, low: 0, info: 0 };
  for (const advisory of list) {
    const severity = String((advisory && advisory.severity) || '').toLowerCase();
    if (severity in counts) counts[severity] += 1;
  }
  return counts;
}

// Prefer metadata.vulnerabilities (the shape `pnpm audit --json` emits); fall
// back to counting advisory severities for audit documents without metadata.
function countVulnerabilities(doc) {
  if (!doc || typeof doc !== 'object') return null;
  return (
    countFromMetadata(doc.metadata && doc.metadata.vulnerabilities) ||
    countFromAdvisories(doc.advisories)
  );
}

function unavailable() {
  console.error('audit unavailable');
  process.exit(2);
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
    try {
      raw = execFileSync('pnpm', ['audit', '--json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      // pnpm audit exits non-zero when advisories exist; the JSON still lands
      // on stdout. Only a missing/empty stdout means the audit never ran.
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
