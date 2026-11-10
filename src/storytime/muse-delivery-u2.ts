import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import {
  assembleManifest,
  inspectLineArtPng,
  PICTURE_SIZES,
  planPictureRow,
  rowCaptureJob,
  type CandidateManifest,
  type PictureListRow,
  type StorytimeJob,
  type StorytimeManifest,
} from './book-pictures.js';
import {
  commitDelivery,
  inspectColorPrint,
  mapReviews,
  parseApprovals,
  readMuseFile,
  type DeliveryCopy,
  type MuseApprovalEntry,
  type MuseApprovalList,
} from './muse-delivery.js';

// The Storytime Level 2 unit 2 delivery writer (D3, 2026-11-08). It copies the approved Muse
// prints of the unit 2 run to one delivery folder under the list names, and it writes one
// manifest.json in the StorytimeManifest shape of unit 1. The 47 reuse rows (PM decision 2) copy
// the color file of their source and its line twin: 45 rows copy a unit 1 delivery, and 2 rows
// copy an earlier unit 2 row. They make no Muse entry. The writer reads local files only. It makes
// no network call, no provider call, and no key read.

/** The approved SHA-256 pin of the unit 2 picture list. */
export const UNIT2_LIST_SHA256 = '63d415000eca9d6be1a6ad533c12ff81e127cd2c76ffac339697f91b99f754ec';

/** The unit 2 picture list of the Workbooks repository (read only). */
export const UNIT2_LIST_FILE =
  '/home/daniebo/Desktop/Workbooks/content/storytime/drafts/l2/print/pictures-u2.json';

/** The unit 2 rows file, relative to the repository root. It holds the reuse sources. */
export const UNIT2_ROWS_FILE = 'docs/storytime/l2-unit2/rows.json';

/** One reuse source of a unit 2 row. `source` is a repository-relative color print path. */
export interface Unit2ReuseSource {
  word?: string;
  source: string;
  kind?: string;
}

/** One row of docs/storytime/l2-unit2/rows.json. The writer reads the id and the reuse field. */
export interface Unit2Row {
  id: string;
  cast?: string[];
  reuse?: Unit2ReuseSource | null;
}

export interface MuseUnit2DeliveryOptions {
  /** The unit 2 picture list file. The writer reads it and checks the SHA-256 pin. */
  listFile?: string;
  /** The expected SHA-256 of the list file. Default: the approved unit 2 list hash. */
  pictureListPin?: string;
  /** The approval list, or the path of its JSON file. */
  approvals: MuseApprovalList | string;
  /**
   * Deliver only the rows of the approval list (D4). Default false. When it is true, a row
   * without an approval entry gets no job, the reuse rows stay out of the delivery, and the skip
   * callback is not called. The checks of the list and of every file stay.
   */
  approvalsOnly?: boolean;
  /** The unit 2 rows file, or an already parsed document. Default: `<repoRoot>/docs/storytime/l2-unit2/rows.json`. */
  rows?: Unit2Row[] | { rows: Unit2Row[] } | string;
  /** The repository root, for the reuse source paths of rows.json. */
  repoRoot?: string;
  /** The folder that holds the Muse print files named in the approval entries. */
  museRoot: string;
  /** The delivery batch root: the folder that gets the copied files and manifest.json. */
  deliveryRoot: string;
  /** Called once for each row without an approval entry and without a reuse source. */
  onSkip?: (rowId: string, reason: string) => void;
}

export interface Unit2List {
  /** The absolute path of the list file. */
  file: string;
  /** The measured SHA-256 of the list file bytes. */
  sha256: string;
  rows: PictureListRow[];
}

interface DeliveryItem {
  row: PictureListRow;
  entry: MuseApprovalEntry | null;
  version: number;
  colorBytes: Buffer;
  lineBytes: Buffer;
  colorSha256: string;
  lineSha256: string;
  candidate: CandidateManifest;
}

function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

