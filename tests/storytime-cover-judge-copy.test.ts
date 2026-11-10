// Tests for the Storytime cover judge copy helper (D9, 2026-11-10).
//
// The helper writes the two judge copies of one cover try: a clean copy at 1448 x 2048 px and a
// copy with the zone lines at 20, 29, 30, 78, 88, and 94 percent of the height. The tests cover:
//   - the file names of the two copies and the rows of the 6 zone lines;
//   - the two written files: both hold 1448 x 2048 px;
//   - the clean copy: it holds the resized source and no zone line;
//   - the zones copy: the row of each zone line holds the color of that zone;
//   - the command: it returns 1 and prints an error line when the source picture is missing.
//
// The tests generate their fixtures in a temp folder. No test writes a PNG into the repository
// and no test makes a provider call.

import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  COVER_ZONES,
  JUDGE_HEIGHT,
  JUDGE_WIDTH,
  ZONE_COLORS,
  coverJudgeNames,
  main,
  makeCoverJudgeCopies,
  zoneRow,
} from '../scripts/storytime-cover-judge-copy.mjs';

const ID = 'l2-u1-cover-quest-teacher-front';
const SOURCE_WIDTH = 2480;
const SOURCE_HEIGHT = 3508;

let root: string;
let sourceFile: string;
let outDir: string;

/** The pixel color of one row of a PNG, as an RGB triple. */
async function rowColor(file: string, row: number): Promise<number[]> {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const offset = row * info.width * info.channels;
  const pixel = (index: number) => data[index] ?? 0;
  return [pixel(offset), pixel(offset + 1), pixel(offset + 2)];
}

/** The RGB triple of a hex color. */
const rgbOf = (hex: string) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

/** The color of one zone line. The script holds a color for every zone. */
const zoneColor = (percent: number): string => {
  const hex = ZONE_COLORS[percent];
  if (!hex) throw new Error(`the zone ${percent} has no color`);
  return hex;
};

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'cover-judge-copy-'));
  sourceFile = path.join(root, `${ID}-m1-color-print.png`);
  outDir = path.join(root, 'judge/cover');
  await sharp({ create: { width: SOURCE_WIDTH, height: SOURCE_HEIGHT, channels: 3, background: '#7ab3d6' } })
    .png()
    .toFile(sourceFile);
});

afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
});

describe('the cover judge copy helper (JC1 to JC5)', () => {
  it('JC1 names the two copies and places the 6 zone lines', () => {
    expect(coverJudgeNames(ID, 1)).toEqual({ clean: `${ID}-m1-clean.png`, zones: `${ID}-m1-zones.png` });
    expect(COVER_ZONES).toEqual([20, 29, 30, 78, 88, 94]);
    expect(zoneRow(20)).toBe(410);
    expect(zoneRow(29)).toBe(594);
    expect(zoneRow(30)).toBe(614);
    expect(zoneRow(78)).toBe(1597);
    expect(zoneRow(88)).toBe(1802);
    expect(zoneRow(94)).toBe(1925);
  });

  it('JC2 writes the two copies at 1448 x 2048 px', async () => {
    const written = await makeCoverJudgeCopies(sourceFile, outDir, ID, 1);
    expect(existsSync(written.clean)).toBe(true);
    expect(existsSync(written.zones)).toBe(true);
    for (const file of [written.clean, written.zones]) {
      const meta = await sharp(file).metadata();
      expect(meta.width).toBe(JUDGE_WIDTH);
      expect(meta.height).toBe(JUDGE_HEIGHT);
    }
  });

  it('JC3 keeps the clean copy free of zone lines', async () => {
    const written = await makeCoverJudgeCopies(sourceFile, outDir, ID, 1);
    const color = await rowColor(written.clean, zoneRow(30));
    expect(color).toEqual(rgbOf('#7ab3d6'));
    const resized = await sharp(sourceFile).resize(JUDGE_WIDTH, JUDGE_HEIGHT, { fit: 'fill' }).raw().toBuffer();
    const { data } = await sharp(written.clean).raw().toBuffer({ resolveWithObject: true });
    expect(data.equals(resized)).toBe(true);
  });

  it('JC4 draws the zone line of each zone in its own color', async () => {
    const written = await makeCoverJudgeCopies(sourceFile, outDir, ID, 1);
    for (const percent of COVER_ZONES) {
      const color = await rowColor(written.zones, zoneRow(percent));
      expect.soft(color, `zone ${percent}`).toEqual(rgbOf(zoneColor(percent)));
    }
    // The row above the first zone line still holds the picture.
    const plain = await rowColor(written.zones, zoneRow(20) - 3);
    expect(plain).toEqual(rgbOf('#7ab3d6'));
  });

  it('JC5 returns 1 and prints an error line when the source picture is missing', async () => {
    const errors: string[] = [];
    const log = console.error;
    console.error = (line: string) => errors.push(line);
    try {
      const code = await main(['--id', ID, '--try', '9', '--src', 'out/storytime/covers/teacher-front/muse']);
      expect(code).toBe(1);
      expect(errors.join('\n')).toContain('error: ');
    } finally {
      console.error = log;
    }
  });
});
