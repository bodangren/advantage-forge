#!/usr/bin/env node
// Storytime L2 unit 1 production judge batch builder (T4 step 1, 2026-11-05).
//
// It builds one judge batch for the pictures of the A-48 redraw list. The script makes no
// provider call: it copies local picture files and writes one JSON batch file.
//
//   node scripts/storytime-judge-batch.mjs --ids <id,id,...> --kind color|line --try <n> \
//        [--out <batch name>] [--cards | --family-words | --unit2]
//
// The ids are the row ids of the A-48 specs in docs/storytime/l2-unit1/a48/. The script reads
// the spec of each id for the page text, the use, and the mustShow phrases. With `--cards` the
// ids are card row ids, the spec folder is docs/storytime/l2-unit1/cards/, and the tries start at
// `CARD_RUN.startTime`. With `--family-words` the ids are family-word row ids, the spec folder is
// docs/storytime/l2-unit1/family-words/, and the tries start at `CARD_RUN.startTime`. The two
// flags cannot run together. Without either one the A-48 folder and the restart start time
// apply.
//
// With `--unit2` (2026-11-08) the ids are unit 2 row ids or element ids. The spec folder of a row
// id is docs/storytime/l2-unit2/w<nn>/muse; the spec folder of an element id is
// docs/storytime/l2-unit2/w<nn>/muse-elements, found by a scan of the 8 week folders. The tries
// start at `U2_RUN.startTime`, and the script reads the unit 2 cost files only. The batch files go
// to docs/storytime/l2-unit2/judge/prod/ and the judge copies to
// out/storytime-review/judge/prod-u2/. `--unit2` cannot run with `--cards` or `--family-words`.
// The mustShow phrases of a unit 2 row are the cast names of rows.json plus the object counts of
// the picture list, or the row word for class C.
//
// The source file of a try is the Muse version that the restart call made. The script reads the
// top-level costs.tsv of the week folder of the spec (spec.outDir). A try is a row of that id
// with kind `color` or `line` and a time at or after the restart start time
// `2026-11-04T07:54:00Z`. The rows in time order are the tries: try n is the n-th row. The
// version column of that row gives the Muse version (m<n>), so the color file of the try is
// `<id>-m<n>-color.png`. A line row holds the line file name in its output column.
//
// The redraw ids hold the old approved files m1 to m3 in their week folders, so a try number is
// never a file number. The costs.tsv has a version column, and the script uses it.
//
// The judge sees each file at the size that the page prints (judge prompt v6, rule 1):
//   900 px long side for a story page;
//   360 px long side for a check row, a practice line, a card, and a D4 prompt.
// The copies go to out/storytime-review/judge/prod/ and the batch file goes to
// docs/storytime/l2-unit1/judge/prod/. The batch entry shape is the shape of the calibration
// batches: judgeFile, id, kind, pageText, use, and mustShow.
//
// The script never writes over an existing batch file. Use a new --out name for a new batch.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';
import { CARD_RUN, U2_RUN, U2_WEEKS } from './storytime-muse-guards.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const SPEC_DIR = join(ROOT, 'docs/storytime/l2-unit1/a48');
const CARD_SPEC_DIR = 'docs/storytime/l2-unit1/cards';
const FAMILY_WORDS_SPEC_DIR = 'docs/storytime/l2-unit1/family-words';
const BATCH_DIR = join(ROOT, 'docs/storytime/l2-unit1/judge/prod');
/** The unit 2 spec root below the repository root. It holds the 8 week folders. */
const UNIT2_SPEC_ROOT = 'docs/storytime/l2-unit2';
/** The unit 2 rows file: the cast names of every row. */
const UNIT2_ROWS_FILE = 'docs/storytime/l2-unit2/rows.json';
/** The unit 2 batch folder and judge copy folder. */
const UNIT2_BATCH_DIR = 'docs/storytime/l2-unit2/judge/prod';
export const UNIT2_JUDGE_DIR = 'out/storytime-review/judge/prod-u2';
/**
 * The unit 2 picture list. The Workbooks repository owns it; this script only reads it for the
 * object counts. The spec pins its SHA-256
 * 63d415000eca9d6be1a6ad533c12ff81e127cd2c76ffac339697f91b99f754ec.
 */
