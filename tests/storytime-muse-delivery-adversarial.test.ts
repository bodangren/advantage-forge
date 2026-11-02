import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PICTURE_SIZES,
  runStorytimeCli,
  type PictureListRow,
  type StorytimeManifest,
} from '../src/storytime/book-pictures.js';
import { writeMuseDelivery, type MuseApprovalList } from '../src/storytime/muse-delivery.js';
import { runStorytimeBookPicturesEntry } from '../scripts/storytime-book-pictures.js';

// Adversarial tests for the Muse delivery writer (Phase 3, HEAD 87ca5dab).
//
// Each row attacks a failure mode that would put a wrong picture in print, write a byte outside
// the delivery folder, or leave a delivery folder changed after a refusal:
//
//   ADV1  an approval entry that points at another row's print of the same size class
//   ADV2  an approval entry that points at another row's print of the other format
//   ADV3  a line print with one pixel that is not 0 and not 255 (254, 128, 1)
//   ADV4  a color print with an alpha channel, and a JPEG under a .png name
//   ADV5  one changed byte in manifest.json
//   ADV6  a different file, or a folder, under a delivered name
//   ADV7  a week 3 entry in a `deliver --week 2` run over a populated folder
//   ADV8  the same row id twice in the approval list
//   ADV9  the same row id twice in the picture list
//   ADV10 `fileVersion` on a line name that has no `-v<n>.png` suffix
//   ADV11 `fileVersion` 1e21 (the schema safe-integer bound) and 2 (the control)
//   ADV12 a symlink at a delivered name whose bytes already match
//
// The tests use temporary roots only. They read and write local files. They make no network
// call and no Muse call.

const NUT = 'l2-w01-story-page-a-nut';
const HEN = 'l2-w01-cover-b-hen';
const CAT = 'l2-w01-check-row-cat';
const MOP = 'l2-w01-story-page-a-mop';

const ROWS: PictureListRow[] = [
  {
    id: NUT,
    week: 1,
    use: 'story-page',
    sizeClass: 'A',
    fileName: `${NUT}-v1.png`,
    lineArtFileName: `${NUT}-line-v1.png`,
    width: 4000,
    height: 3000,
    text: 'A nut.',
    prompt: 'One nut on the classroom table.',
  },
  {
    id: HEN,
    week: 1,
    use: 'cover',
    sizeClass: 'B',
    fileName: `${HEN}-v1.png`,
    lineArtFileName: `${HEN}-line-v1.png`,
    width: 4000,
    height: 3000,
    text: '',
    prompt: 'One hen on the reader cover.',
  },
  {
    id: CAT,
    week: 1,
    use: 'check-row',
    sizeClass: 'C',
    fileName: `${CAT}-v1.png`,
    lineArtFileName: `${CAT}-line-v1.png`,
    width: 1500,
    height: 1500,
    text: 'cat',
    prompt: 'One cat.',
  },
  {
    // A row with no approval entry. It is not clean and it gets no job.
    id: MOP,
    week: 1,
    use: 'story-page',
    sizeClass: 'A',
    fileName: `${MOP}-v1.png`,
    lineArtFileName: `${MOP}-line-v1.png`,
    width: 4000,
    height: 3000,
    text: 'A mop.',
    prompt: 'One mop in the corner.',
  },
];

function rowFor(id: string): PictureListRow {
  const row = ROWS.find((item) => item.id === id);
  if (!row) throw new Error(`The test has no row ${id}.`);
  return row;
}

function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

function sizeOf(row: PictureListRow): { width: number; height: number } {
  return row.sizeClass === 'C' ? PICTURE_SIZES.small : PICTURE_SIZES.story;
}

function museNames(rowId: string, version = 1): { colorPrint: string; linePrint: string } {
  return {
    colorPrint: `${rowId}-m${version}-color-print.png`,
    linePrint: `${rowId}-m${version}-line-print.png`,
  };
}

// ---------------------------------------------------------------------------
// Fixtures. Each PNG is pure or framed, so one buffer of each shape serves every test.
// ---------------------------------------------------------------------------

