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
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

/** The repository root. The guard resolves every spec outDir against it, like the muse tool. */
const ROOT = resolve(new URL('..', import.meta.url).pathname);

export const RESTART_START = '2026-11-04T07:54:00Z';
export const MAX_TRIES = 3;
export const SPEND_CAP_USD = 1.0;
export const SPEND_MARGIN_USD = 0.01;
export const REPORT_AT_USD = 0.5;

/**
 * Card run (2026-11-06). The 31 card pictures of list v7 are one paid run with its own start
 * time, cap, report point, margin, try cap, and output folder. This constant is the only owner
 * of these values. A card call reads only the card cost files, so the restart cap never counts
 * card spend and the card cap never counts restart spend.
 */
export const CARD_RUN = {
  startTime: '2026-11-06T00:00:00Z',
  capUsd: 1.6,
  reportAtUsd: 0.8,
  marginUsd: 0.01,
  maxTries: 3,
  outDir: 'out/storytime/l2/unit1/cards/muse',
};

/**
 * Line retry allowance of the card run (2026-11-07). The PM gave the ham row up to 2 more line
 * tries and the family row up to 3, inside the card limit. The allowance counts line tries since
 * its own start time, so the 3 line tries of each row before it do not count. The spend cap and
 * its start time stay in `CARD_RUN`. Every row without an entry, every other kind, and every
 * restart call keeps the `CARD_RUN` try rule. The start time is the real UTC time of Task 1,
 * cut to the minute, and it is later than the last row of `costs.tsv`.
 */
export const CARD_LINE_RETRY_START = '2026-11-07T02:00:00Z';

export const CARD_LINE_RETRY = {
  startTime: CARD_LINE_RETRY_START,
  rows: {
    'l2-w04-card-ham': 2,
    'l2-w04-card-family': 3,
  },
};

/** The card folder below a unit root: the last two parts of `CARD_RUN.outDir` (`cards/muse`). */
const CARD_FOLDER_PARTS = CARD_RUN.outDir.split('/').filter(Boolean).slice(-2);

/** The direct child folder of the card run below a unit root (`cards`). The restart scan skips it. */
const CARD_CHILD = CARD_FOLDER_PARTS[0];

/** The unit root of the card run: `CARD_RUN.outDir` without its last two parts. */
const UNIT_PARTS = CARD_RUN.outDir.split('/').filter(Boolean).slice(0, -2);

/** The default outDir of a spec without one. The muse tool uses the same default. */
const DEFAULT_OUT = [...UNIT_PARTS, 'w01', 'muse'].join('/');

/** True when a relative path holds no `..` part and no absolute start. */
const isInside = (rel) => rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);

/**
 * Classify the output folder of one spec:
 *   - `card` for the exact card folder of `CARD_RUN.outDir`;
 *   - `restart` for a week folder `<unit root>/<child>/muse` or its `elements` folder;
 *   - `invalid` for every other folder, including `..` escapes and mutated names.
 * Below the child folder `cards` only the exact card folder is valid. A card subfolder such as
 * `cards/muse/elements` or `cards/other/muse` is invalid, because the restart scan skips `cards`
 * and no scan would guard its spend.
 * The path is resolved against the repository root, like the muse tool writes it. A spec without
 * `outDir` uses the w01 default. An invalid folder is refused, so no call writes or reads a cost
 * file outside the scanned folders.
 */
export const classifyOutDir = (spec, unitRoot) => {
  const raw = spec?.outDir ?? DEFAULT_OUT;
  const resolved = resolve(ROOT, raw);
  const cardDirs = [resolve(ROOT, CARD_RUN.outDir), join(unitRoot, ...CARD_FOLDER_PARTS)];
  if (cardDirs.includes(resolved)) return { kind: 'card', raw, resolved };
  for (const anchor of [resolve(ROOT, ...UNIT_PARTS), resolve(unitRoot)]) {
    const rel = relative(anchor, resolved);
    if (!isInside(rel)) continue;
    const parts = rel.split(sep);
    if (parts[0] === CARD_CHILD) return { kind: 'invalid', raw, resolved };
    if (parts.length === 2 && parts[1] === 'muse') return { kind: 'restart', raw, resolved };
    if (parts.length === 3 && parts[1] === 'muse' && parts[2] === 'elements') return { kind: 'restart', raw, resolved };
  }
  return { kind: 'invalid', raw, resolved };
};

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

/**
 * Line retry guard: gives the allowance decision of one card row, in the form of `tryGuard`.
 * It counts the line tries of the row id since `CARD_LINE_RETRY.startTime`. A row without an
 * entry gets `null`, so the caller keeps the `CARD_RUN` rule for it.
 */
export const lineRetryGuard = (rows, id, requested = 1) => {
  if (!Object.hasOwn(CARD_LINE_RETRY.rows, id)) return null;
  const max = CARD_LINE_RETRY.rows[id];
  const count = countTries(rows, id, 'line', CARD_LINE_RETRY.startTime);
  if (count + requested > max) {
    return { ok: false, count, max, reason: `count ${count} plus requested ${requested} over max ${max}` };
  }
  return { ok: true, count, max };
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
 * and reference calls are the rows of the elements files). The restart scan skips the direct
 * child folder `cards`, so the card run never counts toward the restart cap and the restart run
 * never counts toward the card cap. `scanCardCostFiles` reads that folder.
 */