/** The delivered version of a list name `<row id>-v<n>.png`. */
function listVersion(name: string): number {
  const match = /-v(\d+)\.png$/.exec(name);
  return match ? Number(match[1]) : 1;
}

/**
 * The line twin of a reuse color print file: the same path with `-line` before the `-v<n>`
 * suffix. A source without that suffix has no known twin, so the writer refuses it.
 */
export function lineTwinOf(source: string): string {
  const match = /^(.*)-v(\d+)\.png$/.exec(source);
  if (!match) {
    throw new Error(`the reuse source ${source} has no -v<n>.png suffix, so its line twin is unknown`);
  }
  return `${match[1]}-line-v${match[2]}.png`;
}

/** Reads one unit 2 picture list file and checks its SHA-256 pin. */
export async function readUnit2List(file: string, pin: string = UNIT2_LIST_SHA256): Promise<Unit2List> {
  const absolute = path.resolve(file);
  let bytes: Buffer;
  try {
    bytes = await readFile(absolute);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`cannot read the unit 2 picture list ${absolute}: ${reason}`);
  }
  const measured = sha256(bytes);
  if (measured !== pin) {
    throw new Error(
      `The unit 2 picture list SHA-256 ${measured} differs from the pin ${pin}; the list changed.`,
    );
  }
  let source: unknown;
  try {
    source = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`the unit 2 picture list ${absolute} is not valid JSON: ${reason}`);
  }
  const rows = Array.isArray(source) ? source : (source as { rows?: unknown }).rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`the unit 2 picture list ${absolute} holds no rows.`);
  }
  const seen = new Set<string>();
  for (const raw of rows) {
    const row = raw as Partial<PictureListRow>;
    if (typeof row.id !== 'string' || !row.id) throw new Error(`the unit 2 picture list holds a row without an id.`);
    if (seen.has(row.id)) throw new Error(`The picture list holds the row ${row.id} twice.`);
    seen.add(row.id);
    if (typeof row.week !== 'number') throw new Error(`The picture row ${row.id} has no week.`);
    const plan = planPictureRow(row as PictureListRow);
    if (row.width !== plan.width || row.height !== plan.height) {
      throw new Error(
        `The picture row ${row.id} declares ${String(row.width)} x ${String(row.height)} pixels; ` +
          `class ${String(row.sizeClass)} needs ${plan.width} x ${plan.height}.`,
      );
    }
  }
  return { file: absolute, sha256: measured, rows: rows as PictureListRow[] };
}

/** Reads the reuse sources of the unit 2 rows file into an id map. */
export function reuseSourcesOf(rows: Unit2Row[] | { rows: Unit2Row[] }): Map<string, Unit2ReuseSource> {
  const list = Array.isArray(rows) ? rows : rows.rows;
  const map = new Map<string, Unit2ReuseSource>();
  for (const row of list) {
    if (row?.reuse?.source) map.set(row.id, row.reuse);
  }
  return map;
}

async function readReuseSources(source: MuseUnit2DeliveryOptions['rows'], repoRoot: string): Promise<Map<string, Unit2ReuseSource>> {
  if (Array.isArray(source) || (source && typeof source === 'object')) return reuseSourcesOf(source);
  const file = path.resolve(repoRoot, typeof source === 'string' ? source : UNIT2_ROWS_FILE);
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`cannot read the unit 2 rows file ${file}: ${reason}`);
  }
  return reuseSourcesOf(JSON.parse(text) as { rows: Unit2Row[] });
}

/**
 * Reads the id of the earlier unit 2 row named by a `unit2-earlier-row` reuse source. The source
 * is the spec file of that earlier row, not a print file.
 */
async function readEarlierRowId(repoRoot: string, relative: string, rowId: string): Promise<string> {
  const file = path.resolve(repoRoot, relative);
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${rowId}: cannot read the spec of the earlier unit 2 row ${relative}: ${reason}`);
  }
  let spec: { id?: unknown };
  try {
    spec = JSON.parse(text) as { id?: unknown };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${rowId}: the earlier unit 2 row spec ${relative} is not valid JSON: ${reason}`);
  }
  if (typeof spec.id !== 'string' || !spec.id) {
    throw new Error(`${rowId}: the earlier unit 2 row spec ${relative} holds no id.`);
  }
  return spec.id;
}

