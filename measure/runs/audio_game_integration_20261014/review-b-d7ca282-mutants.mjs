// Review B r3 mutation run for scripts/sound-set.mjs at d7ca282ebd6e7602420096055266f527d2f9ff7f.
// Run: node measure/runs/audio_game_integration_20261014/review-b-d7ca282-mutants.mjs
// It supersedes review-b-a1b67c7-mutants.mjs and review-b-6804d08-mutants.mjs. The anchors of this file
// match the source text after the fix 2b29c067 (F5 and F6). Variants M2, M18, and M19 of r2 are retired:
// the fixes they proposed are in the source now, and M23 to M25 test those fixes by removing them.
// The five committed Phase 2 test files run in a temp tree (scripts, tests, and sounds copied from
// the repository, node_modules linked) against mutated copies of the wrapper. The repository stays unchanged.
// A second pass runs the r3 probe against the variants. A variant counts as seen by the probe only when
// a behavioral check fails. A failed P0 check is a static text check and does not count.
// M21 and M22 replay earlier wrappers (6804d082 and a1b67c77). M30 is a design variant, not a regression.
// Modes: no flag runs the tests and then the probe on the marked variants. `--tests-only` runs the tests
// only. `--probe-only` runs the probe only, on every variant. The probe is light and needs no heavy lock.
import { spawnSync } from 'node:child_process';
import {
  cpSync,
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

const TESTS_ONLY = process.argv.includes('--tests-only');
const PROBE_ONLY = process.argv.includes('--probe-only');
const REPO = '/home/daniebo/Desktop/advantage-forge';
const RUNS = join(REPO, 'measure', 'runs', 'audio_game_integration_20261014');
const PROBE = join(RUNS, 'review-b-d7ca282-probe.mjs');
const TEMP_PREFIX = join(tmpdir(), 'review-b-mut3-');
const BASE = mkdtempSync(TEMP_PREFIX);
const source = readFileSync(join(REPO, 'scripts', 'sound-set.mjs'), 'utf8');
const TESTS = [
  'sound-set.test.ts',
  'sound-set-mp3.test.ts',
  'sound-set.adversarial.test.ts',
  'sound-set-lookup.test.ts',
  'sound-set.adversarial-p2.test.ts',
];

const PRE_CHECK = [
  '  let blockedPath;',
  '  for (const target of targets) {',
  '    try {',
  '      if (lstatSync(target, { throwIfNoEntry: false })?.isDirectory()) blockedPath = target;',
  '    } catch {',
  '      blockedPath = target;',
  '    }',
  '    if (blockedPath) break;',
  '  }',
  '  if (blockedPath) fail(`sound-set: cannot prepare output for ${name} (${design}): ${blockedPath}`, 1);',
  '',
].join('\n');
const FFMPEG_GUARD =
  'if (ffmpeg === null) fail(`sound-set: ffmpeg not found at ${ffmpegInput}; install ffmpeg`, 1);';
const EARSHOT_GUARD = 'if (!isExecutableFile(earshot)) {';
const EARSHOT_LINE =
  "const earshot = resolve(process.env.EARSHOT_BIN ?? join(ROOT, '.venv-earshot', 'bin', 'earshot'));";
const EARSHOT_SPAWN = '  const child = spawnSync(earshot, [';
const ABSOLUTE_CHECK = '    if (!isAbsolute(dir)) continue;\n';
const dropFlag = (flag, value) => (s) => s.replace(`      '${flag}',\n      '${value}',\n`, '');
const replaceAllOrKeep = (text, pairs) => {
  let out = text;
  for (const [from, to] of pairs) {
    if (!out.includes(from)) return text;
    out = out.replace(from, to);
  }
  return out;
};
const gitShow = (rev) => () =>
  spawnSync('git', ['-C', REPO, 'show', `${rev}:scripts/sound-set.mjs`], { encoding: 'utf8' }).stdout;

// [label, mutate, runProbe]
const mutants = [
  ['M0-control-unmutated', (s) => s, false],
  [
    'M1-bare-name-checked-in-cwd',
    (s) =>
      s.replace(
        "  for (const dir of (process.env.PATH ?? '').split(':')) {",
        "  if (isExecutableFile(bin)) return bin;\n  for (const dir of (process.env.PATH ?? '').split(':')) {",
      ),
    true,
  ],
  [
    'M3-regular-file-check-removed',
    (s) => s.replace('    if (!statSync(path).isFile()) return false;\n', ''),
    true,
  ],
  [
    'M4-execute-bit-check-removed',
    (s) => s.replace('    accessSync(path, fsConstants.X_OK);\n    return true;', '    return true;'),
    true,
  ],
  [
    'M5-empty-ffmpeg-bin-not-unset',
    (s) => s.replace("process.env.FFMPEG_BIN || 'ffmpeg'", "process.env.FFMPEG_BIN ?? 'ffmpeg'"),
    true,
  ],
  ['M6-ffmpeg-guard-removed', (s) => s.replace(FFMPEG_GUARD, '// guard removed'), false],
  ['M7-targets-removed-without-pre-check', (s) => s.replace(PRE_CHECK, ''), true],
  [
    'M8-mp3-target-not-prepared',
    (s) => s.replace('const targets = [out, mp3];', 'const targets = [out];'),
    false,
  ],
  [
    'M9-no-post-check-for-the-mp3-file',
    (s) => s.replace('  if (!existsSync(mp3)) {', '  if (false) {'),
    false,
  ],
  [
    'M10-ffmpeg-spawn-uses-a-shell',
    (s) =>
      s.replace(
        "    { encoding: 'utf8' },\n  );\n  if (mp3Child.status",
        "    { encoding: 'utf8', shell: true },\n  );\n  if (mp3Child.status",
      ),
    true,
  ],
  [
    'M11-name-check-loosened',
    (s) => s.replace('const SAFE_NAME = /^[a-z0-9-]+$/;', 'const SAFE_NAME = /^[^\\/]+$/;'),
    true,
  ],
  ['M12-drop-map-metadata-minus-1', dropFlag('-map_metadata', '-1'), false],
  ['M13-drop-id3v2-version-0', dropFlag('-id3v2_version', '0'), false],
  ['M14-drop-write-id3v1-0', dropFlag('-write_id3v1', '0'), false],
  ['M15-drop-write-xing-0', dropFlag('-write_xing', '0'), false],
  ['M16-drop-fflags-bitexact', dropFlag('-fflags', '+bitexact'), false],
  ['M17-drop-flags-a-bitexact', dropFlag('-flags:a', '+bitexact'), false],
  [
    'M20-path-loop-dead',
    (s) =>
      s.replace("  for (const dir of (process.env.PATH ?? '').split(':')) {", '  for (const dir of []) {'),
    true,
  ],
  ['M21-pre-remediation-wrapper-6804d082', gitShow('6804d082'), true],
  ['M22-r2-wrapper-a1b67c77', gitShow('a1b67c77'), true],
  ['M23-absolute-check-removed', (s) => s.replace(ABSOLUTE_CHECK, ''), true],
  ['M24-relative-entries-honored', (s) => s.replace(ABSOLUTE_CHECK, "    if (dir === '') continue;\n"), true],
  [
    'M25-earshot-guard-access-only',
    (s) =>
      s.replace(
        EARSHOT_GUARD,
        'let earshotOk = true;\ntry {\n  accessSync(earshot, fsConstants.X_OK);\n} catch {\n  earshotOk = false;\n}\nif (!earshotOk) {',
      ),
    true,
  ],
  ['M26-earshot-guard-removed', (s) => s.replace(EARSHOT_GUARD, 'if (false) {'), true],
  [
    'M27-earshot-check-after-preparation',
    (s) =>
      replaceAllOrKeep(s, [
        [EARSHOT_GUARD, 'if (false) {'],
        [
          EARSHOT_SPAWN,
          `  if (!isExecutableFile(earshot)) {\n    fail(\`sound-set: earshot not found at \${earshot}; run scripts/sound-setup.sh\`, 1);\n  }\n${EARSHOT_SPAWN}`,
        ],
      ]),
    true,
  ],
  [
    'M28-ffmpeg-check-after-preparation',
    (s) =>
      replaceAllOrKeep(s, [
        [FFMPEG_GUARD, '// guard moved'],
        [
          EARSHOT_SPAWN,
          `  if (ffmpeg === null) fail(\`sound-set: ffmpeg not found at \${ffmpegInput}; install ffmpeg\`, 1);\n${EARSHOT_SPAWN}`,
        ],
      ]),
    true,
  ],
  [
    'M29-earshot-guard-ignores-execute-bit',
    (s) => s.replace(EARSHOT_GUARD, 'if (!statSync(earshot, { throwIfNoEntry: false })?.isFile()) {'),
    true,
  ],
  [
    'M30-design-variant-empty-earshot-bin-means-default',
    (s) => s.replace('process.env.EARSHOT_BIN ?? join(ROOT', 'process.env.EARSHOT_BIN || join(ROOT'),
    true,
  ],
  [
    'M31-earshot-path-not-resolved',
    (s) =>
      s.replace(
        EARSHOT_LINE,
        "const earshot = process.env.EARSHOT_BIN ?? join(ROOT, '.venv-earshot', 'bin', 'earshot');",
      ),
    true,
  ],
];

try {
  for (const [label, mutate, runProbe] of mutants) {
    const tmp = join(BASE, label);
    mkdirSync(join(tmp, 'scripts'), { recursive: true });
    if (!PROBE_ONLY) {
      mkdirSync(join(tmp, 'tests'));
      cpSync(join(REPO, 'sounds'), join(tmp, 'sounds'), { recursive: true });
      for (const t of TESTS) cpSync(join(REPO, 'tests', t), join(tmp, 'tests', t));
      symlinkSync(join(REPO, 'node_modules'), join(tmp, 'node_modules'));
    }
    const mutated = mutate(source);
    if (label !== 'M0-control-unmutated' && mutated === source) {
      console.log(`${label}: MUTATION DID NOT APPLY`);
      continue;
    }
    writeFileSync(join(tmp, 'scripts', 'sound-set.mjs'), mutated);
    if (PROBE_ONLY) console.log(`${label}: probe only`);
    else {
      const r = spawnSync(
        process.execPath,
        [join(REPO, 'node_modules', 'vitest', 'vitest.mjs'), 'run', '--maxWorkers=1'],
        {
          cwd: tmp,
          encoding: 'utf8',
          timeout: 240000,
          env: { ...process.env, CI: '1', NO_COLOR: '1', FORCE_COLOR: '0' },
        },
      );
      const text = `${r.stdout}${r.stderr}`.replace(/\u001b\[[0-9;]*m/g, '');
      const files = /Test Files\s+(.*)/.exec(text)?.[1] ?? 'n/a';
      const tests = /\n\s*Tests\s+(.*)/.exec(text)?.[1] ?? 'n/a';
      console.log(`${label}: exit=${r.status} files=[${files}] tests=[${tests}]`);
      const names = [...text.matchAll(/^\s*(?:FAIL|×)\s+(.*)$/gm)].map((m) => m[1].trim());
      for (const name of [...new Set(names)].slice(0, 6)) console.log(`   failing: ${name}`);
    }
    if (!TESTS_ONLY && (runProbe || PROBE_ONLY)) {
      const probe = spawnSync(process.execPath, [PROBE], {
        encoding: 'utf8',
        timeout: 240000,
        env: { ...process.env, PROBE_SCRIPT: join(tmp, 'scripts', 'sound-set.mjs') },
      });
      const lines = probe.stdout.split('\n');
      const failLines = lines.filter((line) => line.startsWith('FAIL '));
      const behavioral = failLines.filter((line) => !line.startsWith('FAIL P0.'));
      const summary = lines.find((line) => line.startsWith('SUMMARY')) ?? 'SUMMARY n/a';
      console.log(
        `   probe-on-${label}: behavioral-fail=${behavioral.length} static-fail=${failLines.length - behavioral.length} ${summary}`,
      );
      for (const line of behavioral.slice(0, 6)) console.log(`   probe-on-${label} ${line.slice(0, 160)}`);
    }
  }
} finally {
  if (BASE.startsWith(TEMP_PREFIX)) rmSync(BASE, { recursive: true, force: true });
  console.log(`DONE tempRemoved=${!existsSync(BASE)}`);
}
