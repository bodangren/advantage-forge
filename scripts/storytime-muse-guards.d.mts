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
  /**
   * Test-only stand-in for `U2_RUN.capUsd`. The muse CLI never sets it. The unit 2 tests use it
   * to check the empty-cap refusal and the separate scans with a small fixture spend.
   */
  u2CapUsd?: number | string | null;
  /**
   * Test-only stand-in for `U2_FW_RUN.capUsd`. The muse CLI never sets it. The family-word tests
   * use it the same way as `u2CapUsd`.
   */
  u2FwCapUsd?: number | string | null;
  /**
   * Test-only stand-in for `U2_EXTRA_TRY.capUsd`. The muse CLI never sets it. The extra try tests
   * use it to check the empty-cap refusal and the exception cap with a small fixture spend.
   */
  u2ExtraCapUsd?: number | string | null;
  /**
   * Test-only stand-in for `COVER_RUN.capUsd`. The muse CLI never sets it. The cover tests use it
   * to check the empty-cap refusal and the cover cap with a small fixture spend.
   */
  coverCapUsd?: number | string | null;
}

export interface RunGuardsResult {
  refused: boolean;
  code: number;
  spend: number;
  notice: boolean;
  run: 'card' | 'restart' | 'u2' | 'u2fw' | 'cover' | 'mixed' | 'invalid';
  reportAt: number | null;
  message: string;
}

export interface OutDirClass {
  kind: 'card' | 'restart' | 'u2' | 'u2fw' | 'cover' | 'invalid';
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

export interface CardLineRetry {
  startTime: string;
  rows: Record<string, number>;
}

export interface U2Run {
  startTime: string;
  capUsd: number | null;
  reportAtUsd: number | null;
  marginUsd: number;
  maxTries: number;
  unitRoot: string;
}

export interface U2FwRun {
  startTime: string;
  capUsd: number;
  reportAtUsd: number;
  marginUsd: number;
  maxTries: number;
  outDir: string;
}

/** One row of the unit 2 extra try exception. */
export interface U2ExtraTryRow {
  id: string;
  kind: 'color' | 'line';
  /** True when the try passes the normal limit of `U2_RUN.maxTries`. */
  pastLimit: boolean;
  /** True when the row allows one more try past the once rule (D15). */
  netRetry?: boolean;
  /** The number of exception tries since the start time (D20). The default is 1. */
  allowedTries?: number;
  /** The PM words that granted the try. */
  source: string;
}

export interface U2ExtraTry {
  startTime: string;
  capUsd: number;
  reportAtUsd: number;
  marginUsd: number;
  rows: U2ExtraTryRow[];
}

export interface CoverRun {
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
export declare const CARD_LINE_RETRY_START: string;
export declare const CARD_LINE_RETRY: CardLineRetry;
export declare const U2_RUN: U2Run;
export declare const U2_FW_RUN: U2FwRun;
export declare const U2_EXTRA_TRY: U2ExtraTry;
export declare const COVER_RUN: CoverRun;
export declare const U2_WEEKS: string[];
export declare const U2_CAP_MESSAGE: string;
export declare const U2_FW_CAP_MESSAGE: string;
export declare const U2_EXTRA_CAP_MESSAGE: string;
export declare const COVER_CAP_MESSAGE: string;
export declare const COVER_LINE_MESSAGE: string;
export declare const TRY_EXCEPTIONS: TryException[];
export declare const PICTURE_IDS: Record<string, string[]>;

export declare function isCardCall(ctxs: GuardContext[]): boolean;
export declare function isMixedCardCall(ctxs: GuardContext[]): boolean;
export declare function isUnit2OutDir(specOrPath: { outDir?: string } | string | undefined): boolean;
export declare function isUnit2FwOutDir(specOrPath: { outDir?: string } | string | undefined): boolean;
export declare function isCoverOutDir(specOrPath: { outDir?: string } | string | undefined): boolean;
export declare function cliGuardOptions(opts?: Record<string, unknown>): Record<string, unknown>;
export declare function classifyOutDir(spec: { outDir?: string } | undefined, unitRoot: string): OutDirClass;
export declare function maxTriesFor(id: string, kind: string, maxTries?: number): number;
export declare function pictureKey(id: string): string;
export declare function parseCostsTsv(text: string): CostRow[];
export declare function isFailedZeroCost(r: CostRow): boolean;
export declare function countTries(rows: CostRow[], id: string, kind: string, startTime?: string): number;
export declare function countExceptionRows(
  rows: CostRow[],
  id: string,
  kind: string,
  startTime?: string,
): number;
export declare function firstExceptionTryCost(
  rows: CostRow[],
  id: string,
  kind: string,
  startTime?: string,
): number | null;
export declare function exceptionSpendOf(rows: CostRow[], startTime?: string): number;
export declare function exceptionEntryFor(id: string, kind: string): U2ExtraTryRow | null;
export declare function spendTotal(rows: CostRow[], startTime?: string): number;
export declare function tryGuard(
  rows: CostRow[],
  id: string,
  kind: string,
  requested?: number,
  startTime?: string,
  maxTries?: number,
): TryGuardResult;
export declare function lineRetryGuard(rows: CostRow[], id: string, requested?: number): TryGuardResult | null;
export declare function spendGuard(
  rows: CostRow[],
  startTime?: string,
  cap?: number,
  margin?: number,
  reportAt?: number,
): SpendGuardResult;
export declare function scanCostFiles(unitRoot: string): ScanCostFilesResult;
export declare function scanCardCostFiles(unitRoot: string): ScanCostFilesResult;
export declare function scanU2CostFiles(unitRoot: string): ScanCostFilesResult;
export declare function scanU2FwCostFiles(unitRoot: string): ScanCostFilesResult;
export declare function scanCoverCostFiles(unitRoot: string): ScanCostFilesResult;
export declare function runGuards(
  unitRoot: string,
  ctxs: GuardContext[],
  cmd: GuardCommand,
  opts?: GuardOptions,
): RunGuardsResult;
