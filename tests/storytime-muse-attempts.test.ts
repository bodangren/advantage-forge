// Green tests for the Storytime Muse restart guards (T3a, 2026-11-04).
//
// The guards live in scripts/storytime-muse-guards.mjs and run inside
// scripts/storytime-muse.mjs before any provider call. The tests cover the pure functions and
// the runGuards decision:
//   - 3 tries of a picture and kind are allowed; the 4th is refused with code 3 and no call;
//   - a failed 0-cost row does not count;
//   - rows before the restart start time do not count;
//   - the 1.00 USD spend refusal;
//   - the 0.50 USD notice.
//
// Fixtures build costs.tsv text in a temp unit root. A fixture cost row:
//   time \t row \t m1 \t color \t in \t out \t 1920x1280 \t 0.01 \t ok

import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  RESTART_START,
  MAX_TRIES,
  countTries,
  spendTotal,
  tryGuard,
  spendGuard,
  runGuards,
  pictureKey,
  parseCostsTsv,
} from '../scripts/storytime-muse-guards.mjs';

const ts = (hms) => `2026-11-04T${hms}.000Z`;
const row = (time, id, kind, cost = 0.01, note = 'ok', output = 'l2-x-m1-color.png') =>
  `${time}\t${id}\tm1\t${kind}\tin\t${output}\t1920x1280\t${cost}\t${note}`;

let root;
beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'muse-guards-'));
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const writeCosts = (rel, lines) => {
  const p = path.join(root, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, `time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote\n${lines.join('\n')}\n`);
};

const specOf = (id) => ({ spec: { id } });
const rowsOf = (lines) => parseCostsTsv(`time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote\n${lines.join('\n')}\n`);

describe('countTries', () => {
  it('counts only rows at or after the restart start, of the kind, of the picture', () => {
    const rows = rowsOf([
      row('2026-11-04T07:53:00', 'l2-w01-story-page-a-nest', 'color'), // before start: no
      row('2026-11-04T07:54:01', 'l2-w01-story-page-a-nest', 'color'),
      row('2026-11-04T07:55:00', 'l2-w01-story-page-a-nest', 'line'), // other kind: no
      row('2026-11-04T07:56:00', 'l2-w01-story-page-a-nut', 'color'), // other picture: no
      row('2026-11-04T08:00:00', 'l2-w01-story-page-a-nest', 'color'),
    ]);
    expect(countTries(rows, 'l2-w01-story-page-a-nest', 'color')).toBe(2);
  });

  it('counts a row inside the first second after the restart start', () => {
    const rows = rowsOf([row('2026-11-04T07:54:00.250Z', 'l2-w01-story-page-a-nest', 'color')]);
    expect(countTries(rows, 'l2-w01-story-page-a-nest', 'color')).toBe(1);
  });

  it('does not count a failed row with usage_cost 0', () => {
    const rows = rowsOf([
      row('2026-11-04T07:54:01', 'l2-w01-story-page-a-nest', 'color', 0, 'HTTP 429: over quota', 'none'),
      row('2026-11-04T07:55:00', 'l2-w01-story-page-a-nest', 'color'),
    ]);
    expect(countTries(rows, 'l2-w01-story-page-a-nest', 'color')).toBe(1);
  });

  it('counts a 0-cost row with a non-failed note', () => {
    const rows = rowsOf([row('2026-11-04T07:54:01', 'l2-w01-story-page-a-nest', 'color', 0, 'ok')]);
    expect(countTries(rows, 'l2-w01-story-page-a-nest', 'color')).toBe(1);
  });

  it('counts a two-id picture as one picture (nose)', () => {
    const rows = rowsOf([
      row('2026-11-04T07:54:01', 'l2-w01-practice-line-nose', 'color'),
      row('2026-11-04T07:55:00', 'l2-w01-check-row-nose', 'color'),
    ]);
    expect(pictureKey('l2-w01-check-row-nose')).toBe('l2-w01-practice-line-nose');
    expect(countTries(rows, 'l2-w01-practice-line-nose', 'color')).toBe(2);
    expect(countTries(rows, 'l2-w01-check-row-nose', 'color')).toBe(2);
  });

  it('counts the ostrich as one picture under its own id', () => {
    const rows = rowsOf([
      row('2026-11-04T07:54:01', 'l2-w07-check-row-ostrich', 'color'),
      row('2026-11-04T07:55:00', 'l2-w07-check-row-ostrich', 'color'),
      row('2026-11-04T07:56:00', 'l2-w07-check-row-ostrich', 'line'),
    ]);
    expect(pictureKey('l2-w07-check-row-ostrich')).toBe('l2-w07-check-row-ostrich');
    expect(countTries(rows, 'l2-w07-check-row-ostrich', 'color')).toBe(2);
    expect(countTries(rows, 'l2-w07-check-row-ostrich', 'line')).toBe(1);
  });

  it('keeps the old olive and week 8 ostrich ids out of every group', () => {
    expect(pictureKey('l2-w07-check-row-olive')).toBe('l2-w07-check-row-olive');
    expect(pictureKey('l2-w08-check-row-ostrich')).toBe('l2-w08-check-row-ostrich');
  });
});

