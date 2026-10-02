import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — leather gauntlet gloves (equipment/armor/gloves), reworked as closed-fist avatar gloves.
 *
 * Role: wearable `hands` item of the chibi avatar and a shop pickup; must read at 128 px as a pair
 *   of chunky leather gloves with flared cuffs. It fits the closed avatar fist (gauntlets recipe).
 * Size: pair about 0.54 m wide and 0.3 m tall. Each glove is the avatar left fist and forearm at
 *   2x (fit scale), grown 0.008 m worn (0.016 m asset) into leather.
 * Pose: the display stands each cuff on y = 0 with the fist up, as in the mock. `equip.origin` is
 *   the wrist point and `equip.rotate` (TURN) is the display turn; the worn piece undoes it.
 * One idea: fat leather fists with flared cuffs, a dark cuff band with short pale stitches, two brass keepers.
 * Shape language: round dominant (fist, finger roll); flared cuff secondary.
 * Palette: leather #8e4b2c (darker than the mock tone: the render lifts mid browns toward orange),
 *   dark cuff band #5c2e1b, pale stitches #e0cfa4, brass #c8a040 (accent).
 * Materials: leather (roughness 0.7), brass bars (roughness 0.35, metalness 1).
 * Detail: cuff band with 14 short running stitches, two flat brass keepers on the band, a separate
 *   thumb lobe. No rig.
 * Solid over fist and forearm; only the cuff end is a recessed ring.
 */

const LEATHER = rgb('#8e4b2c');
const BAND = rgb('#5c2e1b');
const STITCH = rgb('#e0cfa4');

type V3 = readonly [number, number, number];

// The avatar left wrist and elbow (assets/avatar-base.ts).
const WRIST: V3 = [0.205, 0.238, 0.03];
const ELBOW: V3 = [0.18, 0.332, 0.012];
const FIT = 2;
const GROW = 0.008; // worn meters, 0.016 m in the asset
const CX = 0.15;
const OY = 0.118; // wrist height in the display: the flipped cuff rim (0.06 m worn below the wrist) stands on y = 0

// The forearm axis (unit) from the wrist toward the elbow, as two turns of a +Y shape.
const AXIS_LEN = Math.hypot(ELBOW[0] - WRIST[0], ELBOW[1] - WRIST[1], ELBOW[2] - WRIST[2]);
const AXIS: V3 = [
  (ELBOW[0] - WRIST[0]) / AXIS_LEN,
  (ELBOW[1] - WRIST[1]) / AXIS_LEN,
  (ELBOW[2] - WRIST[2]) / AXIS_LEN,
];
const AX_DEG = (Math.asin(AXIS[2]) * 180) / Math.PI;
const AZ_DEG = (Math.asin(-AXIS[0] / Math.cos(Math.asin(AXIS[2]))) * 180) / Math.PI;

/** A shape built along +Y at the origin, laid on the forearm axis at the wrist. */
function onForearm(s: sdf.Shape): sdf.Shape {
  return s.rotateX(AX_DEG).rotateZ(AZ_DEG).at(WRIST[0], WRIST[1], WRIST[2]);
}

type M3 = readonly [V3, V3, V3];
const rad = Math.PI / 180;
const row = (a: V3, b: M3): V3 => [
  a[0] * b[0][0] + a[1] * b[1][0] + a[2] * b[2][0],
  a[0] * b[0][1] + a[1] * b[1][1] + a[2] * b[2][1],
  a[0] * b[0][2] + a[1] * b[1][2] + a[2] * b[2][2],
];
const mul = (a: M3, b: M3): M3 => [row(a[0], b), row(a[1], b), row(a[2], b)];
const rotX = (d: number): M3 => [[1, 0, 0], [0, Math.cos(d * rad), -Math.sin(d * rad)], [0, Math.sin(d * rad), Math.cos(d * rad)]];
const rotZ = (d: number): M3 => [[Math.cos(d * rad), -Math.sin(d * rad), 0], [Math.sin(d * rad), Math.cos(d * rad), 0], [0, 0, 1]];

/**
 * The display turn, as degrees about X, then Y, then Z (the order of `Shape.rotate` and of
 * `equip.rotate`). It lays the forearm axis upright (undoing `onForearm`) and then turns the glove
 * 180 degrees about Z, so the cuff stands on the ground and the fist points up as in the mock.
 * The worn piece applies its inverse, so the fit does not change.
 */
const TURN: V3 = (() => {
  const m = mul(rotZ(180), mul(rotX(-AX_DEG), rotZ(-AZ_DEG)));
  return [Math.atan2(m[2][1], m[2][2]) / rad, -Math.asin(m[2][0]) / rad, Math.atan2(m[1][0], m[0][0]) / rad];
})();

/** Avatar frame to the asset frame of the left piece. */
function place(s: sdf.Shape): sdf.Shape {
  return s.at(-WRIST[0], -WRIST[1], -WRIST[2]).scale(FIT).rotate(TURN[0], TURN[1], TURN[2]).at(CX, OY, 0);
}

