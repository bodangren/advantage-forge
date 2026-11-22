import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const MAP_PATH = join(ROOT, 'docs/sound-event-map.tsv');
const ORIGINAL_TEST = 'tests/audio-event-map.test.ts';

function contentLines(raw: string): string[] {
  const lines = raw.split('\n');
  if (lines.at(-1) === '') lines.pop();
  return lines;
}

function assertNotes(raw: string): void {
  const rows = contentLines(raw).slice(1);
  expect(rows.length, 'note row count').toBe(58);
  for (const row of rows) {
    const fields = row.split('\t');
    expect(fields.length, `note field count: ${row}`).toBe(3);
    const event = fields[0]!;
    const note = fields[2]!.trim();
    expect(note.length, `empty note: ${event}`).toBeGreaterThan(0);
    expect(note.split(/\s+/).length, `note word count: ${event}`).toBeLessThanOrEqual(3);
  }
}

function replaceTap(raw: string, fields: string[]): string {
  const lines = contentLines(raw);
  const index = lines.findIndex((line) => line.startsWith('tap\t'));
  expect(index, 'tap fixture row index').toBeGreaterThan(0);
  lines[index] = fields.join('\t');
  return `${lines.join('\n')}\n`;
}

interface CaseResult {
  title: string;
  status: string;
  failureMessages: string[];
}

