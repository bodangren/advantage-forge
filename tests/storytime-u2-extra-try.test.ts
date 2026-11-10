// Tests for the Storytime Level 2 extra try exception (D1, 2026-11-10).
//
// The guard constant scripts/storytime-muse-guards.mjs U2_EXTRA_TRY holds the written exception
// of the PM: 9 unit 2 book rows get one extra try each, and the pool has its own cap of 0.15 USD.
// The tests cover:
//   - the values of the constant and the 10 rows of the 9 ids, with the PM words in each source;
//   - a try 4 of an id that is not listed: the normal rule of 3 tries refuses it;
//   - a second extra try of a listed id and kind: the once rule refuses it;
//   - a wrong kind: a color try 4 of rice and a line try 4 of hat-pip are refused;
//   - an exception spend that passes the cap with the next call: the exception refuses it;
//   - rows before the start time: they count against neither the exception cap nor the once rule;
//   - the book cap of 18.33 USD: it still refuses a call of a listed row;
//   - the hat-pip line call after the new color: it is allowed once and it counts against the cap.
//
// Every test uses a temp unit root and a fixture cost file. The classification resolves a
// repo-relative outDir against the repository root, like the muse tool does. No test makes a
// provider call.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as guards from '../scripts/storytime-muse-guards.mjs';
import { describe, expect, it } from 'vitest';

const U2_DIR = 'out/storytime/l2/unit2';
const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';
const HAT_PIP = 'l2-w10-story-page-put-on-your-hat-pip';
const RICE = 'l2-w09-card-rice';
const TOM_MOP = 'l2-w09-story-page-tom-can-see-the-mop';
const UNLISTED = 'l2-w09-story-page-i-like-rice-yum';
const BOOK_START = guards.U2_RUN.startTime;
const EXTRA_START = guards.U2_EXTRA_TRY.startTime;
const EXTRA_CAP = 0.15;
const BOOK_CAP = 18.33;

/** The day before the exception start, inside the book run. */
const BEFORE_EXTRA = '2026-11-09T08:00:00Z';

const costRow = (id: string, cost = 0.01, kind = 'color', time = BEFORE_EXTRA, note = 'ok') =>
  `${time}\t${id}\tm1\t${kind}\tin\t${id}-m1-${kind}.png\t1500x1500\t${cost}\t${note}`;
