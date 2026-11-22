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

function withTemp(callback: (tmp: string) => void) {
  const tmp = mkdtempSync(join(tmpdir(), 'sound-set-mp3-'));
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

function oggPath(root: string, set: string, name: string) {
  return join(root, 'sounds', set, `${name}.ogg`);
}

function mp3Path(root: string, set: string, name: string) {
  return join(root, 'sounds', set, `${name}.mp3`);
}

function writeFakeEarshot(tmp: string) {
  const fake = join(tmp, 'earshot-fake.mjs');
  const lines = [
    '#!/usr/bin/env node',
    "import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';",
    "import { dirname, join } from 'node:path';",
    `const tmp = ${JSON.stringify(tmp)};`,
    'const args = process.argv.slice(2);',
    "appendFileSync(join(tmp, 'calls.log'), `${args.join(' ')}\\n`);",
    "const flag = args.indexOf('-o');",
    "const out = flag >= 0 ? args[flag + 1] : '';",
    "const base = out.split('/').pop() ?? '';",
    "const name = base.endsWith('.ogg') ? base.slice(0, -4) : base;",
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

function writeFakeFfmpeg(tmp: string) {
  const fake = join(tmp, 'ffmpeg-fake.mjs');
  const lines = [
    '#!/usr/bin/env node',
    "import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';",
    "import { dirname, join } from 'node:path';",
    `const tmp = ${JSON.stringify(tmp)};`,
    'const args = process.argv.slice(2);',
    "appendFileSync(join(tmp, 'ffmpeg-calls.log'), `${args.join(' ')}\\n`);",
    '// AC2 pins the MP3 output as the last positional argument of the ffmpeg argv; there is no -o flag.',
    "const out = args.length > 0 ? args[args.length - 1] : '';",
    "const base = out.split('/').pop() ?? '';",
    "const name = base.endsWith('.mp3') ? base.slice(0, -4) : base;",
    'const readOptional = (path) => {',
    "  try { return readFileSync(path, 'utf8').trim(); } catch { return ''; }",
    '};',
    "const failAt = readOptional(join(tmp, 'ffmpeg-fail-at'));",
    "if (failAt !== '' && out.endsWith(`/${failAt}.mp3`)) process.exit(3);",
    "if (readOptional(join(tmp, 'ffmpeg-no-write')) !== name) {",
    '  mkdirSync(dirname(out), { recursive: true });',
    "  writeFileSync(out, 'MP3');",
    '}',
  ];
  writeFileSync(fake, `${lines.join('\n')}\n`, { mode: 0o755 });
  return fake;
}

function run(args: string[], root: string, earshotBin: string, ffmpegBin: string) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    env: { ...process.env, SOUNDS_ROOT: root, EARSHOT_BIN: earshotBin, FFMPEG_BIN: ffmpegBin },
  });
}

// The fake logs process.argv.slice(2), so the expected line holds the pinned AC2 flags only.
// The binary wiring is proven separately: the log file exists only when the FFMPEG_BIN fake ran,
// and case 2 asserts the exact lookup-failure line with the binary path.
function expectedFfmpegCall(inPath: string, outPath: string) {
  return [
    '-nostdin',
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    inPath,
    '-map_metadata',
    '-1',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '96k',
    '-ar',
    '48000',
    '-ac',
    '2',
    '-write_xing',
    '0',
    '-id3v2_version',
    '0',
    '-write_id3v1',
    '0',
    '-fflags',
    '+bitexact',
    '-flags:a',
    '+bitexact',
    outPath,
  ].join(' ');
}

function readLog(tmp: string, file: string) {
  return readFileSync(join(tmp, file), 'utf8').trim().split('\n');
}

