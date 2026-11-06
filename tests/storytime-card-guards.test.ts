import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync, readdirSync, symlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as guards from '../scripts/storytime-muse-guards.mjs';
import * as judgeBatch from '../scripts/storytime-judge-batch.mjs';
import type { BatchCommandOptions, BuildBatchOptions } from '../scripts/storytime-judge-batch.mjs';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CARD_START = '2026-11-06T00:00:00Z';
const CARD_DIR = 'out/storytime/l2/unit1/cards/muse';
const ID = 'l2-w04-card-mom';
const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';
const costRow = (time: string, id = ID, kind = 'color', cost = 0.01, output = `${id}-m1-${kind}.png`, note = 'ok') =>
  `${time}\t${id}\tm1\t${kind}\tin\t${output}\t1500x1500\t${cost}\t${note}`;
const parsed = (rows: string[]) => guards.parseCostsTsv(`${HEADER}\n${rows.join('\n')}\n`);
const temp = () => mkdtempSync(path.join(os.tmpdir(), 'storytime-card-guards-'));
const writeCosts = (root: string, rel: string, rows: string[]) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${HEADER}\n${rows.join('\n')}\n`);
};
const digest = (file: string) => (existsSync(file) ? readFileSync(file) : Buffer.from('<absent>')).toString('base64');

describe('storytime card guards (CG)', () => {
  it('CG1 exports exactly the frozen CARD_RUN contract', () => {
    expect(guards.CARD_RUN).toEqual({
      startTime: CARD_START,
      capUsd: 1.6,
      reportAtUsd: 0.8,
      marginUsd: 0.01,
      maxTries: 3,
      outDir: CARD_DIR,
    });
    expect(Object.keys(guards.CARD_RUN ?? {}).sort()).toEqual(['capUsd', 'marginUsd', 'maxTries', 'outDir', 'reportAtUsd', 'startTime']);
  });

  it('CG2 keeps the restart guard values and exceptions unchanged', () => {
    expect(guards.RESTART_START).toBe('2026-11-04T07:54:00Z');
    expect(guards.MAX_TRIES).toBe(3);
    expect(guards.SPEND_CAP_USD).toBe(1.0);
    expect(guards.REPORT_AT_USD).toBe(0.5);
    expect(guards.SPEND_MARGIN_USD).toBe(0.01);
    expect(guards.TRY_EXCEPTIONS).toHaveLength(3);
    expect(guards.TRY_EXCEPTIONS.every((row) => row.id === 'l2-w01-story-page-a-nut')).toBe(true);
  });

  it('CG3 keeps card constants in the guard and imports CARD_RUN in both callers', () => {
    const scanLiteral = (root: string, literal: string) => ['scripts', 'tests'].flatMap((dir) => {
      const walk = (folder: string): string[] => readdirSync(folder, { withFileTypes: true }).flatMap((e) => {
        const full = path.join(folder, e.name);
        if (e.isDirectory()) return walk(full);
        return /\.(?:mjs|mts|ts)$/.test(e.name) && readFileSync(full, 'utf8').includes(literal) ? [full] : [];
      });
      return walk(path.join(root, dir));
    });
    const startFiles = scanLiteral(ROOT, CARD_START);
    const outFiles = scanLiteral(ROOT, CARD_DIR);
    expect(startFiles.every((f) => f.includes('storytime-muse-guards') || path.basename(f).startsWith('storytime-card-'))).toBe(true);
    expect(outFiles.every((f) => f.includes('storytime-muse-guards') || path.basename(f).startsWith('storytime-card-'))).toBe(true);
    for (const caller of ['scripts/storytime-muse.mjs', 'scripts/storytime-judge-batch.mjs']) {
      const source = readFileSync(path.join(ROOT, caller), 'utf8');
      expect(source).toMatch(/import\s*\{[^}]*CARD_RUN[^}]*\}\s*from\s*['"]\.\/storytime-muse-guards\.mjs['"]/s);
      expect(source).not.toMatch(/(?:cap|report)[A-Za-z_]*\s*=\s*(?:1\.6|0\.8)/i);
    }
    const dir = temp();
    try {
      mkdirSync(path.join(dir, 'scripts'), { recursive: true });
      mkdirSync(path.join(dir, 'tests'), { recursive: true });
      writeFileSync(path.join(dir, 'scripts', 'seed.mjs'), `const start = '${CARD_START}';`);
      expect(scanLiteral(dir, CARD_START)).toEqual([path.join(dir, 'scripts', 'seed.mjs')]);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('CG4 applies card spend cap and margin to card costs', () => {
    const run = guards.CARD_RUN ?? { startTime: CARD_START, capUsd: 1.6, marginUsd: 0.01, reportAtUsd: 0.8 };
    for (const [cost, allowed] of [[1.3, true], [1.58, true], [1.595, false], [1.6, false]] as const) {
      expect(guards.spendGuard(parsed([costRow(CARD_START, ID, 'color', cost)]), run.startTime, run.capUsd, run.marginUsd, run.reportAtUsd).ok).toBe(allowed);
    }
    expect(guards.spendGuard(parsed(Array.from({ length: 160 }, (_, i) => costRow(CARD_START, `${ID}-${i}`, 'color', 0.01))), run.startTime, run.capUsd, run.marginUsd, run.reportAtUsd).ok).toBe(false);
    const root = temp();
    try {
      writeCosts(root, 'cards/muse/costs.tsv', [costRow(CARD_START, ID, 'color', 1.3)]);
      expect(guards.runGuards(root, [{ spec: { id: ID, outDir: CARD_DIR } }], 'color').refused).toBe(false);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('CG5 uses the card report point', () => {
    const run = guards.CARD_RUN ?? { startTime: CARD_START, capUsd: 1.6, marginUsd: 0.01, reportAtUsd: 0.8 };
    for (const [cost, notice] of [[0.6, false], [0.79, false], [0.8, true]] as const) {
      expect(guards.spendGuard(parsed([costRow(CARD_START, ID, 'color', cost)]), run.startTime, run.capUsd, run.marginUsd, run.reportAtUsd).notice).toBe(notice);
    }
  });

  it('CG6 enforces per-card, per-kind tries and ignores failed zero-cost rows', () => {
    const start = guards.CARD_RUN?.startTime ?? CARD_START;
    const three = parsed([1, 2, 3].map((n) => costRow(CARD_START, ID, 'color', 0.01, `${ID}-m${n}-color.png`)));
    expect(guards.tryGuard(three, ID, 'color', 1, start, 3).ok).toBe(false);
    expect(guards.tryGuard(parsed([1, 2].map((n) => costRow(CARD_START, ID, 'color', 0.01, `${ID}-m${n}-color.png`))), ID, 'color', 1, start, 3).ok).toBe(true);
    expect(guards.tryGuard(parsed([costRow(CARD_START, ID, 'color', 0, 'none', 'HTTP 429')]), ID, 'color', 1, start, 3).ok).toBe(true);
    const lines = parsed([1, 2].map((n) => costRow(CARD_START, ID, 'line', 0.01, `${ID}-line-m${n}.png`)));
    expect(guards.tryGuard(lines, ID, 'line', 2, start, 3).ok).toBe(false);
    expect(guards.tryGuard(three, ID, 'line', 1, start, 3).ok).toBe(true);
    expect(guards.tryGuard(three, 'l2-w04-card-dad', 'color', 1, start, 3).ok).toBe(true);
  });

  it('CG7 compares inclusive UTC instants, including offset timestamps', () => {
    const start = guards.CARD_RUN?.startTime ?? CARD_START;
    for (const [time, expected] of [
      ['2026-11-05T23:59:59Z', 0],
      ['2026-11-06T00:00:00Z', 1],
      ['2026-11-06T07:00:00+07:00', 1],
      ['2026-11-06T06:59:59+07:00', 0],
    ] as const) {
      expect(guards.countTries(parsed([costRow(time)]), ID, 'color', start)).toBe(expected);
    }
  });

  it('CG8 scopes card spend and tries to card cost files', () => {
    const root = temp();
    try {
      writeCosts(root, 'w01/muse/costs.tsv', [costRow(CARD_START, ID, 'color', 5)]);
      writeCosts(root, 'cards/muse/costs.tsv', [costRow(CARD_START, ID, 'color', 0.01)]);
      writeCosts(root, 'cards/muse/elements/costs.tsv', [costRow(CARD_START, 'element', 'color', 0.02)]);
      const result = guards.runGuards(root, [{ spec: { id: ID, outDir: CARD_DIR } }], 'color');
      expect(result.spend).toBeCloseTo(0.03);
      expect(result.refused).toBe(false);
      expect(guards.countTries(parsed([costRow(CARD_START, ID, 'color', 0.01)]), ID, 'color', CARD_START)).toBe(1);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('CG9 keeps a restart-only call under the restart cap', () => {
    const root = temp();
    try {
      writeCosts(root, 'w01/muse/costs.tsv', [costRow('2026-11-04T08:00:00Z', 'l2-w01-story-page-a-nest', 'color', 1.2)]);
      const result = guards.runGuards(root, [{ spec: { id: 'l2-w01-story-page-a-nest', outDir: 'out/storytime/l2/unit1/w01/muse' } }], 'color');
      expect(result.refused).toBe(true);
      expect(result.code).toBe(3);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('CG10 refuses mixed CLI specs before key access and does not alter costs', () => {
    const emptyHome = temp();
    const specDir = temp();
    const cardSpec = path.join(specDir, 'card.json');
    const otherSpec = path.join(specDir, 'other.json');
    const defaultSpec = path.join(specDir, 'default.json');
    mkdirSync(path.join(emptyHome, 'Desktop/Workbooks/dashboard'), { recursive: true });
    writeFileSync(path.join(emptyHome, 'Desktop/Workbooks/dashboard/.env.local'), '');
    writeFileSync(cardSpec, JSON.stringify({ id: ID, outDir: CARD_DIR, colorPrompt: 'card prompt', printSize: [1500, 1500] }));
    writeFileSync(otherSpec, JSON.stringify({ id: 'l2-w01-story-page-a-nest', outDir: 'out/storytime/l2/unit1/w01/muse', colorPrompt: 'story prompt' }));
    writeFileSync(defaultSpec, JSON.stringify({ id: 'l2-w02-card-fan', colorPrompt: 'default prompt' }));
    const realCosts = ['out/storytime/l2/unit1/cards/muse/costs.tsv', 'out/storytime/l2/unit1/w01/muse/costs.tsv'].map((rel) => [rel, digest(path.join(ROOT, rel))] as const);
    const env = { PATH: process.env.PATH ?? '', HOME: emptyHome };
    try {
      for (const list of [[cardSpec, otherSpec], [otherSpec, cardSpec], [cardSpec, cardSpec, otherSpec], [cardSpec, defaultSpec]]) {
        const run = spawnSync(process.execPath, ['scripts/storytime-muse.mjs', 'color', ...list], { cwd: ROOT, env, encoding: 'utf8' });
        expect(run.status).toBe(3);
        expect(`${run.stdout}${run.stderr}`).not.toContain('no key');
      }
      expect(realCosts.map(([rel]) => digest(path.join(ROOT, rel)))).toEqual(realCosts.map(([, hash]) => hash));
      const root = temp();
      try {
        expect(guards.runGuards(root, [{ spec: { id: ID, outDir: CARD_DIR } }], 'color').refused).toBe(false);
      } finally { rmSync(root, { recursive: true, force: true }); }
    } finally {
      rmSync(emptyHome, { recursive: true, force: true });
      rmSync(specDir, { recursive: true, force: true });
    }
  });

  it('CG11 adds the judge --cards path and retains the A-48 default', async () => {
    const argv = ['--ids', ID, '--kind', 'color', '--try', '1', '--cards'];
    let options: Record<string, unknown>;
    try {
      options = judgeBatch.parseArgs(argv) as unknown as Record<string, unknown>;
    } catch {
      expect(false, 'CG11a accepts the --cards option').toBe(true);
      return;
    }
    expect(options.cards).toBe(true);
    expect(() => judgeBatch.parseArgs(['--ids', ID, '--kind', 'color', '--try', '1', '--bogus'])).toThrow(/unknown option/);
    const base = judgeBatch.parseArgs(['--ids', ID, '--kind', 'color', '--try', '1']) as unknown as Record<string, unknown>;
    expect(Object.fromEntries(Object.entries(base).filter(([, value]) => value !== undefined))).toEqual({ ids: [ID], kind: 'color', tryNo: 1, out: 'batch-color-t1' });
    const root = temp();
    try {
      const specDir = path.join(root, 'docs/storytime/l2-unit1/cards');
      mkdirSync(specDir, { recursive: true });
      writeFileSync(path.join(specDir, `${ID}.json`), JSON.stringify({ id: ID, text: 'mom', pageText: 'mom', use: 'card', mustShow: ['one mother'], outDir: CARD_DIR }));
      const costFile = path.join(root, CARD_DIR, 'costs.tsv');
      mkdirSync(path.dirname(costFile), { recursive: true });
      writeFileSync(costFile, `time\trow\tversion\tkind\toutput\n2026-11-05T12:00:00Z\t${ID}\tm1\tcolor\t${ID}-m1-color.png\n2026-11-06T01:00:00Z\t${ID}\tm2\tcolor\t${ID}-m2-color.png\n`);
      await import('sharp').then(({ default: sharp }) => sharp({ create: { width: 100, height: 100, channels: 3, background: '#fff' } }).png().toFile(path.join(root, CARD_DIR, `${ID}-m2-color.png`)));
      const built = await judgeBatch.buildBatch({ ...options, root, judgeDir: path.join(root, 'judge') } as BuildBatchOptions);
      expect(built[0]!.id).toBe(ID);
      await expect(judgeBatch.buildBatch({ ...base, root, judgeDir: path.join(root, 'judge-old') } as BuildBatchOptions)).rejects.toThrow(/no A-48 spec/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('CG12 excludes card costs from restart spend but keeps them in card spend', () => {
    const root = temp();
    try {
      writeCosts(root, 'w01/muse/costs.tsv', [costRow('2026-11-05T12:00:00Z', 'l2-w01-story-page-a-nest', 'color', 0.5)]);
      writeCosts(root, 'cards/muse/costs.tsv', [costRow(CARD_START, ID, 'color', 0.6)]);
      const restart = guards.runGuards(root, [{ spec: { id: 'l2-w01-story-page-a-nest', outDir: 'out/storytime/l2/unit1/w01/muse' } }], 'color');
      expect(restart.run).toBe('restart');
      expect(restart.refused).toBe(false);
      expect(restart.spend).toBeCloseTo(0.5);
      const card = guards.runGuards(root, [{ spec: { id: ID, outDir: CARD_DIR } }], 'color');
      expect(card.run).toBe('card');
      expect(card.refused).toBe(false);
      expect(card.spend).toBeCloseTo(0.6);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('CG13 classifies resolved output paths and refuses paths outside scanned folders', () => {
    const root = temp();
    try {
      const run = (outDir?: string) => guards.runGuards(root, [{ spec: { id: ID, ...(outDir === undefined ? {} : { outDir }) } }], 'color');
      const badPaths = [
        'out/storytime/l2/unit1/cards/muse2',
        'out/storytime/l2/unit1/../../../../tmp/storytime-outside/muse',
      ];
      for (const outDir of badPaths) {
        const result = run(outDir);
        expect.soft(result.refused, `${outDir} is refused`).toBe(true);
        expect.soft(result.code, `${outDir} exits 3`).toBe(3);
        expect.soft(result.message, `${outDir} is named`).toContain(outDir);
      }
      for (const outDir of [
        'out/storytime/l2/unit1/w03/muse',
        'out/storytime/l2/unit1/w04/muse/elements',
      ]) {
        const result = run(outDir);
        expect.soft(result.refused, `${outDir} is allowed`).toBe(false);
      }
      const defaultSpec = run();
      expect.soft(defaultSpec.refused, 'a spec without outDir uses the w01 default').toBe(false);
      const trailingSlashCard = run(`${CARD_DIR}/`);
      expect.soft(trailingSlashCard.run, 'the resolved trailing-slash card path is a card call').toBe('card');

      const repo = temp();
      const home = temp();
      const specFile = path.join(repo, 'bad-card-spec.json');
      const invalidOutDir = 'out/storytime/l2/unit1/cards/muse2';
      try {
        mkdirSync(path.join(repo, 'scripts'), { recursive: true });
        copyFileSync(path.join(ROOT, 'scripts/storytime-muse.mjs'), path.join(repo, 'scripts/storytime-muse.mjs'));
        copyFileSync(path.join(ROOT, 'scripts/storytime-muse-guards.mjs'), path.join(repo, 'scripts/storytime-muse-guards.mjs'));
        symlinkSync(path.join(ROOT, 'node_modules'), path.join(repo, 'node_modules'), 'dir');
        writeFileSync(specFile, JSON.stringify({ id: ID, outDir: invalidOutDir, colorPrompt: 'a card on white' }));
        const cli = spawnSync(process.execPath, ['scripts/storytime-muse.mjs', 'color', specFile], {
          cwd: repo,
          env: { PATH: process.env.PATH ?? '', HOME: home },
          encoding: 'utf8',
        });
        const output = `${cli.stdout}${cli.stderr}`;
        expect.soft(cli.status, 'invalid CLI outDir exits 3').toBe(3);
        expect.soft(output, 'CLI refusal names the outDir').toContain(invalidOutDir);
        expect.soft(output, 'CLI refusal happens before key access').not.toContain('no key');
      } finally {
        rmSync(home, { recursive: true, force: true });
        rmSync(repo, { recursive: true, force: true });
      }
    } finally { rmSync(root, { recursive: true, force: true }); }
  });

  it('CG14 projects spend margin across the full color and line call pools', () => {
    const root = temp();
    const cardSpecs = (count: number) => Array.from({ length: count }, (_, i) => ({ spec: { id: `card-batch-${i}`, outDir: CARD_DIR } }));
    const restartSpecs = (count: number) => Array.from({ length: count }, (_, i) => ({ spec: { id: `restart-batch-${i}`, outDir: 'out/storytime/l2/unit1/w03/muse' } }));
    try {
      writeCosts(root, 'cards/muse/costs.tsv', [costRow(CARD_START, 'existing-card', 'color', 1.5)]);
      const cardTen = guards.runGuards(root, cardSpecs(10), 'color');
      const cardNine = guards.runGuards(root, cardSpecs(9), 'color');
      expect(cardTen.refused).toBe(true);
      expect(cardNine.refused).toBe(false);

      writeCosts(root, 'cards/muse/costs.tsv', [costRow(CARD_START, 'existing-card', 'color', 1.56)]);
      const cardLineAtBoundary = guards.runGuards(root, cardSpecs(2), 'line', { tries: 2 });
      expect(cardLineAtBoundary.refused).toBe(false);
      writeCosts(root, 'cards/muse/costs.tsv', [costRow(CARD_START, 'existing-card', 'color', 1.57)]);
      const cardLineOver = guards.runGuards(root, cardSpecs(2), 'line', { tries: 2 });
      expect(cardLineOver.refused).toBe(true);

      writeCosts(root, 'w03/muse/costs.tsv', [costRow('2026-11-05T12:00:00Z', 'existing-restart', 'color', 0.95)]);
      const restartLineAtBoundary = guards.runGuards(root, restartSpecs(2), 'line', { tries: 2 });
      expect(restartLineAtBoundary.refused).toBe(false);
      writeCosts(root, 'w03/muse/costs.tsv', [costRow('2026-11-05T12:00:00Z', 'existing-restart', 'color', 0.97)]);
      const restartLineOver = guards.runGuards(root, restartSpecs(2), 'line', { tries: 2 });
      expect(restartLineOver.refused).toBe(true);
      writeCosts(root, 'w03/muse/costs.tsv', [costRow('2026-11-05T12:00:00Z', 'existing-restart', 'color', 0.99)]);
      const restartTen = guards.runGuards(root, restartSpecs(10), 'color');
      expect(restartTen.refused).toBe(true);

      writeCosts(root, 'cards/muse/costs.tsv', [costRow(CARD_START, 'existing-card', 'color', 1.58)]);
      const singleAllowed = guards.runGuards(root, cardSpecs(1), 'color');
      expect(singleAllowed.refused).toBe(false);
      writeCosts(root, 'cards/muse/costs.tsv', [costRow(CARD_START, 'existing-card', 'color', 1.595)]);
      const singleRefused = guards.runGuards(root, cardSpecs(1), 'color');
      expect(singleRefused.refused).toBe(true);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
