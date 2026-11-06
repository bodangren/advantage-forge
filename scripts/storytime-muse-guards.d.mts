// Types of scripts/storytime-muse-guards.mjs. The script is plain JavaScript; this file gives
// the test file and the callers the shape of the module.

export interface TryException {
  id: string;
  kind: 'color' | 'line';
  extraTries: number;
  source: string;
}

export interface CostRow {
  time: string;
  row: string;
  version: string;
  kind: string;
  inputs: string;
  output: string;
  size: string;
  cost: number;
  note: string;
}

export interface TryGuardResult {
  ok: boolean;
  count: number;
  max: number;
  reason?: string;
}

export interface SpendGuardResult {
  ok: boolean;
  spend: number;
  notice: boolean;
}

export interface ScanCostFilesResult {
  pictureRows: CostRow[];
  allRows: CostRow[];
}

export interface GuardContext {
  spec: { id: string; outDir?: string };
}

export type GuardCommand = 'color' | 'line';

export interface GuardOptions {
  tries?: number | string;
}

export interface RunGuardsResult {
  refused: boolean;
  code: number;
  spend: number;
  notice: boolean;
  run: 'card' | 'restart' | 'mixed' | 'invalid';
  reportAt: number;
  message: string;
}

export interface OutDirClass {
  kind: 'card' | 'restart' | 'invalid';
  raw: string;
  resolved: string;
}

export interface CardRun {
  startTime: string;
  capUsd: number;
  reportAtUsd: number;
  marginUsd: number;
  maxTries: number;
  outDir: string;
}

export declare const RESTART_START: string;
export declare const MAX_TRIES: number;
export declare const SPEND_CAP_USD: number;
export declare const SPEND_MARGIN_USD: number;
export declare const REPORT_AT_USD: number;
export declare const CARD_RUN: CardRun;
export declare const TRY_EXCEPTIONS: TryException[];
export declare const PICTURE_IDS: Record<string, string[]>;

export declare function isCardCall(ctxs: GuardContext[]): boolean;
export declare function isMixedCardCall(ctxs: GuardContext[]): boolean;
export declare function classifyOutDir(spec: { outDir?: string } | undefined, unitRoot: string): OutDirClass;
export declare function maxTriesFor(id: string, kind: string, maxTries?: number): number;
export declare function pictureKey(id: string): string;
export declare function parseCostsTsv(text: string): CostRow[];
export declare function isFailedZeroCost(r: CostRow): boolean;
export declare function countTries(rows: CostRow[], id: string, kind: string, startTime?: string): number;
export declare function spendTotal(rows: CostRow[], startTime?: string): number;
export declare function tryGuard(
  rows: CostRow[],
  id: string,
  kind: string,
  requested?: number,
  startTime?: string,
  maxTries?: number,
): TryGuardResult;
export declare function spendGuard(
  rows: CostRow[],
  startTime?: string,
  cap?: number,
  margin?: number,
  reportAt?: number,
): SpendGuardResult;
export declare function scanCostFiles(unitRoot: string): ScanCostFilesResult;
export declare function scanCardCostFiles(unitRoot: string): ScanCostFilesResult;
export declare function runGuards(
  unitRoot: string,
  ctxs: GuardContext[],
  cmd: GuardCommand,
  opts?: GuardOptions,
): RunGuardsResult;
