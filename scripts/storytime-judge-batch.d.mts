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

export interface BuildBatchOptions {
  ids: string[];
  kind: 'color' | 'line';
  tryNo: number;
  from?: number;
  specDir?: string;
  judgeDir?: string;
  root?: string;
}

export interface BatchCommandOptions {
  ids: string[];
  kind?: string;
  tryNo?: number;
  from?: number;
  out?: string;
}

export declare function longSideOf(use: string): number;
export declare function sourceFileName(id: string, kind: string, tryNo: number, from?: number): string;
export declare function judgeFileName(id: string, kind: string, tryNo: number): string;
export declare function readSpec(specDir: string, id: string): A48Spec;
export declare function buildBatch(options: BuildBatchOptions): Promise<JudgeBatchEntry[]>;
export declare function parseArgs(argv: string[]): BatchCommandOptions;
