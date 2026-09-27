import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — standing wheat sheaf (props/food/wheat-sheaf).
 *
 * Role: harvest prop for the cozy chibi hamlet; stands beside the farm plot and the barn.
 *   Must read at 128 px, so the silhouette is bold and simple.
 * Size: about 0.8 m tall, base spread ~0.18 m, ear fan ~0.46 m wide. Stands on y = 0,
 *   centred on the Y axis, faces +Z.
 * One idea: a BUNDLE of many thin golden straw stalks, cinched tight by twine at the
 *   waist, that splays out at the foot and fans above into heavy, drooping wheat ears.
 *   The vertical stalk lines stay visible from the ground all the way up: never a pot.
 * Shape language: round and soft dominant (rounded base, plump ears), with a strong
 *   secondary rhythm of straight vertical stalk lines and the horizontal twine band.
 * Palette (60/30/10): straw gold #e0bb60 (dominant), straw light #f0d488 / straw dark
 *   #b08a3a (form), ear gold #d6a640 (focal, the drooping heads), twine #b08a5a (accent
 *   band, the pinch point). Deep shade #7d5f24 for the foot and the ear crevices.
 * Materials: one matte dry-straw body (roughness 0.85), one matte ear body (roughness
 *   0.8), one rough twine body (roughness 0.9). All metalness 0.
 * Detail: primary base bundle + ear fan; secondary twine wraps; tertiary strand tint and
 *   grain in `bump`. Focal point: the twine pinch + the drooping ear cluster above it.
 * Rig/animation: none (static prop).
 */

const N = 20; // stalks around the sheaf
const TIE_Y = 0.335; // waist height (twine band centre)
const RT = 0.033; // bundle radius at the waist (the pinch)

const STRAW = rgb('#e0bb60');
const STRAW_LIGHT = rgb('#f0d488');
const STRAW_DARK = rgb('#b08a3a');
const STRAW_SHADOW = rgb('#5a3f14');
const EAR = rgb('#d6a640');
const EAR_LIGHT = rgb('#eccb6e');
const EAR_DARK = rgb('#a87d22');
const TWINE = rgb('#b08a5a');
const TWINE_LIGHT = rgb('#cfa877');
const TWINE_DARK = rgb('#7f5c37');

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Per-stalk hand-gathered variation: base spread, fan arc, ear length and droop. */
type Stalk = {
  sx: number;
  sz: number;
  rb: number; // base radius (foot splay)
  phi: number; // fan lean at the ear base, radians from vertical
  rc: number; // radius of the smooth upper arc
  rEnd: number; // ear-base radius from the axis
  yEnd: number; // ear-base height
  ear: number; // ear length
  drop: number; // how far the ear tip hangs below its straight tangent
};

const R0 = RT * 0.95; // radius where the smooth arc starts (just above the waist)

const STALKS: Stalk[] = [];
for (let i = 0; i < N; i++) {
  const a = ((i + 0.5) / N) * Math.PI * 2;
  const r1 = noise.random(i, 1, 7);
  const r2 = noise.random(i, 2, 9);
  const t = r2; // 0 = inner / upright, 1 = outer / splayed
  const phi = ((35 + 25 * t) * Math.PI) / 180;
  const yEnd = 0.715 - 0.12 * t;
  const rc = (yEnd - TIE_Y) / Math.sin(phi);
  STALKS.push({
    sx: Math.cos(a),
    sz: Math.sin(a),
    rb: 0.05 + 0.018 * r1,
    phi,
    rc,
    rEnd: R0 + rc * (1 - Math.cos(phi)),
    yEnd,
    ear: 0.12 + 0.03 * t,
    drop: 0.03 + 0.07 * t,
  });
}

/** One stalk: a chain from the ground, pinched at the waist, then a smooth arc leaning outward. */
function stalkShape(s: Stalk) {
  const { sx, sz, rb, phi, rc } = s;
  const pts: [number, number, number, number][] = [
    [rb * sx, 0, rb * sz, 0.013],
    [rb * 0.8 * sx, 0.1, rb * 0.8 * sz, 0.012],
    [RT * 1.2 * sx, 0.22, RT * 1.2 * sz, 0.01],
    [R0 * sx, TIE_Y, R0 * sz, 0.0088],
  ];
  // Smooth upper arc: rises and leans out so the ear starts on the tangent.
  for (let j = 1; j <= 3; j++) {
    const th = Math.PI - phi * (j / 3);
    const r = R0 + rc + rc * Math.cos(th);
    const y = TIE_Y + rc * Math.sin(th);
    pts.push([r * sx, y, r * sz, 0.0085 - 0.0005 * (j / 3)]);
  }
  return sdf.chain(pts, 0.004);
}

