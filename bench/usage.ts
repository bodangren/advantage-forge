/**
 * Summarize a pi JSON transcript: turns, tool calls, token usage, and whether the model ever
 * looked at an image. Writes usage.json next to the transcript.
 *
 *   tsx bench/usage.ts <run-dir>
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeJson } from './lib.js';

const runDir = process.argv[2];
if (!runDir) throw new Error('usage: usage.ts <run-dir>');
const lines = readFileSync(join(runDir, 'transcript.jsonl'), 'utf8').split('\n').filter(Boolean);
const totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
const tools: Record<string, number> = {};
let turns = 0;
let imageReads = 0;
let renders = 0;
let inspects = 0;
let lastError: string | null = null;
for (const line of lines) {
  let ev: Record<string, unknown>;
  try {
    ev = JSON.parse(line) as Record<string, unknown>;
  } catch {
    continue;
  }
  const type = ev.type as string | undefined;
  const message = ev.message as Record<string, unknown> | undefined;
  // pi emits one turn_end per assistant turn, carrying that message with its token usage.
  if (type === 'turn_end' && message?.role === 'assistant') {
    turns++;
    const u = message.usage as Record<string, number> | undefined;
    if (u) for (const k of Object.keys(totals) as (keyof typeof totals)[]) totals[k] += u[k] ?? 0;
    if (typeof message.errorMessage === 'string') lastError = message.errorMessage;
  }
  if (type === 'auto_retry_start' && typeof ev.errorMessage === 'string') lastError = ev.errorMessage;
  if (type === 'tool_execution_start') {
    const name = String(ev.toolName ?? 'unknown');
    tools[name] = (tools[name] ?? 0) + 1;
    const args = JSON.stringify(ev.args ?? {});
    if (name === 'read' && /\.(png|jpe?g|gif)"/i.test(args)) imageReads++;
    if (/forge (render|all)/.test(args)) renders++;
    if (/forge inspect/.test(args)) inspects++;
  }
}
writeJson(join(runDir, 'usage.json'), {
  schema: 1,
  turns,
  tokens: totals,
  tools,
  image_reads: imageReads,
  renders,
  inspects,
  last_error: lastError,
});
console.log(
  `usage: ${turns} turns, ${totals.input + totals.cacheRead} input / ${totals.output} output tokens, ${renders} renders, ${imageReads} image reads`,
);
