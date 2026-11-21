import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'sound-set.mjs');

const FAKE_ENTRIES = [
  { name: 'alpha', design: 'tap/soft' },
  { name: 'beta', design: 'error/knock' },
];

const EXPECTED_CHIBI_ENTRIES = [
  { name: 'tap', design: 'tap/soft' },
  { name: 'right', design: 'success/rise' },
  { name: 'wrong', design: 'error/knock' },
  { name: 'star', design: 'coin/bright' },
  { name: 'pop', design: 'pop/bubble' },
  { name: 'whoosh', design: 'whoosh/soft' },
  { name: 'level-end', design: 'success/triad' },
];

function withTemp(callback: (tmp: string) => void) {
  const tmp = mkdtempSync(join(tmpdir(), 'sound-set-'));
  try {
    callback(tmp);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function writeSetFile(root: string, set: string, value: unknown) {
  const dir = join(root, 'sounds', 'sets');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${set}.json`), typeof value === 'string' ? value : JSON.stringify(value));
}

function setPath(root: string, set: string) {
  return join(root, 'sounds', 'sets', `${set}.json`);
}

function outputPath(root: string, set: string, name: string) {
  return join(root, 'sounds', set, `${name}.ogg`);
}

function writeFakeBin(tmp: string) {
  const fake = join(tmp, 'earshot-fake.mjs');
  const lines = [
    '#!/usr/bin/env node',
    "import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';",
    "import { dirname, join } from 'node:path';",
    `const tmp = ${JSON.stringify(tmp)};`,
    'const args = process.argv.slice(2);',
    "const flag = args.indexOf('-o');",
    "const out = flag >= 0 ? args[flag + 1] : '';",
    'const readOptional = (path) => {',
    "  try { return readFileSync(path, 'utf8').trim(); } catch { return ''; }",
    '};',
    "const failAt = readOptional(join(tmp, 'fail-at'));",
    "if (failAt !== '' && out.endsWith(`/${failAt}.ogg`)) process.exit(3);",
    "appendFileSync(join(tmp, 'calls.log'), `${args.join(' ')}\\n`);",
    "const base = out.split('/').pop() ?? '';",
    "const name = base.endsWith('.ogg') ? base.slice(0, -4) : base;",
    "if (readOptional(join(tmp, 'no-write')) !== name) {",
    '  mkdirSync(dirname(out), { recursive: true });',
    "  writeFileSync(out, 'OggS');",
    '}',
  ];
  writeFileSync(fake, `${lines.join('\n')}\n`, { mode: 0o755 });
  return fake;
}

function run(args: string[], root: string, earshotBin: string) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, SOUNDS_ROOT: root, EARSHOT_BIN: earshotBin },
  });
}

function readCallsLog(tmp: string) {
  return readFileSync(join(tmp, 'calls.log'), 'utf8').trim().split('\n');
}

describe('sound-set wrapper through a fake earshot binary', () => {
  it('renders the full set in order and prints the success lines', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'fake', { sounds: FAKE_ENTRIES });
      const result = run(['fake'], tmp, writeFakeBin(tmp));
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout.trim().split('\n')).toEqual([
        'sound-set: alpha.ogg <- tap/soft',
        'sound-set: beta.ogg <- error/knock',
        'sound-set: 2 sounds -> sounds/fake',
      ]);
      const count = Number(result.stdout.match(/(\d+) sounds ->/)?.[1]);
      expect(count).toBe(2);
      const root = join(tmp, 'sounds', 'fake');
      expect(readCallsLog(tmp)).toEqual([
        `make --sound tap/soft -o ${join(root, 'alpha.ogg')}`,
        `make --sound error/knock -o ${join(root, 'beta.ogg')}`,
      ]);
      expect(existsSync(outputPath(tmp, 'fake', 'alpha'))).toBe(true);
      expect(existsSync(outputPath(tmp, 'fake', 'beta'))).toBe(true);
    });
  });

  it('fails with the exact line when the set file is missing', () => {
    withTemp((tmp) => {
      const result = run(['none'], tmp, writeFakeBin(tmp));
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe(`sound-set: set file not found: ${setPath(tmp, 'none')}`);
      expect(existsSync(join(tmp, 'calls.log'))).toBe(false);
    });
  });

  it('fails with the exact line when the set file is not valid JSON', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'bad', 'not json');
      const result = run(['bad'], tmp, writeFakeBin(tmp));
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe(`sound-set: set file is not valid JSON: ${setPath(tmp, 'bad')}`);
      expect(existsSync(join(tmp, 'calls.log'))).toBe(false);
    });
  });

  const shapeCases = [
    {
      title: 'rejects a set file without a sounds array',
      value: {},
      line: 'sound-set: bad set file: sounds must be a non-empty array',
    },
    {
      title: 'rejects a set file with an empty sounds array',
      value: { sounds: [] },
      line: 'sound-set: bad set file: sounds must be a non-empty array',
    },
    {
      title: 'rejects an entry without a name',
      value: { sounds: [{ design: 'tap/soft' }] },
      line: 'sound-set: bad set file: entry 0 needs a name',
    },
    {
      title: 'rejects an entry with an empty design',
      value: { sounds: [{ name: 'alpha', design: '' }] },
      line: 'sound-set: bad set file: entry 0 needs a design',
    },
    {
      title: 'rejects two entries that share a name',
      value: {
        sounds: [
          { name: 'alpha', design: 'tap/soft' },
          { name: 'alpha', design: 'error/knock' },
        ],
      },
      line: 'sound-set: bad set file: duplicate name alpha',
    },
    {
      title: 'rejects an entry with a bad name',
      value: { sounds: [{ name: 'Bad_Name', design: 'tap/soft' }] },
      line: 'sound-set: bad set file: bad name Bad_Name',
    },
  ];

  for (const shapeCase of shapeCases) {
    it(shapeCase.title, () => {
      withTemp((tmp) => {
        writeSetFile(tmp, 'fake', shapeCase.value);
        const result = run(['fake'], tmp, writeFakeBin(tmp));
        expect(result.status).toBe(1);
        expect(result.stderr.trim()).toBe(shapeCase.line);
        expect(existsSync(join(tmp, 'calls.log'))).toBe(false);
      });
    });
  }

  it('prints the usage line and exits 2 with no argument', () => {
    withTemp((tmp) => {
      const result = run([], tmp, writeFakeBin(tmp));
      expect(result.status).toBe(2);
      expect(result.stderr.trim()).toBe('sound-set: usage: node scripts/sound-set.mjs <set>');
      expect(existsSync(join(tmp, 'calls.log'))).toBe(false);
    });
  });

  it('rejects a set name outside a-z, 0-9, and dash', () => {
    withTemp((tmp) => {
      const result = run(['../x'], tmp, writeFakeBin(tmp));
      expect(result.status).toBe(2);
      expect(result.stderr.trim()).toBe('sound-set: bad set name: ../x');
      expect(existsSync(join(tmp, 'calls.log'))).toBe(false);
    });
  });

  it('fails with the exact line when the earshot binary is absent', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'fake', { sounds: FAKE_ENTRIES });
      const missing = join(tmp, 'missing-earshot');
      const result = run(['fake'], tmp, missing);
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe(
        `sound-set: earshot not found at ${missing}; run scripts/sound-setup.sh`,
      );
      expect(existsSync(join(tmp, 'calls.log'))).toBe(false);
    });
  });

  it('fails with the exact line when the earshot binary is not executable', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'fake', { sounds: FAKE_ENTRIES });
      const blocked = join(tmp, 'blocked-earshot');
      writeFileSync(blocked, '#!/usr/bin/env node\n');
      const result = run(['fake'], tmp, blocked);
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe(
        `sound-set: earshot not found at ${blocked}; run scripts/sound-setup.sh`,
      );
      expect(existsSync(join(tmp, 'calls.log'))).toBe(false);
    });
  });

  it('stops after a failed render and prints the exact line', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'fake', { sounds: FAKE_ENTRIES });
      writeFileSync(join(tmp, 'fail-at'), 'beta');
      const result = run(['fake'], tmp, writeFakeBin(tmp));
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe('sound-set: earshot failed for beta (error/knock) with exit 3');
      expect(readCallsLog(tmp)).toEqual([`make --sound tap/soft -o ${outputPath(tmp, 'fake', 'alpha')}`]);
    });
  });

  it('fails with the exact line when the render writes no file', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'fake', { sounds: FAKE_ENTRIES });
      writeFileSync(join(tmp, 'no-write'), 'alpha');
      const result = run(['fake'], tmp, writeFakeBin(tmp));
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe(
        `sound-set: earshot wrote no file for alpha (tap/soft): ${outputPath(tmp, 'fake', 'alpha')}`,
      );
      expect(readCallsLog(tmp)).toEqual([`make --sound tap/soft -o ${outputPath(tmp, 'fake', 'alpha')}`]);
    });
  });

  it('passes the nine AC3 header steps on every committed chibi file', () => {
    const raw = readFileSync(join(ROOT, 'sounds', 'sets', 'chibi.json'), 'utf8');
    const parsed = JSON.parse(raw) as { sounds: { name: string; design: string }[] };
    expect(parsed.sounds).toEqual(EXPECTED_CHIBI_ENTRIES);
    for (const entry of parsed.sounds) {
      checkOggHeader(readFileSync(join(ROOT, 'sounds', 'chibi', `${entry.name}.ogg`)), entry.name);
    }
  });
});

function checkOggHeader(bytes: Buffer, label: string) {
  expect(bytes.subarray(0, 4).toString('ascii'), `${label} step 1: capture pattern`).toBe('OggS');
  expect(bytes[4], `${label} step 2: stream structure version`).toBe(0);
  expect(bytes[5] & 0x02, `${label} step 3: beginning-of-stream flag`).not.toBe(0);
  const count = bytes[26];
  const packetStart = 27 + count;
  expect(bytes.length, `${label} step 4: segment table fits`).toBeGreaterThan(packetStart + 29);
  expect(bytes[packetStart], `${label} step 5: packet type`).toBe(0x01);
  expect(bytes.subarray(packetStart + 1, packetStart + 7).toString('ascii'), `${label} step 5: vorbis`).toBe(
    'vorbis',
  );
  expect(bytes.readUInt32LE(packetStart + 7), `${label} step 6: vorbis version`).toBe(0);
  expect(bytes[packetStart + 11], `${label} step 7: stereo channels`).toBe(2);
  expect(bytes.readUInt32LE(packetStart + 12), `${label} step 8: sample rate`).toBe(48000);
  expect(bytes[packetStart + 29], `${label} step 9: framing flag`).toBe(1);
}
