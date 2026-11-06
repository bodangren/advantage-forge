#!/usr/bin/env node
// Red tests for the week staging check (strategy section 7, subsection 4.3).
//
// The contract that Green must implement in `scripts/storytime-stage-check.mjs`:
//   node scripts/storytime-stage-check.mjs --week 2 --list <pictures.json> --specs <folder>
//     [--list-sha256 <hex>]
//
// The script reads the list read only. It resolves every relative path against the process
// working directory, so a fixture can run in a temporary repository root. Without
// `--list-sha256` the pin is the version 4 value; a different list exits 2. `--list-sha256`
// is the test seam that lets a small fixture week pass the pin; the live gate omits it.
//
// Exit codes: 0 all checks hold; 1 a check failed and the output names the row; 2 the list
// SHA-256 differs from the pin.
//
// Label block, one line each, in this order:
//   list sha256: <hex>
//   week: <n>
//   rows: <n>
//   specs found: <n>
//   text mismatches: <n>
//   goal mismatches: <n>
//   outDir mismatches: <n>
//   rows with no reference (class A and B): <n>
//   element paths checked: <n>
//   missing element paths: <n>
//   characters without a reference: <n>
//   page candidates: <n>
//   stage check: pass
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const SCRIPT = path.resolve(import.meta.dirname, '../scripts/storytime-stage-check.mjs');
const OUT_DIR = 'out/storytime/l2/unit1/w02/muse';
const V4_SHA256 = '6d05dfc596c7f1891577a800a9375228136acc332c7c8b975c9df0bf6c062a58';
const V3_SHADOW_FILE = path.resolve(import.meta.dirname, 'fixtures/storytime/pictures-v3.json');
// A 1 x 1 PNG. The stage check reads the signature and the size only.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

type StageRow = {
  id: string;
  week: number;
  use: string;
  text: string;
  prompt: string;
  sizeClass: 'A' | 'B' | 'C';
  fileName: string;
  lineArtFileName: string;
  width: number;
  height: number;
};

type StageSpec = {
  id: string;
  week: number;
  text: string;
  goal: string;
  outDir: string;
  colorPrompt: string;
  linePrompt: string;
  references: string[];
};

const ROWS: StageRow[] = [
  {
    id: 'l2-w02-story-page-aa',
    week: 2,
    use: 'story-page',
    text: 'Pat sees a red ball.',
    prompt: 'Pat holds a red ball in the park.',
    sizeClass: 'A',
    fileName: 'l2-w02-story-page-aa-v1.png',
    lineArtFileName: 'l2-w02-story-page-aa-line-v1.png',
    width: 4000,
    height: 3000,
  },
  {
    id: 'l2-w02-cover-ab',
    week: 2,
    use: 'cover',
    text: '',
    prompt: 'A calm park with one red ball.',
    sizeClass: 'B',
    fileName: 'l2-w02-cover-ab-v1.png',
    lineArtFileName: 'l2-w02-cover-ab-line-v1.png',
    width: 4000,
    height: 3000,
  },
  {
    id: 'l2-w02-check-row-ac',
    week: 2,
    use: 'check-row',
    text: 'ball',
    // The nine week 2 check rows carry an empty list prompt, so their spec goal is empty too.
    prompt: '',
    sizeClass: 'C',
    fileName: 'l2-w02-check-row-ac-v1.png',
    lineArtFileName: 'l2-w02-check-row-ac-line-v1.png',
    width: 1500,
    height: 1500,
  },
];

function sha256(bytes: Buffer | string): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function specFor(row: StageRow, references: string[]): StageSpec {
  // An empty list prompt gives an empty goal. The non-empty rule covers colorPrompt and
  // linePrompt only, so the check row carries its own non-empty prompts.
  const empty = row.prompt.length === 0;
  return {
    id: row.id,
    week: row.week,
    text: row.text,
    goal: row.prompt,
    outDir: OUT_DIR,
    colorPrompt: empty ? 'A red ball on a plain white ground.' : `Color: ${row.prompt}`,
    linePrompt: empty ? 'A red ball outline on white.' : `Line: ${row.prompt}`,
    references,
  };
}

type Fixture = {
  root: string;
  listFile: string;
  specsDir: string;
  rows: StageRow[];
  specs: Record<string, StageSpec>;
  listSha256: string;
};

async function writeSpec(fixture: Fixture, spec: StageSpec): Promise<void> {
  fixture.specs[spec.id] = spec;
  await writeFile(path.join(fixture.specsDir, `${spec.id}.json`), JSON.stringify(spec, null, 2));
}

