import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as guards from '../scripts/storytime-muse-guards.mjs';
import type {
  CostRow,
  GuardCommand,
  GuardContext,
  GuardOptions,
  RunGuardsResult,
} from '../scripts/storytime-muse-guards.mjs';
import { describe, expect, it } from 'vitest';

// Adversarial tests for the card run guard (Phase 1, HEAD 787e846d).
//
// Each row attacks one failure mode that would spend past the 1.60 USD card cap, or count a
// card call against the wrong cap:
//
//   ADVC1  the cap boundary at 1.59, 1.60 and 1.61, for a color call and for a line call
//   ADVC2  repeated allowed calls must stop at or below 1.60 USD
//   ADVC3  float sums of many 0.01 rows (158 rows, 160 rows)
//   ADVC4  a missing or unparseable time cell in a cost row
//   ADVC5  offset times with milliseconds at the start boundary
//   ADVC6  a costs.tsv header without a time column
//   ADVC7  every spelling of the card outDir that resolves to the card folder
//   ADVC8  no path at or below the child folder `cards` may be a restart call
//   ADVC9  outDir controls: outside, empty, deep escape, no outDir, week folder
//   ADVC10 a `Cards` spelling and every other child folder of the unit root
//   ADVC11 a symlinked card folder and a symlinked costs file
//   ADVC12 a symlinked week folder (RB2-2, accepted and pinned here)
//   ADVC13 a mixed card and non-card CLI call, in every ordering
//   ADVC14 the live notice line of a card call
//   ADVC15 the cost-row parse edges
//   ADVC16 a costs.tsv header without a cost column (RB-4, pinned)
//   ADVC17 the pool re-check threshold for a color call and for a line call
//   ADVC18 the pool re-check reads the cost file only (RB2-1, pinned)
//   ADVC19 the three-try cap for every `--tries` value
//   ADVC20 a single-owner scan that is stronger than the CG3 scan
//
// The tests use temporary roots under os.tmpdir() only. They read and write local files. A CLI
// probe copies the two scripts into a temporary repository and sets HOME to a temporary folder
// that holds one empty env file, so readKey throws `no key` and no provider call can start.
// No test reads a real `out/` path and no test reads the real Workbooks env file.

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARD_START = '2026-11-06T00:00:00Z';
const CARD_DIR = 'out/storytime/l2/unit1/cards/muse';
const UNIT_REL = 'out/storytime/l2/unit1';
const CARD_ID = 'l2-w04-card-mom';
const PAGE_ID = 'l2-w01-story-page-a-nest';
const T = '\t';
const HEADER = ['time', 'row', 'version', 'kind', 'inputs', 'output', 'size', 'usage_cost', 'note'].join(T);

const costRow = (
  time: string,
  id = CARD_ID,
  kind = 'color',
  cost: number | string = 0.01,
  note = 'ok',
): string => [time, id, 'm1', kind, 'in', `${id}-m1-${kind}.png`, '1500x1500', cost, note].join(T);

const temp = (tag: string): string => mkdtempSync(path.join(os.tmpdir(), `storytime-card-adv-${tag}-`));
const unitRootOf = (root: string): string => path.join(root, UNIT_REL);
const parseRows = (rows: string[], header = HEADER): CostRow[] =>
  guards.parseCostsTsv(`${header}\n${rows.join('\n')}\n`);

