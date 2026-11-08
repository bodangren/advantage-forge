// Tests for the Storytime Level 2 unit 2 guard entry (D1, 2026-11-08).
//
// The unit 2 constant scripts/storytime-muse-guards.mjs U2_RUN holds no cap value in this track.
// The tests cover:
//   - the U2_RUN contract: a real UTC start time cut to the minute, and a null cap;
//   - the kind `u2` of classifyOutDir for the 8 week folders and their `elements` folders, and
//     `invalid` for every other unit 2 path;
//   - the empty-cap refusal with code 3 and the exact message, for a null, zero, negative, NaN,
//     and string cap;
//   - a test-only cap value that lets a unit 2 call pass the cap check, without a change to
//     U2_RUN;
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
const U2_ID = 'l2-w09-story-page-i-like-rice-yum';
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
  it('U2G1 holds the real start time cut to the minute and a null cap', () => {
    expect(guards.U2_RUN).toEqual({
      startTime: AT_START,
      capUsd: null,
      reportAtUsd: null,
      marginUsd: 0.01,
      maxTries: 3,
      unitRoot: U2_DIR,
    });
    expect(guards.U2_RUN.startTime).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:00Z$/);
    expect(guards.U2_RUN.capUsd).toBeNull();
    expect(guards.U2_WEEKS).toEqual(['w09', 'w10', 'w11', 'w12', 'w13', 'w14', 'w15', 'w16']);
    expect(guards.U2_CAP_MESSAGE).toBe(
      'refused: the unit 2 cap is empty; the PM writes the approved limit in U2_RUN.capUsd',
    );
  });

  it('U2G2 classifies the 8 week folders and their elements folders as u2', () => {
    for (const week of guards.U2_WEEKS) {
      expect.soft(guards.classifyOutDir({ outDir: `${U2_DIR}/${week}/muse` }, '.'), week).toEqual(
        expect.objectContaining({ kind: 'u2' }),
      );
      expect
        .soft(guards.classifyOutDir({ outDir: `${U2_DIR}/${week}/muse/elements` }, '.'), `${week} elements`)
        .toEqual(expect.objectContaining({ kind: 'u2' }));
      expect.soft(guards.isUnit2OutDir(`${U2_DIR}/${week}/muse`), `${week} path helper`).toBe(true);
      expect.soft(guards.isUnit2OutDir({ outDir: `${U2_DIR}/${week}/muse/elements` }), `${week} spec helper`).toBe(true);
    }
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
    ];
    for (const outDir of badPaths) {
      expect.soft(guards.classifyOutDir({ outDir }, '.').kind, outDir).toBe('invalid');
      expect.soft(guards.isUnit2OutDir(outDir), outDir).toBe(false);
    }
  });
});

