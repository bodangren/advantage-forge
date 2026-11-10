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

/**
 * Unit 2 run (2026-11-08). The PM gave the book caps on 2026-11-08: `capUsd` 18.33 and
 * `reportAtUsd` 14.66. This constant holds the real UTC time of the guard task, cut to the minute.
 * A book call reads only the 8 week folders `w09` to `w16`.
 */
export const U2_RUN = {
  startTime: '2026-11-08T05:21:00Z',
  capUsd: 18.33,
  reportAtUsd: 14.66,
  marginUsd: 0.01,
  maxTries: 3,
  unitRoot: 'out/storytime/l2/unit2',
};

/**
 * Unit 2 family-word run (2026-11-08). The 18 app family-word pictures are one paid item with its
 * own start time, stop, report point, margin, try cap, and output folder. The value of `startTime`
 * is the real UTC time of Task 1, cut to the minute. A family-word call reads only the `costs.tsv`
 * of `outDir` since `startTime`, so book spend never counts against the app stop and app spend
 * never counts against the book stop.
 */
export const U2_FW_RUN = {
  startTime: '2026-11-08T13:39:00Z',
  capUsd: 0.29,
  reportAtUsd: 0.23,
  marginUsd: 0.01,
  maxTries: 3,
  outDir: 'out/storytime/l2/unit2/family-words/muse',
};

/**
 * Unit 2 extra try exception (2026-11-10, D1). The PM gave 9 unit 2 book rows one extra try each
 * and wrote the exception into the track. This constant holds the cap, the report point, the
 * margin, and the list of the rows. Each row names its id, its kind, whether its try passes the
 * normal limit of `U2_RUN.maxTries`, and the PM words that granted it.
 *
 * The rule of the exception:
 *   - a try past `U2_RUN.maxTries` is allowed only for a listed id and kind with `pastLimit` true,
 *     only once, and only while the exception spend plus the planned calls stays at or under the
 *     cap;
 *   - the exception spend is the sum of the `usage_cost` rows of the 9 listed ids, of every kind,
 *     at or after `startTime`, read from the unit 2 week cost files;
 *   - the once count is the number of rows of the id and kind at or after `startTime`, and a
 *     failed call at 0 USD counts;
 *   - a row with `netRetry` true (D15) allows one more try past the once rule, so 2 exception
 *     tries in total for that id and kind. The second try is allowed only when the first exception
 *     try of that pair cost 0 USD. A third try is refused;
 *   - a call of a listed id inside the normal limit also passes the exception cap;
 *   - a call of an id that is not listed keeps the normal rule of 3 tries.
 *
 * The value of `startTime` is the real UTC time of the Phase 1 guard commit, cut to the minute.
 */
