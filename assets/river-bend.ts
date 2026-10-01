import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';

// river-bend — modular 90-degree river bend tile, catalog id architecture/landscape-parts.
//
// Role: hamlet map tile that joins river-straight tiles around a corner; read top-down and
// at 128 px. Exactly 2 x 2 m, a 0.3 m slab: grass top at y = 0, soil down to y = -0.3. The
// river enters at the middle of the front edge (z = -1) and leaves at the middle of the
// right edge (x = +1), sweeping one smooth quarter turn around the inside corner at
// (1, -1), so every channel function is a function of the radius from that vertical axis.
// One idea: a calm blue-green ribbon curving around a tiny grassy inside corner, framed by
// thin warm sand shores, water 2.5 cm below grass-level banks, bed at y = -0.18.
// Sides: at the stream edges a blue water face over a sand-and-gravel bed band and soil; elsewhere a grass lip over soil strata.
// Shape language: rounded and soft (eased bank lip and toe, beveled slab, round pebbles);
// the tile edges stay straight and clean so neighbours repeat without seams.
// Palette (60/30/10): grass #5fb14d dominant — the grass-ground tile's exact green, with its
// #3d8a37 shadow patches and #a8d76c flecks, no yellow-green anywhere; water #2586a0 ->
// #86d8c6 secondary; sand #ead9a8 accent. Focal point: the bend itself.
// Materials: one painted ground body (grass / sand / silt, roughness 0.9), water body
// (roughness 0.55, opacity 0.85), three probed pebbles. No rig, no animation.

const TILE = 2.0; // tile footprint (m)
const SLAB = 0.3;
const EDGE = 0.001;
const WATER_Y = -0.025; // water surface, 2.5 cm below the grass (top at y = 0)
const BED_Y = -0.18; // channel bed
const AXIS_X = 1; // the bend sweeps around the vertical axis through
const AXIS_Z = -1; // the inside corner of the turn (front-right tile corner)

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Radius from the bend axis: 1 on the channel centerline, 0 at the inside corner. */
const bendRadius = (x: number, z: number) => Math.hypot(x - AXIS_X, z - AXIS_Z);

// Grass colors are the grass-ground tile's exact values so the set stays harmonious.
const grass = rgb('#5fb14d');
const grassDark = rgb('#3d8a37');
const fleckColor = rgb('#a8d76c');
const sandA = rgb('#ead9a8');
const sandB = rgb('#d6bf88');
const sandWet = rgb('#bfa678');
const bedA = rgb('#8a7a58');
const bedB = rgb('#76704e');
const waterDeep = rgb('#2586a0');
const waterShallow = rgb('#86d8c6');

// Same fleck layout as grass-ground, so the pattern flows on across tile borders; here the
// channel's sand and silt paints cover any fleck that falls on the water.
const FLECKS: ReadonlyArray<readonly [number, number, number, number]> = [
  [-0.72, 0, -0.55, 0.1],
  [0.62, 0, 0.78, 0.11],
  [-0.3, 0, 0.45, 0.08],
  [0.78, 0, -0.25, 0.09],
  [-0.85, 0, 0.2, 0.08],
  [0.2, 0, -0.8, 0.09],
  [0.85, 0, 0.4, 0.08],
  [-0.1, 0, -0.05, 0.07],
  [0.4, 0, 0.1, 0.08],
  [-0.55, 0, 0.65, 0.07],
  [0.15, 0, 0.5, 0.09],
  [0.45, 0, -0.55, 0.08],
];

/** 1 inside a fleck, fading to 0 at its soft edge. */
function fleckWeight(x: number, z: number): number {
  let w = 0;
  for (const [cx, , cz, r] of FLECKS) {
    const dx = (x - cx) / r;
    const dz = (z - cz) / (r * 0.85);
    const d2 = dx * dx + dz * dz;
    if (d2 < 1) w = Math.max(w, 1 - Math.sqrt(d2));
  }
  return w;
}

