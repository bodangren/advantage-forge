import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — cartoon dungeon bone pile (catalog `dungeon/prop/bone-pile`).
 *
 * Role: small dungeon floor clutter prop; must read at 128 px sprite.
 * Size: mound ~0.5 m wide, ~0.32 m tall, stands on y = 0, faces +Z.
 * One idea: a friendly heap of oversized chunky femurs with two big
 *   round-skulled heads grinning on top.
 * Shape language: round dominant (ball-ended femurs, globe craniums, hoop ribs),
 *   no sharp edges; soft bevels everywhere.
 * Palette: bleached warm ivory #e8dcc0 (dominant), shaded bone #c9b58e,
 *   socket dark #2a2320 (focal contrast), faint soil stain #8a6b48 near base.
 * Value plan: light ivory mass against dark dungeon floor; darkest points are
 *   the four eye sockets (focal point on the front skull).
 * Materials: bone (roughness 0.5, metalness 0). No emissive: nothing glows.
 * Detail: primary 4 femurs + 2 skulls; secondary 3 ribs; tertiary soil stain
 *   and age speckle in paint. Focal point: front skull face.
 * Rig/animation: none (static prop).
 */

const BONE_SHADE = rgb('#c9b58e');
const SOCKET = rgb('#2a2320');
const SOIL = rgb('#8a6b48');

const soilStain = (x: number, y: number, z: number, base: Rgb): Rgb => {
  // Faint soil stain hugging the base, broken up with noise.
  const n = noise.fbm(x * 14, y * 14, z * 14, 2);
  const t = Math.min(1, Math.max(0, (0.11 - y) / 0.11));
  let c = mixRgb(base, SOIL, 0.5 * t * t + 0.14 * t * Math.max(0, n));
  // Faint age speckle over the whole bone.
  const s = noise.fbm(x * 30 + 7, y * 30, z * 30, 2);
  if (s > 0.42) c = mixRgb(c, BONE_SHADE, 0.35);
  return c;
};

/** Chunky cartoon femur built along local Y, ~0.4 m long, ball ends. */
const femurLocal = () =>
  sdf.smoothUnion(
    0.018,
    sdf.capsule([0, -0.12, 0], [0, 0.12, 0], 0.038),
    sdf.sphere(0.052).at(0.034, 0.15, 0),
    sdf.sphere(0.052).at(-0.034, 0.15, 0),
    sdf.sphere(0.048).at(0.032, -0.15, 0),
    sdf.sphere(0.048).at(-0.032, -0.15, 0),
  );

/** Curved rib built as a tapered chain in local frame, spanning ~0.3 m. */
const ribLocal = () =>
  sdf.chain(
    [
      [-0.15, -0.04, 0, 0.028],
      [-0.09, 0.04, 0.01, 0.03],
      [0, 0.07, 0.015, 0.03],
      [0.09, 0.04, 0.01, 0.028],
      [0.15, -0.04, 0, 0.024],
    ],
    0.016,
  );

/**
 * Stylized skull: big round cranium, narrower snout block, carved dark sockets.
 * Local frame: face toward +Z, cranium center at origin.
 */
const skullLocal = () => {
  const cranium = sdf.ellipsoid([0.095, 0.088, 0.09]);
  const snout = sdf.box([0.1, 0.062, 0.085], 0.026).at(0, -0.055, 0.055);
  const solid = sdf.smoothUnion(0.03, cranium, snout);
  // Sockets: deep round dents high on the face.
  const socketL = sdf.ellipsoid([0.03, 0.034, 0.035]).at(0.037, 0.005, 0.062);
  const sockets = socketL.mirror('x');
  const nose = sdf.ellipsoid([0.012, 0.017, 0.02]).at(0, -0.035, 0.085);
  const carved = solid.smoothSubtract(0.008, sockets).smoothSubtract(0.004, nose);
  // Grin: dark line across the snout plus short tooth gaps.
  const grin = sdf.box([0.086, 0.008, 0.02], 0.003).at(0, -0.062, 0.095);
  const gaps = sdf.union(
    ...[-0.028, -0.009, 0.009, 0.028].map((x) =>
      sdf.box([0.006, 0.026, 0.02], 0.002).at(x, -0.062, 0.095),
    ),
  );
  return carved
    .paintWhere(sockets.round(0.008), SOCKET, 0.006)
    .paintWhere(nose.round(0.004), SOCKET, 0.003)
    .paintWhere(grin, SOCKET, 0.002)
    .paintWhere(gaps, SOCKET, 0.002);
};

export default defineAsset({
  name: 'bone-pile',
  description:
    'A friendly mound of chunky cartoon dungeon bones: crossed femurs and ribs with two grinning skulls on top, bleached ivory with a faint soil stain.',
  detail: 0.009,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------ crossed femurs
    // Four big femurs laid across each other to make a 0.5 m mound. The two
    // bottom rails sit high enough that their knobs rest on y = 0.
    // Hard union: a pile is discrete bones resting on each other. A smooth
    // fillet between them melts the shafts into one dough mass (the r2 flaw).
    const femurs = sdf.union(
      femurLocal().rotateZ(84).rotateY(8).at(0, 0.1, 0.03),
      femurLocal().rotateZ(96).rotateY(-14).at(0.01, 0.115, -0.05),
      femurLocal().rotateZ(80).rotateX(24).rotateY(38).at(0, 0.175, 0.01),
      femurLocal().rotateZ(100).rotateX(-18).rotateY(-42).at(-0.01, 0.17, 0),
    );

    // ------------------------------------------------------------ ribs
    // Three hoop ribs draped over the mound, ends tucked into the heap.
    const ribs = sdf.union(
      ribLocal().rotateX(-32).rotateY(14).at(0.1, 0.15, 0.08),
      ribLocal().rotateX(-28).rotateY(-20).at(-0.1, 0.14, 0.07),
      ribLocal().rotateX(-38).rotateY(52).at(-0.02, 0.18, -0.08),
    );

    const bones = sdf.union(femurs, ribs).paintFn(soilStain);
    k.body('bones', bones, {
      color: '#e8dcc0',
      roughness: 0.5,
      metalness: 0,
      detail: 0.016,
      maxError: 0.0035,
    });

    // ------------------------------------------------------------ skulls
    // Two grinning skulls resting on top of the heap, front one facing +Z.
    const skullA = skullLocal()
      .rotateY(-12)
      .rotateX(8)
      .at(0.09, 0.27, 0.1);
    const skullB = skullLocal()
      .scale(0.85)
      .rotateY(28)
      .rotateZ(-10)
      .at(-0.15, 0.22, -0.1);
    const skulls = sdf.smoothUnion(0.01, skullA, skullB).paintFn(soilStain);
    k.body('skulls', skulls, {
      color: '#e8dcc0',
      roughness: 0.5,
      metalness: 0,
      detail: 0.011,
      textureDensity: 2,
      maxError: 0.003,
    });
  },
});