export const U2_EXTRA_TRY = {
  startTime: '2026-11-10T08:57:00Z',
  capUsd: 0.15,
  reportAtUsd: 0.12,
  marginUsd: 0.01,
  rows: [
    {
      id: 'l2-w10-story-page-put-on-your-hat-pip',
      kind: 'color',
      pastLimit: true,
      netRetry: true,
      source:
        'PM 2026-11-10: "the spend guard gets a written exception for exactly these 9 rows, 1 extra try each, cap 0.15 USD for (a)"; PM 2026-11-09: "Hat-pip page: yes, one more try (about 0.02 USD)."; PM 2026-11-10 (second exception): "DECISION on your question: YES, one more try for the 3 timed-out rows only. They failed on a network fault at 0 USD, so no real try happened. Write the new guard exception (3 rows, 1 try each), inside the same 0.15 USD cap (spent 0.06). Use the same network check before each call that you plan for step B."',
    },
    {
      id: 'l2-w10-story-page-put-on-your-hat-pip',
      kind: 'line',
      pastLimit: false,
      source:
        'PM 2026-11-10: "the spend guard gets a written exception for exactly these 9 rows, 1 extra try each, cap 0.15 USD for (a)"; PM 2026-11-09: "Hat-pip page: yes, one more try (about 0.02 USD)."; the line call follows the passing color try.',
    },
    {
      id: 'l2-w09-story-page-tom-can-see-the-mop',
      kind: 'line',
      pastLimit: true,
      netRetry: true,
      source:
        'PM 2026-11-10: "the spend guard gets a written exception for exactly these 9 rows, 1 extra try each, cap 0.15 USD for (a)"; PM 2026-11-09: "The other 8 open rows: option (a), one more try each (about 0.10 USD)."; PM 2026-11-10 (second exception): "DECISION on your question: YES, one more try for the 3 timed-out rows only. They failed on a network fault at 0 USD, so no real try happened. Write the new guard exception (3 rows, 1 try each), inside the same 0.15 USD cap (spent 0.06). Use the same network check before each call that you plan for step B."',
    },
    {
      id: 'l2-w09-card-rice',
      kind: 'line',
      pastLimit: true,
      netRetry: true,
      source:
        'PM 2026-11-10: "the spend guard gets a written exception for exactly these 9 rows, 1 extra try each, cap 0.15 USD for (a)"; PM 2026-11-09: "The other 8 open rows: option (a), one more try each (about 0.10 USD)."; PM 2026-11-10 (second exception): "DECISION on your question: YES, one more try for the 3 timed-out rows only. They failed on a network fault at 0 USD, so no real try happened. Write the new guard exception (3 rows, 1 try each), inside the same 0.15 USD cap (spent 0.06). Use the same network check before each call that you plan for step B."',
    },
    {
      id: 'l2-w12-card-hippo',
      kind: 'line',
      pastLimit: true,
      source:
        'PM 2026-11-10: "the spend guard gets a written exception for exactly these 9 rows, 1 extra try each, cap 0.15 USD for (a)"; PM 2026-11-09: "The other 8 open rows: option (a), one more try each (about 0.10 USD)."',
    },
    {
      id: 'l2-w12-card-ruler',
      kind: 'line',
      pastLimit: true,
      source:
        'PM 2026-11-10: "the spend guard gets a written exception for exactly these 9 rows, 1 extra try each, cap 0.15 USD for (a)"; PM 2026-11-09: "The other 8 open rows: option (a), one more try each (about 0.10 USD)."',
    },
    {
      id: 'l2-w13-card-clap',
      kind: 'line',
      pastLimit: true,
      source:
        'PM 2026-11-10: "the spend guard gets a written exception for exactly these 9 rows, 1 extra try each, cap 0.15 USD for (a)"; PM 2026-11-09: "The other 8 open rows: option (a), one more try each (about 0.10 USD)."',
    },
    {
      id: 'l2-w13-card-throw',
      kind: 'line',
      pastLimit: true,
      source:
        'PM 2026-11-10: "the spend guard gets a written exception for exactly these 9 rows, 1 extra try each, cap 0.15 USD for (a)"; PM 2026-11-09: "The other 8 open rows: option (a), one more try each (about 0.10 USD)."',
    },
    {
      id: 'l2-w14-card-cold',
      kind: 'line',
      pastLimit: true,
      source:
        'PM 2026-11-10: "the spend guard gets a written exception for exactly these 9 rows, 1 extra try each, cap 0.15 USD for (a)"; PM 2026-11-09: "The other 8 open rows: option (a), one more try each (about 0.10 USD)."',
    },
    {
      id: 'l2-w14-card-windy',
      kind: 'line',
      pastLimit: true,
      source:
        'PM 2026-11-10: "the spend guard gets a written exception for exactly these 9 rows, 1 extra try each, cap 0.15 USD for (a)"; PM 2026-11-09: "The other 8 open rows: option (a), one more try each (about 0.10 USD)."',
    },
  ],
};

/**
 * Cover run (2026-11-10, D7). The Teacher Book front art of Storytime Level 2 unit 1 is one paid
 * color picture with its own start time, stop, report point, margin, try cap, and output folder.
 * This constant is the only owner of these values. A cover call reads only the cost file of its
 * folder, so the book, app, and exception caps never count cover spend, and the cover cap never
 * counts their spend. The value of `startTime` is the real UTC time of the Phase 1 guard commit,
 * cut to the minute.
 */
