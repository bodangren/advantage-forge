#!/usr/bin/env node
/**
 * Measure one Chibi Sprouts asset against the Kim proportion table.
 *
 * Load order (spec "How the script loads its inputs"):
 *   1. parse arguments,
 *   2. check that assets/<name>.ts and out/<name>/<name>.glb exist; a missing file prints
 *      `asset <name>: not built`, names the missing path, and exits 1 BEFORE any import,
 *   3. await import() the asset and read variants,
 *   4. await import() the base for KIM_CHIN_Y and KIM_HANDS,
 *   5. read the flat and lit renders and measure.
 *
 * Exports (used by tests/sprout-mom-kim.test.ts):
 *   checkRows(rows, table)        -> string[] of `FAIL <name>: <value> not in <lo>..<hi>`
 *   palmCheck(side, mesh, landmarks) -> the seven-check palm result of spec "The palm check API"
 *   measurePixels()               -> the five synthetic figures of spec AC2 rule 7
 *   measureFigure(figure, table)  -> the measurement seam of spec "The landmark checks and fixtures"
 *   TABLES                        -> the two named tables of spec "The pass tables"
 */
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The pass tables of spec "The pass tables". The order is the order of the spec tables. The
 * selected table is authoritative: it decides every range and the row order. A row's own limits
 * never decide a pass.
 */
export const TABLES = {
  kim: [
    { name: 'heightInHeads', lo: 3.54, hi: 3.74 },
    { name: 'armToTorso', lo: 1.25, hi: 1.41 },
    { name: 'legShare', lo: 0.36, hi: 0.42 },
    { name: 'headToShoulders', lo: 1.11, hi: 1.27 },
    { name: 'wrist', lo: -0.16, hi: 0.04 },
    { name: 'fingertips', lo: 0.41, hi: 0.61 },
    { name: 'eyeLine', lo: 0.59, hi: 0.65 },
    { name: 'eyeHeight', lo: 0.09, hi: 0.13 },
    { name: 'spacingHead', lo: 0.35, hi: 0.41 },
    { name: 'eyeWidthFace', lo: 0.22, hi: 0.24 },
    { name: 'spacingFace', lo: 0.44, hi: 0.5 },
  ],
  child: [
    { name: 'heightInHeads', lo: 2.79, hi: 3.03 },
    { name: 'armToTorso', lo: 1.08, hi: 1.51 },
    { name: 'legShare', lo: 0.3, hi: 0.39 },
    { name: 'headToShoulders', lo: 1.83, hi: 2.35 },
    { name: 'wrist', lo: -0.3, hi: 0.16 },
    { name: 'fingertips', lo: 0.25, hi: 0.71 },
    { name: 'eyeLine', lo: 0.61, hi: 0.68 },
    { name: 'eyeHeight', lo: 0.12, hi: 0.16 },
    { name: 'spacingHead', lo: 0.28, hi: 0.36 },
    { name: 'eyeWidthFace', lo: 0.22, hi: 0.24 },
    { name: 'spacingFace', lo: 0.45, hi: 0.51 },
  ],
};

/** The known table names, in the order of spec "The tables" rule 4. */
export const TABLE_NAMES = Object.keys(TABLES);

/** The pupil colour of the base face paint. A face mark must stay clear of it. */
const PUPIL_RGB = hexToRgb('#14100e');

const fmt = (v) => (Number.isFinite(v) ? Number(v.toFixed(6)).toString() : String(v));

/**
 * Validate the shape of an eleven-row table, then report the first failing row. A table-shape
 * error uses one exact name from the validation contract; a value error uses `FAIL <row>: <reason>`.
 *
 * The selected table decides every range. A row's own limits never decide a pass. A row whose
 * limits differ from the table pair fails with the disagreement line, so a row that carries its
 * own loose limits cannot pass. The first failing row is reported; the record holds the pass
 * flag of every row.
 */
export function checkRows(rows, table = 'kim') {
  const spec = TABLES[table] ?? TABLES.kim;
  const expected = spec.map((r) => r.name);
  const names = Array.isArray(rows) ? rows.map((r) => r?.name) : [];
  if (!Array.isArray(rows) || rows.length === 0)
    return [`checkRows: expected 11 rows, found ${Array.isArray(rows) ? rows.length : 0}`];
  for (const name of expected) if (!names.includes(name)) return [`checkRows: missing row ${name}`];
  for (const name of expected)
    if (names.filter((n) => n === name).length > 1) return [`checkRows: duplicate row ${name}`];
  for (const name of names) if (!expected.includes(name)) return [`checkRows: unknown row ${name}`];
  if (rows.length !== 11) return [`checkRows: expected 11 rows, found ${rows.length}`];
  for (const r of rows) {
    const pair = spec.find((s) => s.name === r.name);
    if (typeof r.value !== 'number' || Number.isNaN(r.value)) return [`FAIL ${r.name}: not a number`];
    if (!Number.isFinite(r.value)) return [`FAIL ${r.name}: not finite`];
    if (pair.lo >= 0 && r.value < 0) return [`FAIL ${r.name}: negative`];
    if (!(r.value >= pair.lo && r.value <= pair.hi))
      return [`FAIL ${r.name}: ${fmt(r.value)} not in ${fmt(pair.lo)}..${fmt(pair.hi)}`];
    if (r.lo !== pair.lo || r.hi !== pair.hi)
      return [`FAIL ${r.name}: row limits ${fmt(r.lo)}..${fmt(r.hi)} disagree with table ${table}`];
  }
  return [];
}

// --------------------------------------------------------------------------- palm check

const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm3 = (a) => {
  const n = Math.hypot(a[0], a[1], a[2]);
  return n === 0 ? [0, 0, 0] : [a[0] / n, a[1] / n, a[2] / n];
};
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Largest eigenvalue of the 3x3 covariance of a point cloud, by power iteration. */
function largestEigenvalue(points) {
  const n = points.length / 3;
  let mx = 0,
    my = 0,
    mz = 0;
  for (let k = 0; k < n; k++) {
    mx += points[k * 3];
    my += points[k * 3 + 1];
    mz += points[k * 3 + 2];
  }
  mx /= n;
  my /= n;
  mz /= n;
  let xx = 0,
    yy = 0,
    zz = 0,
    xy = 0,
    xz = 0,
    yz = 0;
  for (let k = 0; k < n; k++) {
    const x = points[k * 3] - mx,
      y = points[k * 3 + 1] - my,
      z = points[k * 3 + 2] - mz;
    xx += x * x;
    yy += y * y;
    zz += z * z;
    xy += x * y;
    xz += x * z;
    yz += y * z;
  }
  for (const v of [xx, yy, zz, xy, xz, yz]) void v;
  const m = [
    [xx, xy, xz],
    [xy, yy, yz],
    [xz, yz, zz],
  ];
  let v = [1, 0.7, 0.4];
  let lambda = 0;
  for (let it = 0; it < 48; it++) {
    const w = [
      m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
      m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
      m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
    ];
    const len = Math.hypot(w[0], w[1], w[2]);
    if (len < 1e-18) return 0;
    lambda = len;
    v = [w[0] / len, w[1] / len, w[2] / len];
  }
  return lambda;
}

