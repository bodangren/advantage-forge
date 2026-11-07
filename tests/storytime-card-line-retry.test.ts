import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as guards from '../scripts/storytime-muse-guards.mjs';
import { describe, expect, it } from 'vitest';

const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';
const CARD_DIR = guards.CARD_RUN.outDir;
const RETRY_START = guards.CARD_LINE_RETRY_START;
/** A time after the card start and before the retry start: the 3 line tries of each card row. */
const BEFORE_RETRY = '2026-11-06T12:00:00Z';
const HAM = 'l2-w04-card-ham';
const FAMILY = 'l2-w04-card-family';
const TOMATO = 'l2-w04-card-tomato';

const costRow = (time: string, id: string, kind = 'line', cost = 0.01) =>
  `${time}\t${id}\tm1\t${kind}\tin\t${id}-${kind}.png\t1500x1500\t${cost}\tok`;
const parsed = (rows: string[]) => guards.parseCostsTsv(`${HEADER}\n${rows.join('\n')}\n`);
const tries = (count: number, time: string, id: string, kind: 'color' | 'line' = 'line') =>
  Array.from({ length: count }, () => costRow(time, id, kind));
const temp = () => mkdtempSync(path.join(os.tmpdir(), 'storytime-card-line-retry-'));
const writeCosts = (root: string, rows: string[]) => {
  const file = path.join(root, 'cards/muse/costs.tsv');
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${HEADER}\n${rows.join('\n')}\n`);
};
const runCall = (root: string, id: string, cmd: 'color' | 'line', tries?: number) =>
  guards.runGuards(root, [{ spec: { id, outDir: CARD_DIR } }], cmd, tries === undefined ? {} : { tries });

describe('storytime card line retry (LR)', () => {
  it('LR1 exports one retry start time and one allowance per card row', () => {
    expect(guards.CARD_LINE_RETRY_START).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:00Z$/);
    expect(guards.CARD_LINE_RETRY).toEqual({ startTime: RETRY_START, rows: { [HAM]: 2, [FAMILY]: 3 } });
    expect(Date.parse(RETRY_START)).toBeGreaterThan(Date.parse(guards.CARD_RUN.startTime));
    expect(Date.parse(RETRY_START)).toBeLessThanOrEqual(Date.now());
  });

  it('LR2 allows ham line tries 4 and 5 and refuses try 6', () => {
    const ham = (after: number, requested = 1) =>
      guards.lineRetryGuard(parsed([...tries(3, BEFORE_RETRY, HAM), ...tries(after, RETRY_START, HAM)]), HAM, requested);
    expect(ham(0)).toEqual({ ok: true, count: 0, max: 2 });
    expect(ham(1)).toEqual({ ok: true, count: 1, max: 2 });
    expect(ham(2)).toEqual({ ok: false, count: 2, max: 2, reason: expect.any(String) });
  });

  it('LR3 allows family line tries 4 to 6 and refuses try 7', () => {
    const family = (after: number, requested = 1) =>
      guards.lineRetryGuard(parsed([...tries(3, BEFORE_RETRY, FAMILY), ...tries(after, RETRY_START, FAMILY)]), FAMILY, requested);
    expect(family(0)).toEqual({ ok: true, count: 0, max: 3 });
    expect(family(2)).toEqual({ ok: true, count: 2, max: 3 });
    expect(family(3)).toEqual({ ok: false, count: 3, max: 3, reason: expect.any(String) });
  });

  it('LR4 refuses a request for two tries after one counted try', () => {
    const rows = parsed([...tries(3, BEFORE_RETRY, HAM), ...tries(1, RETRY_START, HAM)]);
    expect(guards.lineRetryGuard(rows, HAM, 2)).toEqual({ ok: false, count: 1, max: 2, reason: expect.any(String) });
  });

  it('LR5 does not count tries before the retry start and gives null to a row without an entry', () => {
    expect(guards.lineRetryGuard(parsed(tries(3, BEFORE_RETRY, HAM)), HAM, 1)).toEqual({ ok: true, count: 0, max: 2 });
    expect(guards.lineRetryGuard(parsed(tries(6, RETRY_START, TOMATO)), TOMATO, 1)).toBeNull();
  });

  it('LR6 runs the retry rule through runGuards for the two card line rows', () => {
    const root = temp();
    try {
      writeCosts(root, [...tries(3, BEFORE_RETRY, HAM), ...tries(0, RETRY_START, HAM)]);
      expect(runCall(root, HAM, 'line').refused, 'ham try 4').toBe(false);
      writeCosts(root, [...tries(3, BEFORE_RETRY, HAM), ...tries(1, RETRY_START, HAM)]);
      expect(runCall(root, HAM, 'line').refused, 'ham try 5').toBe(false);
      writeCosts(root, [...tries(3, BEFORE_RETRY, HAM), ...tries(2, RETRY_START, HAM)]);
      const hamSix = runCall(root, HAM, 'line');
      expect(hamSix.refused, 'ham try 6').toBe(true);
      expect(hamSix.code).toBe(3);
      expect(hamSix.message).toBe(`refused: ${HAM} line count 2 (max 2)`);

      writeCosts(root, [...tries(3, BEFORE_RETRY, FAMILY), ...tries(2, RETRY_START, FAMILY)]);
      expect(runCall(root, FAMILY, 'line').refused, 'family try 6').toBe(false);
      writeCosts(root, [...tries(3, BEFORE_RETRY, FAMILY), ...tries(3, RETRY_START, FAMILY)]);
      const familySeven = runCall(root, FAMILY, 'line');
      expect(familySeven.refused, 'family try 7').toBe(true);
      expect(familySeven.message).toBe(`refused: ${FAMILY} line count 3 (max 3)`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('LR7 keeps the 3-try rule for the ham color and for every other row', () => {
    const root = temp();
    try {
      writeCosts(root, tries(3, guards.CARD_RUN.startTime, HAM, 'color'));
      const hamColor = runCall(root, HAM, 'color');
      expect(hamColor.refused).toBe(true);
      expect(hamColor.message).toBe(`refused: ${HAM} color count 3 (max 3)`);

      writeCosts(root, tries(3, BEFORE_RETRY, TOMATO));
      const tomatoLine = runCall(root, TOMATO, 'line');
      expect(tomatoLine.refused).toBe(true);
      expect(tomatoLine.message).toBe(`refused: ${TOMATO} line count 3 (max 3)`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('LR8 still refuses a retry line call over the card spend cap', () => {
    const root = temp();
    try {
      writeCosts(root, [costRow(guards.CARD_RUN.startTime, 'existing-card', 'color', 1.595)]);
      const over = runCall(root, HAM, 'line');
      expect(over.refused).toBe(true);
      expect(over.code).toBe(3);
      expect(over.message).toContain('over cap');

      writeCosts(root, [costRow(guards.CARD_RUN.startTime, 'existing-card', 'color', 1.15)]);
      expect(runCall(root, HAM, 'line').refused).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
