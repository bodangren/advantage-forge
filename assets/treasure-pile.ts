import { defineAsset, sdf, noise, rgb, mixRgb } from '../src/index.js';

/**
 * Design note — treasure pile (props/world/treasure-pile).
 *
 * Role: dungeon treasure dressing and focal interactable for the Sunken Vault. On screen it is
 *   a background prop, so silhouette and value carry it; it is not a pickup icon.
 * Size: 1.2 m wide (X), about 0.58 m tall, centered on the Y axis, stands on y = 0, faces +Z.
 * One idea: a low heap of old-gold coins crowned by a tall golden goblet, with a crown lying
 *   in the spill and a small open chest emptying itself into the heap. The goblet is the focal
 *   point; gems give it colour.
 * Shape language: round dominant (coins, cup, domed mound, gems), square secondary (the chest
 *   and the crown band give a sturdy read).
 * Palette: old gold #d4a93a dominant, deep gold #4e3406 / #7a5410 shadows, sparkle #f0d78a;
 *   ruby #e0402a and emerald #35c25a accents; chest wood #6b4324, iron #3d4047.
 * Materials: gold (metalness 1, roughness 0.3); gems (flat, faint glow, dark base); wood
 *   (roughness 0.82); worn iron (roughness 0.5, metalness 0.7).
 * Detail list: primary mound + goblet; secondary crown + open chest + spill coins; tertiary
 *   coin stamping and gold speckle in `bump`. Focal point: the goblet against the mound.
 * Rig/animation: none (static dressing).
 */

const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#7a5410');
const GOLD_DEEP = rgb('#4e3406');
const SPARK = rgb('#f0d78a');
const WOOD = rgb('#6b4324');
const WOOD_DARK = rgb('#331c0c');

// Heap: a low half-ellipsoid on the ground. Coins rest on its shell.
const RX = 0.33;
const RY = 0.09;
const RZ = 0.29;
const COIN_T = 0.04;

/** Surface height of the heap envelope at (x, z); 0 outside the footprint. */
const topY = (x: number, z: number): number => {
  const q = 1 - (x / RX) ** 2 - (z / RZ) ** 2;
  return q <= 0 ? 0 : RY * Math.sqrt(q);
};

/** Chunky coin: a thick rounded-edge disc, so each face reads as one stamped coin. */
const disc = (r: number): sdf.Shape => sdf.cylinder(r, COIN_T, 0.012);

/** A coin lying on the heap at normalized radius `u`, tilted outward down the slope. */
const heapCoin = (u: number, theta: number, r: number, deg: number, jit: number): sdf.Shape => {
  const x = RX * u * Math.cos(theta);
  const z = RZ * u * Math.sin(theta);
  const y = topY(x, z) + 0.004;
  return disc(r)
    .rotate(deg * Math.sin(theta) + jit, 0, -deg * Math.cos(theta) - jit * 0.5)
    .at(x, y, z);
};

/** A coin standing on edge at (x, y, z). */
const uprightCoin = (r: number, x: number, y: number, z: number, yaw: number, axis: 'x' | 'z'): sdf.Shape => {
  const spun = axis === 'z' ? disc(r).rotateX(90) : disc(r).rotateZ(90);
  return spun.rotateY(yaw).at(x, y, z);
};

/** Faceted gem: a compact rounded bipyramid, flat-shaded. */
const gemAt = (s: number, x: number, y: number, z: number): sdf.Shape =>
  sdf
    .union(
      sdf.cone([0, -0.035 * s, 0], [0, 0.009 * s, 0], 0.004, 0.036 * s),
      sdf.cone([0, 0.009 * s, 0], [0, 0.045 * s, 0], 0.036 * s, 0.004),
    )
    .at(x, y, z);

/**
 * Golden goblet from plain primitives: wide bell foot, slim stem with a round knop, a flaring
 * bowl, and a chunky flared rim. Hollow through the rim so the lip reads clean. Height 0.42 m.
 */