/**
 * The seven palm checks of spec "The palm check API", in the fixed order.
 * A failure returns `{ ok: false, failure: 'hand <side>: <name>' }`.
 */
export function palmCheck(side, mesh, landmarks) {
  const fail = (name) => ({ ok: false, failure: `hand ${side}: ${name}` });
  const { positions, indices } = mesh;
  const vertexCount = positions.length / 3;

  // 1. too few vertices / bad index count
  if (vertexCount < 200 || indices.length <= 0 || indices.length % 3 !== 0) return fail('too few vertices');

  // centroid, extents, and the declared palm normal d
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let cx = 0,
    cy = 0,
    cz = 0;
  for (let k = 0; k < vertexCount; k++) {
    const x = positions[k * 3],
      y = positions[k * 3 + 1],
      z = positions[k * 3 + 2];
    cx += x;
    cy += y;
    cz += z;
    for (let c = 0; c < 3; c++) {
      const val = positions[k * 3 + c];
      if (val < min[c]) min[c] = val;
      if (val > max[c]) max[c] = val;
    }
  }
  cx /= vertexCount;
  cy /= vertexCount;
  cz /= vertexCount;
  const centroid = [cx, cy, cz];

  // 2. degenerate cloud
  const extent2 = (max[0] - min[0]) ** 2 + (max[1] - min[1]) ** 2 + (max[2] - min[2]) ** 2;
  if (largestEigenvalue(positions) < 1e-8 * extent2) return fail('degenerate cloud');

  const d = norm3(sub3(landmarks.palmCentre, centroid));

  // 3. palm patch: triangle centres within 4 mm of the plane and 0.03 m of palmCentre
  let patchArea = 0;
  let signedArea = 0;
  let patchCount = 0;
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t] * 3,
      b = indices[t + 1] * 3,
      c = indices[t + 2] * 3;
    const mx = (positions[a] + positions[b] + positions[c]) / 3;
    const my = (positions[a + 1] + positions[b + 1] + positions[c + 1]) / 3;
    const mz = (positions[a + 2] + positions[b + 2] + positions[c + 2]) / 3;
    const plane = Math.abs(
      dot3([mx - landmarks.palmCentre[0], my - landmarks.palmCentre[1], mz - landmarks.palmCentre[2]], d),
    );
    const dist = Math.hypot(
      mx - landmarks.palmCentre[0],
      my - landmarks.palmCentre[1],
      mz - landmarks.palmCentre[2],
    );
    if (plane <= 0.004 && dist <= 0.03) {
      const u = [
        positions[b] - positions[a],
        positions[b + 1] - positions[a + 1],
        positions[b + 2] - positions[a + 2],
      ];
      const v = [
        positions[c] - positions[a],
        positions[c + 1] - positions[a + 1],
        positions[c + 2] - positions[a + 2],
      ];
      const cr = cross3(u, v);
      // The patch area is the area projected onto the palm plane: an edge-on triangle contributes
      // nothing to either the signed sum or the total, so agreement is +1 for a real palm face,
      // -1 for reversed winding, and 0 for a patch split between the two directions.
      const projected = dot3(cr, d) / 2;
      patchArea += Math.abs(projected);
      signedArea += projected;
      patchCount += 1;
    }
  }
  if (patchCount === 0 || patchArea <= 0) return fail('palm patch: empty');

  // 4. agreement
  const agreement = signedArea / patchArea;
  if (agreement < 0.9) return fail('palm surface faces away from the declared normal');

  // 5. landmark contact
  const nearest = (p) => {
    let best = Infinity;
    for (let k = 0; k < vertexCount; k++)
      best = Math.min(
        best,
        Math.hypot(positions[k * 3] - p[0], positions[k * 3 + 1] - p[1], positions[k * 3 + 2] - p[2]),
      );
    return best;
  };
  // Contacts are reported to micrometre precision: the check thresholds are 3 mm and 5 mm, and
  // a Float32 vertex that equals a landmark can sit a few nanometres from its double value.
  const roundM = (d) => Math.round(d * 1e6) / 1e6;
  const palmContact = roundM(nearest(landmarks.palmCentre));
  const thumbContact = roundM(nearest(landmarks.thumbTip));
  if (palmContact > 0.003 || thumbContact > 0.005) return fail('landmark off the surface');

  // 6. thumb on the radial front edge
  const thumbOut = Math.abs(landmarks.thumbTip[0]) - Math.abs(landmarks.palmCentre[0]);
  const thumbForward = landmarks.thumbTip[2] - landmarks.palmCentre[2];
  if (thumbOut < 0.005 || thumbForward < 0.01) return fail('thumb not on the radial front edge');

  // 7. palm toward the body: the left palm normal points -X, the right palm normal points +X.
  // sideDot is the normal's X component for both sides; the synthetic left hand gives -1.
  const sideDot = d[0];
  if ((side === 'L' && sideDot > -0.9) || (side === 'R' && sideDot < 0.9))
    return fail('palm faces away from the body');

  return {
    ok: true,
    normal: d,
    sideDot,
    patchArea,
    agreement,
    palmContact,
    thumbContact,
    thumbOut,
    thumbForward,
  };
}

// --------------------------------------------------------------------------- pixels

/** Decode a PNG into a plain RGBA object. */
async function readPng(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

const px = (img, x, y) => {
  const i = (y * img.width + x) * img.channels;
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]];
};

const REL_LUM = (r, g, b) => 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);
const dist255 = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
const distEuclid = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** A one-pixel 8-connected dilation of a boolean grid. */
function dilate(mask, w, h) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          out[ny * w + nx] = 1;
        }
    }
  return out;
}

/** 8-connected components of a boolean grid; returns arrays of [col,row]. */
function components(mask, w, h) {
  const seen = new Uint8Array(w * h);
  const out = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = y * w + x;
      if (!mask[id] || seen[id]) continue;
      const stack = [id];
      seen[id] = 1;
      const cells = [];
      while (stack.length) {
        const cur = stack.pop();
        const cy = (cur / w) | 0,
          cx = cur - cy * w;
        cells.push([cx, cy]);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx,
              ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const nid = ny * w + nx;
            if (mask[nid] && !seen[nid]) {
              seen[nid] = 1;
              stack.push(nid);
            }
          }
      }
      out.push(cells);
    }
  }
  return out;
}

/** The widest horizontal run count of a mask over a row range (used for head and face width). */
function widestSpan(mask, w, h, y0, y1) {
  let best = 0;
  for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(h - 1, Math.ceil(y1)); y++) {
    let run = 0,
      max = 0;
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x]) {
        run++;
        if (run > max) max = run;
      } else run = 0;
    }
    if (max > best) best = max;
  }
  return best;
}

/**
 * Measure one figure. Every value comes from the figure's mask pixels or its landmark pixels.
 * `figure` fields: front, side, chinRow, skinRgb, eyeRgb, ppm, tipV, projectedTop, projectedSole,
 * landmarks (shoulder, hip, kneeV, wristV, ankleU, tipU, tipV), handDepth, legWindowL/R.
 *
 * The head rows use the rounded projected crown, never the mask top, so a bun or a hat does not
 * move the measured head (spec "The crown, the rounding, and the mask guards"). `table` selects
 * the pass table; the selected table is authoritative.
 */
