import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Village well, about 2.6 m tall: a round fieldstone ring (1.4 m across, 0.78 m tall) with a
 * dark water opening, two chunky timber posts carrying a small steep shingled roof, a wooden
 * windlass with a crank handle, a rope, and a banded wooden bucket hanging over the opening.
 *
 * - Role: hamlet landmark / interactive prop; must read at 128 px.
 * - One idea: a sturdy stone ring crowned by a steep little roof, with the bucket as the focal
 *   point hanging in the middle.
 * - Shape language: square and round (sturdy, safe); the steep roof triangle is the accent.
 * - Palette: gray stone (dominant), dark timber (secondary), terracotta shingles, accent = tan
 *   rope and a dark teal water glint.
 * - Materials: stone (worley fieldstone), wood (posts, windlass, bucket), shingle, iron, rope.
 * - No rig, no animation.
 */

const RING_TOP = 0.78;
const EAVE = 2.0;
const RIDGE = 2.58;
const RUN = 0.92; // half-depth of the roof slope
const POST_X = 0.6;

const C = {
  stone: rgb('#9c988d'),
  stoneDark: rgb('#67645c'),
  mortar: rgb('#b3a892'),
  timber: '#4a3322',
  timberDark: '#2c1d12',
  shingle: rgb('#c26042'),
  shingleDark: rgb('#7a3522'),
  iron: '#34363b',
  rope: '#d8b87e',
  water: '#14333c',
  waterGlow: '#1d4a4a',
};

/** Fieldstone: irregular Worley cells, pale mortar at cell borders, per-stone tint. */
const stonePaint = (scale: number) => (x: number, y: number, z: number) => {
  const c = noise.worley(x * scale, y * scale * 1.5, z * scale);
  const border = c.f2 - c.f1;
  const tint = (c.id % 1000) / 1000;
  const stone = mixRgb(C.stone, C.stoneDark, 0.2 + 0.5 * tint);
  return border < 0.07 ? C.mortar : stone;
};
const stoneBump = (scale: number, depth: number) => (x: number, y: number, z: number) => {
  const c = noise.worley(x * scale, y * scale * 1.5, z * scale);
  return -depth * Math.min(1, (c.f2 - c.f1) * 4) + depth * 0.5;
};

/** Vertical wood grain with per-stave tint and dark grooves (angle around the Y axis). */
const stavePaint = (radius: number, staves: number, light: string, dark: string) =>
  (x: number, y: number, z: number) => {
    const a = Math.atan2(z, x);
    const s = Math.floor(((a / (2 * Math.PI) + 0.5) * staves) % staves);
    const groove = Math.abs(((a / (2 * Math.PI) + 0.5) * staves) % 1 - 0.5) > 0.46;
    const grain = 0.5 + 0.5 * noise.noise3(x * 40, y * 4, z * 40);
    const c = mixRgb(rgb(light), rgb(dark), 0.2 + 0.3 * noise.random(s, 5) + 0.2 * grain);
    return groove ? rgb(dark) : c;
  };

