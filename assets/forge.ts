import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — blacksmith's stone forge (props/craft-and-trade/forge).
 *
 * Role: the workshop's warm focal prop; must read at 128 px, fire visible through
 *   the front opening.
 * Size: 1.3 m wide, 0.9 m deep, 1.1 m to the top of the hearth block, chimney to
 *   2.0 m. Stands on y = 0, open front faces +Z.
 * One idea: a chunky rounded fieldstone hearth with a raised coal bed glowing
 *   inside an arched mouth, crowned by a tapered stone hood and short chimney.
 * Shape language: square dominant (sturdy block, trapezoid hood), round secondary
 *   (soft bevels, arched opening, round chimney).
 * Palette: cool gray stone family — mid #8a94a0 (dominant), dark #5b6670, light
 *   mortar #9fa8b2; dark iron #4a4f55 (secondary); accent = the fire, flame
 *   #ff9a3c / #ffd66b, ember coals #ff6a2a (emissive only, never plain paint).
 * Materials: fieldstone (worley cells, roughness 0.9), worn iron (roughness 0.5,
 *   metalness 0.7), charcoal coals (roughness 0.95), emissive embers and flames.
 * Detail: primary block + hood + chimney; secondary arch mouth, iron rim band,
 *   fire-bar, coal mound; tertiary worley mortar in paint + bump, soot stain
 *   around the mouth. Focal point: the fire through the arch.
 * Rig/animation: none (static prop).
 */

const STONE_MID = rgb('#8a94a0');
const STONE_DARK = rgb('#5b6670');
const STONE_LIGHT = rgb('#a9b3bd');
const SEAM = rgb('#5b6670');
const SOOT = rgb('#46413c');
const IRON = '#4a4f55';

const BLOCK_W = 1.3;
const BLOCK_D = 0.9;
const BLOCK_TOP = 1.1;
const BED_Y = 0.42; // waist-high hearth bed (top of the coal mound floor)
const MOUTH_W = 0.64;

/** Fieldstone: smooth Worley seam darkening + a continuous tint field. Hard color steps
 * would split paint seams triangle-by-triangle, so everything here stays soft. */
const stonePaint = (x: number, y: number, z: number) => {
  const c = noise.worley(x * 6, y * 7.5, z * 6);
  const border = c.f2 - c.f1;
  const tint = 0.5 + 0.5 * noise.fbm(x * 3.5, y * 3.5, z * 3.5, 2);
  const seam = Math.min(1, Math.max(0, (0.15 - border) / 0.09));
  let col = mixRgb(STONE_MID, STONE_DARK, 0.3 + 0.55 * tint);
  col = mixRgb(col, SEAM, 0.8 * seam * seam);
  // Sun-lit top, damp dark base.
  col = mixRgb(col, STONE_DARK, 0.4 * Math.max(0, 1 - y / 0.3));
  col = mixRgb(col, STONE_LIGHT, 0.22 * Math.max(0, (y - 0.85) / 0.25));
  // Soot staining hugging the fire mouth on the front face.
  const dx = Math.abs(x);
  const nearMouth = z > 0.25 && dx < 0.46 && y > 0.3 && y < 1.02;
  if (nearMouth) {
    const d = Math.max(dx - MOUTH_W / 2, 0) + Math.max(Math.abs(y - 0.68) - 0.3, 0);
    col = mixRgb(col, SOOT, 0.45 * Math.max(0, 1 - d / 0.13));
  }
  return col;
};
const stoneBump = (x: number, y: number, z: number) => {
  const c = noise.worley(x * 6, y * 7.5, z * 6);
  return -0.008 * Math.min(1, (c.f2 - c.f1) * 4) + 0.004;
};

