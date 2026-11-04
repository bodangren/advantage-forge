#!/usr/bin/env node
// Storytime L2 unit 1 production judge batch builder (T4 step 1, 2026-11-05).
//
// It builds one judge batch for the pictures of the A-48 redraw list. The script makes no
// provider call: it copies local picture files and writes one JSON batch file.
//
//   node scripts/storytime-judge-batch.mjs --ids <id,id,...> --kind color|line --try <n> \
//        [--from <n>] [--out <batch name>]
//
// The ids are the row ids of the A-48 specs in docs/storytime/l2-unit1/a48/. The script reads
// the spec of each id for the page text, the use, and the mustShow phrases.
//
// The source file of a try sits in the week folder of the spec (spec.outDir):
//   kind color, try n: <id>-m<n>-color.png        (each color call makes a new version)
//   kind line,  try n: <id>-m<from>-line.png      (try 1)
//                     <id>-m<from>-line-<n>.png    (try 2 and 3)
// --from is the Muse version that the line art came from. It defaults to 1 for the line kind.
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

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const SPEC_DIR = join(ROOT, 'docs/storytime/l2-unit1/a48');
const BATCH_DIR = join(ROOT, 'docs/storytime/l2-unit1/judge/prod');
const JUDGE_DIR = join(ROOT, 'out/storytime-review/judge/prod');
const LONG_SIDE_STORY = 900;
const LONG_SIDE_CARD = 360;
const KINDS = ['color', 'line'];

/** The printed long side of a use: 900 px for a story page, 360 px for every other card. */
export const longSideOf = (use) => (use === 'story-page' ? LONG_SIDE_STORY : LONG_SIDE_CARD);

/** The name of the source file of one try of one picture. */
export const sourceFileName = (id, kind, tryNo, from = 1) => {
  if (kind === 'color') return `${id}-m${tryNo}-color.png`;
  return tryNo === 1 ? `${id}-m${from}-line.png` : `${id}-m${from}-line-${tryNo}.png`;
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
 */
export async function buildBatch(options) {
  const {
    ids,
    kind,
    tryNo,
    from = 1,
    specDir = SPEC_DIR,
    judgeDir = JUDGE_DIR,
    root = ROOT,
  } = options;
  if (!KINDS.includes(kind)) throw new Error(`the kind must be ${KINDS.join(' or ')}; got ${kind}.`);
  if (!Number.isInteger(tryNo) || tryNo < 1) throw new Error(`the try number must be 1 or more; got ${tryNo}.`);
  if (!ids.length) throw new Error('the batch needs at least one id.');
  const entries = [];
  for (const id of ids) {
    const spec = readSpec(specDir, id);
    const source = join(resolve(root, spec.outDir), sourceFileName(id, kind, tryNo, from));
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
  const options = { ids: [], kind: undefined, tryNo: undefined, from: undefined, out: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--ids') options.ids = (argv[++i] ?? '').split(',').map((id) => id.trim()).filter(Boolean);
    else if (arg === '--kind') options.kind = argv[++i];
    else if (arg === '--try') options.tryNo = Number(argv[++i]);
    else if (arg === '--from') options.from = Number(argv[++i]);
    else if (arg === '--out') options.out = argv[++i];
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
