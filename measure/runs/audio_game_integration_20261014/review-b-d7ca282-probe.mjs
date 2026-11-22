// Review B r3 probe for scripts/sound-set.mjs at d7ca282ebd6e7602420096055266f527d2f9ff7f.
// Run: node measure/runs/audio_game_integration_20261014/review-b-d7ca282-probe.mjs
// It supersedes review-b-a1b67c7-probe.mjs, which supersedes review-b-6804d08-probe.mjs. Every r2 check
// stays, with two changes. The static text check follows the fixed source (F5 and F6, commit 2b29c067).
// The relative PATH entry and EARSHOT_BIN observations of r2 are hard checks now.
// The probe reads the repository and writes nothing in it. Every fixture lives in one mkdtemp
// folder under the OS temp directory. The folder is removed at the end.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const REPO = '/home/daniebo/Desktop/advantage-forge';
const SCRIPT = process.env.PROBE_SCRIPT ?? join(REPO, 'scripts', 'sound-set.mjs');
const TEMP_PREFIX = join(tmpdir(), 'review-b-sound2-');
const BASE = mkdtempSync(TEMP_PREFIX);
const CANARY = 'canary-7c1e-not-a-real-secret';
let counter = 0;
let passed = 0;
let failed = 0;

function check(id, ok, detail = '') {
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}${detail ? ` :: ${detail}` : ''}`);
}
function info(id, detail) {
  console.log(`INFO ${id} :: ${detail}`);
}
const sha = (buffer) => createHash('sha256').update(buffer).digest('hex');
const json = (value) => JSON.stringify(value);
// A mutant can remove a file that a check reads. These readers turn a missing file into a failed check
// instead of a crash that would end the run with fail=0.
const readText = (path) => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
};
const readBytes = (path) => {
  try {
    return readFileSync(path);
  } catch {
    return Buffer.alloc(0);
  }
};
const isSymlink = (path) => {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
};
const listDir = (path) => {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
};
// 135 checks pass on the committed wrapper, and the count check is the 136th. The unwritable-folder check needs a non-root user.
const EXPECTED_CHECKS = process.getuid?.() === 0 ? 135 : 136;

function mkroot(label) {
  counter += 1;
  const root = join(BASE, `${String(counter).padStart(2, '0')}-${label}`);
  mkdirSync(join(root, 'sounds', 'sets'), { recursive: true });
  return root;
}
function writeSet(root, set, value) {
  writeFileSync(join(root, 'sounds', 'sets', `${set}.json`), typeof value === 'string' ? value : json(value));
}
function writeExec(path, lines) {
  writeFileSync(path, `#!${process.execPath}\n${lines.join('\n')}\n`, { mode: 0o755 });
}
function readCalls(dir, file) {
  const path = join(dir, file);
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line));
}

// A fake earshot. It logs argv, can print the canary, can exit non-zero, and writes fixed bytes.
function earshotFake(dir, { bytes = 'OggS', exit = 0, canary = false, file = 'earshot-fake.mjs' } = {}) {
  const path = join(dir, file);
  writeExec(path, [
    "import { appendFileSync, writeFileSync } from 'node:fs';",
    'const a = process.argv.slice(2);',
    `appendFileSync(${json(join(dir, 'earshot-calls.jsonl'))}, JSON.stringify(a) + '\\n');`,
    `if (${json(canary)} && process.env.CANARY_SECRET) {`,
    "  process.stdout.write('E-OUT ' + process.env.CANARY_SECRET + '\\n');",
    "  process.stderr.write('E-ERR ' + process.env.CANARY_SECRET + '\\n');",
    '}',
    `if (${exit} !== 0) process.exit(${exit});`,
    `writeFileSync(a[a.indexOf('-o') + 1], ${json(bytes)});`,
  ]);
  return path;
}
// A fake earshot that copies the committed Ogg of the entry (or a given source), optionally truncated.
function earshotCopy(dir, { truncate = 0, source = '' } = {}) {
  const path = join(dir, 'earshot-copy.mjs');
  writeExec(path, [
    "import { readFileSync, writeFileSync } from 'node:fs';",
    'const a = process.argv.slice(2);',
    "const o = a[a.indexOf('-o') + 1];",
    "const n = o.split('/').pop().replace(/\\.ogg$/, '');",
    source
      ? `let b = readFileSync(${json(source)});`
      : `let b = readFileSync(${json(`${join(REPO, 'sounds', 'chibi')}/`)} + n + '.ogg');`,
    truncate ? `b = b.subarray(0, Math.floor(b.length * ${truncate}));` : '',
    'writeFileSync(o, b);',
  ]);
  return path;
}
// A fake ffmpeg. It logs argv, can print the canary, can exit non-zero, and writes MP3 to the last argument.
function ffmpegFake(path, dir, { exit = 0, write = true, canary = false } = {}) {
  writeExec(path, [
    "import { appendFileSync, writeFileSync } from 'node:fs';",
    'const a = process.argv.slice(2);',
    `appendFileSync(${json(join(dir, 'ffmpeg-calls.jsonl'))}, JSON.stringify(a) + '\\n');`,
    `if (${json(canary)} && process.env.CANARY_SECRET) {`,
    "  process.stdout.write('F-OUT ' + process.env.CANARY_SECRET + '\\n');",
    "  process.stderr.write('F-ERR ' + process.env.CANARY_SECRET + '\\n');",
    '}',
    `if (${exit} !== 0) process.exit(${exit});`,
    `if (${json(write)}) writeFileSync(a[a.length - 1], 'MP3');`,
  ]);
  return path;
}
const ac2 = (inPath, outPath) => [
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
];

