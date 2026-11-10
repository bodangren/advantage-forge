// Probe P1-D: the cover judge-copy helper (D9), run on a synthetic source picture.
// Usage: node measure/runs/asset_storytime_l2_retries_cover_20261110/probe-p1-judge-copy.mjs
// It writes its scratch under /tmp/opencode/l2rc/ only. No provider call.

import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
  COVER_ZONES,
  JUDGE_HEIGHT,
  JUDGE_WIDTH,
  ZONE_COLORS,
  coverJudgeNames,
  makeCoverJudgeCopies,
  zoneRow,
} from '../../../scripts/storytime-cover-judge-copy.mjs';

const SCRATCH = '/tmp/opencode/l2rc';
const ID = 'probe-cover';
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ` :: ${String(detail).slice(0, 300)}`}`);
};

const dir = mkdtempSync(path.join(SCRATCH, 'judge-copy-'));
try {
  // A flat gray source at the print size, so a zone line is easy to see.
  const source = path.join(dir, `${ID}-m1-color-print.png`);
  await sharp({ create: { width: 2480, height: 3508, channels: 3, background: '#808080' } }).png().toFile(source);
  const outDir = path.join(dir, 'out');
  const written = await makeCoverJudgeCopies(source, outDir, ID, '1');

  const names = coverJudgeNames(ID, '1');
  check('D9 the two file names', names.clean === `${ID}-m1-clean.png` && names.zones === `${ID}-m1-zones.png`, JSON.stringify(names));

  const cleanMeta = await sharp(written.clean).metadata();
  const zonesMeta = await sharp(written.zones).metadata();
  check('D9 clean copy is 1448 x 2048', cleanMeta.width === JUDGE_WIDTH && cleanMeta.height === JUDGE_HEIGHT, `${cleanMeta.width}x${cleanMeta.height}`);
  check('D9 zones copy is 1448 x 2048', zonesMeta.width === JUDGE_WIDTH && zonesMeta.height === JUDGE_HEIGHT, `${zonesMeta.width}x${zonesMeta.height}`);

  // The zone rows of the plan: 410, 594, 614, 1597, 1802, 1925.
  const expectedRows = [410, 594, 614, 1597, 1802, 1925];
  const rowsOk = COVER_ZONES.every((p, i) => zoneRow(p) === expectedRows[i]);
  check('D9 the 6 zone rows at 20, 29, 30, 78, 88, 94 percent', rowsOk, JSON.stringify(COVER_ZONES.map(zoneRow)));

  // Each zone row holds its own color at the middle column; the clean copy stays gray there.
  // The zones copy can hold an alpha channel, so the stride uses the real channel count.
  const zonesRaw = await sharp(written.zones).raw().toBuffer({ resolveWithObject: true });
  const cleanRaw = await sharp(written.clean).raw().toBuffer({ resolveWithObject: true });
  const stride = (raw) => raw.info.width * raw.info.channels;
  const x = Math.floor(JUDGE_WIDTH / 2) * zonesRaw.info.channels;
  let pixelOk = true;
  const bad = [];
  for (const percent of COVER_ZONES) {
    const row = zoneRow(percent);
    const want = ZONE_COLORS[percent];
    const wr = parseInt(want.slice(1, 3), 16);
    const wg = parseInt(want.slice(3, 5), 16);
    const wb = parseInt(want.slice(5, 7), 16);
    const zi = row * stride(zonesRaw) + x;
    const ci = row * stride(cleanRaw) + Math.floor(JUDGE_WIDTH / 2) * cleanRaw.info.channels;
    const z = [zonesRaw.data[zi], zonesRaw.data[zi + 1], zonesRaw.data[zi + 2]];
    const c = [cleanRaw.data[ci], cleanRaw.data[ci + 1], cleanRaw.data[ci + 2]];
    if (z[0] !== wr || z[1] !== wg || z[2] !== wb) {
      pixelOk = false;
      bad.push(`zone ${percent} at row ${row}: got rgb(${z}), channels ${zonesRaw.info.channels}`);
    }
    if (c[0] !== 0x80 || c[1] !== 0x80 || c[2] !== 0x80) {
      pixelOk = false;
      bad.push(`clean at row ${row}: got rgb(${c}), channels ${cleanRaw.info.channels}`);
    }
  }
  check('D9 each zone row holds its color and the clean copy stays clean', pixelOk, bad.join('; '));
} finally {
  rmSync(dir, { recursive: true, force: true });
}

const failed = results.filter((x) => !x.ok);
console.log(`probe-p1-judge-copy: ${results.length - failed.length}/${results.length} checks hold`);
process.exit(failed.length ? 1 : 0);