describe('tryGuard', () => {
  it('allows up to 3 tries', () => {
    const two = rowsOf([row('2026-11-04T07:54:01', 'l2-w01-story-page-a-nest', 'color'), row('2026-11-04T07:55:00', 'l2-w01-story-page-a-nest', 'color')]);
    expect(tryGuard(two, 'l2-w01-story-page-a-nest', 'color').ok).toBe(true); // 2 + 1 = 3
    expect(tryGuard([], 'l2-w01-story-page-a-nest', 'color', MAX_TRIES).ok).toBe(true); // 0 + 3 = 3
  });

  it('refuses the 4th try', () => {
    const three = rowsOf([
      row('2026-11-04T07:54:01', 'l2-w01-story-page-a-nest', 'color'),
      row('2026-11-04T07:55:00', 'l2-w01-story-page-a-nest', 'color'),
      row('2026-11-04T07:56:00', 'l2-w01-story-page-a-nest', 'color'),
    ]);
    const g = tryGuard(three, 'l2-w01-story-page-a-nest', 'color');
    expect(g.ok).toBe(false);
    expect(g.count).toBe(3);
  });

  it('refuses when the requested tries would pass 3', () => {
    const two = rowsOf([row('2026-11-04T07:54:01', 'l2-w01-story-page-a-nest', 'color'), row('2026-11-04T07:55:00', 'l2-w01-story-page-a-nest', 'color')]);
    expect(tryGuard(two, 'l2-w01-story-page-a-nest', 'color', 2).ok).toBe(false); // 2 + 2 = 4
  });

  it('ignores failed 0-cost rows and rows before the start', () => {
    const rows = rowsOf([
      row('2026-11-04T07:53:00', 'l2-w01-story-page-a-nest', 'color'), // before start
      row('2026-11-04T07:54:01', 'l2-w01-story-page-a-nest', 'color', 0, 'HTTP 429: over quota', 'none'), // failed
      row('2026-11-04T07:55:00', 'l2-w01-story-page-a-nest', 'color'),
    ]);
    expect(tryGuard(rows, 'l2-w01-story-page-a-nest', 'color').ok).toBe(true); // only 1 counts
  });
});

describe('spendGuard', () => {
  it('refuses when the sum plus 0.01 is more than 1.00 USD', () => {
    const rows = rowsOf([row('2026-11-04T07:54:01', 'l2-w01-story-page-a-nest', 'color', 1.0), row('2026-11-04T07:55:00', 'l2-w01-story-page-a-nest', 'color', 0.01)]);
    const g = spendGuard(rows);
    expect(g.ok).toBe(false);
    expect(g.spend).toBe(1.01);
  });

  it('allows a sum that keeps the margin under the cap', () => {
    const rows = rowsOf([row('2026-11-04T07:54:01', 'l2-w01-story-page-a-nest', 'color', 0.99)]);
    const g = spendGuard(rows);
    expect(g.ok).toBe(true); // 0.99 + 0.01 = 1.00, not more than 1.00
  });

  it('refuses a sum of exactly 1.00 USD', () => {
    const rows = rowsOf([row('2026-11-04T07:54:01', 'l2-w01-story-page-a-nest', 'color', 1.0)]);
    const g = spendGuard(rows);
    expect(g.ok).toBe(false); // 1.00 + 0.01 = 1.01, more than 1.00
  });

  it('prints the notice at 0.50 USD', () => {
    const rows = rowsOf([row('2026-11-04T07:54:01', 'l2-w01-story-page-a-nest', 'color', 0.5)]);
    const g = spendGuard(rows);
    expect(g.ok).toBe(true);
    expect(g.notice).toBe(true);
  });

  it('sums every row since the start, including failed rows and element rows', () => {
    const rows = rowsOf([
      row('2026-11-04T07:53:00', 'x', 'color', 0.9), // before start: no
      row('2026-11-04T07:54:01', 'x', 'color', 0, 'HTTP 429', 'none'), // failed but still costs 0
      row('2026-11-04T07:55:00', 'prop-sheet', 'color', 0.3), // element-like row
    ]);
    expect(spendTotal(rows)).toBe(0.3);
  });
});