function run({ script = SCRIPT, root, args = ['fake'], env = {}, drop = [], cwd = root }) {
  const merged = { ...process.env, SOUNDS_ROOT: root, CANARY_SECRET: CANARY, ...env };
  for (const key of drop) delete merged[key];
  return spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    cwd,
    env: merged,
    timeout: 60000,
  });
}
function walk(dir, rel = '') {
  const out = [];
  let entries;
  try {
    entries = readdirSync(join(dir, rel), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const r = rel === '' ? entry.name : `${rel}/${entry.name}`;
    const st = lstatSync(join(dir, r));
    out.push(`${r}|${st.isSymbolicLink() ? 'l' : st.isDirectory() ? 'd' : 'f'}|${st.isFile() ? st.size : 0}`);
    if (st.isDirectory() && !st.isSymbolicLink()) out.push(...walk(dir, r));
  }
  return out.sort();
}
function repoHashes() {
  const map = {};
  const visit = (rel) => {
    for (const entry of readdirSync(join(REPO, rel), { withFileTypes: true })) {
      const r = `${rel}/${entry.name}`;
      if (entry.isDirectory()) visit(r);
      else map[r] = sha(readFileSync(join(REPO, r)));
    }
  };
  visit('sounds');
  return map;
}
function gitStatus() {
  return spawnSync('git', ['-C', REPO, 'status', '--short', '--', 'sounds', 'scripts', 'tests'], {
    encoding: 'utf8',
  }).stdout;
}
function secretEnvLeak(text) {
  // Values of 12 or more characters from this process environment must not appear in wrapper output.
  const skip = new Set(['SOUNDS_ROOT', 'EARSHOT_BIN', 'FFMPEG_BIN', 'PWD', 'OLDPWD', '_']);
  const hits = [];
  for (const [key, value] of Object.entries(process.env)) {
    if (skip.has(key) || value === undefined || value.length < 12) continue;
    if (text.includes(value)) hits.push(key);
  }
  return hits;
}
const notCalls = (entry) => !entry.includes('/ffmpeg-calls.jsonl') && !entry.includes('/earshot-calls.jsonl');
const bashResolve = (pathValue, cwd) =>
  spawnSync('/bin/bash', ['-c', 'command -v ffmpeg'], {
    encoding: 'utf8',
    cwd,
    env: { PATH: pathValue },
  }).stdout.trim();

try {
  const hashesBefore = repoHashes();
  const statusBefore = gitStatus();
  const ffmpegVersion = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' }).stdout.split('\n')[0];
  info('P0.host', `${ffmpegVersion}; node ${process.version}; temp base ${BASE}`);

  const source = readFileSync(SCRIPT, 'utf8');
  check(
    'P0.noShellApi',
    !/shell\s*:|execSync|exec\(|execFile|eval\(|new Function|from 'node:vm'/.test(source) &&
      (source.match(/spawnSync\(/g) ?? []).length === 2,
    `spawnSync calls=${(source.match(/spawnSync\(/g) ?? []).length}`,
  );
  check(
    'P0.hardeningLinesPresent',
    source.includes("process.env.FFMPEG_BIN || 'ffmpeg'") &&
      source.includes('if (!statSync(path).isFile()) return false;') &&
      source.includes('if (!isAbsolute(dir)) continue;') &&
      source.includes('if (!isExecutableFile(earshot)) {') &&
      source.includes('const targets = [out, mp3];'),
    'empty value as unset, regular file only, absolute PATH entries only, earshot guard, both targets listed',
  );

  // ---- Mutated copies (positive controls) ----
  const earshotShellLine =
    "const child = spawnSync(earshot, ['make', '--sound', design, '-o', out], { encoding: 'utf8' });";
  const ffmpegOptionsBlock = "    { encoding: 'utf8' },\n  );\n  if (mp3Child.status";
  const safeNameLine = 'const SAFE_NAME = /^[a-z0-9-]+$/;';
  check(
    'P0.mutationAnchors',
    source.includes(earshotShellLine) && source.includes(ffmpegOptionsBlock) && source.includes(safeNameLine),
    'anchors for the three controls found in the script',
  );
  const shellFfmpegScript = join(BASE, 'control-shell-ffmpeg.mjs');
  writeFileSync(
    shellFfmpegScript,
    source.replace(ffmpegOptionsBlock, "    { encoding: 'utf8', shell: true },\n  );\n  if (mp3Child.status"),
  );
  const shellEarshotScript = join(BASE, 'control-shell-earshot.mjs');
  writeFileSync(
    shellEarshotScript,
    source.replace(
      earshotShellLine,
      earshotShellLine.replace("{ encoding: 'utf8' }", "{ encoding: 'utf8', shell: true }"),
    ),
  );
  const looseNameScript = join(BASE, 'control-loose-name.mjs');
  writeFileSync(looseNameScript, source.replace(safeNameLine, 'const SAFE_NAME = /^.+$/s;'));

  // ---- P1 live real-ffmpeg reproduction with the default PATH lookup ----
  {
    const root = mkroot('live');
    const chibi = JSON.parse(readFileSync(join(REPO, 'sounds', 'sets', 'chibi.json'), 'utf8'));
    writeSet(root, 'chibi', chibi);
    const result = run({
      root,
      args: ['chibi'],
      env: { EARSHOT_BIN: earshotCopy(root) },
      drop: ['FFMPEG_BIN'],
    });
    check('P1.exit0', result.status === 0, `status=${result.status} stderr=${json(result.stderr)}`);
    const lines = result.stdout.trim().split('\n');
    const expected = [];
    for (const { name, design } of chibi.sounds) {
      expected.push(`sound-set: ${name}.ogg <- ${design}`, `sound-set: ${name}.mp3 <- ${design}`);
    }
    expected.push('sound-set: 7 sounds -> sounds/chibi');
    check('P1.stdoutLines', json(lines) === json(expected), `lines=${lines.length}`);
    check('P1.fileCount14', listDir(join(root, 'sounds', 'chibi')).length === 14);
    for (const { name } of chibi.sounds) {
      const gotMp3 = readBytes(join(root, 'sounds', 'chibi', `${name}.mp3`));
      const refMp3 = readFileSync(join(REPO, 'sounds', 'chibi', `${name}.mp3`));
      check(
        `P1.mp3Equals.${name}`,
        sha(gotMp3) === sha(refMp3),
        `${gotMp3.length} bytes, sha256 ${sha(gotMp3).slice(0, 12)}`,
      );
    }
    check('P1.noCanaryInOutput', !(result.stdout + result.stderr).includes(CANARY));
  }

  // ---- P1b committed MP3 bytes: tags, markers, frame walk ----
  {
    const bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
    const rates = [44100, 48000, 32000];
    const chibi = JSON.parse(readFileSync(join(REPO, 'sounds', 'sets', 'chibi.json'), 'utf8'));
    const markers = [
      'ID3',
      'TAG',
      'Xing',
      'Info',
      'Lavf',
      'Lavc',
      '/home',
      'daniebo',
      'opencode',
      'localhost',
    ];
    const host = spawnSync('hostname', { encoding: 'utf8' }).stdout.trim();
    let total = 0;
    for (const { name } of chibi.sounds) {
      const path = join(REPO, 'sounds', 'chibi', `${name}.mp3`);
      const bytes = readFileSync(path);
      total += bytes.length;
      const text = bytes.toString('latin1');
      const found = markers.filter((m) => text.includes(m));
      if (host.length >= 3 && text.includes(host)) found.push(`hostname:${host}`);
      if (/[A-Za-z0-9._%+-]{3,}@[A-Za-z0-9-]{2,}\.[A-Za-z]{2,}/.test(text)) found.push('email-like');
      check(
        `P1b.noMarkers.${name}`,
        found.length === 0,
        found.length
          ? `found ${found.join(',')}`
          : 'none of ID3, TAG, Xing, Info, Lavf, Lavc, /home, user name, host name, e-mail',
      );
      let offset = 0;
      let frames = 0;
      let bad = '';
      while (offset < bytes.length) {
        const b1 = bytes[offset + 1] ?? 0;
        const b2 = bytes[offset + 2] ?? 0;
        const sync = bytes[offset] === 0xff && (b1 & 0xe0) === 0xe0;
        const version = (b1 >> 3) & 3;
        const layer = (b1 >> 1) & 3;
        const kbps = bitrates[(b2 >> 4) & 15] ?? 0;
        const rate = rates[(b2 >> 2) & 3] ?? 0;
        if (!sync || version !== 3 || layer !== 1 || kbps !== 96 || rate !== 48000) {
          bad = `frame ${frames} at offset ${offset} breaks sync, version, layer, 96 kbps, or 48000 Hz`;
          break;
        }
        offset += Math.floor((144000 * kbps) / rate) + ((b2 >> 1) & 1);
        frames += 1;
      }
      check(
        `P1b.frameWalk.${name}`,
        bad === '' && offset === bytes.length,
        bad ||
          `${frames} frames of 288 bytes, ${bytes.length} bytes, ${((frames * 1152) / 48000).toFixed(3)} s`,
      );
      const probe = spawnSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', path], {
        encoding: 'utf8',
      });
      const tagLines = probe.stdout.split('\n').filter((line) => line.startsWith('TAG:'));
      check(
        `P1b.ffprobeTags.${name}`,
        probe.status === 0 && tagLines.length === 0,
        `tag lines=${tagLines.length}`,
      );
    }
    info('P1b.total', `${total} MP3 bytes in 7 files`);
  }

  // ---- P2 no shell: metacharacters in FFMPEG_BIN and EARSHOT_BIN ----
  {
    const names = [
      ['semicolon', 'ff;touch MARK1;.mjs'],
      ['dollar', 'ff$(touch MARK2).mjs'],
      ['backtick', 'ff`touch MARK3`.mjs'],
      ['quotes', 'ff \'q" x&|<>.mjs'],
    ];
    for (const [label, file] of names) {
      const root = mkroot(`meta-ffmpeg-${label}`);
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const ffmpeg = ffmpegFake(join(root, file), root);
      const result = run({ root, env: { EARSHOT_BIN: earshotFake(root), FFMPEG_BIN: ffmpeg } });
      const calls = readCalls(root, 'ffmpeg-calls.jsonl');
      const out = join(root, 'sounds', 'fake');
      const markers = ['MARK1', 'MARK2', 'MARK3'].filter((m) => existsSync(join(root, m)));
      check(
        `P2.ffmpeg.${label}`,
        result.status === 0 &&
          markers.length === 0 &&
          calls.length === 1 &&
          json(calls[0]) === json(ac2(join(out, 'alpha.ogg'), join(out, 'alpha.mp3'))),
        `status=${result.status} markers=${markers.length} calls=${calls.length}`,
      );
    }
    {
      const controlHits = [];
      for (const [label, file] of names.slice(0, 3)) {
        const root = mkroot(`control-shell-ffmpeg-${label}`);
        writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
        const ffmpeg = ffmpegFake(join(root, file), root);
        run({ script: shellFfmpegScript, root, env: { EARSHOT_BIN: earshotFake(root), FFMPEG_BIN: ffmpeg } });
        for (const m of ['MARK1', 'MARK2', 'MARK3']) if (existsSync(join(root, m))) controlHits.push(m);
      }
      check(
        'P2.control.shellFfmpegDetected',
        controlHits.length === 3,
        `a copy with shell:true on the ffmpeg spawn created ${controlHits.join(',')}`,
      );
    }
    for (const [label, file] of names) {
      const root = mkroot(`meta-earshot-${label}`);
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const earshot = earshotFake(root, { file });
      const ffmpeg = ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root);
      const result = run({ root, env: { EARSHOT_BIN: earshot, FFMPEG_BIN: ffmpeg } });
      const markers = ['MARK1', 'MARK2', 'MARK3'].filter((m) => existsSync(join(root, m)));
      check(
        `P2.earshot.${label}`,
        result.status === 0 && markers.length === 0 && readCalls(root, 'earshot-calls.jsonl').length === 1,
        `status=${result.status} markers=${markers.length}`,
      );
    }
    {
      const controlHits = [];
      for (const [label, file] of names.slice(0, 3)) {
        const root = mkroot(`control-shell-earshot-${label}`);
        writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
        const earshot = earshotFake(root, { file });
        const ffmpeg = ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root);
        run({ script: shellEarshotScript, root, env: { EARSHOT_BIN: earshot, FFMPEG_BIN: ffmpeg } });
        for (const m of ['MARK1', 'MARK2', 'MARK3']) if (existsSync(join(root, m))) controlHits.push(m);
      }
      check(
        'P2.control.shellEarshotDetected',
        controlHits.length === 3,
        `a copy with shell:true on the earshot spawn created ${controlHits.join(',')}`,
      );
    }
    // Paths that hold spaces, quotes, colons, and percent signs reach ffmpeg as one argv element.
    {
      const root = join(BASE, `${String(++counter).padStart(2, '0')}-odd root: a%d b'c"d`);
      mkdirSync(join(root, 'sounds', 'sets'), { recursive: true });
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const result = run({
        root,
        env: { EARSHOT_BIN: earshotFake(root), FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root) },
      });
      const calls = readCalls(root, 'ffmpeg-calls.jsonl');
      const out = join(root, 'sounds', 'fake');
      check(
        'P2.oddRoot',
        result.status === 0 &&
          calls.length === 1 &&
          json(calls[0]) === json(ac2(join(out, 'alpha.ogg'), join(out, 'alpha.mp3'))),
        `status=${result.status}`,
      );
    }
    // A real ffmpeg run through a root that holds a colon and a percent sign (protocol and pattern confusion).
    {
      const root = join(BASE, `${String(++counter).padStart(2, '0')}-http:%d x`);
      mkdirSync(join(root, 'sounds', 'sets'), { recursive: true });
      const chibi = JSON.parse(readFileSync(join(REPO, 'sounds', 'sets', 'chibi.json'), 'utf8'));
      writeSet(root, 'chibi', { sounds: [chibi.sounds[0]] });
      const result = run({
        root,
        args: ['chibi'],
        env: { EARSHOT_BIN: earshotCopy(root) },
        drop: ['FFMPEG_BIN'],
      });
      const got = existsSync(join(root, 'sounds', 'chibi', 'tap.mp3'))
        ? readFileSync(join(root, 'sounds', 'chibi', 'tap.mp3'))
        : Buffer.alloc(0);
      const ref = readFileSync(join(REPO, 'sounds', 'chibi', 'tap.mp3'));
      check(
        'P2.realFfmpegColonRoot',
        result.status === 0 && sha(got) === sha(ref),
        `status=${result.status} bytes=${got.length}`,
      );
    }
  }

  // ---- P3 names: path traversal and option confusion ----
  {
    const invalid = [
      '../evil',
      'a/b',
      'a\\b',
      '.',
      '..',
      'a.b',
      'A',
      'a b',
      'a\nb',
      'a\u0000b',
      'é',
      '__proto__',
      'ａ',
      'a‮b',
      '%2e%2e',
      '~',
      '$HOME',
      'a;b',
      '*',
      'tap\n',
    ];
    const oracle = (name) => name.length > 0 && [...name].every((c) => /[a-z0-9-]/.test(c));
    let rejected = 0;
    for (const name of invalid) {
      const root = mkroot('name-invalid');
      writeSet(root, 'fake', { sounds: [{ name, design: 'tap/soft' }] });
      const env = {
        EARSHOT_BIN: earshotFake(root),
        FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root),
      };
      const before = walk(BASE);
      const result = run({ root, env });
      const added = walk(BASE).filter((entry) => !before.includes(entry) && notCalls(entry));
      const ok =
        !oracle(name) &&
        result.status === 1 &&
        result.stderr === `sound-set: bad set file: bad name ${name}\n` &&
        result.stdout === '' &&
        readCalls(root, 'earshot-calls.jsonl').length === 0 &&
        added.length === 0;
      if (ok) rejected += 1;
      else check(`P3.rejects.${json(name)}`, false, `status=${result.status} added=${json(added)}`);
    }
    check(
      'P3.rejectsAllInvalidNames',
      rejected === invalid.length,
      `${rejected} of ${invalid.length} names rejected with the exact line, zero earshot calls, and no new file anywhere`,
    );
    for (const name of ['-x', '--help', '-', '-i', '0', 'x-', 'constructor']) {
      const root = mkroot('name-valid');
      writeSet(root, 'fake', { sounds: [{ name, design: 'tap/soft' }] });
      const env = {
        EARSHOT_BIN: earshotFake(root),
        FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root),
      };
      const before = walk(BASE);
      const result = run({ root, env });
      const inside = `${root.slice(BASE.length + 1)}/sounds/fake`;
      const added = walk(BASE).filter(
        (entry) => !before.includes(entry) && notCalls(entry) && !entry.startsWith(inside),
      );
      const out = join(root, 'sounds', 'fake');
      const calls = readCalls(root, 'ffmpeg-calls.jsonl');
      const argv = calls[0] ?? [];
      check(
        `P3.dashNames.${name}`,
        oracle(name) &&
          result.status === 0 &&
          added.length === 0 &&
          calls.length === 1 &&
          json(argv) === json(ac2(join(out, `${name}.ogg`), join(out, `${name}.mp3`))) &&
          argv[argv.indexOf('-i') + 1].startsWith('/') &&
          argv.at(-1).startsWith('/'),
        `status=${result.status} added=${json(added)} -i value=${argv[argv.indexOf('-i') + 1]?.replace(root, '<root>')}`,
      );
    }
    {
      const root = mkroot('control-loose-name');
      writeSet(root, 'fake', { sounds: [{ name: '../evil', design: 'tap/soft' }] });
      const env = {
        EARSHOT_BIN: earshotFake(root),
        FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root),
      };
      const before = walk(BASE);
      run({ script: looseNameScript, root, env });
      const escaped = walk(BASE).filter(
        (entry) => !before.includes(entry) && /sounds\/evil\.(ogg|mp3)\|/.test(entry),
      );
      check(
        'P3.control.looseNameEscapes',
        escaped.length === 2,
        `a copy without the name check wrote outside sounds/fake: ${escaped.join(' ; ')}`,
      );
    }
    let setRejected = 0;
    const badSets = ['../x', 'a/b', '.', '..', 'CHIBI', 'chibi\n', '', 'chibi.json', 'a\\b'];
    for (const set of badSets) {
      const root = mkroot('setarg-invalid');
      const env = {
        EARSHOT_BIN: earshotFake(root),
        FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root),
      };
      const before = walk(BASE);
      const result = run({ root, args: [set], env });
      const added = walk(BASE).filter((entry) => !before.includes(entry) && notCalls(entry));
      if (result.status === 2 && result.stderr === `sound-set: bad set name: ${set}\n` && added.length === 0)
        setRejected += 1;
      else check(`P3.setArg.${json(set)}`, false, `status=${result.status} added=${json(added)}`);
    }
    check(
      'P3.rejectsAllBadSetArgs',
      setRejected === badSets.length,
      `${setRejected} of ${badSets.length} set arguments rejected with exit 2, the exact line, and no new file`,
    );
    {
      const root = mkroot('setarg-dash');
      const result = run({
        root,
        args: ['-h'],
        env: { EARSHOT_BIN: earshotFake(root), FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root) },
      });
      check(
        'P3.setArgDashH',
        result.status === 1 &&
          result.stderr === `sound-set: set file not found: ${join(root, 'sounds', 'sets', '-h.json')}\n`,
        `status=${result.status}`,
      );
    }
    {
      const root = mkroot('set-named-sets');
      const body = json({
        sounds: [
          { name: 'sets', design: 'tap/soft' },
          { name: 'chibi', design: 'pop/bubble' },
        ],
      });
      writeFileSync(join(root, 'sounds', 'sets', 'sets.json'), body);
      writeFileSync(join(root, 'sounds', 'sets', 'chibi.json'), 'other-set-bytes');
      const result = run({
        root,
        args: ['sets'],
        env: { EARSHOT_BIN: earshotFake(root), FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root) },
      });
      check(
        'P3.setNamedSets',
        result.status === 0 &&
          readText(join(root, 'sounds', 'sets', 'sets.json')) === body &&
          readText(join(root, 'sounds', 'sets', 'chibi.json')) === 'other-set-bytes' &&
          existsSync(join(root, 'sounds', 'sets', 'chibi.mp3')),
        `status=${result.status}`,
      );
    }
    {
      const root = mkroot('design-escape');
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/\u001b[31msoft' }] });
      const result = run({
        root,
        env: { EARSHOT_BIN: earshotFake(root), FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root) },
      });
      info(
        'P3.designEscapeEchoed',
        `status=${result.status} stdout carries the raw ESC byte: ${result.stdout.includes('\u001b')}`,
      );
    }
  }

  // ---- P4 ffmpeg lookup (the code of dcfad290): hard checks ----
  {
    const entries = {
      sounds: [
        { name: 'alpha', design: 'tap/soft' },
        { name: 'beta', design: 'error/knock' },
      ],
    };
    const setup = (label) => {
      const root = mkroot(label);
      writeSet(root, 'fake', entries);
      return { root, earshot: earshotFake(root) };
    };
    const summary = (root, result) =>
      `status=${result.status} stderr=${json(result.stderr.replaceAll(root, '<root>'))} earshotCalls=${readCalls(root, 'earshot-calls.jsonl').length} ffmpegCalls=${readCalls(root, 'ffmpeg-calls.jsonl').length} files=${json(existsSync(join(root, 'sounds', 'fake')) ? readdirSync(join(root, 'sounds', 'fake')) : [])}`;
    // A failed lookup: exit 1, the exact AC2 line, zero earshot calls, and no output folder.
    const closedFailure = (root, result, shown) =>
      result.status === 1 &&
      result.stderr === `sound-set: ffmpeg not found at ${shown}; install ffmpeg\n` &&
      result.stdout === '' &&
      readCalls(root, 'earshot-calls.jsonl').length === 0 &&
      !existsSync(join(root, 'sounds', 'fake'));
    const closedChecks = [
      ['absentPath', (root) => join(root, 'absent-ffmpeg'), () => {}],
      [
        'nonExecutableFile',
        (root) => join(root, 'ffmpeg-plain'),
        (root) => writeFileSync(join(root, 'ffmpeg-plain'), 'not executable', { mode: 0o644 }),
      ],
      ['directory', (root) => join(root, 'adir'), (root) => mkdirSync(join(root, 'adir'))],
      [
        'symlinkToDirectory',
        (root) => join(root, 'dirlink'),
        (root) => {
          mkdirSync(join(root, 'adir'));
          symlinkSync(join(root, 'adir'), join(root, 'dirlink'));
        },
      ],
      [
        'danglingSymlink',
        (root) => join(root, 'dangling'),
        (root) => symlinkSync(join(root, 'nowhere'), join(root, 'dangling')),
      ],
      ['devNull', () => '/dev/null', () => {}],
      ['whitespaceOnly', () => ' ', () => {}],
      [
        'trailingSlashOnFile',
        (root) => `${join(root, 'ffmpeg-file')}/`,
        (root) => ffmpegFake(join(root, 'ffmpeg-file'), root),
      ],
      [
        'symlinkLoop',
        (root) => join(root, 'loop-a'),
        (root) => {
          symlinkSync(join(root, 'loop-b'), join(root, 'loop-a'));
          symlinkSync(join(root, 'loop-a'), join(root, 'loop-b'));
        },
      ],
      ['veryLongPath', (root) => join(root, 'x'.repeat(5000)), () => {}],
    ];
    for (const [label, valueFor, prepare] of closedChecks) {
      const { root, earshot } = setup(`p4-closed-${label}`);
      prepare(root);
      const value = valueFor(root);
      const result = run({ root, env: { EARSHOT_BIN: earshot, FFMPEG_BIN: value } });
      check(`P4.closed.${label}`, closedFailure(root, result, value), summary(root, result));
    }
    {
      const { root, earshot } = setup('p4-closed-fifo');
      const fifo = join(root, 'ffmpeg-fifo');
      const made = spawnSync('mkfifo', [fifo]);
      const started = Date.now();
      const result = run({ root, env: { EARSHOT_BIN: earshot, FFMPEG_BIN: fifo } });
      check(
        'P4.closed.fifoWithoutHang',
        made.status === 0 && closedFailure(root, result, fifo) && Date.now() - started < 20000,
        `${summary(root, result)} elapsedMs=${Date.now() - started}`,
      );
    }
    {
      const { root, earshot } = setup('p4-closed-bare-missing');
      mkdirSync(join(root, 'emptybin'));
      const result = run({
        root,
        env: { EARSHOT_BIN: earshot, FFMPEG_BIN: 'no-such-ffmpeg-xyz', PATH: join(root, 'emptybin') },
      });
      check(
        'P4.closed.bareNameNotOnPath',
        closedFailure(root, result, 'no-such-ffmpeg-xyz'),
        summary(root, result),
      );
    }
    {
      const { root, earshot } = setup('p4-closed-path-unset');
      const result = run({ root, env: { EARSHOT_BIN: earshot }, drop: ['FFMPEG_BIN', 'PATH'] });
      check('P4.closed.pathUnset', closedFailure(root, result, 'ffmpeg'), summary(root, result));
    }
    {
      const { root, earshot } = setup('p4-closed-cwd-only');
      mkdirSync(join(root, 'emptybin'));
      ffmpegFake(join(root, 'ffmpeg'), root);
      const result = run({
        root,
        env: { EARSHOT_BIN: earshot, PATH: join(root, 'emptybin') },
        drop: ['FFMPEG_BIN'],
      });
      check(
        'P4.closed.defaultOnlyInCwd',
        closedFailure(root, result, 'ffmpeg') && readCalls(root, 'ffmpeg-calls.jsonl').length === 0,
        summary(root, result),
      );
    }
    {
      const { root, earshot } = setup('p4-closed-bare-in-cwd');
      mkdirSync(join(root, 'emptybin'));
      ffmpegFake(join(root, 'ffmpeg-x'), root);
      const result = run({
        root,
        env: { EARSHOT_BIN: earshot, FFMPEG_BIN: 'ffmpeg-x', PATH: join(root, 'emptybin') },
      });
      check(
        'P4.closed.bareNameOnlyInCwd',
        closedFailure(root, result, 'ffmpeg-x') && readCalls(root, 'ffmpeg-calls.jsonl').length === 0,
        summary(root, result),
      );
    }
    // Empty PATH entries must not reach the working directory.
    for (const [label, build] of [
      ['leading', (dir) => `:${dir}`],
      ['trailing', (dir) => `${dir}:`],
      ['middle', (dir) => `${dir}::${dir}`],
      ['onlyEmpty', () => ''],
    ]) {
      const { root, earshot } = setup(`p4-empty-entry-${label}`);
      mkdirSync(join(root, 'emptybin'));
      ffmpegFake(join(root, 'ffmpeg'), root);
      const pathValue = build(join(root, 'emptybin'));
      const result = run({ root, env: { EARSHOT_BIN: earshot, PATH: pathValue }, drop: ['FFMPEG_BIN'] });
      check(
        `P4.emptyPathEntry.${label}`,
        closedFailure(root, result, 'ffmpeg') && readCalls(root, 'ffmpeg-calls.jsonl').length === 0,
        `${summary(root, result)} | bash command -v ffmpeg => ${json(bashResolve(pathValue, root).replaceAll(root, '<root>'))}`,
      );
    }
    {
      // An empty entry with a real binary later on PATH: the later absolute binary runs, the planted one does not.
      const { root, earshot } = setup('p4-empty-entry-real-later');
      mkdirSync(join(root, 'logA'));
      mkdirSync(join(root, 'logB'));
      mkdirSync(join(root, 'binB'));
      ffmpegFake(join(root, 'ffmpeg'), join(root, 'logA'));
      ffmpegFake(join(root, 'binB', 'ffmpeg'), join(root, 'logB'));
      const result = run({
        root,
        env: { EARSHOT_BIN: earshot, PATH: `:${join(root, 'binB')}` },
        drop: ['FFMPEG_BIN'],
      });
      check(
        'P4.emptyPathEntry.laterRealBinaryRuns',
        result.status === 0 &&
          readCalls(join(root, 'logB'), 'ffmpeg-calls.jsonl').length === 2 &&
          readCalls(join(root, 'logA'), 'ffmpeg-calls.jsonl').length === 0,
        `status=${result.status} planted calls=${readCalls(join(root, 'logA'), 'ffmpeg-calls.jsonl').length} later calls=${readCalls(join(root, 'logB'), 'ffmpeg-calls.jsonl').length}`,
      );
    }
    // Success paths.
    {
      const { root, earshot } = setup('p4-ok-empty-is-unset');
      mkdirSync(join(root, 'bin'));
      ffmpegFake(join(root, 'bin', 'ffmpeg'), root);
      const result = run({
        root,
        env: { EARSHOT_BIN: earshot, FFMPEG_BIN: '', PATH: `${join(root, 'bin')}:${process.env.PATH}` },
      });
      check(
        'P4.ok.emptyFfmpegBinIsUnset',
        result.status === 0 && readCalls(root, 'ffmpeg-calls.jsonl').length === 2,
        summary(root, result),
      );
    }
    {
      const { root, earshot } = setup('p4-ok-dir-before-real');
      mkdirSync(join(root, 'binA', 'ffmpeg'), { recursive: true });
      mkdirSync(join(root, 'binB'));
      ffmpegFake(join(root, 'binB', 'ffmpeg'), root);
      const pathValue = `${join(root, 'binA')}:${join(root, 'binB')}`;
      const result = run({ root, env: { EARSHOT_BIN: earshot, PATH: pathValue }, drop: ['FFMPEG_BIN'] });
      check(
        'P4.ok.directoryNamedFfmpegIsSkipped',
        result.status === 0 && readCalls(root, 'ffmpeg-calls.jsonl').length === 2,
        `${summary(root, result)} | bash command -v ffmpeg => ${json(bashResolve(pathValue, root).replaceAll(root, '<root>'))}`,
      );
    }
    {
      const { root, earshot } = setup('p4-ok-nonexec-before-real');
      mkdirSync(join(root, 'binA'));
      mkdirSync(join(root, 'binB'));
      writeFileSync(join(root, 'binA', 'ffmpeg'), 'plain text', { mode: 0o644 });
      ffmpegFake(join(root, 'binB', 'ffmpeg'), root);
      const result = run({
        root,
        env: { EARSHOT_BIN: earshot, PATH: `${join(root, 'binA')}:${join(root, 'binB')}` },
        drop: ['FFMPEG_BIN'],
      });
      check(
        'P4.ok.nonExecutableBeforeRealIsSkipped',
        result.status === 0 && readCalls(root, 'ffmpeg-calls.jsonl').length === 2,
        summary(root, result),
      );
    }
    {
      const { root, earshot } = setup('p4-ok-file-as-path-entry');
      mkdirSync(join(root, 'binB'));
      writeFileSync(join(root, 'afile'), 'x');
      ffmpegFake(join(root, 'binB', 'ffmpeg'), root);
      const result = run({
        root,
        env: {
          EARSHOT_BIN: earshot,
          PATH: `${join(root, 'afile')}:${join(root, 'nonexistent')}:${join(root, 'binB')}`,
        },
        drop: ['FFMPEG_BIN'],
      });
      check(
        'P4.ok.badPathEntriesAreSkipped',
        result.status === 0 && readCalls(root, 'ffmpeg-calls.jsonl').length === 2,
        summary(root, result),
      );
    }
    {
      const { root, earshot } = setup('p4-ok-symlink-to-file');
      const real = ffmpegFake(join(root, 'ffmpeg-real.mjs'), root);
      symlinkSync(real, join(root, 'ffmpeg-link'));
      const result = run({ root, env: { EARSHOT_BIN: earshot, FFMPEG_BIN: join(root, 'ffmpeg-link') } });
      check(
        'P4.ok.symlinkToExecutableFile',
        result.status === 0 && readCalls(root, 'ffmpeg-calls.jsonl').length === 2,
        summary(root, result),
      );
    }
    {
      const { root, earshot } = setup('p4-ok-relative');
      mkdirSync(join(root, 'bin'));
      ffmpegFake(join(root, 'bin', 'ffmpeg-rel'), root);
      const result = run({ root, env: { EARSHOT_BIN: earshot, FFMPEG_BIN: './bin/ffmpeg-rel' } });
      check(
        'P4.ok.relativePathWithSlash',
        result.status === 0 && readCalls(root, 'ffmpeg-calls.jsonl').length === 2,
        summary(root, result),
      );
    }
    {
      const { root, earshot } = setup('p4-ok-basename');
      mkdirSync(join(root, 'bin'));
      ffmpegFake(join(root, 'bin', 'fakeff'), root);
      const result = run({
        root,
        env: { EARSHOT_BIN: earshot, FFMPEG_BIN: 'fakeff', PATH: `${join(root, 'bin')}:${process.env.PATH}` },
      });
      check(
        'P4.ok.basenameThroughPath',
        result.status === 0 && readCalls(root, 'ffmpeg-calls.jsonl').length === 2,
        summary(root, result),
      );
    }
    // Relative PATH entries are never searched (F5). A shell would honor them.
    for (const [label, relative, planted] of [
      ['dot', '.', ''],
      ['bin', 'bin', 'bin'],
      ['dotSlashBin', './bin', 'bin'],
      ['parent', '..', '..'],
    ]) {
      const { root, earshot } = setup(`p4-relative-${label}`);
      const directory = resolve(root, planted);
      mkdirSync(directory, { recursive: true });
      ffmpegFake(join(directory, 'ffmpeg'), root);
      const result = run({ root, env: { EARSHOT_BIN: earshot, PATH: relative }, drop: ['FFMPEG_BIN'] });
      check(
        `P4.relativeEntry.${label}`,
        closedFailure(root, result, 'ffmpeg') && readCalls(root, 'ffmpeg-calls.jsonl').length === 0,
        `${summary(root, result)} | bash command -v ffmpeg => ${json(bashResolve(relative, root))}`,
      );
    }
    {
      // A relative entry before a real absolute entry: the planted file stays unused, the real binary runs.
      const { root, earshot } = setup('p4-relative-dot-real-later');
      mkdirSync(join(root, 'logA'));
      mkdirSync(join(root, 'logB'));
      mkdirSync(join(root, 'binB'));
      ffmpegFake(join(root, 'ffmpeg'), join(root, 'logA'));
      ffmpegFake(join(root, 'binB', 'ffmpeg'), join(root, 'logB'));
      const result = run({
        root,
        env: { EARSHOT_BIN: earshot, PATH: `.:${join(root, 'binB')}` },
        drop: ['FFMPEG_BIN'],
      });
      const planted = readCalls(join(root, 'logA'), 'ffmpeg-calls.jsonl').length;
      const later = readCalls(join(root, 'logB'), 'ffmpeg-calls.jsonl').length;
      check(
        'P4.relativeEntry.dotBeforeRealBinary',
        result.status === 0 && planted === 0 && later === 2,
        `status=${result.status} planted calls=${planted} later calls=${later}`,
      );
    }
    {
      // An absolute entry that names the working directory is still an absolute entry. The caller chose it.
      const { root, earshot } = setup('p4-absolute-proc-self-cwd');
      ffmpegFake(join(root, 'ffmpeg'), root);
      const result = run({
        root,
        env: { EARSHOT_BIN: earshot, PATH: '/proc/self/cwd' },
        drop: ['FFMPEG_BIN'],
      });
      info('P4.absoluteEntry.procSelfCwd', summary(root, result));
    }
    // EARSHOT_BIN (F6): only a regular executable file passes, and the check runs before any preparation.
    // The diagnostic names resolve(EARSHOT_BIN), so an empty value names the working directory.
    const earshotClosed = (root, result, value) =>
      result.status === 1 &&
      result.stderr ===
        `sound-set: earshot not found at ${resolve(root, value)}; run scripts/sound-setup.sh\n` &&
      result.stdout === '' &&
      readCalls(root, 'earshot-calls.jsonl').length === 0 &&
      readCalls(root, 'ffmpeg-calls.jsonl').length === 0;
    const earshotCases = [
      ['empty', () => '', () => {}],
      ['directory', (root) => join(root, 'adir'), (root) => mkdirSync(join(root, 'adir'))],
      [
        'nonExecutableFile',
        (root) => join(root, 'earshot-plain'),
        (root) => writeFileSync(join(root, 'earshot-plain'), 'not executable', { mode: 0o644 }),
      ],
      ['devNull', () => '/dev/null', () => {}],
      [
        'danglingSymlink',
        (root) => join(root, 'dangling'),
        (root) => symlinkSync(join(root, 'nowhere'), join(root, 'dangling')),
      ],
      [
        'symlinkToDirectory',
        (root) => join(root, 'dirlink'),
        (root) => {
          mkdirSync(join(root, 'adir'));
          symlinkSync(join(root, 'adir'), join(root, 'dirlink'));
        },
      ],
      [
        'symlinkLoop',
        (root) => join(root, 'loop-a'),
        (root) => {
          symlinkSync(join(root, 'loop-b'), join(root, 'loop-a'));
          symlinkSync(join(root, 'loop-a'), join(root, 'loop-b'));
        },
      ],
      ['veryLongPath', (root) => join(root, 'x'.repeat(5000)), () => {}],
      [
        'fifo',
        (root) => join(root, 'earshot-fifo'),
        (root) => spawnSync('mkfifo', [join(root, 'earshot-fifo')]),
      ],
    ];
    for (const [label, valueFor, prepare] of earshotCases) {
      const root = mkroot(`p4-earshot-${label}`);
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      prepare(root);
      const out = join(root, 'sounds', 'fake');
      mkdirSync(out, { recursive: true });
      writeFileSync(join(out, 'alpha.ogg'), 'old-ogg');
      writeFileSync(join(out, 'alpha.mp3'), 'old-mp3');
      const value = valueFor(root);
      const result = run({
        root,
        env: { EARSHOT_BIN: value, FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root) },
      });
      check(
        `P4.earshot.closed.${label}`,
        earshotClosed(root, result, value) &&
          readText(join(out, 'alpha.ogg')) === 'old-ogg' &&
          readText(join(out, 'alpha.mp3')) === 'old-mp3',
        `status=${result.status} stderr=${json(result.stderr.replaceAll(root, '<root>'))} old files after the run: ogg ${existsSync(join(out, 'alpha.ogg')) ? 'kept' : 'REMOVED'}, mp3 ${existsSync(join(out, 'alpha.mp3')) ? 'kept' : 'REMOVED'}`,
      );
    }
    {
      // Both binaries missing: the earshot line comes first, as before this phase.
      const root = mkroot('p4-earshot-before-ffmpeg');
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const missing = join(root, 'no-earshot');
      const result = run({ root, env: { EARSHOT_BIN: missing, FFMPEG_BIN: join(root, 'no-ffmpeg') } });
      check(
        'P4.earshot.checkedBeforeFfmpeg',
        result.status === 1 &&
          result.stderr === `sound-set: earshot not found at ${missing}; run scripts/sound-setup.sh\n`,
        `status=${result.status} stderr=${json(result.stderr.replaceAll(root, '<root>'))}`,
      );
    }
    {
      // A rejected earshot path creates no output folder.
      const root = mkroot('p4-earshot-no-outdir');
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const result = run({
        root,
        env: {
          EARSHOT_BIN: join(root, 'no-earshot'),
          FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root),
        },
      });
      check(
        'P4.earshot.noOutputFolder',
        result.status === 1 && !existsSync(join(root, 'sounds', 'fake')),
        `status=${result.status} folder exists=${existsSync(join(root, 'sounds', 'fake'))}`,
      );
    }
    {
      const root = mkroot('p4-ok-earshot-symlink');
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const real = earshotFake(root, { file: 'earshot-real.mjs' });
      symlinkSync(real, join(root, 'earshot-link'));
      const result = run({
        root,
        env: {
          EARSHOT_BIN: join(root, 'earshot-link'),
          FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root),
        },
      });
      check(
        'P4.ok.earshotSymlinkToExecutableFile',
        result.status === 0 && readCalls(root, 'earshot-calls.jsonl').length === 1,
        `status=${result.status} stderr=${json(result.stderr.replaceAll(root, '<root>'))}`,
      );
    }
    {
      const root = mkroot('p4-ok-earshot-relative');
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      mkdirSync(join(root, 'bin'));
      earshotFake(join(root, 'bin'), { file: 'earshot-rel.mjs' });
      const result = run({
        root,
        env: {
          EARSHOT_BIN: './bin/earshot-rel.mjs',
          FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root),
        },
      });
      check(
        'P4.ok.earshotRelativePathWithSlash',
        result.status === 0 && readCalls(join(root, 'bin'), 'earshot-calls.jsonl').length === 1,
        `status=${result.status} stderr=${json(result.stderr.replaceAll(root, '<root>'))}`,
      );
    }
    {
      // resolve() removes a trailing slash before the guard runs, so the named executable file runs. The caller named it.
      const root = mkroot('p4-earshot-trailing-slash');
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const real = earshotFake(root, { file: 'earshot-file' });
      const result = run({
        root,
        env: { EARSHOT_BIN: `${real}/`, FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root) },
      });
      info(
        'P4.earshot.trailingSlashOnFile',
        `status=${result.status} stderr=${json(result.stderr.replaceAll(root, '<root>'))} earshot calls=${readCalls(root, 'earshot-calls.jsonl').length}`,
      );
    }
  }

  // ---- P5 target preparation (the code of dcfad290): hard checks ----
  {
    const prepSet = {
      sounds: [
        { name: 'alpha', design: 'tap/soft' },
        { name: 'beta', design: 'error/knock' },
      ],
    };
    for (const [target, ext] of [
      ['mp3', 'mp3'],
      ['ogg', 'ogg'],
    ]) {
      for (const kind of ['file', 'directory', 'dangling']) {
        const root = mkroot(`p5-${target}-symlink-${kind}`);
        writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
        mkdirSync(join(root, 'sounds', 'fake'));
        const destination = join(root, 'protected');
        if (kind === 'file') writeFileSync(destination, 'preserve');
        if (kind === 'directory') {
          mkdirSync(destination);
          writeFileSync(join(destination, 'keep.txt'), 'preserve');
        }
        const linked = join(root, 'sounds', 'fake', `alpha.${ext}`);
        symlinkSync(destination, linked);
        const result = run({
          root,
          env: { EARSHOT_BIN: earshotFake(root), FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root) },
        });
        const intact =
          kind === 'file'
            ? readText(destination) === 'preserve'
            : kind === 'directory'
              ? readText(join(destination, 'keep.txt')) === 'preserve'
              : !existsSync(destination);
        check(
          `P5.${target}Symlink.${kind}`,
          result.status === 0 && !isSymlink(linked) && intact,
          `status=${result.status}`,
        );
      }
    }
    {
      // .mp3 is a directory, a stale .ogg exists: nothing is removed, earshot never starts.
      const root = mkroot('p5-mp3-dir-stale-ogg');
      writeSet(root, 'fake', prepSet);
      const out = join(root, 'sounds', 'fake');
      mkdirSync(join(out, 'alpha.mp3'), { recursive: true });
      writeFileSync(join(out, 'alpha.mp3', 'keep.txt'), 'preserve');
      writeFileSync(join(out, 'alpha.ogg'), 'stale-ogg-bytes');
      const result = run({
        root,
        env: { EARSHOT_BIN: earshotFake(root), FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root) },
      });
      check(
        'P5.mp3Dir.staleOggKept',
        result.status === 1 &&
          result.stderr ===
            `sound-set: cannot prepare output for alpha (tap/soft): ${join(out, 'alpha.mp3')}\n` &&
          readCalls(root, 'earshot-calls.jsonl').length === 0 &&
          readText(join(out, 'alpha.ogg')) === 'stale-ogg-bytes' &&
          readText(join(out, 'alpha.mp3', 'keep.txt')) === 'preserve',
        `status=${result.status}`,
      );
    }
    {
      // .ogg is a directory, a stale .mp3 exists: the mirror case.
      const root = mkroot('p5-ogg-dir-stale-mp3');
      writeSet(root, 'fake', prepSet);
      const out = join(root, 'sounds', 'fake');
      mkdirSync(join(out, 'alpha.ogg'), { recursive: true });
      writeFileSync(join(out, 'alpha.ogg', 'keep.txt'), 'preserve');
      writeFileSync(join(out, 'alpha.mp3'), 'stale-mp3-bytes');
      const result = run({
        root,
        env: { EARSHOT_BIN: earshotFake(root), FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root) },
      });
      check(
        'P5.oggDir.staleMp3Kept',
        result.status === 1 &&
          result.stderr ===
            `sound-set: cannot prepare output for alpha (tap/soft): ${join(out, 'alpha.ogg')}\n` &&
          readCalls(root, 'earshot-calls.jsonl').length === 0 &&
          readText(join(out, 'alpha.mp3')) === 'stale-mp3-bytes' &&
          readText(join(out, 'alpha.ogg', 'keep.txt')) === 'preserve',
        `status=${result.status}`,
      );
    }
    {
      const root = mkroot('p5-both-dirs');
      writeSet(root, 'fake', prepSet);
      const out = join(root, 'sounds', 'fake');
      mkdirSync(join(out, 'alpha.ogg'), { recursive: true });
      mkdirSync(join(out, 'alpha.mp3'), { recursive: true });
      writeFileSync(join(out, 'alpha.ogg', 'a.txt'), 'a');
      writeFileSync(join(out, 'alpha.mp3', 'b.txt'), 'b');
      const result = run({
        root,
        env: { EARSHOT_BIN: earshotFake(root), FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root) },
      });
      check(
        'P5.bothDirs',
        result.status === 1 &&
          result.stderr ===
            `sound-set: cannot prepare output for alpha (tap/soft): ${join(out, 'alpha.ogg')}\n` &&
          readCalls(root, 'earshot-calls.jsonl').length === 0 &&
          readText(join(out, 'alpha.ogg', 'a.txt')) === 'a' &&
          readText(join(out, 'alpha.mp3', 'b.txt')) === 'b',
        `status=${result.status}`,
      );
    }
    {
      // A later entry is blocked: the earlier entry is complete, the later stale file stays, no third entry runs.
      const root = mkroot('p5-later-entry-blocked');
      writeSet(root, 'fake', { sounds: [...prepSet.sounds, { name: 'gamma', design: 'pop/bubble' }] });
      const out = join(root, 'sounds', 'fake');
      mkdirSync(join(out, 'beta.mp3'), { recursive: true });
      writeFileSync(join(out, 'beta.ogg'), 'stale-beta-ogg');
      const result = run({
        root,
        env: { EARSHOT_BIN: earshotFake(root), FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root) },
      });
      check(
        'P5.laterEntryBlocked',
        result.status === 1 &&
          result.stderr ===
            `sound-set: cannot prepare output for beta (error/knock): ${join(out, 'beta.mp3')}\n` &&
          readCalls(root, 'earshot-calls.jsonl').length === 1 &&
          readText(join(out, 'beta.ogg')) === 'stale-beta-ogg' &&
          existsSync(join(out, 'alpha.mp3')) &&
          !existsSync(join(out, 'gamma.ogg')),
        `status=${result.status} earshotCalls=${readCalls(root, 'earshot-calls.jsonl').length}`,
      );
    }
    if (process.getuid?.() !== 0) {
      // An unwritable folder with stale files: the run stops with the exact line and keeps both files.
      const root = mkroot('p5-unwritable-folder');
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const out = join(root, 'sounds', 'fake');
      mkdirSync(out);
      writeFileSync(join(out, 'alpha.ogg'), 'stale-ogg');
      writeFileSync(join(out, 'alpha.mp3'), 'stale-mp3');
      chmodSync(out, 0o555);
      try {
        const result = run({
          root,
          env: { EARSHOT_BIN: earshotFake(root), FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root) },
        });
        check(
          'P5.unwritableFolder',
          result.status === 1 &&
            result.stderr ===
              `sound-set: cannot prepare output for alpha (tap/soft): ${join(out, 'alpha.ogg')}\n` &&
            readText(join(out, 'alpha.ogg')) === 'stale-ogg' &&
            readText(join(out, 'alpha.mp3')) === 'stale-mp3' &&
            readCalls(root, 'earshot-calls.jsonl').length === 0,
          `status=${result.status}`,
        );
      } finally {
        chmodSync(out, 0o755);
      }
    }
    {
      // The set folder is a regular file: the wrapper stops with the exact line and keeps the file.
      const root = mkroot('p5-outdir-is-file');
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const out = join(root, 'sounds', 'fake');
      writeFileSync(out, 'not-a-folder');
      const result = run({
        root,
        env: {
          EARSHOT_BIN: earshotFake(root),
          FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root),
        },
      });
      check(
        'P5.outDirIsFile',
        result.status === 1 &&
          result.stderr ===
            `sound-set: cannot prepare output for alpha (tap/soft): ${join(out, 'alpha.ogg')}\n` &&
          readText(out) === 'not-a-folder' &&
          readCalls(root, 'earshot-calls.jsonl').length === 0,
        `status=${result.status} stderr=${json(result.stderr.replaceAll(root, '<root>'))}`,
      );
    }
    {
      // The set folder is a symlink to a folder elsewhere. The wrapper writes through the link, as before this phase.
      const root = mkroot('p5-outdir-symlink');
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const elsewhere = join(root, 'elsewhere');
      mkdirSync(elsewhere);
      writeFileSync(join(elsewhere, 'alpha.ogg'), 'old-ogg');
      writeFileSync(join(elsewhere, 'alpha.mp3'), 'old-mp3');
      writeFileSync(join(elsewhere, 'other.txt'), 'keep');
      symlinkSync(elsewhere, join(root, 'sounds', 'fake'));
      const result = run({
        root,
        env: {
          EARSHOT_BIN: earshotFake(root),
          FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-ok.mjs'), root),
        },
      });
      info(
        'P5.outDirSymlink',
        `status=${result.status} destination files=${json(readdirSync(elsewhere).sort())} alpha.ogg=${json(readText(join(elsewhere, 'alpha.ogg')))} other.txt kept=${readText(join(elsewhere, 'other.txt')) === 'keep'}`,
      );
    }
    {
      const root = mkroot('p5-failed-ffmpeg-leaves');
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const out = join(root, 'sounds', 'fake');
      mkdirSync(out);
      writeFileSync(join(out, 'alpha.mp3'), 'old-committed-mp3');
      writeFileSync(join(out, 'alpha.ogg'), 'old-committed-ogg');
      const result = run({
        root,
        env: {
          EARSHOT_BIN: earshotFake(root),
          FFMPEG_BIN: ffmpegFake(join(root, 'ffmpeg-fail.mjs'), root, { exit: 3 }),
        },
      });
      info(
        'P5.failedFfmpeg.state',
        `status=${result.status} stderr=${json(result.stderr.replaceAll(root, '<root>'))} files=${json(listDir(out))} (old mp3 ${existsSync(join(out, 'alpha.mp3')) ? 'kept' : 'removed'})`,
      );
    }
  }

  // ---- P6 error output carries no environment content ----
  {
    const scenarios = [
      [
        'ffmpeg-missing',
        (root) => ({ EARSHOT_BIN: earshotFake(root, { canary: true }), FFMPEG_BIN: join(root, 'absent') }),
      ],
      [
        'ffmpeg-exit3-canary',
        (root) => ({
          EARSHOT_BIN: earshotFake(root),
          FFMPEG_BIN: ffmpegFake(join(root, 'f.mjs'), root, { exit: 3, canary: true }),
        }),
      ],
      [
        'ffmpeg-exit0-canary',
        (root) => ({
          EARSHOT_BIN: earshotFake(root),
          FFMPEG_BIN: ffmpegFake(join(root, 'f.mjs'), root, { canary: true }),
        }),
      ],
      [
        'ffmpeg-no-write-canary',
        (root) => ({
          EARSHOT_BIN: earshotFake(root),
          FFMPEG_BIN: ffmpegFake(join(root, 'f.mjs'), root, { write: false, canary: true }),
        }),
      ],
      [
        'earshot-exit4-canary',
        (root) => ({
          EARSHOT_BIN: earshotFake(root, { exit: 4, canary: true }),
          FFMPEG_BIN: ffmpegFake(join(root, 'f.mjs'), root),
        }),
      ],
      [
        'ffmpeg-is-directory',
        (root) => {
          mkdirSync(join(root, 'adir'));
          return { EARSHOT_BIN: earshotFake(root), FFMPEG_BIN: join(root, 'adir') };
        },
      ],
      [
        'ffmpeg-bare-not-on-path',
        (root) => ({
          EARSHOT_BIN: earshotFake(root),
          FFMPEG_BIN: 'nope-ffmpeg',
          PATH: join(root, 'emptybin'),
        }),
      ],
    ];
    for (const [label, envFor] of scenarios) {
      const root = mkroot(`p6-${label}`);
      mkdirSync(join(root, 'emptybin'));
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const result = run({ root, env: envFor(root) });
      const text = result.stdout + result.stderr;
      check(
        `P6.noEnvInOutput.${label}`,
        !text.includes(CANARY) && secretEnvLeak(text).length === 0,
        `status=${result.status} stderr=${json(result.stderr.replaceAll(root, '<root>'))} leakedKeys=${json(secretEnvLeak(text))}`,
      );
    }
    {
      // The two ffmpeg failure lines after the lookup: an exit code, and an exit 0 without a file.
      const root = mkroot('p6-ffmpeg-failed-line');
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const result = run({
        root,
        env: {
          EARSHOT_BIN: earshotFake(root),
          FFMPEG_BIN: ffmpegFake(join(root, 'f3.mjs'), root, { exit: 3 }),
        },
      });
      check(
        'P6.ffmpegFailedLine',
        result.status === 1 &&
          result.stderr === 'sound-set: ffmpeg failed for alpha (tap/soft) with exit 3\n',
        `status=${result.status} stderr=${json(result.stderr.replaceAll(root, '<root>'))}`,
      );
    }
    {
      const root = mkroot('p6-ffmpeg-no-file-line');
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const result = run({
        root,
        env: {
          EARSHOT_BIN: earshotFake(root),
          FFMPEG_BIN: ffmpegFake(join(root, 'f0.mjs'), root, { write: false }),
        },
      });
      const mp3 = join(root, 'sounds', 'fake', 'alpha.mp3');
      check(
        'P6.ffmpegWroteNoFileLine',
        result.status === 1 &&
          result.stderr === `sound-set: ffmpeg wrote no file for alpha (tap/soft): ${mp3}\n` &&
          !existsSync(mp3),
        `status=${result.status} stderr=${json(result.stderr.replaceAll(root, '<root>'))}`,
      );
    }
    {
      const root = mkroot('p6-earshot-success-echo');
      writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
      const result = run({
        root,
        env: {
          EARSHOT_BIN: earshotFake(root, { canary: true }),
          FFMPEG_BIN: ffmpegFake(join(root, 'f.mjs'), root, { canary: true }),
        },
      });
      info(
        'P6.successEcho',
        `earshot child output echoed (existing behavior): ${result.stdout.includes(`E-OUT ${CANARY}`)}; ffmpeg child output echoed: ${(result.stdout + result.stderr).includes('F-OUT') || (result.stdout + result.stderr).includes('F-ERR')}`,
      );
    }
  }

  // ---- P7 metadata of the source Ogg does not reach the MP3 (with controls without the flags) ----
  {
    const root = mkroot('p7-tagged');
    const tagged = join(root, 'tagged.ogg');
    const make = spawnSync(
      'ffmpeg',
      [
        '-nostdin',
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-f',
        'lavfi',
        '-i',
        'sine=frequency=440:duration=0.2',
        '-c:a',
        'libvorbis',
        '-metadata',
        'artist=Jane Roe Personal',
        '-metadata',
        'comment=/home/jane/secret-note',
        '-metadata',
        'title=Private Title',
        tagged,
      ],
      { encoding: 'utf8' },
    );
    const inTags = spawnSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'stream_tags:format_tags', '-of', 'default=nw=1', tagged],
      { encoding: 'utf8' },
    ).stdout;
    check(
      'P7.inputCarriesTags',
      make.status === 0 && /Jane Roe Personal/.test(inTags) && /secret-note/.test(inTags),
      `ffmpeg status=${make.status}; input tag lines=${inTags.trim().split('\n').length}`,
    );
    writeSet(root, 'fake', { sounds: [{ name: 'alpha', design: 'tap/soft' }] });
    const result = run({
      root,
      env: { EARSHOT_BIN: earshotCopy(root, { source: tagged }) },
      drop: ['FFMPEG_BIN'],
    });
    const mp3 = readBytes(join(root, 'sounds', 'fake', 'alpha.mp3'));
    const text = mp3.toString('latin1');
    const outTags = spawnSync(
      'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'stream_tags:format_tags',
        '-of',
        'default=nw=1',
        join(root, 'sounds', 'fake', 'alpha.mp3'),
      ],
      { encoding: 'utf8' },
    ).stdout.trim();
    check(
      'P7.wrapperStripsTags',
      result.status === 0 && !/Jane|secret-note|Private Title|ID3|Lavf/.test(text) && outTags === '',
      `status=${result.status} out tag text=${json(outTags)} bytes=${mp3.length}`,
    );
    const encode = (extra, name) => {
      const target = join(root, name);
      spawnSync(
        'ffmpeg',
        [
          '-nostdin',
          '-hide_banner',
          '-loglevel',
          'error',
          '-y',
          '-i',
          tagged,
          ...extra,
          '-c:a',
          'libmp3lame',
          '-b:a',
          '96k',
          '-ar',
          '48000',
          '-ac',
          '2',
          target,
        ],
        { encoding: 'utf8' },
      );
      return existsSync(target) ? readFileSync(target).toString('latin1') : '';
    };
    const defaultText = encode([], 'control-default.mp3');
    check(
      'P7.control.defaultFlagsAddEncoderTag',
      defaultText.startsWith('ID3') && /Lavf/.test(defaultText) && !/Jane/.test(defaultText),
      'the same encode without the AC2 flags starts with an ID3 tag that names Lavf, and the Ogg comments stay out',
    );
    const mappedText = encode(['-map_metadata:g', '0:s:0'], 'control-mapped.mp3');
    check(
      'P7.control.explicitMapCarriesComments',
      /Jane Roe Personal/.test(mappedText) && /secret-note/.test(mappedText),
      'an explicit stream-to-global map carries the artist and comment text into the MP3',
    );
  }

  // ---- P8 the real ffmpeg on bad Ogg input (default PATH lookup) ----
  {
    const cases = [
      ['garbage-4-bytes', (root) => earshotFake(root, { bytes: 'OggS' })],
      ['zero-bytes', (root) => earshotFake(root, { bytes: '' })],
      ['truncated-half-of-tap', (root) => earshotCopy(root, { truncate: 0.5 })],
      ['truncated-90pct-of-tap', (root) => earshotCopy(root, { truncate: 0.9 })],
    ];
    for (const [label, makeEarshot] of cases) {
      const root = mkroot(`p8-${label}`);
      const chibi = JSON.parse(readFileSync(join(REPO, 'sounds', 'sets', 'chibi.json'), 'utf8'));
      writeSet(root, 'fake', { sounds: [{ name: 'tap', design: chibi.sounds[0].design }] });
      const result = run({ root, env: { EARSHOT_BIN: makeEarshot(root) }, drop: ['FFMPEG_BIN'] });
      const mp3 = join(root, 'sounds', 'fake', 'tap.mp3');
      check(
        `P8.${label}`,
        result.status === 1 &&
          /^sound-set: ffmpeg failed for tap \(tap\/soft\) with exit \d+\n$/.test(result.stderr) &&
          !existsSync(mp3),
        `status=${result.status} stderr=${json(result.stderr.replaceAll(root, '<root>'))} mp3=${existsSync(mp3) ? `${statSync(mp3).size} bytes` : 'absent'}`,
      );
    }
  }

  // ---- P0 end: the repository is unchanged ----
  const hashesAfter = repoHashes();
  check(
    'P0.sounds.unchanged',
    json(hashesBefore) === json(hashesAfter),
    `${Object.keys(hashesAfter).length} files hashed`,
  );
  check('P0.gitStatus.unchanged', gitStatus() === statusBefore, `status text ${json(gitStatus())}`);
  check(
    'P0.checkCount',
    passed + failed + 1 >= EXPECTED_CHECKS,
    `${passed + failed + 1} checks ran, at least ${EXPECTED_CHECKS} expected`,
  );
} catch (error) {
  failed += 1;
  console.log(
    `FAIL CRASH :: ${String(error?.stack ?? error)
      .split('\n')
      .slice(0, 3)
      .join(' | ')}`,
  );
} finally {
  if (BASE.startsWith(TEMP_PREFIX)) rmSync(BASE, { recursive: true, force: true });
  console.log(`SUMMARY pass=${passed} fail=${failed} tempRemoved=${!existsSync(BASE)}`);
}