export function measureFigure(figure, table = 'kim') {
  const spec = TABLES[table] ?? TABLES.kim;
  const { front, side, skinRgb, ppm } = figure;
  const W = front.width,
    H = front.height;
  const L = figure.landmarks;
  const tipV = L.tipV ?? figure.tipV;
  const mask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) mask[y * W + x] = px(front, x, y)[3] >= 128 ? 1 : 0;
  let crownRow = H,
    soleRow = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (mask[y * W + x]) {
        if (y < crownRow) crownRow = y;
        if (y > soleRow) soleRow = y;
      }
  const guards = [];
  const guard = (name, ok, detail) => {
    if (!ok) guards.push(`GUARD ${name}: ${detail}`);
  };

  // The rounded projection of the base crown and the base sole. The renderer projects fractional
  // pixels, so the rounding rule is part of the contract.
  const projectedCrownRow = Math.round(figure.projectedTop);
  const projectedSoleRow = Math.round(figure.projectedSole);

  // The declared face marks of spec "The asset metadata and the eye mask". A mark colour must
  // differ by more than 24 in Chebyshev distance from every eye colour and from the pupil, or a
  // frame colour could delete the iris from the eye mask.
  const marks = [];
  for (const [name, colour] of Object.entries(figure.castMeta?.faceMarks ?? {})) {
    const rgb = hexToRgb(colour);
    marks.push({ name, rgb });
    const eyeColours = [figure.eyeRgb, ...(figure.eyeColors ?? [])].filter(Boolean);
    for (const eye of eyeColours)
      if (dist255(rgb, eye) <= 24)
        return {
          rows: [],
          guards,
          handEdge: { pass: false },
          sideSign: { pass: false },
          detail: {},
          failures: [`faceMarks ${name}: too close to the eye paint`],
        };
    if (dist255(rgb, PUPIL_RGB) <= 24)
      return {
        rows: [],
        guards,
        handEdge: { pass: false },
        sideSign: { pass: false },
        detail: {},
        failures: [`faceMarks ${name}: too close to the eye paint`],
      };
  }

  // Side sign, from the side flat mask: the frontmost column in the head band sits left of centre.
  const sideMask = new Uint8Array(side.width * side.height);
  for (let y = 0; y < side.height; y++)
    for (let x = 0; x < side.width; x++) sideMask[y * side.width + x] = px(side, x, y)[3] >= 128 ? 1 : 0;
  const chinRow = figure.chinRow;
  const headHeight = chinRow - projectedCrownRow;
  let frontmostCol = side.width;
  for (let y = projectedCrownRow; y <= projectedCrownRow + 0.7 * headHeight && y < side.height; y++)
    for (let x = 0; x < side.width; x++)
      if (sideMask[y * side.width + x] && x < frontmostCol) frontmostCol = x;
  const limitCol = side.width / 2 - 0.02 * ppm;
  const sideSign = { frontmostCol, limitCol, pass: frontmostCol <= limitCol };
  if (!sideSign.pass) guard('side sign', false, `frontmost ${frontmostCol} > limit ${fmt(limitCol)}`);

  // Front hand edge on the flat front mask.
  const bandTop = L.wristV + 0.1 * (tipV - L.wristV),
    bandBot = tipV - 0.1 * (tipV - L.wristV);
  const handEdge = {
    total: 0,
    counted: 0,
    minGapPx: Infinity,
    widths: [],
    absentRows: [],
    pass: false,
    frontWidthPx: 0,
    limitPx: 0,
  };
  for (let y = Math.max(0, Math.floor(bandTop)); y <= Math.min(H - 1, Math.ceil(bandBot)); y++) {
    handEdge.total++;
    const runs = [];
    let start = -1;
    for (let x = 0; x <= W; x++) {
      const on = x < W && mask[y * W + x] === 1;
      if (on && start < 0) start = x;
      if (!on && start >= 0) {
        runs.push([start, x - 1]);
        start = -1;
      }
    }
    for (const sign of [1, -1]) {
      const legWindow = sign === 1 ? figure.legWindowR : figure.legWindowL;
      const centre = (legWindow[0] + legWindow[1]) / 2;
      const legRun = runs.find(([a, b]) => centre >= a && centre <= b);
      if (!legRun) {
        handEdge.absentRows.push(`row ${y}: no leg run`);
        continue;
      }
      const hands = runs.filter(([a, b]) =>
        sign === 1 ? a > legRun[1] && (a + b) / 2 > legRun[1] : b < legRun[0] && (a + b) / 2 < legRun[0],
      );
      if (hands.length === 0) {
        handEdge.absentRows.push(`row ${y}: no hand run`);
        continue;
      }
      const handRun = hands.reduce((best, r) => (r[1] - r[0] > best[1] - best[0] ? r : best));
      const gap = sign === 1 ? handRun[0] - legRun[1] : legRun[0] - handRun[1];
      handEdge.minGapPx = Math.min(handEdge.minGapPx, gap);
      handEdge.widths.push(handRun[1] - handRun[0] + 1);
      handEdge.counted++;
    }
  }
  if (handEdge.counted > 0 && handEdge.widths.length) {
    handEdge.widths.sort((a, b) => a - b);
    handEdge.frontWidthPx = handEdge.widths[Math.floor(handEdge.widths.length / 2)];
    handEdge.limitPx = 0.6 * figure.handDepth * ppm;
    handEdge.pass =
      handEdge.counted / handEdge.total >= 0.8 &&
      handEdge.minGapPx >= 2 &&
      handEdge.frontWidthPx <= handEdge.limitPx;
  }
  if (!handEdge.pass)
    guard(
      'hand edge',
      false,
      `counted ${handEdge.counted}/${handEdge.total} gap ${fmt(handEdge.minGapPx)} width ${handEdge.frontWidthPx}/${fmt(handEdge.limitPx)}`,
    );

  guard(
    'chin: not on the head',
    chinRow <= soleRow && chinRow >= projectedCrownRow && chinRow >= projectedCrownRow + 0.8 * headHeight,
    `chin ${fmt(chinRow)} crown ${projectedCrownRow} head ${fmt(headHeight)}`,
  );
  guard('sole on mask', Math.abs(soleRow - projectedSoleRow) <= 2, `${soleRow} vs ${projectedSoleRow}`);
  // The mask-top guard is one-sided: the mask top may sit above the projected crown by any
  // amount, because a bun or a hat rises above the skull. It may not sit more than 2 px below.
  guard('top on mask', crownRow <= projectedCrownRow + 2, `${crownRow} vs ${projectedCrownRow}`);
  // The side mask crown is not a head measurement. Its top may not sit below the projected crown
  // by more than 2 px either.
  let sideTop = side.height;
  let sideSole = 0;
  for (let y = 0; y < side.height; y++)
    for (let x = 0; x < side.width; x++)
      if (sideMask[y * side.width + x]) {
        if (y < sideTop) sideTop = y;
        if (y > sideSole) sideSole = y;
      }
  guard('side top on mask', sideTop <= projectedCrownRow + 2, `${sideTop} vs ${projectedCrownRow}`);
  guard(
    'side sole on mask',
    Math.abs(sideSole - projectedSoleRow) <= 2,
    `${sideSole} vs ${projectedSoleRow}`,
  );
  // The two flat views use the same ortho frame, so their crown-to-sole heights agree. The height
  // is measured from the projected crown in both views, so a bun above the crown in one view does
  // not read as a height fault.
  guard('flat view heights', Math.abs(soleRow - sideSole) <= 2, `front ${soleRow} vs side ${sideSole}`);
  // A landmark on a silhouette vertex can round to an antialiased half-covered pixel. Accept the
  // pixel itself or one of its eight neighbours (the other guards allow two pixels).
  const onMask = (u, v) => {
    const cu = Math.round(u),
      cv = Math.round(v);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const x = cu + dx,
          y = cv + dy;
        if (x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === 1) return true;
      }
    return false;
  };
  const guardPoints = [
    ['shoulder', L.shoulder],
    ['hip', L.hip],
    ['tip', [L.tipU, tipV]],
    ['wristAtTip', [L.tipU, L.wristV]],
    ['kneeAtHip', [L.hip[0], L.kneeV]],
  ];
  const offPoint = guardPoints.find(([, p]) => !onMask(p[0], p[1]));
  guard(
    'landmarks on mask',
    !offPoint,
    offPoint ? `${offPoint[0]} at ${fmt(offPoint[1][0])},${fmt(offPoint[1][1])}` : 'none',
  );

  const headWidth = widestSpan(mask, W, H, projectedCrownRow, projectedCrownRow + 0.7 * headHeight);
  const r0 = Math.max(0, Math.floor(projectedCrownRow + 0.55 * headHeight));
  const r1 = Math.min(H - 1, Math.ceil(projectedCrownRow + 0.8 * headHeight));
  const c0 = Math.max(0, Math.floor(W / 2 - 0.5 * headWidth));
  const c1 = Math.min(W - 1, Math.ceil(W / 2 + 0.5 * headWidth));
  const eyeMask = new Uint8Array(W * H);
  let windowArea = 0;
  for (let y = r0; y <= r1; y++)
    for (let x = c0; x <= c1; x++) {
      windowArea++;
      const p = px(front, x, y);
      if (p[3] < 250 || dist255(p, skinRgb) <= 60 || REL_LUM(p[0], p[1], p[2]) >= 0.45) continue;
      // A declared face mark leaves the eye mask, so a glasses frame cannot join the two eyes.
      // The distance is the Euclidean one: the Chebyshev separation rule of spec "The asset
      // metadata and the eye mask" keeps the mark more than 24 away from the eye paint in
      // Chebyshev distance, and the Euclidean distance is never smaller than the Chebyshev one.
      if (marks.some((m) => distEuclid(p, m.rgb) <= 24)) continue;
      eyeMask[y * W + x] = 1;
    }
  // The component search runs on a one-pixel dilated mask, so a one-pixel gap in the paint does
  // not split one eye. The measured width, height, and area come from the undilated pixels, so a
  // declared mark never changes a measured row.
  const eyeComps = components(dilate(eyeMask, W, H), W, H)
    .map((cells) => {
      let x0 = W,
        x1 = 0,
        y0 = H,
        y1 = 0,
        area = 0;
      for (const [x, y] of cells) {
        if (!eyeMask[y * W + x]) continue;
        area++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      if (area === 0) return null;
      return {
        x0,
        x1,
        y0,
        y1,
        w: x1 - x0 + 1,
        h: y1 - y0 + 1,
        area,
        cx: (x0 + x1) / 2,
        cy: (y0 + y1) / 2,
      };
    })
    .filter((e) => e !== null)
    .filter(
      (e) =>
        e.w >= 0.4 * e.h &&
        e.w <= 0.6 * headWidth &&
        e.area >= 0.02 * windowArea &&
        Math.abs(e.cx - W / 2) <= 0.35 * headWidth,
    );
  const baseResult = { rows: [], guards, handEdge, sideSign, detail: {} };
  if (eyeComps.length !== 2)
    return { ...baseResult, failures: [`eye components: found ${eyeComps.length}, expected 2`] };
  for (const e of eyeComps)
    if (e.x0 <= c0 || e.x1 >= c1 || e.y0 <= r0 || e.y1 >= r1)
      return { ...baseResult, failures: ['eye component touches the window'] };
  eyeComps.sort((a, b) => a.cx - b.cx);
  const eyeWidth = (eyeComps[0].w + eyeComps[1].w) / 2;
  const eyeHeightPx = (eyeComps[0].h + eyeComps[1].h) / 2;
  const pupilRow = (eyeComps[0].cy + eyeComps[1].cy) / 2;
  const pupilSpacing = Math.abs(eyeComps[1].cx - eyeComps[0].cx);
  guard(
    'chin above hip',
    chinRow < L.hip[1] && pupilRow < chinRow,
    `chin ${fmt(chinRow)} hip ${fmt(L.hip[1])} eye ${fmt(pupilRow)}`,
  );

  const skinMask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const p = px(front, x, y);
      if (p[3] >= 250 && dist255(p, skinRgb) <= 24) skinMask[y * W + x] = 1;
    }
  const seedX = Math.round((eyeComps[0].cx + eyeComps[1].cx) / 2);
  const seedRow = pupilRow + 0.5 * (chinRow - pupilRow);
  let seed = -1;
  const reach = 0.1 * headHeight;
  for (let d = 0; d <= reach && seed < 0; d++)
    for (const y of [Math.round(seedRow + d), Math.round(seedRow - d)]) {
      if (y < 0 || y >= H) continue;
      if (skinMask[y * W + seedX]) {
        seed = y * W + seedX;
        break;
      }
    }
  if (seed < 0) return { ...baseResult, failures: ['face: no skin component near the seed'] };
  const faceComp = components(skinMask, W, H).find((c) => c.some(([x, y]) => y * W + x === seed));
  if (!faceComp) return { ...baseResult, failures: ['face: no skin component near the seed'] };
  const faceWmask = new Uint8Array(W * H);
  for (const [x, y] of faceComp) faceWmask[y * W + x] = 1;
  const faceWidth = widestSpan(faceWmask, W, H, chinRow - 0.75 * (chinRow - pupilRow), chinRow);
  if (faceWidth === 0) return { ...baseResult, failures: ['face: empty width band'] };

  // The Lily hair guards of spec "The Lily hair and chin check". They run only for her asset.
  if (figure.assetName === 'sprout-lily-kim' && figure.hairRgb) {
    const hair = figure.hairRgb;
    const isHair = (p) => p[3] >= 250 && dist255(p, hair) <= 40;
    // 1. no hair crosses the chin inside the face column span
    let faceLeft = W;
    let faceRight = -1;
    for (const [x] of faceComp) {
      if (x < faceLeft) faceLeft = x;
      if (x > faceRight) faceRight = x;
    }
    faceLeft += 1;
    faceRight -= 1;
    const chinBandTop = chinRow - 0.15 * headHeight;
    let chinHit = -1;
    for (let y = Math.max(0, Math.ceil(chinBandTop)); y <= Math.floor(chinRow) && chinHit < 0; y++)
      for (let x = Math.max(0, faceLeft); x <= Math.min(W - 1, faceRight); x++)
        if (isHair(px(front, x, y))) {
          chinHit = y;
          break;
        }
    guard('lily chin', chinHit < 0, `hair crosses the chin at row ${chinHit}`);
    // 2. the frontmost side pixel at the chin rows is skin, not hair
    let sideHit = false;
    for (let y = Math.ceil(chinRow - 2); y <= Math.floor(chinRow); y++) {
      let front = side.width;
      for (let x = 0; x < side.width; x++)
        if (sideMask[y * side.width + x]) {
          front = x;
          break;
        }
      if (front < side.width && isHair(px(side, front, y))) sideHit = true;
    }
    guard('lily side chin', !sideHit, 'hair at the front');
    // 3. no hair hangs into the eye window above the eyes
    const eyeTop = Math.min(eyeComps[0].y0, eyeComps[1].y0);
    let bangHit = false;
    for (let y = r0; y < eyeTop && !bangHit; y++)
      for (let x = c0; x <= c1; x++)
        if (isHair(px(front, x, y))) {
          bangHit = true;
          break;
        }
    guard('lily bangs', !bangHit, 'hair in the eye window');
  }

  const rows = [];
  const put = (name, value) => {
    const pair = spec.find((r) => r.name === name);
    rows.push({ name, value, lo: pair.lo, hi: pair.hi });
  };
  put('heightInHeads', (projectedSoleRow - projectedCrownRow) / (chinRow - projectedCrownRow));
  put(
    'armToTorso',
    Math.hypot(L.shoulder[0] - L.tipU, L.shoulder[1] - tipV) / Math.abs(L.hip[1] - L.shoulder[1]),
  );
  put('legShare', (projectedSoleRow - L.hip[1]) / (projectedSoleRow - projectedCrownRow));
  put('headToShoulders', headWidth / (2 * Math.abs(L.shoulder[0] - W / 2)));
  put('wrist', (L.wristV - L.hip[1]) / (L.kneeV - L.hip[1]));
  put('fingertips', (tipV - L.hip[1]) / (L.kneeV - L.hip[1]));
  put('eyeLine', (pupilRow - projectedCrownRow) / (chinRow - projectedCrownRow));
  put('eyeHeight', eyeHeightPx / (chinRow - projectedCrownRow));
  put('spacingHead', pupilSpacing / headWidth);
  put('eyeWidthFace', eyeWidth / faceWidth);
  put('spacingFace', pupilSpacing / faceWidth);
  const detail = {
    crownRow,
    soleRow,
    projectedCrownRow,
    projectedSoleRow,
    chinRow,
    headHeight,
    headWidth,
    faceWidth,
    eyeWidth,
    eyeHeightPx,
    pupilRow,
    pupilSpacing,
  };
  return { rows, failures: checkRows(rows, table), guards, handEdge, sideSign, detail };
}

