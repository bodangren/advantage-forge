import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — mining pickaxe (props/craft-and-trade/pickaxe).
 *
 * Role: hand tool / blacksmith-quest prop for the cozy chibi scene; reads at 128 px.
 * Size: 0.85 m tall, stands on its rounded walnut butt at y = 0, faces +Z.
 * One idea: a long walnut haft with a fat teardrop butt, topped by a chunky
 *   iron head featuring a long curved pick point on one side and a flat
 *   steel-edged chisel blade on the other.
 * Shape language: square dominant (chunky iron head, flat chisel), organic
 *   secondary (curved walnut haft, rounded teardrop butt).
 * Palette: walnut #6b4226 / #54331d, iron #4a4f55 / #363a3f with highlight
 *   #a8acb1, steel edge #c8ccd2. 60/30/10.
 * Materials: walnut wood (roughness 0.8), worn iron (roughness 0.5, metalness
 *   0.7). Steel colour is painted on the outer face of the blade for the
 *   highlight; the underlying material stays iron for a single dark body.
 * Detail: primary teardrop butt + tapered haft + eye block + curved pick +
 *   chisel blade + steel-painted cutting edge. Focal point: the bright steel.
 * Rig/animation: none (static prop).
 */

const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const WALNUT = rgb('#6b4226');
const WALNUT_DEEP = rgb('#54331d');
const WALNUT_LIGHT = rgb('#c08a44');
const STEEL = rgb('#d4d8de');
const STEEL_DEEP = rgb('#8e959e');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Head and handle dimensions (meters).
const HEAD_Y = 0.72;        // head centre height
const HANDLE_TOP_Y = 0.84;  // handle pokes just above the head
const BUTT_R = 0.050;       // butt sphere radius (bottom sits on y = 0)
const BUTT_Y = BUTT_R;      // butt sphere centre y so bottom touches ground

// Walnut paint: dark grain, warm patches, deep butt, lit crown.
const walnutPaint = (x: number, y: number, z: number) => {
  let c = WALNUT;
  const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 4, z * 30, 2);
  c = mixRgb(c, WALNUT_DEEP, 0.34 * grain * grain);
  const patch = 0.5 + 0.5 * noise.fbm(x * 7 + 5, y * 7, z * 7, 2);
  c = mixRgb(c, WALNUT_LIGHT, 0.5 * patch);
  const top = clamp01((y - 0.18) / 0.5);
  c = mixRgb(c, WALNUT_LIGHT, 0.2 * top);
  const low = clamp01((0.08 - y) / 0.10);
  c = mixRgb(c, WALNUT_DEEP, 0.45 * low);
  return c;
};

// Iron paint: dark base with tarnish, bright top, deep underside, darker near the steel seam.
const ironPaint = (x: number, y: number, z: number) => {
  let c = IRON;
  const tarnish = 0.5 + 0.5 * noise.fbm(x * 22 + 3, y * 22, z * 22, 2);
  c = mixRgb(c, IRON_DEEP, 0.32 * tarnish);
  const top = clamp01((y - (HEAD_Y + 0.05)) / 0.04);
  c = mixRgb(c, IRON_LIGHT, 0.45 * top);
  const bottom = clamp01(((HEAD_Y - 0.075) - y) / 0.04);
  c = mixRgb(c, IRON_DEEP, 0.4 * bottom);
  // Darken the iron right before the steel face so the colour contrast reads.
  const seam = clamp01((x - 0.105) / 0.025);
  c = mixRgb(c, IRON_DEEP, 0.55 * seam);
  return c;
};

// Steel paint overlay: bright polished with subtle sheen.
const steelPaint = (x: number, y: number, z: number) => {
  let c = STEEL;
  const sheen = 0.5 + 0.5 * noise.fbm(x * 16, y * 16, z * 16, 2);
  c = mixRgb(c, STEEL_DEEP, 0.22 * sheen);
  // Darken slightly at the inner edge so the steel-to-iron transition reads.
  const inner = clamp01((0.135 - x) / 0.015);
  c = mixRgb(c, STEEL_DEEP, 0.45 * inner);
  return c;
};

