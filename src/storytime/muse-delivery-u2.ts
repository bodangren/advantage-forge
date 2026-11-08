import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  assembleManifest,
  inspectLineArtPng,
  planPictureRow,
  rowCaptureJob,
  type CandidateManifest,
  type PictureListRow,
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
// manifest.json in the StorytimeManifest shape of unit 1. The 48 reuse rows (PM decision 2) copy
// the color file of their unit 1 source and its line twin; they make no Muse entry. The writer
// reads local files only. It makes no network call, no provider call, and no key read.

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