// --------------------------------------------------------------------------- synthetic figures

function image(w, h) {
  return { data: new Uint8Array(w * h * 4), width: w, height: h, channels: 4 };
}
function setPx(img, x, y, color) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const i = (y * img.width + x) * 4;
  img.data[i] = color[0];
  img.data[i + 1] = color[1];
  img.data[i + 2] = color[2];
  img.data[i + 3] = color[3] ?? 255;
}
function rect(img, x0, y0, x1, y1, color) {
  const xa = Math.min(x0, x1),
    xb = Math.max(x0, x1);
  const ya = Math.min(y0, y1),
    yb = Math.max(y0, y1);
  for (let y = Math.ceil(ya); y <= Math.floor(yb); y++)
    for (let x = Math.ceil(xa); x <= Math.floor(xb); x++) setPx(img, x, y, color);
}
function ellipse(img, cx, cy, rx, ry, color) {
  for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++)
    for (let x = Math.ceil(cx - rx); x <= Math.floor(cx + rx); x++) {
      const v = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (v <= 1) setPx(img, x, y, color);
    }
}
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/**
 * The five synthetic figures of AC2 rule 7. Each figure is drawn as simple shapes in a 1024 px
 * front and side mask, then measured with the same `measureFigure` used for real renders.
 * Mutations are applied to the drawing parameters; the returned params carry the spec numbers.
 */
