import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'sound-set.mjs');
const ENTRIES = [
  { name: 'alpha', design: 'tap/soft' },
  { name: 'beta', design: 'error/knock' },
];

function fixture(
  callback: (root: string, bin: string) => void,
  mode: 'normal' | 'signal' | 'empty' | 'no-write' | 'fail' = 'normal',
) {
  const cache = join(homedir(), '.cache', 'opencode');
  mkdirSync(cache, { recursive: true });
  const root = mkdtempSync(join(cache, 'sound set adversarial '));
  const bin = join(root, 'fake earshot.mjs');
  writeFileSync(
    bin,
    `#!/usr/bin/env node
import { appendFileSync, writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
appendFileSync(${JSON.stringify(join(root, 'calls.jsonl'))}, JSON.stringify(args) + '\\n');
process.stdout.write('fake-out\\n');
process.stderr.write('fake-err\\n');
if (${JSON.stringify(mode)} === 'signal') process.kill(process.pid, 'SIGTERM');
else if (${JSON.stringify(mode)} === 'fail') process.exit(23);
else if (${JSON.stringify(mode)} !== 'no-write') {
  writeFileSync(args[4], ${JSON.stringify(mode)} === 'empty' ? '' : 'OggS');
}
`,
    { mode: 0o755 },
  );
  try {
    callback(root, bin);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function writeSet(root: string, value: unknown) {
  mkdirSync(join(root, 'sounds', 'sets'), { recursive: true });
  writeFileSync(join(root, 'sounds', 'sets', 'fake.json'), JSON.stringify(value));
}

function run(root: string, bin: string, set = 'fake') {
  const result = spawnSync(process.execPath, [SCRIPT, set], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10_000,
    env: { ...process.env, SOUNDS_ROOT: root, EARSHOT_BIN: bin },
  });
  expect(result.error).toBeUndefined();
  expect(result.signal).toBeNull();
  return result;
}

function output(root: string, name = 'alpha') {
  return join(root, 'sounds', 'fake', `${name}.ogg`);
}

function calls(root: string): string[][] {
  const path = join(root, 'calls.jsonl');
  return existsSync(path)
    ? readFileSync(path, 'utf8')
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))
    : [];
}

