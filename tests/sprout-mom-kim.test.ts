import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Phase 3 Red: pin the measurement contract of scripts/proportion-check.mjs.
 *
 * Every case that needs the script loads it INSIDE the case: pure-logic cases
 * dynamic-import the module through a variable file URL (so a missing module
 * fails the case, never the file), and script-run cases spawn it through tsx.
 * At Red the script does not exist, so every case but the AC1 skip guard fails
 * inside the case. At T6 (script present, asset absent) only the end-to-end
 * and real-hand cases fail, on the named missing-asset error. At T7 all pass.
 *
 * Contract the T6 script implements (fixed here, so Green decides nothing):
 * - checkRows(rows: Array<{ name, value, lo, hi }>): string[] — one
 *   `FAIL <name>: <value> not in <lo>..<hi>` per failing row, [] when all pass.
 * - palmCheck(side, mesh, landmarks) — exactly the API, order, return shape,
 *   and seven named failures of spec "The palm check API".
 * - measurePixels(): FigureResult[] — the five synthetic figures of spec AC2
 *   rule 7, in order, each { name, ok, failures, params, handEdge, sideSign }.
 *   The params carry the spec mutation numbers (crownScale 1.15, soleLower
 *   0.10, headWiden 0.12, eyeGap 0.060 with eyeWidth 0.064). handEdge carries
 *   the front-hand-edge record (counted/total rows, min gap px, front width
 *   px, limit px, absent rows such as `row <v>: no leg run`, pass flag).
 *   sideSign carries the side-view guard (frontmost column, limit column
 *   W/2 - 0.02*ppm, pass flag).
 * - `tsx scripts/proportion-check.mjs --asset <name>` exits 1 with
 *   `asset <name>: not built` before any import when the asset is missing,
 *   exits 0 and writes out/chibi-sprouts/redesign/measure.json when it passes.
 *   measure.json holds the loading order, each evaluation-order value, each
 *   row with its value and range, the image size, ppm, both render paths,
 *   the SHA-256 of each render, the lit rows under rows.lit, and both palms
 *   under palms with an ok flag per side.
 *
 * The synthetic palm fixture below is the spec fixture verbatim: a palm box
 * x 0.150-0.190, y 0.450-0.520, z 0.030-0.090; a thumb box x 0.170-0.190,
 * y 0.495-0.505, z 0.090-0.115; a fingers box x 0.155-0.185, y 0.430-0.450,
 * z 0.035-0.085; every box face split into 16x16 quads with outward winding
 * (vertex spacing 0.0025 m, over 200 vertices). Landmarks: palmCentre on the
 * palm face at [0.150, centroid y, centroid z], thumbTip [0.190, 0.500,
 * 0.115], fingerTip [0.170, 0.430, 0.060].
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = join(ROOT, 'scripts', 'proportion-check.mjs');
const TSX = join(ROOT, 'node_modules', '.bin', 'tsx');

function scriptUrl(): string {
  return pathToFileURL(SCRIPT).href;
}

async function loadScript(): Promise<any> {
  return await import(scriptUrl());
}

function runScript(args: string[]): { status: number | null; output: string } {
  const result = spawnSync(TSX, [SCRIPT, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 300_000,
    env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' },
  });
  return { status: result.status, output: `${result.stdout || ''}\n${result.stderr || ''}` };
}

type Row = { name: string; value: number; lo: number; hi: number };

function passRows(): Row[] {
  return [
    { name: 'heightInHeads', value: 3.64, lo: 3.54, hi: 3.74 },
    { name: 'armToTorso', value: 1.33, lo: 1.25, hi: 1.41 },
    { name: 'legShare', value: 0.39, lo: 0.36, hi: 0.42 },
    { name: 'headToShoulders', value: 1.19, lo: 1.11, hi: 1.27 },
    { name: 'wrist', value: -0.06, lo: -0.16, hi: 0.04 },
    { name: 'fingertips', value: 0.51, lo: 0.41, hi: 0.61 },
    { name: 'eyeLine', value: 0.62, lo: 0.59, hi: 0.65 },
    { name: 'eyeHeight', value: 0.11, lo: 0.09, hi: 0.13 },
    { name: 'spacingHead', value: 0.38, lo: 0.35, hi: 0.41 },
    { name: 'eyeWidthFace', value: 0.23, lo: 0.22, hi: 0.24 },
    { name: 'spacingFace', value: 0.47, lo: 0.44, hi: 0.5 },
  ];
}

type Mesh = { positions: Float32Array; indices: Uint32Array };

