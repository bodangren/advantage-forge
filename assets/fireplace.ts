import { defineAsset, mixRgb, noise, profile, rgb, sdf, type Rgb, type Sdf } from '../src/index.js';

/**
 * Design note — tavern stone hearth (catalog `props/furniture/fireplace`).
 *
 * Role: the tavern wall's warm anchor and the room's only light source; a big background prop
 *   that must read at the 128 px sprite. The fire is the single focal point.
 * Size: 1.60 m wide (X), 1.50 m tall (Y), 0.45 m deep (Z); back at z = 0, faces +Z, stands on y = 0.
 * One idea: a chunky cool-gray stone chimney breast with an arched black fire box, and a bright
 *   orange fire burning inside it. Exaggerate: a thick mantel band and a stepped chimney top
 *   break the outline; the fire is the brightest, highest-contrast thing on screen.
 * Shape language: square/blocky stone mass (sturdy, safe) softened by big round bevels, with the
 *   pointed flame tongues as the only sharp accent.
 * Palette: stone cool gray #8a94a0 (dominant), dark #5b6670 (mortar, shadow), sooty box #2a2723;
 *   charred wood #3d2717 / #5f3d22; emissive #ff9a3c with a pale #ffd66b core. Value plan: mid
 *   stone, dark joint and dark fire box, one very bright emissive focal point. No baked light.
 * Materials: stone (roughness 0.9), charred wood (0.85), embers + flames (emissive, intensity 2.5).
 * Detail list: primary mass + fire box; secondary mantel band, jamb pilasters, hearth kerb;
 *   tertiary masonry paint, mortar bump, ember bed, three logs, three flame tongues.
 * Rig/animation: none (static prop).
 */

const STONE = rgb('#8a94a0'); // contract: cool gray stone
const STONE_LIGHT = rgb('#a4adb8');
const STONE_DARK = rgb('#5b6670'); // contract: stone dark / mortar
const MORTAR = rgb('#3c444e');
const SOOT = rgb('#2a2723'); // inside the fire box
const CHAR = rgb('#3d2717'); // contract: charred wood
const CHAR_WARM = rgb('#5f3d22'); // contract: charred wood, warm side
const FLAME = rgb('#ff9a3c'); // contract: emissive flame
const FLAME_CORE = rgb('#ffd66b'); // contract: pale core
const EMBER = rgb('#ffb257');
const GLOW = rgb('#ff9a3c');

const W = 1.6; // outer width
const H = 1.5; // total height
const D = 0.45; // outer depth
const FRONT = D; // z of the front face

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

// Masonry layout shared by the paint and the bump so grooves and dark joints line up.
const COURSE = 0.30; // block course height
const BLOCK = 0.42; // block width
/** Horizontal coordinate for the masonry grid: front faces use x, side faces use z. */
const blockU = (x: number, z: number): number => (Math.abs(x) > 0.66 ? z : x);
function masonry(u: number, y: number): { joint: number; col: number; row: number } {
  const row = Math.floor(y / COURSE);
  const off = (Math.abs(row) % 2) * BLOCK * 0.5;
  const col = Math.floor((u + off) / BLOCK);
  const fy = y / COURSE - row;
  const fx = (u + off) / BLOCK - col;
  const d = Math.min(fy, 1 - fy, fx, 1 - fx);
  return { joint: smoothstep(0.13, 0.03, d), col, row };
}