describe('sound-set MP3 copies in the wrapper', () => {
  it('renders the Ogg and then the MP3 of each entry in order', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'fake', { sounds: FAKE_ENTRIES });
      const earshotBin = writeFakeEarshot(tmp);
      const ffmpegBin = writeFakeFfmpeg(tmp);
      const result = run(['fake'], tmp, earshotBin, ffmpegBin);
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout.trim().split('\n')).toEqual([
        'fake-out alpha',
        'fake-err alpha',
        'sound-set: alpha.ogg <- tap/soft',
        'sound-set: alpha.mp3 <- tap/soft',
        'fake-out beta',
        'fake-err beta',
        'sound-set: beta.ogg <- error/knock',
        'sound-set: beta.mp3 <- error/knock',
        'sound-set: 2 sounds -> sounds/fake',
      ]);
      const count = Number(result.stdout.match(/(\d+) sounds ->/)?.[1]);
      expect(count).toBe(2);
      const root = join(tmp, 'sounds', 'fake');
      expect(readLog(tmp, 'calls.log')).toEqual([
        `make --sound tap/soft -o ${join(root, 'alpha.ogg')}`,
        `make --sound error/knock -o ${join(root, 'beta.ogg')}`,
      ]);
      // The seven-entry real set gives 14 files. Two fake entries give 4 files.
      expect(readLog(tmp, 'ffmpeg-calls.log')).toEqual([
        expectedFfmpegCall(join(root, 'alpha.ogg'), join(root, 'alpha.mp3')),
        expectedFfmpegCall(join(root, 'beta.ogg'), join(root, 'beta.mp3')),
      ]);
      expect(existsSync(oggPath(tmp, 'fake', 'alpha'))).toBe(true);
      expect(existsSync(mp3Path(tmp, 'fake', 'alpha'))).toBe(true);
      expect(existsSync(oggPath(tmp, 'fake', 'beta'))).toBe(true);
      expect(existsSync(mp3Path(tmp, 'fake', 'beta'))).toBe(true);
    });
  });

  it('fails with the exact line when the ffmpeg binary is absent', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'fake', { sounds: FAKE_ENTRIES });
      const missing = join(tmp, 'missing-ffmpeg');
      const result = run(['fake'], tmp, writeFakeEarshot(tmp), missing);
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe(`sound-set: ffmpeg not found at ${missing}; install ffmpeg`);
      expect(result.stdout).toBe('');
      expect(existsSync(join(tmp, 'ffmpeg-calls.log'))).toBe(false);
      expect(existsSync(join(tmp, 'calls.log'))).toBe(false);
    });
  });

  it('stops after a failed MP3 render and never calls later entries', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'fake', { sounds: FAKE_THREE_ENTRIES });
      writeFileSync(join(tmp, 'ffmpeg-fail-at'), 'beta');
      const earshotBin = writeFakeEarshot(tmp);
      const ffmpegBin = writeFakeFfmpeg(tmp);
      const result = run(['fake'], tmp, earshotBin, ffmpegBin);
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe('sound-set: ffmpeg failed for beta (error/knock) with exit 3');
      const root = join(tmp, 'sounds', 'fake');
      expect(readLog(tmp, 'ffmpeg-calls.log')).toEqual([
        expectedFfmpegCall(join(root, 'alpha.ogg'), join(root, 'alpha.mp3')),
        expectedFfmpegCall(join(root, 'beta.ogg'), join(root, 'beta.mp3')),
      ]);
      expect(result.stdout).toContain('sound-set: alpha.mp3 <- tap/soft');
      expect(result.stdout).not.toContain('gamma');
    });
  });

  it('fails with the exact line when the MP3 render writes no file', () => {
    withTemp((tmp) => {
      writeSetFile(tmp, 'fake', { sounds: FAKE_ENTRIES });
      const stale = mp3Path(tmp, 'fake', 'alpha');
      mkdirSync(join(tmp, 'sounds', 'fake'), { recursive: true });
      writeFileSync(stale, 'stale-bytes');
      writeFileSync(join(tmp, 'ffmpeg-no-write'), 'alpha');
      const result = run(['fake'], tmp, writeFakeEarshot(tmp), writeFakeFfmpeg(tmp));
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe(`sound-set: ffmpeg wrote no file for alpha (tap/soft): ${stale}`);
      // AC2 renders the Ogg before the MP3 per entry, so alpha's Ogg lines stay on stdout.
      expect(result.stdout).toBe('fake-out alpha\nfake-err alpha\nsound-set: alpha.ogg <- tap/soft\n');
      expect(readLog(tmp, 'calls.log')).toEqual([
        `make --sound tap/soft -o ${oggPath(tmp, 'fake', 'alpha')}`,
      ]);
    });
  });

  it('passes the six AC3 MP3 steps on every committed chibi file', () => {
    const raw = readFileSync(join(ROOT, 'sounds', 'sets', 'chibi.json'), 'utf8');
    const parsed = JSON.parse(raw) as { sounds: { name: string; design: string }[] };
    expect(parsed.sounds.length).toBe(7);
    for (const entry of parsed.sounds) {
      checkMp3Header(readFileSync(join(ROOT, 'sounds', 'chibi', `${entry.name}.mp3`)), entry.name);
    }
  });
});

function checkMp3Header(bytes: Buffer, label: string) {
  expect(bytes[0], `${label} step 1: frame sync byte`).toBe(0xff);
  expect((bytes[1] ?? 0) & 0xe0, `${label} step 2: frame sync bits`).toBe(0xe0);
  expect(((bytes[1] ?? 0) >> 3) & 0x03, `${label} step 3: MPEG version 1`).toBe(0x03);
  expect(((bytes[1] ?? 0) >> 1) & 0x03, `${label} step 4: layer III`).toBe(0x01);
  const bitrateIndex = ((bytes[2] ?? 0) >> 4) & 0x0f;
  expect(bitrateIndex >= 1 && bitrateIndex <= 14, `${label} step 5: bitrate index`).toBe(true);
  expect(((bytes[2] ?? 0) >> 2) & 0x03, `${label} step 6: sample rate 48000 Hz`).toBe(0x01);
}
