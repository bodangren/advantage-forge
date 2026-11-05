// Storytime Muse restart guards (T3a, 2026-11-04). No provider call in this module.
//
// The picture restart of 2026-11-04 follows Daniel's word: "Beautiful samples. Approved. Also
// redo the incorrect pictures." (Tasks, 2026-11-04 14:54 ICT). The restart rules (Daniel,
// 11-03, PM relay):
//   - at most 3 color tries and 3 line tries per picture;
//   - spend cap 1.00 USD for the whole restart run (before a call: sum + 0.01 <= 1.00);
//   - report point 0.50 USD (print a notice line before a call once the sum is at or above it).
//
// Rows are read from costs.tsv. A picture try is a row with time at or after the restart start
// time, kind `color` or `line`, in a top-level `out/storytime/l2/unit1/*/muse/costs.tsv`. A row
// with usage_cost 0 and a failed note (output `none` and a note that is not `ok` or `redo <n>`)
// does not count. Rows before the start time do not count.
//
// Element sheet and reference calls count against the spend guard, not against the tries of a
// picture. The script tells them apart by file location: element and reference rows live in
// `out/storytime/l2/unit1/*/muse/elements/costs.tsv`. The try counter reads only the top-level
// cost files. The spend guard reads the top-level files and the elements files.
//
// A picture with two ids is one picture (one generation, used for both ids):
//   - nose: l2-w01-practice-line-nose and l2-w01-check-row-nose.
// The ostrich has one id, l2-w07-check-row-ostrich. The same picture fills week 7 and week 8, so
// the id needs no group. The old olive id and the old week 8 ostrich id are gone from the list.
// The try counter maps every id to its picture and counts the rows of the whole group.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const RESTART_START = '2026-11-04T07:54:00Z';
export const MAX_TRIES = 3;
export const SPEND_CAP_USD = 1.0;
export const SPEND_MARGIN_USD = 0.01;
export const REPORT_AT_USD = 0.5;

/**
 * Owner-granted extra tries per picture and kind (T4 steps 11 and 13, 2026-11-05). The
 * orchestrator authorized these changes under the PM decisions quoted in each `source`, and the
 * strategy role amended the 5.11 X2/X5 freeze for them. Every entry grants its tries to one id
 * and kind; `maxTriesFor` sums the extras, so every id and kind without an entry keeps the max
 * of MAX_TRIES, and the two-id group rule of PICTURE_IDS stays untouched.
 */
export const TRY_EXCEPTIONS = [
  {
    id: 'l2-w01-story-page-a-nut',
    kind: 'line',
    extraTries: 1,
    source: 'PM, 2026-11-05 09:17 ICT: "Yes to ONE extra line-art try (the 4th) for the nut, as you described: a Muse line call from the passing color m4, one single shell outline, the lengthwise seam as a short inner line, the same Sonnet judge with the "one nut only" check. This is my decision, not Daniel\'s ... The 3-try stop rule stays for every other picture."',
  },
  {
    id: 'l2-w01-story-page-a-nut',
    kind: 'color',
    extraTries: 1,
    source: 'PM, 2026-11-05 ~10:23 ICT: "Yes: one more color try (ONE peanut lying on its side, plain one-pod profile, alone and large on Nan\'s palm) and one line try from it, 0.02 USD, same judge with the one-nut check. ... No further tries after this without my word."',
  },
  {
    id: 'l2-w01-story-page-a-nut',
    kind: 'line',
    extraTries: 1,
    source: 'PM, 2026-11-05 ~10:23 ICT: "Yes: one more color try (ONE peanut lying on its side, plain one-pod profile, alone and large on Nan\'s palm) and one line try from it, 0.02 USD, same judge with the one-nut check. ... No further tries after this without my word."',
  },
];

/** The try cap of one id and kind: MAX_TRIES plus the extra tries of its exceptions, if any. */
export const maxTriesFor = (id, kind, maxTries = MAX_TRIES) => {
  const key = pictureKey(id);
  const extra = TRY_EXCEPTIONS.filter((e) => pictureKey(e.id) === key && e.kind === kind)
    .reduce((s, e) => s + e.extraTries, 0);
  return maxTries + extra;
};

/** Two-id pictures: the value is the group of ids of one picture. The first id is the key. */
export const PICTURE_IDS = {
  'l2-w01-practice-line-nose': ['l2-w01-practice-line-nose', 'l2-w01-check-row-nose'],
};

/** The picture of an id: the group key, or the id itself when it has no group. */
export const pictureKey = (id) => {
  const hit = Object.entries(PICTURE_IDS).find(([, ids]) => ids.includes(id));
  return hit ? hit[0] : id;
};

/**
 * Parse one costs.tsv text into rows. The cost column is found by header name
 * (`usage_cost` or `cost_usd`), so a header change does not break the parse.
 */