const UNIT2_LIST_FILE = '/home/daniebo/Desktop/Workbooks/content/storytime/drafts/l2/print/pictures-u2.json';
const LONG_SIDE_STORY = 900;
const LONG_SIDE_CARD = 360;
const KINDS = ['color', 'line'];
/** The start of the restart run. A try before this time belongs to the old approved set. */
export const RESTART_START = '2026-11-04T07:54:00Z';

/** The printed long side of a use: 900 px for a story page, 360 px for every other card. */
export const longSideOf = (use) => (use === 'story-page' ? LONG_SIDE_STORY : LONG_SIDE_CARD);

/** The printed long side of a unit 2 picture: 900 px for class A and B, 360 px for class C. */
export const unit2LongSide = (sizeClass) => (sizeClass === 'C' ? LONG_SIDE_CARD : LONG_SIDE_STORY);

/** The batch folder of a mode. The unit 2 batch files go to the unit 2 folder. */
export const batchDirOf = (options) => (options?.unit2 ? join(ROOT, UNIT2_BATCH_DIR) : BATCH_DIR);

/** A time as a number of milliseconds. A time without a zone is UTC. */
export const utcMs = (time) => Date.parse(/(Z|[+-]\d\d:?\d\d)$/.test(time) ? time : `${time}Z`);

/**
 * Reads one costs.tsv into rows. The columns are found by header name, so a header change does
 * not break the parse. A row holds the time, the row id, the Muse version, the kind, and the
 * output file name.
 */
export function parseCostRows(text) {
  const lines = text.split('\n');
  if (lines.length < 2) return [];
  const head = lines[0].split('\t').map((h) => h.trim());
  const at = (name) => head.indexOf(name);
  const timeCol = at('time');
  const rowCol = at('row');
  const versionCol = at('version');
  const kindCol = at('kind');
  const outputCol = at('output');
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const c = lines[i].split('\t');
    if (c.length < 2 || !c[0].trim()) continue;
    rows.push({
      time: timeCol >= 0 ? c[timeCol].trim() : '',
      row: rowCol >= 0 ? c[rowCol].trim() : '',
      version: versionCol >= 0 ? c[versionCol].trim() : '',
      kind: kindCol >= 0 ? c[kindCol].trim() : '',
      output: outputCol >= 0 ? c[outputCol].trim() : '',
    });
  }
  return rows;
}

/** The restart tries of one id and kind, in time order. */
export const restartTries = (rows, id, kind, startTime = RESTART_START) =>
  rows
    .filter((row) => row.row === id && row.kind === kind && utcMs(row.time) >= utcMs(startTime))
    .sort((a, b) => utcMs(a.time) - utcMs(b.time));

/**
 * The source file name of one try. A color row gives the Muse version, so the file is
 * `<id>-m<version>-color.png`. A line row gives the file name in its output column.
 */
export const trySourceName = (tries, tryNo, kind, id) => {
  const row = tries[tryNo - 1];
  if (!row) {
    const count = tries.length;
    throw new Error(
      `no ${kind} try ${tryNo} of ${id}: the restart rows hold ${count} ${kind} ${count === 1 ? 'try' : 'tries'}.`,
    );
  }
  if (kind === 'line') {
    if (!row.output || row.output === 'none') {
      throw new Error(`the ${kind} try ${tryNo} of ${id} has no picture file (the call failed).`);
    }
    return row.output;
  }
  const version = row.version.replace(/^m/, '');
  if (!version) {
    throw new Error(`the ${kind} try ${tryNo} of ${id} has no Muse version in the costs.tsv.`);
  }
  if (row.output === 'none') {
    throw new Error(`the ${kind} try ${tryNo} of ${id} has no picture file (the call failed).`);
  }
  return `${id}-m${version}-color.png`;
};

