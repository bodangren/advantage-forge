import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SCRIPT = join(process.cwd(), 'scripts/sound-set.mjs');
const ENTRIES = [
  { name: 'alpha', design: 'tap/soft' },
  { name: 'beta', design: 'error/knock' },
];

class Fixture {
  readonly root: string;
  readonly bin: string;
  readonly earshot: string;
  readonly ffmpeg: string;
  readonly log: string;

  constructor(root: string) {
    this.root = root;
    this.bin = join(root, 'absolute-bin');
    this.earshot = join(this.bin, 'earshot.mjs');
    this.ffmpeg = join(this.bin, 'ffmpeg');
    this.log = join(root, 'calls.jsonl');
    mkdirSync(this.bin);
    mkdirSync(join(root, 'sounds/sets'), { recursive: true });
    mkdirSync(join(root, 'sounds/fake'));
    writeFileSync(join(root, 'sounds/sets/fake.json'), JSON.stringify({ sounds: ENTRIES }));
    for (const entry of ENTRIES) {
      for (const ext of ['ogg', 'mp3']) {
        writeFileSync(this.output(entry.name, ext), `old-${entry.name}-${ext}`);
      }
    }
    this.program(this.earshot, 'earshot');
    this.program(this.ffmpeg, 'ffmpeg');
  }

  output(name: string, ext: string): string {
    return join(this.root, 'sounds/fake', `${name}.${ext}`);
  }

  program(path: string, label: string): void {
    // An absolute shebang keeps the fake independent of the PATH under test.
    writeFileSync(
      path,
      `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(this.log)}, JSON.stringify({ label: ${JSON.stringify(label)}, args }) + '\\n');
const out = ${label === 'earshot' ? "args[args.indexOf('-o') + 1]" : 'args[args.length - 1]'};
fs.writeFileSync(out, ${JSON.stringify(label === 'earshot' ? 'OggS' : 'MP3')});
`,
      { mode: 0o755 },
    );
    // .mjs needs ESM; extensionless PATH binaries use CommonJS.
    if (path.endsWith('.mjs')) {
      const text = readFileSync(path, 'utf8').replace(
        "const fs = require('node:fs');",
        "import * as fs from 'node:fs';",
      );
      writeFileSync(path, text);
    }
    chmodSync(path, 0o755);
  }

  run(overrides: NodeJS.ProcessEnv = {}) {
    const result = spawnSync(process.execPath, [SCRIPT, 'fake'], {
      cwd: this.root,
      encoding: 'utf8',
      timeout: 10_000,
      env: {
        ...process.env,
        SOUNDS_ROOT: this.root,
        EARSHOT_BIN: this.earshot,
        FFMPEG_BIN: this.ffmpeg,
        PATH: this.bin,
        ...overrides,
      },
    });
    expect(result.error, 'wrapper launch error').toBeUndefined();
    expect(result.signal, 'wrapper signal').toBeNull();
    return result;
  }

