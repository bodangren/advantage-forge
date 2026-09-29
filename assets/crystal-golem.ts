import { defineAsset, motion, noise, rgb, sdf } from '../src/index.js';

/**
 * Crystal golem — Chibi Quest P1 dungeon enemy, about 1.15 m tall to the top spike, faces +Z.
 * Target: docs/enemy-mockups/crystal-golem_001.jpg (one front view).
 *
 * Base: assets/stone-golem.ts (the same heavy rig, knee bones, and clip set). Every boulder is
 *   replaced by a plain union of sharp pyramid shards (no smooth blends, `flat: true`).
 * Role: a slow dungeon brute; at 128 px the spiky crown, the huge shoulder clusters, the cyan
 *   eye slit, and the chest core diamond must read.
 * One idea: a body of pale violet crystal shards bristling with spikes, one cyan glow at the
 *   face and one at the chest.
 * Shape language: triangular and spiky over square, chunky limbs.
 * Palette: crystal #b8b0f0 (slot `crystal`), lit +35 percent, shade -25 percent; glow #4fe8ff (slot
 *   `glow`) on emissive parts; four white sparkles.
 * Bodies: crystal (skinned: trunk, limbs, and every shard cluster), eyes (slit bar), core (chest
 *   diamond), sparkleHead, sparkleChest.
 * Proportions: crown top 1.15, head block 0.86, shoulder spikes to 0.95 and 0.56 m out, core 0.6,
 *   fists 0.17 to 0.56, pelvis spike tip 0.13, feet flat on y 0.
 * Rig: the stone golem rig. Clips: idle, walk, run, attack (two-fist slam), attack2 (a shoulder
 *   charge and a wide backhand), roar, hit, death.
 */

type V3 = readonly [number, number, number];

const mx = (p: V3): V3 => [-p[0], p[1], p[2]];
const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};
const DEG_ = 180 / Math.PI;
const rnd = (a: number, b: number, c: number) => noise.random(a, b, c);

// Joints: high, wide shoulders, arms hanging far out, a short wide stance.
const SHOULDER: V3 = [0.3, 0.68, 0];
const ELBOW: V3 = [0.4, 0.53, 0.03];
const WRIST: V3 = [0.45, 0.4, 0.06];
const HIP: V3 = [0.13, 0.3, 0];
const KNEE: V3 = [0.16, 0.19, 0.005]; // the knee: splits the leg (shin.L takes the weight below it)
const ANKLE: V3 = [0.18, 0.09, 0.01];
// The ends of the flat bottom of the left foot block (y = 0): heel and toe.
const SOLE_HEEL: V3 = [0.18, 0, -0.1];
const SOLE_TOE: V3 = [0.18, 0, 0.15];
const HEAD_Y = 0.83;

/** Turn a shape built along +Y so that +Y points along `dir`. */
const aim = (s: sdf.Shape, dir: V3): sdf.Shape => {
  const d = norm(dir);
  const polar = Math.acos(Math.max(-1, Math.min(1, d[1]))) * DEG_;
  const az = Math.atan2(d[0], d[2]) * DEG_;
  return s.rotateX(polar).rotateY(az);
};

/**
 * A crystal shard: an n-sided pyramid with its base center at the origin and its tip at
 * (0, len, 0); `w` is the half width of the base. It reaches a little below the base so shards sink
 * into whatever they sit on.
 */
const pyramid = (len: number, w: number, sides = 5, spin = 0): sdf.Shape => {
  const a = Math.atan2(w, len); // half angle of the tip
  const planes: sdf.Shape[] = [sdf.halfSpace([0, -1, 0], Math.min(0.03, len * 0.2))];
  for (let i = 0; i < sides; i++) {
    const t = (i / sides) * Math.PI * 2;
    planes.push(sdf.halfSpace([Math.cos(a) * Math.cos(t), Math.sin(a), Math.cos(a) * Math.sin(t)], Math.sin(a) * len));
  }
  const bound = sdf.box([w * 2.6, len * 1.25, w * 2.6]).at(0, len * 0.5 - 0.02, 0);
  return planes.reduce((acc, p) => acc.intersect(p), bound).rotateY(spin);
};

/** A shard standing on `at` and pointing along `dir`. */
const shard = (at: V3, dir: V3, len: number, w: number, sides = 5, spin = 0) => aim(pyramid(len, w, sides, spin), dir).at(...at);

/** A chunky crystal block: a box with corner cuts at random angles (no rounding, no noise). */
const block = (size: V3, seed: number, cut = 0.8, flatBottom = false): sdf.Shape => {
  const h: V3 = [size[0] / 2, size[1] / 2, size[2] / 2];
  let s: sdf.Shape = sdf.box(size);
  for (let i = 0; i < 10; i++) {
    const r = (j: number) => rnd(seed, i, j);
    const sg = (j: number) => (r(j) < 0.5 ? -1 : 1);
    const ny = flatBottom ? 0.25 + r(4) : sg(3) * (0.25 + r(4));
    const n = norm([sg(1) * (0.25 + r(2)), ny, sg(5) * (0.25 + r(6))]);
    const support = Math.abs(n[0]) * h[0] + Math.abs(n[1]) * h[1] + Math.abs(n[2]) * h[2];
    s = s.intersect(sdf.halfSpace(n, support * (cut - 0.15 + 0.12 * r(7))));
  }
  return flatBottom ? s : s.rotate((rnd(seed, 20, 1) - 0.5) * 14, (rnd(seed, 20, 2) - 0.5) * 30, (rnd(seed, 20, 3) - 0.5) * 14);
};

