import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PANEL = join(ROOT, 'out/chibi-sprouts/redesign/mom-panel.png');
const REVIEW = join(ROOT, 'out/chibi-sprouts/redesign/mom-kim-review.png');
const SCRIPT = join(ROOT, 'scripts/mom-kim-sheet.mjs');
const TSX = join(ROOT, 'node_modules/.bin/tsx');
const LIT = [
  join(ROOT, 'out/sprout-mom-kim/views/front-level.png'),
  join(ROOT, 'out/sprout-mom-kim/views/side-level.png'),
];

function tempRoot(): string {
  const temp = mkdtempSync(join(tmpdir(), 'mom-kim-sheet-adversarial-'));
  for (const dir of [
    'scripts',
    'docs/sprout-mockups',
    'out/storytime-review/muse-cast',
    'out/sprout-mom-kim/views',
    'out/chibi-sprouts/redesign',
  ]) {
    mkdirSync(join(temp, dir), { recursive: true });
  }
  copyFileSync(SCRIPT, join(temp, 'scripts/mom-kim-sheet.mjs'));
  copyFileSync(join(ROOT, 'docs/sprout-mockups/mom.jpg'), join(temp, 'docs/sprout-mockups/mom.jpg'));
  copyFileSync(
    join(ROOT, 'out/storytime-review/muse-cast/teacher-kim-sheet.png'),
    join(temp, 'out/storytime-review/muse-cast/teacher-kim-sheet.png'),
  );
  for (const path of LIT) {
    copyFileSync(path, join(temp, path.slice(ROOT.length + 1)));
  }
  copyFileSync(
    join(ROOT, 'out/chibi-sprouts/redesign/measure.json'),
    join(temp, 'out/chibi-sprouts/redesign/measure.json'),
  );
  symlinkSync(join(ROOT, 'node_modules'), join(temp, 'node_modules'), 'dir');
  return temp;
}

async function litCell(path: string, left: number, width: number): Promise<Buffer> {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let maxX = 0;
  let minY = info.height;
  let maxY = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * 4 + 3]! >= 128) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const widthPx = Math.round((cropWidth * 700) / cropHeight);
  const input = await sharp(path)
    .extract({ left: minX, top: minY, width: cropWidth, height: cropHeight })
    .resize({ width: widthPx, height: 700, fit: 'fill' })
    .png()
    .toBuffer();
  const x = left + Math.floor((width - widthPx) / 2);
  return sharp({
    create: { width, height: 700, channels: 4, background: { r: 254, g: 254, b: 254, alpha: 1 } },
  })
    .composite([{ input, left: x - left, top: 0 }])
    .png()
    .toBuffer();
}

