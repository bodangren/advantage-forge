// Probe P1-D2: a column scan of the zones copy. It finds the colored rows of the zones copy at
// the middle column, with the real channel count of the raw buffer. The first version of this
// scan assumed 3 channels and reported the lines at the wrong rows; the zones copy holds an
// alpha channel, so the stride is width * channels. This version is the corrected record.
//
// Usage: node measure/runs/asset_storytime_l2_retries_cover_20261110/probe-p1-scan-debug.mjs

import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ZONE_COLORS, makeCoverJudgeCopies, zoneRow } from '../../../scripts/storytime-cover-judge-copy.mjs';

const dir = mkdtempSync(path.join('/tmp/opencode/l2rc', 'judge-scan-'));
try {
  const source = path.join(dir, 'probe-cover-m1-color-print.png');
  await sharp({ create: { width: 2480, height: 3508, channels: 3, background: '#808080' } }).png().toFile(source);
  const written = await makeCoverJudgeCopies(source, dir, 'probe-cover', '1');
  const { data, info } = await sharp(written.zones).raw().toBuffer({ resolveWithObject: true });
  console.log(`channels: ${info.channels}`);
  const x = Math.floor(info.width / 2) * info.channels;
  const found = [];
  for (let y = 0; y < info.height; y++) {
    const i = y * info.width * info.channels + x;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r !== 128 || g !== 128 || b !== 128) found.push(`row ${y}: rgb(${r},${g},${b})`);
  }
  console.log(found.join('\n'));
  const expected = Object.entries(ZONE_COLORS).map(([p, hex]) => `zone ${p}: row ${zoneRow(Number(p))} ${hex}`);
  console.log(`expected:\n${expected.join('\n')}`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