/** A faceted beam from a to b, `w` wide and `d` deep. */
const beam = (a: V3, b: V3, w: number, d: number, seed: number): sdf.Shape => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  return aim(block([w, len, d], seed, 0.84), [b[0] - a[0], b[1] - a[1], b[2] - a[2]]).at(...lerp(a, b, 0.5));
};

export default defineAsset({
  name: 'crystal-golem',
  description: 'Chibi crystal golem: a faceted body of pale violet crystal shards with a jagged crown, huge spiked shoulders, a cyan eye slit and chest core diamond, shard-cluster fists, and short spiked legs.',
  detail: 0.007,
  reference: 'docs/enemy-mockups/crystal-golem_001.jpg',
  // Color slots for individual golems (the first option is the default look).
  variants: {
    crystal: { violet: '#b8b0f0', emerald: '#8ad8b0', amber: '#f0c070' },
    glow: { cyan: '#4fe8ff', magenta: '#ff5ae0', white: '#ffffff' },
  },
  presets: {
    emerald: { crystal: 'emerald', glow: 'white' },
    amber: { crystal: 'amber', glow: 'magenta' },
    rose: { crystal: 'violet', glow: 'magenta' },
  },

  build(k) {
    const T = {
      crystal: k.tint('crystal'),
      lit: k.tint('crystal', 0.22),
      shade: k.tint('crystal', -0.38),
      glow: k.tint('glow'),
      glowDark: k.tint('glow', -0.7),
      up: k.tint('crystal', { color: '#dcd6ff', follow: 0.85 }),
      side: k.tint('crystal', { color: '#a898e8', follow: 0.85 }),
      down: k.tint('crystal', { color: '#6c5cc0', follow: 0.85 }),
      big: k.tint('crystal', { color: '#8a7ae0', follow: 0.85 }),
    };
    const bigShards: [V3, V3, number][] = []; // base, tip, radius: the largest shards get the saturated tint
    // Lit on top, shaded below, with a random pick between the neighbors.
    const shadeFor = (dir: V3, seed: number) => {
      const v = norm(dir)[1] + (rnd(seed, 3, 9) - 0.5) * 0.9;
      return v > 0.45 ? T.lit : v < -0.2 ? T.shade : T.crystal;
    };
    // ------------------------------------------------------------------ skeleton
    k.skeleton({
      hips: { at: [0, 0.3, 0] },
      spine: { parent: 'hips', at: [0, 0.4, 0] },
      chest: { parent: 'spine', at: [0, 0.54, 0] },
      neck: { parent: 'chest', at: [0, 0.72, -0.02] },
      head: { parent: 'neck', at: [0, 0.79, -0.01] },
      'upperarm.L': { parent: 'chest', at: SHOULDER },
      'forearm.L': { parent: 'upperarm.L', at: ELBOW },
      'hand.L': { parent: 'forearm.L', at: WRIST },
      'upperarm.R': { parent: 'chest', at: mx(SHOULDER) },
      'forearm.R': { parent: 'upperarm.R', at: mx(ELBOW) },
      'hand.R': { parent: 'forearm.R', at: mx(WRIST) },
      'leg.L': { parent: 'hips', at: HIP },
      'shin.L': { parent: 'leg.L', at: KNEE, split: 0.015 },
      'foot.L': { parent: 'shin.L', at: ANKLE },
      'leg.R': { parent: 'hips', at: mx(HIP) },
      'shin.R': { parent: 'leg.R', at: mx(KNEE), split: 0.015 },
      'foot.R': { parent: 'shin.R', at: mx(ANKLE) },
    });

    const stoneBump = (x: number, y: number, z: number) => 0.0015 * noise.fbm(x * 45, y * 45, z * 45, 2);

    /** A tagged, painted shard. `seed` picks the number of sides, the spin, and the shade. */
    const S = (bone: string, at: V3, dir: V3, len: number, w: number, seed: number) => {
      if (len >= 0.16) {
        const d = norm(dir);
        bigShards.push([at, [at[0] + d[0] * len, at[1] + d[1] * len, at[2] + d[2] * len], w * 1.2]);
      }
      return shard(at, dir, len, w, 4 + Math.floor(rnd(seed, 1, 1) * 3), rnd(seed, 2, 1) * 360)
        .paint(shadeFor(dir, seed))
        .bone(bone);
    };

    // ------------------------------------------------------------------ head: a faceted block, a crown of spikes, a visor
    const headBlock = block([0.3, 0.24, 0.24], 5, 0.82).at(0, HEAD_Y, 0);
    const brow = block([0.32, 0.06, 0.11], 6, 0.86).rotateX(-10).at(0, HEAD_Y + 0.09, 0.095);
    const slitZ = 0.115;
    const EYE_Y = HEAD_Y + 0.012;
    const head = sdf
      .union(headBlock, brow)
      .subtract(sdf.box([0.25, 0.066, 0.1]).at(0, EYE_Y, slitZ))
      .paint(T.crystal)
      .bone('head');
    const crownY = HEAD_Y + 0.105;
    const crown: sdf.Shape[] = [
      S('head', [0, crownY, -0.005], [0.02, 1, -0.05], 0.28, 0.07, 40), // the tall center spike
      S('head', [0.045, crownY, 0.05], [0.2, 1, 0.3], 0.2, 0.05, 41),
      S('head', [-0.045, crownY, 0.04], [-0.2, 1, 0.35], 0.19, 0.05, 42),
      S('head', [0.04, crownY, -0.07], [0.15, 1, -0.5], 0.24, 0.055, 43),
      S('head', [-0.04, crownY, -0.07], [-0.15, 1, -0.5], 0.22, 0.055, 39),
    ];
    for (let i = 0; i < 8; i++) {
      const t = ((i + 0.3 * rnd(44, i, 1)) / 8) * Math.PI * 2;
      const r = 0.1;
      const out = 0.55 + 0.5 * rnd(44, i, 2);
      const len = 0.14 + 0.12 * rnd(44, i, 3) + (Math.cos(t) < -0.3 ? 0.03 : 0);
      crown.push(S('head', [Math.sin(t) * r, crownY - 0.015, Math.cos(t) * r * 0.9], [Math.sin(t) * out, 1, Math.cos(t) * out], len, 0.04 + 0.014 * rnd(44, i, 4), 50 + i));
    }
    // Side and chin spikes: a jagged jaw line.
    const jaw = [
      S('head', [0.13, HEAD_Y + 0.0, 0.0], [1, 0.25, -0.1], 0.1, 0.04, 60),
      S('head', [0.0, HEAD_Y - 0.11, 0.1], [0, -0.7, 1], 0.09, 0.05, 61),
    ];
    const headAll = sdf.union(head, ...crown, ...jaw, ...jaw.slice(0, 1).map((j) => j.mirror('x', 0)));

    // ------------------------------------------------------------------ trunk
    const neck = block([0.14, 0.12, 0.14], 7, 0.85).at(0, 0.76, -0.02).paint(T.shade).bone('neck');
    const CORE: V3 = [0, 0.575, 0.15];
    const octa = (len: number, w: number) => sdf.union(pyramid(len, w, 4, 45), pyramid(len, w, 4, 45).rotateX(180));
    const chest = block([0.44, 0.31, 0.3], 3, 0.84)
      .at(0, 0.6, 0)
      .subtract(octa(0.13, 0.085).scale([1, 1, 0.75]).at(...CORE)) // the faceted socket
      .paint(T.crystal)
      .bone('chest');
    const collar = sdf.union(S('chest', [0, 0.68, 0.12], [0, -0.6, 1], 0.13, 0.08, 77), S('chest', [0.1, 0.7, 0.1], [0.5, -0.2, 1], 0.12, 0.06, 78), S('chest', [-0.1, 0.7, 0.1], [-0.5, -0.2, 1], 0.12, 0.06, 79));
    const belly = block([0.27, 0.16, 0.23], 9, 0.84).at(0, 0.43, 0.01).paint(T.shade).bone('spine');
    const pelvis = block([0.32, 0.14, 0.23], 11, 0.84).at(0, 0.32, 0).paint(T.crystal).bone('hips');
    const trunkShards: sdf.Shape[] = [
      S('hips', [0, 0.3, 0.08], [0, -1, 0.35], 0.17, 0.05, 70), // the pelvis spike
      S('hips', [-0.07, 0.36, -0.1], [-0.2, 0.3, -1], 0.1, 0.04, 71),
      S('hips', [0.07, 0.36, -0.1], [0.2, 0.3, -1], 0.1, 0.04, 72),
      S('chest', [0.0, 0.62, -0.12], [0, 0.6, -1], 0.16, 0.06, 73), // back spikes
      S('chest', [0.11, 0.7, -0.12], [0.3, 0.7, -1], 0.13, 0.05, 74),
      S('chest', [-0.11, 0.7, -0.12], [-0.3, 0.7, -1], 0.13, 0.05, 75),
      S('chest', [0.0, 0.5, -0.11], [0, -0.2, -1], 0.12, 0.05, 76),
    ];
    // Small shards around the core diamond, all pointing out of the chest.
    for (let i = 0; i < 6; i++) {
      const t = (i / 6) * Math.PI * 2 + 0.3;
      const cx = CORE[0] + Math.cos(t) * 0.12;
      const cy = CORE[1] + Math.sin(t) * 0.1;
      trunkShards.push(S('chest', [cx, cy, 0.12], [Math.cos(t) * 0.8, Math.sin(t) * 0.8, 1], 0.07, 0.03, 80 + i));
    }
    trunkShards.push(S('chest', [0.13, 0.69, 0.13], [0.4, 0.4, 1], 0.09, 0.04, 90), S('chest', [-0.13, 0.69, 0.13], [-0.4, 0.4, 1], 0.09, 0.04, 91));

    // ------------------------------------------------------------------ left side (mirrored)
    const SC: V3 = [0.335, 0.73, -0.005];
    const L: sdf.Shape[] = [];
    // Shoulder cluster: a block with 9 spikes, the biggest pointing out and up.
    L.push(block([0.24, 0.2, 0.26], 20, 0.82).at(...SC).paint(T.crystal).bone('chest'));
    L.push(block([0.14, 0.13, 0.17], 21, 0.84).at(SC[0] + 0.1, SC[1] - 0.06, SC[2]).paint(T.shade).bone('chest'));
    const spikes: [V3, V3, number, number][] = [
      [[0.1, 0.06, 0.0], [1, 0.45, 0.1], 0.22, 0.06],
      [[0.03, 0.08, 0.05], [0.4, 1, 0.3], 0.19, 0.055],
      [[0.03, 0.08, -0.06], [0.4, 1, -0.5], 0.18, 0.055],
      [[0.08, 0.02, 0.09], [0.8, 0.3, 1], 0.14, 0.05],
      [[0.08, 0.02, -0.1], [0.8, 0.3, -1], 0.14, 0.05],
      [[0.11, -0.04, 0.04], [1, -0.1, 0.5], 0.13, 0.05],
      [[-0.03, 0.07, 0.0], [0.05, 1, 0.05], 0.16, 0.05],
      [[0.09, 0.07, 0.06], [0.7, 0.9, 0.6], 0.14, 0.045],
      [[0.09, 0.07, -0.07], [0.7, 0.9, -0.6], 0.13, 0.045],
      [[0.06, 0.09, 0.0], [0.6, 1, 0.0], 0.2, 0.055],
      [[0.1, 0.0, 0.0], [1, 0.05, 0.9], 0.15, 0.045],
      [[0.1, 0.0, 0.0], [1, 0.05, -0.9], 0.15, 0.045],
    ];
    spikes.forEach(([o, d, len, w], i) => L.push(S('chest', [SC[0] + o[0], SC[1] + o[1], SC[2] + o[2]], d, len * 1.05, w * 1.2, 100 + i)));

    // Arm: beams, an elbow block and spike, and a fist of six shards.
    L.push(beam(SHOULDER, ELBOW, 0.13, 0.14, 30).paint(T.shade).bone('upperarm.L'));
    L.push(block([0.16, 0.15, 0.16], 31, 0.84).at(...ELBOW).paint(T.crystal).bone('forearm.L'));
    L.push(beam(ELBOW, WRIST, 0.15, 0.15, 32).paint(T.crystal).bone('forearm.L'));
    L.push(S('forearm.L', [ELBOW[0] + 0.07, ELBOW[1] + 0.03, ELBOW[2] - 0.03], [1, 0.4, -0.5], 0.12, 0.04, 110));
    L.push(S('forearm.L', [ELBOW[0] + 0.03, ELBOW[1] + 0.05, ELBOW[2] - 0.06], [0.2, 0.7, -1], 0.11, 0.04, 111));
    L.push(block([0.15, 0.15, 0.17], 15, 0.82).at(0.47, 0.29, 0.07).paint(T.lit).bone('hand.L'));
    L.push(S('hand.L', [0.53, 0.36, 0.05], [0.5, 1, 0.05], 0.24, 0.07, 120)); // the tall fist spike
    // A cluster of nine shards around the fist, pointing outward and down.
    for (let i = 0; i < 9; i++) {
      const t = i * 2.399 + 0.4;
      const y = 0.55 - (i / 8) * 1.3; // from the top of the fist to below the middle
      const r = Math.sqrt(1 - y * y);
      const d: V3 = [Math.cos(t) * r * 0.9 + 0.35, y - 0.25, Math.sin(t) * r + 0.25];
      const n = norm(d);
      const len = 0.08 + 0.06 * rnd(121, i, 1);
      L.push(S('hand.L', [0.47 + n[0] * 0.07, 0.29 + n[1] * 0.07, 0.07 + n[2] * 0.07], d, len, 0.04 + 0.01 * rnd(121, i, 2), 122 + i));
    }

    // Leg: thigh, knee block with spikes, shin, and a flat shard foot.
    L.push(beam(HIP, KNEE, 0.17, 0.19, 40).paint(T.shade).bone('leg.L'));
    L.push(block([0.2, 0.14, 0.2], 41, 0.84).at(0.168, 0.185, 0.02).paint(T.lit).bone('shin.L'));
    L.push(beam(KNEE, ANKLE, 0.15, 0.16, 42).paint(T.crystal).bone('shin.L'));
    L.push(S('shin.L', [0.17, 0.2, 0.1], [0.1, 0.55, 1], 0.2, 0.06, 130)); // the knee spike
    L.push(S('shin.L', [0.25, 0.2, 0.02], [1, 0.8, -0.1], 0.16, 0.05, 131));
    L.push(S('leg.L', [0.16, 0.34, -0.06], [0.5, 1, -0.4], 0.16, 0.05, 132));
    L.push(S('shin.L', [0.25, 0.13, -0.02], [1, 0.3, -0.4], 0.12, 0.045, 133));
    L.push(S('shin.L', [0.17, 0.13, 0.1], [0, 0.15, 1], 0.1, 0.04, 134));
    L.push(S('shin.L', [0.17, 0.2, -0.09], [0, 0.6, -1], 0.12, 0.045, 135));
    L.push(block([0.2, 0.1, 0.27], 43, 0.86, true).at(0.18, 0.05, 0.03).paint(T.shade).bone('foot.L'));
    L.push(S('foot.L', [0.135, 0.05, 0.14], [0.05, 0.12, 1], 0.1, 0.034, 140));
    L.push(S('foot.L', [0.225, 0.05, 0.14], [-0.05, 0.12, 1], 0.1, 0.034, 141));
    L.push(S('foot.L', [0.18, 0.05, -0.1], [0, 0.35, -1], 0.09, 0.04, 142));

    const crystalRaw = sdf.union(headAll, neck, chest, collar, belly, pelvis, ...trunkShards, sdf.union(...L).mirror('x', 0));
    // Paint by surface direction: up faces light, side faces mid, down faces dark; the biggest shards
    // keep a saturated violet-blue on their side faces. The normal comes from the distance field.
    const nearBig = (x: number, y: number, z: number) =>
      bigShards.some(([a, b, r]) => {
        const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2];
        const t = Math.max(0, Math.min(1, ((x - a[0]) * abx + (y - a[1]) * aby + (z - a[2]) * abz) / (abx * abx + aby * aby + abz * abz)));
        return Math.hypot(x - a[0] - abx * t, y - a[1] - aby * t, z - a[2] - abz * t) < r * (1 - t) + 0.004;
      });
    const crystal = crystalRaw.paintFn((x, y, z) => {
      const e = 0.003;
      const d = crystalRaw.dist(x, y, z);
      const n = norm([crystalRaw.dist(x + e, y, z) - d + 1e-9, crystalRaw.dist(x, y + e, z) - d, crystalRaw.dist(x, y, z + e) - d]);
      const v = n[1] * 0.85 + n[2] * 0.25 + n[0] * 0.15;
      if (v > 0.5) return rgb(T.up);
      if (v < -0.3) return rgb(T.down);
      return rgb(nearBig(x, y, z) ? T.big : T.side);
    });
    k.body('crystal', crystal, { color: T.crystal, roughness: 0.2, metalness: 0.1, flat: true, detail: 0.007, textureDensity: 1.5 });

    // ------------------------------------------------------------------ glow: the visor eyes, the chest core, and their halos
    const visorBand = sdf.box([0.245, 0.062, 0.02], 0.004).at(0, EYE_Y, slitZ - 0.05);
    k.body('visor', visorBand, { color: '#1a1638', roughness: 0.5, bone: 'head', detail: 0.004 });
    const eyeShape = sdf.ellipsoid([0.05, 0.02, 0.012]).rotateZ(15).at(0.062, EYE_Y, slitZ - 0.03);
    k.body('eyes', eyeShape.mirror('x', 0), { color: T.glowDark, emissive: T.glow, emissiveIntensity: 2.5, roughness: 0.3, bone: 'head', detail: 0.003 });
    k.body('eyeHalo', sdf.ellipsoid([0.1, 0.03, 0.025]).at(0, EYE_Y, slitZ + 0.005), { color: T.glow, emissive: T.glow, emissiveIntensity: 1, opacity: 0.35, roughness: 0.3, bone: 'head', detail: 0.005 });
    const diamond = octa(0.1, 0.068).scale([1, 1, 0.8]).at(...CORE);
    k.body('core', diamond, { color: T.glowDark, emissive: T.glow, emissiveIntensity: 2.5, roughness: 0.2, flat: true, bone: 'chest', detail: 0.004 });
    k.body('coreHalo', sdf.sphere(0.075).at(CORE[0], CORE[1], CORE[2] + 0.02), { color: T.glow, emissive: T.glow, emissiveIntensity: 1, opacity: 0.3, roughness: 0.3, bone: 'chest', detail: 0.005 });

    // ------------------------------------------------------------------ sparkles: four white points near the shoulders and the crown
    const white = { color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 2, roughness: 0.3, detail: 0.004 } as const;
    k.body('sparkleChest', sdf.union(sdf.sphere(0.012).at(0.56, 1.0, 0.06), sdf.sphere(0.012).at(-0.5, 0.93, 0.08)), { ...white, bone: 'chest' });
    k.body('sparkleHead', sdf.union(sdf.sphere(0.012).at(0.17, 1.2, 0.03), sdf.sphere(0.012).at(-0.2, 1.1, 0.08)), { ...white, bone: 'head' });

    // ------------------------------------------------------------------ animation
    const { wave, bump, legDrop, keys } = motion;
    const LEG = HIP[1] - ANKLE[1];
    const DEG = Math.PI / 180;
    const deg = (r: number) => r / DEG;
    // A damped shake after `at`, with `n` swings in `len` of the clip.
    const shake = (p: number, at: number, len: number, n: number) =>
      p < at ? 0 : Math.exp((-(p - at) / len) * 3) * Math.sin(((p - at) / len) * Math.PI * n);

    k.animation('idle', {
      duration: 2.8,
      pose: (_t, p) => ({
        hips: { move: [0, -0.004 * bump(p), 0] },
        chest: { rotate: [2 * wave(p), 0, 0] },
        neck: { rotate: [-1.5 * wave(p), 0, 0] },
        head: { rotate: [0, 10 * wave(p, 1, 0.25), 0] },
        'upperarm.L': { rotate: [2 * wave(p, 1, 0.1), 0, 3 * bump(p)] },
        'upperarm.R': { rotate: [2 * wave(p, 1, 0.1), 0, -3 * bump(p)] },
        'forearm.L': { rotate: [-4 * bump(p), 0, 0] },
        'forearm.R': { rotate: [-4 * bump(p, 1, 0.3), 0, 0] },
      }),
    });

    // A heavy, rolling walk: the weight shifts from side to side at each step, the fists swing.
    // The legs come from motion.gait (planted stance feet, a knee lift in the swing, heel strike and
    // toe-off); the gait phase runs a quarter cycle behind the clip.
    const stride = (duration: number, step: number, footLift: number, duty: number, bob: number, armSwing: number, lean: number, sway: number) => ({
      duration,
      pose: (_t: number, p: number) => {
        const s = wave(p);
        const hipsTurn = [0, 5 * s, sway * s] as const;
        const legs = motion.gait(p - 0.25, { hip: HIP, knee: KNEE, ankle: ANKLE }, {
          stride: step,
          lift: footLift,
          duty,
          bob,
          roll: 8,
          heel: SOLE_HEEL,
          toe: SOLE_TOE,
          hips: { at: [0, 0.3, 0], rotate: hipsTurn },
        });
        return {
          ...legs.pose,
          hips: { move: [0, legs.hipsY, 0] as const, rotate: hipsTurn },
          spine: { rotate: [lean, 0, -sway * 0.6 * s] as const },
          chest: { rotate: [lean * 0.5, -8 * s, 0] as const },
          head: { rotate: [-lean, 5 * s, 0] as const },
          'upperarm.L': { rotate: [armSwing * s, 0, 4] as const },
          'upperarm.R': { rotate: [-armSwing * s, 0, -4] as const },
          'forearm.L': { rotate: [-armSwing * 0.3 - armSwing * 0.3 * Math.max(0, -s), 0, 0] as const },
          'forearm.R': { rotate: [-armSwing * 0.3 - armSwing * 0.3 * Math.max(0, s), 0, 0] as const },
        };
      },
    });
    k.animation('walk', stride(1.1, 0.12, 0.03, 0.62, 0.01, 16, 4, 4));
    k.animation('run', stride(0.7, 0.17, 0.05, 0.45, 0.025, 28, 10, 3));

    // ------------------------------------------------------------------ attack: a two-fist ground slam
    // Both fists swing up and back over the head while the golem rises and leans back; then the
    // trunk folds forward, the knees bend, and both fists drive down into the floor in front of
    // the feet (outside them). An impact shake, a hold, and a slow recovery.
    k.animation('attack', {
      duration: 1.3,
      loop: false,
      pose: (_t, p) => {
        const sh = shake(p, 0.52, 0.2, 5);
        const armX = keys(p, [[0, 0], [0.3, -150], [0.4, -158], [0.5, -70], [0.53, -64], [0.74, -64], [1, 0]] as const, 'smooth');
        const foreX = keys(p, [[0, 0], [0.3, -50], [0.4, -58], [0.5, -8], [0.74, -8], [1, 0]] as const, 'smooth');
        const handX = keys(p, [[0, 0], [0.3, -15], [0.4, -15], [0.5, 12], [0.74, 12], [1, 0]] as const, 'smooth');
        const spineX = keys(p, [[0, 0], [0.3, -6], [0.4, -8], [0.5, 20], [0.53, 22], [0.74, 20], [1, 0]] as const, 'smooth');
        const chestX = keys(p, [[0, 0], [0.3, -10], [0.4, -12], [0.5, 26], [0.53, 28], [0.74, 25], [1, 0]] as const, 'smooth') + 2 * sh;
        const c = keys(p, [[0, 0], [0.16, 0.35], [0.32, 0.05], [0.42, 0], [0.52, 1], [0.74, 0.95], [1, 0]] as const, 'smooth');
        return {
          hips: { move: [0, -0.05 * c - 0.004 * sh, -0.02 * c] },
          spine: { rotate: [spineX, 0, 0] },
          chest: { rotate: [chestX, 0, 0] },
          head: { rotate: [-(spineX + chestX) * 0.55 - 3 * sh, 0, 0] },
          'upperarm.L': { rotate: [armX, 0, 0] },
          'upperarm.R': { rotate: [armX, 0, 0] },
          'forearm.L': { rotate: [foreX, 0, 0] },
          'forearm.R': { rotate: [foreX, 0, 0] },
          'hand.L': { rotate: [handX, 0, 0] },
          'hand.R': { rotate: [handX, 0, 0] },
          'leg.L': { rotate: [-45 * c, 0, 0] },
          'shin.L': { rotate: [80 * c, 0, 0] },
          'foot.L': { rotate: [-35 * c, 0, 0] },
          'leg.R': { rotate: [-45 * c, 0, 0] },
          'shin.R': { rotate: [80 * c, 0, 0] },
          'foot.R': { rotate: [-35 * c, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ attack2: a shoulder charge, then a backhand swipe
    // Plan: the golem sinks into a wide stance (the left foot steps back) and turns the right
    // boulder shoulder at the target; two heavy steps carry it forward into the ram, a short hold
    // with a shake. Then the body unwinds and the right fist swings backhand across the front and
    // out to the right. Two steps back to rest. A planted foot keeps its world position.
    const ease = (a: number, b: number, x: number) => {
      const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    };
    type Step = readonly [number, number, number, number]; // phase start, phase end, from z, to z
    const footAt = (steps: readonly Step[], p: number) => {
      let z = 0;
      let lift = 0;
      for (const [a, b, from, to] of steps) {
        if (p >= a) z = from + (to - from) * ease(a, b, p);
        if (p > a && p < b) lift = 0.03 * Math.sin(((p - a) / (b - a)) * Math.PI);
      }
      return { z, lift };
    };
    const legTo = (footZ: number, hipsZ: number, hipsY: number, side: 1 | -1) => {
      const hipZ = hipsZ - side * HIP[0] * Math.sin(hipsY * DEG);
      const a = Math.asin(Math.max(-0.95, Math.min(0.95, (hipZ - footZ) / LEG)));
      return { rot: deg(a), drop: LEG * (1 - Math.cos(a)) };
    };
    const STEPS_L: readonly Step[] = [[0.02, 0.13, 0, -0.18], [0.16, 0.26, -0.18, 0.1], [0.85, 0.95, 0.1, 0]];
    const STEPS_R: readonly Step[] = [[0.26, 0.36, 0, 0.24], [0.72, 0.83, 0.24, 0]];

    k.animation('attack2', {
      duration: 1.2,
      loop: false,
      pose: (_t, p) => {
        const sh = shake(p, 0.36, 0.1, 5);
        const hipsY = keys(p, [[0, 0], [0.15, 14], [0.45, 14], [0.48, 15], [0.66, -10], [0.72, -10], [0.9, 0]] as const);
        const spineY = keys(p, [[0, 0], [0.15, 12], [0.45, 12], [0.48, 13], [0.66, -10], [0.72, -10], [0.92, 0]] as const);
        const chestY = keys(p, [[0, 0], [0.15, 18], [0.36, 20], [0.45, 20], [0.48, 24], [0.66, -16], [0.72, -16], [0.95, 0]] as const);
        const turn = hipsY + spineY + chestY;
        const lean = keys(p, [[0, 0], [0.15, 12], [0.26, 13], [0.36, 18], [0.45, 16], [0.48, 12], [0.66, 6], [0.72, 6], [0.95, 0]] as const);
        const dip = keys(p, [[0, 0], [0.15, -4], [0.36, -8], [0.45, -7], [0.6, 0]] as const); // the ramming shoulder drops
        const fL = footAt(STEPS_L, p);
        const fR = footAt(STEPS_R, p);
        const hipsZ = (fL.z + fR.z) / 2 + keys(p, [[0, 0], [0.3, 0], [0.36, 0.02], [0.45, 0.015], [0.6, 0.02], [0.72, 0]] as const);
        const legL = legTo(fL.z, hipsZ, hipsY, 1);
        const legR = legTo(fR.z, hipsZ, hipsY, -1);
        // The right fist: tucked in front of the belly in the charge, cocked across, then a
        // backhand swing out to the right at chest height.
        const rX = keys(p, [[0, 0], [0.15, -35], [0.45, -35], [0.49, -50], [0.58, -80], [0.66, -72], [0.72, -60], [0.9, -20], [1, 0]] as const, 'smooth');
        const rZ = keys(p, [[0, 0], [0.15, 12], [0.45, 12], [0.49, 28], [0.58, -10], [0.66, -45], [0.72, -45], [0.9, -10], [1, 0]] as const, 'smooth');
        const rFore = keys(p, [[0, 0], [0.15, -55], [0.45, -55], [0.49, -60], [0.58, -15], [0.66, -10], [0.72, -10], [0.9, -20], [1, 0]] as const, 'smooth');
        // The off arm braces forward, pulls back to drive the charge, and swings out in the swipe.
        const lX = keys(p, [[0, 0], [0.15, -30], [0.3, 15], [0.45, 15], [0.6, -20], [0.72, -20], [1, 0]] as const, 'smooth');
        const lZ = keys(p, [[0, 0], [0.15, 8], [0.45, 8], [0.6, 22], [0.72, 22], [1, 0]] as const, 'smooth');
        const h = hipsY * DEG;
        return {
          hips: { move: [0, -Math.min(legL.drop + fL.lift, legR.drop + fR.lift), hipsZ], rotate: [0, hipsY, 0] },
          spine: { rotate: [lean * Math.cos(h), spineY, lean * Math.sin(h)] },
          chest: { rotate: [3 * sh, chestY, dip + 2 * sh] },
          head: { rotate: [-lean * 0.6 - 3 * sh, -turn * 0.5, 0] },
          'upperarm.R': { rotate: [rX, 0, rZ] },
          'forearm.R': { rotate: [rFore, 0, 0] },
          'upperarm.L': { rotate: [lX, 0, lZ] },
          'forearm.L': { rotate: [-20 * ease(0, 0.15, p) * (1 - ease(0.8, 1, p)), 0, 0] },
          'leg.L': { rotate: [legL.rot, -hipsY, 0], move: [0, fL.lift, 0] },
          'leg.R': { rotate: [legR.rot, -hipsY, 0], move: [0, fR.lift, 0] },
          'foot.L': { rotate: [-legL.rot, 0, 0] },
          'foot.R': { rotate: [-legR.rot, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ roar: both fists raised, the stones tremble
    k.animation('roar', {
      duration: 1.8,
      loop: false,
      pose: (_t, p) => {
        const rise = keys(p, [[0, 0], [0.16, -0.5], [0.3, 1], [0.8, 1], [1, 0]] as const);
        const lift = Math.max(0, rise);
        const crouch = Math.max(0, -rise);
        // Seven quick trembles while it roars (odd, so the strip does not freeze on them).
        const tremble = p > 0.3 && p < 0.82 ? wave((p - 0.3) / 0.52, 7) * Math.sin(((p - 0.3) / 0.52) * Math.PI) : 0;
        return {
          hips: { move: [0, -0.025 * crouch - 0.003 * Math.abs(tremble), 0] },
          spine: { rotate: [10 * crouch - 6 * lift, 0, 0] },
          chest: { rotate: [8 * crouch - 10 * lift + 1.5 * tremble, 2 * tremble, 0] },
          neck: { rotate: [6 * crouch - 6 * lift, 0, 0] },
          head: { rotate: [8 * crouch - 12 * lift + 2 * tremble, 3 * tremble, 0] },
          'upperarm.L': { rotate: [-25 * lift + 10 * crouch, 0, 65 * lift] },
          'upperarm.R': { rotate: [-25 * lift + 10 * crouch, 0, -65 * lift] },
          'forearm.L': { rotate: [-55 * lift - 20 * crouch, 0, 0] },
          'forearm.R': { rotate: [-55 * lift - 20 * crouch, 0, 0] },
          'leg.L': { rotate: [0, 0, 4 * lift] },
          'leg.R': { rotate: [0, 0, -4 * lift] },
        };
      },
    });

    // ------------------------------------------------------------------ hit: snap back from a blow, a step back, recover
    k.animation('hit', {
      duration: 0.45,
      loop: false,
      pose: (_t, p) => {
        const r = keys(p, [[0, 0], [0.16, 1], [0.38, 0.8], [1, 0]] as const);
        const back = -0.025 * r;
        const legL = deg(Math.atan2(back, LEG));
        return {
          hips: { move: [0, -legDrop(LEG, 12 * r), back], rotate: [0, 5 * r, 0] },
          spine: { rotate: [-8 * r, 0, 3 * r] },
          chest: { rotate: [-9 * r, 7 * r, 0] },
          neck: { rotate: [-5 * r, 0, 0] },
          head: { rotate: [-14 * r, -9 * r, 6 * r] },
          'upperarm.L': { rotate: [12 * r, 0, 24 * r] },
          'forearm.L': { rotate: [-22 * r, 0, 0] },
          'upperarm.R': { rotate: [10 * r, 0, -18 * r] },
          'forearm.R': { rotate: [-12 * r, 0, 0] },
          'leg.L': { rotate: [legL, 0, 0] },
          'foot.L': { rotate: [-legL, 0, 0] },
          'leg.R': { rotate: [12 * r, 0, 0] }, // a small step back
          'foot.R': { rotate: [-12 * r, 0, 0] },
        };
      },
    });

    // ------------------------------------------------------------------ death: stagger back, topple, lie on the back
    k.animation('death', {
      duration: 1.5,
      loop: false,
      pose: (_t, p) => {
        const fall = keys(p, [[0, 0], [0.2, -8], [0.4, 3], [0.54, -40], [0.66, -88], [0.72, -84], [0.8, -88], [1, -88]] as const);
        const hipsY = keys(p, [[0, 0], [0.4, 0], [0.54, -0.01], [0.66, -0.1], [0.72, -0.085], [0.8, -0.1], [1, -0.1]] as const);
        const hipsZ = keys(p, [[0, 0], [0.2, -0.035], [0.4, -0.02], [0.66, -0.13], [1, -0.13]] as const);
        const legs = keys(p, [[0, 0], [0.2, 4], [0.4, -3], [0.54, 36], [0.66, 50], [1, 50]] as const);
        const stepR = keys(p, [[0, 0], [0.2, 14], [0.4, 4], [0.54, 0], [1, 0]] as const);
        const spill = keys(p, [[0, 0], [0.54, 0], [0.62, 1], [1, 1]] as const);
        return {
          hips: { move: [0, hipsY, hipsZ], rotate: [fall, keys(p, [[0, 0], [0.2, 8], [0.66, -6], [1, -6]] as const), 0] },
          spine: { rotate: [keys(p, [[0, 0], [0.2, -10], [0.4, 8], [0.56, 6], [0.66, -4], [1, 0]] as const), 0, 0] },
          chest: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 6], [0.66, -2], [1, 0]] as const), keys(p, [[0, 0], [0.2, 10], [0.5, -6], [1, 0]] as const), 0] },
          neck: { rotate: [keys(p, [[0, 0], [0.2, -8], [0.4, 8], [0.6, 16], [0.7, -6], [0.8, 0], [1, 0]] as const), 0, 0] },
          head: { rotate: [keys(p, [[0, 0], [0.2, -14], [0.4, 10], [0.6, 14], [0.7, -10], [0.8, 0], [1, 0]] as const), keys(p, [[0, 0], [0.7, 0], [0.9, 28], [1, 28]] as const), 0] },
          'upperarm.L': { rotate: [keys(p, [[0, 0], [0.2, 12], [0.4, -8], [0.58, -55], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, 28], [0.4, 12], [0.58, 40], [0.7, 60], [1, 62]] as const)] },
          'forearm.L': { rotate: [keys(p, [[0, 0], [0.2, -30], [0.58, -20], [0.7, -6], [1, -8]] as const), 0, 0] },
          'upperarm.R': { rotate: [keys(p, [[0, 0], [0.2, 10], [0.4, -6], [0.58, -45], [0.7, 30], [1, 34]] as const), 0, keys(p, [[0, 0], [0.2, -22], [0.4, -10], [0.58, -35], [0.7, -58], [1, -60]] as const)] },
          'forearm.R': { rotate: [keys(p, [[0, 0], [0.2, -20], [0.58, -15], [0.7, 0], [1, 0]] as const), 0, 0] },
          'leg.L': { rotate: [legs + keys(p, [[0, 0], [0.2, -6], [0.4, 0]] as const), 0, 6 * spill] },
          'leg.R': { rotate: [legs + stepR, 0, -8 * spill] },
          'foot.L': { rotate: [-keys(p, [[0, 0], [0.4, 0], [0.66, 12], [1, 12]] as const), 0, 0] },
          'foot.R': { rotate: [-stepR * 0.8, 0, 0] },
        };
      },
    });
  },
});