export default defineAsset({
  name: 'river-bend',
  description:
    'Modular 2 m river bend tile, a 0.3 m slab with its top at y = 0: calm blue-green water 0.18 m deep in a quarter turn, thin sandy shores, grass margins; water, gravel bed and soil show on the sides.',
  detail: 0.02,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ ground: slab minus valley
    // Bank cross-section (U = radius from the bend axis, V = height). The lip pierces grass
    // level near U 0.26 / 1.74 (opening ~1.48 m at grass, matching river-straight), eases
    // down to the floor at 0.02, and the smooth polygon keeps lip and toe soft.
    const bankProfile = profile.polygon(
      [
        [0.2, 0.04],
        [0.25, 0.004],
        [0.3, -0.04],
        [0.36, -0.1],
        [0.44, -0.16],
        [0.55, BED_Y],
        [1.45, BED_Y],
        [1.56, -0.16],
        [1.64, -0.1],
        [1.7, -0.04],
        [1.75, 0.004],
        [1.8, 0.04],
        [1.8, 0.1],
        [0.2, 0.1],
      ],
      { smooth: true },
    );
    const valley = sdf.revolve(bankProfile).at(AXIS_X, 0, AXIS_Z);
    const ground = sdf
      .box([TILE + 2 * EDGE, SLAB + 2 * EDGE, TILE + 2 * EDGE])
      .at(0, -SLAB / 2, 0)
      .smoothSubtract(0.02, valley);

    // Grass uses grass-ground's exact world-space recipe so neighbour tiles continue the
    // pattern. Sand shore: from under the waterline up the bank and onto the flat grass,
    // edges wobbling; silt bed below the waterline reads through the water.
    const topPaint = (x: number, y: number, z: number): Rgb => {
      const d = Math.abs(bendRadius(x, z) - 1);
      const big = noise.fbm(x * 2.4, 0, z * 2.4, 3);
      const small = noise.fbm(x * 7, 0, z * 7, 2);
      const v = clamp01(big * 0.45 + small * 0.25 + 0.5);
      let col = y > -0.01 ? mixRgb(grass, grassDark, v * 0.45) : mixRgb(grass, grassDark, 0.35);
      if (y > -0.01) {
        const w = fleckWeight(x, z);
        if (w > 0) col = mixRgb(col, fleckColor, w);
      }

      const wob = 0.018 * noise.fbm(x * 5, 0, z * 5, 2);
      const inner = 0.56 + 0.5 * wob;
      const outer = 0.82 + wob;
      const sandMask =
        smoothstep(inner - 0.022, inner + 0.022, d) *
        (1 - smoothstep(outer - 0.02, outer + 0.02, d));
      let sand = mixRgb(sandA, sandB, 0.5 + 0.4 * noise.fbm(x * 18, y * 18, z * 18, 2));
      // Sand under the waterline reads darker and wetter.
      sand = mixRgb(sand, sandWet, 0.55 * (1 - smoothstep(WATER_Y - 0.012, WATER_Y + 0.004, y)));
      col = mixRgb(col, sand, sandMask);

      const bed = mixRgb(bedA, bedB, 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2));
      col = mixRgb(col, bed, 1 - smoothstep(0.56, 0.6, d));

      // Sparse daisies on the outer grass margin, just past the sand (cell hash, world-space).
      const cell = 0.14;
      const ci = Math.floor(x / cell);
      const cj = Math.floor(z / cell);
      const cx = (ci + 0.5) * cell;
      const cz = (cj + 0.5) * cell;
      const cr = bendRadius(cx, cz);
      if (y > -0.01 && noise.random(ci, cj, 11) < 0.22 && cr > 1.87 && cr < 1.99) {
        const dot = 1 - smoothstep(0.008, 0.014, Math.hypot(x - cx, z - cz));
        if (dot > 0) {
          const warm = noise.random(ci, cj, 23) < 0.5;
          col = mixRgb(col, warm ? rgb('#f2c14e') : rgb('#f4eee0'), dot);
        }
      }
      return col;
    };

    const soilC = rgb('#7a4a2a');
    const strataC = rgb('#57331d');
    const pebbleC = rgb('#9a8a78');
    const bandC = rgb('#a89a78');
    const groundPaint = (x: number, y: number, z: number): Rgb => {
      const edge = Math.abs(x) > 0.995 || Math.abs(z) > 0.995;
      if (!((edge && y < -0.01) || y < -0.25)) return topPaint(x, y, z);
      const along = Math.abs(x) > Math.abs(z) ? z : x;
      const soilAt = (yy: number): Rgb => {
        let c = mixRgb(soilC, strataC, 0.15 + (-yy / SLAB) * 0.55);
        const st = Math.sin((yy + 0.02 * Math.sin(along * Math.PI * 2)) * 70);
        c = mixRgb(c, strataC, Math.max(0, st - 0.6) * 0.8);
        const n = noise.fbm(along * 9, yy * 9, 3.1, 2);
        if (n > 0.45) c = mixRgb(c, pebbleC, Math.min(1, (n - 0.45) * 6) * 0.8);
        return c;
      };
      const d = Math.abs(bendRadius(x, z) - 1);
      if (edge && d < 0.78) {
        const yb = BED_Y * (1 - smoothstep(0.55, 0.76, d));
        if (y > yb - 0.055) {
          const n = noise.fbm(along * 30, y * 30, 1.7, 2);
          return mixRgb(bandC, rgb('#6f6a60'), clamp01(n * 0.8 - 0.1) * 0.6);
        }
        return soilAt(y);
      }
      const drip = 0.05 + 0.02 * Math.sin(along * Math.PI * 3 + 0.7) + 0.015 * Math.sin(along * Math.PI * 7 + 2.1);
      if (y > -drip) return mixRgb(topPaint(x, 0, z), grassDark, 0.15 * Math.min(1, -y / drip));
      return soilAt(y);
    };

    k.body('ground', ground.paintFn(groundPaint), {
      color: grass,
      roughness: 0.9,
      paintWeight: 2,
      detail: 0.02,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 26, y * 26, z * 26, 3),
    });

    // ------------------------------------------------------------------ water
    // An annular slab sunk into the channel: top 2.5 cm below the grass, radial ends tucked
    // under the sandy banks, clipped 3 mm inside the tile edges so no face is coplanar with
    // the tile ends. A gentle swell breaks the flat surface; it goes quiet at the banks and
    // at the tile edges, so seams between tiles stay calm and matching.
    const waterRing = sdf
      .revolve(
        profile.polygon([
          [0.22, BED_Y - 0.005],
          [1.78, BED_Y - 0.005],
          [1.78, WATER_Y],
          [0.22, WATER_Y],
        ]),
      )
      .at(AXIS_X, 0, AXIS_Z)
      .displace(
        0.002,
        (x, y, z) =>
          noise.fbm(x * 6, y * 3, z * 6, 2) *
          smoothstep(0.3, 0.42, bendRadius(x, z)) *
          (1 - smoothstep(1.58, 1.7, bendRadius(x, z))) *
          smoothstep(0, 0.13, 1 - Math.abs(x)) *
          smoothstep(0, 0.13, 1 - Math.abs(z)),
      );
    const water = waterRing.intersect(
      sdf.box([TILE + 2 * EDGE, 0.4, TILE + 2 * EDGE]).at(0, -0.2, 0),
    );

    const waterPaint = (x: number, y: number, z: number): Rgb => {
      const d = Math.abs(bendRadius(x, z) - 1);
      // Deep blue-green through the middle of the channel; lighter aqua as a thin rim at the
      // banks, with a slight tone drift so the surface is not perfectly uniform.
      let col = mixRgb(waterShallow, waterDeep, 1 - smoothstep(0.5, 0.64, d));
      col = mixRgb(col, waterDeep, 0.1 * noise.fbm(x * 5, y * 5, z * 5, 2));
      return mixRgb(col, waterDeep, clamp01((WATER_Y - y) / 0.15) * 0.7);
    };

    k.body('water', water.paintFn(waterPaint), {
      color: waterDeep,
      roughness: 0.55,
            paintWeight: 2,
      detail: 0.02,
      bump: (x, y, z) => 0.0011 * noise.fbm(x * 45, y * 25, z * 45, 2),
    });

    // ------------------------------------------------------------------ pebbles on the shores
    // Placed with a surface probe so they sit half-buried in the sand, never floating.
    const stone = (x: number, z: number, s: number): sdf.Shape => {
      const p = sdf.surfacePoint(ground, [x, 0.25, z], 0.002 * s);
      return sdf
        .ellipsoid([0.024 * s, 0.015 * s, 0.028 * s])
        .rotateY(30 * s)
        .at(p[0], p[1], p[2]);
    };
    k.body(
      'pebbles',
      sdf
        .union(stone(0.23, 0.48, 1.3), stone(0.7, 0.67, 0.95), stone(0.74, -0.78, 1.1))
        .paintFn(
          (x, y, z, base) =>
            mixRgb(base, rgb('#6f6961'), 0.35 + 0.3 * noise.fbm(x * 90, y * 90, z * 90, 2)),
        ),
      {
        color: '#9b948a',
        roughness: 0.85,
        detail: 0.008,
      },
    );
  },
});