/** One heavy drooping wheat ear: a straight spindle along the arc tangent, tip nodding down. */
function earShape(s: Stalk) {
  const { sx, sz, phi, rEnd, yEnd, ear: L, drop } = s;
  const sp = Math.sin(phi);
  const cp = Math.cos(phi);
  const at = (u: number, rad: number): [number, number, number, number] => {
    const r = rEnd + L * u * sp;
    const y = yEnd + L * u * cp - drop * u * u;
    return [r * sx, y, r * sz, rad];
  };
  return sdf.chain(
    [at(0.0, 0.009), at(0.28, 0.0145), at(0.58, 0.013), at(0.82, 0.009), at(1.0, 0.0045)],
    0.005,
  );
}

/** Straw stalk colour: per-stalk tint, vertical strand lines, shaded foot, lit crown. */
const stalkPaint = (x: number, y: number, z: number) => {
  const a = Math.atan2(z, x);
  const id = Math.floor(((a + Math.PI) / (Math.PI * 2)) * N);
  const tint = noise.random(id, 11, 5);
  const strand = noise.fbm(x * 30, y * 8, z * 30, 2, 7);
  let c = mixRgb(STRAW, STRAW_LIGHT, 0.22 + 0.34 * tint);
  c = mixRgb(c, STRAW_DARK, 0.3 * clamp01(0.5 - 0.5 * strand));
  const t = clamp01(y / 0.45);
  c = mixRgb(c, STRAW_SHADOW, 0.58 * (1 - t) * (1 - t)); // shaded foot
  c = mixRgb(c, STRAW_LIGHT, 0.16 * clamp01((t - 0.5) / 0.5)); // lit crown
  c = mixRgb(c, STRAW_SHADOW, 0.45 * clamp01(1 - Math.abs(y - TIE_Y) / 0.05)); // tie shadow
  return c;
};

/** Ear colour: warm gold with lighter, sun-lit outer tips and dark crevices. */
const earPaint = (x: number, y: number, z: number) => {
  const r = Math.hypot(x, z);
  const v = 0.5 + 0.5 * noise.fbm(x * 25, y * 25, z * 25, 2, 9);
  let c = mixRgb(EAR, EAR_DARK, 0.36 * v);
  c = mixRgb(c, EAR_LIGHT, 0.4 * clamp01((r - 0.08) / 0.13));
  c = mixRgb(c, STRAW_SHADOW, 0.3 * clamp01(1 - (y - TIE_Y) / 0.1));
  return c;
};

const strawBump = (x: number, y: number, z: number) =>
  0.0016 * noise.fbm(x * 38, y * 6, z * 38, 2, 7) + 0.0007 * noise.noise3(x * 90, y * 20, z * 90, 3);

const twinePaint = (x: number, y: number, z: number) => {
  const a = Math.atan2(z, x);
  // Diagonal rope twist: the strand sweeps around the ring as it climbs.
  const twist = 0.5 + 0.5 * Math.sin(a * 34 + y * 260 + noise.fbm(x * 60, y * 60, z * 60, 2, 5) * 1.5);
  let c = mixRgb(TWINE, TWINE_DARK, 0.55 * (1 - twist));
  c = mixRgb(c, TWINE_LIGHT, 0.35 * twist);
  return c;
};

export default defineAsset({
  name: 'wheat-sheaf',
  description:
    'A standing bundle of golden wheat straw, pinched at the waist by twine and fanning above into drooping wheat ears.',
  detail: 0.006,
  reference: 'docs/item-mockups/wheat-sheaf-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- straw stalks
    // Thin chains from the ground to the ear bases: visible stalk lines all the way
    // down. Blended so the waist reads as one tight bundle, cut flat on y = 0.
    const stalks = sdf
      .union(...STALKS.map(stalkShape))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn(stalkPaint);
    k.body('stalks', stalks, {
      color: '#e0bb60',
      roughness: 0.85,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 2200,
      bump: strawBump,
    });

    // ---------------------------------------------------------------- ear fan
    // The heavy drooping heads are the focal point: give them finer cells and the
    // warmer ear gold so they separate from the pale straw below.
    const ears = sdf.union(...STALKS.map(earShape)).paintFn(earPaint);
    k.body('ears', ears, {
      color: '#d6a640',
      roughness: 0.8,
      metalness: 0,
      detail: 0.005,
      textureDensity: 2,
      maxTriangles: 2100,
    });

    // --------------------------------------------------------------- twine band
    // Three tight wraps of twine biting into the waist, following the taper.
    const wrap = (y: number, R: number) => sdf.torus(R, 0.0068).at(0, y, 0);
    const twine = sdf
      .union(wrap(TIE_Y - 0.017, 0.042), wrap(TIE_Y, 0.0405), wrap(TIE_Y + 0.017, 0.043))
      .paintFn(twinePaint);
    k.body('twine', twine, {
      color: '#b08a5a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 550,
    });
  },
});
