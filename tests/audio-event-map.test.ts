import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const MAP_PATH = join(ROOT, 'docs', 'sound-event-map.tsv');
const SET_PATH = join(ROOT, 'sounds', 'sets', 'chibi.json');
const SRC_ROOT = join(ROOT, 'src');

const EXPECTED_MAPPED: Record<string, string> = {
  tap: 'chibi/tap',
  pick: 'chibi/tap',
  swap: 'chibi/tap',
  shield: 'chibi/tap',
  correct: 'chibi/right',
  burst: 'chibi/right',
  freed: 'chibi/right',
  wrong: 'chibi/wrong',
  reject: 'chibi/wrong',
  fizzle: 'chibi/wrong',
  fizz: 'chibi/wrong',
  coins: 'chibi/star',
  collect: 'chibi/star',
  claim: 'chibi/star',
  chime: 'chibi/star',
  ding: 'chibi/star',
  bell: 'chibi/star',
  join: 'chibi/star',
  spawn: 'chibi/pop',
  boing: 'chibi/pop',
  hop: 'chibi/pop',
  bump: 'chibi/pop',
  plop: 'chibi/pop',
  whoosh: 'chibi/whoosh',
  arrow: 'chibi/whoosh',
  shoot: 'chibi/whoosh',
  flap: 'chibi/whoosh',
  creak: 'chibi/whoosh',
  strike: 'chibi/whoosh',
  page: 'chibi/whoosh',
  victory: 'chibi/level-end',
};

const SYNTH_EVENTS = [
  'aura',
  'bolt',
  'boom',
  'cast',
  'clang',
  'clank',
  'crash',
  'crumble',
  'defeat',
  'eek',
  'groan',
  'gulp',
  'heal',
  'hit',
  'light',
  'munch',
  'open',
  'pour',
  'roar',
  'rumble',
  'shatter',
  'spit',
  'storm',
  'thud',
  'tower',
  'wail',
  'ward',
];

const EXPECTED_EVENTS = [...Object.keys(EXPECTED_MAPPED), ...SYNTH_EVENTS];

const ALLOWED_SOURCES = new Set([
  'chibi/tap',
  'chibi/right',
  'chibi/wrong',
  'chibi/star',
  'chibi/pop',
  'chibi/whoosh',
  'chibi/level-end',
  'synth',
]);

const SET_ENTRY_NAMES = ['tap', 'right', 'wrong', 'star', 'pop', 'whoosh', 'level-end'];

function readContentLines(): string[] {
  const raw = readFileSync(MAP_PATH, 'utf8');
  expect(raw.indexOf('\r'), 'CRLF check: carriage return found').toBe(-1);
  const lines = raw.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

function readRows(): { event: string; source: string; note: string }[] {
  const lines = readContentLines();
  return lines.slice(1).map((line) => {
    const parts = line.split('\t');
    return { event: parts[0] ?? '', source: parts[1] ?? '', note: parts[2] ?? '', raw: line } as {
      event: string;
      source: string;
      note: string;
    };
  });
}

function collectSrcNames(root: string): Set<string> {
  const names = new Set<string>();
  const stack = [root];
  const playRe = /audio\.play\('([^']+)'/g;
  const defineRe = /audio\.defineSfx\('([^']+)'/g;
  const sfxRe = /\.sfx\('([^']+)'/g;
  while (stack.length > 0) {
    const current = stack.pop() as string;
    const stat = statSync(current);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(current)) {
        stack.push(join(current, entry));
      }
    } else if (current.endsWith('.ts')) {
      const text = readFileSync(current, 'utf8');
      for (const re of [playRe, defineRe, sfxRe]) {
        re.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = re.exec(text)) !== null) {
          names.add(match[1] as string);
        }
      }
    }
  }
  return names;
}

