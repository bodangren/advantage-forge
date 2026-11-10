// Probe P1-B: the exception and the cover class, checked with fixture cost files (FR-2, FR-3).
// Usage: node measure/runs/asset_storytime_l2_retries_cover_20261110/probe-p1-guards.mjs
// The probe writes its fixtures under /tmp/opencode/l2rc/ only. It makes no provider call and
// reads no key. It uses the guard functions of scripts/storytime-muse-guards.mjs as they are.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as guards from '../../../scripts/storytime-muse-guards.mjs';

const SCRATCH = '/tmp/opencode/l2rc';
const U2_DIR = 'out/storytime/l2/unit2';
const COVER_DIR = 'out/storytime/covers/teacher-front/muse';
const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';

const HAT_PIP = 'l2-w10-story-page-put-on-your-hat-pip';
const RICE = 'l2-w09-card-rice';
const UNLISTED = 'l2-w09-story-page-i-like-rice-yum';
const COVER_ID = 'l2-u1-cover-quest-teacher-front';

const BOOK_START = guards.U2_RUN.startTime;
const EXTRA_START = guards.U2_EXTRA_TRY.startTime;
const COVER_START = guards.COVER_RUN.startTime;
/** One hour after the book start: after the book start, before the exception start. */
const BEFORE = new Date(Date.parse(BOOK_START) + 3_600_000).toISOString();
/** One minute after the exception start. */
const AFTER_EXTRA = new Date(Date.parse(EXTRA_START) + 60_000).toISOString();
/** One minute after the cover start. */
const AFTER_COVER = new Date(Date.parse(COVER_START) + 60_000).toISOString();

const costRow = (id, cost = 0.01, kind = 'color', time = BEFORE, note = 'ok') =>
  `${time}\t${id}\tm1\t${kind}\tin\t${id}-m1-${kind}.png\t1500x1500\t${cost}\t${note}`;

const writeCosts = (root, rel, rows) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${HEADER}\n${rows.join('\n')}\n`);
};

const u2Spec = (id, week) => ({ spec: { id, outDir: `${U2_DIR}/${week}/muse` } });
const coverSpec = () => ({ spec: { id: COVER_ID, outDir: COVER_DIR } });
const u2Call = (root, id, week, kind, opts = {}) => guards.runGuards(root, [u2Spec(id, week)], kind, opts);
const coverCall = (root, kind, opts = {}) => guards.runGuards(root, [coverSpec()], kind, opts);

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ` :: ${detail}`}`);
};

// A temp folder pair: one u2 root (week folders) and one cover root (muse folder).
const fixturePair = () => {
  const base = mkdtempSync(path.join(SCRATCH, 'probe-p1-'));
  return { base, u2: path.join(base, 'u2'), cover: path.join(base, 'cover') };
};