describe('runGuards over a fixture unit root', () => {
  it('allows a picture with 2 tries and no spend', () => {
    writeCosts('w01/muse/costs.tsv', [
      row(ts('07:54:01'), 'l2-w01-story-page-a-nest', 'color'),
      row(ts('07:55:00'), 'l2-w01-story-page-a-nest', 'color'),
    ]);
    const g = runGuards(root, [specOf('l2-w01-story-page-a-nest')], 'color');
    expect(g.refused).toBe(false); // the 3rd try is still allowed
    expect(g.spend).toBe(0.02);
  });

  it('refuses a 4th try with code 3 and a refused: line, and makes no call', () => {
    writeCosts('w01/muse/costs.tsv', [
      row(ts('07:54:01'), 'l2-w01-story-page-a-nest', 'color'),
      row(ts('07:55:00'), 'l2-w01-story-page-a-nest', 'color'),
      row(ts('07:56:00'), 'l2-w01-story-page-a-nest', 'color'),
      row(ts('07:57:00'), 'l2-w01-story-page-a-nest', 'color'),
    ]);
    const g = runGuards(root, [specOf('l2-w01-story-page-a-nest')], 'color');
    expect(g.refused).toBe(true);
    expect(g.code).toBe(3);
    expect(g.message).toMatch(/^refused: l2-w01-story-page-a-nest color count 4/);
  });

  it('refuses a 4th line try', () => {
    writeCosts('w01/muse/costs.tsv', [
      row(ts('07:54:01'), 'l2-w01-story-page-a-nest', 'line'),
      row(ts('07:55:00'), 'l2-w01-story-page-a-nest', 'line'),
      row(ts('07:56:00'), 'l2-w01-story-page-a-nest', 'line'),
    ]);
    const g = runGuards(root, [specOf('l2-w01-story-page-a-nest')], 'line');
    expect(g.refused).toBe(true);
    expect(g.message).toMatch(/^refused: l2-w01-story-page-a-nest line count 3/);
  });

  it('refuses on spend with code 3 and a refused: line with the sum', () => {
    writeCosts('w01/muse/costs.tsv', [row(ts('07:54:01'), 'l2-w01-story-page-a-nest', 'color', 1.01)]);
    const g = runGuards(root, [specOf('l2-w01-story-page-a-nest')], 'color');
    expect(g.refused).toBe(true);
    expect(g.code).toBe(3);
    expect(g.message).toMatch(/^refused: spend 1\.0100 USD plus 0\.01 over cap 1/);
  });

  it('gives the notice at 0.50 USD', () => {
    writeCosts('w01/muse/costs.tsv', [row(ts('07:54:01'), 'l2-w01-story-page-a-nest', 'color', 0.5)]);
    const g = runGuards(root, [specOf('l2-w01-story-page-a-nest')], 'color');
    expect(g.refused).toBe(false);
    expect(g.notice).toBe(true);
  });

  it('counts element sheet rows for spend but not for tries', () => {
    writeCosts('w01/muse/costs.tsv', [row(ts('07:54:01'), 'l2-w01-story-page-a-nest', 'color', 0.01)]);
    writeCosts('w01/muse/elements/costs.tsv', [row(ts('07:55:00'), 'prop-milk-sheet', 'color', 0.49)]);
    const g = runGuards(root, [specOf('l2-w01-story-page-a-nest')], 'color');
    expect(g.refused).toBe(false);
    expect(g.spend).toBe(0.5);
    expect(g.notice).toBe(true);
  });

  it('does not count rows before the restart start', () => {
    writeCosts('w01/muse/costs.tsv', [
      row('2026-11-04T07:53:00', 'l2-w01-story-page-a-nest', 'color'),
      row('2026-11-04T07:53:30', 'l2-w01-story-page-a-nest', 'color'),
      row('2026-11-04T07:54:01', 'l2-w01-story-page-a-nest', 'color'),
    ]);
    const g = runGuards(root, [specOf('l2-w01-story-page-a-nest')], 'color');
    expect(g.refused).toBe(false); // 1 counts, 2 more allowed
    expect(g.spend).toBe(0.01);
  });

  it('refuses a line run whose requested tries would pass 3', () => {
    writeCosts('w01/muse/costs.tsv', [
      row(ts('07:54:01'), 'l2-w01-story-page-a-nest', 'line'),
      row(ts('07:55:00'), 'l2-w01-story-page-a-nest', 'line'),
    ]);
    const g = runGuards(root, [specOf('l2-w01-story-page-a-nest')], 'line', { tries: 2 });
    expect(g.refused).toBe(true);
    expect(g.code).toBe(3);
  });
});
