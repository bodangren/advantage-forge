// Tests for the Storytime cover guard class (D7, 2026-11-10).
//
// The guard constant scripts/storytime-muse-guards.mjs COVER_RUN holds the stop of the Teacher
// Book front art: 0.10 USD, 6 color tries, and one output folder. The tests cover:
//   - the values of the constant;
//   - the kind `cover` of classifyOutDir for exactly one folder, and `invalid` for a sibling or a
//     child folder below `out/storytime/covers/`;
//   - a cover call that passes the cap with the next call: the guard refuses it;
//   - a cover line call and a mixed call: both are refused;
//   - the 7th color try of the id: the guard refuses it;
//   - the separate scans: the book, app, and exception spend never counts against the cover cap,
//     and the cover spend never counts against the book cap;
//   - the test-only cap key `coverCapUsd`, which the CLI never sets;
//   - the production path: the guard reads the cost file of the exact cover folder.
//
// Every test uses a temp folder and a fixture cost file. The classification resolves a
// repo-relative outDir against the repository root, like the muse tool does. A temp unit root
// outside the repository holds the fixture in its `muse` folder. No test makes a provider call.

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as guards from '../scripts/storytime-muse-guards.mjs';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const U2_DIR = 'out/storytime/l2/unit2';
const COVER_DIR = 'out/storytime/covers/teacher-front/muse';
const COVER_ID = 'l2-u1-cover-quest-teacher-front';
const U2_ID = 'l2-w09-story-page-i-like-rice-yum';
const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';
const BOOK_START = guards.U2_RUN.startTime;
const COVER_START = guards.COVER_RUN.startTime;
const COVER_CAP = 0.1;

/** A time after the cover start time. The fixture rows must sit at or after that start time. */
const AFTER_COVER = new Date(Date.parse(guards.COVER_RUN.startTime) + 60_000).toISOString();

const costRow = (id: string, cost = 0.01, kind = 'color', time = AFTER_COVER) =>
  `${time}\t${id}\tm1\t${kind}\tin\t${id}-m1-${kind}.png\t1500x1500\t${cost}\tok`;