const temp = () => mkdtempSync(path.join(os.tmpdir(), 'storytime-u2-extra-try-'));
const writeCosts = (root: string, rel: string, rows: string[]) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${HEADER}\n${rows.join('\n')}\n`);
};
const u2Spec = (id: string, week = 'w10') => ({ spec: { id, outDir: `${U2_DIR}/${week}/muse` } });
const u2Call = (root: string, id: string, week = 'w10', kind: 'color' | 'line' = 'color', opts: guards.GuardOptions = {}) =>
  guards.runGuards(root, [u2Spec(id, week)], kind, opts);

describe('the extra try exception values (U2X1 to U2X3)', () => {
  it('U2X1 holds the cap, the report point, the margin, and a start time cut to the minute', () => {
    expect(guards.U2_EXTRA_TRY.capUsd).toBe(EXTRA_CAP);
    expect(guards.U2_EXTRA_TRY.reportAtUsd).toBe(0.12);
    expect(guards.U2_EXTRA_TRY.marginUsd).toBe(0.01);
    expect(guards.U2_EXTRA_TRY.startTime).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:00Z$/);
    expect(guards.U2_EXTRA_TRY.startTime > BOOK_START).toBe(true);
  });

  it('U2X2 holds 10 rows for 9 ids, with the PM words in every source', () => {
    const rows = guards.U2_EXTRA_TRY.rows;
    expect(rows).toHaveLength(10);
    const ids = new Set(rows.map((row) => row.id));
    expect(ids.size).toBe(9);
    expect([...ids].sort()).toEqual(
      [
        HAT_PIP,
        TOM_MOP,
        RICE,
        'l2-w12-card-hippo',
        'l2-w12-card-ruler',
        'l2-w13-card-clap',
        'l2-w13-card-throw',
        'l2-w14-card-cold',
        'l2-w14-card-windy',
      ].sort(),
    );
    for (const row of rows) {
      expect.soft(row.source, row.id).toContain('PM 2026-11-10');
      expect.soft(row.source, row.id).toContain('PM 2026-11-09');
      expect.soft(['color', 'line'], row.id).toContain(row.kind);
      expect.soft(typeof row.pastLimit, row.id).toBe('boolean');
    }
    const hatPipColor = rows.find((row) => row.id === HAT_PIP && row.kind === 'color')!;
    const hatPipLine = rows.find((row) => row.id === HAT_PIP && row.kind === 'line')!;
    expect(hatPipColor.pastLimit).toBe(true);
    expect(hatPipLine.pastLimit).toBe(false);
    for (const row of rows) {
      if (row.id === HAT_PIP) continue;
      expect.soft(row.kind, row.id).toBe('line');
      expect.soft(row.pastLimit, row.id).toBe(true);
    }
  });

  it('U2X3 keeps the values of the old runs', () => {
    expect(guards.U2_RUN.capUsd).toBe(BOOK_CAP);
    expect(guards.U2_RUN.maxTries).toBe(3);
    expect(guards.U2_FW_RUN.capUsd).toBe(0.29);
    expect(guards.CARD_RUN.capUsd).toBe(1.6);
    expect(guards.CARD_LINE_RETRY.rows['l2-w04-card-ham']).toBe(2);
  });
});

describe('the extra try rules (U2X4 to U2X10)', () => {
  it('U2X4 refuses a try 4 of an id that is not listed', () => {
    const root = temp();
    try {
      writeCosts(root, 'w09/muse/costs.tsv', [
        costRow(UNLISTED),
        costRow(UNLISTED),
        costRow(UNLISTED),
      ]);
      const result = u2Call(root, UNLISTED, 'w09');
      expect(result.refused).toBe(true);
      expect(result.code).toBe(3);
      expect(result.run).toBe('u2');
      expect(result.message).toContain(`${UNLISTED} color count 3 (max 3)`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2X5 refuses a second extra try of a listed id and kind', () => {
    const root = temp();
    try {
      writeCosts(root, 'w10/muse/costs.tsv', [
        costRow(HAT_PIP),
        costRow(HAT_PIP),
        costRow(HAT_PIP),
        // The new color try after the exception start time.
        costRow(HAT_PIP, 0.03, 'color', EXTRA_START),
      ]);
      const result = u2Call(root, HAT_PIP);
      expect(result.refused).toBe(true);
      expect(result.code).toBe(3);
      expect(result.message).toContain(`${HAT_PIP} color already has 1 try`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2X6 refuses a wrong kind: a color try 4 of rice and a line try 4 of hat-pip', () => {
    const root = temp();
    try {
      writeCosts(root, 'w09/muse/costs.tsv', [costRow(RICE), costRow(RICE), costRow(RICE)]);
      writeCosts(root, 'w10/muse/costs.tsv', [costRow(HAT_PIP, 0.01, 'line'), costRow(HAT_PIP, 0.01, 'line'), costRow(HAT_PIP, 0.01, 'line')]);
      const rice = u2Call(root, RICE, 'w09');
      expect.soft(rice.refused).toBe(true);
      expect.soft(rice.message).toContain(`${RICE} color count 3 (max 3)`);
      const hatPip = u2Call(root, HAT_PIP, 'w10', 'line');
      expect.soft(hatPip.refused).toBe(true);
      expect.soft(hatPip.message).toContain(`${HAT_PIP} line count 3 (max 3)`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2X7 refuses an exception spend that passes the cap with the next call', () => {
    const root = temp();
    try {
      // The rice line row is a spend row of a listed id after the start time.
      writeCosts(root, 'w09/muse/costs.tsv', [costRow(RICE, 0.145, 'line', EXTRA_START)]);
      const over = u2Call(root, HAT_PIP);
      expect(over.refused).toBe(true);
      expect(over.code).toBe(3);
      expect(over.message).toContain('over cap 0.15');
      expect(over.reportAt).toBe(0.12);
      expect(over.spend).toBeCloseTo(0.145);

      // 0.14 plus one margin of 0.01 stays at the cap, so the call passes.
      writeCosts(root, 'w09/muse/costs.tsv', [costRow(RICE, 0.14, 'line', EXTRA_START)]);
      const under = u2Call(root, HAT_PIP);
      expect(under.refused).toBe(false);
      expect(under.run).toBe('u2');
      expect(under.spend).toBeCloseTo(0.14);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2X8 counts no row before the start time against the cap or the once rule', () => {
    const root = temp();
    try {
      writeCosts(root, 'w09/muse/costs.tsv', [costRow(RICE, 0.145, 'line', BEFORE_EXTRA)]);
      writeCosts(root, 'w10/muse/costs.tsv', [costRow(HAT_PIP, 0.02, 'color', BEFORE_EXTRA)]);
      const result = u2Call(root, HAT_PIP);
      expect(result.refused).toBe(false);
      expect(result.spend).toBeCloseTo(0);
      expect(result.notice).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2X9 keeps the book cap of 18.33 USD for a listed row', () => {
    const root = temp();
    try {
      writeCosts(root, 'w10/muse/costs.tsv', [costRow(HAT_PIP, 18.32, 'color', BOOK_START)]);
      const result = u2Call(root, HAT_PIP);
      expect(result.refused).toBe(true);
      expect(result.code).toBe(3);
      expect(result.message).toContain(`over cap ${BOOK_CAP}`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2X10 allows the hat-pip line call once after the new color, and counts it against the cap', () => {
    const root = temp();
    try {
      writeCosts(root, 'w10/muse/costs.tsv', [
        // The line try of the archived run, before the exception start time.
        costRow(HAT_PIP, 0.02, 'line', BEFORE_EXTRA),
        // The new color try after the exception start time.
        costRow(HAT_PIP, 0.03, 'color', EXTRA_START),
      ]);
      const first = u2Call(root, HAT_PIP, 'w10', 'line');
      expect(first.refused).toBe(false);
      expect(first.run).toBe('u2');
      expect(first.spend).toBeCloseTo(0.03);
      expect(first.reportAt).toBe(0.12);

      // The second line call of the same id and kind is refused by the once rule.
      writeCosts(root, 'w10/muse/costs.tsv', [
        costRow(HAT_PIP, 0.02, 'line', BEFORE_EXTRA),
        costRow(HAT_PIP, 0.03, 'color', EXTRA_START),
        costRow(HAT_PIP, 0.02, 'line', EXTRA_START),
      ]);
      const second = u2Call(root, HAT_PIP, 'w10', 'line');
      expect(second.refused).toBe(true);
      expect(second.message).toContain(`${HAT_PIP} line already has 1 try`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('the test-only cap keys of the exception (U2X11, U2X12)', () => {
  it('U2X11 keeps the test-only cap key away from the CLI guard options', () => {
    expect(guards.cliGuardOptions({ u2ExtraCapUsd: 99, coverCapUsd: 99, tries: 2 })).toEqual({ tries: 2 });
    expect(Object.hasOwn(guards.cliGuardOptions({ u2ExtraCapUsd: 99 }), 'u2ExtraCapUsd')).toBe(false);
    expect(Object.hasOwn(guards.cliGuardOptions({ coverCapUsd: 99 }), 'coverCapUsd')).toBe(false);
  });

  it('U2X12 refuses a call of a listed row with an empty or invalid test-only cap', () => {
    const root = temp();
    try {
      for (const cap of [null, 0, -0.01, Number.NaN, '5'] as const) {
        const result = u2Call(root, HAT_PIP, 'w10', 'color', { u2ExtraCapUsd: cap });
        expect.soft(result.refused, `cap ${String(cap)}`).toBe(true);
        expect.soft(result.code, `cap ${String(cap)}`).toBe(3);
        expect.soft(result.message, `cap ${String(cap)}`).toBe(guards.U2_EXTRA_CAP_MESSAGE);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