export default defineAsset({
  name: 'pickaxe',
  description:
    'Mining pickaxe, 0.85 m: a long walnut haft with a fat rounded teardrop butt, topped by a chunky iron head with a long curved pick point on one side and a flat steel-edged chisel blade on the other.',
  detail: 0.005,
  reference: 'docs/item-mockups/pickaxe-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ----------------------------------------------------------------- handle
    // Tapered walnut chain: fat teardrop butt, slim shaft, flat top. The first
    // sphere's bottom touches y = 0, so the pickaxe stands on its butt.
    const handleChain: readonly (readonly [number, number, number, number])[] = [
      [0, BUTT_Y, 0, BUTT_R],       // big teardrop butt
      [0, BUTT_Y + 0.045, 0, 0.034],
      [0, BUTT_Y + 0.090, 0, 0.027],
      [0, BUTT_Y + 0.230, 0, 0.023],
      [0, BUTT_Y + 0.420, 0, 0.022],
      [0, BUTT_Y + 0.590, 0, 0.021],
      [0, BUTT_Y + 0.700, 0, 0.020],
      [0, HANDLE_TOP_Y, 0, 0.020],
    ];
    const handle = sdf.chain(handleChain, 0.018).paintFn(walnutPaint);
    k.body('haft', handle, {
      color: '#6b4226',
      roughness: 0.8,
      detail: 0.005,
      paintWeight: 2,
      bump: (x, y, z) => 0.0012 * (noise.fbm(x * 22, y * 5, z * 22, 2) - 0.5),
      maxTriangles: 850,
    });

    // ----------------------------------------------------------------- iron head
    // Central eye block: rounded box where the handle passes through.
    const eye = sdf.box([0.13, 0.16, 0.095], 0.018).at(0, HEAD_Y, 0);

    // Pick end: tapered curved chain sweeping down to a sharp point on -X.
    // Slimmer than before so the silhouette reads like a horn rather than a club.
    const pickChain: readonly (readonly [number, number, number, number])[] = [
      [-0.04, HEAD_Y + 0.020, 0, 0.048],
      [-0.085, HEAD_Y + 0.018, 0, 0.044],
      [-0.130, HEAD_Y + 0.005, 0, 0.036],
      [-0.175, HEAD_Y - 0.025, 0, 0.024],
      [-0.220, HEAD_Y - 0.080, 0, 0.010],
      [-0.255, HEAD_Y - 0.155, 0, 0.002],
    ];
    const pick = sdf.chain(pickChain, 0.014);

    // Blade end: chunky short block extending to +X with a flat outer face.
    const blade = sdf.box([0.105, 0.095, 0.085], 0.014).at(0.1125, HEAD_Y, 0);  // x = 0.060..0.165

    const ironBase = sdf
      .smoothUnion(0.013, eye, sdf.smoothUnion(0.012, pick, blade))
      .paintFn(ironPaint);

    // Steel face: paint the outer portion of the blade steel colour so it reads
    // as a sharpened cutting edge without a separate body.
    const steelStencil = sdf.box([0.045, 0.20, 0.20]).at(0.142, HEAD_Y, 0);
    const ironHead = ironBase.paintWhere(steelStencil, rgb(0xd4d8de), 0.008).paintFn((x, y, z) => {
      const insideSteel = (x > 0.119 && x < 0.165 && Math.abs(y - HEAD_Y) < 0.05 && Math.abs(z) < 0.045);
      if (insideSteel) return steelPaint(x, y, z);
      return ironPaint(x, y, z);
    });

    k.body('iron', ironHead, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0045,
      paintWeight: 2,
      bump: (x, y, z) => 0.0006 * noise.fbm(x * 36, y * 36, z * 36, 2),
      maxTriangles: 1600,
    });
  },
});