  calls(): { label: string; args: string[] }[] {
    if (!existsSync(this.log)) return [];
    return readFileSync(this.log, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
  }

  assertRejected(overrides: NodeJS.ProcessEnv, line: string): void {
    const result = this.run(overrides);
    // Soft assertions also report lost files when the diagnostic is wrong.
    expect.soft(result.status, 'preparation must not start').toBe(1);
    expect.soft(result.stderr, 'exact preflight failure line').toBe(`${line}\n`);
    expect.soft(result.stdout, 'failure stdout').toBe('');
    expect.soft(this.calls(), 'child calls before preparation').toEqual([]);
    for (const entry of ENTRIES) {
      for (const ext of ['ogg', 'mp3']) {
        const path = this.output(entry.name, ext);
        const bytes = existsSync(path) ? readFileSync(path, 'utf8') : undefined;
        expect.soft(bytes, `preserved ${entry.name}.${ext}`).toBe(`old-${entry.name}-${ext}`);
      }
    }
  }

  assertSuccess(overrides: NodeJS.ProcessEnv = {}): void {
    const result = this.run(overrides);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toBe(
      'sound-set: alpha.ogg <- tap/soft\nsound-set: alpha.mp3 <- tap/soft\n' +
        'sound-set: beta.ogg <- error/knock\nsound-set: beta.mp3 <- error/knock\n' +
        'sound-set: 2 sounds -> sounds/fake\n',
    );
    expect(this.calls().map((call) => call.label)).toEqual(['earshot', 'ffmpeg', 'earshot', 'ffmpeg']);
    for (const entry of ENTRIES) {
      expect(readFileSync(this.output(entry.name, 'ogg'), 'utf8')).toBe('OggS');
      expect(readFileSync(this.output(entry.name, 'mp3'), 'utf8')).toBe('MP3');
    }
  }
}

function fixture(callback: (f: Fixture) => void): void {
  const cache = join(homedir(), '.cache/opencode');
  mkdirSync(cache, { recursive: true });
  const root = mkdtempSync(join(cache, 'sound-set-adversarial-p2-'));
  try {
    callback(new Fixture(root));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const missingFfmpeg = (value: string) => `sound-set: ffmpeg not found at ${value}; install ffmpeg`;
const missingEarshot = (value: string) =>
  `sound-set: earshot not found at ${value}; run scripts/sound-setup.sh`;

describe('Phase 2 binary preflight and stale-file preservation', () => {
  it('proves that the isolated fake programs run through the real wrapper', () => {
    fixture((f) => f.assertSuccess());
  });

  it.each(['empty', 'leading', 'trailing', 'middle', 'only-separators'])(
    'F7 skips the %s PATH entry before preparation',
    (form) => {
      fixture((f) => {
        const emptyBin = join(f.root, 'empty-bin');
        mkdirSync(emptyBin);
        f.program(join(f.root, 'ffmpeg'), 'planted-cwd');
        const paths: Record<string, string> = {
          empty: '',
          leading: `:${emptyBin}`,
          trailing: `${emptyBin}:`,
          middle: `${emptyBin}::${emptyBin}`,
          'only-separators': '::',
        };
        f.assertRejected({ FFMPEG_BIN: 'ffmpeg', PATH: paths[form]! }, missingFfmpeg('ffmpeg'));
      });
    },
  );

  it('F7 rejects a non-executable regular ffmpeg before preparing either target', () => {
    fixture((f) => {
      chmodSync(f.ffmpeg, 0o644);
      f.assertRejected({}, missingFfmpeg(f.ffmpeg));
    });
  });

  it('F7 skips a non-executable PATH candidate and runs a later executable', () => {
    fixture((f) => {
      const shadow = join(f.root, 'shadow');
      mkdirSync(shadow);
      const candidate = join(shadow, 'ffmpeg');
      f.program(candidate, 'non-executable-shadow');
      chmodSync(candidate, 0o644);
      f.assertSuccess({ FFMPEG_BIN: 'ffmpeg', PATH: `${shadow}:${f.bin}` });
    });
  });

  it('F7 skips an empty PATH entry but still runs a later absolute candidate', () => {
    fixture((f) => {
      f.program(join(f.root, 'ffmpeg'), 'planted-cwd');
      f.assertSuccess({ FFMPEG_BIN: 'ffmpeg', PATH: `:${f.bin}` });
    });
  });

  it.each(['directory', 'empty'])('F6 preserves both old files with an %s EARSHOT_BIN', (kind) => {
    fixture((f) => {
      const directory = join(f.root, 'earshot-directory');
      mkdirSync(directory);
      const value = kind === 'empty' ? '' : directory;
      // AC2: "A failure stops the run, and no later entry starts."
      // The Phase 2 strategy chooses preflight before preparation.
      // Keep the existing earshot missing-binary diagnostic for this invalid input.
      f.assertRejected({ EARSHOT_BIN: value }, missingEarshot(resolve(f.root, value)));
    });
  });

  it.each(['.', 'bin'])('F5 never searches the explicit relative PATH entry %j', (relative) => {
    fixture((f) => {
      // AC2: "`FFMPEG_BIN` sets the binary, and `ffmpeg` on `PATH` is the default."
      // AC2 does not define relative PATH entries. The task brief requests the stricter rule.
      // plan.md:163 and sound-set.mjs:75 state that the working directory is never searched.
      // Flag this interpretation in the audit; the strategy's Phase 2 text does not state it.
      const directory = resolve(f.root, relative);
      mkdirSync(directory, { recursive: true });
      f.program(join(directory, 'ffmpeg'), 'planted-relative');
      f.assertRejected({ FFMPEG_BIN: 'ffmpeg', PATH: relative }, missingFfmpeg('ffmpeg'));
    });
  });

  it.each(['directory', 'missing', 'non-executable'])(
    'rejects a ffmpeg symlink to a %s before preparation',
    (kind) => {
      fixture((f) => {
        const target = join(f.root, 'symlink-target');
        if (kind === 'directory') mkdirSync(target);
        if (kind === 'non-executable') {
          f.program(target, 'non-executable-target');
          chmodSync(target, 0o644);
        }
        const link = join(f.root, 'linked-ffmpeg');
        symlinkSync(target, link);
        f.assertRejected({ FFMPEG_BIN: link }, missingFfmpeg(link));
      });
    },
  );

  it('accepts a ffmpeg symlink to a regular executable', () => {
    fixture((f) => {
      const link = join(f.root, 'linked-ffmpeg');
      symlinkSync(f.ffmpeg, link);
      f.assertSuccess({ FFMPEG_BIN: link });
    });
  });

  it('does not turn a basename equal to a PATH directory into an executable', () => {
    fixture((f) => {
      const bin = join(f.root, 'converter');
      mkdirSync(bin);
      mkdirSync(join(bin, 'converter'));
      f.assertRejected({ FFMPEG_BIN: 'converter', PATH: bin }, missingFfmpeg('converter'));
    });
  });

  it('preserves a missing-binary name that contains filter words as literal text', () => {
    fixture((f) => {
      const absent = join(f.root, 'BANNED never do not');
      f.assertRejected({ FFMPEG_BIN: absent }, missingFfmpeg(absent));
    });
  });
});
