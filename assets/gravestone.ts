import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — weathered gravestone (props/world/gravestone).
 *
 * Role: graveyard decoration for the Sunken Vault dungeon kit; must read at 128 px.
 * Size: about 0.8 m tall, 0.52 m wide with the side tabs, stands on y = 0, centred on Y, faces +Z.
 * One idea: a broad rounded-top headstone with a chunky raised cross in a dark recessed panel,
 *   leaning slightly, over a two-tier footing and a row of cobbles on a low mound of earth.
 * Shape language: square dominant (sturdy slab and footing), round secondary (wide arched crown,
 *   cobbles); the sideways lean and the side tabs break the flat silhouette.
 * Palette: dungeon stone #6f7680 (dominant), dark #4b525c (recess, earth, ground grime),
 *   pale #9aa1ab (cross, worn edges), moss #4d6b3a accent low on the stone.
 * Materials: weathered stone (roughness 0.9, metalness 0), damp earth (roughness 0.95),
 *   cobbles stone. All grain and pitting live in `bump`, not in geometry.
 * Details: arched slab (big), two footing tiers + side tabs (medium), carved cross, jagged
 *   crack, moss, grain bump (small). Focal point: the pale cross on the dark panel.
 * Rig/animation: none (static prop).
 */

const STONE = '#6f7680';
const STONE_DARK = '#4b525c';
const STONE_PALE = '#9aa1ab';
const CRACK_DARK = '#343a43';
const EARTH = '#45474b';
const EARTH_LIGHT = '#565960';
const MOSS = '#4d6b3a';

// ------------------------------------------------------------------ helpers

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Outline of a rounded-top slab, bottom flat at `y0`, crown a half circle of radius `halfW`.
 * Straight sides are subdivided and the crown is sampled so straight segments read round.
 */
function archProfile(halfW: number, height: number, y0 = 0, segs = 20): [number, number][] {
  const pts: [number, number][] = [];
  const shoulder = height - halfW;
  const sideN = 3;
  for (let i = 0; i <= sideN; i++) pts.push([-halfW, y0 + (shoulder * i) / sideN]);
  for (let i = 1; i <= segs; i++) {
    const a = Math.PI - (Math.PI * i) / segs;
    pts.push([halfW * Math.cos(a), y0 + shoulder + halfW * Math.sin(a)]);
  }
  for (let i = sideN - 1; i >= 0; i--) pts.push([halfW, y0 + (shoulder * i) / sideN]);
  return pts;
}

// ------------------------------------------------------------------ dimensions

const SLAB_W = 0.205; // half width (slab is 0.41 m wide)
const SLAB_H = 0.665;
const SLAB_D = 0.115;
const SLAB_Y = 0.13; // slab base sits sunk into the footing
const TILT_Z = 5; // sideways lean (degrees)
const TILT_X = -2.5; // slight backward lean

const BORDER = 0.055; // raised frame around the recessed panel
const POCKET_W = SLAB_W - BORDER;
const POCKET_H = SLAB_H - 2 * BORDER;
const POCKET_Y = BORDER;
const RECESS = 0.026; // how deep the panel is cut into the front face
const POCKET_Z = SLAB_D / 2 - RECESS + 0.17; // extrude centre so the cut floor sits at the panel

const CROSS_Y = 0.345;
const CROSS_Z = 0.055;

