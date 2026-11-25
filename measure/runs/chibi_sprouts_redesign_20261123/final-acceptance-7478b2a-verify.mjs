// Final acceptance probe for chibi_sprouts_redesign_20261123 (read-only).
// Usage: node final-acceptance-7478b2a-verify.mjs <rootA> <rootB>
// Each root holds out/chibi-sprouts/redesign/cutout and out/sprout-mom-kim/sprites.
import { createRequire } from 'node:module';
import { readdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const require = createRequire('/home/daniebo/Desktop/advantage-forge/package.json');
const sharp = require('sharp');

async function load(p) {
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

function components(img, thr) {
  const { data, w, h } = img;
  const seen = new Uint8Array(w * h);
  let count = 0;
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || data[s * 4 + 3] < thr) continue;
    count++;
    const stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const i = stack.pop();
      const x = i % w;
      const y = (i / w) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (seen[j] || data[j * 4 + 3] < thr) continue;
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
  }
  return count;
}

function ring(img) {
  const { data, w, h } = img;
  let opaque = 0;
  let anyAlpha = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        const a = data[(y * w + x) * 4 + 3];
        if (a > 0) anyAlpha++;
        if (a >= 128) opaque++;
      }
    }
  }
  return { opaque, anyAlpha };
}

function stats(img) {
  const { data, w, h } = img;
  let top = h;
  let bottom = -1;
  let left = w;
  let right = -1;
  let ghost = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a === 0 && (data[i] || data[i + 1] || data[i + 2])) ghost++;
      if (a >= 128) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  return { top, bottom, left, right, height: bottom - top + 1, ghostColourPixels: ghost };
}

const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

async function run(root) {
  const out = { root };
  const cutPath = `${root}/out/chibi-sprouts/redesign/cutout/sprout-mom-kim/front.png`;
  const cut = await load(cutPath);
  out.cutout = {
    size: `${cut.w}x${cut.h}`,
    cornersAlpha: [0, cut.w - 1].flatMap((x) => [0, cut.h - 1].map((y) => cut.data[(y * cut.w + x) * 4 + 3])),
    ring: ring(cut),
    componentsAlpha128: components(cut, 128),
    componentsAlpha1: components(cut, 1),
    ...stats(cut),
  };
  const spr = `${root}/out/sprout-mom-kim/sprites`;
  const idleDir = `${spr}/idle`;
  const idleFiles = readdirSync(idleDir)
    .filter((f) => /^[A-Z]+_\d+\.png$/.test(f))
    .sort();
  const frames = [];
  for (const f of idleFiles) {
    const im = await load(`${idleDir}/${f}`);
    frames.push({ f, w: im.w, h: im.h, ringAny: ring(im).anyAlpha, comps: components(im, 1) });
  }
  out.idle = {
    frames: frames.length,
    allSize128: frames.every((x) => x.w === 128 && x.h === 128),
    ringClean: frames.every((x) => x.ringAny === 0),
    singleComponent: frames.every((x) => x.comps === 1),
    multiComponentFrames: frames.filter((x) => x.comps !== 1).map((x) => `${x.f}:${x.comps}`),
  };
  const stat = [];
  for (const f of ['E', 'N', 'NE', 'NW', 'S', 'SE', 'SW', 'W']) {
    const im = await load(`${spr}/${f}.png`);
    stat.push({ f, w: im.w, h: im.h, ringAny: ring(im).anyAlpha, comps: components(im, 1) });
  }
  out.staticSet = {
    all128: stat.every((x) => x.w === 128 && x.h === 128),
    ringClean: stat.every((x) => x.ringAny === 0),
    comps: stat.map((x) => x.comps).join(','),
  };
  out.hashes = {
    cutout: hash(cutPath),
    preview: hash(`${spr}/preview.png`),
    idlePreview: hash(`${idleDir}/preview.png`),
    idleSheet: hash(`${idleDir}/sheet.png`),
    idleS0: hash(`${idleDir}/S_0.png`),
    idleGif: hash(`${idleDir}/idle.gif`),
  };
  return out;
}

const a = await run(process.argv[2]);
const b = await run(process.argv[3]);
console.log(JSON.stringify({ rootA: a, rootB: b }, null, 1));
console.log(
  'A vs B hashes:',
  Object.keys(a.hashes)
    .map((k) => `${k}:${a.hashes[k] === b.hashes[k] ? 'SAME' : 'DIFF'}`)
    .join(' '),
);