export default defineAsset({
  name: 'forge',
  description:
    "Blacksmith's stone forge: chunky rounded fieldstone hearth with a raised coal bed glowing inside an arched mouth, iron rim and fire-bar, tapered stone hood and short chimney.",
  detail: 0.01,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- stone body
    // Chunky rounded block, tapered hood slab, short round chimney: one stone body.
    const block = sdf.box([BLOCK_W, BLOCK_TOP, BLOCK_D], 0.055).at(0, BLOCK_TOP / 2, 0);
    const hoodProfile = profile.polygon([
      [-0.62, 1.0],
      [0.62, 1.0],
      [0.28, 1.44],
      [-0.28, 1.44],
    ]);
    const hood = sdf.extrude(hoodProfile, 0.8, 0.03).at(0, 0, -0.04);
    const chimneyProfile = profile.polygon([
      [0.21, 1.38],
      [0.2, 1.9],
      [0.17, 1.98],
      [0.17, 2.0],
      [0, 2.0],
    ]);
    const chimney = sdf.revolve(chimneyProfile).at(0, 0, -0.1);

    // Firebox: inner chamber floored at the waist-high bed, plus an arched mouth
    // cut clean through the front wall so the fire reads from +Z. The chamber
    // stops short of the back face so the rear wall stays solid.
    const chamber = sdf.box([0.72, 0.54, 0.6], 0.07).at(0, 0.67, -0.02);
    const archProfile = profile.polygon(
      [
        [-0.32, -0.26],
        [0.32, -0.26],
        [0.32, 0.02],
        [0.26, 0.15],
        [0.14, 0.23],
        [0, 0.26],
        [-0.14, 0.23],
        [-0.26, 0.15],
        [-0.32, 0.02],
      ],
      { smooth: true },
    );
    const mouth = sdf.extrude(archProfile, 0.55, 0.015).at(0, 0.68, 0.26);

    const stone = sdf
      .smoothUnion(0.05, block, hood, chimney)
      .subtract(sdf.union(chamber, mouth))
      .paintFn(stonePaint);
    k.body('stone', stone, {
      color: '#8a94a0',
      roughness: 0.9,
      metalness: 0,
      detail: 0.009,
      textureDensity: 2,
      bump: stoneBump,
      maxTriangles: 4600,
    });

    // ------------------------------------------------------------- ironwork
    // Rim band hugging the hearth's top edge, and a fire-bar across the mouth.
    const stoneForShell = sdf.smoothUnion(0.05, block, hood, chimney);
    const shell = stoneForShell.round(0.012).subtract(stoneForShell.round(-0.004));
    const band = shell.intersect(sdf.box([1.5, 0.075, 1.1], 0.01).at(0, 1.045, 0));
    const fireBar = sdf.capsule([-0.3, 0.47, 0.28], [0.3, 0.47, 0.28], 0.018);
    k.body('iron', sdf.union(band, fireBar), {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      maxTriangles: 900,
    });

    // ------------------------------------------------------------- coals
    // Charcoal mound on the raised bed: dark lumps, ember glow from emissive
    // bodies only — the coal paint itself stays near-black.
    const lumps: ReturnType<typeof sdf.sphere>[] = [];
    const lumpSeed: Array<[number, number, number, number]> = [
      [-0.17, 0.45, 0.1, 0.068],
      [0.16, 0.45, 0.08, 0.064],
      [-0.08, 0.46, 0.2, 0.058],
      [0.09, 0.46, 0.19, 0.06],
      [0, 0.44, 0.0, 0.07],
      [0.02, 0.5, 0.12, 0.05],
    ];
    for (const [x, y, z, r] of lumpSeed) {
      lumps.push(sdf.sphere(r).at(x, y, z));
    }
    const mound = sdf
      .ellipsoid([0.25, 0.09, 0.2])
      .at(0, 0.43, 0.06)
      .displace(0.012, (x, y, z) => noise.fbm(x * 22, y * 22, z * 22, 3));
    const coals = sdf
      .smoothUnion(0.03, mound, ...lumps)
      .paintFn((x, y, z) => {
        const patch = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
        return mixRgb(rgb('#332c28'), rgb('#1e1a17'), 0.35 + 0.4 * patch);
      });
    k.body('coals', coals, {
      color: '#2a2421',
      roughness: 0.95,
      metalness: 0,
      detail: 0.009,
      maxTriangles: 800,
    });

    // Ember coals: emissive bodies flanking the flames in the gaps between
    // lumps, raised so they glow through the mouth from the front.
    const embers = sdf.union(
      sdf.sphere(0.04).at(-0.21, 0.48, 0.13),
      sdf.sphere(0.038).at(0.22, 0.47, 0.11),
      sdf.sphere(0.034).at(-0.06, 0.53, 0.22),
      sdf.sphere(0.032).at(0.13, 0.51, 0.2),
      sdf.sphere(0.03).at(0.0, 0.47, -0.04),
      sdf.sphere(0.032).at(-0.14, 0.46, -0.08),
    );
    k.body('embers', embers, {
      color: '#ff6a2a',
      roughness: 0.4,
      metalness: 0,
      emissive: '#ff6a2a',
      emissiveIntensity: 2.5,
      detail: 0.006,
      maxTriangles: 400,
    });

    // ------------------------------------------------------------- fire
    // Flame tongues: bright outer #ff9a3c, hotter inner core #ffd66b, emissive.
    const outerFlame = sdf.chain(
      [
        [-0.1, 0.44, 0.1, 0.085],
        [-0.15, 0.6, 0.11, 0.07],
        [-0.11, 0.76, 0.1, 0.045],
        [-0.15, 0.87, 0.1, 0.015],
      ],
      0.05,
    );
    const mainFlame = sdf.chain(
      [
        [0, 0.43, 0.12, 0.11],
        [0.04, 0.62, 0.12, 0.09],
        [0, 0.8, 0.11, 0.055],
        [0.03, 0.93, 0.11, 0.016],
      ],
      0.055,
    );
    const flames = sdf.union(outerFlame, mainFlame);
    k.body('flames', flames, {
      color: '#ff9a3c',
      roughness: 0.3,
      metalness: 0,
      emissive: '#ff9a3c',
      emissiveIntensity: 2.2,
      detail: 0.008,
      maxTriangles: 800,
    });

    const core = sdf.chain(
      [
        [0, 0.44, 0.17, 0.055],
        [0.01, 0.57, 0.18, 0.042],
        [0, 0.68, 0.17, 0.02],
      ],
      0.04,
    );
    const glowBase = sdf.ellipsoid([0.1, 0.04, 0.08]).at(0, 0.45, 0.19);
    k.body('flame-core', sdf.union(core, glowBase), {
      color: '#ffd66b',
      roughness: 0.3,
      metalness: 0,
      emissive: '#ffd66b',
      emissiveIntensity: 2.2,
      detail: 0.007,
      maxTriangles: 400,
    });
  },
});