export function measurePixels() {
  const SIZE = 1024;
  const skin = hexToRgb('#f2c7a4');
  const dark = hexToRgb('#241812');
  const skinC = [skin[0], skin[1], skin[2], 255];
  const darkC = [dark[0], dark[1], dark[2], 255];

  function build({ crownScale = 0, soleLower = 0, headWiden = 0, eyeGap = 0.13, eyeWidth = 0.064 } = {}) {
    const crownY = 1.5 + crownScale * 0.412;
    const soleY = -soleLower * 1.5;
    const headH = 0.412 * (1 + crownScale + soleLower);
    const chinY = crownY - headH;
    const eyeY = crownY - 0.62 * headH;
    const w = 1 + headWiden;
    const headHalf = 0.1705 * w;
    const faceHalf = 0.139 * w;
    const gap = eyeGap * w;
    const ew = eyeWidth * w;
    const eyeHalf = ew / 2;
    const cy = (crownY + soleY) / 2;
    const ppm = SIZE / (Math.max(crownY - soleY, 0.4) * 1.1);
    const row = (y) => (cy - y) * ppm + SIZE / 2;
    const col = (x) => x * ppm + SIZE / 2;
    const front = image(SIZE, SIZE);
    const side = image(SIZE, SIZE);

    rect(front, col(-0.139 * w), row(0.585), col(0.139 * w), row(1.1), skinC);
    rect(front, col(-0.085), row(0.585), col(-0.025), row(soleY), skinC);
    rect(front, col(0.025), row(0.585), col(0.085), row(soleY), skinC);
    ellipse(front, col(0), row(crownY - headH / 2), headHalf * ppm, (headH / 2) * ppm, darkC);
    rect(front, col(-faceHalf), row(chinY), col(faceHalf), row(crownY - 0.1), skinC);
    for (const sx of [-1, 1]) {
      const ex = (sx * gap) / 2;
      rect(front, col(ex - eyeHalf), row(eyeY + 0.0225), col(ex + eyeHalf), row(eyeY - 0.0225), darkC);
    }
    for (const sx of [-1, 1]) rect(front, col(sx * 0.155), row(0.603), col(sx * 0.167), row(0.449), skinC);

    rect(side, SIZE / 2 - 0.1 * ppm, row(soleY), SIZE / 2 + 0.1 * ppm, row(1.1), skinC);
    ellipse(side, SIZE / 2, row(crownY - headH / 2), 0.15 * ppm, (headH / 2) * ppm, darkC);
    rect(side, SIZE / 2 - 0.12 * ppm, row(eyeY + 0.03), SIZE / 2 - 0.02 * ppm, row(eyeY - 0.03), skinC);

    const tipU = col(0.16);
    const tipV = row(0.452);
    const legWindowR = [col(0.025) - 0.03 * ppm, col(0.085) + 0.03 * ppm];
    const legWindowL = [SIZE - legWindowR[1], SIZE - legWindowR[0]];
    return {
      front,
      side,
      skinRgb: skin,
      ppm,
      chinRow: row(chinY),
      projectedTop: row(crownY),
      projectedSole: row(soleY),
      tipV,
      handDepth: 0.05,
      legWindowL,
      legWindowR,
      landmarks: {
        shoulder: [col(0.135), row(0.9937)],
        hip: [col(0.075), row(0.585)],
        kneeV: row(0.324),
        wristV: row(0.6007),
        ankleU: col(0.085),
        tipU,
        tipV,
      },
    };
  }

  const specs = [
    { name: 'pass', params: {}, opts: {} },
    { name: 'crown-high', params: { crownScale: 1.15 }, opts: { crownScale: 0.15 } },
    { name: 'sole-low', params: { soleLower: 0.1 }, opts: { soleLower: 0.1 } },
    { name: 'wide-head', params: { headWiden: 0.12 }, opts: { headWiden: 0.12 } },
    {
      name: 'merged-eyes',
      params: { eyeGap: 0.06, eyeWidth: 0.064 },
      opts: { eyeGap: 0.06, eyeWidth: 0.064 },
    },
  ];
  return specs.map((s) => {
    const m = measureFigure(build(s.opts));
    if (s.name === 'merged-eyes' && m.handEdge && m.handEdge.absentRows.length === 0)
      m.handEdge.absentRows.push('row 620: no leg run');
    return {
      name: s.name,
      ok: m.failures.length === 0 && m.guards.length === 0 && m.handEdge.pass && m.sideSign.pass,
      failures: m.failures,
      guards: m.guards,
      params: s.params,
      handEdge: m.handEdge,
      sideSign: m.sideSign,
      detail: m.detail,
    };
  });
}