async function readReuseFile(repoRoot: string, relative: string, rowId: string, role: string): Promise<Buffer> {
  const file = path.resolve(repoRoot, relative);
  try {
    return await readFile(file);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${rowId}: cannot read the reuse ${role} file ${relative}: ${reason}`);
  }
}

function candidateOf(item: {
  row: PictureListRow;
  version: number;
  colorFile: string;
  lineFile: string;
  colorSha256: string;
  lineSha256: string;
  color: CandidateManifest['structural'];
  line: CandidateManifest['structural'];
  reviews: CandidateManifest['reviews'];
}): CandidateManifest {
  const { row, version, colorFile, lineFile, colorSha256, lineSha256, color, line, reviews } = item;
  return {
    jobId: row.id,
    version,
    file: colorFile,
    fileSha256: colorSha256,
    status: 'ready',
    structural: color,
    reviews,
    lineArt: {
      file: lineFile,
      fileSha256: lineSha256,
      colorFile,
      // The Muse flow makes no 3D render evidence, so the field stays empty.
      renderEvidenceFile: '',
      status: 'ready',
      structural: line,
      errors: [],
    },
    failures: [],
  };
}

/**
 * Writes the unit 2 delivery. Every check runs before the first write, so a refusal leaves the
 * delivery folder unchanged. An approval entry copies its Muse prints; a row without an entry
 * and with a reuse source copies the source color file and its line twin; every other row gets
 * no job and goes to `onSkip`.
 *
 * With the option `approvalsOnly` the writer delivers only the rows of the approval list. A row
 * without an entry gets no job, the reuse rows stay out of the delivery, and `onSkip` is not
 * called. The checks of the list and of every file stay.
 */
export async function deliverMuseUnit2(options: MuseUnit2DeliveryOptions): Promise<StorytimeManifest> {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const list = await readUnit2List(options.listFile ?? UNIT2_LIST_FILE, options.pictureListPin);
  const approvals = await parseApprovals(options.approvals);
  const reuse = await readReuseSources(options.rows, repoRoot);
  const museRoot = path.resolve(options.museRoot);
  const deliveryRoot = path.resolve(options.deliveryRoot);

  const seen = new Set<string>();
  for (const entry of approvals.entries) {
    if (seen.has(entry.rowId)) throw new Error(`The approval list holds the row ${entry.rowId} twice.`);
    seen.add(entry.rowId);
    if (!list.rows.some((row) => row.id === entry.rowId)) {
      throw new Error(`The approval list names ${entry.rowId}, which is not a row of the picture list.`);
    }
  }
  if (approvals.pictureListSha256 !== undefined && approvals.pictureListSha256 !== list.sha256) {
    throw new Error(
      `The unit 2 picture list SHA-256 ${list.sha256} differs from the pin ${approvals.pictureListSha256} of the approval list.`,
    );
  }

  // A repeated delivered name would overwrite a file, so the name check runs before any read.
  const deliveredNames = new Map<string, string>();
  for (const row of list.rows) {
    for (const name of [row.fileName, row.lineArtFileName]) {
      const owner = deliveredNames.get(name);
      if (owner !== undefined) {
        throw new Error(`${row.id}: the delivered file name ${name} is a duplicate; ${owner} already delivers it.`);
      }
      deliveredNames.set(name, row.id);
    }
  }

  const items: DeliveryItem[] = [];
  const problems: string[] = [];
  for (const row of list.rows) {
    const entry = approvals.entries.find((candidate) => candidate.rowId === row.id) ?? null;
    const source = reuse.get(row.id);
    let colorBytes: Buffer;
    let lineBytes: Buffer;
    if (entry) {
      try {
        colorBytes = await readMuseFile(museRoot, entry.colorPrint, row.id);
        lineBytes = await readMuseFile(museRoot, entry.linePrint, row.id);
      } catch (error) {
        problems.push(error instanceof Error ? error.message : String(error));
        continue;
      }
    } else if (options.approvalsOnly) {
      // The option delivers only the rows of the approval list. A row without an entry gets no
      // job. It does not use its reuse source, and the skip callback stays quiet.
      continue;
    } else if (source && source.kind === 'unit2-earlier-row') {
      // The source is the spec of an earlier unit 2 row. Its approved prints are the reuse files,
      // so the earlier row needs an approval entry in this same run.
      let earlierId: string;
      try {
        earlierId = await readEarlierRowId(repoRoot, source.source, row.id);
      } catch (error) {
        problems.push(error instanceof Error ? error.message : String(error));
        continue;
      }
      const earlier = approvals.entries.find((candidate) => candidate.rowId === earlierId);
      if (!earlier) {
        problems.push(
          `${row.id}: the earlier unit 2 row ${earlierId} has no approval entry in this run; ` +
            `the write stops with ${row.id} and ${earlierId}.`,
        );
        continue;
      }
      try {
        colorBytes = await readMuseFile(museRoot, earlier.colorPrint, row.id);
        lineBytes = await readMuseFile(museRoot, earlier.linePrint, row.id);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        problems.push(`${row.id}: cannot read the approved print of the earlier row ${earlierId}: ${reason}`);
        continue;
      }
    } else if (source) {
      let lineSource: string;
      try {
        lineSource = lineTwinOf(source.source);
      } catch (error) {
        problems.push(error instanceof Error ? error.message : String(error));
        continue;
      }
      try {
        colorBytes = await readReuseFile(repoRoot, source.source, row.id, 'color');
        lineBytes = await readReuseFile(repoRoot, lineSource, row.id, 'line');
      } catch (error) {
        problems.push(error instanceof Error ? error.message : String(error));
        continue;
      }
    } else {
      options.onSkip?.(row.id, `The approval list has no entry for ${row.id} and rows.json has no reuse source; the row gets no job.`);
      continue;
    }
    const plan = planPictureRow(row);
    const size = { width: plan.width, height: plan.height };
    const color = await inspectColorPrint(colorBytes, size);
    const line = await inspectLineArtPng(lineBytes, size);
    for (const error of color.errors) problems.push(`${row.id}: color print: ${error}`);
    for (const error of line.errors) problems.push(`${row.id}: line print: ${error}`);
    if (!color.valid || !line.valid) continue;
    const colorSha256 = sha256(colorBytes);
    const lineSha256 = sha256(lineBytes);
    const version = entry?.version ?? listVersion(row.fileName);
    let reviews: CandidateManifest['reviews'];
    try {
      reviews = entry
        ? mapReviews({ row, entry, version, colorFile: row.fileName, colorSha256 })
        : {};
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    items.push({
      row,
      entry,
      version,
      colorBytes,
      lineBytes,
      colorSha256,
      lineSha256,
      candidate: candidateOf({
        row,
        version,
        colorFile: row.fileName,
        lineFile: row.lineArtFileName,
        colorSha256,
        lineSha256,
        color,
        line,
        reviews,
      }),
    });
  }
  if (problems.length) throw new Error(`The unit 2 delivery stopped; nothing was written:\n${problems.join('\n')}`);

  const jobs = items.map((item) => ({
    ...rowCaptureJob(item.row),
    // The files sit at the delivery root; the directory only groups the batch hash by week.
    directory: `w${String(item.row.week).padStart(2, '0')}`,
  }));
  const manifest = assembleManifest(jobs, items.map((item) => item.candidate));
  const copies: DeliveryCopy[] = [];
  for (const item of items) {
    copies.push(
      { file: item.row.fileName, bytes: item.colorBytes, sha256: item.colorSha256, rowId: item.row.id },
      { file: item.row.lineArtFileName, bytes: item.lineBytes, sha256: item.lineSha256, rowId: item.row.id },
    );
  }
  await commitDelivery(deliveryRoot, manifest, copies);
  return manifest;
}

// ---------------------------------------------------------------------------
// The Level 2 app family words (Phase 3 Task 9, 2026-11-09). The set holds 18 color pictures of
// size class C. The unit 1 writer `deliverMuseColorSet` refuses these ids, because its row id rule
// holds the unit 1 family words only, so the writer lives here. It writes one color print per row
// under the `<id>-v1.png` name of unit 1, and one manifest.json in the StorytimeManifest shape.
// The set has no line-art twin, so the manifest keeps the color batches only.
// ---------------------------------------------------------------------------

/** The 18 app family-word ids of unit 2, in the order of the paid media list. */
export const UNIT2_FAMILY_WORD_IDS = [
  'l2-w09-family-egg',
  'l2-w09-family-milk',
  'l2-w09-family-cake',
  'l2-w10-family-hat',
  'l2-w11-family-bed',
  'l2-w11-family-table',
  'l2-w11-family-sofa',
  'l2-w11-family-box',
  'l2-w11-family-chair',
  'l2-w12-family-book',
  'l2-w12-family-bag',
  'l2-w12-family-pencil',
  'l2-w12-family-pen',
  'l2-w13-family-jump',
  'l2-w15-family-bus',
  'l2-w15-family-bike',
  'l2-w15-family-truck',
  'l2-w15-family-plane',
] as const;

/** One app family-word approval entry. */
const FamilyWordApprovalSchema = z
  .object({
    rowId: z.string().min(1),
    /** The Muse version of the approved print: the `m<n>` of the Muse file names. */
    version: z.union([z.string().regex(/^m\d+$/), z.number().int().positive()]),
    colorPrint: z.string().min(1),
  })
  .strict();

const FamilyWordApprovalListSchema = z.object({
  version: z.literal(1),
  entries: z.array(FamilyWordApprovalSchema).min(1, { message: 'must hold at least one entry' }),
});

export type MuseUnit2FamilyWordApproval = z.infer<typeof FamilyWordApprovalSchema>;
export type MuseUnit2FamilyWordApprovalList = z.infer<typeof FamilyWordApprovalListSchema>;

export interface MuseUnit2FamilyWordDeliveryOptions {
  /** The app family-word approval list, or the path of its JSON file. */
  approvals: MuseUnit2FamilyWordApprovalList | string;
  /** The folder that holds the Muse print files named in the approval entries. */
  museRoot: string;
  /** The delivery batch root: the folder that gets the copied files and manifest.json. */
  deliveryRoot: string;
}

interface FamilyWordItem {
  entry: MuseUnit2FamilyWordApproval;
  colorFile: string;
  colorBytes: Buffer;
  colorSha256: string;
  candidate: CandidateManifest;
}

async function parseFamilyWordApprovals(
  approvals: MuseUnit2FamilyWordApprovalList | string,
): Promise<MuseUnit2FamilyWordApprovalList> {
  const source: unknown =
    typeof approvals === 'string' ? JSON.parse(await readFile(approvals, 'utf8')) : approvals;
  const parsed = FamilyWordApprovalListSchema.safeParse(source);
  if (parsed.success) return parsed.data;
  const issue = parsed.error.issues[0];
  const where = issue ? issue.path.join('.') : 'list';
  throw new Error(`The app family-word approval list is invalid at ${where}: ${issue?.message ?? 'invalid list'}.`);
}

/** The state of a path, or null when the path does not exist. */
async function lstatOrNull(file: string) {
  try {
    return await lstat(file);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return null;
    throw error;
  }
}

/** The week of an app family-word id: the number of its `w<nn>` part. */
function familyWordWeek(rowId: string): number {
  const match = /^l2-w(\d\d)-family-[a-z]+$/.exec(rowId);
  if (!match) throw new Error(`${rowId}: the id must match l2-w<nn>-family-<word>.`);
  return Number(match[1]);
}

/** The word of an app family-word id: the part after `family-`. */
function familyWordText(rowId: string): string {
  return rowId.replace(/^l2-w\d\d-family-/, '');
}

/** The number of an approval version: the `m<n>` name or the plain number. */
function familyWordVersion(version: string | number): number {
  if (typeof version === 'number') return version;
  return Number(version.replace(/^m/, ''));
}

/** The manifest job of one app family word. The week and the word come from the row id. */
function familyWordJob(rowId: string): StorytimeJob {
  const week = familyWordWeek(rowId);
  return {
    id: rowId,
    week,
    bookKind: 'readalong',
    bookTitle: '',
    page: 0,
    text: familyWordText(rowId),
    sourcePrompt: '',
    characters: [],
    sourcePackage: '',
    sourceSha256: '',
    slug: rowId,
    directory: `w${String(week).padStart(2, '0')}`,
    use: 'small',
    size: 'small',
  };
}

/**
 * Writes the Level 2 app family-word delivery: one color print per row, byte for byte, and one
 * manifest.json with one color batch per week and no line-art batch. Every check runs before the
 * first write, so a refusal leaves the delivery folder unchanged. The writer refuses an id outside
 * the 18 app family words, an existing delivery folder, and a missing or wrong print file.
 */
export async function deliverMuseUnit2FamilyWords(
  options: MuseUnit2FamilyWordDeliveryOptions,
): Promise<StorytimeManifest> {
  const list = await parseFamilyWordApprovals(options.approvals);
  const museRoot = path.resolve(options.museRoot);
  const deliveryRoot = path.resolve(options.deliveryRoot);

  const deliveryInfo = await lstatOrNull(deliveryRoot);
  if (deliveryInfo) {
    throw new Error(`The delivery folder ${deliveryRoot} exists; the writer refuses it.`);
  }

  const seen = new Set<string>();
  for (const entry of list.entries) {
    if (seen.has(entry.rowId)) throw new Error(`The approval list holds the row ${entry.rowId} twice.`);
    seen.add(entry.rowId);
    if (!UNIT2_FAMILY_WORD_IDS.includes(entry.rowId as (typeof UNIT2_FAMILY_WORD_IDS)[number])) {
      throw new Error(`${entry.rowId}: the id is not one of the 18 app family words.`);
    }
  }

  const items: FamilyWordItem[] = [];
  const problems: string[] = [];
  for (const entry of list.entries) {
    const colorFile = `${entry.rowId}-v1.png`;
    let colorBytes: Buffer;
    try {
      colorBytes = await readMuseFile(museRoot, entry.colorPrint, entry.rowId);
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    const color = await inspectColorPrint(colorBytes, PICTURE_SIZES.small);
    for (const error of color.errors) problems.push(`${entry.rowId}: color print ${entry.colorPrint}: ${error}`);
    if (!color.valid) continue;
    const colorSha256 = sha256(colorBytes);
    const candidate: CandidateManifest = {
      jobId: entry.rowId,
      version: familyWordVersion(entry.version),
      file: colorFile,
      fileSha256: colorSha256,
      status: 'ready',
      structural: color,
      reviews: {},
      failures: [],
    };
    items.push({ entry, colorFile, colorBytes, colorSha256, candidate });
  }
  if (problems.length) {
    throw new Error(`The app family-word delivery stopped; nothing was written:\n${problems.join('\n')}`);
  }

  const jobs = items.map((item) => familyWordJob(item.entry.rowId));
  const assembled = assembleManifest(jobs, items.map((item) => item.candidate));
  // The app family words have no line-art twin, so the manifest keeps the color batches only.
  const manifest: StorytimeManifest = {
    ...assembled,
    batches: assembled.batches.filter((batch) => batch.outputKind === 'color'),
  };
  const copies: DeliveryCopy[] = items.map((item) => ({
    file: item.colorFile,
    bytes: item.colorBytes,
    sha256: item.colorSha256,
    rowId: item.entry.rowId,
  }));
  await commitDelivery(deliveryRoot, manifest, copies);
  return manifest;
}