async function buildFixture(): Promise<Fixture> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'stage-check-'));
  const specsDir = path.join(root, 'specs');
  // The element specs sit in a sibling folder, as in `docs/storytime/l2/unit1/w02/muse-elements/`.
  // The check reads them as inputs and does not count them as page specs.
  const elementsSpecDir = path.join(root, 'muse-elements');
  const elementsDir = path.join(root, 'out/fixture');
  await mkdir(specsDir, { recursive: true });
  await mkdir(elementsSpecDir, { recursive: true });
  await mkdir(elementsDir, { recursive: true });
  await mkdir(path.join(root, OUT_DIR), { recursive: true });
  await writeFile(path.join(elementsDir, 'pat-front.png'), PNG);
  await writeFile(path.join(elementsDir, 'park-empty.png'), PNG);
  for (const [id, file] of [
    ['pat-front', 'out/fixture/pat-front.png'],
    ['park-empty', 'out/fixture/park-empty.png'],
  ] as const) {
    await writeFile(
      path.join(elementsSpecDir, `${id}.json`),
      JSON.stringify({ id, kind: 'element', file }, null, 2),
    );
  }
  const listFile = path.join(root, 'pictures.json');
  await writeFile(listFile, JSON.stringify(ROWS, null, 2));
  const fixture: Fixture = {
    root,
    listFile,
    specsDir,
    rows: ROWS.map((row) => ({ ...row })),
    specs: {},
    listSha256: sha256(JSON.stringify(ROWS, null, 2)),
  };
  await writeSpec(fixture, specFor(ROWS[0]!, ['out/fixture/pat-front.png', 'out/fixture/park-empty.png']));
  await writeSpec(fixture, specFor(ROWS[1]!, ['out/fixture/park-empty.png']));
  await writeSpec(fixture, specFor(ROWS[2]!, []));
  return fixture;
}

type CheckRun = { status: number; stdout: string; output: string };

function runCheck(fixture: Fixture, extra: string[] = []): CheckRun {
  const result = spawnSync(
    process.execPath,
    [
      SCRIPT,
      '--week',
      '2',
      '--list',
      fixture.listFile,
      '--specs',
      fixture.specsDir,
      ...extra,
    ],
    { cwd: fixture.root, encoding: 'utf8' },
  );
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const status = result.status ?? (result.error ? 127 : -1);
  return { status, stdout, output: `${stdout}${stderr}` };
}

function labels(run: CheckRun): string[] {
  return run.stdout.split('\n').map((line) => line.trimEnd()).filter((line) => line.length > 0);
}

function expectedLabels(fixture: Fixture): string[] {
  return [
    `list sha256: ${fixture.listSha256}`,
    'week: 2',
    'rows: 3',
    'specs found: 3',
    'text mismatches: 0',
    'goal mismatches: 0',
    'outDir mismatches: 0',
    'rows with no reference (class A and B): 0',
    'element paths checked: 3',
    'missing element paths: 0',
    'characters without a reference: 0',
    'page candidates: 0',
    'stage check: pass',
  ];
}

let fixture: Fixture;
beforeEach(async () => {
  fixture = await buildFixture();
});

afterEach(async () => {
  if (fixture) await rm(fixture.root, { recursive: true, force: true });
});