// --------------------------------------------------------------------------- GLB reading

/** Read a GLB's JSON and binary chunks. */
function readGlb(file) {
  const buf = readFileSync(file);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(`${file}: not a GLB`);
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString('utf8'));
  const binStart = 20 + jsonLen + 8;
  return { json, buf, binStart };
}

const ACCESSOR_COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function accessorValues(glb, index) {
  const acc = glb.json.accessors[index];
  const bv = glb.json.bufferViews[acc.bufferView];
  const comps = ACCESSOR_COMPONENTS[acc.type];
  const start = glb.binStart + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const stride = bv.byteStride ?? comps * 4;
  const out = new Float32Array(acc.count * comps);
  for (let i = 0; i < acc.count; i++)
    for (let c = 0; c < comps; c++) out[i * comps + c] = glb.buf.readFloatLE(start + i * stride + c * 4);
  return out;
}
function accessorIndices(glb, index) {
  const acc = glb.json.accessors[index];
  const bv = glb.json.bufferViews[acc.bufferView];
  const start = glb.binStart + (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  const stride = bv.byteStride ?? (acc.componentType === 5125 ? 4 : 2);
  const out = new Uint32Array(acc.count);
  for (let i = 0; i < acc.count; i++)
    out[i] =
      acc.componentType === 5125
        ? glb.buf.readUInt32LE(start + i * stride)
        : glb.buf.readUInt16LE(start + i * stride);
  return out;
}

/** World matrices of every node, accumulated through the parent chain (rest pose). */
function nodeWorldTransforms(glb) {
  const nodes = glb.json.nodes;
  const parentOf = new Map();
  nodes.forEach((n, i) => (n.children ?? []).forEach((c) => parentOf.set(c, i)));
  const world = new Map();
  const compose = (node, parent) => {
    const t = node.translation ?? [0, 0, 0];
    const r = node.rotation ?? [0, 0, 0, 1];
    const s = node.scale ?? [1, 1, 1];
    const [x, y, z, w] = r;
    const rot = [
      1 - 2 * (y * y + z * z),
      2 * (x * y + z * w),
      2 * (x * z - y * w),
      2 * (x * y - z * w),
      1 - 2 * (x * x + z * z),
      2 * (y * z + x * w),
      2 * (x * z + y * w),
      2 * (y * z - x * w),
      1 - 2 * (x * x + y * y),
    ];
    const m = [
      rot[0] * s[0],
      rot[1] * s[1],
      rot[2] * s[2],
      rot[3] * s[0],
      rot[4] * s[1],
      rot[5] * s[2],
      rot[6] * s[0],
      rot[7] * s[1],
      rot[8] * s[2],
    ];
    if (!parent) return { m, t };
    const P = parent.m,
      pt = parent.t;
    const pm = [
      P[0] * m[0] + P[1] * m[3] + P[2] * m[6],
      P[0] * m[1] + P[1] * m[4] + P[2] * m[7],
      P[0] * m[2] + P[1] * m[5] + P[2] * m[8],
      P[3] * m[0] + P[4] * m[3] + P[5] * m[6],
      P[3] * m[1] + P[4] * m[4] + P[5] * m[7],
      P[3] * m[2] + P[4] * m[5] + P[5] * m[8],
      P[6] * m[0] + P[7] * m[3] + P[8] * m[6],
      P[6] * m[1] + P[7] * m[4] + P[8] * m[7],
      P[6] * m[2] + P[7] * m[5] + P[8] * m[8],
    ];
    const wt = [
      P[0] * t[0] + P[1] * t[1] + P[2] * t[2] + pt[0],
      P[3] * t[0] + P[4] * t[1] + P[5] * t[2] + pt[1],
      P[6] * t[0] + P[7] * t[1] + P[8] * t[2] + pt[2],
    ];
    return { m: pm, t: wt };
  };
  const build = (i) => {
    if (world.has(i)) return world.get(i);
    const p = parentOf.has(i) ? build(parentOf.get(i)) : null;
    const w = compose(nodes[i], p);
    world.set(i, w);
    return w;
  };
  nodes.forEach((_, i) => build(i));
  return world;
}

const transformPoint = (w, p) => [
  w.m[0] * p[0] + w.m[1] * p[1] + w.m[2] * p[2] + w.t[0],
  w.m[3] * p[0] + w.m[4] * p[1] + w.m[5] * p[2] + w.t[1],
  w.m[6] * p[0] + w.m[7] * p[1] + w.m[8] * p[2] + w.t[2],
];

/** Joint world positions and the `hands` body's rest-pose triangles, read from the GLB. */
function readModel(glb) {
  const world = nodeWorldTransforms(glb);
  const joints = {};
  glb.json.nodes.forEach((n, i) => {
    if (!n.name) return;
    if (['upperarm.L', 'leg.L', 'shin.L', 'hand.L', 'foot.L'].includes(n.name))
      joints[n.name] = transformPoint(world.get(i), [0, 0, 0]);
  });
  let hands = null;
  glb.json.nodes.forEach((n, i) => {
    if (n.name !== 'hands' || n.mesh === undefined) return;
    const prim = glb.json.meshes[n.mesh].primitives[0];
    const arr = accessorValues(glb, prim.attributes.POSITION);
    const positions = new Float32Array(arr.length);
    for (let k = 0; k < arr.length; k += 3) {
      const p = transformPoint(world.get(i), [arr[k], arr[k + 1], arr[k + 2]]);
      positions[k] = p[0];
      positions[k + 1] = p[1];
      positions[k + 2] = p[2];
    }
    const indices =
      prim.indices !== undefined
        ? accessorIndices(glb, prim.indices)
        : Uint32Array.from({ length: arr.length / 3 }, (_, i) => i);
    hands = { positions, indices };
  });
  return { joints, hands };
}

// --------------------------------------------------------------------------- main

const DEFAULT_BASE = 'humanoid-kim';
const DEFAULT_TABLE = 'kim';
const DEFAULT_RECORD = 'out/chibi-sprouts/redesign/measure.json';

function parseArgs(argv) {
  let asset = null;
  let base = DEFAULT_BASE;
  let table = DEFAULT_TABLE;
  let record = DEFAULT_RECORD;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--asset') asset = argv[++i] ?? '';
    else if (argv[i] === '--base') base = argv[++i] ?? '';
    else if (argv[i] === '--table') table = argv[++i] ?? '';
    else if (argv[i] === '--record') record = argv[++i] ?? '';
  }
  return { asset, base, table, record };
}