const GOBLET_H = 0.42;
function goblet(): sdf.Shape {
  const foot = sdf.smoothUnion(
    0.007,
    sdf.cylinder(0.088, 0.024, 0.008).at(0, 0.012, 0),
    sdf.cone([0, 0.02, 0], [0, 0.062, 0], 0.076, 0.024),
  );
  const stem = sdf.cylinder(0.017, 0.1, 0.004).at(0, 0.1, 0);
  const knop = sdf.sphere(0.03).at(0, 0.095, 0);
  const bowl = sdf.smoothUnion(
    0.009,
    sdf.sphere(0.058).at(0, 0.185, 0),
    sdf.cone([0, 0.185, 0], [0, 0.37, 0], 0.058, 0.098),
  );
  const rim = sdf.cylinder(0.106, 0.038, 0.012).at(0, 0.372, 0);
  const cavity = sdf.smoothUnion(
    0.006,
    sdf.sphere(0.044).at(0, 0.19, 0),
    sdf.cone([0, 0.19, 0], [0, 0.42, 0], 0.044, 0.09),
  );
  return sdf
    .smoothUnion(0.006, foot, stem, knop, bowl, rim)
    .smoothSubtract(0.005, cavity)
    .paintWhere(cavity.round(0.0005), GOLD_DEEP, 0.008)
    .paintWhere(sdf.box([0.3, 0.02, 0.3]).at(0, 0.372, 0), SPARK, 0.006);
}

/**
 * Golden crown: a hollow band with six flattened points and bead tips. Authored centred at its
 * own base centre; radius ~0.13 m, height ~0.14 m.
 */
function crown(): sdf.Shape {
  const band = sdf
    .cylinder(0.128, 0.08, 0.012)
    .subtract(sdf.cylinder(0.11, 0.12, 0.004))
    .intersect(sdf.halfSpace([0, 1, 0], 0.038))
    .intersect(sdf.halfSpace([0, -1, 0], 0.04));
  const parts: sdf.Shape[] = [band];
  for (let i = 0; i < 6; i++) {
    const a = i * 60;
    parts.push(
      sdf
        .cone([0, 0.032, 0], [0, 0.098, 0], 0.042, 0.008)
        .scale([0.5, 1, 1])
        .at(0.115, 0, 0)
        .rotateY(a),
    );
    parts.push(sdf.sphere(0.012).at(0.115, 0.1, 0).rotateY(a));
  }
  return sdf.union(...parts);
}

/** Gold paint: dark crevices, warm mid body, bright sparkle on worn highlights. */
const goldPaint = (x: number, y: number, z: number): readonly [number, number, number] => {
  const blotch = noise.fbm(x * 6, y * 6, z * 6, 2);
  let c = mixRgb(GOLD_DARK, GOLD, 0.72 + 0.24 * blotch);
  const value = Math.min(1, Math.max(0, y / 0.32));
  c = mixRgb(GOLD_DEEP, c, 0.55 + 0.45 * value);
  const n = noise.noise3(x * 26, y * 26, z * 26);
  if (n > 0.4) c = mixRgb(c, SPARK, Math.min(1, (n - 0.4) * 1.6));
  return c;
};

// Chest dimensions (the chest is authored in its own local frame).
const CW = 0.3; // width (X)
const CD = 0.22; // depth (Z)
const CH = 0.14; // body height