const pngCache = new Map<string, Buffer>();

/** A pure color print: three channels, 8-bit, srgb, no alpha. */
async function colorPng(width: number, height: number, background: string): Promise<Buffer> {
  const key = `color:${width}x${height}:${background}`;
  const cached = pngCache.get(key);
  if (cached) return cached;
  const png = await sharp({ create: { width, height, channels: 3, background } }).png().toBuffer();
  pngCache.set(key, png);
  return png;
}

/** A pure black and white line print: a 60 px black frame on white. No gray value. */
async function linePng(width: number, height: number): Promise<Buffer> {
  return linePngWithPixels(width, height, []);
}

/**
 * The same line print, with the named pixels set to a value. A value of 0 or 255 keeps the file
 * pure. A value between 1 and 254 puts one gray pixel in the white area.
 */
async function linePngWithPixels(
  width: number,
  height: number,
  pixels: Array<{ x: number; y: number; value: number }>,
): Promise<Buffer> {
  const key = `line:${width}x${height}:${pixels.map((item) => `${item.x},${item.y},${item.value}`).join(';')}`;
  const cached = pngCache.get(key);
  if (cached) return cached;
  const data = Buffer.alloc(width * height, 255);
  const inset = 120;
  const frame = 60;
  const right = width - inset;
  const bottom = height - inset;
  for (let y = 0; y < frame; y += 1) {
    data.fill(0, (inset + y) * width + inset, (inset + y) * width + right);
    data.fill(0, (bottom - 1 - y) * width + inset, (bottom - 1 - y) * width + right);
  }
  for (let y = inset; y < bottom; y += 1) {
    data.fill(0, y * width + inset, y * width + inset + frame);
    data.fill(0, y * width + right - frame, y * width + right);
  }
  for (const pixel of pixels) data[pixel.y * width + pixel.x] = pixel.value;
  const png = await sharp(data, { raw: { width, height, channels: 1 } })
    .toColourspace('b-w')
    .png()
    .toBuffer();
  pngCache.set(key, png);
  return png;
}

/** A color print with an alpha channel: four channels, so the writer must refuse it. */
async function alphaColorPng(width: number, height: number): Promise<Buffer> {
  const key = `alpha:${width}x${height}`;
  const cached = pngCache.get(key);
  if (cached) return cached;
  const png = await sharp({
    create: { width, height, channels: 4, background: { r: 136, g: 204, b: 255, alpha: 0.5 } },
  })
    .png()
    .toBuffer();
  pngCache.set(key, png);
  return png;
}

/** JPEG bytes. A Muse tool that writes a JPEG under a .png name must be refused. */
async function jpegBytes(width: number, height: number): Promise<Buffer> {
  const key = `jpeg:${width}x${height}`;
  const cached = pngCache.get(key);
  if (cached) return cached;
  const jpeg = await sharp({ create: { width, height, channels: 3, background: '#88ccff' } })
    .jpeg()
    .toBuffer();
  pngCache.set(key, jpeg);
  return jpeg;
}

let root: string;
let museRoot: string;
let deliveryRoot: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'muse-adversarial-'));
  museRoot = path.join(root, 'muse');
  deliveryRoot = path.join(root, 'delivery');
  await mkdir(museRoot, { recursive: true });
});

afterEach(async () => {
  if (root) await rm(root, { recursive: true, force: true });
});

/** Writes one row's approved prints into the Muse folder and returns their names. */
async function putPrints(row: PictureListRow, background: string, version = 1) {
  const names = museNames(row.id, version);
  const size = sizeOf(row);
  await writeFile(path.join(museRoot, names.colorPrint), await colorPng(size.width, size.height, background));
  await writeFile(path.join(museRoot, names.linePrint), await linePng(size.width, size.height));
  return names;
}

function entry(rowId: string, names: { colorPrint: string; linePrint: string }, version = 1) {
  return { rowId, version, colorPrint: names.colorPrint, linePrint: names.linePrint };
}