describe('audio event map', () => {
  it('holds the header line and exactly 58 data rows', () => {
    const lines = readContentLines();
    expect(lines.length, `line count: ${lines.length}`).toBe(59);
    expect(lines[0]).toBe('event\tsource\tnote');
    const dataRows = lines.slice(1);
    expect(dataRows.length, `data row count: ${dataRows.length}`).toBe(58);
    for (const row of dataRows) {
      expect(row, `blank row found`).not.toBe('');
      expect(row.startsWith('#'), `comment row found: ${row}`).toBe(false);
    }
  });

  it('holds three fields per row with unique events and known sources', () => {
    const lines = readContentLines();
    const dataRows = lines.slice(1);
    const seen = new Set<string>();
    for (const row of dataRows) {
      const parts = row.split('\t');
      expect(parts.length, `field count for event row: ${row}`).toBe(3);
    }
    for (const row of dataRows) {
      const event = row.split('\t')[0] as string;
      expect(seen.has(event), `duplicate event: ${event}`).toBe(false);
      seen.add(event);
    }
    expect(seen.size, `event count: ${seen.size}`).toBe(58);
    for (const row of dataRows) {
      const parts = row.split('\t');
      const source = parts[1] as string;
      expect(ALLOWED_SOURCES.has(source), `unknown source for event ${parts[0]}: ${source}`).toBe(true);
    }
  });

  it('holds exactly the 58 spec names in both directions', () => {
    const rows = readRows();
    const mapEvents = new Set(rows.map((row) => row.event));
    expect(mapEvents.size, `map event count: ${mapEvents.size}`).toBe(58);
    expect(EXPECTED_EVENTS.length, `expected event count: ${EXPECTED_EVENTS.length}`).toBe(58);
    for (const name of EXPECTED_EVENTS) {
      expect(mapEvents.has(name), `map is missing event: ${name}`).toBe(true);
    }
    for (const name of mapEvents) {
      expect(EXPECTED_EVENTS.includes(name), `map holds extra event: ${name}`).toBe(true);
    }
  });

  it('maps each of the 31 rows to its spec source', () => {
    const rows = readRows();
    const byEvent = new Map(rows.map((row) => [row.event, row.source]));
    const mappedNames = Object.keys(EXPECTED_MAPPED);
    expect(mappedNames.length, `mapped row count: ${mappedNames.length}`).toBe(31);
    for (const name of mappedNames) {
      expect(byEvent.get(name), `wrong source for event: ${name}`).toBe(EXPECTED_MAPPED[name]);
    }
  });

  it('holds synth for each of the 27 unmapped rows', () => {
    const rows = readRows();
    const byEvent = new Map(rows.map((row) => [row.event, row.source]));
    expect(SYNTH_EVENTS.length, `synth row count: ${SYNTH_EVENTS.length}`).toBe(27);
    for (const name of SYNTH_EVENTS) {
      expect(byEvent.get(name), `wrong source for event: ${name}`).toBe('synth');
    }
  });

  it('uses each of the seven set entries at least once', () => {
    const rows = readRows();
    const counts = new Map<string, number>();
    for (const row of rows) {
      counts.set(row.source, (counts.get(row.source) ?? 0) + 1);
    }
    for (const entry of SET_ENTRY_NAMES) {
      const source = `chibi/${entry}`;
      expect(
        counts.get(source) ?? 0,
        `source row count for ${source}: ${counts.get(source) ?? 0}`,
      ).toBeGreaterThan(0);
    }
  });

  it('matches the seven set entry names of sounds/sets/chibi.json', () => {
    const rows = readRows();
    const raw = readFileSync(SET_PATH, 'utf8');
    const parsed = JSON.parse(raw) as { sounds: { name: string }[] };
    const setNames = parsed.sounds.map((entry) => entry.name);
    expect(setNames.length, `set entry count: ${setNames.length}`).toBe(7);
    const setNameSet = new Set(setNames);
    for (const name of SET_ENTRY_NAMES) {
      expect(setNameSet.has(name), `set file is missing entry: ${name}`).toBe(true);
    }
    for (const name of setNameSet) {
      expect(SET_ENTRY_NAMES.includes(name), `set file holds extra entry: ${name}`).toBe(true);
    }
    const suffixes = new Set(
      rows.filter((row) => row.source !== 'synth').map((row) => row.source.slice('chibi/'.length)),
    );
    for (const name of setNames) {
      expect(suffixes.has(name), `map never uses set entry: ${name}`).toBe(true);
    }
  });

  it('matches the src literal-name set from the three call patterns', () => {
    const rows = readRows();
    const mapNames = new Set(rows.map((row) => row.event));
    const srcNames = collectSrcNames(SRC_ROOT);
    // eslint-disable-next-line no-console
    console.log(`src event count: ${srcNames.size}`);
    expect(srcNames.size, `src event count: ${srcNames.size}`).toBe(58);
    expect(mapNames.size, `map event count: ${mapNames.size}`).toBe(58);
    for (const name of srcNames) {
      expect(mapNames.has(name), `src event missing from map: ${name}`).toBe(true);
    }
    for (const name of mapNames) {
      expect(srcNames.has(name), `map event missing from src: ${name}`).toBe(true);
    }
  });
});