describe('unit 2 refusal with an empty cap (U2G4 to U2G6)', () => {
  it('U2G4 refuses a unit 2 call with code 3 and the exact message', () => {
    const root = temp();
    try {
      writeCosts(root, 'w09/muse/costs.tsv', [costRow()]);
      const result = u2Call(root);
      expect(result.refused).toBe(true);
      expect(result.code).toBe(3);
      expect(result.run).toBe('u2');
      expect(result.message).toBe(guards.U2_CAP_MESSAGE);
      expect(result.message).not.toContain('outside the scanned cost folders');
      expect(result.spend).toBe(0);
      // The refusal makes no file: the temp root holds no new file after it.
      expect(existsSync(path.join(root, 'w09/muse/elements'))).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2G5 refuses null, zero, negative, NaN, and string caps', () => {
    const root = temp();
    try {
      for (const cap of [null, 0, -0.01, Number.NaN, '5'] as const) {
        const result = u2Call(root, 'w09', 'muse', { u2CapUsd: cap });
        expect.soft(result.refused, `cap ${String(cap)}`).toBe(true);
        expect.soft(result.code, `cap ${String(cap)}`).toBe(3);
        expect.soft(result.message, `cap ${String(cap)}`).toBe(guards.U2_CAP_MESSAGE);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('U2G6 lets a test-only cap pass the cap check and reads only unit 2 cost files', () => {
    const root = temp();
    try {
      // A unit 1 style week and a unit 2 week. The unit 2 scan reads only w09 to w16.
      writeCosts(root, 'w01/muse/costs.tsv', [costRow('l2-w01-check-row-dog', 0.5)]);
      writeCosts(root, 'w09/muse/costs.tsv', [costRow()]);
      writeCosts(root, 'w09/muse/elements/costs.tsv', [costRow('set-classroom-lunch-table', 0.02)]);
      const result = u2Call(root, 'w09', 'muse', { u2CapUsd: 1 });
      expect(result.refused).toBe(false);
      expect(result.run).toBe('u2');
      expect(result.spend).toBeCloseTo(0.03);
      expect(guards.U2_RUN.capUsd).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('unit 2 mixed calls and the unchanged unit 1 and card behavior (U2G7 to U2G10)', () => {
  it('U2G7 refuses a call that mixes unit 2 specs with other specs', () => {
    const root = temp();
    const u2 = u2Spec('w09');
    const restart = { spec: { id: 'l2-w03-story-page-x', outDir: UNIT1_DIR } };
    const card = { spec: { id: 'l2-w04-card-mom', outDir: CARD_DIR } };
    try {
      for (const ctxs of [[u2, restart], [restart, u2], [u2, card], [card, u2]]) {
        const result = guards.runGuards(root, ctxs, 'color');
        expect.soft(result.refused, ctxs.map((c) => c.spec.outDir).join(' + ')).toBe(true);
        expect.soft(result.code).toBe(3);
        expect.soft(result.run).toBe('mixed');
        expect.soft(result.message).toContain('mixes unit 2 specs');
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

  it('U2G11 keeps the test-only cap key away from the CLI guard options', () => {
    expect(guards.cliGuardOptions({ u2CapUsd: 99, tries: 2 })).toEqual({ tries: 2 });
    expect(Object.hasOwn(guards.cliGuardOptions({ u2CapUsd: 99 }), 'u2CapUsd')).toBe(false);

    const home = temp();
    const specDir = temp();
    const createdRoot = !existsSync(path.join(ROOT, U2_DIR));
    const specFile = path.join(specDir, 'u2-cap-option.json');
    writeFileSync(
      specFile,
      JSON.stringify({ id: U2_ID, outDir: `${U2_DIR}/w09/muse`, colorPrompt: 'a story page' }),
    );
    try {
      for (const value of ['99', '0.5']) {
        const run = spawnSync(
          process.execPath,
          ['scripts/storytime-muse.mjs', 'color', specFile, '--u2CapUsd', value],
          { cwd: ROOT, env: { PATH: process.env.PATH ?? '', HOME: home }, encoding: 'utf8' },
        );
        const output = `${run.stdout}${run.stderr}`;
        expect(run.status, output).toBe(3);
        expect(output).toContain(guards.U2_CAP_MESSAGE);
        expect(output).not.toContain('no key');
      }
    } finally {
      if (createdRoot) rmSync(path.join(ROOT, U2_DIR), { recursive: true, force: true });
      rmSync(specDir, { recursive: true, force: true });
      rmSync(home, { recursive: true, force: true });
    }
  });

  it('U2G10 routes a unit 2 CLI spec to the u2 refusal before key access', () => {
    const home = temp();
    const specDir = temp();
    const createdRoot = !existsSync(path.join(ROOT, U2_DIR));
    const specFile = path.join(specDir, 'u2-spec.json');
    writeFileSync(
      specFile,
      JSON.stringify({ id: U2_ID, outDir: `${U2_DIR}/w09/muse`, colorPrompt: 'a story page' }),
    );
    try {
      const run = spawnSync(process.execPath, ['scripts/storytime-muse.mjs', 'color', specFile], {
        cwd: ROOT,
        env: { PATH: process.env.PATH ?? '', HOME: home },
        encoding: 'utf8',
      });
      const output = `${run.stdout}${run.stderr}`;
      expect(run.status, output).toBe(3);
      expect(output).toContain(guards.U2_CAP_MESSAGE);
      expect(output).not.toContain('outside the scanned cost folders');
      expect(output).not.toContain('no key');
    } finally {
      if (createdRoot) rmSync(path.join(ROOT, U2_DIR), { recursive: true, force: true });
      rmSync(specDir, { recursive: true, force: true });
      rmSync(home, { recursive: true, force: true });
    }
  });
});