/** The judge file name of one try of one picture. */
export const judgeFileName = (id, kind, tryNo) => `${id}-${kind}-t${tryNo}.png`;

/** Reads one A-48 spec and checks the fields that the batch needs. */
export function readSpec(specDir, id) {
  const file = join(specDir, `${id}.json`);
  if (!existsSync(file)) throw new Error(`no A-48 spec for ${id}: ${file} is missing.`);
  const spec = JSON.parse(readFileSync(file, 'utf8'));
  if (spec.id !== id) throw new Error(`the spec ${file} holds the id ${spec.id}, not ${id}.`);
  for (const field of ['pageText', 'use', 'mustShow', 'outDir']) {
    if (spec[field] === undefined) throw new Error(`the spec ${file} has no ${field}.`);
  }
  if (!Array.isArray(spec.mustShow) || spec.mustShow.length === 0) {
    throw new Error(`the spec ${file} has no mustShow phrases.`);
  }
  return spec;
}

/** The unit 2 week folder of a row id: the `w<nn>` part of `l2-w<nn>-...`. Null for an element id. */
export const unit2WeekOf = (id) => {
  const hit = /^l2-w(\d\d)-/.exec(id);
  return hit ? `w${hit[1]}` : null;
};

/**
 * The unit 2 spec file of one id below a root. A row id lives in `<root>/w<nn>/muse`. An element
 * id has no week in its name, so the function finds its `muse-elements` folder in the 8 weeks.
 */
export function unit2SpecFile(root, id) {
  const week = unit2WeekOf(id);
  if (week) return join(root, UNIT2_SPEC_ROOT, week, 'muse', `${id}.json`);
  for (const candidate of U2_WEEKS) {
    const file = join(root, UNIT2_SPEC_ROOT, candidate, 'muse-elements', `${id}.json`);
    if (existsSync(file)) return file;
  }
  return join(root, UNIT2_SPEC_ROOT, U2_WEEKS[0], 'muse-elements', `${id}.json`);
}

/** Reads one unit 2 spec. It needs the id, the text, and the outDir; an element has no `use`. */
export function readUnit2Spec(file, id) {
  if (!existsSync(file)) throw new Error(`no unit 2 spec for ${id}: ${file} is missing.`);
  const spec = JSON.parse(readFileSync(file, 'utf8'));
  if (spec.id !== id) throw new Error(`the spec ${file} holds the id ${spec.id}, not ${id}.`);
  for (const field of ['text', 'outDir']) {
    if (spec[field] === undefined) throw new Error(`the spec ${file} has no ${field}.`);
  }
  return spec;
}

/** Reads the unit 2 rows file into an id map. */
export function readUnit2Rows(root, rowsFile = join(root, UNIT2_ROWS_FILE)) {
  if (!existsSync(rowsFile)) throw new Error(`no unit 2 rows file: ${rowsFile} is missing.`);
  const doc = JSON.parse(readFileSync(rowsFile, 'utf8'));
  const rows = Array.isArray(doc) ? doc : doc.rows;
  if (!Array.isArray(rows)) throw new Error(`the unit 2 rows file ${rowsFile} holds no rows.`);
  return new Map(rows.map((row) => [row.id, row]));
}

/** Reads the unit 2 picture list into an id map. The Workbooks repository owns the file. */
export function readUnit2List(root, listFile = UNIT2_LIST_FILE) {
  if (!existsSync(listFile)) throw new Error(`no unit 2 picture list: ${listFile} is missing.`);
  const doc = JSON.parse(readFileSync(listFile, 'utf8'));
  const rows = Array.isArray(doc) ? doc : doc.rows;
  if (!Array.isArray(rows)) throw new Error(`the unit 2 picture list ${listFile} holds no rows.`);
  return new Map(rows.map((row) => [row.id, row]));
}

