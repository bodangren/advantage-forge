#!/usr/bin/env node
// Storytime cover judge copy builder (D9, 2026-11-10).
//
// It writes the two judge copies of one cover try of the Storytime Level 2 unit 1 Teacher Book
// front art. The script makes no provider call, reads no API key, and uses no network.
//
//   node scripts/storytime-cover-judge-copy.mjs --id <id> --try <n> [--src <folder>] [--out <folder>]
//
// The source picture of the try is `<id>-m<n>-color-print.png` in the source folder. The default
// source folder is `out/storytime/covers/teacher-front/muse` and the default output folder is
// `out/storytime-review/judge/cover/`. The script writes two files:
//
//   - `<id>-m<n>-clean.png`: the source resized to 1448 x 2048 px, with no other change;
//   - `<id>-m<n>-zones.png`: the same picture with 6 zone lines at 20, 29, 30, 78, 88, and 94
//     percent of the height.
//
// Each zone line has its own color, so the judge can tell the zones apart. The line of a percent
// sits at the row `Math.round(height * percent / 100)`. The script prints the two written paths.
// It exits with code 1 and one `error: ...` line when the source picture is missing.

import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

/** The repository root. The script resolves every folder against it, like the muse tool. */
const ROOT = resolve(new URL('..', import.meta.url).pathname);

/** The zone lines of the cover page, in percent of the height. */
export const COVER_ZONES = [20, 29, 30, 78, 88, 94];

/** The color of each zone line. */
export const ZONE_COLORS = {
  20: '#ff0000',
  29: '#ff8800',
  30: '#ffff00',
  78: '#00c000',
  88: '#0080ff',
  94: '#ff00ff',
};

/** The width of a judge copy. */
export const JUDGE_WIDTH = 1448;

/** The height of a judge copy. */
export const JUDGE_HEIGHT = 2048;

/** The default source folder of the cover print. */
export const DEFAULT_SOURCE_DIR = 'out/storytime/covers/teacher-front/muse';

/** The default output folder of the judge copies. */
export const DEFAULT_OUT_DIR = 'out/storytime-review/judge/cover';

/** The two file names of one try. */
export const coverJudgeNames = (id, n) => ({
  clean: `${id}-m${n}-clean.png`,
  zones: `${id}-m${n}-zones.png`,
});

/** The row of the zone line of a percent. */
export const zoneRow = (percent, height = JUDGE_HEIGHT) => Math.round((height * percent) / 100);

/** The source file of one try. */
export const coverSourceName = (id, n) => `${id}-m${n}-color-print.png`;

/** The SVG overlay that holds the 6 zone lines. */
const zoneOverlay = (width = JUDGE_WIDTH, height = JUDGE_HEIGHT) => {
  const lines = COVER_ZONES.map((percent) => {
    const row = zoneRow(percent, height);
    return `<rect x="0" y="${row - 1}" width="${width}" height="2" fill="${ZONE_COLORS[percent]}"/>`;
  }).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${lines}</svg>`);
};

/**
 * Writes the two judge copies of one try. It reads the source picture, resizes it to the judge
 * size, writes the clean copy, and writes the zones copy with the zone lines on it.
 */
export const makeCoverJudgeCopies = async (sourceFile, outDir, id, n) => {
  const names = coverJudgeNames(id, n);
  mkdirSync(outDir, { recursive: true });
  const cleanFile = join(outDir, names.clean);
  const zonesFile = join(outDir, names.zones);
  const base = await sharp(sourceFile).resize(JUDGE_WIDTH, JUDGE_HEIGHT, { fit: 'fill' }).png().toBuffer();
  await sharp(base).png().toFile(cleanFile);
  await sharp(base).composite([{ input: zoneOverlay(), top: 0, left: 0 }]).png().toFile(zonesFile);
  return { clean: cleanFile, zones: zonesFile };
};

/** The options of one call. */
export const parseArgs = (argv) => {
  const options = { id: '', try: '', src: DEFAULT_SOURCE_DIR, out: DEFAULT_OUT_DIR };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--id') {
      options.id = value ?? '';
      i += 1;
    } else if (key === '--try') {
      options.try = value ?? '';
      i += 1;
    } else if (key === '--src') {
      options.src = value ?? DEFAULT_SOURCE_DIR;
      i += 1;
    } else if (key === '--out') {
      options.out = value ?? DEFAULT_OUT_DIR;
      i += 1;
    }
  }
  return options;
};

/**
 * The command of one call. It returns 0 after the two copies, and 1 when the source picture is
 * missing. The function prints the two written paths.
 */
export const main = async (argv = process.argv.slice(2)) => {
  const options = parseArgs(argv);
  if (!options.id || !options.try) {
    console.error('error: the call needs --id and --try');
    return 1;
  }
  const sourceFile = join(ROOT, options.src, coverSourceName(options.id, options.try));
  if (!existsSync(sourceFile)) {
    console.error(`error: the source picture ${sourceFile} is missing`);
    return 1;
  }
  const outDir = resolve(ROOT, options.out);
  const written = await makeCoverJudgeCopies(sourceFile, outDir, options.id, options.try);
  console.log(written.clean);
  console.log(written.zones);
  return 0;
};

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  main().then(
    (code) => {
      process.exit(code);
    },
    (error) => {
      console.error(`error: ${error.message}`);
      process.exit(1);
    },
  );
}