export const COVER_RUN = {
  startTime: '2026-11-10T08:57:00Z',
  capUsd: 0.1,
  reportAtUsd: 0.08,
  marginUsd: 0.01,
  maxTries: 6,
  outDir: 'out/storytime/covers/teacher-front/muse',
};

/** The 8 unit 2 week folders. Only these folders hold unit 2 cost files. */
export const U2_WEEKS = ['w09', 'w10', 'w11', 'w12', 'w13', 'w14', 'w15', 'w16'];

/** The refusal message of a unit 2 call while the cap is empty. */
export const U2_CAP_MESSAGE = 'refused: the unit 2 cap is empty; the PM writes the approved limit in U2_RUN.capUsd';

/** The refusal message of a unit 2 family-word call while the app cap is empty. */
export const U2_FW_CAP_MESSAGE = 'refused: the unit 2 family-word cap is empty; the PM writes the approved limit in U2_FW_RUN.capUsd';

/** The refusal message of a listed unit 2 call while the exception cap is empty. */
export const U2_EXTRA_CAP_MESSAGE =
  'refused: the unit 2 extra try cap is empty; the PM writes the approved limit in U2_EXTRA_TRY.capUsd';

/** The refusal message of a cover call while the cover cap is empty. */
export const COVER_CAP_MESSAGE = 'refused: the cover cap is empty; the PM writes the approved limit in COVER_RUN.capUsd';

/** The refusal message of a cover line call. The cover art is color only. */
export const COVER_LINE_MESSAGE = 'refused: the cover class is color only; it has no line call';

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

/** The unit 2 root, resolved like every other folder. It holds the 8 week folders. */
const U2_ROOT = resolve(ROOT, U2_RUN.unitRoot);

/** The family-word folder below a unit root: the last two parts of `U2_FW_RUN.outDir`. */
const U2_FW_PARTS = U2_FW_RUN.outDir.split('/').filter(Boolean).slice(-2);

/** The exact family-word folder of the app run. No other folder carries the kind `u2fw`. */
const U2_FW_ROOT = resolve(ROOT, U2_FW_RUN.outDir);

/** The unit 2 week folder names, as a set for the classifier. */
const U2_WEEK_SET = new Set(U2_WEEKS);

/** The exact cover folder of the cover run. No other folder carries the kind `cover`. */
const COVER_OUT_DIR = resolve(ROOT, COVER_RUN.outDir);

/** The cover root: the folder that holds every cover folder. */
const COVER_ROOT = resolve(ROOT, 'out/storytime/covers');

/** The 9 ids of the extra try exception, as a set for the spend scan. */
const U2_EXTRA_IDS = new Set(U2_EXTRA_TRY.rows.map((row) => row.id));

/**
 * True when a resolved folder is a unit 2 output folder: `w09` to `w16` and then `muse` or
 * `muse/elements`. Every other unit 2 folder, including a mutated name or a `..` escape, is false.
 */
const isU2Folder = (resolved) => {
  const rel = relative(U2_ROOT, resolved);
  if (!isInside(rel)) return false;
  const parts = rel.split(sep);
  if (!U2_WEEK_SET.has(parts[0])) return false;
  if (parts.length === 2 && parts[1] === 'muse') return true;
  return parts.length === 3 && parts[1] === 'muse' && parts[2] === 'elements';
};

/**
 * True when a spec (or a folder path) points into the unit 2 output tree. The muse tool uses it to
 * send a unit 2 call to the unit 2 root.
 */
export const isUnit2OutDir = (specOrPath) => {
  const raw = typeof specOrPath === 'string' ? specOrPath : specOrPath?.outDir;
  if (!raw) return false;
  return isU2Folder(resolve(ROOT, raw));
};

/**
 * True when a spec (or a folder path) points at the exact family-word folder of the app run. The
 * muse tool uses it to send a family-word call to the unit 2 guard.
 */