let f;
try {
  // E1: a try 4 of an id that is not listed is refused.
  f = fixturePair();
  writeCosts(f.u2, 'w09/muse/costs.tsv', [costRow(UNLISTED), costRow(UNLISTED), costRow(UNLISTED)]);
  let r = u2Call(f.u2, UNLISTED, 'w09', 'color');
  check('E1 unlisted try 4 refused', r.refused === true && r.code === 3 && /count 3 \(max 3\)/.test(r.message), JSON.stringify(r));
  rmSync(f.base, { recursive: true, force: true });

  // E2: a second extra try of a listed id and kind is refused.
  f = fixturePair();
  writeCosts(f.u2, 'w09/muse/costs.tsv', [
    costRow(RICE, 0.01, 'line'), costRow(RICE, 0.01, 'line'), costRow(RICE, 0.01, 'line'),
    costRow(RICE, 0.01, 'line', AFTER_EXTRA),
  ]);
  r = u2Call(f.u2, RICE, 'w09', 'line');
  check('E2 second extra try refused', r.refused === true && /already has 1 try/.test(r.message), JSON.stringify(r));
  rmSync(f.base, { recursive: true, force: true });

  // E3a: a line try 4 of hat-pip is refused (its listed line row has pastLimit false).
  f = fixturePair();
  writeCosts(f.u2, 'w10/muse/costs.tsv', [
    costRow(HAT_PIP, 0.01, 'line'), costRow(HAT_PIP, 0.01, 'line'), costRow(HAT_PIP, 0.01, 'line'),
  ]);
  r = u2Call(f.u2, HAT_PIP, 'w10', 'line');
  check('E3a hat-pip line try 4 refused', r.refused === true && /count 3 \(max 3\)/.test(r.message), JSON.stringify(r));
  rmSync(f.base, { recursive: true, force: true });

  // E3b: a color try 4 of rice is refused (rice is listed for line only).
  f = fixturePair();
  writeCosts(f.u2, 'w09/muse/costs.tsv', [
    costRow(RICE, 0.01, 'color'), costRow(RICE, 0.01, 'color'), costRow(RICE, 0.01, 'color'),
  ]);
  r = u2Call(f.u2, RICE, 'w09', 'color');
  check('E3b rice color try 4 refused', r.refused === true && /count 3 \(max 3\)/.test(r.message), JSON.stringify(r));
  rmSync(f.base, { recursive: true, force: true });

  // E4: an exception spend above 0.15 USD with the next call is refused.
  f = fixturePair();
  writeCosts(f.u2, 'w12/muse/costs.tsv', [
    costRow('l2-w12-card-hippo', 0.075, 'line', AFTER_EXTRA),
    costRow('l2-w12-card-ruler', 0.075, 'line', AFTER_EXTRA),
  ]);
  r = u2Call(f.u2, 'l2-w13-card-clap', 'w13', 'line');
  check('E4 exception spend over cap refused', r.refused === true && /exception spend/.test(r.message), JSON.stringify(r));
  rmSync(f.base, { recursive: true, force: true });

  // E5: a listed id with the right kind and spend under the cap is allowed once.
  f = fixturePair();
  writeCosts(f.u2, 'w09/muse/costs.tsv', [
    costRow(RICE, 0.01, 'line'), costRow(RICE, 0.01, 'line'), costRow(RICE, 0.01, 'line'),
  ]);
  r = u2Call(f.u2, RICE, 'w09', 'line');
  check('E5 listed right kind under cap allowed', r.refused === false && r.code === 0 && r.run === 'u2', JSON.stringify(r));
  // E5b: exception spend 0.14 plus one margin 0.01 stays at the cap and is allowed.
  writeCosts(f.u2, 'w12/muse/costs.tsv', [costRow('l2-w12-card-hippo', 0.14, 'line', AFTER_EXTRA)]);
  r = u2Call(f.u2, 'l2-w12-card-ruler', 'w12', 'line');
  check('E5b spend 0.14 plus margin allowed', r.refused === false, JSON.stringify(r));
  rmSync(f.base, { recursive: true, force: true });

  // E6: a 0-USD failed call uses the extra try.
  f = fixturePair();
  writeCosts(f.u2, 'w09/muse/costs.tsv', [
    costRow(RICE, 0.01, 'line'), costRow(RICE, 0.01, 'line'), costRow(RICE, 0.01, 'line'),
    costRow(RICE, 0, 'line', AFTER_EXTRA, 'http 400'),
  ]);
  r = u2Call(f.u2, RICE, 'w09', 'line');
  check('E6 0-USD failed call uses the try', r.refused === true && /already has 1 try/.test(r.message), JSON.stringify(r));
  rmSync(f.base, { recursive: true, force: true });

  // E7: the book cap still refuses a listed call (test-only key stands in for the cap).
  f = fixturePair();
  writeCosts(f.u2, 'w09/muse/costs.tsv', [
    costRow(RICE, 0.01, 'line'), costRow(RICE, 0.01, 'line'), costRow(RICE, 0.01, 'line'),
  ]);
  r = u2Call(f.u2, RICE, 'w09', 'line', { u2CapUsd: 0.001 });
  check('E7 book cap refuses a listed call', r.refused === true && /over cap/.test(r.message), JSON.stringify(r));
  rmSync(f.base, { recursive: true, force: true });

  // E8: an empty exception cap key is refused; the CLI strip removes both new keys.
  f = fixturePair();
  writeCosts(f.u2, 'w09/muse/costs.tsv', [
    costRow(RICE, 0.01, 'line'), costRow(RICE, 0.01, 'line'), costRow(RICE, 0.01, 'line'),
  ]);
  r = u2Call(f.u2, RICE, 'w09', 'line', { u2ExtraCapUsd: '' });
  const stripped = guards.cliGuardOptions({ u2ExtraCapUsd: 9, coverCapUsd: 9, u2CapUsd: 9, other: 1 });
  check(
    'E8 empty exception cap refused and CLI strips the keys',
    r.refused === true && r.message === guards.U2_EXTRA_CAP_MESSAGE &&
      !('u2ExtraCapUsd' in stripped) && !('coverCapUsd' in stripped) && !('u2CapUsd' in stripped) && stripped.other === 1,
    `${JSON.stringify(r)} ${JSON.stringify(stripped)}`,
  );
  rmSync(f.base, { recursive: true, force: true });

  // C1: a cover call above 0.10 USD is refused on spend, with the try count still open.
  f = fixturePair();
  writeCosts(f.cover, 'muse/costs.tsv', [
    costRow(COVER_ID, 0.034, 'color', AFTER_COVER),
    costRow(COVER_ID, 0.034, 'color', AFTER_COVER),
    costRow(COVER_ID, 0.034, 'color', AFTER_COVER),
  ]);
  r = coverCall(f.cover, 'color');
  check('C1 cover spend over cap refused', r.refused === true && /over cap/.test(r.message) && r.run === 'cover', JSON.stringify(r));
  rmSync(f.base, { recursive: true, force: true });

  // C2: the 7th cover try is refused.
  f = fixturePair();
  writeCosts(f.cover, 'muse/costs.tsv', Array.from({ length: 6 }, () => costRow(COVER_ID, 0.001, 'color', AFTER_COVER)));
  r = coverCall(f.cover, 'color');
  check('C2 7th cover try refused', r.refused === true && /count 6 \(max 6\)/.test(r.message), JSON.stringify(r));
  rmSync(f.base, { recursive: true, force: true });

  // C3: the cover class covers exactly one folder.
  const badPaths = [
    'out/storytime/covers/teacher-back/muse',
    'out/storytime/covers/teacher-front',
    'out/storytime/covers/teacher-front/muse2',
    'out/storytime/covers/teacher-front/muse/elements',
    'out/storytime/covers/teacher-front/muse/extra',
    'out/storytime/covers',
  ];
  const exact = guards.classifyOutDir({ outDir: COVER_DIR }, '.').kind === 'cover' && guards.isCoverOutDir(COVER_DIR);
  const others = badPaths.every((p) => guards.classifyOutDir({ outDir: p }, '.').kind === 'invalid' && !guards.isCoverOutDir(p));
  check('C3 cover class exact folder only', exact && others, `${exact} ${others}`);

  // C4a: cover spend does not count against the exception cap (0.09 cover, 0.14 exception).
  f = fixturePair();
  writeCosts(f.cover, 'muse/costs.tsv', Array.from({ length: 9 }, () => costRow(COVER_ID, 0.01, 'color', AFTER_COVER)));
  writeCosts(f.u2, 'w12/muse/costs.tsv', [costRow('l2-w12-card-hippo', 0.14, 'line', AFTER_EXTRA)]);
  r = u2Call(f.u2, 'l2-w12-card-ruler', 'w12', 'line');
  check('C4a cover spend off the exception cap', r.refused === false, JSON.stringify(r));
  rmSync(f.base, { recursive: true, force: true });

  // C4b: book and exception spend does not count against the cover cap (0.15 exception, 0.02 cover).
  f = fixturePair();
  writeCosts(f.cover, 'muse/costs.tsv', Array.from({ length: 2 }, () => costRow(COVER_ID, 0.01, 'color', AFTER_COVER)));
  writeCosts(f.u2, 'w12/muse/costs.tsv', Array.from({ length: 15 }, () => costRow('l2-w12-card-hippo', 0.01, 'line', AFTER_EXTRA)));
  r = coverCall(f.cover, 'color');
  check('C4b book spend off the cover cap', r.refused === false && r.run === 'cover', JSON.stringify(r));
  rmSync(f.base, { recursive: true, force: true });

  // C5: a cover line call is refused, and a mixed call is refused.
  f = fixturePair();
  writeCosts(f.cover, 'muse/costs.tsv', []);
  r = coverCall(f.cover, 'line');
  const mixed = guards.runGuards(f.cover, [coverSpec(), u2Spec(RICE, 'w09')], 'color', {});
  check(
    'C5 cover line and mixed calls refused',
    r.refused === true && r.message === guards.COVER_LINE_MESSAGE && mixed.refused === true && /mixes cover specs/.test(mixed.message),
    `${JSON.stringify(r)} ${JSON.stringify(mixed)}`,
  );
  rmSync(f.base, { recursive: true, force: true });

  // C6: an empty cover cap key is refused.
  f = fixturePair();
  r = coverCall(f.cover, 'color', { coverCapUsd: 0 });
  check('C6 empty cover cap refused', r.refused === true && r.message === guards.COVER_CAP_MESSAGE, JSON.stringify(r));
  rmSync(f.base, { recursive: true, force: true });
} finally {
  if (f) rmSync(f.base, { recursive: true, force: true });
}

const failed = results.filter((x) => !x.ok);
console.log(`probe-p1-guards: ${results.length - failed.length}/${results.length} checks hold`);
process.exit(failed.length ? 1 : 0);