// Run the unchanged Red file with native Vitest and real filesystem reads.
// Each fixture owns its map copy. The source and sound-set inputs stay read-only.
function runOriginalCases(raw: string): CaseResult[] {
  const cache = join(homedir(), '.cache/opencode');
  mkdirSync(cache, { recursive: true });
  const fixture = mkdtempSync(join(cache, 'audio-map-adversarial-'));
  try {
    for (const dir of ['tests', 'docs', 'sounds/sets']) {
      mkdirSync(join(fixture, dir), { recursive: true });
    }
    copyFileSync(join(ROOT, ORIGINAL_TEST), join(fixture, ORIGINAL_TEST));
    copyFileSync(join(ROOT, 'sounds/sets/chibi.json'), join(fixture, 'sounds/sets/chibi.json'));
    symlinkSync(join(ROOT, 'src'), join(fixture, 'src'), 'dir');
    symlinkSync(join(ROOT, 'node_modules'), join(fixture, 'node_modules'), 'dir');
    writeFileSync(join(fixture, 'docs/sound-event-map.tsv'), raw);
    writeFileSync(
      join(fixture, 'vitest.config.mjs'),
      "export default { test: { include: ['tests/audio-event-map.test.ts'] } };\n",
    );
    const resultPath = join(fixture, 'result.json');
    const child = spawnSync(
      process.execPath,
      [
        join(ROOT, 'node_modules/vitest/vitest.mjs'),
        'run',
        '--maxWorkers=1',
        '--config',
        join(fixture, 'vitest.config.mjs'),
        '--reporter=json',
        '--outputFile',
        resultPath,
        ORIGINAL_TEST,
      ],
      { cwd: fixture, encoding: 'utf8', timeout: 20_000 },
    );
    expect(child.error, `fixture launch: ${child.stderr}`).toBeUndefined();
    expect(child.signal, `fixture signal: ${child.stderr}`).toBeNull();
    const report = JSON.parse(readFileSync(resultPath, 'utf8')) as {
      numTotalTests: number;
      numFailedTests: number;
      testResults: { assertionResults: CaseResult[] }[];
    };
    expect(report.numTotalTests, 'native fixture case count').toBe(8);
    expect(child.status, `native fixture exit: ${child.stderr}`).toBe(report.numFailedTests === 0 ? 0 : 1);
    const cases = report.testResults.flatMap((result) => result.assertionResults);
    expect(cases.length, 'native fixture assertion count').toBe(8);
    expect(cases.every((entry) => ['passed', 'failed'].includes(entry.status))).toBe(true);
    return cases;
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

function failedCases(raw: string): CaseResult[] {
  return runOriginalCases(raw).filter((entry) => entry.status === 'failed');
}

interface LiteralCall {
  method: 'play' | 'defineSfx' | 'sfx';
  name: string;
  quoted: string;
  spaced: boolean;
}

// Syntax, not spacing or quote style, identifies the three AC1 call forms.
function literalCalls(text: string, filename = 'fixture.ts'): LiteralCall[] {
  const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true);
  const calls: LiteralCall[] = [];
  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const access = node.expression;
      const method = access.name.text;
      const receiverIsAudio =
        (ts.isIdentifier(access.expression) && access.expression.text === 'audio') ||
        (ts.isPropertyAccessExpression(access.expression) && access.expression.name.text === 'audio');
      const relevant = method === 'sfx' || (receiverIsAudio && ['play', 'defineSfx'].includes(method));
      const argument = node.arguments[0];
      if (relevant && argument && ts.isStringLiteral(argument)) {
        calls.push({
          method: method as LiteralCall['method'],
          name: argument.text,
          quoted: argument.getText(source),
          spaced: source.text.slice(access.end, argument.getStart(source)) !== '(',
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return calls;
}

function sourceCalls(root: string): LiteralCall[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return sourceCalls(path);
    if (!/\.[cm]?tsx?$/.test(entry.name)) return [];
    return literalCalls(readFileSync(path, 'utf8'), path);
  });
}

describe('audio event map adversarial checks', () => {
  it('requires a nonempty note of at most three words on every committed row', () => {
    assertNotes(readFileSync(MAP_PATH, 'utf8'));
  });

  it.each(['', '   ', 'this note has four'])('rejects the note mutation %j', (note) => {
    const raw = readFileSync(MAP_PATH, 'utf8');
    const mutation = replaceTap(raw, ['tap', 'chibi/tap', note]);
    expect(() => assertNotes(mutation)).toThrowError(
      note.trim() === '' ? /^empty note: tap/ : /^note word count: tap/,
    );
  });

  it.each(['tap', 'tap sound', 'tap sound starts', 'tap  sound   starts'])(
    'accepts the note boundary %j',
    (note) => {
      const raw = readFileSync(MAP_PATH, 'utf8');
      assertNotes(replaceTap(raw, ['tap', 'chibi/tap', note]));
    },
  );

  it('runs all original cases against an unchanged map copy', () => {
    expect(failedCases(readFileSync(MAP_PATH, 'utf8'))).toEqual([]);
  }, 30_000);

  it('rejects a header-only map through every original case', () => {
    expect(failedCases('event\tsource\tnote\n').length, 'empty map failed case count').toBe(8);
  }, 30_000);

  it('rejects CRLF bytes through the original cases', () => {
    const raw = readFileSync(MAP_PATH, 'utf8');
    expect(raw).not.toContain('\r');
    const failures = failedCases(raw.replaceAll('\n', '\r\n'));
    expect(failures.length, 'CRLF failed case count').toBe(8);
    for (const entry of failures) {
      expect(entry.failureMessages.join('\n')).toMatch(/^AssertionError: CRLF check:/);
    }
  }, 30_000);

  it('rejects an extra trailing blank line through the original header case', () => {
    const raw = `${readFileSync(MAP_PATH, 'utf8').replace(/\n$/, '')}\n\n`;
    const failures = failedCases(raw);
    const header = failures.find((entry) => entry.title === 'holds the header line and exactly 58 data rows');
    expect(header, 'blank-line header failure').toBeDefined();
    expect(header!.failureMessages.join('\n')).toMatch(/^AssertionError: line count: 60/);
  }, 30_000);

  it('rejects a duplicate name without changing the number of rows', () => {
    const raw = readFileSync(MAP_PATH, 'utf8');
    const mutation = replaceTap(raw, ['pick', 'chibi/tap', 'tap sound']);
    expect(contentLines(mutation).length, 'duplicate fixture line count').toBe(59);
    const failures = failedCases(mutation);
    const unique = failures.find(
      (entry) => entry.title === 'holds three fields per row with unique events and known sources',
    );
    expect(unique, 'duplicate-name failure').toBeDefined();
    expect(unique!.failureMessages.join('\n')).toMatch(/^AssertionError: duplicate event: pick/);
  }, 30_000);

  it('rejects a wrong source that is still an allowed source', () => {
    const raw = readFileSync(MAP_PATH, 'utf8');
    const mutation = replaceTap(raw, ['tap', 'chibi/right', 'tap sound']);
    const failures = failedCases(mutation);
    expect(failures.map((entry) => entry.title)).toEqual(['maps each of the 31 rows to its spec source']);
    expect(failures[0]!.failureMessages.join('\n')).toMatch(/^AssertionError: wrong source for event: tap/);
  }, 30_000);

  it.each(['audio.play', 'audio.defineSfx', 'driver.sfx', 'this.audio.play'])(
    'preserves names across quote and spacing variants of %s',
    (method) => {
      for (const call of [
        `${method}('probe');`,
        `${method}("probe");`,
        `${method}  (  'probe'  );`,
        `${method}\n(\n"probe"\n);`,
      ]) {
        expect(
          literalCalls(call).map((entry) => entry.name),
          call,
        ).toEqual(['probe']);
      }
    },
  );

  it('preserves an unlisted event on a line that also contains a filter word', () => {
    const names = literalCalls('audio.play("unlisted-never"); // never drop this hit');
    expect(names.map((entry) => entry.name)).toEqual(['unlisted-never']);
    const mapNames = new Set(
      contentLines(readFileSync(MAP_PATH, 'utf8'))
        .slice(1)
        .map((row) => row.split('\t')[0]),
    );
    expect(names.filter((entry) => !mapNames.has(entry.name)).map((entry) => entry.name)).toEqual([
      'unlisted-never',
    ]);
  });

  it('ignores comment text, string text, other receivers, and nonliteral arguments', () => {
    const text = [
      "// audio.play('comment-only');",
      'const text = "audio.defineSfx(\'string-only\')";',
      "other.play('other-only');",
      "myaudio.defineSfx('prefix-only', recipe);",
      'audio.play(SFX[event]);',
      "audio.play('real');",
    ].join('\n');
    expect(literalCalls(text).map((entry) => entry.name)).toEqual(['real']);
  });

  it('matches the live source names in both directions with the syntax-aware scan', () => {
    const calls = sourceCalls(join(ROOT, 'src'));
    const names = new Set(calls.map((entry) => entry.name));
    const mapNames = new Set(
      contentLines(readFileSync(MAP_PATH, 'utf8'))
        .slice(1)
        .map((row) => row.split('\t')[0]),
    );
    console.log(
      `adversarial src event count: ${names.size}; play: ${calls.filter((entry) => entry.method === 'play').length}; defineSfx: ${calls.filter((entry) => entry.method === 'defineSfx').length}; sfx: ${calls.filter((entry) => entry.method === 'sfx').length}; double-quoted: ${calls.filter((entry) => entry.quoted.startsWith('"')).length}; spaced: ${calls.filter((entry) => entry.spaced).length}`,
    );
    expect(names.size, 'syntax-aware src event count').toBe(58);
    expect(mapNames.size, 'syntax-aware map event count').toBe(58);
    expect([...names].sort(), 'syntax-aware source/map equality').toEqual([...mapNames].sort());
  });
});