export default defineAsset({
  name: 'gravestone',
  description:
    'Weathered 0.8 m gravestone: leaning rounded-top stone slab with a raised cross in a dark recessed panel, a crack, and cobbles on a low mound of earth in front.',
  reference: 'docs/item-mockups/gravestone-mock.jpg',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- slab body
    const slabSolid = sdf
      .extrude(profile.polygon(archProfile(SLAB_W, SLAB_H)), SLAB_D, 0.015)
      .round(0.004);

    // Recessed panel: cut the inner arch profile 26 mm into the front face.
    const pocketLocal = sdf
      .extrude(profile.polygon(archProfile(POCKET_W, POCKET_H, POCKET_Y)), 0.34, 0.01)
      .at(0, 0, POCKET_Z);

    // Raised border frame: a proud arch ring around the recessed panel.
    const frameSolid = sdf
      .extrude(profile.polygon(archProfile(SLAB_W - 0.006, SLAB_H - 0.006)), 0.04, 0.012)
      .subtract(pocketLocal)
      .at(0, 0, 0.052);

    // Carved cross: two rounded bars, a plus with a slightly longer lower arm.
    const crossLocal = sdf
      .union(
        sdf.box([0.06, 0.2, 0.034], 0.015).at(0, 0.012, 0),
        sdf.box([0.155, 0.06, 0.034], 0.015).at(0, 0.036, 0),
      )
      .at(0, CROSS_Y, CROSS_Z);

    // Side tabs: small rounded blocks that break the silhouette.
    const tabs = sdf.box([0.085, 0.12, 0.115], 0.032).at(0.24, 0.4, 0).mirror('x', 0);

    // Jagged crack stencil: thin boxes forming a short zigzag across the panel.
    const crackSeg = (a: [number, number], b: [number, number], w: number) => {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      return sdf
        .box([len + w, w, 0.16], w * 0.35)
        .rotateZ(ang)
        .at((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.05);
    };
    const crackPath: [number, number][] = [
      [-0.17, 0.42],
      [-0.145, 0.52],
      [-0.15, 0.585],
    ];
    const crack2: [number, number][] = [
      [0.17, 0.3],
      [0.16, 0.22],
    ];
    const crackLocal = sdf.union(
      ...crackPath.slice(1).map((p, i) => crackSeg(crackPath[i]!, p, 0.005)),
      ...crack2.slice(1).map((p, i) => crackSeg(crack2[i]!, p, 0.0045)),
    );

    // ---------------------------------------------------------------- stone paint
    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const t = clamp01(y / 0.78);
      let c = mixRgb(rgb('#343a43'), base, clamp01(0.28 + 0.72 * t));
      c = mixRgb(c, rgb('#a3acb9'), 0.7 * smoothstep(0.48, 0.95, t));
      // Damp grime at the ground line.
      c = mixRgb(c, rgb('#2d333b'), 0.7 * (1 - smoothstep(0.0, 0.18, y)));
      // Weathered patches and speckle.
      const patch = noise.fbm(x * 4.5, y * 4.5, z * 4.5, 3, 3);
      c = mixRgb(c, rgb(STONE_DARK), clamp01(-patch) * 0.45);
      c = mixRgb(c, rgb(STONE_PALE), clamp01(patch) * 0.2);
      const grain = noise.fbm(x * 48, y * 48, z * 48, 2, 21);
      c = mixRgb(c, rgb(STONE_DARK), clamp01(grain) * 0.28);
      // Moss creeping up from the ground.
      const gate = noise.fbm(x * 8, y * 8, z * 8, 3, 6) * 0.5 + 0.5;
      const moss = (1 - smoothstep(0.05, 0.22, y)) * clamp01((gate - 0.5) * 2.2);
      return mixRgb(c, rgb(MOSS), moss * 0.6);
    };

    const slabWorld = slabSolid
      .subtract(pocketLocal)
      .smoothUnion(0.005, frameSolid)
      .smoothUnion(0.008, crossLocal)
      .smoothUnion(0.012, tabs)
      .paintFn(stonePaint)
      .paintWhere(pocketLocal.round(0.002), '#2f353e', 0.008) // shadowed recess
      .paintWhere(crossLocal.round(0.004), '#c2cbd8', 0.004) // pale carved cross
      .paintWhere(crackLocal, CRACK_DARK, 0.0025) // dark crack
      .rotateZ(TILT_Z)
      .rotateX(TILT_X)
      .at(0, SLAB_Y, 0);

    // ---------------------------------------------------------------- footing
    const foot = sdf
      .smoothUnion(
        0.016,
        sdf.box([0.52, 0.11, 0.34], 0.024).at(0, 0.055, 0),
        sdf.box([0.45, 0.075, 0.28], 0.018).at(0, 0.145, 0),
      )
      .paintFn(stonePaint);

    k.body('stone', foot.smoothUnion(0.012, slabWorld), {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.007,
      paintWeight: 2,
      maxTriangles: 1750,
      bump: (x, y, z) =>
        0.0018 * noise.fbm(x * 30, y * 30, z * 30, 3, 7) +
        0.0007 * noise.noise3(x * 90, y * 90, z * 90, 11),
    });

    // ---------------------------------------------------------------- earth mound
    const mound = sdf
      .ellipsoid([0.18, 0.042, 0.115])
      .at(0, 0.0, 0.195)
      .displace(0.014, (x, y, z) => noise.fbm(x * 9, y * 9, z * 9, 3, 4))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const earthPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const n = noise.fbm(x * 14, y * 14, z * 14, 3, 8) * 0.5 + 0.5;
      let c = mixRgb(rgb(EARTH), rgb(EARTH_LIGHT), n * 0.6);
      c = mixRgb(c, rgb(STONE_DARK), 0.3 * (1 - smoothstep(0, 0.05, y)));
      const speck = noise.fbm(x * 40, y * 40, z * 40, 2, 17);
      const gate = noise.fbm(x * 11, y * 11, z * 11, 2, 5) * 0.5 + 0.5;
      c = mixRgb(c, rgb(STONE), clamp01((speck - 0.5) * 2.5) * 0.35);
      c = mixRgb(c, rgb(MOSS), clamp01((gate - 0.55) * 2.2) * 0.45);
      return mixRgb(c, base, 0.15);
    };
    k.body('earth', mound.paintFn(earthPaint), {
      color: EARTH,
      roughness: 0.95,
      metalness: 0,
      detail: 0.02,
      maxTriangles: 280,
      bump: (x, y, z) => 0.004 * noise.fbm(x * 34, y * 34, z * 34, 2, 15),
    });

    // ---------------------------------------------------------------- cobbles
    const cobblePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const t = clamp01(y / 0.08);
      let c = mixRgb(rgb(STONE_DARK), base, clamp01(0.45 + 0.55 * t));
      c = mixRgb(c, rgb(STONE_PALE), 0.5 * smoothstep(0.5, 0.95, t));
      const grain = noise.fbm(x * 50, y * 50, z * 50, 2, 31);
      c = mixRgb(c, rgb(STONE_DARK), clamp01(grain) * 0.3);
      const gate = noise.fbm(x * 12, y * 12, z * 12, 2, 9) * 0.5 + 0.5;
      const moss = (1 - smoothstep(0.0, 0.045, y)) * clamp01((gate - 0.42) * 2.2);
      return mixRgb(c, rgb(MOSS), moss * 0.5);
    };
    const spots: [number, number, number][] = [
      [0.26, 0.3, 0.05],
      [-0.26, 0.3, 0.048],
      [0.09, 0.35, 0.058],
      [-0.09, 0.35, 0.052],
      [0.0, 0.31, 0.05],
      [0.36, 0.21, 0.043],
      [-0.36, 0.21, 0.041],
    ];
    const cobbles = sdf
      .union(
        ...spots.map(([x, z, r], i) =>
          sdf
            .ellipsoid([r, r * 0.82, r * 0.95])
            .displace(0.012, (px, py, pz) => noise.fbm(px * 20 + i * 3, py * 20, pz * 20, 3, i + 2))
            .at(x, r * 0.78, z),
        ),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('cobbles', cobbles.paintFn(cobblePaint), {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.016,
      maxTriangles: 600,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 45, y * 45, z * 45, 2, 23),
    });
  },
});
