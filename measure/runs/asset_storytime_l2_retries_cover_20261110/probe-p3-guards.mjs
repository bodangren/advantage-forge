// Probe P3: the D20 guard rule, checked with fixture cost files (no provider call, no key).
// Usage: node measure/runs/asset_storytime_l2_retries_cover_20261110/probe-p3-guards.mjs
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as guards from '../../../scripts/storytime-muse-guards.mjs';

const SCRATCH = '/tmp/opencode/l2rc-p3c';
const U2_DIR = 'out/storytime/l2/unit2';
const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';
const HAT_PIP = 'l2-w10-story-page-put-on-your-hat-pip';
const RICE = 'l2-w09-card-rice';
const EXTRA_START = guards.U2_EXTRA_TRY.startTime;
const BEFORE = new Date(Date.parse(guards.U2_RUN.startTime) + 3_600_000).toISOString();
const AFTER1 = new Date(Date.parse(EXTRA_START) + 60_000).toISOString();
const AFTER2 = new Date(Date.parse(EXTRA_START) + 120_000).toISOString();

const costRow = (id, kind, time, cost = 0.01) =>
  `${time}\t${id}\tm1\t${kind}\tin\t${id}-m1-${kind}.png\t1500x1500\t${cost}\tok`;
const writeCosts = (root, rel, rows) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${HEADER}\n${rows.join('\n')}\n`);
};
const u2Spec = (id, week) => ({ spec: { id, outDir: `${U2_DIR}/${week}/muse` } });
const call = (root, id, week, kind) => guards.runGuards(root, [u2Spec(id, week)], kind);

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ` :: ${detail}`}`);
};

const fixture = () => mkdtempSync(path.join(SCRATCH, 'probe-p3-'));
let root;
try {
  // G1: the hat-pip line row with 1 normal try and 2 exception tries: a third exception try is refused.
  root = fixture();
  writeCosts(root, 'w10/muse/costs.tsv', [
    costRow(HAT_PIP, 'line', BEFORE),
    costRow(HAT_PIP, 'line', AFTER1),
    costRow(HAT_PIP, 'line', AFTER2),
  ]);
  let r = call(root, HAT_PIP, 'w10', 'line');
  check('G1 third hat-pip exception line try refused', r.refused === true, JSON.stringify(r));
  check('G1b refusal names the 2-try grant', /grants 2 tries/.test(r.message ?? ''), r.message);

  // G2: the same row with 1 normal try and 1 exception try: the second exception try is allowed.
  root = fixture();
  writeCosts(root, 'w10/muse/costs.tsv', [costRow(HAT_PIP, 'line', BEFORE), costRow(HAT_PIP, 'line', AFTER1)]);
  r = call(root, HAT_PIP, 'w10', 'line');
  check('G2 second hat-pip exception line try allowed', r.refused !== true, JSON.stringify(r));

  // G3: a row without allowedTries (rice line) with 1 normal try and 1 exception try: refused.
  root = fixture();
  writeCosts(root, 'w09/muse/costs.tsv', [costRow(RICE, 'line', BEFORE), costRow(RICE, 'line', AFTER1)]);
  r = call(root, RICE, 'w09', 'line');
  check('G3 rice second exception try still refused', r.refused === true, JSON.stringify(r));

  // G4: U2_RUN.maxTries is still 3 and applies to an unlisted id.
  root = fixture();
  writeCosts(root, 'w09/muse/costs.tsv', [
    costRow('l2-w09-story-page-i-like-rice-yum', 'line', BEFORE),
    costRow('l2-w09-story-page-i-like-rice-yum', 'line', BEFORE),
    costRow('l2-w09-story-page-i-like-rice-yum', 'line', BEFORE),
  ]);
  r = call(root, 'l2-w09-story-page-i-like-rice-yum', 'w09', 'line');
  check('G4 unlisted id try 4 refused by the normal rule', r.refused === true, JSON.stringify(r));
  check('G4b U2_RUN.maxTries is 3', guards.U2_RUN.maxTries === 3, String(guards.U2_RUN.maxTries));

  // G5: the other U2_EXTRA_TRY rows keep their shape (only the hat-pip row has allowedTries).
  const withField = guards.U2_EXTRA_TRY.rows.filter((row) => row.allowedTries !== undefined).map((row) => row.id);
  check('G5 only the hat-pip row has allowedTries', withField.length === 1 && withField[0] === HAT_PIP, JSON.stringify(withField));
} finally {
  for (const d of mkdirSync ? [] : []) void d;
}
const failed = results.filter((r) => !r.ok);
console.log(`probe-p3-guards: ${results.length - failed.length}/${results.length} pass`);
process.exit(failed.length ? 1 : 0);
