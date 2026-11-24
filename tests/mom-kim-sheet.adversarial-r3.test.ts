import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  utimesSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'scripts/mom-kim-sheet.mjs');
const REDESIGN_OUT = 'out/chibi-sprouts/redesign';
const PARENT_OUT = 'out/chibi-sprouts';

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'mom-kim-sheet-r3-'));
  for (const directory of [
    'scripts',
    'docs/sprout-mockups',
    'out/storytime-review/muse-cast',
    'out/sprout-mom-kim/views',
    REDESIGN_OUT,
  ]) {
    mkdirSync(join(root, directory), { recursive: true });
  }
  copyFileSync(SCRIPT, join(root, 'scripts/mom-kim-sheet.mjs'));
  copyFileSync(join(ROOT, 'docs/sprout-mockups/mom.jpg'), join(root, 'docs/sprout-mockups/mom.jpg'));
  copyFileSync(
    join(ROOT, 'out/storytime-review/muse-cast/teacher-kim-sheet.png'),
    join(root, 'out/storytime-review/muse-cast/teacher-kim-sheet.png'),
  );
  for (const view of ['front-level', 'side-level']) {
    copyFileSync(
      join(ROOT, `out/sprout-mom-kim/views/${view}.png`),
      join(root, `out/sprout-mom-kim/views/${view}.png`),
    );
  }
  const measurePath = join(root, REDESIGN_OUT, 'measure.json');
  copyFileSync(join(ROOT, REDESIGN_OUT, 'measure.json'), measurePath);
  const newerThanRenders = Date.now() / 1000 + 1;
  utimesSync(measurePath, newerThanRenders, newerThanRenders);
  symlinkSync(join(ROOT, 'node_modules'), join(root, 'node_modules'), 'dir');
  return root;
}

function runScript(root: string) {
  return spawnSync(process.execPath, [join(root, 'scripts/mom-kim-sheet.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
}

describe('mom-kim sheet adversarial round 3', () => {
  it.skip.each(['mom-kim-review.png', 'mom-panel.png'])(
    'tech debt: F6 hard link at an output PNG path (same class as the Phase 2 PM decision; fix: refuse st_nlink > 1, temp file plus rename) — %s',
    (outputName) => {
      const root = fixtureRoot();
      try {
        const target = join(root, 'unrelated-file.dat');
        const output = join(root, REDESIGN_OUT, outputName);
        writeFileSync(target, 'preserve this unrelated file');
        linkSync(target, output);

        const result = runScript(root);
        const targetUnchanged = readFileSync(target).equals(Buffer.from('preserve this unrelated file'));
        expect.soft(result.status).toBe(1);
        expect.soft(targetUnchanged).toBe(true);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
  );

  it('refuses a linked output directory before writing into its target', () => {
    const root = fixtureRoot();
    try {
      const target = join(root, 'outside-output');
      mkdirSync(join(target, 'redesign'), { recursive: true });
      copyFileSync(join(root, REDESIGN_OUT, 'measure.json'), join(target, 'redesign/measure.json'));
      rmSync(join(root, PARENT_OUT), { recursive: true, force: true });
      symlinkSync(target, join(root, PARENT_OUT), 'dir');

      const result = runScript(root);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('output folder is a link');
      expect(existsSync(join(target, 'redesign/mom-kim-review.png'))).toBe(false);
      expect(existsSync(join(target, 'redesign/mom-panel.png'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.skip('tech debt: F7 stray alpha pixel lowers the visible figure (fix: largest connected component of the alpha mask)', async () => {
    const root = fixtureRoot();
    try {
      const litPath = join(root, 'out/sprout-mom-kim/views/front-level.png');
      const { data, info } = await sharp(litPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      data[0] = 255;
      data[1] = 0;
      data[2] = 255;
      data[3] = 128;
      const changed = `${litPath}.changed.png`;
      await sharp(data, {
        raw: { width: info.width, height: info.height, channels: 4 },
      })
        .png()
        .toFile(changed);
      const { renameSync } = await import('node:fs');
      renameSync(changed, litPath);

      const measurePath = join(root, REDESIGN_OUT, 'measure.json');
      const measure = JSON.parse(readFileSync(measurePath, 'utf8'));
      measure.rows.lit['front-level'] = [0, 977];
      writeFileSync(measurePath, `${JSON.stringify(measure, null, 2)}\n`);
      const newerThanRenders = Date.now() / 1000 + 1;
      utimesSync(measurePath, newerThanRenders, newerThanRenders);

      const result = runScript(root);
      expect.soft(result.status).toBe(0);
      const reviewPath = join(root, REDESIGN_OUT, 'mom-kim-review.png');
      const { data: review, info: reviewInfo } = await sharp(reviewPath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let top = 724;
      let bottom = -1;
      for (let y = 24; y < 724; y += 1) {
        for (let x = 531; x < 1037; x += 1) {
          const i = (y * reviewInfo.width + x) * 4;
          const r = review[i]!;
          const g = review[i + 1]!;
          const b = review[i + 2]!;
          const isMagentaOutlier = r > 240 && b > 240 && g < 200;
          if ((r < 250 || g < 250 || b < 250) && !isMagentaOutlier) {
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      }
      expect(bottom - top + 1).toBeGreaterThanOrEqual(698);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