describe('sound-set adversarial process boundaries', () => {
  it.each(['café', ' alpha', 'alpha ', 'alpha\t', 'alpha\n', 'alpha\r', 'alpha\u2028', '../alpha'])(
    'rejects the entry name %j before any render',
    (name) => {
      fixture((root, bin) => {
        writeSet(root, { sounds: [{ name, design: 'tap/soft' }] });
        const result = run(root, bin);
        expect(result.status).toBe(1);
        expect(result.stderr).toBe(`sound-set: bad set file: bad name ${name}\n`);
        expect(result.stdout).toBe('');
        expect(calls(root)).toEqual([]);
      });
    },
  );

  it.each(['café', ' fake', 'fake ', 'fake\t', 'fake\n', 'fake\r', 'fake\u2028', '../fake'])(
    'rejects the set name %j before file or binary checks',
    (set) => {
      fixture((root, bin) => {
        const result = run(root, bin, set);
        expect(result.status).toBe(2);
        expect(result.stderr).toBe(`sound-set: bad set name: ${set}\n`);
        expect(result.stdout).toBe('');
        expect(calls(root)).toEqual([]);
      });
    },
  );

  it.each([null, false, 17, {}, []])('rejects the non-string design %j before binary checks', (design) => {
    fixture((root) => {
      writeSet(root, { sounds: [{ name: 'alpha', design }] });
      const result = run(root, join(root, 'missing-binary'));
      expect(result.status).toBe(1);
      expect(result.stderr).toBe('sound-set: bad set file: entry 0 needs a design\n');
      expect(result.stdout).toBe('');
      expect(calls(root)).toEqual([]);
    });
  });

  it('validates later entries before rendering earlier entries', () => {
    fixture((root, bin) => {
      writeSet(root, { sounds: [ENTRIES[0], null] });
      const result = run(root, bin);
      expect(result.status).toBe(1);
      expect(result.stderr).toBe('sound-set: bad set file: entry 1 needs a name\n');
      expect(result.stdout).toBe('');
      expect(calls(root)).toEqual([]);
    });
  });

  it.each(['two words', '--help', '-o', '$(touch injected); never do not', '  tap/soft  '])(
    'preserves the design %j as one argv element with paths that contain spaces',
    (design) => {
      fixture((root, bin) => {
        writeSet(root, {
          extra: { ignored: true },
          sounds: [{ name: 'alpha', design, extra: '--output=elsewhere' }],
        });
        const result = run(root, bin);
        expect(result.status).toBe(0);
        expect(result.stderr).toBe('');
        expect(calls(root)).toEqual([['make', '--sound', design, '-o', output(root)]]);
        expect(result.stdout).toBe(
          `fake-out\nfake-err\nsound-set: alpha.ogg <- ${design}\nsound-set: 1 sounds -> sounds/fake\n`,
        );
        expect(readFileSync(output(root), 'utf8')).toBe('OggS');
        expect(existsSync(join(root, 'injected'))).toBe(false);
        expect(existsSync(join(ROOT, 'injected'))).toBe(false);
      });
    },
  );

  it.each(['tap/soft', 'BANNED never do not'])(
    'preserves the exact failure line for %j and suppresses both child streams',
    (design) => {
      fixture((root, bin) => {
        writeSet(root, { sounds: [{ name: 'alpha', design }, ENTRIES[1]] });
        const result = run(root, bin);
        expect(result.status).toBe(1);
        expect(result.stderr).toBe(`sound-set: earshot failed for alpha (${design}) with exit 23\n`);
        expect(result.stdout).toBe('');
        expect(calls(root)).toEqual([['make', '--sound', design, '-o', output(root)]]);
        expect(existsSync(output(root, 'beta'))).toBe(false);
      }, 'fail');
    },
  );

  it('fails closed when a signal gives the child a null exit status', () => {
    fixture((root, bin) => {
      writeSet(root, { sounds: ENTRIES });
      const result = run(root, bin);
      expect(result.status).toBe(1);
      expect(result.stderr).toBe('sound-set: earshot failed for alpha (tap/soft) with exit null\n');
      expect(result.stdout).toBe('');
      expect(calls(root)).toEqual([['make', '--sound', 'tap/soft', '-o', output(root)]]);
      expect(existsSync(output(root, 'beta'))).toBe(false);
    }, 'signal');
  });

  it('rejects a no-write child even when the target previously existed', () => {
    fixture((root, bin) => {
      writeSet(root, { sounds: ENTRIES });
      mkdirSync(join(root, 'sounds', 'fake'));
      writeFileSync(output(root), 'stale');
      const result = run(root, bin);
      expect(result.status).toBe(1);
      expect(result.stderr).toBe(`sound-set: earshot wrote no file for alpha (tap/soft): ${output(root)}\n`);
      expect(result.stdout).toBe('');
      expect(calls(root)).toEqual([['make', '--sound', 'tap/soft', '-o', output(root)]]);
      expect(existsSync(output(root))).toBe(false);
    }, 'no-write');
  });

  it('checks file existence, not AC3 validity, for a zero-byte fake output', () => {
    fixture((root, bin) => {
      writeSet(root, { sounds: [ENTRIES[0]] });
      const result = run(root, bin);
      // D5 requires a written file. AC3 checks the committed real files separately.
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(calls(root)).toEqual([['make', '--sound', 'tap/soft', '-o', output(root)]]);
      expect(statSync(output(root)).size).toBe(0);
    }, 'empty');
  });

  it('reports a directory at the target without a stack trace or recursive deletion', () => {
    fixture((root, bin) => {
      writeSet(root, { sounds: ENTRIES });
      mkdirSync(output(root), { recursive: true });
      writeFileSync(join(output(root), 'keep.txt'), 'preserve');
      const result = run(root, bin);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(calls(root)).toEqual([]);
      expect(readFileSync(join(output(root), 'keep.txt'), 'utf8')).toBe('preserve');
      // D5 gives no exact text for a pre-render filesystem failure.
      expect(result.stderr.trim().split('\n')).toHaveLength(1);
      expect(result.stderr).toMatch(/^sound-set: [^\r\n]+\n$/);
    });
  });

  it('reports an overlong output name without a stack trace', () => {
    fixture((root, bin) => {
      writeSet(root, { sounds: [{ name: 'a'.repeat(300), design: 'tap/soft' }] });
      const result = run(root, bin);
      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(calls(root)).toEqual([]);
      // D5 gives no exact text for a pre-render filesystem failure.
      expect(result.stderr.trim().split('\n')).toHaveLength(1);
      expect(result.stderr).toMatch(/^sound-set: [^\r\n]+\n$/);
    });
  });
});

// Execute the existing private reader body. Do not replace it with a second implementation.
function existingHeaderReader(): (bytes: Buffer, label: string) => void {
  const source = readFileSync(join(ROOT, 'tests', 'sound-set.test.ts'), 'utf8');
  const signature = /^function checkOggHeader\([^)]*\) \{/m.exec(source);
  expect(signature).not.toBeNull();
  const bodyStart = signature!.index + signature![0].length;
  const bodyEnd = source.lastIndexOf('}');
  expect(source.slice(bodyEnd + 1).trim()).toBe('');
  return new Function('expect', 'bytes', 'label', source.slice(bodyStart, bodyEnd)).bind(null, expect) as (
    bytes: Buffer,
    label: string,
  ) => void;
}

describe('the existing AC3 reader rejects corrupted buffers', () => {
  const check = existingHeaderReader();
  const valid = readFileSync(join(ROOT, 'sounds', 'chibi', 'tap.ogg'));
  const packet = 27 + valid[26]!;

  it('accepts the committed reference bytes', () => {
    expect(() => check(valid, 'reference')).not.toThrow();
  });

  it.each([0, 4, 5, 26, 27, packet, packet + 7, packet + 29])('rejects truncation to %i bytes', (length) => {
    expect(() => check(valid.subarray(0, length), 'truncated')).toThrow();
  });

  it.each([
    ['capture pattern', 0, 0],
    ['stream version', 4, 1],
    ['BOS flag', 5, 0],
    ['segment count', 26, 255],
    ['packet type', packet, 0],
    ['vorbis marker', packet + 1, 0],
    ['vorbis version', packet + 7, 1],
    ['channel count', packet + 11, 1],
    ['sample rate', packet + 12, 0],
    ['framing flag', packet + 29, 0],
    ['capture pattern high bit', 0, valid[0]! | 0x80],
    ['vorbis marker high bit', packet + 1, valid[packet + 1]! | 0x80],
  ] as const)('rejects a corrupted %s', (_label, offset, value) => {
    const corrupted = Buffer.from(valid);
    corrupted[offset] = value;
    expect(() => check(corrupted, 'corrupted')).toThrow();
  });
});
