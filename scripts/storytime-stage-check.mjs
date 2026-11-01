#!/usr/bin/env node
// Week staging check for the Muse path (test-strategy.md, section 7, subsection 4.3).
//
//   node scripts/storytime-stage-check.mjs --week 2 --list <pictures.json> --specs <folder>
//     [--list-sha256 <hex>]
//
// The check reads the picture list and the page specs read only. It resolves every relative
// path against the working directory, so run it from the repository root. It makes no Muse
// call and writes no file.
//
// Exit codes: 0 all checks hold; 1 a check failed (a `problem:` line names the row);
// 2 the SHA-256 of the list differs from the pin.
//
// `--list-sha256` replaces the pin. It exists for the fixture tests. The live gate omits it.
//
// The element specs of a week sit in the sibling folder `muse-elements/` of the `--specs`
// folder. The check does not read them and does not count them as page specs.
import { createHash } from 'node:crypto';
import { lstat, open, readdir, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';

/** SHA-256 of picture list version 4 (Workbooks commit `87ecc6aa`). */
const PICTURE_LIST_PIN = '6d05dfc596c7f1891577a800a9375228136acc332c7c8b975c9df0bf6c062a58';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** The characters of the week 1 to 7 books and the group sheets that show each of them. */
const CHARACTERS = [
  { name: 'Pat', groupSheet: 'cast-group-a' },
  { name: 'May', groupSheet: 'cast-group-a' },
  { name: 'Sam', groupSheet: 'cast-group-a' },
  { name: 'Mia', groupSheet: 'cast-group-a' },
  { name: 'Ben', groupSheet: 'cast-group-b' },
  { name: 'Nan', groupSheet: 'cast-group-b' },
  { name: 'Pip', groupSheet: 'cast-group-b' },
  { name: 'Kim', groupSheet: 'cast-group-b' },
];

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function parseArguments(argv) {
  const options = {};
  const flags = { '--week': 'week', '--list': 'list', '--specs': 'specs', '--list-sha256': 'listSha256' };
  for (let index = 0; index < argv.length; index += 2) {
    const key = flags[argv[index]];
    const value = argv[index + 1];
    if (!key || value === undefined || value.startsWith('--')) {
      throw new Error(`Unknown or incomplete argument: ${argv[index]}`);
    }
    options[key] = value;
  }
  const week = Number(options.week);
  if (!Number.isInteger(week) || week < 1 || week > 8) throw new Error(`--week needs a number from 1 to 8; got ${options.week}.`);
  if (!options.list) throw new Error('--list <pictures.json> is required.');
  if (!options.specs) throw new Error('--specs <folder> is required.');
  if (options.listSha256 !== undefined && !/^[0-9a-f]{64}$/.test(options.listSha256)) {
    throw new Error('--list-sha256 needs 64 lower-case hexadecimal characters.');
  }
  return { week, list: options.list, specs: options.specs, pin: options.listSha256 ?? PICTURE_LIST_PIN };
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Checks one reference path. Returns a reason string, or undefined when the reference holds. */
async function referenceProblem(reference, root, realRoot) {
  if (typeof reference !== 'string' || reference.length === 0) return 'the reference is not a path string';
  if (path.isAbsolute(reference)) return 'the path is absolute';
  const segments = reference.split(/[\\/]/);
  if (segments.includes('..')) return 'the path holds a ".." segment';
  if (segments[0] !== 'out' && segments[0] !== 'docs') return 'the path is not under out/ or docs/';
  const absolute = path.resolve(root, reference);
  let info;
  try {
    info = await lstat(absolute);
  } catch {
    return 'the file is missing';
  }
  if (info.isSymbolicLink()) return 'the path is a symbolic link';
  if (!info.isFile()) return 'the path is not a regular file';
  if ((await realpath(absolute)) !== path.join(realRoot, ...segments)) return 'the path passes through a symbolic link';
  if (info.size <= 0) return 'the file is empty';
  const handle = await open(absolute, 'r');
  try {
    const head = Buffer.alloc(PNG_SIGNATURE.length);
    const { bytesRead } = await handle.read(head, 0, head.length, 0);
    if (bytesRead < head.length || !head.equals(PNG_SIGNATURE)) return 'the file does not start with the PNG signature';
  } finally {
    await handle.close();
  }
  return undefined;
}

function matchesCharacter(character, reference) {
  const base = path.basename(reference).toLowerCase();
  const tokens = base.replace(/\.[a-z0-9]+$/, '').split(/[^a-z0-9]+/);
  if (tokens.includes(character.name.toLowerCase())) return true;
  return new RegExp(`^${escapeRegExp(character.groupSheet)}(-\\d+)?\\.[a-z]+$`).test(base);
}

async function main() {
  const { week, list, specs, pin } = parseArguments(process.argv.slice(2));
  const root = process.cwd();
  const realRoot = await realpath(root);
  const weekId = `w${String(week).padStart(2, '0')}`;
  const expectedOutDir = `out/storytime/l2/unit1/${weekId}/muse`;
  const problems = [];

  const listBytes = await readFile(path.resolve(root, list));
  const listSha256 = sha256(listBytes);
  if (listSha256 !== pin) {
    console.log(`list sha256: ${listSha256}`);
    console.log(`expected list sha256: ${pin}`);
    console.log('stage check: fail (the picture list changed)');
    process.exit(2);
  }
  const allRows = JSON.parse(listBytes.toString('utf8'));
  const rows = allRows.filter((row) => row.week === week);
  const rowIds = new Set(rows.map((row) => row.id));

  for (const row of rows) {
    if (row.id.endsWith('-a') && rowIds.has(`${row.id.slice(0, -1)}b`)) {
      problems.push(`${row.id}: the id ends in -a and a -b row exists`);
    }
  }

  const specsDir = path.resolve(root, specs);
  const files = (await readdir(specsDir)).filter((name) => name.endsWith('.json')).sort();
  for (const file of files) {
    if (!rowIds.has(file.slice(0, -'.json'.length))) {
      problems.push(`${file}: the spec file name is not a row id of week ${week}`);
    }
  }

  let specsFound = 0;
  let textMismatches = 0;
  let goalMismatches = 0;
  let outDirMismatches = 0;
  let rowsWithoutReference = 0;
  let elementPaths = 0;
  let missingElementPaths = 0;
  let charactersWithoutReference = 0;

  for (const row of rows) {
    let spec;
    try {
      spec = JSON.parse(await readFile(path.join(specsDir, `${row.id}.json`), 'utf8'));
    } catch (error) {
      problems.push(`${row.id}: the spec is missing or unreadable (${error.code ?? error.message})`);
      continue;
    }
    specsFound += 1;
    if (spec.id !== row.id) problems.push(`${row.id}: the spec id is ${JSON.stringify(spec.id)}`);
    if (spec.week !== undefined && spec.week !== week) problems.push(`${row.id}: the spec week is ${spec.week}`);
    if (spec.text !== row.text) {
      textMismatches += 1;
      problems.push(`${row.id}: the spec text differs from the list text`);
    }
    if (spec.goal !== row.prompt) {
      goalMismatches += 1;
      problems.push(`${row.id}: the spec goal differs from the list prompt`);
    }
    if (spec.outDir !== expectedOutDir) {
      outDirMismatches += 1;
      problems.push(`${row.id}: the outDir is ${JSON.stringify(spec.outDir)}, not ${expectedOutDir}`);
    }
    for (const key of ['colorPrompt', 'linePrompt']) {
      if (typeof spec[key] !== 'string' || spec[key].trim().length === 0) {
        problems.push(`${row.id}: ${key} is empty`);
      }
    }
    const references = Array.isArray(spec.references) ? spec.references : [];
    if (!Array.isArray(spec.references)) problems.push(`${row.id}: references is not a list`);
    if ((row.sizeClass === 'A' || row.sizeClass === 'B') && references.length === 0) {
      rowsWithoutReference += 1;
      problems.push(`${row.id}: the class ${row.sizeClass} spec has no reference`);
    }
    for (const reference of references) {
      elementPaths += 1;
      const reason = await referenceProblem(reference, root, realRoot);
      if (reason) {
        missingElementPaths += 1;
        problems.push(`${row.id}: reference ${JSON.stringify(reference)}: ${reason}`);
      }
    }
    for (const character of CHARACTERS) {
      if (typeof spec.goal !== 'string' || !new RegExp(`\\b${character.name}\\b`).test(spec.goal)) continue;
      if (!references.some((reference) => typeof reference === 'string' && matchesCharacter(character, reference))) {
        charactersWithoutReference += 1;
        problems.push(`${row.id}: the goal names ${character.name} and no reference shows ${character.name}`);
      }
    }
  }

  const required = rows.filter((row) => row.sizeClass === 'A' || row.sizeClass === 'B').length;
  if (elementPaths === 0 || elementPaths < required) {
    problems.push(`element paths checked is ${elementPaths}; the ${required} class A and B rows need at least ${required}`);
  }

  let pageCandidates = 0;
  try {
    const outFiles = await readdir(path.resolve(root, expectedOutDir));
    for (const name of outFiles) {
      for (const row of rows) {
        if (new RegExp(`^${escapeRegExp(row.id)}-m\\d+`).test(name)) {
          pageCandidates += 1;
          problems.push(`${row.id}: the output folder holds the page candidate file ${name}`);
        }
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const pass = problems.length === 0;
  for (const problem of problems) console.log(`problem: ${problem}`);
  console.log(`list sha256: ${listSha256}`);
  console.log(`week: ${week}`);
  console.log(`rows: ${rows.length}`);
  console.log(`specs found: ${specsFound}`);
  console.log(`text mismatches: ${textMismatches}`);
  console.log(`goal mismatches: ${goalMismatches}`);
  console.log(`outDir mismatches: ${outDirMismatches}`);
  console.log(`rows with no reference (class A and B): ${rowsWithoutReference}`);
  console.log(`element paths checked: ${elementPaths}`);
  console.log(`missing element paths: ${missingElementPaths}`);
  console.log(`characters without a reference: ${charactersWithoutReference}`);
  console.log(`page candidates: ${pageCandidates}`);
  console.log(`stage check: ${pass ? 'pass' : 'fail'}`);
  process.exit(pass ? 0 : 1);
}

main().catch((error) => {
  console.error(`stage check: fail (${error.message})`);
  process.exit(1);
});