/**
 * The mustShow phrases of one unit 2 row: the cast names of `rows.json` plus `<count> <object>`
 * for each object count of the picture list. A class C row gives its word. A row with no cast
 * name and no object count gives its page text.
 */
export function unit2MustShow(row, listRow) {
  const cast = Array.isArray(row?.cast) ? row.cast.filter((name) => typeof name === 'string' && name) : [];
  if (listRow?.sizeClass === 'C') {
    const word = listRow.text || row?.text;
    if (!word) throw new Error(`no class C word for ${row?.id ?? listRow?.id}.`);
    return [word];
  }
  const counts = Object.entries(listRow?.objectCounts ?? {}).map(([word, count]) => `${count} ${word}`);
  const mustShow = [...cast, ...counts];
  if (mustShow.length) return mustShow;
  const fallback = listRow?.text || row?.text;
  if (!fallback) throw new Error(`no mustShow phrases for ${row?.id ?? listRow?.id}.`);
  return [fallback];
}

/**
 * Builds the batch entries and writes the judge copies. One entry per id. The judge copy is the
 * source file at the printed size. The function makes no provider call.
 *
 * With `cards: true` the spec folder is `docs/storytime/l2-unit1/cards` and the tries start at
 * `CARD_RUN.startTime`. With `familyWords: true` the spec folder is
 * `docs/storytime/l2-unit1/family-words` and the tries start at `CARD_RUN.startTime`. Without
 * either one the A-48 spec folder and `RESTART_START` apply.
 *
 * With `unit2: true` the spec folder of a row id is `docs/storytime/l2-unit2/w<nn>/muse` and the
 * spec folder of an element id is `<root>/w<nn>/muse-elements`. The tries start at
 * `U2_RUN.startTime`, the judge copies go to `UNIT2_JUDGE_DIR`, and the unit 2 rows file and
 * picture list give the mustShow phrases. `rowsFile` and `listFile` are test paths.
 *
 * A judge copy always goes below `root`, at its `judgeFile` path. The older `judgeDir` option
 * stays in the type file only, so a caller can pass its options object without a change.
 */
export async function buildBatch(options) {
  const {
    ids,
    kind,
    tryNo,
    cards = false,
    familyWords = false,
    unit2 = false,
    specDir,
    root = ROOT,
    rowsFile,
    listFile,
  } = options;
  if (!KINDS.includes(kind)) throw new Error(`the kind must be ${KINDS.join(' or ')}; got ${kind}.`);
  if (!Number.isInteger(tryNo) || tryNo < 1) throw new Error(`the try number must be 1 or more; got ${tryNo}.`);
  if (!ids.length) throw new Error('the batch needs at least one id.');
  if (unit2 && (cards || familyWords)) {
    throw new Error('the option --unit2 cannot run with --cards or --family-words; use --unit2 alone.');
  }
  const resolvedSpecDir = specDir ?? (familyWords
    ? join(root, FAMILY_WORDS_SPEC_DIR)
    : cards ? join(root, CARD_SPEC_DIR) : SPEC_DIR);
  const startTime = unit2 ? U2_RUN.startTime : cards || familyWords ? CARD_RUN.startTime : RESTART_START;
  const judgeRelDir = unit2 ? UNIT2_JUDGE_DIR : 'out/storytime-review/judge/prod';
  const rows = unit2 ? readUnit2Rows(root, rowsFile) : null;
  const list = unit2 ? readUnit2List(root, listFile) : null;
  const entries = [];
  for (const id of ids) {
    let spec;
    let mustShow;
    let side;
    if (unit2) {
      spec = readUnit2Spec(unit2SpecFile(root, id), id);
      const row = rows.get(id);
      const listRow = list.get(id);
      mustShow = row || listRow ? unit2MustShow(row, listRow) : [id];
      side = unit2LongSide(spec.sizeClass ?? listRow?.sizeClass);
    } else {
      spec = readSpec(resolvedSpecDir, id);
      mustShow = spec.mustShow;
      side = longSideOf(spec.use);
    }
    const weekDir = resolve(root, spec.outDir);
    const costFile = join(weekDir, 'costs.tsv');
    if (!existsSync(costFile)) {
      throw new Error(`no costs.tsv of ${id}: ${costFile} is missing, so the try is unknown.`);
    }
    const tries = restartTries(parseCostRows(readFileSync(costFile, 'utf8')), id, kind, startTime);
    const name = trySourceName(tries, tryNo, kind, id);
    const source = join(weekDir, name);
    if (!existsSync(source)) throw new Error(`no source file for ${id} ${kind} try ${tryNo}: ${source} is missing.`);
    const judgeFile = `${judgeRelDir}/${judgeFileName(id, kind, tryNo)}`;
    const target = join(resolve(root), judgeFile);
    mkdirSync(dirname(target), { recursive: true });
    const resized = await sharp(source)
      .resize({ width: side, height: side, fit: 'inside', withoutEnlargement: false })
      .png({ compressionLevel: 9 })
      .toBuffer();
    writeFileSync(target, resized);
    entries.push({
      judgeFile,
      id,
      kind,
      pageText: spec.pageText ?? spec.text,
      use: spec.use ?? 'element',
      mustShow,
    });
  }
  return entries;
}