export default defineAsset({
  name: 'fireplace',
  description:
    'Tavern stone hearth: a chunky cool-gray chimney breast with an arched fire box, a raised mantel shelf, a bed of glowing embers, three charred logs, and three emissive flame tongues.',
  detail: 0.012,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ stone mass
    // One rounded block, then the fire box is cut out of the front so the rim keeps a soft bevel.
    const mass = sdf.box([W, H, D], 0.035).at(0, H / 2, D / 2);

    // Arched opening: a rectangular lower part plus an elliptical arch on top. The cutters stop
    // at z = 0.12 so a solid stone back wall stays behind the fire box.
    const opening = sdf
      .union(
        sdf.box([0.92, 0.62, 0.42], 0.01).at(0, 0.31, 0.32),
        sdf.ellipsoid([0.46, 0.22, 0.24]).at(0, 0.62, 0.35),
      );
    const fireBox = mass.smoothSubtract(0.035, opening);

    // Step the top into a narrower chimney breast.
    const chimneyCut = sdf.union(
      sdf.box([0.36, 0.5, 0.7], 0.01).at(-0.72, 1.3, 0.25),
      sdf.box([0.36, 0.5, 0.7], 0.01).at(0.72, 1.3, 0.25),
    );
    const stepped = fireBox.smoothSubtract(0.02, chimneyCut);

    // Raised mantel shelf, projecting jamb pilasters, and a hearth kerb inside the box.
    const mantel = sdf.box([1.66, 0.13, 0.46], 0.022).at(0, 1.045, 0.235);
    const pilaster = sdf
      .box([0.30, 1.0, 0.10], 0.02)
      .at(0.625, 0.5, 0.435)
      .mirror('x', 0);
    const kerb = sdf.box([0.90, 0.11, 0.32], 0.025).at(0, 0.055, 0.295);
    const stone = sdf.union(stepped, mantel, pilaster, kerb);

    const stonePaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const { joint, col, row } = masonry(blockU(x, z), y);
      const tint = noise.random(col, row, 91);
      let c = mixRgb(STONE, STONE_LIGHT, 0.15 + tint * 0.5);
      // Broad weathering blotches and vertical damp streaks.
      c = mixRgb(c, STONE_DARK, clamp01(noise.fbm(x * 5, y * 5, z * 5, 3, 4)) * 0.2);
      c = mixRgb(c, STONE_DARK, clamp01(noise.fbm(x * 13, y * 2.5, z * 13, 3, 6)) * 0.16);
      // Deep dark mortar joints between the blocks; darker toward the ground.
      c = mixRgb(c, MORTAR, joint * 0.85);
      c = mixRgb(c, MORTAR, smoothstep(0.12, 0.0, y) * 0.3);
      return c;
    };
    // Soot the whole fire box interior (back, sides, arch, kerb) and leave a soft stain on the rim.
    const sootRegion = sdf.union(
      sdf.box([0.96, 0.70, 0.52], 0.01).at(0, 0.33, 0.29),
      sdf.ellipsoid([0.48, 0.27, 0.28]).at(0, 0.63, 0.35),
    );
    const stoneBody = stone
      .paintFn(stonePaint)
      .paintWhere(sootRegion, SOOT, 0.035)
      .paintWhere(sdf.box([0.9, 0.05, 0.4]).at(0, 0.12, 0.29), rgb('#1c1916'), 0.02);
    k.body('stone', stoneBody, {
      color: STONE,
      roughness: 0.9,
      metalness: 0,
      detail: 0.012,
      maxError: 0.008,
      maxTriangles: 4400,
      paintWeight: 3,
      bump: (x, y, z) => {
        const { joint } = masonry(blockU(x, z), y);
        return -0.006 * joint + 0.0018 * noise.fbm(x * 34, y * 34, z * 34, 3, 9);
      },
    });

    // ------------------------------------------------------------------ ember bed
    const emberBed = sdf.union(
      sdf.ellipsoid([0.31, 0.06, 0.13]).at(0, 0.145, 0.29),
      sdf.sphere(0.045).at(-0.19, 0.16, 0.32),
      sdf.sphere(0.04).at(0.2, 0.155, 0.27),
      sdf.sphere(0.036).at(0.0, 0.15, 0.38),
    );
    const emberPaint = (x: number, y: number, z: number): Rgb => {
      const n = noise.fbm(x * 26, y * 26, z * 26, 3, 5);
      let c = mixRgb(CHAR, EMBER, clamp01(0.25 + n * 0.65));
      c = mixRgb(c, FLAME, clamp01(n) * 0.35);
      c = mixRgb(c, FLAME_CORE, clamp01((n - 0.5) * 3) * 0.55);
      c = mixRgb(c, rgb('#1c1916'), clamp01(-n) * 0.55);
      return c;
    };
    k.body('embers', emberBed.paintFn(emberPaint), {
      color: EMBER,
      roughness: 0.6,
      metalness: 0,
      emissive: GLOW,
      emissiveIntensity: 2,
      detail: 0.016,
      maxError: 0.012,
      maxTriangles: 320,
      paintWeight: 3,
    });

    // ------------------------------------------------------------------ charred logs
    const log = (a: readonly [number, number, number], b: readonly [number, number, number], r: number): Sdf =>
      sdf.capsule([a[0], a[1], a[2]], [b[0], b[1], b[2]], r);
    const logs = sdf.union(
      log([-0.30, 0.205, 0.32], [0.19, 0.205, 0.27], 0.058),
      log([-0.23, 0.275, 0.36], [0.24, 0.275, 0.34], 0.05),
      log([0.05, 0.24, 0.20], [0.11, 0.24, 0.43], 0.05),
    );
    const logPaint = (x: number, y: number, z: number, base: Rgb): Rgb => {
      const grain = noise.fbm(x * 5 + z * 35, y * 9, z * 5 - x * 30, 3, 3);
      let c = mixRgb(CHAR, CHAR_WARM, clamp01(0.25 + 0.55 * (0.5 + 0.5 * grain)));
      c = mixRgb(c, rgb('#241a12'), clamp01(-grain) * 0.55);
      // Warm ember tint on the inner faces nearest the fire (a color shift, not baked light).
      c = mixRgb(c, rgb('#8a4a22'), clamp01(1 - Math.hypot(x, z - 0.3) / 0.3) * 0.28);
      return c;
    };
    k.body('logs', logs.paintFn(logPaint), {
      color: CHAR,
      roughness: 0.85,
      metalness: 0,
      detail: 0.011,
      maxError: 0.005,
      maxTriangles: 900,
      paintWeight: 3,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 60, y * 16, z * 60, 3, 7),
    });

    // ------------------------------------------------------------------ flames
    const tongue = profile.polygon(
      [
        [0, 0],
        [0.045, 0.012],
        [0.078, 0.058],
        [0.09, 0.125],
        [0.082, 0.195],
        [0.06, 0.26],
        [0.028, 0.315],
        [0, 0.35],
      ],
      { smooth: true, samples: 10 },
    );
    const flameAt = (x: number, y: number, z: number, s: number, lean: number): Sdf => {
      const shape = sdf.revolve(tongue).scale([s * 0.95, s, s]).rotateZ(lean);
      return shape.at(x, y, z);
    };
    const flames = sdf.union(
      flameAt(-0.16, 0.16, 0.31, 1.05, 7),
      flameAt(0.02, 0.16, 0.275, 1.35, -2),
      flameAt(0.185, 0.15, 0.33, 0.85, -9),
    );
    const flamePaint = (x: number, y: number, z: number): Rgb => {
      const t = clamp01((y - 0.16) / 0.47);
      const r = Math.hypot(x - 0.02, z - 0.29);
      const core = clamp01((0.07 - r) / 0.07) * clamp01(1 - t * 1.6);
      let c = mixRgb(FLAME, FLAME_CORE, core * 0.7);
      c = mixRgb(c, FLAME, t * 0.35);
      return c;
    };
    k.body('flames', flames.paintFn(flamePaint), {
      color: FLAME,
      roughness: 0.45,
      metalness: 0,
      emissive: GLOW,
      emissiveIntensity: 2.5,
      detail: 0.008,
      maxError: 0.003,
      maxTriangles: 900,
      paintWeight: 3,
    });
  },
});