function writeCosts(root: string, rel: string, rows: string[], header = HEADER): void {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${header}\n${rows.join('\n')}\n`);
}

const cardSpec = (id = CARD_ID, outDir: string | undefined = CARD_DIR): GuardContext =>
  outDir === undefined ? { spec: { id } } : { spec: { id, outDir } };
const restartSpec = (): GuardContext => ({ spec: { id: PAGE_ID, outDir: `${UNIT_REL}/w01/muse` } });

function runAt(root: string, rows: string[], ctxs: GuardContext[], cmd: GuardCommand, opts?: GuardOptions): RunGuardsResult {
  writeCosts(root, `${CARD_DIR}/costs.tsv`, rows);
  return guards.runGuards(unitRootOf(root), ctxs, cmd, opts);
}

/** A temporary repository with the two scripts and an empty HOME. */
function tempCli(tag: string): { repo: string; home: string } {
  const repo = temp(`${tag}-repo`);
  mkdirSync(path.join(repo, 'scripts'), { recursive: true });
  for (const file of ['storytime-muse.mjs', 'storytime-muse-guards.mjs']) {
    copyFileSync(path.join(REPO, 'scripts', file), path.join(repo, 'scripts', file));
  }
  symlinkSync(path.join(REPO, 'node_modules'), path.join(repo, 'node_modules'), 'dir');
  const home = temp(`${tag}-home`);
  // The env file exists and holds no key, so readKey throws `no key in the Workbooks env file`.
  // A refusal that runs before the key read therefore shows no `no key` line, and that assertion
  // can fail.
  const dash = path.join(home, 'Desktop', 'Workbooks', 'dashboard');
  mkdirSync(dash, { recursive: true });
  writeFileSync(path.join(dash, '.env.local'), '');
  return { repo, home };
}

function specFile(repo: string, name: string, spec: Record<string, unknown>): string {
  const file = path.join(repo, name);
  writeFileSync(file, JSON.stringify(spec));
  return file;
}

function museCli(repo: string, home: string, args: string[]): { status: number | null; output: string } {
  const run = spawnSync(process.execPath, ['scripts/storytime-muse.mjs', ...args], {
    cwd: repo,
    env: { PATH: process.env.PATH ?? '', HOME: home },
    encoding: 'utf8',
    timeout: 120000,
  });
  return { status: run.status, output: `${run.stdout ?? ''}${run.stderr ?? ''}` };
}

const cleanup = (...folders: string[]): void => {
  for (const folder of folders) rmSync(folder, { recursive: true, force: true });
};

describe('storytime card adversarial (ADVC)', () => {
  it('ADVC1 holds the cap boundary at 1.59, 1.60 and 1.61 for a color and a line call', () => {
    const root = temp('cap');
    try {
      const one = [cardSpec()];
      // 1.59: one more line call lands exactly on the cap, so it is allowed. A color call carries
      // a cushion of one following line call, so it projects 1.61 and is refused.
      const colorAt159 = runAt(root, [costRow(CARD_START, 'seed', 'color', 1.59)], one, 'color');
      expect.soft(colorAt159.refused, 'a color call at 1.59 is refused').toBe(true);
      expect.soft(colorAt159.message, 'the refusal names the projection').toContain('projected spend 1.6100');
      const lineAt159 = runAt(root, [costRow(CARD_START, 'seed', 'color', 1.59)], one, 'line', { tries: 1 });
      expect.soft(lineAt159.refused, 'one line call at 1.59 is allowed').toBe(false);
      expect.soft(lineAt159.spend, 'the spend at the boundary is 1.59').toBeCloseTo(1.59, 6);

      // 1.60 and 1.61: the current sum already passes the cap, so the spend check refuses first.
      for (const spend of [1.6, 1.61]) {
        for (const [cmd, opts] of [['color', undefined], ['line', { tries: 1 }]] as const) {
          const decision = runAt(root, [costRow(CARD_START, 'seed', 'color', spend)], one, cmd, opts);
          expect.soft(decision.refused, `spend ${spend} on a ${cmd} call is refused`).toBe(true);
          expect.soft(decision.code, `spend ${spend} on a ${cmd} call exits 3`).toBe(3);
          expect.soft(decision.message, `spend ${spend} names the cap`).toContain('over cap 1.6');
        }
      }

      // Control: a spend below the boundary allows the same calls, so the refusals above are not
      // a check that refuses everything.
      const controlColor = runAt(root, [costRow(CARD_START, 'seed', 'color', 1.58)], one, 'color');
      expect.soft(controlColor.refused, 'a color call at 1.58 is allowed').toBe(false);
      const controlLine = runAt(root, [costRow(CARD_START, 'seed', 'color', 1.58)], one, 'line', { tries: 1 });
      expect.soft(controlLine.refused, 'a line call at 1.58 is allowed').toBe(false);
    } finally {
      cleanup(root);
    }
  });

  it('ADVC2 stops repeated allowed line calls at or below 1.60 USD', () => {
    const root = temp('conv');
    try {
      for (const start of [0, 1.5, 1.58, 1.59, 1.6, 1.61]) {
        const rows: string[] = start > 0 ? [costRow(CARD_START, 'seed', 'color', start)] : [];
        let steps = 0;
        let last: RunGuardsResult | undefined;
        while (steps < 400) {
          last = runAt(root, rows, [cardSpec()], 'line', { tries: 1 });
          if (last.refused) break;
          rows.push(costRow(CARD_START, `step-${steps}`, 'line', 0.01));
          steps += 1;
        }
        expect.soft(last, `start ${start} reaches a decision`).toBeDefined();
        expect.soft(last!.refused, `start ${start} ends on a refusal`).toBe(true);
        if (steps > 0) {
          // Every call the guard allowed left the sum at or below the cap.
          expect.soft(last!.spend <= 1.6, `start ${start} never passes the cap: ${last!.spend}`).toBe(true);
          expect.soft(last!.spend > 1.59, `start ${start} stops right at the boundary: ${last!.spend}`).toBe(true);
        }
        if (start <= 1.59) {
          expect.soft(steps, `start ${start} allows at least one call`).toBeGreaterThan(0);
        } else {
          expect.soft(steps, `start ${start} allows no call`).toBe(0);
        }
      }
    } finally {
      cleanup(root);
    }
  });

  it('ADVC3 keeps a float sum of many 0.01 rows on the safe side of the cap', () => {
    const root = temp('float');
    try {
      const rows = (n: number): string[] =>
        Array.from({ length: n }, (_, i) => costRow(CARD_START, `row-${i}`, 'color', 0.01));

      // 158 rows: one more line call still fits. The strategy does not pin 159 rows, because the
      // float sum of 159 rows is 1.5900000000000012 and an implementation may refuse there.
      const at158 = runAt(root, rows(158), [cardSpec()], 'line', { tries: 1 });
      expect.soft(at158.refused, '158 rows of 0.01 allow one more line call').toBe(false);
      expect.soft(at158.spend <= 1.6, `158 rows sum to at most 1.60: ${at158.spend}`).toBe(true);

      // 160 rows: the sum is at or over the cap, so every further call is refused.
      const at160 = runAt(root, rows(160), [cardSpec()], 'line', { tries: 1 });
      expect.soft(at160.refused, '160 rows of 0.01 refuse the next call').toBe(true);
      expect.soft(at160.code, 'the refusal exits 3').toBe(3);
      expect.soft(at160.message, 'the refusal names the cap').toContain('over cap 1.6');
      expect.soft(at160.spend > 1.59, `the 160-row sum is past the boundary: ${at160.spend}`).toBe(true);

      // Control: 160 rows in the elements file count for spend too, so the refusal is not caused
      // by the row count alone.
      writeCosts(root, `${CARD_DIR}/costs.tsv`, rows(1));
      writeCosts(root, `${CARD_DIR}/elements/costs.tsv`, rows(159));
      const viaElements = guards.runGuards(unitRootOf(root), [cardSpec()], 'line', { tries: 1 });
      expect.soft(viaElements.refused, 'the elements file counts for spend').toBe(true);
      expect.soft(viaElements.spend > 1.59, `elements spend is past the boundary: ${viaElements.spend}`).toBe(true);
    } finally {
      cleanup(root);
    }
  });

  it('ADVC4 drops a cost row whose time cell is missing or unparseable', () => {
    const cases: Array<[string, string[]]> = [
      ['a missing time cell', [[ '', CARD_ID, 'm1', 'color', 'in', 'x.png', '1500x1500', '0.5', 'ok'].join(T)]],
      ['a non-date time cell', [costRow('not-a-time', CARD_ID, 'color', 0.5)]],
      ['a lowercase zone', [costRow('2026-11-06T00:00:00z', CARD_ID, 'color', 0.5)]],
      ['a trailing space', [costRow('2026-11-06T00:00:00Z ', CARD_ID, 'color', 0.5)]],
    ];
    for (const [label, rows] of cases) {
      const parsed = parseRows(rows);
      expect.soft(guards.spendTotal(parsed, CARD_START), `${label}: the cost is not counted`).toBe(0);
      expect.soft(guards.countTries(parsed, CARD_ID, 'color', CARD_START), `${label}: the try is not counted`).toBe(0);
    }
    // Control: a well-formed row at the start time counts, so the four checks above are real.
    const good = parseRows([costRow(CARD_START, CARD_ID, 'color', 0.5)]);
    expect.soft(guards.spendTotal(good, CARD_START), 'a well-formed row counts its cost').toBe(0.5);
    expect.soft(guards.countTries(good, CARD_ID, 'color', CARD_START), 'a well-formed row is one try').toBe(1);
  });

  it('ADVC5 compares offset times with milliseconds at the start boundary', () => {
    const start = guards.CARD_RUN.startTime;
    const cases: Array<[string, number]> = [
      ['2026-11-06T00:00:00.000Z', 1],
      ['2026-11-06T00:00:00.001Z', 1],
      ['2026-11-05T23:59:59.999Z', 0],
      ['2026-11-06T07:00:00.000+07:00', 1],
      ['2026-11-06T07:00:00.001+07:00', 1],
      ['2026-11-06T06:59:59.999+07:00', 0],
      ['2026-11-06T00:00:00.000+00:00', 1],
    ];
    for (const [time, expected] of cases) {
      const parsed = parseRows([costRow(time, CARD_ID, 'color', 0.5)]);
      expect.soft(
        guards.countTries(parsed, CARD_ID, 'color', start),
        `${time} counts ${expected} times`,
      ).toBe(expected);
    }
  });

  it('ADVC6 shows that a header without a time column hides every cost row', () => {
    const root = temp('notime');
    try {
      const header = ['row', 'version', 'kind', 'inputs', 'output', 'size', 'usage_cost', 'note'].join(T);
      const body = [[CARD_ID, 'm1', 'color', 'in', 'x.png', '1500x1500', '0.5', 'ok'].join(T)];
      const blind = guards.parseCostsTsv(`${header}\n${body.join('\n')}\n`);
      expect.soft(blind, 'the row is parsed').toHaveLength(1);
      expect.soft(blind[0]?.cost, 'the cost column is still read').toBe(0.5);
      expect.soft(guards.spendTotal(blind, guards.CARD_RUN.startTime), 'the spend is hidden').toBe(0);
      expect.soft(
        guards.countTries(blind, CARD_ID, 'color', guards.CARD_RUN.startTime),
        'the try is hidden',
      ).toBe(0);
      // A guard run over such a file reports no spend and refuses nothing.
      writeCosts(root, `${CARD_DIR}/costs.tsv`, body, header);
      const decision = guards.runGuards(unitRootOf(root), [cardSpec()], 'color');
      expect.soft(decision.spend, 'the guard sees no spend').toBe(0);
      expect.soft(decision.refused, 'the guard refuses nothing').toBe(false);
      // Control: the same rows with the full header count, so the blindness comes from the header.
      const seen = parseRows([costRow(CARD_START, CARD_ID, 'color', 0.5)]);
      expect.soft(guards.spendTotal(seen, guards.CARD_RUN.startTime), 'the full header counts').toBe(0.5);
    } finally {
      cleanup(root);
    }
  });

  it('ADVC7 keeps every spelling that resolves to the card folder a card call', () => {
    const unit = temp('variant');
    try {
      const variants = [
        CARD_DIR,
        `${CARD_DIR}/`,
        `${CARD_DIR}/.`,
        `./${CARD_DIR}`,
        `${UNIT_REL}/w01/muse/../../cards/muse`,
        `${UNIT_REL}/cards/../cards/muse`,
        `${UNIT_REL}/w01/muse/../../../unit1/cards/muse`,
      ];
      for (const outDir of variants) {
        const kind = guards.classifyOutDir({ outDir }, unit).kind;
        // A spelling that resolves elsewhere would be a restart call, and the restart scan skips
        // the child `cards`, so its spend would be unguarded. It must stay a card call.
        expect.soft(kind, `${outDir} is a card call`).toBe('card');
      }
      // Control: a spelling that resolves outside the card folder is not a card call.
      expect.soft(
        guards.classifyOutDir({ outDir: `${UNIT_REL}/cards/muse/elements` }, unit).kind,
        'the elements folder below cards is not a card call',
      ).toBe('invalid');
      expect.soft(
        guards.classifyOutDir({ outDir: `${UNIT_REL}/w03/muse` }, unit).kind,
        'a week folder is not a card call',
      ).toBe('restart');
    } finally {
      cleanup(unit);
    }
  });

  it('ADVC8 never classifies a path at or below the child cards folder as a restart call', () => {
    const unit = temp('undercards');
    try {
      const paths = [
        CARD_DIR,
        `${CARD_DIR}/`,
        UNIT_REL + '/cards',
        `${UNIT_REL}/cards/muse/elements`,
        `${UNIT_REL}/cards/other/muse`,
        `${UNIT_REL}/cards/muse2`,
        `${UNIT_REL}/cards/x/y/z/muse`,
        `${UNIT_REL}/w01/muse/../../cards/muse/elements`,
        `${UNIT_REL}/w01/muse/../../../cards/other/muse`,
        `${UNIT_REL}/w01/muse/../../cards`,
      ];
      const kinds = paths.map((outDir) => guards.classifyOutDir({ outDir }, unit).kind);
      for (const [index, kind] of kinds.entries()) {
        expect.soft(kind === 'restart', `${paths[index]} must not be a restart call`).toBe(false);
        expect.soft(['card', 'invalid'], `${paths[index]} is card or invalid`).toContain(kind);
      }
      // Control: the list exercises both allowed classes, so the loop above is not vacuous.
      expect.soft(kinds.includes('card'), 'the list holds a card path').toBe(true);
      expect.soft(kinds.includes('invalid'), 'the list holds an invalid path').toBe(true);
    } finally {
      cleanup(unit);
    }
  });

  it('ADVC9 refuses an outDir outside the scanned folders and keeps the w01 default', () => {
    const unit = temp('outside');
    try {
      const outside = path.join(os.tmpdir(), 'storytime-card-adv-outside', 'muse');
      const invalid = [
        '',
        outside,
        `${UNIT_REL}/../../../../elsewhere/muse`,
        `${UNIT_REL}/cards/muse/../../../..`,
        `${UNIT_REL}/w01/muse2`,
      ];
      for (const outDir of invalid) {
        expect.soft(
          guards.classifyOutDir({ outDir }, unit).kind,
          `${JSON.stringify(outDir)} is invalid`,
        ).toBe('invalid');
      }
      expect.soft(guards.classifyOutDir({}, unit).kind, 'a spec without outDir uses the w01 default').toBe('restart');
      expect.soft(
        guards.classifyOutDir({ outDir: `${UNIT_REL}/w03/muse` }, unit).kind,
        'a week folder is a restart call',
      ).toBe('restart');
    } finally {
      cleanup(unit);
    }
  });

  it('ADVC10 counts the cost file of every direct child folder of the unit root', () => {
    const root = temp('children');
    try {
      for (const name of ['w01', 'Cards', 'CARDS', 'cards2', 'card', 'cards']) {
        writeCosts(root, `${UNIT_REL}/${name}/muse/costs.tsv`, [costRow(CARD_START, name, 'color', 0.1)]);
      }
      const restart = guards.scanCostFiles(unitRootOf(root));
      const seen = restart.allRows.map((row) => row.row).sort();
      // The restart scan skips exactly the direct child `cards`, and reads every other spelling.
      expect.soft(seen, 'the restart scan reads every other child').toEqual(['CARDS', 'Cards', 'card', 'cards2', 'w01']);
      const card = guards.scanCardCostFiles(unitRootOf(root));
      expect.soft(card.allRows.map((row) => row.row), 'the card scan reads the cards folder').toEqual(['cards']);
      // RB2-4 pin: on this file system a `Cards` spelling is a separate folder, so it is a
      // restart call and the restart cap counts it. The card cap never sees it.
      expect.soft(
        guards.classifyOutDir({ outDir: `${UNIT_REL}/Cards/muse` }, unitRootOf(root)).kind,
        'RB2-4 pin: a Cards spelling is a restart call',
      ).toBe('restart');
    } finally {
      cleanup(root);
    }
  });

  it('ADVC11 reads card spend through a symlinked card folder and a symlinked costs file', () => {
    const linkRoot = temp('cardlink');
    try {
      const repo = path.join(linkRoot, 'repo');
      const unit = unitRootOf(repo);
      mkdirSync(unit, { recursive: true });
      const outside = path.join(linkRoot, 'outside');
      mkdirSync(path.join(outside, 'muse'), { recursive: true });
      writeFileSync(path.join(outside, 'muse', 'costs.tsv'), `${HEADER}\n${costRow(CARD_START, 'linked', 'color', 0.9)}\n`);
      symlinkSync(outside, path.join(unit, 'cards'), 'dir');
      const viaFolder = guards.runGuards(unit, [cardSpec()], 'color');
      expect.soft(viaFolder.refused, 'the linked card folder is a card call').toBe(false);
      expect.soft(viaFolder.spend, 'the card scan follows the folder symlink').toBeCloseTo(0.9, 6);
    } finally {
      cleanup(linkRoot);
    }

    const fileRoot = temp('filelink');
    try {
      const repo = path.join(fileRoot, 'repo');
      const unit = unitRootOf(repo);
      mkdirSync(path.join(unit, 'cards', 'muse'), { recursive: true });
      mkdirSync(path.join(fileRoot, 'real'), { recursive: true });
      const real = path.join(fileRoot, 'real', 'costs.tsv');
      writeFileSync(real, `${HEADER}\n${costRow(CARD_START, 'linked', 'color', 0.9)}\n`);
      symlinkSync(real, path.join(unit, 'cards', 'muse', 'costs.tsv'));
      const viaFile = guards.runGuards(unit, [cardSpec()], 'color');
      expect.soft(viaFile.refused, 'the linked cost file is a card call').toBe(false);
      expect.soft(viaFile.spend, 'the card scan follows the file symlink').toBeCloseTo(0.9, 6);
    } finally {
      cleanup(fileRoot);
    }
  });

  it('ADVC12 pins RB2-2: a symlinked week folder is outside the restart scan', () => {
    const root = temp('weeklink');
    try {
      const unit = unitRootOf(root);
      mkdirSync(unit, { recursive: true });
      const outside = path.join(root, 'outside');
      mkdirSync(path.join(outside, 'muse'), { recursive: true });
      writeFileSync(path.join(outside, 'muse', 'costs.tsv'), `${HEADER}\n${costRow('2026-11-05T12:00:00Z', 'linked', 'color', 0.9)}\n`);
      symlinkSync(outside, path.join(unit, 'w10'), 'dir');
      expect.soft(
        guards.classifyOutDir({ outDir: `${UNIT_REL}/w10/muse` }, unit).kind,
        'a symlinked week folder is a restart call',
      ).toBe('restart');
      const decision = guards.runGuards(unit, [restartSpec()], 'color');
      expect.soft(decision.refused, 'the restart call is not refused').toBe(false);
      expect.soft(decision.spend, 'RB2-2 pin: the restart scan skips a symlinked week folder').toBe(0);
      // Control: the same file in a real week folder is counted, so the pin is about the link.
      rmSync(path.join(unit, 'w10'));
      mkdirSync(path.join(unit, 'w10', 'muse'), { recursive: true });
      writeFileSync(path.join(unit, 'w10', 'muse', 'costs.tsv'), `${HEADER}\n${costRow('2026-11-05T12:00:00Z', 'real', 'color', 0.9)}\n`);
      const realRun = guards.runGuards(unit, [restartSpec()], 'color');
      expect.soft(realRun.spend, 'a real week folder is counted').toBeCloseTo(0.9, 6);
    } finally {
      cleanup(root);
    }
  });

  it('ADVC13 refuses a mixed card and non-card CLI call in every ordering', () => {
    const { repo, home } = tempCli('mixed');
    try {
      writeCosts(repo, `${CARD_DIR}/costs.tsv`, [costRow(CARD_START, 'seed', 'color', 0.1)]);
      const card = specFile(repo, 'card.json', { id: CARD_ID, outDir: CARD_DIR, colorPrompt: 'a card' });
      const other = specFile(repo, 'other.json', { id: PAGE_ID, outDir: `${UNIT_REL}/w01/muse`, colorPrompt: 'a page' });
      const plain = specFile(repo, 'plain.json', { id: 'l2-w02-card-fan', colorPrompt: 'no outDir' });
      const costFile = path.join(repo, `${CARD_DIR}/costs.tsv`);
      const before = readFileSync(costFile, 'utf8');

      const lists: string[][] = [[card, other], [other, card], [card, card, other], [card, plain]];
      for (const list of lists) {
        const run = museCli(repo, home, ['color', ...list]);
        expect.soft(run.status, `a mixed list of ${list.length} files exits 3`).toBe(3);
        expect.soft(run.output, 'the refusal names the mix').toContain('mixes card specs');
        expect.soft(run.output, 'the refusal runs before the key read').not.toContain('no key');
      }
      expect.soft(readFileSync(costFile, 'utf8'), 'a refusal writes no cost row').toBe(before);

      // Control: the empty env file makes `no key` reachable, so the line above can fail.
      const control = museCli(repo, home, ['color', card]);
      expect.soft(control.status, 'a card-only call passes the guard').toBe(1);
      expect.soft(control.output, 'the control reaches the key read').toContain('no key');
      expect.soft(control.output, 'the control is not a refusal').not.toContain('refused:');
    } finally {
      cleanup(repo, home);
    }
  }, 180000);

  it('ADVC14 prints the card cap and the card report point on the live notice line', () => {
    const { repo, home } = tempCli('notice');
    try {
      writeCosts(repo, `${CARD_DIR}/costs.tsv`, [costRow(CARD_START, 'seed', 'color', 0.9)]);
      const card = specFile(repo, 'card.json', { id: CARD_ID, outDir: CARD_DIR, colorPrompt: 'a card' });
      const run = museCli(repo, home, ['color', card]);
      expect.soft(run.status, 'the guard passes and the key read stops the run').toBe(1);
      expect.soft(run.output, 'the banner names the card cap').toContain('card run: cap 1.6 USD');
      expect.soft(run.output, 'the notice names the card report point').toContain('report point 0.8');
      expect.soft(run.output, 'the notice does not use the restart report point').not.toContain('report point 0.5');
      expect.soft(run.output, 'the run stops at the key read').toContain('no key');
    } finally {
      cleanup(repo, home);
    }
  }, 180000);

  it('ADVC15 parses the cost-row edges without losing a well-formed row', () => {
    const negative = parseRows([costRow(CARD_START, CARD_ID, 'color', -0.5)]);
    expect.soft(negative[0]?.cost, 'RB-4 pin: a negative cost cell is kept').toBe(-0.5);
    expect.soft(guards.spendTotal(negative, CARD_START), 'RB-4 pin: a negative row lowers the spend').toBe(-0.5);

    const blank = parseRows([[CARD_START, CARD_ID, 'm1', 'color', 'in', 'x.png', '1500x1500', '', 'ok'].join(T)]);
    expect.soft(blank[0]?.cost, 'a blank cost cell reads as 0').toBe(0);

    const extra = parseRows([`${costRow(CARD_START, CARD_ID, 'color', 0.01)}${T}extra${T}columns`]);
    expect.soft(extra[0]?.cost, 'extra columns do not move the cost').toBe(0.01);
    expect.soft(extra[0]?.note, 'extra columns do not move the note').toBe('ok');

    const short = parseRows([`${CARD_START}${T}${CARD_ID}`]);
    expect.soft(short[0]?.cost, 'a row shorter than the header reads as 0 cost').toBe(0);

    expect.soft(guards.parseCostsTsv(`${HEADER}\n`), 'a header-only file holds no rows').toEqual([]);

    const noFirst = parseRows([['', CARD_ID, 'm1', 'color', 'in', 'x.png', '1500x1500', '0.5', 'ok'].join(T)]);
    expect.soft(noFirst, 'a row with a blank first cell is dropped').toEqual([]);

    const root = temp('nofile');
    try {
      const decision = guards.runGuards(unitRootOf(root), [cardSpec()], 'color');
      expect.soft(decision.refused, 'a missing card cost file allows a call').toBe(false);
      expect.soft(decision.spend, 'a missing card cost file counts no spend').toBe(0);
    } finally {
      cleanup(root);
    }

    const good = parseRows([costRow(CARD_START, CARD_ID, 'color', 0.01)]);
    expect.soft(good[0]?.cost, 'a well-formed row reads 0.01').toBe(0.01);
    expect.soft(good[0]?.kind, 'a well-formed row keeps its kind').toBe('color');
  });

  it('ADVC16 pins RB-4: a header without a cost column reads every row as 0 cost', () => {
    const header = ['time', 'row', 'kind'].join(T);
    const body = [[CARD_START, CARD_ID, 'color'].join(T)];
    const rows = guards.parseCostsTsv(`${header}\n${body.join('\n')}\n`);
    expect.soft(rows, 'the row is parsed').toHaveLength(1);
    expect.soft(rows[0]?.cost, 'RB-4 pin: a missing cost column reads 0').toBe(0);
    expect.soft(guards.spendTotal(rows, CARD_START), 'RB-4 pin: the spend is 0, so the cap cannot trip').toBe(0);
    const good = parseRows([costRow(CARD_START, CARD_ID, 'color', 0.01)]);
    expect.soft(good[0]?.cost, 'the full header reads the cost').toBe(0.01);
  });

  it('ADVC17 stops the pool re-check at the same boundary as the pre-pool guard', () => {
    const root = temp('recheck');
    try {
      // A color re-check reserves the call plus one cushion of 0.01, so it stops above 1.58.
      expect.soft(
        runAt(root, [costRow(CARD_START, 'seed', 'color', 1.58)], [cardSpec()], 'color').refused,
        'a color re-check passes at 1.58',
      ).toBe(false);
      expect.soft(
        runAt(root, [costRow(CARD_START, 'seed', 'color', 1.5801)], [cardSpec()], 'color').refused,
        'a color re-check refuses at 1.5801',
      ).toBe(true);
      // A line re-check with three tries reserves three margins, so it stops above 1.57.
      expect.soft(
        runAt(root, [costRow(CARD_START, 'seed', 'color', 1.57)], [cardSpec()], 'line', { tries: 3 }).refused,
        'a line re-check of 3 tries passes at 1.57',
      ).toBe(false);
      expect.soft(
        runAt(root, [costRow(CARD_START, 'seed', 'color', 1.5701)], [cardSpec()], 'line', { tries: 3 }).refused,
        'a line re-check of 3 tries refuses at 1.5701',
      ).toBe(true);
    } finally {
      cleanup(root);
    }
  });

  it('ADVC18 pins RB2-1: the pool re-check reads the cost file only', () => {
    const root = temp('rb21');
    try {
      writeCosts(root, `${CARD_DIR}/costs.tsv`, [costRow(CARD_START, 'seed', 'color', 1.58)]);
      const unit = unitRootOf(root);
      const first = guards.runGuards(unit, [cardSpec()], 'color');
      const second = guards.runGuards(unit, [cardSpec()], 'color');
      expect.soft(first.refused, 'the first re-check passes at 1.58').toBe(false);
      // RB2-1 is accepted as a Phase 2 operating rule. The pin records the mechanism: a second
      // re-check sees the same file and holds no reservation of its own, so a call in flight is
      // invisible until logCall writes its row.
      expect.soft(second.refused, 'RB2-1 pin: a second re-check sees the same spend').toBe(false);
      expect.soft(second.spend, 'RB2-1 pin: the re-check holds no reservation').toBe(first.spend);
      expect.soft(second.spend, 'the spend did not move between the two calls').toBeCloseTo(1.58, 6);
    } finally {
      cleanup(root);
    }
  });

  it('ADVC19 keeps the three-try cap for every --tries value', () => {
    const root = temp('tries');
    try {
      const values = ['0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '-1', 'abc'];
      for (let count = 0; count <= 3; count++) {
        const rows = Array.from({ length: count }, (_, i) =>
          costRow(CARD_START, CARD_ID, 'line', 0.01, i === 0 ? 'ok' : `redo ${i + 1}`),
        );
        writeCosts(root, `${CARD_DIR}/costs.tsv`, rows);
        for (const value of values) {
          const decision = guards.runGuards(unitRootOf(root), [cardSpec()], 'line', { tries: value });
          if (decision.refused) continue;
          const requested = Number(value);
          // The number of calls doLine launches when no line file exists yet.
          const launched = Number.isFinite(requested) && requested > 0 ? Math.ceil(requested) : 0;
          expect.soft(
            count + launched,
            `count ${count} with --tries ${value} stays at or below 3`,
          ).toBeLessThanOrEqual(3);
        }
      }
      // Control: an integer fourth try is refused, so the grid above is not vacuous.
      writeCosts(root, `${CARD_DIR}/costs.tsv`, [1, 2, 3].map((n) => costRow(CARD_START, CARD_ID, 'line', 0.01, n === 1 ? 'ok' : `redo ${n}`)));
      const fourth = guards.runGuards(unitRootOf(root), [cardSpec()], 'line', { tries: 1 });
      expect.soft(fourth.refused, 'a fourth line try is refused').toBe(true);
      expect.soft(fourth.message, 'the refusal names the try count').toContain('count 3');

      // A fractional --tries reserves less than doLine launches. On a 0.01 cost grid the three
      // calls still land on the cap, and the run then stops.
      const fractional = runAt(root, [costRow(CARD_START, 'seed', 'color', 1.57)], [cardSpec()], 'line', { tries: '2.5' });
      expect.soft(fractional.refused, 'spend 1.57 with --tries 2.5 is allowed').toBe(false);
      const after = runAt(
        root,
        [
          costRow(CARD_START, 'seed', 'color', 1.57),
          costRow(CARD_START, 'a', 'line', 0.01),
          costRow(CARD_START, 'b', 'line', 0.01),
          costRow(CARD_START, 'c', 'line', 0.01),
        ],
        [cardSpec()],
        'line',
        { tries: 1 },
      );
      expect.soft(after.refused, 'the run stops at 1.60').toBe(true);
      expect.soft(after.spend, 'the spend is 1.60').toBeCloseTo(1.6, 6);
    } finally {
      cleanup(root);
    }
  });

  it('ADVC20 finds a second owner of the card cap that the CG3 scan would miss', () => {
    const ownerPattern = /(?:cap|report)[A-Za-z_]*\s*[:=]\s*(?:1\.6|0\.8)(?:0+)?(?![\d.])/i;
    const cg3Pattern = /(?:cap|report)[A-Za-z_]*\s*=\s*(?:1\.6|0\.8)/i;
    const seeded = 'const CARD = { capUsd: 1.6, reportAtUsd: 0.8 };';
    expect.soft(ownerPattern.test(seeded), 'the stronger scan flags an object-literal second owner').toBe(true);
    expect.soft(cg3Pattern.test(seeded), 'the CG3 scan misses an object-literal second owner').toBe(false);

    const hits: string[] = [];
    const walk = (folder: string): void => {
      for (const entry of readdirSync(folder, { withFileTypes: true })) {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(?:mjs|mts|ts)$/.test(entry.name)) continue;
        if (ownerPattern.test(readFileSync(full, 'utf8'))) hits.push(path.relative(REPO, full));
      }
    };
    walk(path.join(REPO, 'scripts'));
    walk(path.join(REPO, 'tests'));
    const allowed = hits.every(
      (file) => path.basename(file).includes('storytime-muse-guards') || path.basename(file).startsWith('storytime-card-'),
    );
    expect.soft(allowed, `only the guard module and the card tests hold the values: ${hits.join(', ')}`).toBe(true);
    expect.soft(hits.length > 0, 'the scan finds the guard module, so it runs').toBe(true);

    // Control: a seeded file inside a copied scripts folder is flagged by the same walker.
    const seedRoot = temp('seed');
    try {
      mkdirSync(path.join(seedRoot, 'scripts'), { recursive: true });
      writeFileSync(path.join(seedRoot, 'scripts', 'second-owner.mjs'), seeded);
      const seededHits: string[] = [];
      const seedWalk = (folder: string): void => {
        for (const entry of readdirSync(folder, { withFileTypes: true })) {
          const full = path.join(folder, entry.name);
          if (entry.isDirectory()) {
            seedWalk(full);
            continue;
          }
          if (!/\.(?:mjs|mts|ts)$/.test(entry.name)) continue;
          if (ownerPattern.test(readFileSync(full, 'utf8'))) seededHits.push(path.basename(full));
        }
      };
      seedWalk(path.join(seedRoot, 'scripts'));
      expect.soft(seededHits, 'the walker flags the seeded second owner').toEqual(['second-owner.mjs']);
    } finally {
      cleanup(seedRoot);
    }
  });
});