export const isUnit2FwOutDir = (specOrPath) => {
  const raw = typeof specOrPath === 'string' ? specOrPath : specOrPath?.outDir;
  if (!raw) return false;
  return resolve(ROOT, raw) === U2_FW_ROOT;
};

/**
 * The guard options of a CLI call. The test-only cap keys `u2CapUsd`, `u2FwCapUsd`,
 * `u2ExtraCapUsd`, and `coverCapUsd` never reach `runGuards` from the CLI, so a future
 * option-parser change cannot raise a cap. A JS caller keeps its own options object.
 */
export const cliGuardOptions = (opts = {}) => {
  const next = { ...opts };
  delete next.u2CapUsd;
  delete next.u2FwCapUsd;
  delete next.u2ExtraCapUsd;
  delete next.coverCapUsd;
  return next;
};

/**
 * True when a spec (or a folder path) points at the exact cover folder of the cover run. The
 * muse tool uses it to send a cover call to the cover guard.
 */
export const isCoverOutDir = (specOrPath) => {
  const raw = typeof specOrPath === 'string' ? specOrPath : specOrPath?.outDir;
  if (!raw) return false;
  return resolve(ROOT, raw) === COVER_OUT_DIR;
};

/**
 * Classify the output folder of one spec:
 *   - `card` for the exact card folder of `CARD_RUN.outDir`;
 *   - `u2` for the unit 2 folder `w09` to `w16` and then `muse` or `muse/elements`;
 *   - `u2fw` for exactly the family-word folder of `U2_FW_RUN.outDir`;
 *   - `cover` for exactly the cover folder of `COVER_RUN.outDir`;
 *   - `restart` for a week folder `<unit root>/<child>/muse` or its `elements` folder;
 *   - `invalid` for every other folder, including `..` escapes and mutated names.
 * Below the child folder `cards` only the exact card folder is valid. A card subfolder such as
 * `cards/muse/elements` or `cards/other/muse` is invalid, because the restart scan skips `cards`
 * and no scan would guard its spend.
 * Every other folder below `out/storytime/covers/` is invalid, because only the exact cover
 * folder has a cost scan.
 * The unit 2 test runs first and uses the fixed unit 2 root of `U2_RUN`, so a unit 2 folder is
 * `u2` even when the caller passes another unit root.
 * The path is resolved against the repository root, like the muse tool writes it. A spec without
 * `outDir` uses the w01 default. An invalid folder is refused, so no call writes or reads a cost
 * file outside the scanned folders.
 */
