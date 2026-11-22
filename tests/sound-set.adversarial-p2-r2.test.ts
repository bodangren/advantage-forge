import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SCRIPT = join(process.cwd(), 'scripts/sound-set.mjs');

function fixture(callback: (f: Fixture) => void): void {
  const cache = join(homedir(), '.cache/opencode');
  mkdirSync(cache, { recursive: true });
  const root = mkdtempSync(join(cache, 'sound-set-p2-r2-'));
  try {
    callback(new Fixture(root));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

class Fixture {
  readonly cwd: string;
  readonly bin: string;
  readonly earshot: string;
  readonly ffmpeg: string;
  readonly log: string;
  readonly ogg: string;
  readonly mp3: string;

  constructor(readonly root: string) {
    this.cwd = join(root, 'work');
    this.bin = join(root, 'bin');
    this.log = join(root, 'calls.jsonl');
    this.earshot = join(this.bin, 'earshot');
    this.ffmpeg = join(this.bin, 'ffmpeg');
    this.ogg = join(root, 'sounds/chibi/alpha.ogg');
    this.mp3 = join(root, 'sounds/chibi/alpha.mp3');
    for (const dir of [this.cwd, this.bin, join(root, 'sounds/sets'), dirname(this.ogg)]) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(
      join(root, 'sounds/sets/chibi.json'),
      JSON.stringify({ sounds: [{ name: 'alpha', design: 'tap/soft' }] }),
    );
    writeFileSync(this.ogg, 'old-ogg');
    writeFileSync(this.mp3, 'old-mp3');
    this.program(this.earshot, 'earshot', 'explicit-earshot');
    this.program(this.ffmpeg, 'ffmpeg', 'ffmpeg');
  }

  program(path: string, kind: 'earshot' | 'ffmpeg', label: string): void {
    mkdirSync(dirname(path), { recursive: true });
    // Absolute shebangs keep the fake independent of the PATH under test.
    writeFileSync(
      path,
      `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(this.log)}, JSON.stringify({label:${JSON.stringify(label)}, args}) + '\\n');
const out = ${kind === 'earshot' ? "args[args.indexOf('-o') + 1]" : 'args[args.length - 1]'};
fs.writeFileSync(out, ${JSON.stringify(kind === 'earshot' ? 'OggS' : 'MP3')});
`,
      { mode: 0o755 },
    );
  }

  run(overrides: NodeJS.ProcessEnv = {}) {
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      SOUNDS_ROOT: this.root,
      EARSHOT_BIN: this.earshot,
      FFMPEG_BIN: this.ffmpeg,
      PATH: this.bin,
      ...overrides,
    };
    if (overrides.EARSHOT_BIN === undefined && 'EARSHOT_BIN' in overrides) {
      delete env.EARSHOT_BIN;
    }
    const run = spawnSync(process.execPath, [SCRIPT, 'chibi'], {
      cwd: this.cwd,
      env,
      encoding: 'utf8',
      timeout: 10_000,
    });
    expect(run.error, 'wrapper launch error').toBeUndefined();
    expect(run.signal, 'wrapper signal').toBeNull();
    return run;
  }

  calls(): { label: string; args: string[] }[] {
    return existsSync(this.log)
      ? readFileSync(this.log, 'utf8')
          .trim()
          .split('\n')
          .map((line) => JSON.parse(line))
      : [];
  }

  assertSuccess(overrides: NodeJS.ProcessEnv, label: string): void {
    const run = this.run(overrides);
    expect(run.status).toBe(0);
    expect(run.stderr).toBe('');
    expect(run.stdout).toBe(
      'sound-set: alpha.ogg <- tap/soft\nsound-set: alpha.mp3 <- tap/soft\n' +
        'sound-set: 1 sounds -> sounds/chibi\n',
    );
    const calls = this.calls();
    expect(calls.map((call) => call.label)).toEqual([label, 'ffmpeg']);
    expect(calls[0]!.args).toEqual(['make', '--sound', 'tap/soft', '-o', this.ogg]);
    expect(calls[1]!.args.at(-1)).toBe(this.mp3);
    expect(readFileSync(this.ogg, 'utf8')).toBe('OggS');
    expect(readFileSync(this.mp3, 'utf8')).toBe('MP3');
  }
}

describe('Phase 2 executable identity and path boundaries', () => {
  // AC2: "`FFMPEG_BIN` sets the binary, and `ffmpeg` on `PATH` is the default."
  // AC2 assigns PATH lookup to ffmpeg, not earshot.
  // EARSHOT_BIN remains an explicit path, including a basename relative to cwd.
  // Run the checked file; a PATH shadow must not replace it after validation.
  it('runs the checked cwd earshot basename instead of a different PATH executable', () => {
    fixture((f) => {
      f.program(join(f.cwd, 'earshot-bare'), 'earshot', 'checked-cwd-earshot');
      f.program(join(f.bin, 'earshot-bare'), 'earshot', 'unchecked-path-earshot');
      f.assertSuccess({ EARSHOT_BIN: 'earshot-bare' }, 'checked-cwd-earshot');
    });
  });

  it('rejects an earshot basename found only on PATH and preserves both old files', () => {
    fixture((f) => {
      f.program(join(f.bin, 'earshot-bare'), 'earshot', 'unchecked-path-earshot');
      const run = f.run({ EARSHOT_BIN: 'earshot-bare' });
      expect(run.status).toBe(1);
      expect(run.stderr).toBe(
        `sound-set: earshot not found at ${join(f.cwd, 'earshot-bare')}; run scripts/sound-setup.sh\n`,
      );
      expect(run.stdout).toBe('');
      expect(f.calls()).toEqual([]);
      expect(readFileSync(f.ogg, 'utf8')).toBe('old-ogg');
      expect(readFileSync(f.mp3, 'utf8')).toBe('old-mp3');
    });
  });

  it('uses the absolute default earshot under SOUNDS_ROOT despite cwd and PATH shadows', () => {
    fixture((f) => {
      f.program(join(f.root, '.venv-earshot/bin/earshot'), 'earshot', 'absolute-default-earshot');
      f.program(join(f.cwd, 'earshot'), 'earshot', 'cwd-shadow');
      f.assertSuccess({ EARSHOT_BIN: undefined }, 'absolute-default-earshot');
    });
  });

  it('skips an absolute PATH entry with a symlink loop and uses the next candidate', () => {
    fixture((f) => {
      const loop = join(f.root, 'path-loop');
      symlinkSync(loop, loop);
      f.assertSuccess({ FFMPEG_BIN: 'ffmpeg', PATH: `${loop}:${f.bin}` }, 'explicit-earshot');
    });
  });

  it('fails closed when every absolute PATH entry has a symlink loop', () => {
    fixture((f) => {
      const loop = join(f.root, 'path-loop');
      symlinkSync(loop, loop);
      const run = f.run({ FFMPEG_BIN: 'ffmpeg', PATH: loop });
      expect(run.status).toBe(1);
      expect(run.stderr).toBe('sound-set: ffmpeg not found at ffmpeg; install ffmpeg\n');
      expect(run.stdout).toBe('');
      expect(f.calls()).toEqual([]);
      expect(readFileSync(f.ogg, 'utf8')).toBe('old-ogg');
      expect(readFileSync(f.mp3, 'utf8')).toBe('old-mp3');
    });
  });

  it('preserves an existing directory with the same basename as the sound entry', () => {
    fixture((f) => {
      // The chibi folder here belongs only to the temporary SOUNDS_ROOT.
      const directory = join(f.root, 'sounds/chibi/alpha');
      mkdirSync(directory);
      writeFileSync(join(directory, 'keep'), 'directory-sentinel');
      f.assertSuccess({}, 'explicit-earshot');
      expect(readFileSync(join(directory, 'keep'), 'utf8')).toBe('directory-sentinel');
      expect(readdirSync(dirname(directory)).sort()).toEqual(['alpha', 'alpha.mp3', 'alpha.ogg']);
    });
  });
});