export const scanCostFiles = (unitRoot) => {
  const pictureRows = [];
  const allRows = [];
  for (const e of readdirSync(unitRoot, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name === CARD_CHILD) continue;
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
 * Scan the card cost files below a unit root. A card call reads only
 * `<unitRoot>/cards/muse/costs.tsv` and `<unitRoot>/cards/muse/elements/costs.tsv`. The elements
 * file counts for spend, like the restart scan.
 */
export const scanCardCostFiles = (unitRoot) => {
  const base = join(unitRoot, ...CARD_FOLDER_PARTS);
  const pictureRows = [];
  const allRows = [];
  const top = join(base, 'costs.tsv');
  if (existsSync(top)) {
    const rows = parseCostsTsv(readFileSync(top, 'utf8'));
    pictureRows.push(...rows);
    allRows.push(...rows);
  }
  const elements = join(base, 'elements', 'costs.tsv');
  if (existsSync(elements)) allRows.push(...parseCostsTsv(readFileSync(elements, 'utf8')));
  return { pictureRows, allRows };
};

/**
 * Run the guards for one invocation. Returns a decision; it makes no call and does not exit.
 * The caller prints the message and exits with code 3 when refused.
 *
 * The function is the one decision point for a restart call, a card call, a mixed call, and an
 * unknown output folder:
 *   - a spec with an unknown output folder is refused before any cost scan;
 *   - a mixed call is refused before any cost scan;
 *   - a card call uses `CARD_RUN` and the card cost files;
 *   - every other call uses the restart values and the restart scan.
 * After the spend check of the current sum, the function projects the whole pool: one margin per
 * provider call, plus one margin for a color pool (the line picture that follows each passing
 * color). A projected sum over the cap is refused, so a pool cannot pass the cap by its own calls.
 */
export const runGuards = (unitRoot, ctxs, cmd, opts = {}) => {
  const classes = ctxs.map((ctx) => ({ id: ctx?.spec?.id, ...classifyOutDir(ctx?.spec, unitRoot) }));
  const invalid = classes.find((c) => c.kind === 'invalid');
  if (invalid) {
    return {
      refused: true,
      code: 3,
      spend: 0,
      notice: false,
      run: 'invalid',
      reportAt: CARD_RUN.reportAtUsd,
      message: `refused: outDir ${invalid.raw} of ${invalid.id} is outside the scanned cost folders`,
    };
  }
  const cardFlags = classes.map((c) => c.kind === 'card');
  if (cardFlags.some(Boolean) && !cardFlags.every(Boolean)) {
    return {
      refused: true,
      code: 3,
      spend: 0,
      notice: false,
      run: 'mixed',
      reportAt: CARD_RUN.reportAtUsd,
      message: 'refused: the call mixes card specs with other specs; run each group in its own call',
    };
  }
  const card = ctxs.length > 0 && cardFlags.every(Boolean);
  const run = card ? 'card' : 'restart';
  const cap = card ? CARD_RUN.capUsd : SPEND_CAP_USD;
  const margin = card ? CARD_RUN.marginUsd : SPEND_MARGIN_USD;
  const reportAt = card ? CARD_RUN.reportAtUsd : REPORT_AT_USD;
  const startTime = card ? CARD_RUN.startTime : RESTART_START;
  const maxTries = card ? CARD_RUN.maxTries : MAX_TRIES;
  const { pictureRows, allRows } = card ? scanCardCostFiles(unitRoot) : scanCostFiles(unitRoot);
  const s = card ? spendGuard(allRows, startTime, cap, margin, reportAt) : spendGuard(allRows);
  const spend = s.spend;
  if (!s.ok) {
    return { refused: true, code: 3, spend, notice: false, run, reportAt, message: `refused: spend ${spend.toFixed(4)} USD plus ${margin} over cap ${cap}` };
  }
  const kind = cmd;
  const requested = cmd === 'line' ? Number(opts.tries ?? 1) : 1;
  const calls = cmd === 'line' ? ctxs.length * requested : ctxs.length;
  const cushion = cmd === 'line' ? 0 : 1;
  const projected = spend + (calls + cushion) * margin;
  if (projected > cap) {
    return { refused: true, code: 3, spend, notice: s.notice, run, reportAt, message: `refused: projected spend ${projected.toFixed(4)} USD over cap ${cap}` };
  }
  for (const ctx of ctxs) {
    const retry = card && kind === 'line' ? lineRetryGuard(pictureRows, ctx.spec.id, requested) : null;
    const g = retry ?? tryGuard(pictureRows, ctx.spec.id, kind, requested, startTime, maxTries);
    if (!g.ok) {
      return { refused: true, code: 3, spend, notice: s.notice, run, reportAt, message: `refused: ${ctx.spec.id} ${kind} count ${g.count} (max ${g.max})` };
    }
  }
  return { refused: false, code: 0, spend, notice: s.notice, run, reportAt, message: '' };
};