export const classifyOutDir = (spec, unitRoot) => {
  const raw = spec?.outDir ?? DEFAULT_OUT;
  const resolved = resolve(ROOT, raw);
  const cardDirs = [resolve(ROOT, CARD_RUN.outDir), join(unitRoot, ...CARD_FOLDER_PARTS)];
  if (cardDirs.includes(resolved)) return { kind: 'card', raw, resolved };
  if (resolved === U2_FW_ROOT) return { kind: 'u2fw', raw, resolved };
  if (isU2Folder(resolved)) return { kind: 'u2', raw, resolved };
  if (resolved === COVER_OUT_DIR) return { kind: 'cover', raw, resolved };
  if (isInside(relative(COVER_ROOT, resolved))) return { kind: 'invalid', raw, resolved };
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

/**
 * The exception row of one id and kind, or null when the pair is not listed. The list of
 * `U2_EXTRA_TRY.rows` holds one entry per id and kind.
 */
export const exceptionEntryFor = (id, kind) =>
  U2_EXTRA_TRY.rows.find((row) => row.id === id && row.kind === kind) ?? null;

/**
 * The once count of one id and kind: the number of its rows at or after the exception start time.
 * A failed call at 0 USD counts, so the rule of D1 holds for a failed call too.
 */
export const countExceptionRows = (rows, id, kind, startTime = U2_EXTRA_TRY.startTime) =>
  rows.filter((r) => sinceStart(r.time, startTime) && r.kind === kind && r.row === id).length;

/**
 * The cost of the first exception try of one id and kind: the cost of its earliest row at or after
 * the exception start time. It is null when the pair has no row since the start time. The rule of
 * D15 reads this cost: the second try of a `netRetry` row needs a first try at 0 USD.
 */
export const firstExceptionTryCost = (rows, id, kind, startTime = U2_EXTRA_TRY.startTime) => {
  const tries = rows
    .filter((r) => sinceStart(r.time, startTime) && r.kind === kind && r.row === id)
    .sort((a, b) => utcMs(a.time) - utcMs(b.time));
  return tries.length ? tries[0].cost : null;
};

/**
 * The exception spend: the sum of the `usage_cost` rows of the 9 listed ids, of every kind, at or
 * after the exception start time. The rows come from the unit 2 week cost files.
 */
export const exceptionSpendOf = (rows, startTime = U2_EXTRA_TRY.startTime) =>
  rows
    .filter((r) => sinceStart(r.time, startTime) && U2_EXTRA_IDS.has(r.row))
    .reduce((s, r) => s + r.cost, 0);

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
 * Scan the unit 2 cost files below the unit 2 root. A unit 2 call reads only the 8 week folders
 * `w09` to `w16` of the root it is given: the top-level `costs.tsv` files (picture tries) and the
 * `muse/elements/costs.tsv` files (spend rows). A folder outside those 8 weeks is not read.
 */
export const scanU2CostFiles = (unitRoot) => {
  const pictureRows = [];
  const allRows = [];
  for (const week of U2_WEEKS) {
    const top = join(unitRoot, week, 'muse', 'costs.tsv');
    if (existsSync(top)) {
      const rows = parseCostsTsv(readFileSync(top, 'utf8'));
      pictureRows.push(...rows);
      allRows.push(...rows);
    }
    const elements = join(unitRoot, week, 'muse', 'elements', 'costs.tsv');
    if (existsSync(elements)) allRows.push(...parseCostsTsv(readFileSync(elements, 'utf8')));
  }
  return { pictureRows, allRows };
};

/**
 * Scan the family-word cost file of the app run below a unit root. A family-word call reads only
 * `<unitRoot>/family-words/muse/costs.tsv` and keeps the rows at or after `U2_FW_RUN.startTime`.
 * No other folder is read, so book spend never counts against the app stop.
 */
export const scanU2FwCostFiles = (unitRoot) => {
  const pictureRows = [];
  const allRows = [];
  const top = join(unitRoot, ...U2_FW_PARTS, 'costs.tsv');
  if (existsSync(top)) {
    const rows = parseCostsTsv(readFileSync(top, 'utf8')).filter((r) => sinceStart(r.time, U2_FW_RUN.startTime));
    pictureRows.push(...rows);
    allRows.push(...rows);
  }
  return { pictureRows, allRows };
};

/**
 * Scan the cover cost file of the cover run. A cover call reads only the `costs.tsv` of the cover
 * folder `COVER_RUN.outDir`, and only the rows at or after `COVER_RUN.startTime`. The caller sends
 * the unit 1 root for a cover call, so the scan uses the fixed cover folder. A unit root outside
 * the repository root is a test fixture root, and the scan reads its `muse` folder instead.
 */
export const scanCoverCostFiles = (unitRoot) => {
  const rel = unitRoot ? relative(ROOT, resolve(unitRoot)) : '';
  const outside = rel !== '' && !isInside(rel);
  const base = outside ? join(resolve(unitRoot), 'muse') : COVER_OUT_DIR;
  const pictureRows = [];
  const allRows = [];
  const top = join(base, 'costs.tsv');
  if (existsSync(top)) {
    const rows = parseCostsTsv(readFileSync(top, 'utf8')).filter((r) => sinceStart(r.time, COVER_RUN.startTime));
    pictureRows.push(...rows);
    allRows.push(...rows);
  }
  return { pictureRows, allRows };
};

/**
 * Run the guards for one invocation. Returns a decision; it makes no call and does not exit.
 * The caller prints the message and exits with code 3 when refused.
 *
 * The function is the one decision point for a restart call, a card call, a unit 2 call, a
 * family-word call, a cover call, a mixed call, and an unknown output folder:
 *   - a spec with an unknown output folder is refused before any cost scan;
 *   - a mixed call is refused before any cost scan;
 *   - a book call reads only the unit 2 week cost files and uses `U2_RUN`;
 *   - a family-word call reads only the family-word cost file and uses `U2_FW_RUN`;
 *   - a card call uses `CARD_RUN` and the card cost files;
 *   - a cover call uses `COVER_RUN` and the cover cost file, and it has no line call;
 *   - every other call uses the restart values and the restart scan.
 * An empty or invalid cap of either unit 2 kind is refused.
 * A unit 2 call of a row of the extra try exception also passes the exception cap and the once
 * rule of `U2_EXTRA_TRY`. A row with `pastLimit` true passes the normal try limit once.
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
  const coverFlags = classes.map((c) => c.kind === 'cover');
  if (coverFlags.some(Boolean) && !coverFlags.every(Boolean)) {
    return {
      refused: true,
      code: 3,
      spend: 0,
      notice: false,
      run: 'mixed',
      reportAt: COVER_RUN.reportAtUsd,
      message: 'refused: the call mixes cover specs with other specs; run each group in its own call',
    };
  }
  const u2Flags = classes.map((c) => c.kind === 'u2');
  if (u2Flags.some(Boolean) && !u2Flags.every(Boolean)) {
    return {
      refused: true,
      code: 3,
      spend: 0,
      notice: false,
      run: 'mixed',
      reportAt: CARD_RUN.reportAtUsd,
      message: 'refused: the call mixes unit 2 specs with other specs; run each group in its own call',
    };
  }
  const u2fwFlags = classes.map((c) => c.kind === 'u2fw');
  if (u2fwFlags.some(Boolean) && !u2fwFlags.every(Boolean)) {
    return {
      refused: true,
      code: 3,
      spend: 0,
      notice: false,
      run: 'mixed',
      reportAt: CARD_RUN.reportAtUsd,
      message: 'refused: the call mixes unit 2 family-word specs with other specs; run each group in its own call',
    };
  }
  const u2 = ctxs.length > 0 && u2Flags.every(Boolean);
  const u2fw = ctxs.length > 0 && u2fwFlags.every(Boolean);
  // The test-only `opts.u2CapUsd`, `opts.u2FwCapUsd`, `opts.u2ExtraCapUsd`, and
  // `opts.coverCapUsd` stand in for a cap in a test. The CLI never sets them; `cliGuardOptions`
  // removes them.
  const u2Cap = u2 ? (Object.hasOwn(opts, 'u2CapUsd') ? opts.u2CapUsd : U2_RUN.capUsd) : null;
  const u2FwCap = u2fw ? (Object.hasOwn(opts, 'u2FwCapUsd') ? opts.u2FwCapUsd : U2_FW_RUN.capUsd) : null;
  const capOk = (cap) => typeof cap === 'number' && Number.isFinite(cap) && cap > 0;
  if (u2 && !capOk(u2Cap)) {
    return {
      refused: true,
      code: 3,
      spend: 0,
      notice: false,
      run: 'u2',
      reportAt: U2_RUN.reportAtUsd,
      message: U2_CAP_MESSAGE,
    };
  }
  if (u2fw && !capOk(u2FwCap)) {
    return {
      refused: true,
      code: 3,
      spend: 0,
      notice: false,
      run: 'u2fw',
      reportAt: U2_FW_RUN.reportAtUsd,
      message: U2_FW_CAP_MESSAGE,
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
  const cover = ctxs.length > 0 && coverFlags.every(Boolean);
  const coverCap = cover ? (Object.hasOwn(opts, 'coverCapUsd') ? opts.coverCapUsd : COVER_RUN.capUsd) : null;
  if (cover && !capOk(coverCap)) {
    return {
      refused: true,
      code: 3,
      spend: 0,
      notice: false,
      run: 'cover',
      reportAt: COVER_RUN.reportAtUsd,
      message: COVER_CAP_MESSAGE,
    };
  }
  if (cover && cmd === 'line') {
    return {
      refused: true,
      code: 3,
      spend: 0,
      notice: false,
      run: 'cover',
      reportAt: COVER_RUN.reportAtUsd,
      message: COVER_LINE_MESSAGE,
    };
  }
  const run = u2 ? 'u2' : u2fw ? 'u2fw' : card ? 'card' : cover ? 'cover' : 'restart';
  const cap = u2 ? u2Cap : u2fw ? u2FwCap : card ? CARD_RUN.capUsd : cover ? coverCap : SPEND_CAP_USD;
  const margin = u2 ? U2_RUN.marginUsd : u2fw ? U2_FW_RUN.marginUsd : card ? CARD_RUN.marginUsd : cover ? COVER_RUN.marginUsd : SPEND_MARGIN_USD;
  const reportAt = u2 ? (U2_RUN.reportAtUsd ?? Number.POSITIVE_INFINITY) : u2fw ? (U2_FW_RUN.reportAtUsd ?? Number.POSITIVE_INFINITY) : card ? CARD_RUN.reportAtUsd : cover ? COVER_RUN.reportAtUsd : REPORT_AT_USD;
  const startTime = u2 ? U2_RUN.startTime : u2fw ? U2_FW_RUN.startTime : card ? CARD_RUN.startTime : cover ? COVER_RUN.startTime : RESTART_START;
  const maxTries = u2 ? U2_RUN.maxTries : u2fw ? U2_FW_RUN.maxTries : card ? CARD_RUN.maxTries : cover ? COVER_RUN.maxTries : MAX_TRIES;
  const { pictureRows, allRows } = u2 ? scanU2CostFiles(unitRoot) : u2fw ? scanU2FwCostFiles(unitRoot) : card ? scanCardCostFiles(unitRoot) : cover ? scanCoverCostFiles(unitRoot) : scanCostFiles(unitRoot);
  const s = u2 || u2fw || card || cover ? spendGuard(allRows, startTime, cap, margin, reportAt) : spendGuard(allRows);
  const spend = s.spend;
  if (!s.ok) {
    return { refused: true, code: 3, spend, notice: false, run, reportAt: u2 ? U2_RUN.reportAtUsd : reportAt, message: `refused: spend ${spend.toFixed(4)} USD plus ${margin} over cap ${cap}` };
  }
  const kind = cmd;
  const requested = cmd === 'line' ? Number(opts.tries ?? 1) : 1;
  const calls = cmd === 'line' ? ctxs.length * requested : ctxs.length;
  // The extra try exception of D1. A listed row passes the exception cap and the once rule. The
  // notice of the exception uses the exception spend and its report point.
  const listed = u2 ? ctxs.filter((ctx) => exceptionEntryFor(ctx.spec.id, kind)) : [];
  let notice = s.notice;
  let reportAtOut = reportAt;
  let spendOut = spend;
  if (listed.length) {
    const extraCap = Object.hasOwn(opts, 'u2ExtraCapUsd') ? opts.u2ExtraCapUsd : U2_EXTRA_TRY.capUsd;
    if (!capOk(extraCap)) {
      return {
        refused: true,
        code: 3,
        spend: 0,
        notice: false,
        run,
        reportAt: U2_EXTRA_TRY.reportAtUsd,
        message: U2_EXTRA_CAP_MESSAGE,
      };
    }
    const exceptionSpend = exceptionSpendOf(allRows, U2_EXTRA_TRY.startTime);
    const planned = calls * U2_EXTRA_TRY.marginUsd;
    // The sum of the margins can land a hair over the cap in floating point, so the comparison
    // keeps a tolerance of one billionth of a dollar.
    if (exceptionSpend + planned > extraCap + 1e-9) {
      return {
        refused: true,
        code: 3,
        spend: exceptionSpend,
        notice: exceptionSpend >= U2_EXTRA_TRY.reportAtUsd,
        run,
        reportAt: U2_EXTRA_TRY.reportAtUsd,
        message: `refused: the exception spend ${exceptionSpend.toFixed(4)} USD plus ${planned.toFixed(4)} over cap ${extraCap}`,
      };
    }
    for (const ctx of listed) {
      const entry = exceptionEntryFor(ctx.spec.id, kind);
      const once = countExceptionRows(pictureRows, ctx.spec.id, kind, U2_EXTRA_TRY.startTime);
      // The rule of D15. A row with `netRetry` true allows one more try past the once rule, so 2
      // exception tries in total for that id and kind. The second try is allowed only when the
      // first exception try of that pair cost 0 USD. A third try is refused.
      if (entry?.netRetry === true) {
        if (once >= 2) {
          return {
            refused: true,
            code: 3,
            spend: exceptionSpend,
            notice: exceptionSpend >= U2_EXTRA_TRY.reportAtUsd,
            run,
            reportAt: U2_EXTRA_TRY.reportAtUsd,
            message: `refused: ${ctx.spec.id} ${kind} already has ${once} tries since ${U2_EXTRA_TRY.startTime}; the network retry grants 2 tries`,
          };
        }
        if (once === 1) {
          const firstCost = firstExceptionTryCost(pictureRows, ctx.spec.id, kind, U2_EXTRA_TRY.startTime);
          if (firstCost === null || firstCost > 0) {
            return {
              refused: true,
              code: 3,
              spend: exceptionSpend,
              notice: exceptionSpend >= U2_EXTRA_TRY.reportAtUsd,
              run,
              reportAt: U2_EXTRA_TRY.reportAtUsd,
              message: `refused: ${ctx.spec.id} ${kind} already has 1 try since ${U2_EXTRA_TRY.startTime}; the network retry needs a first try at 0 USD`,
            };
          }
        }
        continue;
      }
      if (once >= 1) {
        return {
          refused: true,
          code: 3,
          spend: exceptionSpend,
          notice: exceptionSpend >= U2_EXTRA_TRY.reportAtUsd,
          run,
          reportAt: U2_EXTRA_TRY.reportAtUsd,
          message: `refused: ${ctx.spec.id} ${kind} already has ${once} try since ${U2_EXTRA_TRY.startTime}; the exception grants one extra try`,
        };
      }
    }
    notice = s.notice || exceptionSpend >= U2_EXTRA_TRY.reportAtUsd;
    reportAtOut = U2_EXTRA_TRY.reportAtUsd;
    spendOut = exceptionSpend;
  }
  // The cover art is color only, so its pool has no line picture after the color.
  const cushion = cmd === 'line' || cover ? 0 : 1;
  const projected = spend + (calls + cushion) * margin;
  if (projected > cap) {
    return { refused: true, code: 3, spend, notice: s.notice, run, reportAt: u2 ? U2_RUN.reportAtUsd : reportAt, message: `refused: projected spend ${projected.toFixed(4)} USD over cap ${cap}` };
  }
  for (const ctx of ctxs) {
    // A listed row with `pastLimit` true passes the normal try limit once. The once rule above
    // keeps the extra try to one.
    const entry = u2 ? exceptionEntryFor(ctx.spec.id, kind) : null;
    if (entry?.pastLimit) continue;
    const retry = card && kind === 'line' ? lineRetryGuard(pictureRows, ctx.spec.id, requested) : null;
    const g = retry ?? tryGuard(pictureRows, ctx.spec.id, kind, requested, startTime, maxTries);
    if (!g.ok) {
      return { refused: true, code: 3, spend, notice: s.notice, run, reportAt: u2 ? U2_RUN.reportAtUsd : reportAt, message: `refused: ${ctx.spec.id} ${kind} count ${g.count} (max ${g.max})` };
    }
  }
  return { refused: false, code: 0, spend: spendOut, notice, run, reportAt: reportAtOut, message: '' };
};

