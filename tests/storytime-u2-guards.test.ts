// Tests for the Storytime Level 2 unit 2 guard entry (D1, 2026-11-08).
//
// The unit 2 constants scripts/storytime-muse-guards.mjs U2_RUN and U2_FW_RUN hold the two caps
// of the PM message of 2026-11-08: 18.33 USD for the book item and 0.29 USD for the app item.
// The tests cover:
//   - the U2_RUN and U2_FW_RUN contracts: a real UTC start time cut to the minute and the caps;
//   - the kind `u2` of classifyOutDir for the 8 week folders and their `elements` folders, the
//     kind `u2fw` for exactly the family-word folder, and `invalid` for every other unit 2 path;
//   - a fixture spend of 18.32 USD in the book folders and 0.28 USD in the app folder: each
//     refuses the next call of its own kind;
//   - the separate scans: book spend does not count for the app, and the reverse;
//   - the empty-cap refusal with code 3 and the exact message, for a null, zero, negative, NaN,
//     and string cap, for both kinds through the test-only options;
//   - the refusal of a mixed call;
//   - the unchanged unit 1 and card behavior, including the byte-equal CARD_RUN and
//     CARD_LINE_RETRY blocks.
//
// Every test uses a temp unit root. The classification resolves a repo-relative outDir against
// the repository root, like the muse tool does. No test makes a provider call.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as guards from '../scripts/storytime-muse-guards.mjs';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const U2_DIR = 'out/storytime/l2/unit2';
const FW_DIR = 'out/storytime/l2/unit2/family-words/muse';
const FW_PARENT = 'out/storytime/l2/unit2/family-words';
const U2_ID = 'l2-w09-story-page-i-like-rice-yum';
const FW_ID = 'l2-w10-family-hat';
const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';
// The card values are built from two pieces, so this file holds no second copy of the frozen
// strings that the CG3 and ADVC20 scans look for.
const CARD_DIR = 'out/storytime/l2/unit1/' + 'cards/muse';
const CARD_START_TEXT = '2026-11-06' + 'T00:00:00Z';
const CARD_RETRY_START_TEXT = '2026-11-07' + 'T02:00:00Z';
const CARD_LIMIT = 1.6;
const CARD_POINT = 0.8;
const CARD_MARGIN = 0.01;
const CARD_MAX_TRIES = 3;
const UNIT1_DIR = 'out/storytime/l2/unit1/w03/muse';
const START = guards.U2_RUN.startTime;
const AT_START = '2026-11-08T05:21:00Z';
const FW_START = guards.U2_FW_RUN.startTime;
const BOOK_CAP = 18.33;
const APP_CAP = 0.29;

const costRow = (id = U2_ID, cost = 0.01, kind = 'color', time = START) =>
  `${time}\t${id}\tm1\t${kind}\tin\t${id}-m1-${kind}.png\t1500x1500\t${cost}\tok`;
