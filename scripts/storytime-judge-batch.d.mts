// Types of scripts/storytime-judge-batch.mjs. The script is plain JavaScript; this file gives
// the test file and the callers the shape of the module.
export interface A48Spec {
  id: string;
  text?: string;
  pageText: string;
  use: string;
  goal?: string;
  mustShow: string[];
  deliverAs?: string;
  alsoIds?: string[];
  alsoDeliverAs?: string[];
  references?: string[];
  colorPrompt?: string;
  linePrompt?: string;
  print?: string;
  aspect?: string;
  printSize?: [number, number];
  outDir: string;
}

export interface JudgeBatchEntry {
  judgeFile: string;
  id: string;
  kind: 'color' | 'line';
  pageText: string;
  use: string;
  mustShow: string[];
}

export interface CostRow {
  time: string;
  row: string;
  version: string;
  kind: string;
  output: string;
}

/** One row of docs/storytime/l2-unit2/rows.json. */
export interface Unit2Row {
  id: string;
  week?: number;
  use?: string;
  sizeClass?: string;
  text?: string;
  cast?: string[];
  set?: string | null;
  props?: string[];
  reuse?: unknown;
}

/** One row of the unit 2 picture list of the Workbooks repository (read only). */
export interface Unit2ListRow {
  id: string;
  text?: string;
  pageText?: string;
  use?: string;
  sizeClass?: string;
  objectCounts?: Record<string, number>;
}

export interface BuildBatchOptions {
  ids: string[];
  kind: 'color' | 'line';
  tryNo: number;
  cards?: boolean;
  familyWords?: boolean;
  unit2?: boolean;
  specDir?: string;
  judgeDir?: string;
  root?: string;
  /** The unit 2 rows file. Default: `<root>/docs/storytime/l2-unit2/rows.json`. */
  rowsFile?: string;
  /** The unit 2 picture list. Default: the Workbooks read-only file. */
  listFile?: string;
}

export interface BatchCommandOptions {
  ids: string[];
  kind?: string;
  tryNo?: number;
  out?: string;
  cards?: boolean;
  familyWords?: boolean;
  unit2?: boolean;
}

export declare const RESTART_START: string;
export declare const UNIT2_JUDGE_DIR: string;
export declare function unit2LongSide(sizeClass: string | undefined): number;
export declare function batchDirOf(options: { unit2?: boolean } | undefined): string;
export declare function longSideOf(use: string): number;
export declare function utcMs(time: string): number;
export declare function parseCostRows(text: string): CostRow[];
export declare function restartTries(rows: CostRow[], id: string, kind: string, startTime?: string): CostRow[];
export declare function trySourceName(tries: CostRow[], tryNo: number, kind: string, id: string): string;
export declare function judgeFileName(id: string, kind: string, tryNo: number): string;
export declare function readSpec(specDir: string, id: string): A48Spec;
export declare function unit2WeekOf(id: string): string | null;
export declare function unit2SpecFile(root: string, id: string): string;
export declare function readUnit2Spec(file: string, id: string): Unit2Row & { outDir: string };
export declare function readUnit2Rows(root: string, rowsFile?: string): Map<string, Unit2Row>;
export declare function readUnit2List(root: string, listFile?: string): Map<string, Unit2ListRow>;
export declare function unit2MustShow(
  row: Unit2Row | undefined,
  listRow: Unit2ListRow | undefined,
): string[];
export declare function buildBatch(options: BuildBatchOptions): Promise<JudgeBatchEntry[]>;
export declare function parseArgs(argv: string[]): BatchCommandOptions;