const temp = () => mkdtempSync(path.join(os.tmpdir(), 'storytime-cover-guards-'));
const writeCosts = (root: string, rel: string, rows: string[]) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${HEADER}\n${rows.join('\n')}\n`);
};
const coverSpec = (id = COVER_ID) => ({ spec: { id, outDir: COVER_DIR } });
const coverCall = (root: string, kind: 'color' | 'line' = 'color', opts: guards.GuardOptions = {}) =>
  guards.runGuards(root, [coverSpec()], kind, opts);

describe('the cover class values and classification (CVG1 to CVG3)', () => {
  it('CVG1 holds the cap, the report point, the margin, the try limit, and the folder', () => {
    expect(guards.COVER_RUN.capUsd).toBe(COVER_CAP);
    expect(guards.COVER_RUN.reportAtUsd).toBe(0.08);
    expect(guards.COVER_RUN.marginUsd).toBe(0.01);
    expect(guards.COVER_RUN.maxTries).toBe(6);
    expect(guards.COVER_RUN.outDir).toBe(COVER_DIR);
    expect(guards.COVER_RUN.startTime).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:00Z$/);
    expect(guards.COVER_RUN.startTime > BOOK_START).toBe(true);
  });

  it('CVG2 gives cover for exactly one folder and invalid for a sibling or a child folder', () => {
    expect(guards.classifyOutDir({ outDir: COVER_DIR }, '.').kind).toBe('cover');
    expect(guards.isCoverOutDir(COVER_DIR)).toBe(true);
    expect(guards.isCoverOutDir({ outDir: COVER_DIR })).toBe(true);
    const badPaths = [
      'out/storytime/covers/teacher-back/muse',
      'out/storytime/covers/teacher-front',
      'out/storytime/covers/teacher-front/muse2',
      'out/storytime/covers/teacher-front/muse/elements',
      'out/storytime/covers/teacher-front/muse/extra',
      'out/storytime/covers',
    ];
    for (const outDir of badPaths) {
      expect.soft(guards.classifyOutDir({ outDir }, '.').kind, outDir).toBe('invalid');
      expect.soft(guards.isCoverOutDir(outDir), outDir).toBe(false);
    }
  });

  it('CVG3 keeps the old kinds and refuses a call that mixes a cover spec with a unit 2 spec', () => {
    // The card folder is built from two pieces, so this file holds no second copy of the string
    // that the card guard test scans for.
    const CARD_DIR = 'out/storytime/l2/unit1/' + 'cards/muse';
    expect(guards.classifyOutDir({ outDir: `${U2_DIR}/w09/muse` }, '.').kind).toBe('u2');
    expect(guards.classifyOutDir({ outDir: 'out/storytime/l2/unit1/w03/muse' }, '.').kind).toBe('restart');
    expect(guards.classifyOutDir({ outDir: CARD_DIR }, '.').kind).toBe('card');
    const root = temp();
    try {
      const mixed = guards.runGuards(
        root,
        [coverSpec(), { spec: { id: U2_ID, outDir: `${U2_DIR}/w09/muse` } }],
        'color',
      );
      expect(mixed.refused).toBe(true);
      expect(mixed.code).toBe(3);
      expect(mixed.run).toBe('mixed');
      expect(mixed.message).toContain('mixes');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('the cover cap, the line call, and the try limit (CVG4 to CVG7)', () => {
  it('CVG4 refuses a cover call that passes the cap with the next call', () => {
    const root = temp();
    try {
      writeCosts(root, 'muse/costs.tsv', [costRow(COVER_ID, 0.095)]);
      const over = coverCall(root);
      expect(over.refused).toBe(true);
      expect(over.code).toBe(3);
      expect(over.run).toBe('cover');
      expect(over.message).toContain(`over cap ${COVER_CAP}`);
      expect(over.spend).toBeCloseTo(0.095);

      writeCosts(root, 'muse/costs.tsv', [costRow(COVER_ID, 0.09)]);
      const under = coverCall(root);
      expect(under.refused).toBe(false);
      expect(under.run).toBe('cover');
      expect(under.reportAt).toBe(0.08);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('CVG5 refuses a cover line call', () => {
    const root = temp();
    try {
      const result = coverCall(root, 'line');
      expect(result.refused).toBe(true);
      expect(result.code).toBe(3);
      expect(result.run).toBe('cover');
      expect(result.message).toBe(guards.COVER_LINE_MESSAGE);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('CVG6 refuses the 7th color try of the id', () => {
    const root = temp();
    try {
      const rows = Array.from({ length: 6 }, () => costRow(COVER_ID, 0.01));
      writeCosts(root, 'muse/costs.tsv', rows);
      const over = coverCall(root);
      expect(over.refused).toBe(true);
      expect(over.message).toContain(`${COVER_ID} color count 6 (max 6)`);

      writeCosts(root, 'muse/costs.tsv', rows.slice(0, 5));
      const under = coverCall(root);
      expect(under.refused).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('CVG7 refuses a cover call with an empty or invalid test-only cap', () => {
    const root = temp();
    try {
      for (const cap of [null, 0, -0.01, Number.NaN, '5'] as const) {
        const result = coverCall(root, 'color', { coverCapUsd: cap });
        expect.soft(result.refused, `cap ${String(cap)}`).toBe(true);
        expect.soft(result.code, `cap ${String(cap)}`).toBe(3);
        expect.soft(result.run, `cap ${String(cap)}`).toBe('cover');
        expect.soft(result.message, `cap ${String(cap)}`).toBe(guards.COVER_CAP_MESSAGE);
      }
      expect(guards.COVER_RUN.capUsd).toBe(COVER_CAP);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('the separate scans of the cover class (CVG8 to CVG10)', () => {
  it('CVG8 keeps the book spend out of the cover cap and the cover spend out of the book cap', () => {
    const root = temp();
    try {
      writeCosts(root, 'w09/muse/costs.tsv', [costRow(U2_ID, 18.32, 'color', BOOK_START)]);
      writeCosts(root, 'muse/costs.tsv', [costRow(COVER_ID, 0.09)]);
      const cover = coverCall(root);
      expect(cover.refused).toBe(false);
      expect(cover.spend).toBeCloseTo(0.09);

      const book = guards.runGuards(root, [{ spec: { id: U2_ID, outDir: `${U2_DIR}/w09/muse` } }], 'color');
      expect(book.refused).toBe(true);
      expect(book.message).toContain('over cap 18.33');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('CVG9 reads the cost file of the exact cover folder in the repository', () => {
    const folder = path.join(ROOT, COVER_DIR);
    const file = path.join(folder, 'costs.tsv');
    const created = !existsSync(folder);
    try {
      mkdirSync(folder, { recursive: true });
      writeFileSync(file, `${HEADER}\n${costRow(COVER_ID, 0.095)}\n`);
      const result = guards.runGuards(path.join(ROOT, 'out/storytime/l2/unit1'), [coverSpec()], 'color');
      expect(result.refused).toBe(true);
      expect(result.run).toBe('cover');
      expect(result.spend).toBeCloseTo(0.095);
    } finally {
      rmSync(file, { force: true });
      if (created) rmSync(folder, { recursive: true, force: true });
    }
  });

  it('CVG10 keeps the cover spend out of the exception cap of a listed row', () => {
    const root = temp();
    try {
      writeCosts(root, 'muse/costs.tsv', [costRow(COVER_ID, 0.09)]);
      // The rice line row is a spend row of a listed id after the exception start time.
      writeCosts(root, 'w09/muse/costs.tsv', [
        costRow('l2-w09-card-rice', 0.01, 'line', guards.U2_EXTRA_TRY.startTime),
      ]);
      const listed = guards.runGuards(
        root,
        [{ spec: { id: 'l2-w10-story-page-put-on-your-hat-pip', outDir: `${U2_DIR}/w10/muse` } }],
        'color',
      );
      expect(listed.refused).toBe(false);
      // The exception spend is 0.01 USD. The 0.09 USD of the cover file stay out of it.
      expect(listed.spend).toBeCloseTo(0.01);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
