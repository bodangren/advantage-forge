// Tests for the Storytime faces-r2 guard class (Faces r2 Step 2b, 2026-11-22).
//
// The guard constant scripts/storytime-muse-guards.mjs FACES_R2_RUN holds the stop of the six
// Muse likeness calls: 0.08 USD, 1 color try per id, and one output folder. The tests cover:
//   - the values of the constant;
//   - the kind `facesR2` of classifyOutDir for exactly one folder, and `invalid` for a sibling,
//     a child, the elements copy folder, or the scene folder;
//   - a faces call that passes the cap with the next call: the guard refuses it;
//   - the 2nd color try of the id: the guard refuses it;
//   - a faces call with an empty or invalid test-only cap: the guard refuses it;
//   - the separate scans: the book and app spend never counts against the faces cap, and the
//     faces spend never counts against the book or app caps (the cover folder is a different
//     production folder with its own scan, so no cover fixture shares a temp root here).
//
// Every test uses a temp folder and a fixture cost file. The classification resolves a
// repo-relative outDir against the repository root, like the muse tool does. A temp unit root
// outside the repository holds the fixture in its `muse` folder. No test makes a provider call.
// No test writes under the real out/ folder.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as guards from '../scripts/storytime-muse-guards.mjs';
import { describe, expect, it } from 'vitest';

const FACES_DIR = 'out/chibi-sprouts/faces-r2/muse';
const FACES_ID = 'faces-r2-lily';
const FACES_FILLER = 'faces-r2-tom';
const U2_DIR = 'out/storytime/l2/unit2';
const U2_ID = 'l2-w09-story-page-i-like-rice-yum';
const FW_DIR = 'out/storytime/l2/unit2/family-words/muse';
const FW_ID = 'l2-fw-faces-r2-fixture-word';
const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';
const BOOK_START = guards.U2_RUN.startTime;
const FW_START = guards.U2_FW_RUN.startTime;
const FACES_CAP = 0.08;

/** A time after the faces start time. The fixture rows must sit at or after that start time. */
const afterFaces = () => new Date(Date.parse(guards.FACES_R2_RUN.startTime) + 60_000).toISOString();

const costRow = (id: string, cost = 0.01, kind = 'color', time?: string) =>
  `${time ?? afterFaces()}\t${id}\tm1\t${kind}\tin\t${id}-m1-${kind}.png\t1500x1500\t${cost}\tok`;