/** Parses the command line. An unknown option is an error. */
export function parseArgs(argv) {
  const options = {
    ids: [],
    kind: undefined,
    tryNo: undefined,
    out: undefined,
    cards: undefined,
    familyWords: undefined,
    unit2: undefined,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--ids') options.ids = (argv[++i] ?? '').split(',').map((id) => id.trim()).filter(Boolean);
    else if (arg === '--kind') options.kind = argv[++i];
    else if (arg === '--try') options.tryNo = Number(argv[++i]);
    else if (arg === '--out') options.out = argv[++i];
    else if (arg === '--cards') options.cards = true;
    else if (arg === '--family-words') options.familyWords = true;
    else if (arg === '--unit2') options.unit2 = true;
    else throw new Error(`unknown option: ${arg}`);
  }
  if (options.cards && options.familyWords) {
    throw new Error('the options --cards and --family-words cannot run together; use one of them.');
  }
  if (options.unit2 && (options.cards || options.familyWords)) {
    throw new Error('the option --unit2 cannot run with --cards or --family-words; use --unit2 alone.');
  }
  if (!options.ids.length) throw new Error('the command needs --ids <id,id,...>.');
  if (!options.kind) throw new Error('the command needs --kind color or --kind line.');
  if (!options.tryNo) throw new Error('the command needs --try <n>.');
  if (options.out === undefined) options.out = `batch-${options.kind}-t${options.tryNo}`;
  if (!/^[a-z0-9-]+$/.test(options.out)) throw new Error(`the batch name must hold small letters, digits, and dashes; got ${options.out}.`);
  return options;
}

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const entries = await buildBatch(options);
  const batchDir = batchDirOf(options);
  mkdirSync(batchDir, { recursive: true });
  const batchFile = join(batchDir, `${options.out}.json`);
  if (existsSync(batchFile)) {
    console.log(`refused: the batch file ${batchFile} already exists; use a new --out name.`);
    process.exit(1);
  }
  writeFileSync(batchFile, JSON.stringify(entries, null, 2) + '\n');
  console.log(`batch ${batchFile}: ${entries.length} files`);
  for (const entry of entries) console.log(`  ${entry.kind} ${entry.id} ${entry.judgeFile}`);
};

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main().catch((error) => {
    console.error(`error: ${error.message}`);
    process.exit(1);
  });
}