describe('Week staging check', () => {
  it('T178 passes a fixture week of 3 rows and prints every label with its exact value', async () => {
    expect.soft(existsSync(SCRIPT), 'The stage check script exists.').toBe(true);
    const run = runCheck(fixture, ['--list-sha256', fixture.listSha256]);
    expect.soft({ 'Stage check exit code': run.status }).toEqual({ 'Stage check exit code': 0 });
    expect.soft({ 'Stage check labels': labels(run) })
      .toEqual({ 'Stage check labels': expectedLabels(fixture) });
    expect.soft({
      'Element paths checked': labels(run).filter((line) => line.startsWith('element paths checked: ')),
    }).toEqual({ 'Element paths checked': ['element paths checked: 3'] });
  }, 120000);

  it('T179 refuses every fixture mutation with exit 1 and names the row', async () => {
    expect.soft(existsSync(SCRIPT), 'The stage check script exists.').toBe(true);
    const good = runCheck(fixture, ['--list-sha256', fixture.listSha256]);
    expect.soft({ 'The unmutated fixture passes': good.status })
      .toEqual({ 'The unmutated fixture passes': 0 });

    const row = ROWS[0]!;
    const mutations: Array<{ name: string; match: string; apply: (current: Fixture) => Promise<void> }> = [
      {
        name: 'a deleted spec',
        match: row.id,
        apply: async (current) => {
          await rm(path.join(current.specsDir, `${row.id}.json`));
        },
      },
      {
        name: 'a changed text character',
        match: row.id,
        apply: async (current) => {
          const spec = { ...current.specs[row.id]!, text: `${row.text.slice(0, -1)}X` };
          await writeSpec(current, spec);
        },
      },
      {
        name: 'a changed goal character',
        match: row.id,
        apply: async (current) => {
          const spec = { ...current.specs[row.id]!, goal: `${row.prompt.slice(0, -1)}X` };
          await writeSpec(current, spec);
        },
      },
      {
        name: 'a trailing space in the goal',
        match: row.id,
        apply: async (current) => {
          const spec = { ...current.specs[row.id]!, goal: `${row.prompt} ` };
          await writeSpec(current, spec);
        },
      },
      {
        name: 'a missing reference file',
        match: row.id,
        apply: async (current) => {
          const spec = { ...current.specs[row.id]!, references: ['out/fixture/absent-front.png'] };
          await writeSpec(current, spec);
        },
      },
      {
        name: 'an empty reference list on a class A row',
        match: row.id,
        apply: async (current) => {
          const spec = { ...current.specs[row.id]!, references: [] };
          await writeSpec(current, spec);
        },
      },
      {
        name: 'a parent-directory reference',
        match: row.id,
        apply: async (current) => {
          const spec = { ...current.specs[row.id]!, references: ['out/fixture/../fixture/pat-front.png'] };
          await writeSpec(current, spec);
        },
      },
      {
        name: 'a symbolic-link reference',
        match: row.id,
        apply: async (current) => {
          await symlink('pat-front.png', path.join(current.root, 'out/fixture/link-front.png'));
          const spec = { ...current.specs[row.id]!, references: ['out/fixture/link-front.png'] };
          await writeSpec(current, spec);
        },
      },
      {
        name: 'a changed outDir',
        match: row.id,
        apply: async (current) => {
          const spec = { ...current.specs[row.id]!, outDir: 'out/storytime/l2/unit1/w03/muse' };
          await writeSpec(current, spec);
        },
      },
      {
        name: 'a non-empty goal against an empty list prompt',
        match: ROWS[2]!.id,
        apply: async (current) => {
          const spec = { ...current.specs[ROWS[2]!.id]!, goal: 'One red ball.' };
          await writeSpec(current, spec);
        },
      },
      {
        name: 'a page candidate file',
        match: row.id,
        apply: async (current) => {
          await writeFile(path.join(current.root, OUT_DIR, `${row.id}-m1-color.png`), PNG);
        },
      },
    ];

    for (const mutation of mutations) {
      const current = await buildFixture();
      try {
        await mutation.apply(current);
        const run = runCheck(current, ['--list-sha256', current.listSha256]);
        expect.soft({ [`Stage check refuses ${mutation.name}`]: run.status })
          .toEqual({ [`Stage check refuses ${mutation.name}`]: 1 });
        expect.soft({ [`The refusal of ${mutation.name} names the row`]: run.output.includes(mutation.match) })
          .toEqual({ [`The refusal of ${mutation.name} names the row`]: true });
      } finally {
        await rm(current.root, { recursive: true, force: true });
      }
    }
  }, 240000);

  it('T180 exits 2 for a list whose SHA-256 is not the version 4 value', async () => {
    expect.soft(existsSync(SCRIPT), 'The stage check script exists.').toBe(true);

    const fixtureRun = runCheck(fixture);
    expect.soft({ 'The fixture list without the pin exits 2': fixtureRun.status })
      .toEqual({ 'The fixture list without the pin exits 2': 2 });

    expect.soft(existsSync(V3_SHADOW_FILE), 'The version 3 shadow copy exists.').toBe(true);
    await writeFile(fixture.listFile, await readFile(V3_SHADOW_FILE));
    const version3 = runCheck(fixture);
    expect.soft({ 'The version 3 list exits 2': version3.status })
      .toEqual({ 'The version 3 list exits 2': 2 });
    expect.soft({ 'The refusal names the version 4 SHA-256': version3.output.includes(V4_SHA256) })
      .toEqual({ 'The refusal names the version 4 SHA-256': true });
  }, 120000);
});