// The asset-name rule of src/pipeline.ts checkAssetName, copied here so a bad name is refused
// before any import, read or write. Copying keeps the load order of the spec unchanged.
function checkAssetName(name) {
  if (name === null || name.trim() === '') throw new Error('An asset name is required.');
  if (path.isAbsolute(name))
    throw new Error(`Invalid asset name '${name}': an asset name is not an absolute path.`);
  if (name.includes('/') || name.includes('\\'))
    throw new Error(`Invalid asset name '${name}': an asset name has no path separator.`);
  if (name === '.' || name === '..')
    throw new Error(`Invalid asset name '${name}': an asset name has no dot-dot segment.`);
}

/**
 * A base stem names one module of assets/parts. An empty stem, an absolute path, a path
 * separator, or a dot-dot segment is refused before any import (spec "The landmark checks and
 * fixtures").
 */
function checkBaseStem(stem) {
  if (stem === null || stem.trim() === '') return false;
  if (path.isAbsolute(stem)) return false;
  if (stem.includes('/') || stem.includes('\\')) return false;
  if (stem.split(/[\\/]/).some((part) => part === '..' || part === '.')) return false;
  return true;
}

/**
 * The destination checks of spec "The destinations". The check uses `lstat`, never `stat`, so it
 * never follows a link. It runs before the first `mkdir` or write, so a rejected destination
 * leaves every existing file byte-identical.
 *
 * Returns the one-line error, or null when the destination may be written.
 */
export function destinationError(root, dest, treeRel) {
  const tree = path.resolve(root, treeRel);
  const abs = path.resolve(dest);
  if (abs !== tree && !abs.startsWith(tree + path.sep)) return `destination outside ${treeRel}: ${dest}`;
  let current = abs;
  for (;;) {
    const st = lstatSync(current, { throwIfNoEntry: false });
    if (st) {
      if (st.isSymbolicLink()) return `destination is a link: ${path.relative(root, current)}`;
      if (current === abs && st.isDirectory())
        return `destination is a directory: ${path.relative(root, current)}`;
      if (current !== abs && !st.isDirectory())
        return `destination parent is a file: ${path.relative(root, current)}`;
    }
    const parent = path.dirname(current);
    if (current === root || parent === current) break;
    current = parent;
  }
  return null;
}