export default defineAsset({
  name: 'treasure-pile',
  description:
    'Mound of old-gold coins with a golden goblet, a crown, red and green gems, and a small open chest spilling coins.',
  detail: 0.007,
  reference: 'docs/item-mockups/treasure-pile-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------------- gold: mound + coins
    // A low smooth dome, tiled with tidily tilted coins (shingled rings + a flat spill).
    const core = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([RX, RY, RZ]),
        sdf.ellipsoid([0.19, 0.085, 0.17]).at(0.06, 0, -0.04),
      )
      .displace(0.007, (x, _y, z) => noise.fbm(x * 10, 0.5, z * 10, 2))
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const coins: sdf.Shape[] = [];
    const rings: [number, number, number, number][] = [
      // normalized radius, count, coin radius, outward tilt (deg)
      [0.9, 8, 0.073, 20],
      [0.55, 6, 0.069, 11],
      [0.2, 3, 0.072, 4],
    ];
    rings.forEach(([u, count, r, deg], ri) => {
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2 + ri * 0.7 + noise.random(ri, i + 3) * 0.25;
        const ur = u + (noise.random(ri, i + 40) - 0.5) * 0.08;
        const jit = (noise.random(ri + 9, i) - 0.5) * 10;
        coins.push(heapCoin(ur, theta, r, deg, jit));
      }
    });

    // Spilled coins lying flat around the base widen the footprint toward 1.1 m.
    const spillSpecs: [number, number, number, number][] = [
      [-0.5, 0.14, 14, 0.088],
      [0.51, 0.11, -12, 0.086],
      [-0.18, -0.38, 20, 0.088],
      [0.2, -0.36, -18, 0.086],
      [-0.53, -0.06, 10, 0.084],
      [0.54, -0.03, -8, 0.084],
      [0.04, 0.46, 6, 0.086],
    ];
    const spill = spillSpecs.map(([x, z, tilt, r]) =>
      disc(r).rotate(0, 0, tilt).at(x, COIN_T / 2 + 0.008, z),
    );

    // Coins standing on edge break the silhouette at the rim.
    const standing = [
      uprightCoin(0.068, 0.47, 0.07, 0.05, 14, 'z'),
      uprightCoin(0.066, -0.48, 0.068, -0.05, -22, 'z'),
      uprightCoin(0.064, 0.2, 0.066, 0.32, 40, 'x'),
    ];

    // The crown rests in the spill at the right, tipped toward the camera.
    const crownShape = crown().rotate(18, 10, 8).at(0.27, 0.125, 0.05);

    const goldMound = sdf
      .union(core, ...coins, ...spill, ...standing, crownShape)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(goldPaint);

    k.body('gold-mound', goldMound, {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.013,
      maxError: 0.002,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 55, y * 55, z * 55, 2),
      maxTriangles: 3200,
    });

    // ---------------------------------------------------------------- gold: goblet (focal)
    const gobletBaseY = 0.08;
    k.body('gold-goblet', goblet().rotate(0, 12, 0).at(0, gobletBaseY, 0), {
      color: GOLD,
      roughness: 0.28,
      metalness: 1,
      detail: 0.006,
      maxError: 0.002,
      bump: (x, y, z) => 0.0007 * noise.fbm(x * 60, y * 60, z * 60, 2),
      maxTriangles: 1200,
    });

    // ---------------------------------------------------------------- gems (accents)
    // Two rest in the goblet mouth, three more poke out of the heap.
    const rimY = gobletBaseY + GOBLET_H - 0.015;
    const redGem = sdf.union(
      gemAt(1.0, 0.03, rimY + 0.015, 0.005),
      gemAt(1.3, 0.15, topY(0.15, 0.2) + 0.03, 0.2),
    );
    const greenGem = sdf.union(
      gemAt(0.9, -0.045, rimY + 0.035, 0.025),
      gemAt(1.2, -0.17, topY(-0.17, 0.18) + 0.03, 0.18),
      gemAt(1.0, 0.08, topY(0.08, -0.24) + 0.028, -0.24),
    );
    k.body('gems-red', redGem, {
      color: '#5a1410',
      roughness: 0.1,
      metalness: 0.05,
      flat: true,
      emissive: '#e0402a',
      emissiveIntensity: 1.2,
      detail: 0.008,
      maxTriangles: 220,
    });
    k.body('gems-green', greenGem, {
      color: '#0d3a1c',
      roughness: 0.1,
      metalness: 0.05,
      flat: true,
      emissive: '#35c25a',
      emissiveIntensity: 1.2,
      detail: 0.008,
      maxTriangles: 300,
    });

    // ---------------------------------------------------------------- chest (wood + iron)
    // Authored in the chest's local frame, then yawed and moved into the heap at the left front.
    const CHEST_AT = [-0.35, 0, 0.04] as const;
    const CHEST_YAW = 35;

    const place = (s: sdf.Shape) => s.rotate(0, CHEST_YAW, 0).at(CHEST_AT[0], CHEST_AT[1], CHEST_AT[2]);

    const outer = sdf.box([CW, CH, CD], 0.016).at(0, CH / 2, 0);
    const hollow = sdf.box([CW - 0.055, CH, CD - 0.055], 0.008).at(0, CH / 2 + 0.05, 0);
    const woodBody = outer
      .subtract(hollow)
      .displace(0.002, (x, y, z) => noise.fbm(x * 34, y * 34, z * 34, 2))
      .paintFn((x, y, z) => {
        const board = Math.floor((x + 0.4) / 0.07);
        const f = (x + 0.4) / 0.07 - board;
        const gap = f < 0.06 || f > 0.94 ? 0.7 : 0;
        const tint = noise.random(board, 5) * 0.3;
        const grain = 0.5 + 0.5 * noise.noise3(x * 7, y * 55, z * 7);
        return mixRgb(WOOD, WOOD_DARK, Math.min(1, 0.2 + tint + 0.2 * grain + gap));
      })
      .paintWhere(hollow.round(0.004), '#2a170b', 0.01);
    k.body('chest-wood', place(woodBody), {
      color: '#6b4324',
      roughness: 0.82,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 550,
    });

    // Lid: half cylinder along X, hinged at the back top, opened up and back.
    const lidSolid = sdf
      .cylinder(CD / 2, CW, 0.016)
      .rotateZ(90)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .at(0, 0, CD / 2);
    const lidHollow = sdf
      .cylinder(CD / 2 - 0.032, CW - 0.055, 0.008)
      .rotateZ(90)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .at(0, 0, CD / 2);
    const lid = lidSolid
      .subtract(lidHollow)
      .paintWhere(lidHollow.round(0.004), '#2a170b', 0.006)
      .displace(0.002, (x, y, z) => noise.fbm(x * 34, y * 34, z * 34, 2));
    k.body('chest-lid', place(lid.rotateX(-108).at(0, CH, -CD / 2)), {
      color: '#6b4324',
      roughness: 0.82,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 450,
    });

    // Iron straps down the front and over the lid.
    const chestShell = outer.round(0.01).subtract(outer.round(-0.002));
    const straps = chestShell.intersect(sdf.box([0.05, CH + 0.04, CD + 0.08], 0.01).at(0, CH / 2, 0));
    const lidShell = lidSolid.round(0.009).subtract(lidSolid.round(-0.002));
    const lidBand = lidShell.intersect(sdf.box([0.05, CD, CD + 0.08], 0.01).at(0, CD / 2, CD / 2));
    k.body('chest-iron', place(sdf.union(straps, lidBand.rotateX(-108).at(0, CH, -CD / 2))), {
      color: '#3d4047',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.01,
      maxTriangles: 300,
    });

    // Gold coins inside the open chest and spilling over its front lip.
    const chestCoins: sdf.Shape[] = [];
    for (let i = 0; i < 7; i++) {
      const x = (noise.random(i, 21) - 0.5) * (CW - 0.1);
      const z = (noise.random(i, 22) - 0.5) * (CD - 0.1);
      chestCoins.push(
        disc(0.038 + noise.random(i, 23) * 0.01)
          .rotate(noise.random(i, 24) * 40 - 20, 0, noise.random(i, 25) * 40 - 20)
          .at(x, CH - 0.02 + noise.random(i, 26) * 0.03, z),
      );
    }
    const spilling: [number, number, number][] = [
      [0.0, CH, 0.2],
      [0.08, 0.03, 0.29],
      [-0.08, 0.03, 0.27],
      [0.03, 0.03, 0.37],
      [-0.04, 0.03, 0.44],
    ];
    const spilled = spilling.map(([x, y, z], i) =>
      disc(0.04 + noise.random(i, 31) * 0.008)
        .rotate(noise.random(i, 32) * 30 - 15, 0, noise.random(i, 33) * 40 - 20)
        .at(x, y, z),
    );
    k.body('chest-gold', place(sdf.union(...chestCoins, ...spilled).paintFn(goldPaint)), {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.016,
      maxError: 0.008,
      maxTriangles: 380,
    });
  },
});
