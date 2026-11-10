// Types of scripts/storytime-cover-judge-copy.mjs. The script is plain JavaScript; this file
// gives the test file and the callers the shape of the module.

/** One zone line of the cover page. */
export interface CoverZone {
  percent: number;
  color: string;
  row: number;
}

export interface CoverJudgeOptions {
  id: string;
  try: string;
  src: string;
  out: string;
}

export interface CoverJudgeFiles {
  clean: string;
  zones: string;
}

export declare const COVER_ZONES: number[];
export declare const ZONE_COLORS: Record<number, string>;
export declare const JUDGE_WIDTH: number;
export declare const JUDGE_HEIGHT: number;
export declare const DEFAULT_SOURCE_DIR: string;
export declare const DEFAULT_OUT_DIR: string;

export declare function coverJudgeNames(id: string, n: string | number): CoverJudgeFiles;
export declare function coverSourceName(id: string, n: string | number): string;
export declare function zoneRow(percent: number, height?: number): number;
export declare function makeCoverJudgeCopies(
  sourceFile: string,
  outDir: string,
  id: string,
  n: string | number,
): Promise<CoverJudgeFiles>;
export declare function parseArgs(argv: string[]): CoverJudgeOptions;
export declare function main(argv?: string[]): Promise<number>;