const temp = () => mkdtempSync(path.join(os.tmpdir(), 'storytime-u2-guards-'));
const writeCosts = (root: string, rel: string, rows: string[]) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${HEADER}\n${rows.join('\n')}\n`);
};
const u2Spec = (week: string, sub = 'muse', id = U2_ID) => ({ spec: { id, outDir: `${U2_DIR}/${week}/${sub}` } });
const u2Call = (root: string, week = 'w09', sub = 'muse', opts: guards.GuardOptions = {}) =>
  guards.runGuards(root, [u2Spec(week, sub)], 'color', opts);
const fwSpec = (id = FW_ID) => ({ spec: { id, outDir: FW_DIR } });
const fwCall = (root: string, opts: guards.GuardOptions = {}) =>
  guards.runGuards(root, [fwSpec()], 'color', opts);

/** The source text of one exported constant block of the guard module. */
const sourceBlock = (name: string) => {
  const source = readFileSync(path.join(ROOT, 'scripts/storytime-muse-guards.mjs'), 'utf8');
  const start = source.indexOf(`export const ${name} = `);
  expect(start, `${name} is exported`).toBeGreaterThanOrEqual(0);
  const blockEnd = source.indexOf('\n};', start);
  const lineEnd = source.indexOf(';\n', start);
  if (lineEnd >= 0 && (blockEnd < 0 || lineEnd < blockEnd)) return source.slice(start, lineEnd + 1);
  expect(blockEnd, `${name} has a block end`).toBeGreaterThan(start);
  return source.slice(start, blockEnd + '\n};'.length);
};

describe('unit 2 guard contract (U2G1 to U2G3)', () => {
  it('U2G1 holds the real start times cut to the minute and the two caps', () => {
    expect(guards.U2_RUN).toEqual({
      startTime: AT_START,
      capUsd: BOOK_CAP,
      reportAtUsd: 14.66,
      marginUsd: 0.01,
      maxTries: 3,
      unitRoot: U2_DIR,
    });
    expect(guards.U2_RUN.startTime).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:00Z$/);
    expect(guards.U2_FW_RUN).toEqual({
      startTime: FW_START,
      capUsd: APP_CAP,
      reportAtUsd: 0.23,
      marginUsd: 0.01,
      maxTries: 3,
      outDir: FW_DIR,
    });
    expect(guards.U2_FW_RUN.startTime).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:00Z$/);
    expect(guards.U2_WEEKS).toEqual(['w09', 'w10', 'w11', 'w12', 'w13', 'w14', 'w15', 'w16']);
    expect(guards.U2_CAP_MESSAGE).toBe(
      'refused: the unit 2 cap is empty; the PM writes the approved limit in U2_RUN.capUsd',
    );
    expect(guards.U2_FW_CAP_MESSAGE).toBe(
      'refused: the unit 2 family-word cap is empty; the PM writes the approved limit in U2_FW_RUN.capUsd',
    );
  });

  it('U2G2 classifies the 8 week folders and their elements folders as u2, and the family-word folder as u2fw', () => {
    for (const week of guards.U2_WEEKS) {
      expect.soft(guards.classifyOutDir({ outDir: `${U2_DIR}/${week}/muse` }, '.'), week).toEqual(
        expect.objectContaining({ kind: 'u2' }),
      );
      expect
        .soft(guards.classifyOutDir({ outDir: `${U2_DIR}/${week}/muse/elements` }, '.'), `${week} elements`)
        .toEqual(expect.objectContaining({ kind: 'u2' }));
      expect.soft(guards.isUnit2OutDir(`${U2_DIR}/${week}/muse`), `${week} path helper`).toBe(true);
      expect.soft(guards.isUnit2OutDir({ outDir: `${U2_DIR}/${week}/muse/elements` }), `${week} spec helper`).toBe(true);
      expect.soft(guards.isUnit2FwOutDir(`${U2_DIR}/${week}/muse`), `${week} is not the app folder`).toBe(false);
    }
    expect(guards.classifyOutDir({ outDir: FW_DIR }, '.')).toEqual(expect.objectContaining({ kind: 'u2fw' }));
    expect(guards.isUnit2FwOutDir(FW_DIR)).toBe(true);
    expect(guards.isUnit2FwOutDir({ outDir: FW_DIR })).toBe(true);
    expect(guards.isUnit2OutDir(FW_DIR)).toBe(false);
    expect(guards.classifyOutDir({}, '.').kind).toBe('restart');
  });

  it('U2G3 gives invalid for every other unit 2 path', () => {
    const badPaths = [
      `${U2_DIR}/w01/muse`,
      `${U2_DIR}/w08/muse`,
      `${U2_DIR}/w17/muse`,
      `${U2_DIR}/muse`,
      `${U2_DIR}/w09`,
      `${U2_DIR}/w09/muse2`,
      `${U2_DIR}/w09/muse/elements2`,
      `${U2_DIR}/w09/muse/extra`,
      `${U2_DIR}/w09/cards/muse`,
      `${U2_DIR}/w09/muse/../../../../tmp/storytime-u2-outside`,
      `${U2_DIR}/family-words`,
      `${U2_DIR}/family-words/muse/elements`,
      `${U2_DIR}/family-words/muse2`,
      `${U2_DIR}/family-words/muse/extra`,
      `${U2_DIR}/family-words/muse/../../../../tmp/storytime-u2-outside`,
    ];
    for (const outDir of badPaths) {
      expect.soft(guards.classifyOutDir({ outDir }, '.').kind, outDir).toBe('invalid');
      expect.soft(guards.isUnit2OutDir(outDir), outDir).toBe(false);
      expect.soft(guards.isUnit2FwOutDir(outDir), outDir).toBe(false);
    }
  });
});

describe('unit 2 caps, scans, and empty-cap refusal (U2G4 to U2G6, U2G12, U2G13)', () => {
  it('U2G4 refuses the next book call at 18.32 USD and the next app call at 0.28 USD', () => {
    const root = temp();
    try {
      writeCosts(root, 'w09/muse/costs.tsv', [costRow(U2_ID, 18.32)]);
      const book = u2Call(root);
      expect(book.refused).toBe(true);
      expect(book.code).toBe(3);
      expect(book.run).toBe('u2');
      expect(book.message).toContain(`over cap ${BOOK_CAP}`);

      writeCosts(root, 'family-words/muse/costs.tsv', [costRow(FW_ID, 0.28, 'color', FW_START)]);
      const app = fwCall(root);
      expect(app.refused).toBe(true);
      expect(app.code).toBe(3);
      expect(app.run).toBe('u2fw');
      expect(app.message).toContain(`over cap ${APP_CAP}`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2G13 lets a call under each committed cap pass', () => {
    const root = temp();
    try {
      // 18.31 + 0.01 is at or under 18.33; the projection 18.31 + 0.02 is not over.
      writeCosts(root, 'w09/muse/costs.tsv', [costRow(U2_ID, 18.31)]);
      const book = u2Call(root);
      expect(book.refused).toBe(false);
      expect(book.run).toBe('u2');
      expect(book.reportAt).toBe(14.66);
      expect(book.notice).toBe(true);

      // 0.26 + 0.01 is at or under 0.29; the projection 0.26 + 0.02 is not over.
      writeCosts(root, 'family-words/muse/costs.tsv', [costRow(FW_ID, 0.26, 'color', FW_START)]);
      const app = fwCall(root);
      expect(app.refused).toBe(false);
      expect(app.run).toBe('u2fw');
      expect(app.reportAt).toBe(0.23);
      expect(app.notice).toBe(true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2G5 refuses null, zero, negative, NaN, and string caps of both kinds', () => {
    const root = temp();
    try {
      for (const cap of [null, 0, -0.01, Number.NaN, '5'] as const) {
        const book = u2Call(root, 'w09', 'muse', { u2CapUsd: cap });
        expect.soft(book.refused, `book cap ${String(cap)}`).toBe(true);
        expect.soft(book.code, `book cap ${String(cap)}`).toBe(3);
        expect.soft(book.run, `book cap ${String(cap)}`).toBe('u2');
        expect.soft(book.message, `book cap ${String(cap)}`).toBe(guards.U2_CAP_MESSAGE);
        const app = fwCall(root, { u2FwCapUsd: cap });
        expect.soft(app.refused, `app cap ${String(cap)}`).toBe(true);
        expect.soft(app.code, `app cap ${String(cap)}`).toBe(3);
        expect.soft(app.run, `app cap ${String(cap)}`).toBe('u2fw');
        expect.soft(app.message, `app cap ${String(cap)}`).toBe(guards.U2_FW_CAP_MESSAGE);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2G6 reads only the unit 2 week cost files, not a unit 1 week', () => {
    const root = temp();
    try {
      // A unit 1 style week and a unit 2 week. The unit 2 scan reads only w09 to w16.
      writeCosts(root, 'w01/muse/costs.tsv', [costRow('l2-w01-check-row-dog', 0.5)]);
      writeCosts(root, 'w09/muse/costs.tsv', [costRow()]);
      writeCosts(root, 'w09/muse/elements/costs.tsv', [costRow('set-classroom-lunch-table', 0.02)]);
      const result = u2Call(root, 'w09', 'muse');
      expect(result.refused).toBe(false);
      expect(result.run).toBe('u2');
      expect(result.spend).toBeCloseTo(0.03);
      expect(guards.U2_RUN.capUsd).toBe(BOOK_CAP);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2G12 keeps the book and app scans separate, and the app scan starts at U2_FW_RUN.startTime', () => {
    const root = temp();
    try {
      writeCosts(root, 'w09/muse/costs.tsv', [costRow(U2_ID, 0.02)]);
      writeCosts(root, 'w09/muse/elements/costs.tsv', [costRow('set-classroom-lunch-table', 0.01)]);
      writeCosts(root, 'family-words/muse/costs.tsv', [
        // Before the app start time: never counted.
        costRow(FW_ID, 0.25, 'color', '2026-11-08T13:38:59Z'),
        costRow(FW_ID, 0.01, 'color', FW_START),
      ]);
      const book = u2Call(root);
      expect(book.refused).toBe(false);
      expect(book.spend).toBeCloseTo(0.03);
      const app = fwCall(root);
      expect(app.refused).toBe(false);
      expect(app.spend).toBeCloseTo(0.01);
      // The app folder alone refuses at 0.28 even while the book folders are empty.
      const appRoot = temp();
      try {
        writeCosts(appRoot, 'family-words/muse/costs.tsv', [costRow(FW_ID, 0.28, 'color', FW_START)]);
        expect(fwCall(appRoot).refused).toBe(true);
        expect(u2Call(appRoot).refused).toBe(false);
      } finally {
        rmSync(appRoot, { recursive: true, force: true });
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('unit 2 mixed calls and the unchanged unit 1 and card behavior (U2G7 to U2G11)', () => {
  it('U2G7 refuses a call that mixes unit 2 or family-word specs with other specs', () => {
    const root = temp();
    const u2 = u2Spec('w09');
    const fw = fwSpec();
    const restart = { spec: { id: 'l2-w03-story-page-x', outDir: UNIT1_DIR } };
    const card = { spec: { id: 'l2-w04-card-mom', outDir: CARD_DIR } };
    try {
      const cases = [
        [u2, restart],
        [restart, u2],
        [u2, card],
        [card, u2],
        [fw, restart],
        [restart, fw],
        [fw, card],
        [card, fw],
        [fw, u2],
        [u2, fw],
      ];
      for (const ctxs of cases) {
        const result = guards.runGuards(root, ctxs, 'color');
        expect.soft(result.refused, ctxs.map((c) => c.spec.outDir).join(' + ')).toBe(true);
        expect.soft(result.code).toBe(3);
        expect.soft(result.run).toBe('mixed');
        expect.soft(result.message).toContain('mixes');
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2G8 keeps the restart and card classification', () => {
    expect.soft(guards.classifyOutDir({ outDir: UNIT1_DIR }, '.').kind).toBe('restart');
    expect.soft(guards.classifyOutDir({ outDir: `${UNIT1_DIR}/elements` }, '.').kind).toBe('restart');
    expect.soft(guards.classifyOutDir({ outDir: CARD_DIR }, '.').kind).toBe('card');
    expect.soft(guards.classifyOutDir({ outDir: `${CARD_DIR}/elements` }, '.').kind).toBe('invalid');
    expect.soft(guards.classifyOutDir({}, '.').kind).toBe('restart');
  });

  it('U2G9 keeps the CARD_RUN and CARD_LINE_RETRY blocks byte equal', () => {
    expect(sourceBlock('CARD_RUN')).toBe(`export const CARD_RUN = {
  startTime: '${CARD_START_TEXT}',
  capUsd: ${CARD_LIMIT},
  reportAtUsd: ${CARD_POINT},
  marginUsd: ${CARD_MARGIN},
  maxTries: ${CARD_MAX_TRIES},
  outDir: '${CARD_DIR}',
};`);
    expect(sourceBlock('CARD_LINE_RETRY_START')).toBe(
      `export const CARD_LINE_RETRY_START = '${CARD_RETRY_START_TEXT}';`,
    );
    expect(sourceBlock('CARD_LINE_RETRY')).toBe(`export const CARD_LINE_RETRY = {
  startTime: CARD_LINE_RETRY_START,
  rows: {
    'l2-w04-card-ham': 2,
    'l2-w04-card-family': 3,
  },
};`);
    expect(guards.RESTART_START).toBe('2026-11-04T07:54:00Z');
    expect(guards.MAX_TRIES).toBe(3);
    expect(guards.SPEND_CAP_USD).toBe(1.0);
  });

  it('U2G11 keeps the test-only cap keys away from the CLI guard options and the CLI', () => {
    expect(guards.cliGuardOptions({ u2CapUsd: 99, u2FwCapUsd: 99, tries: 2 })).toEqual({ tries: 2 });
    expect(Object.hasOwn(guards.cliGuardOptions({ u2CapUsd: 99 }), 'u2CapUsd')).toBe(false);
    expect(Object.hasOwn(guards.cliGuardOptions({ u2FwCapUsd: 99 }), 'u2FwCapUsd')).toBe(false);

    const home = temp();
    const specDir = temp();
    const createdRoot = !existsSync(path.join(ROOT, U2_DIR));
    const createdFw = !existsSync(path.join(ROOT, FW_PARENT));
    const u2File = path.join(specDir, 'u2-cap-option.json');
    const fwFile = path.join(specDir, 'fw-cap-option.json');
    writeFileSync(
      u2File,
      JSON.stringify({ id: U2_ID, outDir: `${U2_DIR}/w09/muse`, colorPrompt: 'a story page' }),
    );
    writeFileSync(fwFile, JSON.stringify({ id: FW_ID, outDir: FW_DIR, colorPrompt: 'a card picture' }));
    try {
      const cases: Array<[string, string]> = [
        [u2File, '--u2CapUsd'],
        [fwFile, '--u2FwCapUsd'],
      ];
      for (const [specFile, flag] of cases) {
        const run = spawnSync(process.execPath, ['scripts/storytime-muse.mjs', 'color', specFile, flag, '99'], {
          cwd: ROOT,
          env: { PATH: process.env.PATH ?? '', HOME: home },
          encoding: 'utf8',
        });
        const output = `${run.stdout}${run.stderr}`;
        // The guard passed, so the CLI reaches the key read: the option set no cap.
        expect(run.status, output).toBe(1);
        expect(output, output).toMatch(/error: /);
        expect(output).not.toContain('over cap 99');
        expect(output).not.toContain(guards.U2_CAP_MESSAGE);
        expect(output).not.toContain(guards.U2_FW_CAP_MESSAGE);
      }
      expect(guards.U2_RUN.capUsd).toBe(BOOK_CAP);
      expect(guards.U2_FW_RUN.capUsd).toBe(APP_CAP);
    } finally {
      if (createdRoot) rmSync(path.join(ROOT, U2_DIR), { recursive: true, force: true });
      if (createdFw) rmSync(path.join(ROOT, FW_PARENT), { recursive: true, force: true });
      rmSync(specDir, { recursive: true, force: true });
      rmSync(home, { recursive: true, force: true });
    }
  });

  it('U2G10 routes a unit 2 family-word CLI spec to the guard before key access', () => {
    const home = temp();
    const specDir = temp();
    const createdFw = !existsSync(path.join(ROOT, FW_PARENT));
    const specFile = path.join(specDir, 'fw-spec.json');
    writeFileSync(specFile, JSON.stringify({ id: FW_ID, outDir: FW_DIR, colorPrompt: 'a card picture' }));
    try {
      const run = spawnSync(process.execPath, ['scripts/storytime-muse.mjs', 'color', specFile], {
        cwd: ROOT,
        env: { PATH: process.env.PATH ?? '', HOME: home },
        encoding: 'utf8',
      });
      const output = `${run.stdout}${run.stderr}`;
      // The family-word spec is not refused as an outside folder, so it reaches the key read.
      expect(run.status, output).toBe(1);
      expect(output).not.toContain('outside the scanned cost folders');
      expect(output).not.toContain(guards.U2_FW_CAP_MESSAGE);
    } finally {
      if (createdFw) rmSync(path.join(ROOT, FW_PARENT), { recursive: true, force: true });
      rmSync(specDir, { recursive: true, force: true });
      rmSync(home, { recursive: true, force: true });
    }
  });
});