export const parseCostsTsv = (text) => {
  const lines = text.split('\n');
  if (lines.length < 2) return [];
  const head = lines[0].split('\t').map((h) => h.trim());
  const idx = (name) => head.indexOf(name);
  const costCol = head.includes('usage_cost') ? 'usage_cost' : head.includes('cost_usd') ? 'cost_usd' : null;
  const cIdx = { time: idx('time'), row: idx('row'), kind: idx('kind'), output: idx('output'), note: idx('note'), cost: costCol ? idx(costCol) : -1 };
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split('\t');
    if (c.length < 2 || !c[0].trim()) continue;
    rows.push({
      time: cIdx.time >= 0 ? c[cIdx.time] : '',
      row: cIdx.row >= 0 ? c[cIdx.row] : '',
      kind: cIdx.kind >= 0 ? c[cIdx.kind] : '',
      output: cIdx.output >= 0 ? c[cIdx.output] : '',
      note: cIdx.note >= 0 ? c[cIdx.note] : '',
      cost: cIdx.cost >= 0 ? Number(c[cIdx.cost]) || 0 : 0,
    });
  }
  return rows;
};

/** True when the row time is at or after the start time. Dates are compared as numbers, so a fraction of a second sorts right. */
const utcMs = (t) => Date.parse(/(Z|[+-]\d\d:?\d\d)$/.test(t) ? t : `${t}Z`);
const sinceStart = (time, startTime) => utcMs(time) >= utcMs(startTime);

/** True for a row with usage_cost 0 and a failed note (a failed call does not count as a try). */
export const isFailedZeroCost = (r) => r.cost === 0 && !(r.note === 'ok' || /^redo \d+$/.test(r.note));

/** Count the tries of one picture id and kind since the restart start. */
export const countTries = (rows, id, kind, startTime = RESTART_START) => {
  const key = pictureKey(id);
  return rows.filter((r) => sinceStart(r.time, startTime) && r.kind === kind && r.row && pictureKey(r.row) === key && !isFailedZeroCost(r)).length;
};

/** Spend: the usage_cost of every row since the restart start, in all cost files. */
export const spendTotal = (rows, startTime = RESTART_START) => rows.filter((r) => sinceStart(r.time, startTime)).reduce((s, r) => s + r.cost, 0);

/** Try guard: refuses when the next call would pass the try cap of the picture and kind. */
export const tryGuard = (rows, id, kind, requested = 1, startTime = RESTART_START, maxTries = MAX_TRIES) => {
  const limit = maxTriesFor(id, kind, maxTries);
  const count = countTries(rows, id, kind, startTime);
  if (count >= limit) return { ok: false, count, max: limit, reason: `count ${count} at max ${limit}` };
  if (count + requested > limit) return { ok: false, count, max: limit, reason: `count ${count} plus requested ${requested} over max ${limit}` };
  return { ok: true, count, max: limit };
};

/** Spend guard: refuses when the sum plus the margin is over the cap. Gives the notice state. */
export const spendGuard = (rows, startTime = RESTART_START, cap = SPEND_CAP_USD, margin = SPEND_MARGIN_USD, reportAt = REPORT_AT_USD) => {
  const spend = spendTotal(rows, startTime);
  if (spend + margin > cap) return { ok: false, spend };
  return { ok: true, spend, notice: spend >= reportAt };
};

/**
 * Scan the unit 1 muse folders. pictureRows: rows of the top-level costs.tsv files (picture
 * tries). allRows: rows of the top-level and the elements costs.tsv files (spend rows; element
 * and reference calls are the rows of the elements files).
 */
export const scanCostFiles = (unitRoot) => {
  const pictureRows = [];
  const allRows = [];
  for (const e of readdirSync(unitRoot, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const top = join(unitRoot, e.name, 'muse', 'costs.tsv');
    if (existsSync(top)) {
      const rows = parseCostsTsv(readFileSync(top, 'utf8'));
      pictureRows.push(...rows);
      allRows.push(...rows);
    }
    const elements = join(unitRoot, e.name, 'muse', 'elements', 'costs.tsv');
    if (existsSync(elements)) allRows.push(...parseCostsTsv(readFileSync(elements, 'utf8')));
  }
  return { pictureRows, allRows };
};

/**
 * Run the two guards for one invocation. Returns a decision; it makes no call and does not exit.
 * The caller prints the message and exits with code 3 when refused.
 */
export const runGuards = (unitRoot, ctxs, cmd, opts = {}) => {
  const { pictureRows, allRows } = scanCostFiles(unitRoot);
  const s = spendGuard(allRows);
  const spend = s.spend;
  if (!s.ok) {
    return { refused: true, code: 3, spend, notice: false, message: `refused: spend ${spend.toFixed(4)} USD plus ${SPEND_MARGIN_USD} over cap ${SPEND_CAP_USD}` };
  }
  const kind = cmd;
  const requested = cmd === 'line' ? Number(opts.tries ?? 1) : 1;
  for (const ctx of ctxs) {
    const g = tryGuard(pictureRows, ctx.spec.id, kind, requested);
    if (!g.ok) {
      return { refused: true, code: 3, spend, notice: s.notice, message: `refused: ${ctx.spec.id} ${kind} count ${g.count} (max ${g.max})` };
    }
  }
  return { refused: false, code: 0, spend, notice: s.notice, message: '' };
};
