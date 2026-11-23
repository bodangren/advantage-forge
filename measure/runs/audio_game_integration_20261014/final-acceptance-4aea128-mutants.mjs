// Final acceptance probe (4aea128): a mutation check of the AudioBus (bus.ts) and the Chibi
// wiring helper (chibi.ts) against the committed audio tests. Run it from the repository root
// through the heavy runner:
//   node measure/runs/audio_game_integration_20261014/final-acceptance-4aea128-mutants.mjs
// It reads src/ and tests/ and writes only inside the temporary folder
// measure/runs/audio_game_integration_20261014/final-acceptance-4aea128-mutant/, which it
// removes at the end. A mutant is KILLED when the run fails on a named test, SURVIVED when the
// run passes, and INVALID when the mutant does not compile (never counted as killed).
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TMP = join(ROOT, 'measure', 'runs', 'audio_game_integration_20261014', 'final-acceptance-4aea128-mutant');
const BUS_REAL = join(ROOT, 'src', 'apk3d', 'audio', 'bus.ts');
const CHIBI_REAL = join(ROOT, 'src', 'apk3d', 'audio', 'chibi.ts');
const BUS_OUT = join(TMP, 'bus.ts');
const CHIBI_OUT = join(TMP, 'chibi.ts');
const CONFIG = join(TMP, 'vitest.config.mjs');

const TESTS = [
  'tests/apk3d/audio-files.test.ts',
  'tests/apk3d/audio-files.adversarial.test.ts',
  'tests/apk3d/audio-files.adversarial-r2.test.ts',
  'tests/apk3d/audio-files.adversarial-r3.test.ts',
  'tests/apk3d/audio-wiring.test.ts',
  'tests/apk3d/audio-wiring.adversarial.test.ts',
];

const busSource = readFileSync(BUS_REAL, 'utf8');
const chibiSource = readFileSync(CHIBI_REAL, 'utf8');

function apply(source, find, replace, nth = 1) {
  let index = -1;
  for (let i = 0; i < nth; i++) {
    index = source.indexOf(find, index + 1);
    if (index < 0) throw new Error(`mutant anchor not found (occurrence ${nth}): ${find.slice(0, 60)}`);
  }
  return source.slice(0, index) + replace + source.slice(index + find.length);
}

// The chibi copy lives in the temp folder, so its imports point at the real files.
const chibiForTemp = (source) =>
  source
    .replace("from './bus.js'", `from '${BUS_REAL}'`)
    .replace("from './chibi-events.gen.js'", `from '${join(ROOT, 'src', 'apk3d', 'audio', 'chibi-events.gen.ts')}'`);

const bus = (id, why, find, replace, nth = 1) => ({ id, why, target: 'bus', find, replace, nth });
const chibi = (id, why, find, replace, nth = 1) => ({ id, why, target: 'chibi', find, replace, nth });

const MUTANTS = [
  bus('B01', 'URL drops the dot before the extension', 'const url = `${this.files.base}${entry}.${this.format}`;', 'const url = `${this.files.base}${entry}${this.format}`;'),
  bus('B02', 'format order swapped (mp3 before ogg)', "this.format = ogg ? 'ogg' : mp3 ? 'mp3' : null;", "this.format = mp3 ? 'mp3' : ogg ? 'ogg' : null;"),
  bus('B03', 'a failed fetch is not marked', 'this.failed.add(name);', 'void 0;', 1),
  bus('B04', 'a failed decode is not marked', 'this.failed.add(name);', 'void 0;', 2),
  bus('B05', 'a non-OK status is accepted', 'if (!response.ok) throw new Error(`audio fetch status ${response.status}`);', ''),
  bus('B06', 'a decoded event also runs the synth recipe', 'this.startBuffer(buffer);\n      return;', 'this.startBuffer(buffer);'),
  bus('B07', 'inherited names are fetched (no own-key guard in requestFile)', '    if (!hasOwn(this.files.events, name)) return;\n', ''),
  bus('B08', 'dispose does not stop playing buffers', 'src.stop();', 'void src;'),
  bus('B09', 'file sources bypass the master gain (mute would not silence files)', 'src.connect(this.master);', 'src.connect(ctx.destination);'),
  bus('B10', 'a stale completion installs its buffer (isCurrent bypassed)', 'if (this.isCurrent(name, url)) {\n        this.buffers.set(name, buffer);', 'if (true) {\n        this.buffers.set(name, buffer);'),
  bus('B11', 'a map or base change keeps decoded buffers', 'this.buffers.clear();\n      this.pendingDecode.clear();\n      this.loading.clear();\n      return;', 'this.pendingDecode.clear();\n      this.loading.clear();\n      return;'),
  bus('B12', 'the format is asked again on every request', 'if (this.formatChecked) return;\n    this.formatChecked = true;', 'this.formatChecked = true;'),
  bus('B13', 'preload also plays the synth recipe', 'for (const name of events) this.requestFile(name);', 'for (const name of events) {\n      this.requestFile(name);\n      this.sfx.get(name)?.(this.synth(this.master));\n    }'),
  bus('B14', 'dispose does not close the context', 'void this.ctx?.close();\n    this.ctx = null;', 'this.ctx = null;'),
  bus('B15', 'the unlock pulse never starts', 'silence.start(0);', 'void silence;'),
  bus('B16', 'an equal map rewired twice refetches (no equal-event skip)', 'if (wasOwn === isOwn && previous.events[name] === files.events[name]) continue;', ''),
  bus('B17', 'three plays of one event start three fetches (loading marker missing)', 'this.loading.add(name);\n    void this.fetchFile(name, url);', 'void this.fetchFile(name, url);'),
  bus('B18', 'two empty canPlayType answers still fetch (format null not checked)', 'if (!this.files || !this.format) return;\n    if (!hasOwn(this.files.events, name)) return;', 'if (!this.files) return;\n    if (!hasOwn(this.files.events, name)) return;'),
  bus('B19', 'a failed event is retried on every play', 'if (this.buffers.has(name) || this.loading.has(name) || this.failed.has(name)) return;', 'if (this.buffers.has(name) || this.loading.has(name)) return;'),
  bus('B20', 'play of a decoded event starts the buffer twice', 'this.startBuffer(buffer);\n      return;', 'this.startBuffer(buffer);\n      this.startBuffer(buffer);\n      return;'),
  bus('B21', 'unlock decodes no pre-unlock bytes', 'void this.decodeData(name, data, url);', 'void 0;'),
  chibi('C01', 'the sound folder loses its trailing slash', 'base: `${soundBase}audio/chibi/`', 'base: `${soundBase}audio/chibi`'),
  chibi('C02', 'the preload list keeps duplicates', 'if (seen.has(event)) continue;', ''),
  chibi('C03', 'the preload list keeps unmapped names', 'if (!hasOwn(CHIBI_EVENTS, event)) continue;', ''),
  chibi('C04', 'a host with no sound base still wires', 'if (!soundBase) return false;', ''),
  chibi('C05', 'the helper preloads the raw game events', 'audio.preload(chibiPreload(gameEvents));', 'audio.preload(gameEvents.slice());'),
  chibi('C06', 'the helper never sets the file map', 'audio.useSoundFiles(chibiSoundFiles(soundBase));', ''),
];

