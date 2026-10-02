import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — chibi windmill (architecture/structure/windmill).
 *
 * Role: hamlet landmark on the village map; must read at 128 px sprite. No rig, no clips.
 * Size: ~2.55 m sail span (X), ~5.0 m to the cap finial (Y); stands on y = 0, centred on the
 *   Y axis, door and sail hub facing +Z.
 * One idea: a chunky round stone tower wearing a walnut "wizard hat" cap, crossed by four big
 *   honey-oak lattice sails with burlap cloth — the X silhouette must read instantly.
 * Shape language: round dominant (tapered tower, conical cap, round window); square secondary
 *   (ladder sails, arched door). Soft bevels everywhere.
 * Palette: blue-gray stone #9499a2 (dominant), walnut cap #6b4226, honey oak sails #b5814a,
 *   burlap cloth #c8a86b, straw tips #e0bb60, warm brown door #8a5a35, dark iron #4a4f55,
 *   one warm orange glow in the window (emissive #ff8f45 over dark base #4a1405).
 * Materials: stone (0.9), cap/door wood (0.8), sail wood (0.8), cloth (0.88), worn iron
 *   (0.5 / metal 0.7), glass (0.2, emissive 1.8). Stone cells + plank grooves live in bump.
 * Detail list: (1) tapered stone tower + footing bulge, (2) cap + finial, (3) hub + axle +
 *   four lattice sails + cloth, (4) arched plank door + stone frame, (5) glowing round window,
 *   (6) stone step. Focal point: the sail cross.
 */

const C = {
  stone: rgb('#7d838e'),
  stoneDark: rgb('#5f656f'),
  mortar: rgb('#979ca6'),
  oak: rgb('#b5814a'),
  oakDark: rgb('#8a5a35'),
  pale: rgb('#c9a06a'),
  walnut: rgb('#6b4226'),
  walnutDark: rgb('#4e2f1a'),
  burlap: rgb('#c8a86b'),
  burlapDark: rgb('#a98a4f'),
  straw: rgb('#e0bb60'),
  iron: rgb('#4a4f55'),
  ironDark: rgb('#363a3f'),
  void: rgb('#241a12'),
  glowBase: rgb('#4a1405'),
};

const HUB_Y = 3.5;
const SAIL_Z = 0.97; // plane of the sails, just proud of the hub dome
const TILT = 25; // sail cross tilt, degrees

const sstep = (e0: number, e1: number, v: number): number => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

const grooveAt = (f: number) => Math.pow(0.5 + 0.5 * Math.cos(Math.PI * 2 * f), 3);

/** Blue-gray fieldstone: worley mortar grooves plus a smooth per-area tint.
 *  The tint and the mortar ramp must stay continuous and wider than a mesh cell —
 *  hard paint transitions would cut paint seams into the vertex-color mesh.
 *  The crisp stone relief lives in `stoneBump`. */
const stonePaint =
  (base: Rgb, dark: Rgb, mortar: Rgb) =>
  (x: number, y: number, z: number) => {
    const { f1, f2 } = noise.worley(x * 5, y * 7.5, z * 5, 4);
    const gap = sstep(0.05, 0.3, f2 - f1);
    const tint = 0.5 + 0.5 * noise.fbm(x * 4, y * 4.4, z * 4, 2);
    let c = mixRgb(base, dark, 0.26 * tint);
    c = mixRgb(c, mortar, 0.75 * (1 - gap));
    return c;
  };

const stoneBump = (x: number, y: number, z: number) => {
  const { f1, f2 } = noise.worley(x * 5, y * 7.5, z * 5, 4);
  return -0.005 * (1 - sstep(0.05, 0.25, f2 - f1)) + 0.001 * noise.fbm(x * 12, y * 12, z * 12, 2);
};

/** Arched outline in XY: rectangle with a half-round top of radius halfW. */
const archProfile = (halfW: number, bot: number, spring: number) => {
  const pts: [number, number][] = [
    [-halfW, bot],
    [halfW, bot],
  ];
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI * i) / n;
    pts.push([halfW * Math.cos(a), spring + halfW * Math.sin(a)]);
  }
  return profile.polygon(pts);
};

