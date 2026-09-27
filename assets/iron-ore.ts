import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf, type Vec3 } from '../src/index.js';

/**
 * items/crafting/iron-ore — raw iron ore chunk, three of these sit by the forge.
 *
 * Role: pickup / crafting-material prop, seen small (128 px sprite). It must read as one
 *   stout lumpy ore rock, not a gray blob.
 * Size: about 0.18 m on each side, sitting on y = 0, faces +Z. No rig, no clips.
 * One idea: an angular dark stone lump with one bold reddish-orange rust streak that runs down
 *   from a small flat metallic fresh face catching the forge light.
 * Shape language: angular facets dominant (raw rock), soft bevels and round lumps secondary.
 * Palette: ore #5a5248 (mid, dominant), crevice #322e28 (dark), edge #8a8177 (light),
 *   rust #b85838 / #7e3a24 / #d4763f (accent streaks), metal #565b62 (focal sheen).
 * Materials: stone (roughness 0.92, metalness 0), metal facet (roughness 0.46, metalness 0.65).
 * Detail list: one merged lumpy mass with a raised peak (big), six facet planes (medium),
 *   front rust streaks, one small back vein, and the metal facet (secondary, focal),
 *   grain/speckle bump (small).
 * Focal point: the metallic fresh face with the rust streak running into it.
 */

const ORE = rgb('#5a5248');
const ORE_DARK = rgb('#322e28');
const ORE_EDGE = rgb('#8a8177');
const RUST = rgb('#b85838');
const RUST_DEEP = rgb('#7e3a24');
const RUST_HOT = rgb('#d4763f');
const METAL = rgb('#565b62');
const METAL_DEEP = rgb('#33373c');
const METAL_LIGHT = rgb('#a8acb1');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const norm = (u: Vec3): Vec3 => {
  const l = Math.hypot(u[0], u[1], u[2]) || 1;
  return [u[0] / l, u[1] / l, u[2] / l];
};

const CENTER: Vec3 = [0, 0.08, 0];

/** Surface point hit by a ray aimed inward from `center + dir`; anchor for facets and chips. */
function aim(shape: Sdf, center: Vec3, dir: Vec3): Vec3 {
  const u = norm(dir);
  const from: Vec3 = [center[0] + u[0] * 1, center[1] + u[1] * 1, center[2] + u[2] * 1];
  return sdf.raycast(shape, from, [-u[0], -u[1], -u[2]]) ?? sdf.surfacePoint(shape, from, 0);
}

/** A cutting plane facing `dir`, sunk `cut` meters into the surface at `point`. */
function facet(point: Vec3, dir: Vec3, cut: number): Sdf {
  const u = norm(dir);
  return sdf.halfSpace(u, u[0] * point[0] + u[1] * point[1] + u[2] * point[2] - cut);
}