function writeConfig() {
  const lines = [
    "import { defineConfig } from 'vitest/config';",
    'export default defineConfig({',
    `  root: ${JSON.stringify(ROOT)},`,
    '  resolve: {',
    '    alias: [',
    `      { find: /^(\\.\\.\\/)+src\\/apk3d\\/audio\\/bus\\.js$/, replacement: ${JSON.stringify(BUS_OUT)} },`,
    `      { find: /^(\\.\\.\\/)+src\\/apk3d\\/audio\\/chibi\\.js$/, replacement: ${JSON.stringify(CHIBI_OUT)} },`,
    '    ],',
    '  },',
    `  test: { include: ${JSON.stringify(TESTS)}, environment: 'node', maxWorkers: 1 },`,
    '});',
    '',
  ];
  writeFileSync(CONFIG, lines.join('\n'));
}

function run() {
  const r = spawnSync(
    process.execPath,
    [join(ROOT, 'node_modules', 'vitest', 'vitest.mjs'), 'run', '--config', CONFIG, '--maxWorkers=1'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  const text = `${r.stdout}\n${r.stderr}`;
  const testsLine = /^\s*Tests\s+(.*)$/m.exec(text);
  const failedNames = [...text.matchAll(/^\s*(?:FAIL|×)\s+(.+)$/gm)].map((m) => m[1].trim()).slice(0, 3);
  const invalid = /Transform failed|SyntaxError|Failed to resolve|Cannot find module|ERROR: Expected/.test(text);
  return { status: r.status, summary: testsLine ? testsLine[1].trim() : '(no Tests line)', failedNames, invalid };
}

mkdirSync(TMP, { recursive: true });
try {
  writeConfig();
  writeFileSync(BUS_OUT, busSource);
  writeFileSync(CHIBI_OUT, chibiForTemp(chibiSource));
  const base = run();
  console.log(`BASELINE (unmutated copies through the alias): exit ${base.status}; ${base.summary}`);
  if (base.status !== 0 || base.invalid) throw new Error('baseline is not green: the harness is invalid');

  const rows = [];
  for (const m of MUTANTS) {
    const sourceText = m.target === 'bus' ? busSource : chibiSource;
    const mutated = apply(sourceText, m.find, m.replace, m.nth);
    writeFileSync(BUS_OUT, m.target === 'bus' ? mutated : busSource);
    writeFileSync(CHIBI_OUT, chibiForTemp(m.target === 'chibi' ? mutated : chibiSource));
    const r = run();
    const verdict = r.invalid ? 'INVALID' : r.status === 0 ? 'SURVIVED' : 'KILLED';
    rows.push({ ...m, verdict, summary: r.summary, first: r.failedNames[0] ?? '' });
    console.log(`${m.id} ${verdict.padEnd(8)} ${m.why} | ${r.summary}${r.failedNames[0] ? ' | first: ' + r.failedNames[0].slice(0, 110) : ''}`);
  }
  const killed = rows.filter((r) => r.verdict === 'KILLED').length;
  const survived = rows.filter((r) => r.verdict === 'SURVIVED');
  const invalid = rows.filter((r) => r.verdict === 'INVALID');
  console.log(`TOTAL mutants ${rows.length}: killed ${killed}, survived ${survived.length}, invalid ${invalid.length}`);
  if (survived.length) console.log(`SURVIVORS: ${survived.map((r) => r.id).join(', ')}`);
  if (invalid.length) console.log(`INVALID: ${invalid.map((r) => r.id).join(', ')}`);
} finally {
  rmSync(TMP, { recursive: true, force: true });
}
