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

const FAKE_THREE_ENTRIES = [
  { name: 'alpha', design: 'tap/soft' },
  { name: 'beta', design: 'error/knock' },
  { name: 'gamma', design: 'pop/bubble' },
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
    "const base = out.split('/').pop() ?? '';",
    "const name = base.endsWith('.ogg') ? base.slice(0, -4) : base;",
    "appendFileSync(join(tmp, 'calls.log'), `${args.join(' ')}\\n`);",
    'process.stdout.write(`fake-out ${name}\\n`);',
    'process.stderr.write(`fake-err ${name}\\n`);',
    'const readOptional = (path) => {',
    "  try { return readFileSync(path, 'utf8').trim(); } catch { return ''; }",
    '};',
    "const failAt = readOptional(join(tmp, 'fail-at'));",
    "if (failAt !== '' && out.endsWith(`/${failAt}.ogg`)) process.exit(3);",
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
        'fake-out alpha',
        'fake-err alpha',
        'sound-set: alpha.ogg <- tap/soft',
        'fake-out beta',
        'fake-err beta',
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

  it('stops after a failed render, never calls later entries, and prints the exact line', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'fake', { sounds: FAKE_THREE_ENTRIES });
      writeFileSync(join(tmp, 'fail-at'), 'beta');
      const result = run(['fake'], tmp, writeFakeBin(tmp));
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe('sound-set: earshot failed for beta (error/knock) with exit 3');
      expect(readCallsLog(tmp)).toEqual([
        `make --sound tap/soft -o ${outputPath(tmp, 'fake', 'alpha')}`,
        `make --sound error/knock -o ${outputPath(tmp, 'fake', 'beta')}`,
      ]);
      expect(result.stdout).toContain('fake-out alpha');
      expect(result.stdout).toContain('fake-err alpha');
      expect(result.stdout).toContain('sound-set: alpha.ogg <- tap/soft');
      expect(result.stdout).not.toContain('fake-out beta');
      expect(result.stdout).not.toContain('fake-err beta');
      expect(result.stdout).not.toContain('beta.ogg');
      expect(result.stdout).not.toContain('gamma');
      expect(result.stderr).not.toContain('fake-out beta');
      expect(result.stderr).not.toContain('fake-err beta');
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
      expect(result.stdout).toBe('');
      expect(readCallsLog(tmp)).toEqual([`make --sound tap/soft -o ${outputPath(tmp, 'fake', 'alpha')}`]);
    });
  });

  it('fails with the exact line when a stale target exists and the render writes nothing', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'fake', { sounds: FAKE_ENTRIES });
      const stale = outputPath(tmp, 'fake', 'alpha');
      mkdirSync(join(tmp, 'sounds', 'fake'), { recursive: true });
      writeFileSync(stale, 'stale-bytes');
      writeFileSync(join(tmp, 'no-write'), 'alpha');
      const result = run(['fake'], tmp, writeFakeBin(tmp));
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe(`sound-set: earshot wrote no file for alpha (tap/soft): ${stale}`);
      expect(result.stdout).toBe('');
      expect(readCallsLog(tmp)).toEqual([`make --sound tap/soft -o ${stale}`]);
    });
  });

  it('fails with the exact line when the target is a directory', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'fake', { sounds: FAKE_ENTRIES });
      const target = outputPath(tmp, 'fake', 'alpha');
      mkdirSync(target, { recursive: true });
      writeFileSync(join(target, 'keep.txt'), 'preserve');
      const result = run(['fake'], tmp, writeFakeBin(tmp));
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe(`sound-set: cannot prepare output for alpha (tap/soft): ${target}`);
      expect(result.stdout).toBe('');
      expect(existsSync(join(tmp, 'calls.log'))).toBe(false);
      expect(readFileSync(join(target, 'keep.txt'), 'utf8')).toBe('preserve');
    });
  });

  it('fails with the exact line for the first entry when the output folder cannot be created', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'fake', { sounds: FAKE_ENTRIES });
      mkdirSync(join(tmp, 'sounds'), { recursive: true });
      writeFileSync(join(tmp, 'sounds', 'fake'), 'obstruction');
      const result = run(['fake'], tmp, writeFakeBin(tmp));
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe(
        `sound-set: cannot prepare output for alpha (tap/soft): ${outputPath(tmp, 'fake', 'alpha')}`,
      );
      expect(result.stdout).toBe('');
      expect(existsSync(join(tmp, 'calls.log'))).toBe(false);
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
  expect(bytes.subarray(0, 4).equals(Buffer.from('OggS', 'ascii')), `${label} step 1: capture pattern`).toBe(
    true,
  );
  expect(bytes[4], `${label} step 2: stream structure version`).toBe(0);
  expect(bytes[5] & 0x02, `${label} step 3: beginning-of-stream flag`).not.toBe(0);
  const count = bytes[26];
  const packetStart = 27 + count;
  expect(bytes.length, `${label} step 4: segment table fits`).toBeGreaterThan(packetStart + 29);
  expect(
    Buffer.concat([Buffer.from([0x01]), Buffer.from('vorbis', 'ascii')]).equals(
      bytes.subarray(packetStart, packetStart + 7),
    ),
    `${label} step 5: packet type and vorbis marker`,
  ).toBe(true);
  expect(bytes.readUInt32LE(packetStart + 7), `${label} step 6: vorbis version`).toBe(0);
  expect(bytes[packetStart + 11], `${label} step 7: stereo channels`).toBe(2);
  expect(bytes.readUInt32LE(packetStart + 12), `${label} step 8: sample rate`).toBe(48000);
  expect(bytes[packetStart + 29], `${label} step 9: framing flag`).toBe(1);
}