async function walk(directory: string): Promise<string[]> {
  if (!existsSync(directory)) return [];
  const files: string[] = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, item.name);
    if (item.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

/** Every file name under the folder and the SHA-256 of its bytes. */
async function snapshot(directory: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const file of await walk(directory)) {
    out[path.relative(directory, file)] = sha256(await readFile(file));
  }
  return out;
}

async function rejection(run: () => Promise<unknown>): Promise<Error> {
  try {
    await run();
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
  throw new Error('The writer resolved, but this test expects a rejection.');
}

function deliver(
  approvals: MuseApprovalList,
  options: { rows?: PictureListRow[]; target?: string } = {},
): Promise<StorytimeManifest> {
  return writeMuseDelivery({
    rows: options.rows ?? ROWS,
    approvals,
    museRoot,
    deliveryRoot: options.target ?? deliveryRoot,
  });
}

function list(entries: unknown[]): MuseApprovalList {
  return { version: 1, entries } as unknown as MuseApprovalList;
}

function jobFor(manifest: StorytimeManifest, id: string) {
  const job = manifest.jobs.find((item) => item.id === id);
  if (!job) throw new Error(`The manifest holds no job for ${id}.`);
  return job;
}

describe('Muse delivery adversarial probes', () => {
  it('ADV1 copies the print that the entry names, and never mixes two rows of one size class', async () => {
    // NUT and MOP are both class A, so both prints are 4000 x 3000. The NUT entry points at the
    // MOP print. The approval list is the authority on which print is approved for a row, so the
    // writer copies that file. The probe proves the writer never swaps the two rows' bytes.
    const nutNames = await putPrints(rowFor(NUT), '#88ccff');
    const mopNames = await putPrints(rowFor(MOP), '#ffd27f');
    const henNames = await putPrints(rowFor(HEN), '#9fe0a0', 2);
    const mopColor = sha256(await readFile(path.join(museRoot, mopNames.colorPrint)));
    const nutColor = sha256(await readFile(path.join(museRoot, nutNames.colorPrint)));
    const henColor = sha256(await readFile(path.join(museRoot, henNames.colorPrint)));

    const manifest = await deliver(list([
      entry(NUT, mopNames),
      entry(HEN, henNames, 2),
    ]));

    const nutCandidate = jobFor(manifest, NUT).candidates[0]!;
    const henCandidate = jobFor(manifest, HEN).candidates[0]!;
    const nutDelivered = sha256(await readFile(path.join(deliveryRoot, nutCandidate.file)));
    const henDelivered = sha256(await readFile(path.join(deliveryRoot, henCandidate.file)));

    expect.soft({ 'The NUT candidate hash is the MOP print hash': nutCandidate.fileSha256 })
      .toEqual({ 'The NUT candidate hash is the MOP print hash': mopColor });
    expect.soft({ 'The NUT delivered bytes are the MOP print bytes': nutDelivered })
      .toEqual({ 'The NUT delivered bytes are the MOP print bytes': mopColor });
    expect.soft({ 'The NUT delivered bytes are not the NUT print bytes': nutDelivered === nutColor })
      .toEqual({ 'The NUT delivered bytes are not the NUT print bytes': false });
    expect.soft({ 'The HEN delivered bytes are the HEN print bytes': henDelivered })
      .toEqual({ 'The HEN delivered bytes are the HEN print bytes': henColor });
    expect.soft({ 'The two rows deliver different bytes': nutDelivered === henDelivered })
      .toEqual({ 'The two rows deliver different bytes': false });
    expect.soft({ 'The MOP row gets no job': manifest.jobs.some((job) => job.id === MOP) })
      .toEqual({ 'The MOP row gets no job': false });
    expect.soft({ 'The delivered NUT file carries the list name': path.basename(nutCandidate.file) })
      .toEqual({ 'The delivered NUT file carries the list name': rowFor(NUT).fileName });
  });

  it('ADV2 refuses another row\'s print when its format is the other one', async () => {
    const nutNames = await putPrints(rowFor(NUT), '#88ccff');
    const henNames = await putPrints(rowFor(HEN), '#ffd27f', 2);

    // The color field points at a one-channel line print.
    const lineAsColor = path.join(root, 'delivery-line-as-color');
    const colorError = await rejection(() =>
      deliver(
        list([{ ...entry(NUT, nutNames), colorPrint: henNames.linePrint }]),
        { rows: [rowFor(NUT)], target: lineAsColor },
      ),
    );
    expect.soft({ 'The line print in the color field names the row': colorError.message.includes(NUT) })
      .toEqual({ 'The line print in the color field names the row': true });
    expect.soft({ 'The line print in the color field is refused for its channels': /channel|3 channels|PNG/i.test(colorError.message) })
      .toEqual({ 'The line print in the color field is refused for its channels': true });
    expect.soft({ 'The color-format refusal writes no file': await walk(lineAsColor) })
      .toEqual({ 'The color-format refusal writes no file': [] });

    // The line field points at a three-channel color print.
    const colorAsLine = path.join(root, 'delivery-color-as-line');
    const lineError = await rejection(() =>
      deliver(
        list([{ ...entry(NUT, nutNames), linePrint: henNames.colorPrint }]),
        { rows: [rowFor(NUT)], target: colorAsLine },
      ),
    );
    expect.soft({ 'The color print in the line field names the row': lineError.message.includes(NUT) })
      .toEqual({ 'The color print in the line field names the row': true });
    expect.soft({ 'The color print in the line field is refused for its channels': /one opaque|grey|gray|channel/i.test(lineError.message) })
      .toEqual({ 'The color print in the line field is refused for its channels': true });
    expect.soft({ 'The line-format refusal writes no file': await walk(colorAsLine) })
      .toEqual({ 'The line-format refusal writes no file': [] });
  });

  it('ADV3 refuses a line print with one pixel at 254, 128, or 1, and accepts 0 and 255', async () => {
    const row = rowFor(CAT);
    const size = sizeOf(row);
    const names = museNames(CAT);
    const middle = { x: Math.floor(size.width / 2), y: Math.floor(size.height / 2) };
    await writeFile(path.join(museRoot, names.colorPrint), await colorPng(size.width, size.height, '#88ccff'));

    for (const value of [254, 128, 1]) {
      const lineName = `${CAT}-m1-line-print-${value}.png`;
      await writeFile(
        path.join(museRoot, lineName),
        await linePngWithPixels(size.width, size.height, [{ ...middle, value }]),
      );
      const target = path.join(root, `delivery-gray-${value}`);
      const error = await rejection(() =>
        deliver(list([{ ...entry(CAT, names), linePrint: lineName }]), { rows: [row], target }),
      );
      const label = `The pixel at ${value}`;
      expect.soft({ [`${label} is refused with the row id`]: error.message.includes(CAT) })
        .toEqual({ [`${label} is refused with the row id`]: true });
      expect.soft({ [`${label} is counted as one gray pixel`]: /1 grey pixel/i.test(error.message) })
        .toEqual({ [`${label} is counted as one gray pixel`]: true });
      expect.soft({ [`${label} writes no file`]: await walk(target) })
        .toEqual({ [`${label} writes no file`]: [] });
      expect.soft({ [`${label} creates no delivery folder`]: existsSync(target) })
        .toEqual({ [`${label} creates no delivery folder`]: false });
    }

    // The control: the same frame with a black pixel in the white area and a white pixel in the
    // frame keeps the file pure, so the run must resolve. A check that refused every line print
    // would pass the three cases above and fail here.
    const controlName = `${CAT}-m1-line-print-control.png`;
    await writeFile(
      path.join(museRoot, controlName),
      await linePngWithPixels(size.width, size.height, [
        { ...middle, value: 0 },
        { x: 130, y: 130, value: 255 },
      ]),
    );
    const controlTarget = path.join(root, 'delivery-pure-control');
    const control = await deliver(list([{ ...entry(CAT, names), linePrint: controlName }]), {
      rows: [row],
      target: controlTarget,
    });
    expect.soft({ 'The pure control delivers one job': control.jobs.length })
      .toEqual({ 'The pure control delivers one job': 1 });
    expect.soft({ 'The pure control line art is valid': control.jobs[0]?.candidates[0]?.lineArt?.structural.valid })
      .toEqual({ 'The pure control line art is valid': true });
    expect.soft({ 'The pure control writes the manifest': existsSync(path.join(controlTarget, 'manifest.json')) })
      .toEqual({ 'The pure control writes the manifest': true });
  });

  it('ADV4 refuses a color print with alpha, and a JPEG under a .png name', async () => {
    const row = rowFor(CAT);
    const size = sizeOf(row);
    const names = museNames(CAT);
    await writeFile(path.join(museRoot, names.linePrint), await linePng(size.width, size.height));

    const cases: Array<{ label: string; png: Buffer; match: RegExp }> = [
      { label: 'an alpha color print', png: await alphaColorPng(size.width, size.height), match: /alpha|4 channels|channel/i },
      { label: 'a JPEG under a .png name', png: await jpegBytes(size.width, size.height), match: /PNG|format/i },
    ];
    for (const [index, item] of cases.entries()) {
      await writeFile(path.join(museRoot, names.colorPrint), item.png);
      const target = path.join(root, `delivery-color-format-${index}`);
      const error = await rejection(() => deliver(list([entry(CAT, names)]), { rows: [row], target }));
      expect.soft({ [`${item.label} is refused with the row id`]: error.message.includes(CAT) })
        .toEqual({ [`${item.label} is refused with the row id`]: true });
      expect.soft({ [`${item.label} names the print file`]: error.message.includes(names.colorPrint) })
        .toEqual({ [`${item.label} names the print file`]: true });
      expect.soft({ [`${item.label} is refused for its format`]: item.match.test(error.message) })
        .toEqual({ [`${item.label} is refused for its format`]: true });
      expect.soft({ [`${item.label} writes no file`]: await walk(target) })
        .toEqual({ [`${item.label} writes no file`]: [] });
    }
  });

  it('ADV5 stops on one changed byte in manifest.json and leaves the folder byte-identical', async () => {
    const nutNames = await putPrints(rowFor(NUT), '#88ccff');
    const henNames = await putPrints(rowFor(HEN), '#ffd27f', 2);
    const approvals = list([entry(NUT, nutNames), entry(HEN, henNames, 2)]);
    await deliver(approvals);
    expect(await walk(deliveryRoot)).toHaveLength(5);

    // Change one character of one job id. Every other byte stays the same.
    const manifestFile = path.join(deliveryRoot, 'manifest.json');
    const original = await readFile(manifestFile, 'utf8');
    const edited = original.replace(NUT, `${NUT}x`);
    expect(edited).not.toBe(original);
    await writeFile(manifestFile, edited);
    const before = await snapshot(deliveryRoot);

    const error = await rejection(() => deliver(approvals));
    expect.soft({ 'The changed manifest is refused': /manifest|differ|overwrite|exist/i.test(error.message) })
      .toEqual({ 'The changed manifest is refused': true });
    expect.soft({ 'The refused run keeps every byte': await snapshot(deliveryRoot) })
      .toEqual({ 'The refused run keeps every byte': before });
    expect.soft({ 'The refused run keeps the edited manifest text': await readFile(manifestFile, 'utf8') })
      .toEqual({ 'The refused run keeps the edited manifest text': edited });
  });

  it('ADV6 stops on a different file or a folder under a delivered name and keeps every byte', async () => {
    const nutNames = await putPrints(rowFor(NUT), '#88ccff');
    const henNames = await putPrints(rowFor(HEN), '#ffd27f', 2);
    const approvals = list([entry(NUT, nutNames), entry(HEN, henNames, 2)]);
    await deliver(approvals);

    // One extra byte under a delivered name. The PNG still decodes, so only the hash differs.
    const delivered = path.join(deliveryRoot, rowFor(NUT).fileName);
    const originalBytes = await readFile(delivered);
    await writeFile(delivered, Buffer.concat([originalBytes, Buffer.from([0])]));
    const before = await snapshot(deliveryRoot);
    const error = await rejection(() => deliver(approvals));
    expect.soft({ 'The different file bytes are refused': /different bytes|overwrite|exist|differ/i.test(error.message) })
      .toEqual({ 'The different file bytes are refused': true });
    expect.soft({ 'The refused run keeps every byte': await snapshot(deliveryRoot) })
      .toEqual({ 'The refused run keeps every byte': before });

    // A folder at a delivered name in a fresh target.
    const folderTarget = path.join(root, 'delivery-folder-target');
    await mkdir(path.join(folderTarget, rowFor(NUT).fileName), { recursive: true });
    const folderError = await rejection(() => deliver(approvals, { target: folderTarget }));
    expect.soft({ 'The folder at a delivered name is refused': /symlink|regular file|refus/i.test(folderError.message) })
      .toEqual({ 'The folder at a delivered name is refused': true });
    expect.soft({ 'The folder refusal writes no manifest': existsSync(path.join(folderTarget, 'manifest.json')) })
      .toEqual({ 'The folder refusal writes no manifest': false });
  });

  it('ADV7 refuses a week 3 entry in a `deliver --week 2` run and keeps the week 2 delivery identical', async () => {
    const repo = path.join(root, 'cli-week');
    const museFolder = path.join(repo, 'out/muse');
    await mkdir(museFolder, { recursive: true });

    const weekRow = (week: number, suffix: string): PictureListRow => {
      const id = `l2-w0${week}-check-row-${suffix}`;
      return {
        id,
        week,
        use: 'check-row',
        sizeClass: 'C',
        fileName: `${id}-v1.png`,
        lineArtFileName: `${id}-line-v1.png`,
        width: PICTURE_SIZES.small.width,
        height: PICTURE_SIZES.small.height,
        text: `Text ${suffix}.`,
        prompt: `Prompt ${suffix}.`,
      };
    };
    const week2 = [weekRow(2, 'aa'), weekRow(2, 'ab')];
    const week3 = weekRow(3, 'aa');
    const rows = [...week2, week3];
    for (const [index, row] of rows.entries()) {
      const names = museNames(row.id);
      await writeFile(
        path.join(museFolder, names.colorPrint),
        await colorPng(PICTURE_SIZES.small.width, PICTURE_SIZES.small.height, ['#88ccff', '#ffd27f', '#9fe0a0'][index]!),
      );
      await writeFile(
        path.join(museFolder, names.linePrint),
        await linePng(PICTURE_SIZES.small.width, PICTURE_SIZES.small.height),
      );
    }
    const listFile = path.join(repo, 'pictures.json');
    await writeFile(listFile, JSON.stringify(rows, null, 2));
    const week2Only = path.join(repo, 'approved-week2.json');
    await writeFile(week2Only, JSON.stringify(list(week2.map((row) => entry(row.id, museNames(row.id)))), null, 2));
    const withWeek3 = path.join(repo, 'approved-with-week3.json');
    await writeFile(
      withWeek3,
      JSON.stringify(list([...week2, week3].map((row) => entry(row.id, museNames(row.id)))), null, 2),
    );

    const run = async (approvals: string) => {
      const errors: string[] = [];
      const code = await runStorytimeBookPicturesEntry(
        ['deliver', '--week', '2', '--list', listFile, '--approvals', approvals,
          '--muse', 'out/muse', '--delivery', 'out/delivery'],
        {
          pipeline: (argv) => runStorytimeCli(argv, { repoRoot: repo, workbooksRoot: repo, log: () => {} }),
          errorLog: (message: string) => errors.push(message),
        },
      );
      return { code, errors };
    };

    const first = await run(week2Only);
    const deliveryFolder = path.join(repo, 'out/delivery');
    expect.soft({ 'The week 2 run exits 0': first.code })
      .toEqual({ 'The week 2 run exits 0': 0 });
    expect.soft({ 'The week 2 delivery holds five files': (await walk(deliveryFolder)).length })
      .toEqual({ 'The week 2 delivery holds five files': 5 });
    const before = await snapshot(deliveryFolder);

    const second = await run(withWeek3);
    expect.soft({ 'The week 3 entry exits 1': second.code })
      .toEqual({ 'The week 3 entry exits 1': 1 });
    expect.soft({ 'The week 3 refusal names the week 3 row': /week 3|l2-w03-/.test(second.errors.join('\n')) })
      .toEqual({ 'The week 3 refusal names the week 3 row': true });
    expect.soft({ 'The refused week 3 run keeps every byte': await snapshot(deliveryFolder) })
      .toEqual({ 'The refused week 3 run keeps every byte': before });
    expect.soft({ 'The refused week 3 run writes no week 3 file': (await walk(deliveryFolder)).filter((file) => path.basename(file).startsWith('l2-w03-')) })
      .toEqual({ 'The refused week 3 run writes no week 3 file': [] });
  }, 240000);

  it('ADV8 refuses the same row id twice in the approval list before any write', async () => {
    const nutNames = await putPrints(rowFor(NUT), '#88ccff');
    const henNames = await putPrints(rowFor(HEN), '#ffd27f', 2);
    const error = await rejection(() =>
      deliver(list([entry(NUT, nutNames), entry(NUT, henNames, 2)]), { rows: [rowFor(NUT), rowFor(HEN)] }),
    );
    expect.soft({ 'The duplicate approval entry is refused': /twice|duplicate|already/i.test(error.message) })
      .toEqual({ 'The duplicate approval entry is refused': true });
    expect.soft({ 'The duplicate approval entry names the row': error.message.includes(NUT) })
      .toEqual({ 'The duplicate approval entry names the row': true });
    expect.soft({ 'The duplicate approval entry writes no file': await walk(deliveryRoot) })
      .toEqual({ 'The duplicate approval entry writes no file': [] });
  });

  it('ADV9 refuses two picture-list rows with one id before any write', async () => {
    // A picture list with one id twice makes assembleManifest pair every candidate with both
    // jobs: each job lists both file names and both jobs select the first file. The second row
    // then has no job of its own. The writer refuses a duplicate approval entry (line 343), so
    // it must refuse a duplicate picture-list row id too.
    const nutNames = await putPrints(rowFor(NUT), '#88ccff');
    const second: PictureListRow = {
      ...rowFor(NUT),
      fileName: `${NUT}-b-v1.png`,
      lineArtFileName: `${NUT}-b-line-v1.png`,
    };
    const error = await rejection(() => deliver(list([entry(NUT, nutNames)]), { rows: [rowFor(NUT), second] }));
    expect.soft({ 'The duplicate picture-list row id is refused': /twice|duplicate|already|one id/i.test(error.message) })
      .toEqual({ 'The duplicate picture-list row id is refused': true });
    expect.soft({ 'The duplicate row id refusal names the row': error.message.includes(NUT) })
      .toEqual({ 'The duplicate row id refusal names the row': true });
    expect.soft({ 'The duplicate row id refusal writes no file': await walk(deliveryRoot) })
      .toEqual({ 'The duplicate row id refusal writes no file': [] });
    expect.soft({ 'The duplicate row id refusal creates no folder': existsSync(deliveryRoot) })
      .toEqual({ 'The duplicate row id refusal creates no folder': false });
  });

  it('ADV10 refuses fileVersion on a line name with no -v<n> suffix before any read', async () => {
    // The color name keeps a suffix, so planPictureRow accepts the row. The line name has none.
    const row: PictureListRow = { ...rowFor(NUT), lineArtFileName: `${NUT}-line.png` };
    const approvals = list([{ ...entry(NUT, museNames(NUT)), fileVersion: 2 }]);
    const error = await rejection(() =>
      writeMuseDelivery({ rows: [row], approvals, museRoot, deliveryRoot }),
    );
    expect.soft({ 'The no-suffix refusal names the row': error.message.includes(NUT) })
      .toEqual({ 'The no-suffix refusal names the row': true });
    expect.soft({ 'The no-suffix refusal names fileVersion': /fileVersion/i.test(error.message) })
      .toEqual({ 'The no-suffix refusal names fileVersion': true });
    expect.soft({ 'The no-suffix refusal names the suffix rule': /-v<n>|suffix/i.test(error.message) })
      .toEqual({ 'The no-suffix refusal names the suffix rule': true });
    expect.soft({ 'The no-suffix refusal writes no file': await walk(deliveryRoot) })
      .toEqual({ 'The no-suffix refusal writes no file': [] });
    // The Muse folder holds no file at all, so a read would have failed with a read error. The
    // suffix message proves the name check ran before the read.
    expect.soft({ 'The Muse folder is empty': await walk(museRoot) })
      .toEqual({ 'The Muse folder is empty': [] });
  });

  it('ADV11 refuses fileVersion 1e21 and accepts 2 on the same list', async () => {
    const nutNames = await putPrints(rowFor(NUT), '#88ccff');
    const row = rowFor(NUT);

    const tooBig = await rejection(() =>
      deliver(list([{ ...entry(NUT, nutNames), fileVersion: 1e21 }]), { rows: [row], target: path.join(root, 'big') }),
    );
    expect.soft({ 'The 1e21 fileVersion is refused for fileVersion': /fileVersion/i.test(tooBig.message) })
      .toEqual({ 'The 1e21 fileVersion is refused for fileVersion': true });
    expect.soft({ 'The 1e21 fileVersion is refused as too big': /too big|invalid|safe/i.test(tooBig.message) })
      .toEqual({ 'The 1e21 fileVersion is refused as too big': true });
    expect.soft({ 'The 1e21 refusal writes no file': await walk(path.join(root, 'big')) })
      .toEqual({ 'The 1e21 refusal writes no file': [] });

    // The control: the same list with fileVersion 2 resolves and uses the v2 names.
    const target = path.join(root, 'two');
    const manifest = await deliver(list([{ ...entry(NUT, nutNames), fileVersion: 2 }]), { rows: [row], target });
    const candidate = jobFor(manifest, NUT).candidates[0]!;
    expect.soft({ 'The fileVersion 2 control delivers the v2 name': path.basename(candidate.file) })
      .toEqual({ 'The fileVersion 2 control delivers the v2 name': `${NUT}-v2.png` });
    expect.soft({ 'The fileVersion 2 control records version 2': candidate.version })
      .toEqual({ 'The fileVersion 2 control records version 2': 2 });
    expect.soft({ 'The fileVersion 2 control writes the v2 file': existsSync(path.join(target, `${NUT}-v2.png`)) })
      .toEqual({ 'The fileVersion 2 control writes the v2 file': true });
  });

  it('ADV12 refuses a symlink at a delivered name even when its bytes match, and keeps the link', async () => {
    const nutNames = await putPrints(rowFor(NUT), '#88ccff');
    const henNames = await putPrints(rowFor(HEN), '#ffd27f', 2);
    const approvals = list([entry(NUT, nutNames), entry(HEN, henNames, 2)]);
    await deliver(approvals);

    // Replace the delivered color file with a symlink to a copy with the same bytes.
    const delivered = path.join(deliveryRoot, rowFor(NUT).fileName);
    const keep = path.join(root, 'keep-color.png');
    await writeFile(keep, await readFile(delivered));
    await rm(delivered);
    await symlink(keep, delivered);
    const before = await snapshot(deliveryRoot);
    const beforeLink = (await lstat(delivered)).isSymbolicLink();

    const error = await rejection(() => deliver(approvals));
    expect.soft({ 'The symlink at a delivered name is refused': /symlink|link|regular file|refus/i.test(error.message) })
      .toEqual({ 'The symlink at a delivered name is refused': true });
    expect.soft({ 'The refused run keeps every byte': await snapshot(deliveryRoot) })
      .toEqual({ 'The refused run keeps every byte': before });
    expect.soft({ 'The refused run keeps the symlink': (await lstat(delivered)).isSymbolicLink() })
      .toEqual({ 'The refused run keeps the symlink': beforeLink });
    expect.soft({ 'The symlink target keeps its bytes': sha256(await readFile(keep)) })
      .toEqual({ 'The symlink target keeps its bytes': before[rowFor(NUT).fileName] });
  });
});