// Bell outer radius along the forearm axis (v = worn meters above the wrist).
const BELL: readonly (readonly [number, number])[] = [
  [-0.014, 0.037],
  [-0.004, 0.042],
  [0.012, 0.042],
  [0.028, 0.044],
  [0.04, 0.049],
  [0.05, 0.054],
];
const V_TOP = 0.054;
function bellRadius(v: number): number {
  const first = BELL[0];
  if (first === undefined || v <= first[0]) return first?.[1] ?? 0.04;
  for (let i = 1; i < BELL.length; i++) {
    const a = BELL[i - 1];
    const b = BELL[i];
    if (a === undefined || b === undefined) continue;
    if (v <= b[0]) return a[1] + ((b[1] - a[1]) * (v - a[0])) / (b[0] - a[0]);
  }
  return BELL[BELL.length - 1]?.[1] ?? 0.06;
}

/** A revolved ring of the bell outline between two heights, thickened by `out` and `inn`. */
function bellBand(v0: number, v1: number, out: number, inn: number): sdf.Shape {
  const pts: [number, number][] = [];
  const n = 4;
  for (let i = 0; i <= n; i++) {
    const v = v0 + ((v1 - v0) * i) / n;
    pts.push([bellRadius(v) + out, v]);
  }
  for (let i = n; i >= 0; i--) {
    const v = v0 + ((v1 - v0) * i) / n;
    pts.push([bellRadius(v) - inn, v]);
  }
  return onForearm(sdf.revolve(profile.polygon(pts)).round(0.002));
}

export default defineAsset({
  name: 'gloves',
  description:
    'A pair of chunky leather gauntlet gloves with closed fists, flared cuffs, a dark cuff band with pale stitches, and brass keepers. Worn on the avatar hands.',
  detail: 0.006,
  reference: 'docs/item-mockups/gloves-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'hands', fitScale: FIT, origin: [CX, OY, 0], rotate: TURN },

  build(k) {
    const palm = sdf.ellipsoid([0.038, 0.043, 0.044]).at(0.212, 0.2, 0.034);
    const roll = sdf.capsule([0.196, 0.18, 0.06], [0.2, 0.2, 0.072], 0.017);
    // The thumb is its own lobe (slightly larger than the avatar thumb, joined with a small fillet),
    // so the fist reads as a glove and not as a mitten.
    const thumb = sdf.cone([0.226, 0.216, 0.054], [0.205, 0.204, 0.081], 0.018, 0.0155);
    const fist = sdf.smoothUnion(0.018, palm, roll);

    const bellOutline: [number, number][] = [[0, -0.014]];
    for (const [v, r] of BELL) bellOutline.push([r, v]);
    bellOutline.push([0.056, V_TOP], [0.052, V_TOP + 0.003], [0.046, V_TOP], [0.041, V_TOP - 0.012], [0, V_TOP - 0.012]);
    const bell = onForearm(sdf.revolve(profile.polygon(bellOutline)).round(0.003));
    const shell = sdf.smoothUnion(0.012, fist.round(GROW), bell).smoothUnion(0.005, thumb.round(GROW));

    // Paint stencils (avatar frame): a dark cuff band with short running stitches across it.
    const BAND_V = 0.034;
    const bandRegion = onForearm(sdf.cylinder(0.2, 0.016, 0).at(0, BAND_V, 0));
    const STITCH_COUNT = 14;
    const stitches = sdf.union(
      ...Array.from({ length: STITCH_COUNT }, (_, i) => {
        const a = (2 * Math.PI * (i + 0.5)) / STITCH_COUNT;
        const r = bellRadius(BAND_V) + 0.003;
        return onForearm(
          sdf.box([0.0034, 0.009, 0.02]).rotateY((a * 180) / Math.PI).at(r * Math.sin(a), BAND_V, r * Math.cos(a)),
        );
      }),
    );
    // Two flat brass keepers on the band, tangent to the cuff (rotate first, then place).
    const barAt = (v: number, a: number): sdf.Shape => {
      const r = bellRadius(v) + 0.004;
      return onForearm(
        sdf.box([0.02, 0.012, 0.006], 0.002).rotateY((a * 180) / Math.PI).at(r * Math.sin(a), v, r * Math.cos(a)),
      );
    };
    const bars = sdf.union(barAt(BAND_V, 0.9), barAt(BAND_V, -0.9));

    const glove = place(shell)
      .paintFn((x, y, z, base) => {
        const g = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
        return mixRgb(base, rgb('#a2593a'), 0.22 * g);
      })
      .paintWhere(place(bandRegion), BAND, 0.004)
      .paintWhere(place(stitches), STITCH, 0.002);
    k.body('leather', glove.mirror('x', 0), {
      color: LEATHER,
      roughness: 0.7,
      metalness: 0,
      detail: 0.006,
      textureDensity: 1.3,
      paintWeight: 2,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 38, y * 30, z * 38, 2),
    });
    k.body('brass', place(bars).mirror('x', 0), {
      color: '#c8a040',
      roughness: 0.35,
      metalness: 1,
      detail: 0.004,
    });
  },
});
