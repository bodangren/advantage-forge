import { spawnSync } from 'node:child_process';
import {
  accessSync,
  chmodSync,
  constants as fsConstants,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Settlement the Red and Green must agree on (test-strategy.md Phase 2): "The ffmpeg binary
// check runs once, before the first entry. An absent ffmpeg therefore writes no Ogg and starts
// no render." Every failure case below asserts zero earshot calls and no output file.

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'sound-set.mjs');

const ENTRIES = [{ name: 'alpha', design: 'tap/soft' }];

const SUCCESS_STDOUT = [
  'fake-out alpha',
  'fake-err alpha',
  'sound-set: alpha.ogg <- tap/soft',
  'sound-set: alpha.mp3 <- tap/soft',
  'sound-set: 1 sounds -> sounds/fake',
];

function withTemp(callback: (tmp: string) => void) {
  const tmp = mkdtempSync(join(tmpdir(), 'sound-set-lookup-'));
  try {
    callback(tmp);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function writeSetFile(root: string) {
  const dir = join(root, 'sounds', 'sets');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'fake.json'), JSON.stringify({ sounds: ENTRIES }));
}

function writeFakeEarshot(tmp: string) {
  const fake = join(tmp, 'earshot-fake.mjs');
  const lines = [
    '#!/usr/bin/env node',
    "import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';",
    "import { dirname, join } from 'node:path';",
    `const tmp = ${JSON.stringify(tmp)};`,
    'const args = process.argv.slice(2);',
    "appendFileSync(join(tmp, 'calls.log'), `${args.join(' ')}\\n`);",
    "const flag = args.indexOf('-o');",
    "const out = flag >= 0 ? args[flag + 1] : '';",
    "process.stdout.write('fake-out alpha\\n');",
    "process.stderr.write('fake-err alpha\\n');",
    'mkdirSync(dirname(out), { recursive: true });',
    "writeFileSync(out, 'OggS');",
  ];
  writeFileSync(fake, `${lines.join('\n')}\n`, { mode: 0o755 });
  return fake;
}

// The fake takes the MP3 output from the last positional argv element, as AC2 pins it, and
// records the full argv so a test can prove which binary ran.
function writeFakeFfmpeg(dir: string, name: string, log: string) {
  const fake = join(dir, name);
  const lines = [
    '#!/usr/bin/env node',
    "import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';",
    "import { dirname, join } from 'node:path';",
    `const log = ${JSON.stringify(log)};`,
    'const args = process.argv.slice(2);',
    "appendFileSync(log, `${args.join(' ')}\\n`);",
    "const out = args.length > 0 ? args[args.length - 1] : '';",
    'mkdirSync(dirname(out), { recursive: true });',
    "writeFileSync(out, 'MP3');",
  ];
  writeFileSync(fake, `${lines.join('\n')}\n`, { mode: 0o755 });
  chmodSync(fake, 0o755);
  return fake;
}

function whichOnPath(name: string) {
  for (const dir of (process.env.PATH ?? '').split(':')) {
    const candidate = join(dir, name);
    try {
      accessSync(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Try the next PATH entry.
    }
  }
  throw new Error(`test setup: ${name} not found on PATH`);
}

function run(
  root: string,
  earshotBin: string,
  opts: { ffmpegBin?: string | null; path?: string; cwd?: string },
) {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    SOUNDS_ROOT: root,
    EARSHOT_BIN: earshotBin,
  };
  if (opts.ffmpegBin === null) delete env.FFMPEG_BIN;
  else if (opts.ffmpegBin !== undefined) env.FFMPEG_BIN = opts.ffmpegBin;
  if (opts.path !== undefined) env.PATH = opts.path;
  return spawnSync(process.execPath, [SCRIPT, 'fake'], {
    encoding: 'utf8',
    cwd: opts.cwd ?? root,
    env,
  });
}

