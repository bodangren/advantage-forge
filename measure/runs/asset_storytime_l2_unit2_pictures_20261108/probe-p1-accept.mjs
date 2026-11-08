// Checker probe, Phase 1 (unpaid). Makes no provider call. Uses temp unit roots under /tmp/opencode.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = process.cwd();
const g = await import(pathToFileURL(path.join(REPO, 'scripts/storytime-muse-guards.mjs')).href);
const out = [];
const rec = (name, ok, detail = '') => {
  out.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`);
};

const U2 = 'out/storytime/l2/unit2';
const FW = `${U2}/family-words/muse`;
const HEADER = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote';
const row = (id, cost, time, kind = 'color') => `${time}\t${id}\tm1\t${kind}\tin\t${id}.png\t1500x1500\t${cost}\tok`;
mkdirSync('/tmp/opencode', { recursive: true });
const temp = () => mkdtempSync('/tmp/opencode/u2probe-');
const put = (root, rel, rows) => {
  const f = path.join(root, rel);
  mkdirSync(path.dirname(f), { recursive: true });
  writeFileSync(f, `${HEADER}\n${rows.join('\n')}\n`);
};
const book = (week = 'w09', sub = 'muse', id = 'l2-w09-story-page-i-like-rice-yum') => ({ spec: { id, outDir: `${U2}/${week}/${sub}` } });
const app = (id = 'l2-w10-family-hat') => ({ spec: { id, outDir: FW } });
const B0 = g.U2_RUN.startTime;
const F0 = g.U2_FW_RUN.startTime;
const AFTER_B = '2026-11-08T06:00:00Z';
const AFTER_F = '2026-11-08T14:00:00Z';
const BEFORE_B = '2026-11-08T05:20:59Z';
const BEFORE_F = '2026-11-08T13:38:59Z';

// constants
rec('U2_RUN values', g.U2_RUN.capUsd === 18.33 && g.U2_RUN.reportAtUsd === 14.66 && g.U2_RUN.startTime === '2026-11-08T05:21:00Z' && g.U2_RUN.marginUsd === 0.01 && g.U2_RUN.maxTries === 3, JSON.stringify(g.U2_RUN));
rec('U2_FW_RUN values', g.U2_FW_RUN.capUsd === 0.29 && g.U2_FW_RUN.reportAtUsd === 0.23 && g.U2_FW_RUN.startTime === '2026-11-08T13:39:00Z' && g.U2_FW_RUN.outDir === FW, JSON.stringify(g.U2_FW_RUN));

// 1. book 18.32 refuses, low passes
{
  const r = temp();
  put(r, 'w09/muse/costs.tsv', [row('x1', 18.32, AFTER_B)]);
  const d = g.runGuards(r, [book()], 'color', {});
  rec('book 18.32 refuses next u2 call', d.refused === true && d.code === 3 && d.run === 'u2', JSON.stringify(d));
}
{
  const r = temp();
  put(r, 'w09/muse/costs.tsv', [row('x1', 5, AFTER_B)]);
  const d = g.runGuards(r, [book()], 'color', {});
  rec('book 5.00 passes u2 call', d.refused === false && d.run === 'u2', JSON.stringify(d));
}
{
  const r = temp();
  const d = g.runGuards(r, [book()], 'color', {});
  rec('book 0 spend passes u2 call (no fixture file)', d.refused === false, JSON.stringify(d));
}
{
  // elements folder counts
  const r = temp();
  put(r, 'w12/muse/elements/costs.tsv', [row('e1', 18.32, AFTER_B)]);
  const d = g.runGuards(r, [book('w12', 'muse/elements', 'set-x')], 'color', {});
  rec('book elements spend 18.32 refuses', d.refused === true, JSON.stringify(d));
}
// margin edges
{
  const r = temp();
  put(r, 'w09/muse/costs.tsv', [row('x1', 18.31, AFTER_B)]);
  const d = g.runGuards(r, [book()], 'color', {});
  rec('book 18.31: single color call margin projection (info)', true, `refused=${d.refused} :: ${d.message}`);
}
// 2. app 0.28 refuses
{
  const r = temp();
  put(r, 'family-words/muse/costs.tsv', [row('f1', 0.28, AFTER_F)]);
  const d = g.runGuards(r, [app()], 'color', {});
  rec('app 0.28 refuses next u2fw call', d.refused === true && d.code === 3 && d.run === 'u2fw', JSON.stringify(d));
}
{
  const r = temp();
  put(r, 'family-words/muse/costs.tsv', [row('f1', 0.05, AFTER_F)]);
  const d = g.runGuards(r, [app()], 'color', {});
  rec('app 0.05 passes u2fw call', d.refused === false && d.run === 'u2fw', JSON.stringify(d));
}
// 3. independent scopes
{
  const r = temp();
  put(r, 'w09/muse/costs.tsv', [row('x1', 18.32, AFTER_B)]);
  const d = g.runGuards(r, [app()], 'color', {});
  rec('book spend 18.32 does not count for u2fw', d.refused === false && d.spend === 0, JSON.stringify(d));
}
{
  const r = temp();
  put(r, 'family-words/muse/costs.tsv', [row('f1', 0.28, AFTER_F)]);
  const d = g.runGuards(r, [book()], 'color', {});
  rec('app spend 0.28 does not count for u2', d.refused === false && d.spend === 0, JSON.stringify(d));
}
{
  // app fixture under a book-type path should not count for u2fw either (only the family folder is read)
  const r = temp();
  put(r, 'w09/muse/elements/costs.tsv', [row('e', 0.28, AFTER_F)]);
  const d = g.runGuards(r, [app()], 'color', {});
  rec('book elements spend does not count for u2fw', d.spend === 0 && d.refused === false, JSON.stringify(d));
}
// 4. before start does not count
{
  const r = temp();
  put(r, 'w09/muse/costs.tsv', [row('x1', 18.32, BEFORE_B)]);
  const d = g.runGuards(r, [book()], 'color', {});
  rec('book row before startTime does not count', d.refused === false && d.spend === 0, JSON.stringify(d));
}
{
  const r = temp();
  put(r, 'w09/muse/costs.tsv', [row('x1', 18.32, B0)]);
  const d = g.runGuards(r, [book()], 'color', {});
  rec('book row exactly at startTime counts', d.refused === true, JSON.stringify(d));
}
{
  const r = temp();
  put(r, 'family-words/muse/costs.tsv', [row('f1', 0.28, BEFORE_F)]);
  const d = g.runGuards(r, [app()], 'color', {});
  rec('app row before startTime does not count', d.refused === false && d.spend === 0, JSON.stringify(d));
}
{
  const r = temp();
  put(r, 'family-words/muse/costs.tsv', [row('f1', 0.28, F0)]);
  const d = g.runGuards(r, [app()], 'color', {});
  rec('app row exactly at startTime counts', d.refused === true, JSON.stringify(d));
}
// 5. mixed refusals
{
  const r = temp();
  const u1 = { spec: { id: 'l2-w03-story-page-x', outDir: 'out/storytime/l2/unit1/w03/muse' } };
  const card = { spec: { id: 'l2-w04-card-mom', outDir: 'out/storytime/l2/unit1/cards/muse' } };
  for (const [name, ctxs] of [
    ['u2fw+u2', [app(), book()]],
    ['u2+u2fw', [book(), app()]],
    ['u2fw+unit1', [app(), u1]],
    ['unit1+u2fw', [u1, app()]],
    ['u2fw+card', [app(), card]],
    ['card+u2fw', [card, app()]],
  ]) {
    const d = g.runGuards(r, ctxs, 'color', {});
    rec(`mixed ${name} refused`, d.refused === true && d.code === 3 && d.run === 'mixed', d.message);
  }
}
// 6. invalid unit 2 paths
{
  const r = temp();
  const paths = [
    `${U2}/family-words`,
    `${U2}/family-words/muse/elements`,
    `${U2}/family-words/muse/sub`,
    `${U2}/family-words/muse/..`,
    `${U2}/family-words/delivery-muse-v1`,
    `${U2}/family-words/muse/../../w09/muse/../x`,
    `${U2}/w08/muse`,
    `${U2}/w17/muse`,
    `${U2}/w09/muse/sub`,
    `${U2}/w09`,
    `${U2}/muse`,
    `${U2}/delivery-muse-v1`,
    U2,
    `${U2}/family-words-x/muse`,
    `${U2}/Family-Words/muse`,
    'out/storytime/l2/unit2-x/w09/muse',
    '../outside/family-words/muse',
  ];
  for (const p of paths) {
    const c = g.classifyOutDir({ id: 'z', outDir: p }, r);
    const d = g.runGuards(r, [{ spec: { id: 'z', outDir: p } }], 'color', { u2CapUsd: 99, u2FwCapUsd: 99 });
    const expectInvalid = c.kind === 'invalid';
    rec(`path ${p} -> ${c.kind}`, expectInvalid ? d.refused === true && d.run === 'invalid' : true, expectInvalid ? '' : `NOT invalid; refused=${d.refused}`);
  }
  // exact kinds
  rec('exact FW dir kind u2fw', g.classifyOutDir({ outDir: FW }, r).kind === 'u2fw');
  rec('FW dir with trailing slash kind', true, g.classifyOutDir({ outDir: FW + '/' }, r).kind);
  rec('FW dir via ./ prefix kind', true, g.classifyOutDir({ outDir: './' + FW }, r).kind);
  rec('absolute FW dir kind', true, g.classifyOutDir({ outDir: path.join(REPO, FW) }, r).kind);
  for (const wk of g.U2_WEEKS) {
    const k1 = g.classifyOutDir({ outDir: `${U2}/${wk}/muse` }, r).kind;
    const k2 = g.classifyOutDir({ outDir: `${U2}/${wk}/muse/elements` }, r).kind;
    rec(`week ${wk} u2 + elements u2`, k1 === 'u2' && k2 === 'u2', `${k1}/${k2}`);
  }
}
// 7. bad caps
for (const [label, cap] of [['null', null], ['0', 0], ['-1', -1], ['NaN', NaN], ['"5"', '5'], ['Infinity', Infinity], ['undefined', undefined]]) {
  const r = temp();
  const d1 = g.runGuards(r, [book()], 'color', { u2CapUsd: cap });
  rec(`u2 cap ${label} refuses`, d1.refused === true && d1.code === 3, d1.message);
  const d2 = g.runGuards(r, [app()], 'color', { u2FwCapUsd: cap });
  rec(`u2fw cap ${label} refuses`, d2.refused === true && d2.code === 3, d2.message);
}
// test-only option cannot widen when absent from CLI
rec('cliGuardOptions strips both', (() => { const o = g.cliGuardOptions({ u2CapUsd: '99', u2FwCapUsd: '99', tries: '2', concurrency: '4' }); return !('u2CapUsd' in o) && !('u2FwCapUsd' in o) && o.tries === '2'; })());
{
  const r = temp();
  put(r, 'w09/muse/costs.tsv', [row('x1', 18.32, AFTER_B)]);
  const d = g.runGuards(r, [book()], 'color', g.cliGuardOptions({ u2CapUsd: '99' }));
  rec('stripped u2CapUsd cannot lift the book stop', d.refused === true);
  const r2 = temp();
  put(r2, 'family-words/muse/costs.tsv', [row('f1', 0.28, AFTER_F)]);
  const d2 = g.runGuards(r2, [app()], 'color', g.cliGuardOptions({ u2FwCapUsd: '99' }));
  rec('stripped u2FwCapUsd cannot lift the app stop', d2.refused === true);
  // hasOwn with prototype / own key spread trick
  const d3 = g.runGuards(r2, [app()], 'color', g.cliGuardOptions(JSON.parse('{"__proto__":{"u2FwCapUsd":99}}')));
  rec('proto key cannot lift the app stop', d3.refused === true);
}
// pool projection (info)
{
  const r = temp();
  put(r, 'w09/muse/costs.tsv', [row('x1', 18.0, AFTER_B)]);
  const many = Array.from({ length: 40 }, (_, i) => book('w09', 'muse', `l2-w09-p${i}`));
  const d = g.runGuards(r, many, 'color', {});
  rec('pool of 40 at 18.00 refused by projection', d.refused === true, d.message);
}
// try cap for u2fw: 3 tries
{
  const r = temp();
  put(r, 'family-words/muse/costs.tsv', [row('l2-w10-family-hat', 0.01, AFTER_F), row('l2-w10-family-hat', 0.01, AFTER_F), row('l2-w10-family-hat', 0.01, AFTER_F)]);
  const d = g.runGuards(r, [app('l2-w10-family-hat')], 'color', {});
  rec('u2fw 4th color try refused', d.refused === true, d.message);
}
// CLI probe (HOME empty): refusal before key read, and cap option ignored
const emptyHome = mkdtempSync('/tmp/opencode/u2home-');
const specDir = temp();
const bookSpec = path.join(REPO, 'measure/runs/asset_storytime_l2_unit2_pictures_20261108/probe-spec-book.json');
const cli = (args, env = {}) => {
  try {
    const o = execFileSync('node', ['scripts/storytime-muse.mjs', ...args], { cwd: REPO, env: { PATH: process.env.PATH, HOME: emptyHome, ...env }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, text: o };
  } catch (e) {
    return { code: e.status, text: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
};
// a spec in the repo tree is needed by loadSpec (relative to ROOT); use existing family-words absent -> use a book spec from docs
const realBook = 'docs/storytime/l2-unit2/w09/muse/l2-w09-card-banana.json';
// NOTE: loadSpec creates the spec outDir folder; that folder is empty and under out/ (ignored). Fine.
const a1 = cli(['color', realBook, '--u2CapUsd', '99']);
rec('CLI book call with --u2CapUsd 99: reaches key read (no cap refusal text), no key -> error', a1.code === 1 && /error:/.test(a1.text) && !/refused/.test(a1.text), `code=${a1.code} ${a1.text.trim().slice(0, 200)}`);
const a2 = cli(['color', realBook, '--u2CapUsd', '99', '--u2FwCapUsd', '99', '--tries', '9']);
rec('CLI book call with both flags: no cap refusal, key read fails', a2.code === 1 && /error:/.test(a2.text), `code=${a2.code} ${a2.text.trim().slice(0, 200)}`);

writeFileSync('/tmp/opencode/u2probe-result.json', JSON.stringify(out, null, 2));
const bad = out.filter((o) => !o.ok);
console.log(`\nTOTAL ${out.length} FAIL ${bad.length}`);
for (const b of bad) console.log('FAIL:', b.name, b.detail);

// byte-equal checks against 5ebb3db1
const base = execFileSync('git', ['show', '5ebb3db1:scripts/storytime-muse-guards.mjs'], { cwd: REPO, encoding: 'utf8' });
const cur = readFileSync(path.join(REPO, 'scripts/storytime-muse-guards.mjs'), 'utf8');
const grab = (t, name) => {
  const i = t.indexOf(`export const ${name}`);
  if (i < 0) return null;
  const nl = t.indexOf('\n', i);
  const first = t.slice(i, nl);
  if (/;\s*$/.test(first)) return first;
  const e = t.indexOf('\n};', i);
  return t.slice(i, e + 3);
};
for (const n of ['RESTART_START', 'MAX_TRIES', 'SPEND_CAP_USD', 'SPEND_MARGIN_USD', 'REPORT_AT_USD', 'CARD_RUN', 'CARD_LINE_RETRY_START', 'CARD_LINE_RETRY', 'TRY_EXCEPTIONS', 'PICTURE_IDS']) {
  const a = grab(base, n);
  const b = grab(cur, n);
  console.log(`BYTE ${n}: ${a === null ? 'MISSING-in-base' : a === b ? 'EQUAL' : 'DIFF'} (${a ? a.length : 0} chars)`);
}
