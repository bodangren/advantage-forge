// Checker probe for the unit 2 guard. It makes no network call.
// runGuards is a pure function; the CLI cases run with a fake HOME so readKey cannot find a key.
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import * as G from '../../../scripts/storytime-muse-guards.mjs';

const ROOT = resolve(new URL('../../..', import.meta.url).pathname);
const U1 = resolve(ROOT, 'out/storytime/l2/unit1');
const U2 = resolve(ROOT, 'out/storytime/l2/unit2');
const MSG = 'refused: the unit 2 cap is empty; the PM writes the approved limit in U2_RUN.capUsd';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`);
};
const ctx = (id, outDir) => ({ spec: { id, outDir }, dir: resolve(ROOT, outDir) });

check('U2_RUN.capUsd is null', G.U2_RUN.capUsd === null, String(G.U2_RUN.capUsd));
check('U2_CAP_MESSAGE exact', G.U2_CAP_MESSAGE === MSG);

const week = (w, el) => `out/storytime/l2/unit2/${w}/muse${el ? '/elements' : ''}`;
const u2Ctxs = {
  one_color: [ctx('l2-w09-check-row-cat', week('w09'))],
  one_line: [ctx('l2-w09-check-row-cat', week('w09'))],
  weeks_mixed: [ctx('a', week('w09')), ctx('b', week('w12')), ctx('c', week('w16'))],
  element: [ctx('set-classroom-lunch-table', week('w09', true))],
  week_and_element: [ctx('a', week('w10')), ctx('b', week('w10', true))],
};
for (const cmd of ['color', 'line']) {
  for (const [name, c] of Object.entries(u2Ctxs)) {
    for (const opts of [{}, { from: '2' }, { tries: '3' }, { from: '1', tries: '2' }, { concurrency: '4' }, { u2CapUsd: '99' }, { u2CapUsd: 99 }.constructor === Object ? { u2CapUsd: undefined } : {}, { u2CapUsd: null }, { u2CapUsd: 0 }, { u2CapUsd: -1 }, { u2CapUsd: 'abc' }, { u2CapUsd: NaN }]) {
      // The first listed: string cap forms that a CLI could produce are all strings or undefined.
      const r = G.runGuards(U2, c, cmd, opts);
      check(`u2 ${cmd} ${name} opts=${JSON.stringify(opts)}`, r.refused && r.code === 3 && r.message === MSG && r.run === 'u2', `${r.code} ${r.run} ${r.message.slice(0, 40)}`);
    }
  }
}
// Unit root passed by a caller: the u2 guard must hold also with the unit 1 root.
{
  const r = G.runGuards(U1, u2Ctxs.one_color, 'color', {});
  check('u2 spec with unit1 root still refused', r.refused && r.message === MSG, r.message);
}
// A finite positive number lets the u2 pass the cap check (test-only path). Confirms the path is test-only.
{
  const r = G.runGuards(U2, u2Ctxs.one_color, 'color', { u2CapUsd: 5 });
  check('test-only numeric cap passes the cap check (expected: only a JS caller can do this)', r.refused === false, r.message);
}
// Mixed.
{
  const mixed = [ctx('a', week('w09')), ctx('b', 'out/storytime/l2/unit1/w01/muse')];
  const r = G.runGuards(U1, mixed, 'color', {});
  check('mixed u2 + unit1 refused', r.refused && r.code === 3 && r.run === 'mixed', r.message);
  const mixed2 = [ctx('b', 'out/storytime/l2/unit1/w01/muse'), ctx('a', week('w09'))];
  const r2 = G.runGuards(U1, mixed2, 'color', {});
  check('mixed unit1 + u2 refused', r2.refused && r2.code === 3 && r2.run === 'mixed', r2.message);
  const mixed3 = [ctx('a', week('w09')), ctx('c', G.CARD_RUN.outDir)];
  const r3 = G.runGuards(U1, mixed3, 'color', {});
  check('mixed u2 + card refused', r3.refused && r3.code === 3 && r3.run === 'mixed', r3.message);
  const mixed4 = [ctx('a', week('w09')), ctx('c', 'out/storytime/l2/unit2/w09/muse/bad')];
  const r4 = G.runGuards(U2, mixed4, 'color', { u2CapUsd: 5 });
  check('u2 + invalid refused even with test cap', r4.refused && r4.code === 3, r4.message);
}
// classifyOutDir
const cls = (p) => G.classifyOutDir({ id: 'x', outDir: p }, U1).kind;
for (const w of G.U2_WEEKS) {
  check(`classify ${w} muse = u2`, cls(`out/storytime/l2/unit2/${w}/muse`) === 'u2');
  check(`classify ${w} muse/elements = u2`, cls(`out/storytime/l2/unit2/${w}/muse/elements`) === 'u2');
}
check('U2_WEEKS = w09..w16', G.U2_WEEKS.join() === 'w09,w10,w11,w12,w13,w14,w15,w16');
const bad = [
  'out/storytime/l2/unit2',
  'out/storytime/l2/unit2/w08/muse',
  'out/storytime/l2/unit2/w17/muse',
  'out/storytime/l2/unit2/w09',
  'out/storytime/l2/unit2/w09/muse/other',
  'out/storytime/l2/unit2/w09/muse/elements/x',
  'out/storytime/l2/unit2/w09/muses',
  'out/storytime/l2/unit2/W09/muse',
  'out/storytime/l2/unit2/w9/muse',
  'out/storytime/l2/unit2/w09/cards/muse',
  'out/storytime/l2/unit2/w09/muse/../../w10/muse2',
  'out/storytime/l2/unit2/w09/muse/../../../unit1/w01/muse/x',
  'out/storytime/l2/unit2/../unit3/w09/muse',
  'out/storytime/l2/unit2x/w09/muse',
  '/tmp/out/storytime/l2/unit2/w09/muse',
  '../out/storytime/l2/unit2/w09/muse',
  'out/storytime/l2/unit2/w09/muse/elements/',
];
for (const p of bad) {
  const k = cls(p);
  // A trailing slash resolves to the same folder, so u2 is correct there; report it, do not fail.
  const ok = p.endsWith('elements/') ? k === 'u2' : k === 'invalid' || (k === 'restart' && false);
  check(`classify ${JSON.stringify(p)} -> ${k}`, ok);
}
// ".." that resolves back to a valid u2 folder is fine
check('classify w09/x/../muse resolves to u2', cls('out/storytime/l2/unit2/w09/x/../muse') === 'u2');

// Unit 1 / card / line-retry classification and run labels unchanged.
check('classify unit1 w01 muse = restart', cls('out/storytime/l2/unit1/w01/muse') === 'restart');
check('classify card = card', cls(G.CARD_RUN.outDir) === 'card');
check('classify unit1 cards/muse/elements invalid', cls('out/storytime/l2/unit1/cards/muse/elements') === 'invalid');
{
  const r = G.runGuards(U1, [ctx('l2-w01-x', 'out/storytime/l2/unit1/w01/muse')], 'color', {});
  check('unit1 color run=restart not refused by u2 (spend scan only)', r.run === 'restart', `${r.run} refused=${r.refused} ${r.message}`);
  const c = G.runGuards(U1, [ctx('l2-card-x', G.CARD_RUN.outDir)], 'color', {});
  check('card call run=card', c.run === 'card', `${c.run} refused=${c.refused} ${c.message}`);
}
console.log(`ROWS ${results.length} FAIL ${results.filter((r) => !r.ok).length}`);

// CLI cases: fake HOME so readKey throws if the guard ever passed. The guard refusal comes first.
if (!process.argv.includes('--cli')) process.exit(0);
const fake = resolve(ROOT, 'measure/runs/asset_storytime_l2_unit2_tooling_20261108/fakehome');
mkdirSync(fake, { recursive: true });
const W = 'docs/storytime/l2-unit2';
const cli = (args) => {
  const env = { PATH: process.env.PATH, HOME: fake };
  const r = spawnSync('node', ['scripts/storytime-muse.mjs', ...args], { cwd: ROOT, env, encoding: 'utf8' });
  return { code: r.status, out: (r.stdout + r.stderr).trim() };
};
const cases = [
  ['color', `${W}/w09/muse/l2-w09-check-row-cat.json`],
  ['line', `${W}/w09/muse/l2-w09-check-row-cat.json`],
  ['line', `${W}/w09/muse/l2-w09-check-row-cat.json`, '--from', '1', '--tries', '3'],
  ['color', `${W}/w09/muse/l2-w09-check-row-cat.json`, `${W}/w12/muse/l2-w12-check-row-cat.json`, `${W}/w16/muse/l2-w16-check-row-guitar.json`],
  ['color', `${W}/w09/muse-elements/set-classroom-lunch-table.json`],
  ['color', `${W}/w09/muse/l2-w09-check-row-cat.json`, '--u2CapUsd', '99'],
  ['line', `${W}/w09/muse/l2-w09-check-row-cat.json`, '--u2CapUsd', '0.5', '--tries', '2'],
  ['color', `${W}/w09/muse/l2-w09-check-row-cat.json`, '--u2CapUsd'],
  ['color', '--u2CapUsd', '99', `${W}/w09/muse/l2-w09-check-row-cat.json`],
  ['color', `${W}/w09/muse/l2-w09-check-row-cat.json`, '--concurrency', '1'],
];
let cliFail = 0;
for (const a of cases) {
  const r = cli(a);
  const ok = r.code === 3 && r.out.split('\n')[0] === MSG;
  if (!ok) cliFail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} CLI ${a.join(' ')} -> exit ${r.code}: ${r.out.split('\n')[0]}`);
}
console.log(`CLI ${cases.length} FAIL ${cliFail}`);
