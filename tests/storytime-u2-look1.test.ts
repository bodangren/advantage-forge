// Tests for the Storytime Level 2 unit 2 look1 track (D3, D4, 2026-11-11).
//
// The guard constant scripts/storytime-muse-guards.mjs U2_LOOK_TRY holds the exception of the PM:
// the T-shirt row of the look1 track gets 3 color tries and 3 line tries, with its own cap of
// 0.10 USD. The spec file of the T-shirt holds the new prompt text of D3. The tests cover:
//   - LK1: the values of the constant and the PM words in the sources;
//   - LK2: 3 color tries pass and the fourth is refused, with the old color row ignored;
//   - LK3: 3 line tries pass and the fourth is refused, with the 2 old line rows ignored;
//   - LK4: a failed call at 0 USD counts as a try;
//   - LK5: an id that is not listed keeps the normal rule;
//   - LK6: the spend plus the margin over 0.10 USD is refused, and the exact cap passes;
//   - LK7: the rows before the start time do not count;
//   - LK8: the book cap of `U2_RUN.capUsd` still refuses a listed call;
//   - LK9: the look spend and the extra try spend do not count against each other;
//   - LK10: the notice prints at 0.08 USD;
//   - LK11: an empty or invalid test-only cap refuses a call;
//   - LK12: cliGuardOptions removes the test-only cap key;
//   - LK13: the old constants keep their values of commit 7b346f43;
//   - LK14: a pool of the listed id and one unlisted id;
//   - LK15: the spec edit of D3.
//
// Every test uses a temp unit root and a fixture cost file. A test never writes a real cost file.
// No test makes a provider call.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as guards from '../scripts/storytime-muse-guards.mjs';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const U2_DIR = 'out/storytime/l2/unit2';
const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';
const TSHIRT = 'l2-w10-story-page-put-on-your-t-shirt';
const HAT_PIP = 'l2-w10-story-page-put-on-your-hat-pip';
const CARD_TSHIRT = 'l2-w10-card-t-shirt';
const RICE = 'l2-w09-card-rice';
const BOOK_START = guards.U2_RUN.startTime;
const LOOK_START = guards.U2_LOOK_TRY.startTime;
const EXTRA_START = guards.U2_EXTRA_TRY.startTime;
const LOOK_CAP = 0.1;
const BOOK_CAP = 18.33;

/** A time before the look start and after the book start. The rows of that time do not count. */
const BEFORE_LOOK = '2026-11-10T20:00:00Z';

/** The note of a call that failed on a network fault at 0 USD. */
const FAULT = 'network error: UND_ERR_CONNECT_TIMEOUT';

const costRow = (id: string, cost = 0.01, kind = 'color', time = BEFORE_LOOK, note = 'ok') =>
  `${time}\t${id}\tm1\t${kind}\tin\t${id}-m1-${kind}.png\t1500x1500\t${cost}\t${note}`;