const temp = () => mkdtempSync(path.join(os.tmpdir(), 'storytime-faces-r2-guards-'));
const writeCosts = (root: string, rel: string, rows: string[]) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${HEADER}\n${rows.join('\n')}\n`);
};
const facesCall = (root: string, kind: 'color' | 'line' = 'color', opts: guards.GuardOptions = {}) =>
  guards.runGuards(root, [{ spec: { id: FACES_ID, outDir: FACES_DIR } }], kind, opts);

describe('the faces-r2 class values and classification (FRG1 to FRG3)', () => {
  it('FRG1 holds the cap, the report point, the margin, the try limit, and the folder', () => {
    expect(guards.FACES_R2_RUN.capUsd).toBe(FACES_CAP);
    expect(guards.FACES_R2_RUN.reportAtUsd).toBe(0.06);
    expect(guards.FACES_R2_RUN.marginUsd).toBe(0.01);
    expect(guards.FACES_R2_RUN.maxTries).toBe(1);
    expect(guards.FACES_R2_RUN.outDir).toBe(FACES_DIR);
    expect(guards.FACES_R2_RUN.startTime).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:00Z$/);
  });

  it('FRG2 gives facesR2 for exactly one folder and invalid for a sibling, a child, the elements folder, or the scene folder', () => {
    expect(guards.classifyOutDir({ outDir: FACES_DIR }, '.').kind).toBe('facesR2');
    expect(guards.isFacesR2OutDir(FACES_DIR)).toBe(true);
    expect(guards.isFacesR2OutDir({ outDir: FACES_DIR })).toBe(true);
    const badPaths = [
      'out/chibi-sprouts/faces-r2/muse2',
      'out/chibi-sprouts/faces-r2',
      'out/chibi-sprouts/faces-r2/muse/extra',
      'out/chibi-sprouts/faces-r2/muse/elements',
      'out/chibi-sprouts/faces-r2/scene',
      'out/chibi-sprouts/faces-r1/muse',
    ];
    for (const outDir of badPaths) {
      expect.soft(guards.classifyOutDir({ outDir }, '.').kind, outDir).toBe('invalid');
      expect.soft(guards.isFacesR2OutDir(outDir), outDir).toBe(false);
    }
  });

  it('FRG3 keeps the old kinds and refuses a call that mixes a faces spec with a unit 2 spec', () => {
    expect(guards.classifyOutDir({ outDir: `${U2_DIR}/w09/muse` }, '.').kind).toBe('u2');
    expect(guards.classifyOutDir({ outDir: FW_DIR }, '.').kind).toBe('u2fw');
    const root = temp();
    try {
      const mixed = guards.runGuards(
        root,
        [
          { spec: { id: FACES_ID, outDir: FACES_DIR } },
          { spec: { id: U2_ID, outDir: `${U2_DIR}/w09/muse` } },
        ],
        'color',
      );
      expect(mixed.refused).toBe(true);
      expect(mixed.code).toBe(3);
      expect(mixed.message).toContain('mixes');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('the faces-r2 cap, the try limit, and the test-only cap (FRG4 to FRG6)', () => {
  it('FRG4 refuses a faces call that passes the cap with the next call', () => {
    const root = temp();
    try {
      writeCosts(root, 'muse/costs.tsv', [costRow(FACES_FILLER, 0.075)]);
      const over = facesCall(root);
      expect(over.refused).toBe(true);
      expect(over.code).toBe(3);
      expect(over.run).toBe('facesR2');
      expect(over.message).toContain(`over cap ${FACES_CAP}`);
      expect(over.spend).toBeCloseTo(0.075);

      writeCosts(root, 'muse/costs.tsv', [costRow(FACES_FILLER, 0.06)]);
      const under = facesCall(root);
      expect(under.refused).toBe(false);
      expect(under.run).toBe('facesR2');
      expect(under.reportAt).toBe(0.06);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('FRG5 refuses the 2nd color try of the id', () => {
    const root = temp();
    try {
      writeCosts(root, 'muse/costs.tsv', [costRow(FACES_ID, 0.01)]);
      const over = facesCall(root);
      expect(over.refused).toBe(true);
      expect(over.message).toContain(`${FACES_ID} color count 1 (max 1)`);

      writeCosts(root, 'muse/costs.tsv', []);
      const under = facesCall(root);
      expect(under.refused).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('FRG6 refuses a faces call with an empty or invalid test-only cap', () => {
    const root = temp();
    try {
      for (const cap of [null, 0, -0.01, Number.NaN, '5'] as const) {
        const result = facesCall(root, 'color', { facesR2CapUsd: cap });
        expect.soft(result.refused, `cap ${String(cap)}`).toBe(true);
        expect.soft(result.code, `cap ${String(cap)}`).toBe(3);
        expect.soft(result.run, `cap ${String(cap)}`).toBe('facesR2');
        expect.soft(result.message, `cap ${String(cap)}`).toBe(guards.FACES_R2_CAP_MESSAGE);
      }
      expect(guards.FACES_R2_RUN.capUsd).toBe(FACES_CAP);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('the separate scans of the faces-r2 class (FRG7 to FRG8)', () => {
  it('FRG7 keeps the book and app spend out of the faces cap', () => {
    const root = temp();
    try {
      writeCosts(root, 'w09/muse/costs.tsv', [costRow(U2_ID, 18.32, 'color', BOOK_START)]);
      writeCosts(root, 'family-words/muse/costs.tsv', [costRow(FW_ID, 0.28, 'color', FW_START)]);
      writeCosts(root, 'muse/costs.tsv', [costRow(FACES_FILLER, 0.06)]);
      const faces = facesCall(root);
      expect(faces.refused).toBe(false);
      expect(faces.spend).toBeCloseTo(0.06);

      const book = guards.runGuards(root, [{ spec: { id: U2_ID, outDir: `${U2_DIR}/w09/muse` } }], 'color');
      expect(book.refused).toBe(true);
      expect(book.message).toContain('over cap 18.33');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('FRG8 keeps the faces spend out of the book and app caps', () => {
    const root = temp();
    try {
      writeCosts(root, 'muse/costs.tsv', [costRow(FACES_FILLER, 0.075)]);
      writeCosts(root, 'w09/muse/costs.tsv', [costRow(U2_ID, 0.01, 'color', BOOK_START)]);
      writeCosts(root, 'family-words/muse/costs.tsv', [costRow(FW_ID, 0.01, 'color', FW_START)]);
      const book = guards.runGuards(root, [{ spec: { id: U2_ID, outDir: `${U2_DIR}/w09/muse` } }], 'color');
      expect(book.refused).toBe(false);
      expect(book.spend).toBeCloseTo(0.01);
      const fw = guards.runGuards(root, [{ spec: { id: FW_ID, outDir: FW_DIR } }], 'color');
      expect(fw.refused).toBe(false);
      expect(fw.spend).toBeCloseTo(0.01);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