/** Vertical plank paint for the door. */
const PLANK = 0.105;
const doorPaint = (x: number, y: number, z: number, base: Rgb) => {
  const f = x / PLANK - Math.floor(x / PLANK);
  const g = grooveAt(f);
  const board = 0.5 + 0.5 * noise.fbm(x * 4, y * 1.2, 0, 2);
  const grain = 0.5 + 0.5 * noise.fbm(x * 24, y * 7, 0, 2);
  let c = mixRgb(base, C.walnutDark, 0.1 + 0.2 * board);
  c = mixRgb(c, C.walnutDark, 0.12 * grain);
  c = mixRgb(c, C.walnutDark, 0.7 * g);
  return c;
};

export default defineAsset({
  name: 'windmill',
  description:
    'Chibi stone windmill with a tapered round tower, walnut conical cap, and four honey-oak lattice sails with burlap cloth on a front hub; arched plank door, glowing round window, stone step.',
  detail: 0.012,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/windmill-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- tower (stone)
    const towerProfile = profile.polygon(
      [
        [0, 0.0],
        [0.8, 0.0],
        [0.9, 0.03],
        [0.965, 0.12],
        [0.97, 0.2],
        [0.9, 0.28],
        [0.86, 0.45],
        [0.815, 0.95],
        [0.775, 1.55],
        [0.735, 2.2],
        [0.7, 2.9],
        [0.665, 3.5],
        [0.645, 3.85],
        [0.62, 3.95],
        [0, 3.98],
      ],
      { smooth: true, samples: 14 },
    );
    // The smoothed profile overshoots the axis corners; clip the hidden bottom
    // (the ground touch stays an exact plane) and the cap apex under the finial.
    const tower = sdf
      .revolve(towerProfile)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(stonePaint(C.stone, C.stoneDark, C.mortar));
    k.body('tower', tower, {
      color: C.stone,
      roughness: 0.9,
      detail: 0.018,
      maxError: 0.006,
      bump: stoneBump,
    });

    // ---------------------------------------------------------------- cap (walnut wood)
    const capProfile = profile.polygon(
      [
        [0.5, 3.8],
        [0.7, 3.84],
        [0.78, 3.94],
        [0.76, 4.06],
        [0.66, 4.24],
        [0.5, 4.44],
        [0.32, 4.62],
        [0.16, 4.74],
        [0.06, 4.81],
        [0, 4.84],
      ],
      { smooth: true, samples: 14 },
    );
    const finial = sdf
      .cylinder(0.05, 0.1, 0.02)
      .at(0, 4.87, 0)
      .union(sdf.sphere(0.085).at(0, 4.94, 0));
    const cap = sdf
      .revolve(capProfile)
      .intersect(sdf.halfSpace([0, 1, 0], 4.88))
      .union(finial);
    const capPlanks = cap.paintFn((x, y, z) => {
      const a = (Math.atan2(z, x) / Math.PI / 2 + 0.5) * 16;
      const plank = Math.floor(a);
      const tint = noise.random(plank, 3);
      let c = mixRgb(C.walnut, C.walnutDark, 0.12 + 0.3 * tint);
      c = mixRgb(c, C.walnutDark, 0.75 * grooveAt(a));
      return mixRgb(c, C.oak, 0.28 * sstep(4.45, 4.85, y));
    });
    k.body('cap', capPlanks, {
      color: C.walnut,
      roughness: 0.8,
      detail: 0.016,
      maxError: 0.006,
      bump: (x, y, z) => {
        const a = (Math.atan2(z, x) / Math.PI / 2 + 0.5) * 16;
        return 0.005 * grooveAt(a) + 0.002 * noise.fbm(x * 20, y * 8, z * 20, 2);
      },
    });

    // ---------------------------------------------------------------- hub and axle
    const hubWood = sdf
      .cylinder(0.21, 0.2, 0.03)
      .rotateX(90)
      .at(0, HUB_Y, 0.83)
      .union(sdf.ellipsoid([0.17, 0.17, 0.09]).at(0, HUB_Y, 0.93));
    k.body(
      'hub',
      hubWood.paintFn((x, y, z, base) => {
        const r = Math.hypot(x, y - HUB_Y);
        return mixRgb(base, C.walnutDark, 0.55 * sstep(0.1, 0.2, r));
      }),
      { color: C.oakDark, roughness: 0.8, detail: 0.01, maxError: 0.004, textureDensity: 2 },
    );

    const ironwork = sdf.union(
      // axle from the tower face into the hub
      sdf.cylinder(0.05, 0.16, 0.015).rotateX(90).at(0, HUB_Y, 0.67),
      // hub pin and cap nut
      sdf.cylinder(0.048, 0.08, 0.01).rotateX(90).at(0, HUB_Y, 0.99),
      sdf.sphere(0.052).at(0, HUB_Y, 1.04),
      // door straps and ring handle
      sdf.box([0.5, 0.05, 0.024], 0.01).at(0, 0.52, 0.9),
      sdf.box([0.5, 0.05, 0.024], 0.01).at(0, 0.86, 0.9),
      sdf.torus(0.045, 0.011).rotateX(90).at(0.17, 0.68, 0.915),
    );
    k.body('ironwork', ironwork, { color: C.iron, roughness: 0.5, metalness: 0.7, detail: 0.008 });

    // ---------------------------------------------------------------- sails (lattice wood + cloth)
    // One sail built pointing +Y in the z = 0 plane: two tapering rails, three rungs,
    // a straw tip cap. Four copies rotated about Z, then the cross tilted by TILT.
    const railX = (y: number) => 0.14 + (0.27 - 0.14) * ((y - 0.16) / (1.22 - 0.16));
    const sailWoodOne = sdf.union(
      sdf.cone([0.14, 0.16, 0], [0.27, 1.22, 0], 0.03, 0.024),
      sdf.cone([-0.14, 0.16, 0], [-0.27, 1.22, 0], 0.03, 0.024),
      sdf.cone([-railX(0.34) + 0.02, 0.34, 0], [railX(0.34) - 0.02, 0.34, 0], 0.017, 0.017),
      sdf.cone([-railX(0.5) + 0.02, 0.5, 0], [railX(0.5) - 0.02, 0.5, 0], 0.017, 0.017),
      sdf.cone([-railX(0.63) + 0.02, 0.63, 0], [railX(0.63) - 0.02, 0.63, 0], 0.017, 0.017),
      sdf.box([0.63, 0.12, 0.055], 0.024).paint(C.straw).at(0, 1.21, 0),
    );
    const sailWood = sdf.union(
      sailWoodOne,
      sailWoodOne.rotateZ(90),
      sailWoodOne.rotateZ(180),
      sailWoodOne.rotateZ(270),
    )
      .rotateZ(TILT)
      .at(0, HUB_Y, SAIL_Z);
    k.body(
      'sails',
      sailWood.paintFn((x, y, z, base) => {
        const grain = 0.5 + 0.5 * noise.fbm(x * 2, y * 2, z * 2, 2);
        return mixRgb(base, C.oakDark, 0.12 + 0.18 * grain);
      }),
      {
        color: C.oak,
        roughness: 0.8,
        detail: 0.008,
        maxError: 0.004,
        bump: (x, y, z) => 0.002 * noise.fbm(x * 22, y * 6, z * 22, 2),
      },
    );

    // Cloth panel on the outer end of each sail; ribs run along the sail. Paint and
    // bump are evaluated in each panel's local frame, before the 90-degree copies.
    const ribAt = (x: number) => {
      const f = x / 0.09 - Math.floor(x / 0.09);
      return grooveAt(f);
    };
    const clothOne = sdf
      .extrude(
        profile.polygon([
          [-0.2, 0.62],
          [0.2, 0.62],
          [0.285, 1.22],
          [-0.285, 1.22],
        ]),
        0.022,
        0.008,
      )
      // Ribs are grooved in each panel's local frame, before the 90-degree copies:
      // body-level bump would see world space, where three panels run sideways.
      .displace(0.0035, (x, y, z) => -(ribAt(x) + 0.35 * (0.5 + 0.5 * noise.fbm(x * 30, y * 10, z * 30, 2))))
      .paintFn((x, y, z, base) => {
        // Continuous lengthwise fade so the vertex-color mesh stays light.
        const tint = 0.5 + 0.5 * noise.fbm(0, y * 3.5, 0, 2);
        let c = mixRgb(base, C.burlapDark, 0.28 + 0.3 * tint);
        return mixRgb(c, C.burlapDark, 0.6 * ribAt(x));
      });
    const cloth = sdf
      .union(clothOne, clothOne.rotateZ(90), clothOne.rotateZ(180), clothOne.rotateZ(270))
      .rotateZ(TILT)
      .at(0, HUB_Y, SAIL_Z);
    k.body('cloth', cloth, {
      color: C.burlap,
      roughness: 0.88,
      detail: 0.01,
      maxError: 0.004,
    });

    // ---------------------------------------------------------------- door
    const opening = sdf.extrude(archProfile(0.34, 0.1, 1.0), 0.18, 0.012).at(0, 0, 0.76);
    k.body('door-opening', opening, { color: C.void, roughness: 0.9, detail: 0.012, maxError: 0.005 });

    const leaf = sdf
      .extrude(archProfile(0.3, 0.14, 0.98), 0.1, 0.015)
      .at(0, 0, 0.84)
      .paintFn(doorPaint);
    k.body('door', leaf, {
      color: C.oakDark,
      roughness: 0.8,
      detail: 0.01,
      maxError: 0.004,
      textureDensity: 2,
      bump: (x, y, z) => {
        const f = x / PLANK - Math.floor(x / PLANK);
        return -0.004 * grooveAt(f) + 0.0015 * noise.fbm(x * 24, y * 7, 0, 2);
      },
    });

    // ---------------------------------------------------------------- round window
    const glass = sdf.extrude(profile.circle(0.135), 0.05).at(0, 2.45, 0.71);
    k.body('window-glass', glass, {
      color: C.glowBase,
      roughness: 0.2,
      emissive: rgb('#ff8f45'),
      emissiveIntensity: 1.8,
      detail: 0.012,
    });

    // ---------------------------------------------------------------- stone trim and step
    const doorFrame = sdf
      .extrude(archProfile(0.43, 0.08, 1.0), 0.16, 0.02)
      .subtract(sdf.extrude(archProfile(0.345, 0.12, 1.0), 0.5))
      .at(0, 0, 0.8);
    const windowFrame = sdf
      .extrude(profile.circle(0.205), 0.1, 0.015)
      .subtract(sdf.extrude(profile.circle(0.14), 0.5))
      .at(0, 2.45, 0.72);
    const mullions = sdf.union(
      sdf.box([0.34, 0.035, 0.035], 0.012).at(0, 2.45, 0.75),
      sdf.box([0.035, 0.34, 0.035], 0.012).at(0, 2.45, 0.75),
    );
    k.body('mullions', mullions, { color: C.walnut, roughness: 0.8, detail: 0.01, maxError: 0.004 });

    const step = sdf.box([0.68, 0.14, 0.42], 0.035).at(0, 0.07, 0.97);
    k.body(
      'trim',
      sdf.union(doorFrame, windowFrame, step).paintFn(stonePaint(C.stone, C.stoneDark, C.mortar)),
      {
        color: C.stone,
        roughness: 0.9,
        detail: 0.012,
        maxError: 0.005,
        textureDensity: 2,
        bump: stoneBump,
      },
    );
  },
});
