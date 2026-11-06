#!/usr/bin/env node
// Storytime L2 unit 1 production judge batch builder (T4 step 1, 2026-11-05).
//
// It builds one judge batch for the pictures of the A-48 redraw list. The script makes no
// provider call: it copies local picture files and writes one JSON batch file.
//
//   node scripts/storytime-judge-batch.mjs --ids <id,id,...> --kind color|line --try <n> \
//        [--out <batch name>] [--cards]
//
// The ids are the row ids of the A-48 specs in docs/storytime/l2-unit1/a48/. The script reads
// the spec of each id for the page text, the use, and the mustShow phrases. With `--cards` the
// ids are card row ids, the spec folder is docs/storytime/l2-unit1/cards/, and the tries start at
// `CARD_RUN.startTime`. Without it the A-48 folder and the restart start time apply.
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
import { CARD_RUN } from './storytime-muse-guards.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const SPEC_DIR = join(ROOT, 'docs/storytime/l2-unit1/a48');
const BATCH_DIR = join(ROOT, 'docs/storytime/l2-unit1/judge/prod');
const JUDGE_DIR = join(ROOT, 'out/storytime-review/judge/prod');
const LONG_SIDE_STORY = 900;
const LONG_SIDE_CARD = 360;
const KINDS = ['color', 'line'];
/** The start of the restart run. A try before this time belongs to the old approved set. */
export const RESTART_START = '2026-11-04T07:54:00Z';

/** The printed long side of a use: 900 px for a story page, 360 px for every other card. */
export const longSideOf = (use) => (use === 'story-page' ? LONG_SIDE_STORY : LONG_SIDE_CARD);

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

/**
 * Builds the batch entries and writes the judge copies. One entry per id. The judge copy is the
 * source file at the printed size. The function makes no provider call.
 *
 * With `cards: true` the spec folder is `docs/storytime/l2-unit1/cards` and the tries start at
 * `CARD_RUN.startTime`. Without it the A-48 spec folder and `RESTART_START` apply.
 */
export async function buildBatch(options) {
  const { ids, kind, tryNo, cards = false, specDir, judgeDir = JUDGE_DIR, root = ROOT } = options;
  if (!KINDS.includes(kind)) throw new Error(`the kind must be ${KINDS.join(' or ')}; got ${kind}.`);
  if (!Number.isInteger(tryNo) || tryNo < 1) throw new Error(`the try number must be 1 or more; got ${tryNo}.`);
  if (!ids.length) throw new Error('the batch needs at least one id.');
  const resolvedSpecDir = specDir ?? (cards ? join(root, 'docs/storytime/l2-unit1/cards') : SPEC_DIR);
  const startTime = cards ? CARD_RUN.startTime : RESTART_START;
  const entries = [];
  for (const id of ids) {
    const spec = readSpec(resolvedSpecDir, id);
    const weekDir = resolve(root, spec.outDir);
    const costFile = join(weekDir, 'costs.tsv');
    if (!existsSync(costFile)) {
      throw new Error(`no costs.tsv of ${id}: ${costFile} is missing, so the try is unknown.`);
    }
    const tries = restartTries(parseCostRows(readFileSync(costFile, 'utf8')), id, kind, startTime);
    const name = trySourceName(tries, tryNo, kind, id);
    const source = join(weekDir, name);
    if (!existsSync(source)) throw new Error(`no source file for ${id} ${kind} try ${tryNo}: ${source} is missing.`);
    const judgeFile = `out/storytime-review/judge/prod/${judgeFileName(id, kind, tryNo)}`;
    const target = join(resolve(root), judgeFile);
    mkdirSync(dirname(target), { recursive: true });
    const side = longSideOf(spec.use);
    const resized = await sharp(source)
      .resize({ width: side, height: side, fit: 'inside', withoutEnlargement: false })
      .png({ compressionLevel: 9 })
      .toBuffer();
    writeFileSync(target, resized);
    entries.push({
      judgeFile,
      id,
      kind,
      pageText: spec.pageText,
      use: spec.use,
      mustShow: spec.mustShow,
    });
  }
  return entries;
}

/** Parses the command line. An unknown option is an error. */
export function parseArgs(argv) {
  const options = { ids: [], kind: undefined, tryNo: undefined, out: undefined, cards: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--ids') options.ids = (argv[++i] ?? '').split(',').map((id) => id.trim()).filter(Boolean);
    else if (arg === '--kind') options.kind = argv[++i];
    else if (arg === '--try') options.tryNo = Number(argv[++i]);
    else if (arg === '--out') options.out = argv[++i];
    else if (arg === '--cards') options.cards = true;
    else throw new Error(`unknown option: ${arg}`);
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
  mkdirSync(BATCH_DIR, { recursive: true });
  const batchFile = join(BATCH_DIR, `${options.out}.json`);
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