const temp = () => mkdtempSync(path.join(os.tmpdir(), 'storytime-u2-look1-'));
const writeCosts = (root: string, rel: string, rows: string[]) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${HEADER}\n${rows.join('\n')}\n`);
};
const u2Spec = (id: string, week = 'w10') => ({ spec: { id, outDir: `${U2_DIR}/${week}/muse` } });
const u2Call = (
  root: string,
  id: string,
  week = 'w10',
  kind: 'color' | 'line' = 'color',
  opts: guards.GuardOptions = {},
) => guards.runGuards(root, [u2Spec(id, week)], kind, opts);

/** The new goal of D3. */
const NEW_GOAL =
  'Ben (drawn young, about five years old) is in the middle of putting on a big yellow T-shirt next to the same dress-up box: his head and both arms are through the yellow T-shirt, and both of his hands pull it down over his body, with a big smile.';

/** The 3 new texts of the color prompt of D3. */
const NEW_COLOR = [
  "Do not change Ben's hair, shorts, or sneakers.",
  'a white vest that shows under the yellow T-shirt, dark-blue shorts, grey sneakers',
  'The picture: ' +
    NEW_GOAL +
    ' The big yellow T-shirt is the clear focus of the picture, and it is plainly yellow. A white vest shows under the hem of the T-shirt, so no bare skin of his body shows. Ben wears exactly one T-shirt: the yellow one. In picture 1 Ben wears a light-blue T-shirt; do not draw that light-blue T-shirt in this picture. Ben has no hood, no cap, and no second cloth over his head or on his shoulders.',
];

/** The 3 old texts of the color prompt of D3. */
const OLD_COLOR = [
  "Do not change anyone's hair or clothes.",
  'a light-blue T-shirt, dark-blue shorts, grey sneakers',
  'The picture: Ben (drawn young, about five years old) pulls a big yellow T-shirt on over his clothes next to the same dress-up box, with a big smile.',
];

/** The new sentence of the line prompt of D3. */
const NEW_LINE =
  "Keep the exact pose of picture 1: Ben's head and both arms are through the yellow T-shirt, and both hands hold the T-shirt hem and pull it down over his body. He wears one T-shirt only, drawn as one closed shape with its neck opening and its two sleeves, and a vest hem as one closed band under it. Draw no cap, no hood, and no waving hands.";

/** The path of the T-shirt spec file. */
const SPEC_FILE = path.join(ROOT, 'docs/storytime/l2-unit2/w10/muse/l2-w10-story-page-put-on-your-t-shirt.json');

describe('the values of the look exception (LK1)', () => {
  it('LK1 holds the cap, the report point, the margin, the 2 rows, and the PM words', () => {
    expect(guards.U2_LOOK_TRY.capUsd).toBe(LOOK_CAP);
    expect(guards.U2_LOOK_TRY.reportAtUsd).toBe(0.08);
    expect(guards.U2_LOOK_TRY.marginUsd).toBe(0.01);
    expect(guards.U2_LOOK_TRY.startTime).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:00Z$/);
    expect(guards.U2_LOOK_TRY.startTime > BOOK_START).toBe(true);
    const rows = guards.U2_LOOK_TRY.rows;
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect.soft(row.id, row.kind).toBe(TSHIRT);
      expect.soft(row.allowedTries, row.kind).toBe(3);
      expect.soft(['color', 'line'], row.kind).toContain(row.kind);
      expect.soft(row.source, row.kind).toContain('PM ORDER');
      expect.soft(row.source, row.kind).toContain('paid stop 0.10 USD');
      expect.soft(row.source, row.kind).toContain(TSHIRT);
    }
    expect(rows.map((row) => row.kind)).toEqual(['color', 'line']);
  });
});

describe('the try rule of the look exception (LK2 to LK5)', () => {
  it('LK2 allows 3 color tries and refuses the fourth, with the old color row ignored', () => {
    const root = temp();
    try {
      const old = costRow(TSHIRT, 0.01, 'color', BEFORE_LOOK);
      for (const tries of [0, 1, 2]) {
        const rows = [old];
        for (let i = 0; i < tries; i += 1) rows.push(costRow(TSHIRT, 0.01, 'color', LOOK_START));
        writeCosts(root, 'w10/muse/costs.tsv', rows);
        const result = u2Call(root, TSHIRT);
        expect.soft(result.refused, `tries ${tries}`).toBe(false);
        expect.soft(result.code, `tries ${tries}`).toBe(0);
        expect.soft(result.run, `tries ${tries}`).toBe('u2');
      }
      const rows = [old];
      for (let i = 0; i < 3; i += 1) rows.push(costRow(TSHIRT, 0.01, 'color', LOOK_START));
      writeCosts(root, 'w10/muse/costs.tsv', rows);
      const fourth = u2Call(root, TSHIRT);
      expect(fourth.refused).toBe(true);
      expect(fourth.code).toBe(3);
      expect(fourth.message).toContain(`${TSHIRT} color already has 3 tries`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('LK3 allows 3 line tries and refuses the fourth, with the 2 old line rows ignored', () => {
    const root = temp();
    try {
      const old = [
        costRow(TSHIRT, 0.01, 'line', BEFORE_LOOK),
        costRow(TSHIRT, 0.01, 'line', BEFORE_LOOK),
      ];
      for (const tries of [0, 1, 2]) {
        const rows = [...old];
        for (let i = 0; i < tries; i += 1) rows.push(costRow(TSHIRT, 0.01, 'line', LOOK_START));
        writeCosts(root, 'w10/muse/costs.tsv', rows);
        const result = u2Call(root, TSHIRT, 'w10', 'line');
        expect.soft(result.refused, `tries ${tries}`).toBe(false);
        expect.soft(result.code, `tries ${tries}`).toBe(0);
      }
      const rows = [...old];
      for (let i = 0; i < 3; i += 1) rows.push(costRow(TSHIRT, 0.01, 'line', LOOK_START));
      writeCosts(root, 'w10/muse/costs.tsv', rows);
      const fourth = u2Call(root, TSHIRT, 'w10', 'line');
      expect(fourth.refused).toBe(true);
      expect(fourth.message).toContain(`${TSHIRT} line already has 3 tries`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('LK4 counts a failed call at 0 USD as a try', () => {
    const root = temp();
    try {
      writeCosts(root, 'w10/muse/costs.tsv', [
        costRow(TSHIRT, 0.01, 'color', LOOK_START),
        costRow(TSHIRT, 0.01, 'color', LOOK_START),
        costRow(TSHIRT, 0, 'color', LOOK_START, FAULT),
      ]);
      const result = u2Call(root, TSHIRT);
      expect(result.refused).toBe(true);
      expect(result.code).toBe(3);
      expect(result.message).toContain(`${TSHIRT} color already has 3 tries`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('LK5 keeps the normal rule for an id that is not listed', () => {
    const root = temp();
    try {
      writeCosts(root, 'w10/muse/costs.tsv', [
        costRow(CARD_TSHIRT, 0.01, 'color', BEFORE_LOOK),
        costRow(CARD_TSHIRT, 0.01, 'color', BEFORE_LOOK),
        costRow(CARD_TSHIRT, 0.01, 'color', BEFORE_LOOK),
      ]);
      const refused = u2Call(root, CARD_TSHIRT);
      expect(refused.refused).toBe(true);
      expect(refused.code).toBe(3);
      expect(refused.message).toContain(`${CARD_TSHIRT} color count 3 (max 3)`);
      // The empty look cap does not touch an id that is not listed.
      const withEmptyCap = u2Call(root, CARD_TSHIRT, 'w10', 'color', { u2LookCapUsd: 0 });
      expect(withEmptyCap.refused).toBe(true);
      expect(withEmptyCap.message).toContain(`${CARD_TSHIRT} color count 3 (max 3)`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('the spend rule of the look exception (LK6 to LK10)', () => {
  it('LK6 refuses a spend plus the margin over 0.10 USD and allows the exact cap', () => {
    const root = temp();
    try {
      writeCosts(root, 'w10/muse/costs.tsv', [costRow(TSHIRT, 0.095, 'color', LOOK_START)]);
      const over = u2Call(root, TSHIRT);
      expect(over.refused).toBe(true);
      expect(over.code).toBe(3);
      expect(over.message).toContain('over cap 0.1');
      expect(over.reportAt).toBe(0.08);
      expect(over.spend).toBeCloseTo(0.095);

      // 0.09 plus one margin of 0.01 lands on the cap, so the call passes.
      writeCosts(root, 'w10/muse/costs.tsv', [costRow(TSHIRT, 0.09, 'color', LOOK_START)]);
      const exact = u2Call(root, TSHIRT);
      expect(exact.refused).toBe(false);
      expect(exact.code).toBe(0);
      expect(exact.spend).toBeCloseTo(0.09);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('LK7 counts no row before the start time against the cap or the try rule', () => {
    const root = temp();
    try {
      writeCosts(root, 'w10/muse/costs.tsv', [costRow(TSHIRT, 0.145, 'color', BEFORE_LOOK)]);
      const result = u2Call(root, TSHIRT);
      expect(result.refused).toBe(false);
      expect(result.spend).toBeCloseTo(0);
      expect(result.notice).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('LK8 keeps the book cap for a listed call', () => {
    const root = temp();
    try {
      writeCosts(root, 'w10/muse/costs.tsv', [costRow(TSHIRT, 0.04, 'color', LOOK_START)]);
      const result = u2Call(root, TSHIRT, 'w10', 'color', { u2CapUsd: 0.05 });
      expect(result.refused).toBe(true);
      expect(result.code).toBe(3);
      expect(result.message).toContain('over cap 0.05');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('LK9 keeps the look spend and the extra try spend apart', () => {
    const root = temp();
    try {
      writeCosts(root, 'w10/muse/costs.tsv', [costRow(TSHIRT, 0.09, 'color', LOOK_START)]);
      writeCosts(root, 'w09/muse/costs.tsv', [costRow(RICE, 0.13, 'line', EXTRA_START)]);
      // The look spend does not count against the extra try pool.
      const hatPip = u2Call(root, HAT_PIP, 'w10', 'color');
      expect(hatPip.refused).toBe(false);
      expect(hatPip.spend).toBeCloseTo(0.13);
      // The extra try spend does not count against the look pool.
      const shirt = u2Call(root, TSHIRT);
      expect(shirt.refused).toBe(false);
      expect(shirt.spend).toBeCloseTo(0.09);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('LK10 prints the notice at 0.08 USD of look spend', () => {
    const root = temp();
    try {
      writeCosts(root, 'w10/muse/costs.tsv', [costRow(TSHIRT, 0.08, 'color', LOOK_START)]);
      const at = u2Call(root, TSHIRT);
      expect(at.refused).toBe(false);
      expect(at.notice).toBe(true);
      expect(at.reportAt).toBe(0.08);

      writeCosts(root, 'w10/muse/costs.tsv', [costRow(TSHIRT, 0.07, 'color', LOOK_START)]);
      const under = u2Call(root, TSHIRT);
      expect(under.refused).toBe(false);
      expect(under.notice).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('the test-only cap key of the look exception (LK11, LK12)', () => {
  it('LK11 refuses a call of the listed id with an empty or invalid test-only cap', () => {
    const root = temp();
    try {
      for (const cap of [null, 0, -0.01, Number.NaN, '5'] as const) {
        const result = u2Call(root, TSHIRT, 'w10', 'color', { u2LookCapUsd: cap });
        expect.soft(result.refused, `cap ${String(cap)}`).toBe(true);
        expect.soft(result.code, `cap ${String(cap)}`).toBe(3);
        expect.soft(result.message, `cap ${String(cap)}`).toBe(guards.U2_LOOK_CAP_MESSAGE);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('LK12 keeps the test-only cap key away from the CLI guard options', () => {
    expect(guards.cliGuardOptions({ u2LookCapUsd: 99, u2ExtraCapUsd: 99, coverCapUsd: 99, tries: 2 })).toEqual({
      tries: 2,
    });
    expect(Object.hasOwn(guards.cliGuardOptions({ u2LookCapUsd: 99 }), 'u2LookCapUsd')).toBe(false);
  });
});

describe('the old values and the pool of the look exception (LK13, LK14)', () => {
  it('LK13 keeps the values of the old constants of commit 7b346f43', () => {
    expect(guards.U2_RUN.startTime).toBe('2026-11-08T05:21:00Z');
    expect(guards.U2_RUN.capUsd).toBe(BOOK_CAP);
    expect(guards.U2_RUN.reportAtUsd).toBe(14.66);
    expect(guards.U2_RUN.marginUsd).toBe(0.01);
    expect(guards.U2_RUN.maxTries).toBe(3);
    expect(guards.U2_RUN.unitRoot).toBe('out/storytime/l2/unit2');

    expect(guards.U2_FW_RUN.startTime).toBe('2026-11-08T13:39:00Z');
    expect(guards.U2_FW_RUN.capUsd).toBe(0.29);
    expect(guards.U2_FW_RUN.reportAtUsd).toBe(0.23);
    expect(guards.U2_FW_RUN.marginUsd).toBe(0.01);
    expect(guards.U2_FW_RUN.maxTries).toBe(3);
    expect(guards.U2_FW_RUN.outDir).toBe('out/storytime/l2/unit2/family-words/muse');

    expect(guards.U2_EXTRA_TRY.startTime).toBe('2026-11-10T08:57:00Z');
    expect(guards.U2_EXTRA_TRY.capUsd).toBe(0.15);
    expect(guards.U2_EXTRA_TRY.reportAtUsd).toBe(0.12);
    expect(guards.U2_EXTRA_TRY.marginUsd).toBe(0.01);
    expect(
      guards.U2_EXTRA_TRY.rows.map((row) => [row.id, row.kind, row.pastLimit, row.netRetry ?? false, row.allowedTries ?? 1]),
    ).toEqual([
      [HAT_PIP, 'color', true, true, 1],
      [HAT_PIP, 'line', false, false, 2],
      ['l2-w09-story-page-tom-can-see-the-mop', 'line', true, true, 1],
      [RICE, 'line', true, true, 1],
      ['l2-w12-card-hippo', 'line', true, false, 1],
      ['l2-w12-card-ruler', 'line', true, false, 1],
      ['l2-w13-card-clap', 'line', true, false, 1],
      ['l2-w13-card-throw', 'line', true, false, 1],
      ['l2-w14-card-cold', 'line', true, false, 1],
      ['l2-w14-card-windy', 'line', true, false, 1],
    ]);

    expect(guards.COVER_RUN.startTime).toBe('2026-11-10T08:57:00Z');
    expect(guards.COVER_RUN.capUsd).toBe(0.1);
    expect(guards.COVER_RUN.reportAtUsd).toBe(0.08);
    expect(guards.COVER_RUN.marginUsd).toBe(0.01);
    expect(guards.COVER_RUN.maxTries).toBe(6);
    expect(guards.COVER_RUN.outDir).toBe('out/storytime/covers/teacher-front/muse');

    expect(createHash('sha256').update(JSON.stringify(guards.CARD_RUN)).digest('hex')).toBe(
      '1a2748085b89afdb0968d2cc6ae394b891bad8779f48817d8fd543186bf7a403',
    );
    expect(guards.CARD_RUN.capUsd).toBe(1.6);
    expect(guards.CARD_RUN.reportAtUsd).toBe(0.8);
    expect(guards.CARD_RUN.marginUsd).toBe(0.01);
    expect(guards.CARD_RUN.maxTries).toBe(3);

    expect(guards.CARD_LINE_RETRY.startTime).toBe('2026-11-07T02:00:00Z');
    expect(guards.CARD_LINE_RETRY.rows['l2-w04-card-ham']).toBe(2);
    expect(guards.CARD_LINE_RETRY.rows['l2-w04-card-family']).toBe(3);

    expect(guards.TRY_EXCEPTIONS.map((row) => [row.id, row.kind, row.extraTries])).toEqual([
      ['l2-w01-story-page-a-nut', 'line', 1],
      ['l2-w01-story-page-a-nut', 'color', 1],
      ['l2-w01-story-page-a-nut', 'line', 1],
    ]);
  });

  it('LK14 refuses a pool of the listed id and an unlisted id, and keeps the normal rule alone', () => {
    const root = temp();
    try {
      const rows = [
        costRow(TSHIRT, 0.01, 'color', LOOK_START),
        costRow(TSHIRT, 0.01, 'color', LOOK_START),
        costRow(TSHIRT, 0.01, 'color', LOOK_START),
      ];
      writeCosts(root, 'w10/muse/costs.tsv', rows);
      const pool = guards.runGuards(
        root,
        [u2Spec(TSHIRT, 'w10'), u2Spec(CARD_TSHIRT, 'w10')],
        'color',
      );
      expect(pool.refused).toBe(true);
      expect(pool.code).toBe(3);
      expect(pool.message).toContain(`${TSHIRT} color already has 3 tries`);

      const alone = u2Call(root, CARD_TSHIRT);
      expect(alone.refused).toBe(false);
      expect(alone.code).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('the spec edit of D3 (LK15)', () => {
  it('LK15 holds the new goal, the new color prompt, and the new line prompt', () => {
    const raw = readFileSync(SPEC_FILE, 'utf8');
    const spec = JSON.parse(raw) as Record<string, unknown>;
    expect(Object.keys(spec)).toEqual([
      'id',
      'text',
      'goal',
      'references',
      'colorPrompt',
      'linePrompt',
      'print',
      'aspect',
      'outDir',
      'sizeClass',
      'use',
      'set',
      'props',
      'reuse',
      'donorFiles',
    ]);
    expect(spec.goal).toBe(NEW_GOAL);
    for (const text of NEW_COLOR) expect(String(spec.colorPrompt)).toContain(text);
    for (const text of OLD_COLOR) expect(String(spec.colorPrompt)).not.toContain(text);
    expect(String(spec.linePrompt).endsWith(NEW_LINE)).toBe(true);
    expect(raw).not.toContain('over his clothes');
    expect(raw).not.toContain('a light-blue T-shirt, dark-blue shorts');

    // Every other field keeps its value of commit 7b346f43.
    expect(spec.id).toBe(TSHIRT);
    expect(spec.text).toBe('Put on your T-shirt.');
    expect(spec.references).toEqual([
      'out/storytime/l2/unit1/w01/muse/elements/ben-ref-clean-2.png',
      'out/storytime/l2/unit2/w10/muse/elements/set-classroom-dress-up-corner-m1-color.png',
    ]);
    expect(spec.print).toBe('crop');
    expect(spec.aspect).toBe('4:3');
    expect(spec.outDir).toBe('out/storytime/l2/unit2/w10/muse');
    expect(spec.sizeClass).toBe('A');
    expect(spec.use).toBe('story-page');
    expect(spec.set).toBe('set-classroom-dress-up-corner');
    expect(spec.props).toEqual([]);
    expect(spec.reuse).toBeNull();
    expect(spec.donorFiles).toEqual({
      rule: 'docs/storytime/l2-unit1/w07/muse/l2-w07-story-page-run-tom-run.json',
      line: 'docs/storytime/l2-unit1/w07/muse/l2-w07-story-page-run-tom-run.json',
      cast: ['docs/storytime/l2-unit1/cards/l2-w05-card-sad.json'],
      scene: 'pictures-u2.json (Workbooks row prompt)',
    });
  });
});