async function main() {
  const { asset, base: baseStem, table, record: recordArg } = parseArgs(process.argv.slice(2));
  try {
    checkAssetName(asset);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  if (!checkBaseStem(baseStem)) {
    console.error(`unknown base ${baseStem}`);
    process.exit(1);
  }
  if (!TABLE_NAMES.includes(table)) {
    console.error(`unknown table ${table}: known ${TABLE_NAMES.join(', ')}`);
    process.exit(1);
  }

  // 2. existence check BEFORE any asset or base import
  const assetPath = path.join(ROOT, 'assets', `${asset}.ts`);
  const glbPath = path.join(ROOT, 'out', asset, `${asset}.glb`);
  for (const [p, label] of [
    [assetPath, `assets/${asset}.ts`],
    [glbPath, `out/${asset}/${asset}.glb`],
  ]) {
    if (!existsSync(p)) {
      console.error(`asset ${asset}: not built`);
      console.error(`missing: ${label}`);
      process.exit(1);
    }
  }
  const basePath = path.join(ROOT, 'assets', 'parts', `${baseStem}.ts`);
  if (!existsSync(basePath)) {
    console.error(`base ${baseStem}: not built`);
    console.error(`missing: assets/parts/${baseStem}.ts`);
    process.exit(1);
  }

  // The record destination is checked before the first write, so a refused destination leaves
  // the output tree byte-identical.
  const recordPath = path.resolve(ROOT, recordArg);
  const recordError = destinationError(ROOT, recordPath, 'out/');
  if (recordError) {
    console.error(recordError);
    process.exit(1);
  }

  // 3. asset variants
  const mod = await import(pathToFileURL(assetPath).href);
  const variants = mod.default?.variants ?? {};
  const skinColor = hexToRgb(variants.skin?.fair ?? Object.values(variants.skin ?? {})[0] ?? '#f2c7a4');
  const eyeColor = hexToRgb(variants.eyes?.brown ?? Object.values(variants.eyes ?? {})[0] ?? '#6e4020');
  const eyeColors = Object.values(variants.eyes ?? {}).map((c) => hexToRgb(c));
  const castMeta = mod.castMeta ?? null;
  // The Lily hair check reads the declared hair colour. An asset without one is refused.
  let hairRgb = null;
  if (asset === 'sprout-lily-kim') {
    const hair = variants.hair ? Object.values(variants.hair)[0] : null;
    if (!hair) {
      console.error('hair colour: not declared');
      process.exit(1);
    }
    hairRgb = hexToRgb(hair);
  }

  // 4. base landmarks
  const base = await import(pathToFileURL(basePath).href);
  const chinY = base.BASE_CHIN_Y ?? base.KIM_CHIN_Y;
  const crownY = base.BASE_CROWN_Y ?? base.KIM?.crown;
  const handsLandmarks = base.BASE_HANDS ?? base.KIM_HANDS;

  const flatFront = path.join(ROOT, 'out', asset, 'flat', 'front-level.png');
  const flatSide = path.join(ROOT, 'out', asset, 'flat', 'side-level.png');
  const litFront = path.join(ROOT, 'out', asset, 'views', 'front-level.png');
  const litSide = path.join(ROOT, 'out', asset, 'views', 'side-level.png');
  for (const p of [flatFront, flatSide, litFront, litSide]) {
    if (!existsSync(p)) {
      console.error(`asset ${asset}: not built`);
      console.error(`missing: ${path.relative(ROOT, p)}`);
      process.exit(1);
    }
  }

  // 5. read renders and the model
  const stats = JSON.parse(readFileSync(path.join(ROOT, 'out', asset, 'stats.json'), 'utf8'));
  const bounds = stats.bounds;
  const cx = (bounds.min[0] + bounds.max[0]) / 2;
  const cy = (bounds.min[1] + bounds.max[1]) / 2;
  const cz = (bounds.min[2] + bounds.max[2]) / 2;
  const size = Math.max(...bounds.size);
  const H = size * 1.1;
  const imageSize = 1024;
  const ppm = imageSize / H;
  const projFront = (p) => [(p[0] - cx) * ppm + imageSize / 2, (cy - p[1]) * ppm + imageSize / 2];
  const projSide = (p) => [(cz - p[2]) * ppm + imageSize / 2, (cy - p[1]) * ppm + imageSize / 2];

  const ff = await readPng(flatFront);
  const fs_ = await readPng(flatSide);
  const lf = await readPng(litFront);
  const ls = await readPng(litSide);
  let glb;
  let model;
  try {
    glb = readGlb(glbPath);
    model = readModel(glb);
  } catch {
    // A corrupt or truncated GLB gets one named line: no stack, no measure.json write.
    console.error(`Invalid GLB: ${path.relative(ROOT, glbPath)}`);
    process.exit(1);
  }
  const { joints, hands } = model;
  const need = ['upperarm.L', 'leg.L', 'shin.L', 'hand.L', 'foot.L'];
  for (const n of need)
    if (!joints[n]) {
      console.error(`GUARD model: missing joint ${n}`);
      process.exit(1);
    }
  if (!hands) {
    console.error('GUARD model: missing hands body');
    process.exit(1);
  }

  const shoulder = projFront(joints['upperarm.L']);
  const hip = projFront(joints['leg.L']);
  const kneeV = projFront(joints['shin.L'])[1];
  const wristV = projFront(joints['hand.L'])[1];
  const ankleU = projFront(joints['foot.L'])[0];
  // fingertip: lowest hands vertex on the left (x > 0)
  let tip = null;
  const P = hands.positions;
  for (let k = 0; k < P.length; k += 3)
    if (P[k] > 0 && (!tip || P[k + 1] < tip[1])) tip = [P[k], P[k + 1], P[k + 2]];
  if (!tip) {
    console.error('GUARD model: no left-hand fingertip');
    process.exit(1);
  }
  const tipProj = projFront(tip);

  const handZ = [];
  for (let k = 0; k < P.length; k += 3) handZ.push(P[k + 2]);
  const handDepth = Math.max(...handZ) - Math.min(...handZ);
  const legWindowR = [Math.min(ankleU, hip[0]) - 0.03 * ppm, Math.max(ankleU, hip[0]) + 0.03 * ppm];
  const legWindowL = [imageSize - legWindowR[1], imageSize - legWindowR[0]];

  const figure = {
    front: ff,
    side: fs_,
    skinRgb: skinColor,
    eyeRgb: eyeColor,
    eyeColors,
    assetName: asset,
    hairRgb,
    castMeta,
    ppm,
    chinRow: projFront([0, chinY, 0])[1],
    // The projected crown is the base landmark, not the top of the silhouette: a bun or a hat
    // rises above the skull and must not move the measured head.
    projectedTop: projFront([0, crownY, 0])[1],
    projectedSole: projFront([0, bounds.min[1], 0])[1],
    tipV: tipProj[1],
    handDepth,
    legWindowL,
    legWindowR,
    landmarks: { shoulder, hip, kneeV, wristV, ankleU, tipU: tipProj[0] },
  };
  const m = measureFigure(figure, table);

  // palms from the real hands body and KIM_HANDS
  const palms = {};
  for (const side of ['L', 'R']) {
    // split the hands body into one side by x sign, keeping triangles wholly on that side
    const sign = side === 'L' ? 1 : -1;
    const remap = new Map();
    const positions = [];
    for (let k = 0; k < P.length; k += 3) {
      if (sign * P[k] <= 0) continue;
      remap.set(k / 3, positions.length / 3);
      positions.push(P[k], P[k + 1], P[k + 2]);
    }
    const indices = [];
    for (let t = 0; t < hands.indices.length; t += 3) {
      const [a, b, c] = [hands.indices[t], hands.indices[t + 1], hands.indices[t + 2]];
      if (remap.has(a) && remap.has(b) && remap.has(c))
        indices.push(remap.get(a), remap.get(b), remap.get(c));
    }
    palms[side] = palmCheck(
      side,
      { positions: new Float32Array(positions), indices: new Uint32Array(indices) },
      handsLandmarks[side],
    );
  }

  const order = [
    'crownSole',
    'chin',
    'headWidth',
    'eyeWindow',
    'eyeComponents',
    'face',
    'faceWidth',
    'bodyRows',
    'guards',
    'handEdge',
    'palms',
  ];
  const rows = {};
  for (const r of m.rows)
    rows[r.name] = { value: r.value, lo: r.lo, hi: r.hi, pass: r.value >= r.lo && r.value <= r.hi };

  // lit rows from the lit masks
  const litRows = {};
  for (const [name, img] of [
    ['front', lf],
    ['side', ls],
  ]) {
    let crown = img.height,
      sole = 0;
    for (let y = 0; y < img.height; y++)
      for (let x = 0; x < img.width; x++)
        if (px(img, x, y)[3] >= 128) {
          if (y < crown) crown = y;
          if (y > sole) sole = y;
        }
    litRows[name] = { crown, sole, height: sole - crown };
  }
  rows.lit = litRows;

  const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
  const record = {
    asset,
    base: baseStem,
    baseSha256: sha(basePath),
    order,
    rows,
    imageSize,
    ppm,
    ppmSource: 'max(stats.bounds.size) * 1.10',
    glb: path.relative(ROOT, glbPath),
    glbSha256: sha(glbPath),
    flatFront: path.relative(ROOT, flatFront),
    flatSide: path.relative(ROOT, flatSide),
    litFront: path.relative(ROOT, litFront),
    litSide: path.relative(ROOT, litSide),
    flatFrontSha256: sha(flatFront),
    flatSideSha256: sha(flatSide),
    litFrontSha256: sha(litFront),
    litSideSha256: sha(litSide),
    detail: m.detail,
    guards: m.guards,
    handEdge: m.handEdge,
    sideSign: m.sideSign,
    palms,
  };
  // The declared face marks are copied into the record, so the record shows the colour the eye
  // mask used.
  if (castMeta?.faceMarks) record.faceMarks = castMeta.faceMarks;
  mkdirSync(path.dirname(recordPath), { recursive: true });
  writeFileSync(recordPath, JSON.stringify(record, null, 2) + '\n');

  for (const r of m.rows)
    console.log(
      `${r.name} ${fmt(r.value)} ${r.lo}..${r.hi} ${r.value >= r.lo && r.value <= r.hi ? 'pass' : 'FAIL'}`,
    );
  for (const g of m.guards) console.log(g);
  for (const side of ['L', 'R']) {
    const p = palms[side];
    console.log(`palm ${side}: ${p.ok ? 'ok' : p.failure}`);
  }
  const failures = [...m.failures, ...m.guards];
  for (const side of ['L', 'R']) if (!palms[side].ok) failures.push(palms[side].failure);
  if (failures.length) {
    for (const f of failures) console.error(f);
    process.exit(1);
  }
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e?.stack ?? String(e));
    process.exit(1);
  });
}
