import { defineAsset, mixRgb, noise, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — cold campfire (catalog `forest/prop/campfire-out`).
 *
 * Role: the cold state of the forest campfire; swaps 1:1 with `campfire` — same stone-ring
 *   layout and footprint, so a scene can trade the lit prop for this one. Reads at 128 px.
 * Size: ~0.7 m wide stone ring; the ash mound peaks about 0.09 m. Stands on y = 0, faces +Z.
 * One idea: the fire is out — a quiet pale-gray ash dome ringed by the same chunky stones,
 *   now soot-darkened on their inner faces, with black stubs of log half-buried in the ash.
 * Shape language: round/soft only (rounded stones, domed mound, blunt stub ends); no flame
 *   accent, so the silhouette drops low and calm — the coldest, quietest prop in the kit.
 * Palette: cool gray stone #7d8794 (dark #4b545f, light #9ba5b1), pale ash #cfc9bd with
 *   #8f887c patches, charred wood #3a342e. NO warm accent, NO emissive, NO glow anywhere.
 * Materials: stone (rough 0.9), ash (rough 0.95), charred wood (rough 0.92).
 * Detail list: primary 9 stones + ash dome (focal); secondary 4 charred stubs + 2 ash lobes;
 *   tertiary soot blotches on the stones, char specks in the ash, ash dust on the stub ends.
 * Rig/animation: none (static prop).
 */

const STONE = rgb('#7d8794');
const STONE_DARK = rgb('#4b545f');
const STONE_LIGHT = rgb('#9ba5b1');
const ASH_LIGHT = rgb('#cfc9bd');
const ASH_DARK = rgb('#8f887c');
const ASH_DUST = rgb('#9a9385');
const CHAR = rgb('#3a342e');
const CHAR_DEEP = rgb('#262019');
const CHAR_DUST = rgb('#57504a');
const SOOT = rgb('#33302c');

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const STONES = 9;
const STONE_RING = 0.245; // identical to `campfire.ts`, so the two states swap 1:1

const STUBS = 4;
const STUB_RING = 0.15;
const STUB_R = 0.027;
const STUB_LEAN = 54; // degrees from vertical, aimed into the ash like the lit logs lean
const STUB_BASE_Y = 0.038;

/** A chunky rounded stone at azimuth `a` (radians); varied by index for a natural scatter.
 *  Copied from `campfire.ts` with the same seeds, so the cold state keeps the exact ring. */
function stoneAt(a: number, i: number): Sdf {
  const ring = STONE_RING + (noise.random(i, 1) - 0.5) * 0.03;
  const rx = 0.056 + noise.random(i, 2) * 0.022;
  const ry = 0.036 + noise.random(i, 3) * 0.016;
  const rz = 0.052 + noise.random(i, 4) * 0.022;
  // Main lump plus a smaller shoulder, softly merged so each stone is one rounded form.
  const lump = sdf.ellipsoid([rx, ry, rz]);
  const shoulder = sdf.ellipsoid([rx * 0.6, ry * 0.6, rz * 0.6]).at(
    (noise.random(i, 5) - 0.5) * rx * 0.7,
    ry * 0.45,
    (noise.random(i, 6) - 0.5) * rz * 0.7,
  );
  const stone = lump.smoothUnion(0.018, shoulder);
  return stone
    .rotate(noise.random(i, 7) * 50 - 25, noise.random(i, 8) * 360, noise.random(i, 9) * 40 - 20)
    .at(Math.cos(a) * ring, ry * 0.72, Math.sin(a) * ring);
}

/** A charred log stub along its local Y axis, ends bluntly rounded, with the upper end
 *  (local +Y) dusted with cold ash, as if it burned down and snapped off. */
function charStubLocal(l: number): Sdf {
  const body = sdf.capsule([0, -l / 2, 0], [0, l / 2, 0], STUB_R);
  const charPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
    const n = noise.fbm(x * 26, y * 26, z * 26, 3);
    let color = mixRgb(CHAR_DEEP, base, clamp01(0.5 + 0.5 * n));
    color = mixRgb(color, CHAR_DUST, clamp01(n) * 0.3);
    return color;
  };
  const endDust = sdf.sphere(STUB_R * 0.8).at(0, l / 2 + 0.01, 0); // the broken, upturned end
  return body.paintFn(charPaint).paintWhere(endDust, ASH_DUST, 0.006);
}