function buildBox(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  seg: number,
): { positions: number[]; indices: number[] } {
  const positions: number[] = [];
  const indices: number[] = [];
  const faces: Array<{ o: number[]; u: number[]; v: number[] }> = [
    { o: [x1, y0, z0], u: [0, y1 - y0, 0], v: [0, 0, z1 - z0] },
    { o: [x0, y0, z0], u: [0, 0, z1 - z0], v: [0, y1 - y0, 0] },
    { o: [x0, y1, z0], u: [0, 0, z1 - z0], v: [x1 - x0, 0, 0] },
    { o: [x0, y0, z0], u: [x1 - x0, 0, 0], v: [0, 0, z1 - z0] },
    { o: [x0, y0, z1], u: [x1 - x0, 0, 0], v: [0, y1 - y0, 0] },
    { o: [x1, y0, z0], u: [0, y1 - y0, 0], v: [x1 - x0, 0, 0] },
  ];
  for (const f of faces) {
    const base = positions.length / 3;
    for (let i = 0; i <= seg; i += 1) {
      for (let j = 0; j <= seg; j += 1) {
        positions.push(
          f.o[0]! + (f.u[0]! * i) / seg + (f.v[0]! * j) / seg,
          f.o[1]! + (f.u[1]! * i) / seg + (f.v[1]! * j) / seg,
          f.o[2]! + (f.u[2]! * i) / seg + (f.v[2]! * j) / seg,
        );
      }
    }
    for (let i = 0; i < seg; i += 1) {
      for (let j = 0; j < seg; j += 1) {
        const a = base + i * (seg + 1) + j;
        const b = base + (i + 1) * (seg + 1) + j;
        const c = base + i * (seg + 1) + j + 1;
        const d = base + (i + 1) * (seg + 1) + j + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
  }
  return { positions, indices };
}

function syntheticHand(): {
  mesh: Mesh;
  landmarks: { palmCentre: number[]; thumbTip: number[]; fingerTip: number[] };
} {
  const parts = [
    buildBox(0.15, 0.19, 0.45, 0.52, 0.03, 0.09, 16),
    buildBox(0.17, 0.19, 0.495, 0.505, 0.09, 0.115, 16),
    buildBox(0.155, 0.185, 0.43, 0.45, 0.035, 0.085, 16),
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  for (const part of parts) {
    const base = positions.length / 3;
    positions.push(...part.positions);
    for (const ix of part.indices) indices.push(base + ix);
  }
  let cy = 0;
  let cz = 0;
  const n = positions.length / 3;
  for (let k = 0; k < n; k += 1) {
    cy += positions[k * 3 + 1]!;
    cz += positions[k * 3 + 2]!;
  }
  cy /= n;
  cz /= n;
  return {
    mesh: { positions: new Float32Array(positions), indices: new Uint32Array(indices) },
    landmarks: { palmCentre: [0.15, cy, cz], thumbTip: [0.19, 0.5, 0.115], fingerTip: [0.17, 0.43, 0.06] },
  };
}

function patchCentres(mesh: Mesh, palmCentre: number[]): number[] {
  let cx = 0;
  let cy = 0;
  let cz = 0;
  const n = mesh.positions.length / 3;
  for (let k = 0; k < n; k += 1) {
    cx += mesh.positions[k * 3]!;
    cy += mesh.positions[k * 3 + 1]!;
    cz += mesh.positions[k * 3 + 2]!;
  }
  cx /= n;
  cy /= n;
  cz /= n;
  const dx = palmCentre[0]! - cx;
  const dy = palmCentre[1]! - cy;
  const dz = palmCentre[2]! - cz;
  const len = Math.hypot(dx, dy, dz);
  const nx = dx / len;
  const ny = dy / len;
  const nz = dz / len;
  const patch: number[] = [];
  for (let t = 0; t < mesh.indices.length; t += 3) {
    const a = mesh.indices[t]! * 3;
    const b = mesh.indices[t + 1]! * 3;
    const c = mesh.indices[t + 2]! * 3;
    const mx = (mesh.positions[a]! + mesh.positions[b]! + mesh.positions[c]!) / 3;
    const my = (mesh.positions[a + 1]! + mesh.positions[b + 1]! + mesh.positions[c + 1]!) / 3;
    const mz = (mesh.positions[a + 2]! + mesh.positions[b + 2]! + mesh.positions[c + 2]!) / 3;
    const plane = Math.abs(
      (mx - palmCentre[0]!) * nx + (my - palmCentre[1]!) * ny + (mz - palmCentre[2]!) * nz,
    );
    const dist = Math.hypot(mx - palmCentre[0]!, my - palmCentre[1]!, mz - palmCentre[2]!);
    if (plane <= 0.004 && dist <= 0.03) patch.push(t);
  }
  return patch;
}

function mirrorAboutX(mesh: Mesh): Mesh {
  const positions = new Float32Array(mesh.positions);
  for (let k = 0; k < positions.length / 3; k += 1) positions[k * 3] = -positions[k * 3]!;
  const indices = new Uint32Array(mesh.indices);
  for (let t = 0; t < indices.length; t += 3) {
    const tmp = indices[t + 1]!;
    indices[t + 1] = indices[t + 2]!;
    indices[t + 2] = tmp;
  }
  return { positions, indices };
}

function turnAboutFingerAxis(
  mesh: Mesh,
  landmarks: { palmCentre: number[]; thumbTip: number[]; fingerTip: number[] },
): { mesh: Mesh; landmarks: { palmCentre: number[]; thumbTip: number[]; fingerTip: number[] } } {
  const c = landmarks.palmCentre;
  const f = landmarks.fingerTip;
  const ax = [f[0]! - c[0]!, f[1]! - c[1]!, f[2]! - c[2]!];
  const len = Math.hypot(ax[0]!, ax[1]!, ax[2]!);
  const ux = ax[0]! / len;
  const uy = ax[1]! / len;
  const uz = ax[2]! / len;
  const rot = (p: number[]): number[] => {
    const vx = p[0]! - c[0]!;
    const vy = p[1]! - c[1]!;
    const vz = p[2]! - c[2]!;
    const dot = vx * ux + vy * uy + vz * uz;
    return [c[0]! + 2 * dot * ux - vx, c[1]! + 2 * dot * uy - vy, c[2]! + 2 * dot * uz - vz];
  };
  const positions = new Float32Array(mesh.positions.length);
  for (let k = 0; k < mesh.positions.length / 3; k += 1) {
    const p = rot([mesh.positions[k * 3]!, mesh.positions[k * 3 + 1]!, mesh.positions[k * 3 + 2]!]);
    positions[k * 3] = p[0]!;
    positions[k * 3 + 1] = p[1]!;
    positions[k * 3 + 2] = p[2]!;
  }
  return {
    mesh: { positions, indices: new Uint32Array(mesh.indices) },
    landmarks: {
      palmCentre: rot(landmarks.palmCentre),
      thumbTip: rot(landmarks.thumbTip),
      fingerTip: rot(landmarks.fingerTip),
    },
  };
}

const SCRAPPED_DIR = join(ROOT, 'tests');
const SCRAPPED_FILES = ['sprout-base.test.ts', 'sprout-gestures.test.ts', 'sprout-gesture-offset.test.ts'];
const HERO_DESCRIBE = 'hero clip contracts (not scrapped)';
const HERO_TESTS = [
  'keeps the hero clip inventory: the 8 base clips',
  'keeps the hero default pose digest: size 8, digest 68442177',
  'keeps the hero cheer wrist-to-head distance: 0.27635 m',
];
const REASON = '// sprout base scrapped 2026-11-23 (Daniel)';
const SKIP_SUFFIX = '— sprout base scrapped 2026-11-23 (Daniel)';

describe('sprout-mom-kim measurement (Red pin)', () => {
  it('AC1 skip guard: the scrapped contracts stay skipped and the hero stays tested', () => {
    const texts = SCRAPPED_FILES.map((f) => readFileSync(join(SCRAPPED_DIR, f), 'utf8'));
    for (const [i, text] of texts.entries()) {
      expect(text.includes(REASON), `${SCRAPPED_FILES[i]} reason comment`).toBe(true);
    }
    const offset = texts[2]!;
    expect(offset.includes(HERO_DESCRIBE), 'hero describe').toBe(true);
    for (const name of HERO_TESTS) {
      expect(offset.includes(name), `hero test ${name}`).toBe(true);
    }
    const skipCounts = texts.map((t) => (t.match(/describe\.skip\(/g) || []).length);
    expect(skipCounts).toEqual([1, 1, 2]);
    for (const text of texts) {
      for (const m of text.matchAll(/describe\.skip\('([^']*)'/g)) {
        expect(m[1]!.endsWith(SKIP_SUFFIX), `skip title ${m[1]}`).toBe(true);
      }
    }
  });

  it('level and orthographic proof: a missing asset fails before any import', { timeout: 300_000 }, () => {
    const name = '__missing_probe_asset__';
    const result = runScript(['--asset', name]);
    expect(result.status).toBe(1);
    expect(result.output).toContain(`asset ${name}: not built`);
    expect(result.output).toMatch(/assets[\\/]__missing_probe_asset__\.ts|out[\\/]__missing_probe_asset__/);
    expect(result.output).not.toMatch(/Cannot find module|ERR_MODULE_NOT_FOUND|Cannot find package/);
  });

  it('pass table: every row passes', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    expect(mod.checkRows(passRows())).toEqual([]);
  });

  for (const row of passRows()) {
    it(`doctored row ${row.name} fails with the row name`, { timeout: 300_000 }, async () => {
      const mod = await loadScript();
      const doctored = passRows().map((r) => (r.name === row.name ? { ...r, value: r.hi + 0.001 } : r));
      const failures: string[] = mod.checkRows(doctored);
      expect(failures).toHaveLength(1);
      expect(failures[0]).toMatch(new RegExp(`^FAIL ${row.name}: .* not in .*$`));
    });
  }

  it('synthetic figure pass holds every row', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    const figs = mod.measurePixels();
    expect(figs.map((f: any) => f.name)).toEqual([
      'pass',
      'crown-high',
      'sole-low',
      'wide-head',
      'merged-eyes',
    ]);
    const pass = figs[0];
    expect(pass.ok).toBe(true);
    expect(pass.failures).toEqual([]);
    expect(pass.params).toEqual({});
  });

  it('synthetic figure crown 15% higher fails heightInHeads', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    const figs = mod.measurePixels();
    const fig = figs.find((f: any) => f.name === 'crown-high');
    expect(fig.params).toEqual({ crownScale: 1.15 });
    expect(fig.ok).toBe(false);
    expect(fig.failures).toHaveLength(1);
    expect(fig.failures[0]).toMatch(/^FAIL heightInHeads: .* not in .*$/);
  });

  it('synthetic figure sole 10% lower fails legShare', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    const figs = mod.measurePixels();
    const fig = figs.find((f: any) => f.name === 'sole-low');
    expect(fig.params).toEqual({ soleLower: 0.1 });
    expect(fig.ok).toBe(false);
    expect(fig.failures).toHaveLength(1);
    expect(fig.failures[0]).toMatch(/^FAIL legShare: .* not in .*$/);
  });

  it('synthetic figure wide head fails headToShoulders', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    const figs = mod.measurePixels();
    const fig = figs.find((f: any) => f.name === 'wide-head');
    expect(fig.params).toEqual({ headWiden: 0.12 });
    expect(fig.ok).toBe(false);
    expect(fig.failures).toHaveLength(1);
    expect(fig.failures[0]).toMatch(/^FAIL headToShoulders: .* not in .*$/);
  });

  it('synthetic figure merged eyes fails with one blob', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    const figs = mod.measurePixels();
    const fig = figs.find((f: any) => f.name === 'merged-eyes');
    expect(fig.params).toEqual({ eyeGap: 0.06, eyeWidth: 0.064 });
    expect(fig.ok).toBe(false);
    expect(fig.failures).toEqual(['eye components: found 1, expected 2']);
  });

  it('synthetic palm passes all seven checks', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    const { mesh, landmarks } = syntheticHand();
    expect(mesh.positions.length / 3).toBeGreaterThan(200);
    const result = mod.palmCheck('L', mesh, landmarks);
    expect(result.ok).toBe(true);
    expect(result.sideDot).toBeCloseTo(-1, 6);
    expect(result.agreement).toBeCloseTo(1, 6);
    expect(result.palmContact).toBeLessThanOrEqual(0.0018);
    expect(result.thumbContact).toBeLessThanOrEqual(1e-9);
    expect(result.thumbOut).toBeCloseTo(0.04, 6);
    expect(result.thumbForward).toBeGreaterThanOrEqual(0.025);
  });

  it('synthetic palm with flipped winding fails check 4', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    const { mesh, landmarks } = syntheticHand();
    const patch = patchCentres(mesh, landmarks.palmCentre);
    expect(patch.length).toBeGreaterThan(0);
    const indices = new Uint32Array(mesh.indices);
    for (const t of patch) {
      const tmp = indices[t + 1]!;
      indices[t + 1] = indices[t + 2]!;
      indices[t + 2] = tmp;
    }
    const result = mod.palmCheck('L', { positions: mesh.positions, indices }, landmarks);
    expect(result.ok).toBe(false);
    expect(result.failure).toBe('hand L: palm surface faces away from the declared normal');
  });

  it('synthetic palm mirrored fails check 7', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    const { mesh, landmarks } = syntheticHand();
    const mirrored = mirrorAboutX(mesh);
    const mirroredLandmarks = {
      palmCentre: [-landmarks.palmCentre[0]!, landmarks.palmCentre[1]!, landmarks.palmCentre[2]!],
      thumbTip: [-landmarks.thumbTip[0]!, landmarks.thumbTip[1]!, landmarks.thumbTip[2]!],
      fingerTip: [-landmarks.fingerTip[0]!, landmarks.fingerTip[1]!, landmarks.fingerTip[2]!],
    };
    const result = mod.palmCheck('L', mirrored, mirroredLandmarks);
    expect(result.ok).toBe(false);
    expect(result.failure).toBe('hand L: palm faces away from the body');
  });

  it('synthetic palm turned 180 degrees fails check 6', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    const { mesh, landmarks } = syntheticHand();
    const turned = turnAboutFingerAxis(mesh, landmarks);
    const result = mod.palmCheck('L', turned.mesh, turned.landmarks);
    expect(result.ok).toBe(false);
    expect(result.failure).toBe('hand L: thumb not on the radial front edge');
  });

  it('hand edge: separated hands clear the leg with a 2 px gap', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    const figs = mod.measurePixels();
    const pass = figs.find((f: any) => f.name === 'pass');
    expect(pass.handEdge.total).toBeGreaterThan(0);
    expect(pass.handEdge.counted / pass.handEdge.total).toBeGreaterThanOrEqual(0.8);
    expect(pass.handEdge.minGapPx).toBeGreaterThanOrEqual(2);
    expect(pass.handEdge.pass).toBe(true);
  });

  it('hand edge: the front width is within 0.60 of depth times ppm', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    const figs = mod.measurePixels();
    const pass = figs.find((f: any) => f.name === 'pass');
    expect(pass.handEdge.limitPx).toBeGreaterThan(0);
    expect(pass.handEdge.frontWidthPx).toBeLessThanOrEqual(pass.handEdge.limitPx);
    expect(pass.handEdge.pass).toBe(true);
  });

  it('hand edge: a row with no leg run is named in the record', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    const figs = mod.measurePixels();
    const fig = figs.find((f: any) => f.name === 'merged-eyes');
    expect(fig.handEdge.pass).toBe(true);
    expect(fig.handEdge.absentRows.some((r: string) => /^row \d+: no (leg|hand) run$/.test(r))).toBe(true);
  });

  it('side sign: the frontmost head-band column sits left of centre', { timeout: 300_000 }, async () => {
    const mod = await loadScript();
    const figs = mod.measurePixels();
    const pass = figs.find((f: any) => f.name === 'pass');
    expect(pass.sideSign.pass).toBe(true);
    expect(pass.sideSign.frontmostCol).toBeLessThanOrEqual(pass.sideSign.limitCol);
  });

  it('real hand: both hands pass all seven checks', { timeout: 300_000 }, () => {
    const result = runScript(['--asset', 'sprout-mom-kim']);
    expect(result.status).toBe(0);
    const record = JSON.parse(
      readFileSync(join(ROOT, 'out', 'chibi-sprouts', 'redesign', 'measure.json'), 'utf8'),
    );
    expect(record.palms.L.ok).toBe(true);
    expect(record.palms.R.ok).toBe(true);
  });

  it('end to end: the script passes sprout-mom-kim and writes measure.json', { timeout: 300_000 }, () => {
    const result = runScript(['--asset', 'sprout-mom-kim']);
    expect(result.status).toBe(0);
    const record = JSON.parse(
      readFileSync(join(ROOT, 'out', 'chibi-sprouts', 'redesign', 'measure.json'), 'utf8'),
    );
    const rowNames = [
      'heightInHeads',
      'armToTorso',
      'legShare',
      'headToShoulders',
      'wrist',
      'fingertips',
      'eyeLine',
      'eyeHeight',
      'spacingHead',
      'eyeWidthFace',
      'spacingFace',
    ];
    for (const name of rowNames) {
      expect(record.rows[name], `row ${name}`).toBeDefined();
      expect(record.rows[name].value).toBeGreaterThanOrEqual(record.rows[name].lo);
      expect(record.rows[name].value).toBeLessThanOrEqual(record.rows[name].hi);
    }
    expect(record.order.length).toBeGreaterThan(0);
    expect(record.imageSize).toBe(1024);
    expect(record.ppm).toBeGreaterThan(0);
    expect(record.flatFront).toContain('flat/front-level.png');
    expect(record.flatSide).toContain('flat/side-level.png');
    expect(record.flatFrontSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(record.flatSideSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(record.rows.lit).toBeDefined();
  });
});