describe('sound-set ffmpeg lookup and preparation', () => {
  it('rejects a directory FFMPEG_BIN before any render', () => {
    withTemp((tmp) => {
      writeSetFile(tmp);
      const dir = join(tmp, 'ffmpeg-dir');
      mkdirSync(dir);
      const result = run(tmp, writeFakeEarshot(tmp), { ffmpegBin: dir });
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe(`sound-set: ffmpeg not found at ${dir}; install ffmpeg`);
      expect(result.stdout).toBe('');
      expect(existsSync(join(tmp, 'calls.log'))).toBe(false);
      expect(existsSync(join(tmp, 'sounds', 'fake'))).toBe(false);
    });
  });

  it('treats an empty FFMPEG_BIN as unset and falls back to PATH', () => {
    withTemp((tmp) => {
      writeSetFile(tmp);
      const bindir = join(tmp, 'bin');
      mkdirSync(bindir);
      const log = join(tmp, 'ffmpeg-calls.log');
      writeFakeFfmpeg(bindir, 'ffmpeg', log);
      // AC2 is silent on an empty FFMPEG_BIN. Reading: empty counts as unset, so the wrapper
      // uses the PATH default. Flagged in the Red log; Green implements this reading.
      const result = run(tmp, writeFakeEarshot(tmp), {
        ffmpegBin: '',
        path: `${bindir}:${process.env.PATH ?? ''}`,
      });
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout.trim().split('\n')).toEqual(SUCCESS_STDOUT);
      expect(readFileSync(join(tmp, 'sounds', 'fake', 'alpha.mp3'), 'utf8')).toBe('MP3');
      expect(readFileSync(log, 'utf8').trim().split('\n')).toHaveLength(1);
    });
  });

  it('does not resolve the default ffmpeg from the working directory', () => {
    withTemp((tmp) => {
      writeSetFile(tmp);
      const bindir = join(tmp, 'bin');
      mkdirSync(bindir);
      symlinkSync(process.execPath, join(bindir, 'node'));
      symlinkSync(whichOnPath('env'), join(bindir, 'env'));
      writeFakeFfmpeg(tmp, 'ffmpeg', join(tmp, 'ffmpeg-calls.log'));
      const result = run(tmp, writeFakeEarshot(tmp), {
        ffmpegBin: null,
        path: bindir,
        cwd: tmp,
      });
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe('sound-set: ffmpeg not found at ffmpeg; install ffmpeg');
      expect(result.stdout).toBe('');
      expect(existsSync(join(tmp, 'calls.log'))).toBe(false);
      expect(existsSync(join(tmp, 'sounds', 'fake'))).toBe(false);
    });
  });

  it('skips a directory named ffmpeg on PATH and uses the executable', () => {
    withTemp((tmp) => {
      writeSetFile(tmp);
      const shadow = join(tmp, 'shadow');
      const bindir = join(tmp, 'bin');
      mkdirSync(shadow);
      mkdirSync(join(shadow, 'ffmpeg'));
      mkdirSync(bindir);
      const log = join(tmp, 'ffmpeg-calls.log');
      writeFakeFfmpeg(bindir, 'ffmpeg', log);
      const result = run(tmp, writeFakeEarshot(tmp), {
        ffmpegBin: null,
        path: `${shadow}:${bindir}:${process.env.PATH ?? ''}`,
      });
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout.trim().split('\n')).toEqual(SUCCESS_STDOUT);
      // The fake writes MP3; the real ffmpeg later on PATH would reject the fake Ogg input.
      expect(readFileSync(join(tmp, 'sounds', 'fake', 'alpha.mp3'), 'utf8')).toBe('MP3');
      expect(readFileSync(log, 'utf8').trim().split('\n')).toHaveLength(1);
    });
  });

  it('resolves the default ffmpeg from PATH', () => {
    withTemp((tmp) => {
      writeSetFile(tmp);
      const bindir = join(tmp, 'bin');
      mkdirSync(bindir);
      const log = join(tmp, 'ffmpeg-calls.log');
      writeFakeFfmpeg(bindir, 'ffmpeg', log);
      const result = run(tmp, writeFakeEarshot(tmp), {
        ffmpegBin: null,
        path: `${bindir}:${process.env.PATH ?? ''}`,
      });
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout.trim().split('\n')).toEqual(SUCCESS_STDOUT);
      const count = Number(result.stdout.match(/(\d+) sounds ->/)?.[1]);
      expect(count).toBe(1);
      expect(readFileSync(join(tmp, 'sounds', 'fake', 'alpha.mp3'), 'utf8')).toBe('MP3');
      expect(readFileSync(log, 'utf8').trim().split('\n')).toHaveLength(1);
    });
  });

  it('resolves a basename FFMPEG_BIN through PATH', () => {
    withTemp((tmp) => {
      writeSetFile(tmp);
      const bindir = join(tmp, 'bin');
      mkdirSync(bindir);
      const log = join(tmp, 'ffmpeg-calls.log');
      // AC2 lets FFMPEG_BIN name the binary while ffmpeg on PATH stays the default; a basename
      // therefore resolves through PATH like the default does.
      writeFakeFfmpeg(bindir, 'fakeff', log);
      const result = run(tmp, writeFakeEarshot(tmp), {
        ffmpegBin: 'fakeff',
        path: `${bindir}:${process.env.PATH ?? ''}`,
      });
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout.trim().split('\n')).toEqual(SUCCESS_STDOUT);
      expect(readFileSync(join(tmp, 'sounds', 'fake', 'alpha.mp3'), 'utf8')).toBe('MP3');
      expect(readFileSync(log, 'utf8').trim().split('\n')).toHaveLength(1);
    });
  });

  it('keeps the stale Ogg when the MP3 target is blocked', () => {
    withTemp((tmp) => {
      writeSetFile(tmp);
      const dir = join(tmp, 'sounds', 'fake');
      mkdirSync(dir, { recursive: true });
      const ogg = join(dir, 'alpha.ogg');
      const mp3 = join(dir, 'alpha.mp3');
      writeFileSync(ogg, 'stale');
      mkdirSync(mp3);
      const result = run(tmp, writeFakeEarshot(tmp), {
        ffmpegBin: writeFakeFfmpeg(tmp, 'ffmpeg-fake.mjs', join(tmp, 'ffmpeg-calls.log')),
      });
      expect(result.status).toBe(1);
      expect(result.stderr.trim()).toBe(`sound-set: cannot prepare output for alpha (tap/soft): ${mp3}`);
      expect(result.stdout).toBe('');
      expect(existsSync(join(tmp, 'calls.log'))).toBe(false);
      expect(readFileSync(ogg, 'utf8')).toBe('stale');
      expect(existsSync(join(tmp, 'ffmpeg-calls.log'))).toBe(false);
    });
  });
});
