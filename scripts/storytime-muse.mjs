#!/usr/bin/env node
// Storytime Muse page tool. Composes one page picture from element pictures with the Muse Image model
// (OpenRouter Image API), makes the line art from the approved color picture, and makes print-size files.
//
//   node scripts/storytime-muse.mjs color <spec>... [--concurrency 4]   one color call per spec, next version m<n>
//   node scripts/storytime-muse.mjs line  <spec>... [--from <n>] [--tries <k>]  line call from the approved color of m<n> (default: latest); k tries run in parallel
//   node scripts/storytime-muse.mjs print <spec> --from <n>             print-size files again for m<n> (no call)
//   node scripts/storytime-muse.mjs despeckle <spec> --from <n> [--try <t>] [--area <fraction>]
//                                                                        remove isolated black specks from line-m<n> try t (default 1); writes -line[-t]-despeckled.png and its print file (no call)
//   node scripts/storytime-muse.mjs import <spec> --color <png> --line <png> [--note <text>] [--cost <usd>]
//                                                                        copy earlier pictures in as the next version (no call)
//
// Spec file (JSON, one per row): { id, text, goal, references: [paths], colorPrompt, linePrompt,
//   print: "crop" | "pad", aspect?: "4:3", outDir?: <folder>, despeckleArea?: 0.000015 }.
// despeckleArea = a black connected component (8 neighbors) smaller than this share of the line picture is a speck.
// Outputs in out/storytime/l2/unit1/w01/muse/ (or spec.outDir): <id>-m<n>-color.png, -line.png (1-bit),
// -color-print.png, -line-print.png (4000 x 3000, or spec.printSize), <id>-m<n>.json (SHA-256 of each file), costs.tsv.
// The API key is read at run time from the Workbooks dashboard env file. It is never printed or written.
import { createHash } from 'node:crypto';
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import sharp from 'sharp';
import { REPORT_AT_USD, runGuards } from './storytime-muse-guards.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const DEFAULT_OUT = 'out/storytime/l2/unit1/w01/muse';
const MODEL = 'meta/muse-image';
const URL_API = 'https://openrouter.ai/api/v1/images';
const PRINT_SIZE = [4000, 3000]; // default print size; a spec may set printSize: [w, h]
const TSV_HEAD = 'time\trow\tversion\tkind\tinputs\toutput\tsize\tusage_cost\tnote\n';

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const readKey = () => {
  const text = readFileSync(join(homedir(), 'Desktop/Workbooks/dashboard/.env.local'), 'utf8');
  let key = '';
  for (const line of text.split('\n')) {
    const i = line.indexOf('=');
    if (i < 0) continue;
    const name = line.slice(0, i).trim();
    if (name === 'OPENROUTER_API_KEY' || name === 'OPERNROUTER_API_KEY') key = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  if (!key) throw new Error('no key in the Workbooks env file');
  return key;
};

const loadSpec = (path) => {
  const raw = readFileSync(resolve(ROOT, path));
  const spec = JSON.parse(raw.toString('utf8'));
  for (const f of ['id', 'colorPrompt']) if (!spec[f]) throw new Error(`${path}: missing ${f}`);
  spec.print ??= 'crop';
  spec.aspect ??= '4:3';
  spec.references ??= [];
  const dir = resolve(ROOT, spec.outDir ?? DEFAULT_OUT);
  mkdirSync(dir, { recursive: true });
  return { spec, dir, specSha: sha256(raw), specPath: path, dims: spec.printSize ?? PRINT_SIZE };
};

const nextVersion = (dir, id) => {
  let n = 1;
  while (existsSync(join(dir, `${id}-m${n}.json`)) || existsSync(join(dir, `${id}-m${n}-color.png`))) n++;
  return n;
};

const costTotal = (dir) => {
  const f = join(dir, 'costs.tsv');
  if (!existsSync(f)) return 0;
  return readFileSync(f, 'utf8').split('\n').slice(1).reduce((s, l) => s + (Number(l.split('\t')[7]) || 0), 0);
};
const logCall = (dir, row, version, kind, inputs, output, size, cost, note) => {
  const f = join(dir, 'costs.tsv');
  if (!existsSync(f)) writeFileSync(f, TSV_HEAD);
  appendFileSync(f, [new Date().toISOString(), row, `m${version}`, kind, inputs.join(';'), output, size, cost, note].join('\t') + '\n');
};

const dataUrl = async (path) => {
  const buf = await sharp(resolve(ROOT, path)).flatten({ background: '#ffffff' }).resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
  return { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${buf.toString('base64')}` } };
};

// One Muse call. Returns { buf, cost } or throws (the call is logged either way).
const callMuse = async (key, prompt, refs, aspect) => {
  const body = { model: MODEL, prompt, aspect_ratio: aspect, input_references: await Promise.all(refs.map(dataUrl)) };
  let res;
  let text;
  try {
    res = await fetch(URL_API, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(300000) });
    text = await res.text();
  } catch (e) {
    return { error: `network error: ${e.cause?.code ?? e.name}`, cost: 0 };
  }
  if (!res.ok) return { error: `HTTP ${res.status}: ${text.slice(0, 200)}`, cost: 0 };
  const json = JSON.parse(text);
  const cost = json.usage?.cost ?? 0;
  const b64 = (json.data ?? []).find((d) => d.b64_json)?.b64_json;
  if (json.error || !b64) return { error: `no image: ${text.slice(0, 200)}`, cost };
  return { buf: Buffer.from(b64, 'base64'), cost };
};

// Line art at the call size: grayscale, hard threshold, pure 1-bit.
const toOneBit = (buf) => sharp(buf).grayscale().threshold(128).toColourspace('b-w').png({ bitdepth: 1, compressionLevel: 9 }).toBuffer();

// Despeckle: delete each black connected component (8 neighbors) whose area is below area x image pixels.
// A component that touches another line is part of that component, so it is never a speck.
const DESPECKLE_AREA = 0.000015; // 0.0015 percent of the image area, about 37 px at 1920 x 1280
const despeckle = async (oneBit, area = DESPECKLE_AREA) => {
  const { data, info } = await sharp(oneBit).grayscale().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const limit = Math.max(1, Math.round(area * w * h));
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let removed = 0;
  let removedPixels = 0;
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || data[start] >= 128) continue;
    let sp = 0;
    let size = 0;
    stack[sp++] = start;
    seen[start] = 1;
    const members = [];
    while (sp) {
      const i = stack[--sp];
      size++;
      if (size <= limit) members.push(i);
      const x = i % w;
      const y = (i - x) / w;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (seen[j] || data[j] >= 128) continue;
          seen[j] = 1;
          stack[sp++] = j;
        }
      }
    }
    if (size < limit) {
      for (const i of members) data[i] = 255;
      removed++;
      removedPixels += size;
    }
  }
  const out = await sharp(data, { raw: { width: w, height: h, channels: 1 } }).threshold(128).toColourspace('b-w').png({ bitdepth: 1, compressionLevel: 9 }).toBuffer();
  return { buf: out, removed, removedPixels, limit };
};

// Reframe to 4:3: crop = centered crop, pad = white bands (color pad uses the picture's own edge color).
const reframe = async (buf, mode, padColor, dims) => {
  const m = await sharp(buf).metadata();
  const ratio = dims[0] / dims[1];
  const wT = Math.round(m.height * ratio);
  if (mode === 'crop') {
    if (m.width <= wT) return buf;
    return sharp(buf).extract({ left: Math.floor((m.width - wT) / 2), top: 0, width: wT, height: m.height }).toBuffer();
  }
  const targetH = Math.round(m.width / ratio);
  const top = Math.floor((targetH - m.height) / 2);
  return sharp(buf).extend({ top, bottom: targetH - m.height - top, left: 0, right: 0, background: padColor }).toBuffer();
};

const printColor = async (buf, mode, dims) => {
  const framed = await reframe(await sharp(buf).removeAlpha().toBuffer(), mode, '#ffffff', dims);
  return sharp(framed).resize(dims[0], dims[1], { kernel: 'lanczos3' }).sharpen({ sigma: 0.7, m1: 0.6, m2: 1.2 }).png({ compressionLevel: 9 }).toBuffer();
};
// Line print: enlarge the grayscale picture, smooth the edges a little, then threshold to pure 1-bit.
const printLine = async (buf, mode, dims) => {
  const gray = await sharp(buf).grayscale().toBuffer();
  const framed = await reframe(gray, mode, '#ffffff', dims);
  // Two stages: sharp runs threshold before resize inside one pipeline, so the enlarged picture is made first.
  const big = await sharp(framed).resize(dims[0], dims[1], { kernel: 'lanczos3' }).blur(1.6).png().toBuffer();
  return toOneBit(big);
};

const sidecarPath = (dir, id, n) => join(dir, `${id}-m${n}.json`);
const readSidecar = (dir, id, n) => (existsSync(sidecarPath(dir, id, n)) ? JSON.parse(readFileSync(sidecarPath(dir, id, n), 'utf8')) : null);
const latestVersion = (dir, id) => nextVersion(dir, id) - 1;

const writeFileSafe = (path, buf) => {
  if (existsSync(path)) throw new Error(`refused to overwrite ${path}`);
  writeFileSync(path, buf);
};

const addFile = (side, dir, role, name, buf, cost, note) => {
  side.files[role] = name;
  side.sha256[role] = sha256(buf);
  if (cost !== undefined) side.calls.push({ role, file: name, cost, note });
  side.cost = Number(side.calls.reduce((s, c) => s + (Number(c.cost) || 0), 0).toFixed(6));
};

const newSidecar = (ctx, n) => ({
  rowId: ctx.spec.id,
  version: n,
  spec: ctx.specPath,
  specSha256: ctx.specSha,
  model: MODEL,
  references: ctx.spec.references,
  files: {},
  sha256: {},
  calls: [],
  cost: 0,
  print: ctx.spec.print,
});
const saveSidecar = (ctx, side) => writeFileSync(sidecarPath(ctx.dir, ctx.spec.id, side.version), JSON.stringify(side, null, 2) + '\n');

const doColor = async (key, ctx) => {
  const { spec, dir } = ctx;
  const n = nextVersion(dir, spec.id);
  const base = `${spec.id}-m${n}`;
  const out = `${base}-color.png`;
  const r = await callMuse(key, spec.colorPrompt, spec.references, spec.aspect);
  if (r.error) {
    logCall(dir, spec.id, n, 'color', spec.references, 'none', 'none', r.cost, r.error);
    console.log(`${base} color FAILED ${r.error}`);
    return;
  }
  const png = await sharp(r.buf).removeAlpha().png().toBuffer();
  const m = await sharp(png).metadata();
  writeFileSafe(join(dir, out), png);
  const side = newSidecar(ctx, n);
  addFile(side, dir, 'color', out, png, r.cost, 'color call');
  logCall(dir, spec.id, n, 'color', spec.references, out, `${m.width}x${m.height}`, r.cost, 'ok');
  const pp = await printColor(png, spec.print, ctx.dims);
  writeFileSafe(join(dir, `${base}-color-print.png`), pp);
  addFile(side, dir, 'colorPrint', `${base}-color-print.png`, pp);
  saveSidecar(ctx, side);
  console.log(`${base} color ok ${m.width}x${m.height} cost ${r.cost}`);
};

const doLine = async (key, ctx, from, tries = 1) => {
  const { spec, dir } = ctx;
  if (!spec.linePrompt) throw new Error(`${spec.id}: no linePrompt`);
  const n = from ?? latestVersion(dir, spec.id);
  const side = readSidecar(dir, spec.id, n);
  if (!side?.files.color) throw new Error(`${spec.id}: no color picture m${n}`);
  const base = `${spec.id}-m${n}`;
  const src = join(dir, side.files.color);
  const refPath = src.replace(`${ROOT}/`, '');
  // Reserve the try numbers first, so that parallel tries of one picture write separate files.
  const suffixOf = (t) => (t === 1 ? '' : `-${t}`);
  const reserved = [];
  let t = 1;
  while (reserved.length < tries) {
    if (!existsSync(join(dir, `${base}-line${suffixOf(t)}.png`))) reserved.push(t);
    t++;
  }
  await Promise.all(
    reserved.map(async (t) => {
      const suffix = () => suffixOf(t);
      const r = await callMuse(key, spec.linePrompt, [refPath], spec.aspect);
      if (r.error) {
        logCall(dir, spec.id, n, 'line', [refPath], 'none', 'none', r.cost, r.error);
        console.log(`${base} line try ${t} FAILED ${r.error}`);
        return;
      }
      const raw = await sharp(r.buf).removeAlpha().png().toBuffer();
      const one = await toOneBit(raw);
      const m = await sharp(raw).metadata();
      const name = `${base}-line${suffix()}.png`;
      writeFileSafe(join(dir, `${base}-line-raw${suffix()}.png`), raw);
      writeFileSafe(join(dir, name), one);
      logCall(dir, spec.id, n, 'line', [refPath], name, `${m.width}x${m.height}`, r.cost, t === 1 ? 'ok' : `redo ${t}`);
      addFile(side, dir, 'line', name, one, r.cost, 'line call');
      addFile(side, dir, `lineRaw${suffix()}`, `${base}-line-raw${suffix()}.png`, raw);
      const pp = await printLine(raw, spec.print, ctx.dims);
      const pname = `${base}-line-print${suffix()}.png`;
      writeFileSafe(join(dir, pname), pp);
      addFile(side, dir, 'linePrint', pname, pp);
      // The un-despeckled files above stay as they are; the despeckled pair has a new name.
      const ds = await despeckle(one, spec.despeckleArea);
      writeFileSafe(join(dir, `${base}-line${suffix()}-despeckled.png`), ds.buf);
      const dp = await printLine(ds.buf, spec.print, ctx.dims);
      writeFileSafe(join(dir, `${base}-line-print${suffix()}-despeckled.png`), dp);
      addFile(side, dir, `lineDespeckled${suffix()}`, `${base}-line${suffix()}-despeckled.png`, ds.buf);
      addFile(side, dir, `linePrintDespeckled${suffix()}`, `${base}-line-print${suffix()}-despeckled.png`, dp);
      saveSidecar(ctx, side);
      console.log(`${base} line try ${t} ok ${m.width}x${m.height} cost ${r.cost}`);
    }),
  );
};

const doPrint = async (ctx, from) => {
  const { spec, dir } = ctx;
  const n = from ?? latestVersion(dir, spec.id);
  const side = readSidecar(dir, spec.id, n);
  const base = `${spec.id}-m${n}`;
  const stamp = `-${Date.now().toString(36)}`;
  if (side.files.color) {
    const pp = await printColor(readFileSync(join(dir, side.files.color)), spec.print, ctx.dims);
    const name = `${base}-color-print${existsSync(join(dir, `${base}-color-print.png`)) ? stamp : ''}.png`;
    writeFileSafe(join(dir, name), pp);
    addFile(side, dir, 'colorPrint', name, pp);
  }
  if (side.files.line) {
    const src = side.files.lineRaw ?? side.files.line;
    const pp = await printLine(readFileSync(join(dir, src)), spec.print, ctx.dims);
    const name = `${base}-line-print${existsSync(join(dir, `${base}-line-print.png`)) ? stamp : ''}.png`;
    writeFileSafe(join(dir, name), pp);
    addFile(side, dir, 'linePrint', name, pp);
  }
  saveSidecar(ctx, side);
  console.log(`${base} print files written`);
};

// Despeckle an existing line picture (no call). Never overwrites: the original line file stays.
const doDespeckle = async (ctx, from, tryNo, area) => {
  const { spec, dir } = ctx;
  const n = from ?? latestVersion(dir, spec.id);
  const side = readSidecar(dir, spec.id, n);
  const suffix = tryNo === 1 ? '' : `-${tryNo}`;
  const base = `${spec.id}-m${n}`;
  const srcName = `${base}-line${suffix}.png`;
  if (!existsSync(join(dir, srcName))) throw new Error(`${srcName}: not found`);
  const ds = await despeckle(readFileSync(join(dir, srcName)), area ?? spec.despeckleArea);
  const outName = `${base}-line${suffix}-despeckled.png`;
  writeFileSafe(join(dir, outName), ds.buf);
  const dp = await printLine(ds.buf, spec.print, ctx.dims);
  const pname = `${base}-line-print${suffix}-despeckled.png`;
  writeFileSafe(join(dir, pname), dp);
  if (side) {
    addFile(side, dir, `lineDespeckled${suffix}`, outName, ds.buf);
    addFile(side, dir, `linePrintDespeckled${suffix}`, pname, dp);
    saveSidecar(ctx, side);
  }
  console.log(`${outName} removed ${ds.removed} specks (${ds.removedPixels} px, limit ${ds.limit} px)`);
};

const doImport = async (ctx, opts) => {
  const { spec, dir } = ctx;
  const n = nextVersion(dir, spec.id);
  const base = `${spec.id}-m${n}`;
  const side = newSidecar(ctx, n);
  side.imported = { note: opts.note ?? 'imported', cost: Number(opts.cost ?? 0) };
  const colorBuf = readFileSync(resolve(ROOT, opts.color));
  writeFileSafe(join(dir, `${base}-color.png`), colorBuf);
  addFile(side, dir, 'color', `${base}-color.png`, colorBuf);
  const cm = await sharp(colorBuf).metadata();
  logCall(dir, spec.id, n, 'color-import', [opts.color], `${base}-color.png`, `${cm.width}x${cm.height}`, 0, `${opts.note ?? 'imported'}; earlier cost ${opts.cost ?? 0} not counted here`);
  const cp = await printColor(colorBuf, spec.print, ctx.dims);
  writeFileSafe(join(dir, `${base}-color-print.png`), cp);
  addFile(side, dir, 'colorPrint', `${base}-color-print.png`, cp);
  if (opts.line) {
    const lineRaw = readFileSync(resolve(ROOT, opts.line));
    const one = await toOneBit(lineRaw);
    writeFileSafe(join(dir, `${base}-line-raw.png`), lineRaw);
    writeFileSafe(join(dir, `${base}-line.png`), one);
    addFile(side, dir, 'lineRaw', `${base}-line-raw.png`, lineRaw);
    addFile(side, dir, 'line', `${base}-line.png`, one);
    logCall(dir, spec.id, n, 'line-import', [opts.line], `${base}-line.png`, `${cm.width}x${cm.height}`, 0, `${opts.note ?? 'imported'}`);
    const lp = await printLine(lineRaw, spec.print, ctx.dims);
    writeFileSafe(join(dir, `${base}-line-print.png`), lp);
    addFile(side, dir, 'linePrint', `${base}-line-print.png`, lp);
  }
  saveSidecar(ctx, side);
  console.log(`${base} imported`);
};

const pool = async (items, limit, fn) => {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      try {
        await fn(item);
      } catch (e) {
        console.log(`error: ${e.message}`);
      }
    }
  });
  await Promise.all(workers);
};

const main = async () => {
  const [cmd, ...rest] = process.argv.slice(2);
  const opts = {};
  const files = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith('--')) opts[rest[i].slice(2)] = rest[++i];
    else files.push(rest[i]);
  }
  if (!['color', 'line', 'print', 'import', 'despeckle'].includes(cmd) || !files.length) {
    console.log('usage: storytime-muse.mjs color|line|print|despeckle|import <spec>... [--concurrency 4] [--from n]');
    process.exit(2);
  }
  const limit = Math.min(4, Number(opts.concurrency ?? 4));
  const ctxs = files.map(loadSpec);
  if (cmd === 'import') {
    await doImport(ctxs[0], opts);
  } else if (cmd === 'despeckle') {
    await doDespeckle(ctxs[0], opts.from ? Number(opts.from) : undefined, Number(opts.try ?? 1), opts.area ? Number(opts.area) : undefined);
  } else if (cmd === 'print') {
    await doPrint(ctxs[0], opts.from ? Number(opts.from) : undefined);
  } else {
    // Restart guards (T3a, 2026-11-04): at most 3 tries per picture and kind; spend cap 1.00
    // USD (sum + 0.01 before a call); notice at 0.50 USD. They run before any provider call.
    const guards = runGuards(resolve(ROOT, 'out/storytime/l2/unit1'), ctxs, cmd, opts);
    if (guards.refused) {
      console.log(guards.message);
      process.exit(guards.code);
    }
    if (guards.notice) console.log(`notice: spend ${guards.spend.toFixed(4)} USD at or above report point ${REPORT_AT_USD}`);
    const key = readKey();
    await pool(ctxs, limit, (ctx) => (cmd === 'color' ? doColor(key, ctx) : doLine(key, ctx, opts.from ? Number(opts.from) : undefined, Number(opts.tries ?? 1))));
  }
  const dirs = [...new Set(ctxs.map((c) => c.dir))];
  for (const d of dirs) console.log(`running total ${basename(d)}: ${costTotal(d).toFixed(4)} USD`);
};
main().catch((e) => {
  console.error(`error: ${e.message}`);
  process.exit(1);
});