export default defineAsset({
  name: 'iron-ore',
  description:
    'Raw iron ore chunk: an angular lumpy dark stone with reddish-orange rust streaks and a small flat metallic fresh face. About 0.18 m, sits on y = 0.',
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  detail: 0.0065,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ blockout
    // A stout base slab, a raised peak, a low shoulder, and a small front foot: varied sizes
    // so the lump reads as one rock with rhythm, not a rounded cube.
    const slab = sdf.box([0.148, 0.1, 0.142], 0.03).at(0, 0.062, 0);
    const peak = sdf.ellipsoid([0.068, 0.066, 0.064]).at(0.012, 0.132, 0.004);
    const shoulder = sdf.ellipsoid([0.052, 0.052, 0.066]).at(-0.058, 0.098, -0.018);
    const foot = sdf.ellipsoid([0.054, 0.038, 0.052]).at(0.048, 0.046, 0.058);

    const mass = slab
      .smoothUnion(0.028, peak)
      .smoothUnion(0.028, shoulder)
      .smoothUnion(0.026, foot)
      .displace(0.0072, (x, y, z) => noise.fbm(x * 11, y * 10, z * 11, 3, 3));

    // ------------------------------------------------------------------ facets
    // Six tilted planes carve the angular ore faces. Soft k keeps every edge beveled.
    const facetDirs: Vec3[] = [
      [0.02, 1, 0.24],
      [0.98, 0.4, 0.22],
      [-0.9, 0.3, -0.4],
      [0.18, 0.45, 1],
      [-0.26, 0.34, -0.95],
      [0.75, -0.15, -0.75],
    ];
    let rough = mass;
    for (const d of facetDirs) {
      const p = aim(mass, CENTER, d);
      rough = rough.smoothIntersect(0.009, facet(p, d, 0.042));
    }

    // Soft bevel all round, then a flat base so it sits on the ground.
    const stone = rough.round(0.006).intersect(sdf.halfSpace([0, -1, 0], 0));

    // ------------------------------------------------------------------ metal fresh face
    // A rounded pad buried in the front-right facet, cut flat by a plane parallel to that
    // facet and lifted 4 mm proud. The metal face ends up flat and flush with the stone.
    const uFace = norm([0.6, 0.42, 0.86]);
    const faceP = aim(stone, CENTER, uFace);
    const cap = sdf.halfSpace(
      uFace,
      uFace[0] * faceP[0] + uFace[1] * faceP[1] + uFace[2] * faceP[2] + 0.004,
    );
    const plate = sdf
      .box([0.044, 0.044, 0.06], 0.013)
      .at(faceP[0] - uFace[0] * 0.021, faceP[1] - uFace[1] * 0.021, faceP[2] - uFace[2] * 0.021)
      .intersect(cap);
    // A tiny companion nodule so the fresh face does not look like a sticker.
    const nodGoal = aim(stone, CENTER, norm([0.42, 0.3, 0.92]));
    const nodP = sdf.surfacePoint(stone, nodGoal, -0.006);
    const nodule = sdf.ellipsoid([0.017, 0.012, 0.015]).at(nodP[0], nodP[1], nodP[2]);
    const metalFace = plate.smoothUnion(0.006, nodule);

    // ------------------------------------------------------------------ paint
    /** 0 = clean stone, 1 = full rust. Two front streaks, one short back vein, base pooling. */
    const rustAmount = (x: number, y: number, z: number): number => {
      const front = clamp01((z + 0.04) / 0.07); // 0 on the back, 1 on the front
      const back = clamp01((-z + 0.03) / 0.07);
      const patch = clamp01((noise.fbm(x * 9, y * 9, z * 9, 2, 2) * 0.5 + 0.5 - 0.2) / 0.8);
      const grain = clamp01((noise.fbm(x * 18, y * 15, z * 18, 3, 5) * 0.5 + 0.5 - 0.22) / 0.78);
      const tex = patch * grain;
      // A: from the fresh face down to the left (through the metal chip).
      const a = clamp01(1 - Math.abs(0.6 * x - 0.75 * y + 0.05) / 0.026);
      // B: a shorter lower-left diagonal.
      const b = clamp01(1 - Math.abs(0.7 * x + 0.5 * y - 0.015) / 0.024);
      // C: a small vein on the back so the identity reads from behind.
      const cPatch = clamp01((noise.fbm(x * 12, y * 12, z * 12, 2, 6) * 0.5 + 0.5 - 0.4) / 0.6);
      const c = clamp01(1 - Math.abs(0.5 * x + 0.72 * y - 0.03) / 0.02) * back * cPatch;
      const pool = clamp01((0.022 - y) / 0.028) * front * 0.4;
      return clamp01((a + b * 0.7) * front * tex * 1.7 + c * 1.5 + pool);
    };

    const orePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      // Value plan: dark low, mid in the middle, lighter on the top facets.
      const up = clamp01((y - 0.02) / 0.14);
      let c = mixRgb(ORE_DARK, base, clamp01(0.3 + up * 0.42));
      c = mixRgb(c, ORE_EDGE, clamp01((up - 0.55) / 0.45) * 0.5);
      // Large facets read as value planes: one darker, one lighter.
      const facetTone = noise.fbm(x * 6, y * 5, z * 6, 1, 21);
      c = mixRgb(c, ORE_DARK, clamp01(-facetTone) * 0.32);
      c = mixRgb(c, ORE_EDGE, clamp01(facetTone) * 0.16);
      // Crevice shading and a darker ground band, then rust.
      const crev = noise.fbm(x * 24, y * 24, z * 24, 2, 7);
      c = mixRgb(c, ORE_DARK, clamp01(-crev) * 0.62);
      const low = clamp01((0.05 - y) / 0.05);
      c = mixRgb(c, ORE_DARK, low * 0.45);
      const r = rustAmount(x, y, z);
      c = mixRgb(c, RUST_DEEP, clamp01(r * 1.15));
      c = mixRgb(c, RUST, clamp01(r - 0.1) * 0.9);
      c = mixRgb(c, RUST_HOT, clamp01(r - 0.55) * 0.8);
      // Fine speckle so the stone is not flat at sprite size.
      const sp = noise.fbm(x * 52, y * 52, z * 52, 2, 13);
      c = mixRgb(c, ORE_EDGE, clamp01(sp) * 0.08);
      c = mixRgb(c, ORE_DARK, clamp01(-sp) * 0.16);
      return c;
    };

    const metalPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const n = noise.fbm(x * 36, y * 36, z * 36, 2, 9);
      let c = mixRgb(METAL_DEEP, base, clamp01(0.55 + 0.45 * n));
      c = mixRgb(c, METAL_LIGHT, clamp01(n - 0.3) * 0.6);
      return c;
    };

    k.body('ore', stone.paintFn(orePaint), {
      color: ORE,
      roughness: 0.92,
      metalness: 0,
      detail: 0.0065,
      maxTriangles: 2900,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.0022 * noise.fbm(x * 34, y * 34, z * 34, 3, 11) +
        0.0007 * noise.noise3(x * 90, y * 90, z * 90, 5),
    });

    k.body('metal', metalFace.paintFn(metalPaint), {
      color: METAL,
      roughness: 0.46,
      metalness: 0.65,
      detail: 0.005,
      maxTriangles: 700,
      bump: (x, y, z) => 0.0008 * noise.noise3(x * 70, y * 70, z * 70, 9),
    });
  },
});
