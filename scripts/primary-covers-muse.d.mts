// Types of scripts/primary-covers-muse.mjs. The script is plain JavaScript; this file gives the
// test file and the callers the shape of the module.

export interface CoverRequest {
  id: string;
  seq?: number;
  book?: string;
  prompt: string;
  model?: string;
  aspect_ratio?: string;
  size_px?: string;
  references?: { path: string; role?: string }[];
  output_file: string;
  cut?: string;
}

export interface CoverRequestsFile {
  request?: string;
  date?: string;
  count?: number;
  hard_stop_usd_total?: number;
  requests: CoverRequest[];
}

export interface CostRow {
  time: string;
  prompt_id: string;
  attempt: number;
  cost: number;
}

export interface CoverOptions {
  requests: string;
  refs: string;
  out: string;
  ids: string[];
  maxTries: number;
  cap: number;
  margin: number;
  suffix: string;
  dryRun: boolean;
}

export interface MuseResult {
  buf?: Buffer;
  cost: number;
  error?: string;
}

export const KEY_FILE: string;
export const readKey: () => string;
export const dataUrl: (path: string) => Promise<{ type: string; image_url: { url: string } }>;
export const callMuse: (
  key: string,
  prompt: string,
  refs: { type: string; image_url: { url: string } }[],
  aspect: string,
) => Promise<MuseResult>;
export const readRows: (file: string) => CostRow[];
export const spendOf: (rows: CostRow[]) => number;
export const attemptOf: (rows: CostRow[], id: string) => number;
export const fileNameFor: (request: CoverRequest, attempt: number) => string;
export const parseArgs: (argv: string[]) => CoverOptions;
export const main: (argv?: string[]) => Promise<number>;