export default defineAsset({
  name: 'campfire-out',
  description:
    'A burned-out campfire pit: the lit campfire\'s ring of chunky rounded stones, now soot-darkened on their inner faces, around a cold pale-gray ash mound with blackened charred log stubs half-buried in it. No flame, no embers, no glow.',
  detail: 0.01,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ stone ring
    // Same 9 stones as the lit campfire (same code, same seeds); the warm glow paint is
    // replaced by blotchy soot on the inner faces.
    const stones: Sdf[] = [];
    for (let i = 0; i < STONES; i++) {
      const a = ((i + 0.5) / STONES) * Math.PI * 2;
      stones.push(stoneAt(a, i));
    }
    const stoneShape = sdf.union(...stones).intersect(sdf.halfSpace([0, -1, 0], 0));
    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const t = clamp01(y / 0.08);
      let color = mixRgb(STONE_DARK, base, clamp01(0.3 + t * 0.7));
      color = mixRgb(color, STONE_LIGHT, clamp01((t - 0.5) / 0.5) * 0.5);
      const n = noise.fbm(x * 9, y * 9, z * 9, 3);
      color = mixRgb(color, STONE_DARK, clamp01(-n) * 0.38);
      color = mixRgb(color, STONE_LIGHT, clamp01(n) * 0.14);
      // Soot from the dead fire: blotchy but strong, coating the fire-facing half of each
      // stone (inner faces and tops), so it reads from the side and from above.
      const r = Math.hypot(x, z);
      const blotch = noise.fbm(x * 13, y * 13, z * 13, 3);
      const soot = clamp01((0.3 - r) / 0.06) * clamp01(0.78 + 0.38 * blotch);
      color = mixRgb(color, SOOT, clamp01(soot) * 0.97);
      return color;
    };
    k.body('stones', stoneShape.paintFn(stonePaint), {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.01,
      maxTriangles: 1500,
      paintWeight: 3,
      bump: (x, y, z) =>
        0.002 * noise.fbm(x * 30, y * 30, z * 30, 3, 7) + 0.0008 * noise.noise3(x * 90, y * 90, z * 90, 11),
    });

    // ------------------------------------------------------------------ ash mound
    // A soft pale dome (the fire's remains) whose edge laps against the inner stone faces,
    // with two low spill lobes so the footprint is not a perfect circle.
    const dome = sdf.sphere(0.175).scale([1, 0.47, 1]).at(0, 0.002, 0.008);
    const lobeA = sdf.ellipsoid([0.09, 0.02, 0.06]).at(0.03, 0.002, -0.14);
    const lobeB = sdf.ellipsoid([0.055, 0.016, 0.06]).at(-0.075, 0.002, 0.135);
    const mound = dome
      .smoothUnion(0.03, lobeA)
      .smoothUnion(0.03, lobeB)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const ashPaint = (x: number, y: number, z: number): Rgb => {
      let color = ASH_LIGHT;
      const n = noise.fbm(x * 16, y * 16, z * 16, 3);
      color = mixRgb(color, ASH_DARK, clamp01(0.32 + 0.42 * clamp01(-n)));
      const speck = noise.fbm(x * 46, y * 46, z * 46, 2);
      color = mixRgb(color, CHAR, clamp01(-speck) * 0.25);
      const r = Math.hypot(x, z);
      color = mixRgb(color, ASH_DARK, clamp01((r - 0.1) / 0.08) * 0.3);
      color = mixRgb(color, ASH_DARK, clamp01((0.026 - y) / 0.026) * 0.35);
      return color;
    };
    k.body('ash', mound.paintFn(ashPaint), {
      color: '#cfc9bd',
      roughness: 0.95,
      metalness: 0,
      detail: 0.018,
      maxTriangles: 500,
      paintWeight: 2,
      bump: (x, y, z) =>
        0.002 * noise.fbm(x * 32, y * 32, z * 32, 3, 5) + 0.001 * noise.fbm(x * 72, y * 72, z * 72, 2, 9),
    });

    // ------------------------------------------------------------------ charred stubs
    // Four burned-down log ends, aimed into the ash on the lit campfire's log azimuths and
    // half-buried in the mound, plus a few cold char nuggets on the dirt between the stones.
    const stubs: Sdf[] = [];
    for (let i = 0; i < STUBS; i++) {
      const a = (i / STUBS) * Math.PI * 2 + Math.PI / 4;
      const lean = STUB_LEAN + (noise.random(i, 21) - 0.5) * 8;
      const phi = (lean * Math.PI) / 180;
      const l = 0.1 + noise.random(i, 23) * 0.04; // varied lengths for a natural rhythm
      const d: [number, number, number] = [
        -Math.sin(phi) * Math.cos(a),
        Math.cos(phi),
        -Math.sin(phi) * Math.sin(a),
      ];
      const ring = STUB_RING + (noise.random(i, 22) - 0.5) * 0.02;
      const base: [number, number, number] = [Math.cos(a) * ring, STUB_BASE_Y, Math.sin(a) * ring];
      const mid: [number, number, number] = [
        base[0] + (d[0] * l) / 2,
        base[1] + (d[1] * l) / 2,
        base[2] + (d[2] * l) / 2,
      ];
      stubs.push(charStubLocal(l).rotateZ(lean).rotateY(-a).at(mid[0], mid[1], mid[2]));
    }
    const nuggets: Sdf[] = [
      sdf.ellipsoid([0.017, 0.012, 0.014]).rotateZ(24).at(0.161, 0.011, 0.135),
      sdf.ellipsoid([0.014, 0.011, 0.016]).rotateX(-18).at(-0.1, 0.01, -0.173),
      sdf.ellipsoid([0.016, 0.011, 0.013]).rotateY(30).at(0.035, 0.012, -0.197),
    ];
    const stubShape = sdf.union(...stubs, ...nuggets).intersect(sdf.halfSpace([0, -1, 0], 0));
    k.body('stubs', stubShape, {
      color: CHAR,
      roughness: 0.92,
      metalness: 0,
      detail: 0.009,
      maxTriangles: 700,
      paintWeight: 2,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 48, y * 48, z * 48, 3, 3),
    });
  },
});
