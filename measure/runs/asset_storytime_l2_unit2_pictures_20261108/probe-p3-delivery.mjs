// P3 acceptance probe: print chain, delivery manifest, and file checks.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import sharp from 'sharp';

const sha = (b) => createHash('sha256').update(b).digest('hex');
const D = 'out/storytime/l2/unit2/family-words/muse';
const DELIV = 'out/storytime/l2/unit2/family-words/delivery-muse-v1';
const R = 'measure/runs/asset_storytime_l2_unit2_pictures_20261108';

const approvals = JSON.parse(readFileSync(`${R}/approvals-u2-fw.json`, 'utf8')).entries;
const manifest = JSON.parse(readFileSync(`${DELIV}/manifest.json`, 'utf8'));
const jobsById = new Map(manifest.jobs.map((j) => [j.id, j]));
const files = readdirSync(DELIV).filter((f) => f.endsWith('.png'));

let bad = [];
const printOk = [];
for (const e of approvals) {
  const colorPath = `${D}/${e.rowId}-m1-color.png`;
  const printPath = `${D}/${e.colorPrint}`;
  const color = readFileSync(colorPath);
  const print = readFileSync(printPath);
  // Rebuild the print with the exact printColor pipeline of scripts/storytime-muse.mjs (pad, 1500x1500).
  const rebuilt = await sharp(await sharp(color).removeAlpha().toBuffer())
    .resize(1500, 1500, { kernel: 'lanczos3' })
    .sharpen({ sigma: 0.7, m1: 0.6, m2: 1.2 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const same = sha(rebuilt) === sha(print);
  if (!same) bad.push(`${e.rowId}: the print is not the printColor output of the m1 color file`);
  // sidecar sha256
  const side = JSON.parse(readFileSync(`${D}/${e.rowId}-m1.json`, 'utf8'));
  if (side.sha256?.color !== sha(color)) bad.push(`${e.rowId}: sidecar color sha256 differs`);
  if (side.sha256?.colorPrint !== sha(print)) bad.push(`${e.rowId}: sidecar colorPrint sha256 differs`);
  if (side.files?.color !== `${e.rowId}-m1-color.png`) bad.push(`${e.rowId}: sidecar color file name differs`);
  if (side.files?.colorPrint !== e.colorPrint) bad.push(`${e.rowId}: sidecar print name differs`);
  // delivery file
  const out = readFileSync(`${DELIV}/${e.rowId}-v1.png`);
  const outSha = sha(out);
  if (outSha !== sha(print)) bad.push(`${e.rowId}: the delivery file bytes differ from the approved print`);
  const job = jobsById.get(e.rowId);
  if (!job) bad.push(`${e.rowId}: no manifest job`);
  else {
    const cand = job.candidates[job.selectedVersion - 1] ?? job.candidates[0];
    if (job.status !== 'ready') bad.push(`${e.rowId}: job status ${job.status}`);
    if (job.selectedVersion !== 1) bad.push(`${e.rowId}: selectedVersion ${job.selectedVersion}`);
    if (job.selectedFile !== `${e.rowId}-v1.png`) bad.push(`${e.rowId}: selectedFile ${job.selectedFile}`);
    if (job.selectedSha256 !== outSha) bad.push(`${e.rowId}: manifest selectedSha256 differs`);
    if (cand.fileSha256 !== outSha) bad.push(`${e.rowId}: candidate fileSha256 differs`);
    const st = cand.structural ?? {};
    if (st.valid !== true || st.width !== 1500 || st.height !== 1500 || st.sha256 !== outSha) {
      bad.push(`${e.rowId}: structural record ${JSON.stringify(st)}`);
    }
  }
  printOk.push(e.rowId);
}

// PNG headers: 1500x1500, 8-bit, no alpha (colour type 2).
for (const f of files) {
  const head = readFileSync(`${DELIV}/${f}`).subarray(0, 33);
  if (head.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') { bad.push(`${f}: not a PNG`); continue; }
  const w = head.readUInt32BE(16), h = head.readUInt32BE(20), bd = head[24], ct = head[25];
  if (w !== 1500 || h !== 1500 || bd !== 8 || ct !== 2) bad.push(`${f}: ${w}x${h} bit ${bd} colour type ${ct}`);
}

// Batch hashes: SHA-256 of JSON.stringify([{file,sha256}]) sorted by file, no whitespace.
const batchBad = [];
for (const b of manifest.batches) {
  const payload = JSON.stringify(b.files.map((f) => ({ file: f.file, sha256: f.sha256 })).sort((x, y) => (x.file < y.file ? -1 : 1)));
  if (sha(payload) !== b.sha256) batchBad.push(b.id);
  const names = b.files.map((f) => f.file).sort();
  for (const n of names) {
    const actual = sha(readFileSync(`${DELIV}/${n}`));
    const listed = b.files.find((f) => f.file === n).sha256;
    if (actual !== listed) batchBad.push(`${b.id}/${n}`);
  }
}
console.log('approvals:', approvals.length, 'manifest jobs:', manifest.jobs.length, 'png files:', files.length, 'batches:', manifest.batches.length);
console.log('ids: print chains rebuilt identical:', printOk.length, 'of 18');
console.log('problems:', bad.length);
for (const b of bad) console.log('  ', b);
console.log('batch hash problems:', batchBad.length, batchBad.slice(0, 5));
console.log('png files not in a job:', files.filter((f) => !jobsById.has(f.replace(/-v1\.png$/, ''))));
console.log('jobs without a png:', manifest.jobs.filter((j) => !files.includes(`${j.id}-v1.png`)).map((j) => j.id));