describe('mom-kim judge panel privacy invariant', () => {
  it('contains only the two lit render cells and no Kim panel pixels', async () => {
    const result = spawnSync(TSX, [SCRIPT], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 300_000,
      env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
    });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(existsSync(PANEL)).toBe(true);

    const width = 1448;
    const cellWidth = 712;
    const separator = Buffer.from(
      await sharp({ create: { width: 24, height: 700, channels: 4, background: '#ffffff' } })
        .png()
        .toBuffer(),
    );
    const cells = await Promise.all([litCell(LIT[0]!, 0, cellWidth), litCell(LIT[1]!, 736, cellWidth)]);
    const expected = await sharp({
      create: { width, height: 748, channels: 4, background: '#ffffff' },
    })
      .composite([
        { input: cells[0]!, left: 0, top: 24 },
        { input: separator, left: 712, top: 24 },
        { input: cells[1]!, left: 736, top: 24 },
      ])
      .png()
      .toBuffer();
    const actualRaw = await sharp(PANEL).ensureAlpha().raw().toBuffer();
    const expectedRaw = await sharp(expected).ensureAlpha().raw().toBuffer();
    const actualHash = createHash('sha256').update(actualRaw).digest('hex');
    const expectedHash = createHash('sha256').update(expectedRaw).digest('hex');
    expect(actualHash).toBe(expectedHash);
  });

  it('renders the named pass result in the caption strip', async () => {
    const result = spawnSync(TSX, [SCRIPT], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 300_000,
      env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
    });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);

    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1568" height="96">' +
        '<text x="24" y="32" font-family="DejaVu Sans, sans-serif" font-size="22" fill="#1c1c1c">sprout-mom-kim  |  2026-11-23</text>' +
        '<text x="24" y="66" font-family="DejaVu Sans, sans-serif" font-size="20" fill="#1c1c1c">11/11 proportion rows pass; both palms face the legs</text>' +
        '<text x="720" y="32" font-family="DejaVu Sans, sans-serif" font-size="20" fill="#1c1c1c">Green: opencode-go/hy4-flash-free</text>' +
        '<text x="720" y="66" font-family="DejaVu Sans, sans-serif" font-size="18" fill="#1c1c1c">Kim sheet stays local; judge panel holds Mom only</text>' +
        '</svg>',
    );
    const expected = await sharp({
      create: {
        width: 1568,
        height: 96,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: svg, left: 0, top: 0 }])
      .png()
      .toBuffer();
    const actual = await sharp(REVIEW)
      .extract({ left: 0, top: 1472, width: 1568, height: 96 })
      .png()
      .toBuffer();
    const actualRaw = await sharp(actual).ensureAlpha().raw().toBuffer();
    const expectedRaw = await sharp(expected).ensureAlpha().raw().toBuffer();
    expect(createHash('sha256').update(actualRaw).digest('hex')).toBe(
      createHash('sha256').update(expectedRaw).digest('hex'),
    );
  });

  it('rejects Kim rows shifted five pixels and writes no sheet', async () => {
    const temp = tempRoot();
    try {
      const kim = join(temp, 'out/storytime-review/muse-cast/teacher-kim-sheet.png');
      const info = await sharp(kim).metadata();
      await sharp(kim)
        .extend({ top: 5, bottom: 0, left: 0, right: 0, background: '#ffffff' })
        .extract({ left: 0, top: 0, width: info.width!, height: info.height! })
        .png()
        .toFile(`${kim}.shifted.png`);
      const { renameSync } = await import('node:fs');
      renameSync(`${kim}.shifted.png`, kim);

      const result = spawnSync(process.execPath, [join(temp, 'scripts/mom-kim-sheet.mjs')], {
        cwd: temp,
        encoding: 'utf8',
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Kim side rows');
      expect(result.stderr).toContain('not within 4 px');
      expect(existsSync(join(temp, 'out/chibi-sprouts/redesign/mom-kim-review.png'))).toBe(false);
      expect(existsSync(join(temp, 'out/chibi-sprouts/redesign/mom-panel.png'))).toBe(false);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  it('rejects a fully transparent Kim sheet and writes no PNG', async () => {
    const temp = tempRoot();
    try {
      const kim = join(temp, 'out/storytime-review/muse-cast/teacher-kim-sheet.png');
      const { data, info } = await sharp(kim).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      for (let i = 3; i < data.length; i += 4) data[i] = 0;
      await sharp(data, { raw: info }).png().toFile(kim);

      const result = spawnSync(process.execPath, [join(temp, 'scripts/mom-kim-sheet.mjs')], {
        cwd: temp,
        encoding: 'utf8',
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('Kim');
      expect(existsSync(join(temp, 'out/chibi-sprouts/redesign/mom-kim-review.png'))).toBe(false);
      expect(existsSync(join(temp, 'out/chibi-sprouts/redesign/mom-panel.png'))).toBe(false);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  it('rejects a missing rows.lit record before writing either PNG', async () => {
    const temp = tempRoot();
    try {
      const measure = join(temp, 'out/chibi-sprouts/redesign/measure.json');
      const record = JSON.parse(readFileSync(measure, 'utf8'));
      delete record.rows.lit;
      writeFileSync(measure, `${JSON.stringify(record)}\n`);

      const result = spawnSync(process.execPath, [join(temp, 'scripts/mom-kim-sheet.mjs')], {
        cwd: temp,
        encoding: 'utf8',
      });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('measure.json');
      expect(existsSync(join(temp, 'out/chibi-sprouts/redesign/mom-kim-review.png'))).toBe(false);
      expect(existsSync(join(temp, 'out/chibi-sprouts/redesign/mom-panel.png'))).toBe(false);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
});