export default defineAsset({
  name: 'well',
  description:
    'Village well: fieldstone ring with dark water, timber posts, steep shingled roof, windlass crank, rope, and hanging bucket.',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- stone ring
    const ringProfile = profile.polygon(
      [
        [0.5, 0.04],
        [0.68, 0.0],
        [0.72, 0.08],
        [0.7, 0.66],
        [0.66, RING_TOP],
        [0.52, RING_TOP - 0.04],
        [0.5, 0.6],
      ],
      { smooth: true },
    );
    const ring = sdf
      .revolve(ringProfile)
      .paintFn((x, y, z) => {
        // Dark, damp inner wall below the rim so the opening reads deep.
        if (Math.hypot(x, z) < 0.55 && y < 0.62) return rgb('#24262b');
        let c = stonePaint(6)(x, y, z);
        // Damp, slightly mossy base: darker toward the ground, greenish on the north side.
        if (y < 0.22) c = mixRgb(c, rgb('#4c4a42'), 0.55 * (1 - y / 0.22));
        if (z < -0.15 && y < 0.42) c = mixRgb(c, rgb('#5a6b46'), 0.35 * (1 - y / 0.42) * Math.min(1, (-z - 0.15) * 3));
        return c;
      });
    k.body('ring', ring, { color: '#8d8a82', roughness: 0.9, detail: 0.01, bump: stoneBump(6, 0.012) });

    // Dark water surface inside the opening: near-black teal, a faint sheen, no glow.
    const water = sdf.cylinder(0.5, 0.04).at(0, 0.52, 0);
    k.body('water', water, {
      color: '#0e2129',
      roughness: 0.15,
      metalness: 0.2,
      detail: 0.014,
    });

    // ------------------------------------------------------------- posts and tie beam
    const post = sdf
      .box([0.14, 1.35, 0.14], 0.02)
      .rotateZ(1.5)
      .at(POST_X, 0.72 + 1.35 / 2 - 0.06, 0)
      .mirror('x', 0)
      .paintFn((x, y, z, base) =>
        mixRgb(base, rgb(C.timberDark), 0.4 * Math.max(0, noise.fbm(x * 30, y * 4, z * 30, 2))),
      );
    k.body('posts', post, {
      color: C.timber,
      roughness: 0.85,
      detail: 0.008,
      bump: (x, y, z) => 0.003 * noise.fbm(x * 30, y * 4, z * 30, 2),
    });
    const tieBeam = sdf
      .box([1.36, 0.1, 0.12], 0.015)
      .at(0, 2.02, 0)
      .paintFn((x, y, z, base) =>
        mixRgb(base, rgb(C.timberDark), 0.4 * Math.max(0, noise.fbm(x * 8, y * 30, z * 30, 2))),
      );
    k.body('tie-beam', tieBeam, { color: C.timber, roughness: 0.85, detail: 0.008 });

    // ------------------------------------------------------------- roof (steep peak, ridge along X)
    const roofProfile = profile.polygon([
      [-RUN - 0.02, EAVE - 0.14],
      [0, RIDGE + 0.05],
      [RUN + 0.02, EAVE - 0.14],
      [RUN + 0.02, EAVE - 0.3],
      [0, RIDGE - 0.11],
      [-RUN - 0.02, EAVE - 0.3],
    ]);
    const slope = Math.atan2(RIDGE + 0.05 - (EAVE - 0.14), RUN + 0.02);
    const downSlope = (y: number) => (RIDGE + 0.05 - y) / Math.sin(slope);
    const ROW = 0.12;
    const roof = sdf
      .extrude(roofProfile, 1.9, 0.025)
      .rotateY(90)
      .paintFn((x, y) => {
        const s = downSlope(y) / ROW;
        const row = Math.floor(s);
        const col = Math.floor(x / 0.15 + (row % 2) * 0.5);
        const seam = s - row < 0.08 || Math.abs(x / 0.15 + (row % 2) * 0.5 - col - 0.5) > 0.46;
        const tint = noise.random(row, col, 11) * 0.45;
        return seam ? C.shingleDark : mixRgb(C.shingle, C.shingleDark, tint);
      });
    // Continuous shingle ramp in the normal map; never a sawtooth jump.
    const shingleBump = (x: number, y: number, z: number) => {
      const s2 = downSlope(y) / ROW;
      const f = s2 - Math.floor(s2);
      const ramp = f < 0.85 ? f / 0.85 : (1 - f) / 0.15;
      return 0.01 * ramp + 0.002 * noise.noise3(x * 20, y * 20, z * 20);
    };
    k.body('roof', roof, { color: '#b35a3c', roughness: 0.8, detail: 0.012, bump: shingleBump });
    // Dark timber ridge cap breaks the roof outline and adds a deep value accent.
    const ridgeCap = sdf
      .capsule([-0.98, RIDGE + 0.02, 0], [0.98, RIDGE + 0.02, 0], 0.05)
      .paintFn((x, y, z, base) =>
        mixRgb(base, rgb(C.timberDark), 0.4 * Math.max(0, noise.fbm(x * 8, y * 30, z * 30, 2))),
      );
    k.body('ridge-cap', ridgeCap, { color: C.timber, roughness: 0.85, detail: 0.008 });

    // ------------------------------------------------------------- windlass, crank, rope
    // The axle sits low enough to clear the roof slope from the elevated front view.
    const axleY = 1.56;
    const windlass = sdf
      .capsule([-0.72, axleY, 0], [0.72, axleY, 0], 0.055)
      .paintFn(stavePaint(0.055, 10, '#7b5230', '#43301d'));
    // Crank: arm angles down toward the front, grip parallel to the axle.
    const crankArm = sdf.capsule([0.7, axleY, 0], [0.7, axleY - 0.15, 0.16], 0.022);
    const grip = sdf.capsule([0.58, axleY - 0.15, 0.16], [0.84, axleY - 0.15, 0.16], 0.026);
    k.body('windlass', sdf.union(windlass, crankArm, grip), {
      color: C.timber,
      roughness: 0.8,
      detail: 0.006,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 40, y * 5, z * 40, 2),
    });
    // Iron collars where the axle passes through the posts and meets the crank.
    const pin = sdf.union(
      sdf.cylinder(0.07, 0.03).rotateZ(90).at(0.68, axleY, 0),
      sdf.cylinder(0.07, 0.03).rotateZ(90).at(-0.68, axleY, 0),
    );
    k.body('crank-pin', pin, { color: C.iron, roughness: 0.5, metalness: 0.8, detail: 0.005 });

    // Rope: a coil around the windlass center plus the drop to the bucket handle.
    const coil = sdf.capsule([-0.15, axleY, 0], [0.15, axleY, 0], 0.068);
    const drop = sdf.cylinder(0.02, 0.29).at(0, 1.36, 0);
    const rope = sdf
      .union(coil, drop)
      .paintFn((x, y, z) => mixRgb(rgb(C.rope), rgb('#8a6f42'), 0.5 + 0.5 * noise.noise3(x * 50, y * 8, z * 50)));
    k.body('rope', rope, { color: C.rope, roughness: 0.95, detail: 0.006 });

    // ------------------------------------------------------------- bucket with iron bands
    const bucketY = 0.92; // base of the bucket, just above the opening
    const bucketProfile = profile.polygon(
      [
        [0, 0.005],
        [0.105, 0.0],
        [0.135, 0.025],
        [0.175, 0.25],
        [0.155, 0.28],
        [0.125, 0.25],
        [0.1, 0.045],
        [0, 0.04],
      ],
      { smooth: true },
    );
    const bucket = sdf
      .revolve(bucketProfile)
      .at(0, bucketY, 0)
      .paintFn(stavePaint(0.15, 12, '#a8743f', '#5d3a1e'));
    k.body('bucket', bucket, {
      color: '#8a5a30',
      roughness: 0.8,
      detail: 0.006,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 40, y * 5, z * 40, 2),
    });
    const bandLow = sdf.torus(0.13, 0.015).at(0, bucketY + 0.06, 0);
    const bandHigh = sdf.torus(0.157, 0.015).at(0, bucketY + 0.21, 0);
    // Handle ring the rope ties to.
    const handle = sdf.torus(0.055, 0.013).rotateY(90).at(0, bucketY + 0.31, 0);
    k.body('bucket-iron', sdf.union(bandLow, bandHigh, handle), {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.8,
      detail: 0.005,
    });
  },
});
