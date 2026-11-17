import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';
import type { AssetContext } from '../src/index.js';

/**
 * Design note — a fat wooden paint brush standing on its bristle tip (Chibi Sprouts props).
 *
 * Role: a paint-barn prop that leans in the corner; must read at 128 px.
 * Size: 0.17 m from the bristle tip to the top of the handle. The tip rests on y = 0
 *   and the body leans 8 degrees toward +X, so the mesh shifts along X to straddle the
 *   Y axis.
 * One idea: a chunky varnished handle with a dark grip band, a bright iron ferrule,
 *   and bristles loaded with paint from the tip up to the ferrule edge. The book gives pink and
 *   purple paint, so the bristle colour is a colour slot.
 * Shape language: round (a lathe shape) with one sharp tapered bristle tip.
 * Palette: wood #b5814a (dominant), grip #8a5a35 (mid), iron #4a4f55 (dark accent),
 *   bristles: the `paint` slot, pink #e87fb0 (default) or purple #8e5bb5 (the focal accent).
 * Materials: varnished wood (0.75), iron (0.35, 0.85), paint-loaded bristles (0.7).
 * Detail list: primary the handle and the bristle cone; secondary the ferrule and its
 *   crimp band; tertiary the grip band and the wood grain.
 * Rig/animation: none (static prop).
 */

const WOOD = rgb('#b5814a');
const WOOD_DARK = rgb('#8a5a35');

const LEAN = (8 * Math.PI) / 180;
const SIN = Math.sin(LEAN);
const COS = Math.cos(LEAN);
/** The distance along the brush axis, in metres, for a world point. */
const along = (x: number, y: number): number => x * SIN + y * COS;

const TIP_Y = 0.0032; // the bristle tip
const BRISTLE_TOP = 0.04;
const FERRULE_MID = 0.049;
const HANDLE_TOP = 0.17;
/** The lean moves the brush to one side; this shift puts it back on the Y axis. */
const SHIFT_X = -0.0167;

/** Varnished wood with a grain that runs along the handle. */
const handlePaint = (x: number, y: number, z: number) => {
  const t = along(x, y);
  const grain = 0.5 + 0.5 * noise.fbm((x + z) * 55, t * 3.5, (z - x) * 55, 2);
  return mixRgb(WOOD_DARK, WOOD, 0.4 + 0.5 * grain);
};

/** The bristles carry the paint from the tip up to the ferrule edge, so the whole bristle below
 * the ferrule is the `paint` slot colour. */
const makeBristlePaint = (k: AssetContext) => () => rgb(k.tint('paint'));

export default defineAsset({
  name: 'brush',
  description:
    'A 0.17 m paint brush standing on its bristle tip and leaning 8 degrees: a varnished wood handle with a dark grip band, an iron ferrule, and pink or purple painted bristles.',
  detail: 0.003,
  texture: { size: 512 },

  variants: {
    paint: { pink: '#e87fb0', purple: '#8e5bb5' },
  },
  presets: {
    // W3 "held by children; pink and purple paint". The first option is the default look.
    pink: { paint: 'pink' },
    purple: { paint: 'purple' },
  },

  build(k) {
    // The bristles: a tapered cone with a round tip that rests on the ground. The radius grows
    // by 20 % over the old cone, so the paint tip reads at 128 px.
    const bristles = sdf
      .smoothUnion(
        0.0012,
        sdf.cone([0, TIP_Y, 0], [0, BRISTLE_TOP, 0], 0.00384, 0.01536),
        sdf.sphere(0.00384).at(0, TIP_Y, 0),
      )
      .paintFn(makeBristlePaint(k))
      .rotateZ(-8)
      .at(SHIFT_X, 0, 0);
    k.body('bristles', bristles, {
      color: k.tint('paint'),
      roughness: 0.7,
      metalness: 0,
      detail: 0.0016,
      textureDensity: 2,
    });

    // The ferrule: an iron sleeve with one crimp band round it.
    const ferrule = sdf
      .smoothUnion(
        0.001,
        sdf.cylinder(0.0132, 0.02, 0.0016).at(0, FERRULE_MID, 0),
        sdf.cylinder(0.0139, 0.0045, 0.0012).at(0, FERRULE_MID, 0),
      )
      .rotateZ(-8)
      .at(SHIFT_X, 0, 0);
    k.body('ferrule', ferrule, {
      color: '#4a4f55',
      roughness: 0.35,
      metalness: 0.85,
      detail: 0.0018,
    });

    // The handle: a tapered shaft with a round top, and a raised grip band near the top.
    const grip = sdf.cylinder(0.0142, 0.028, 0.0004).at(0, 0.14, 0);
    const gripRegion = sdf.cylinder(0.015, 0.028).at(0, 0.14, 0);
    const handle = sdf
      .smoothUnion(
        0.004,
        sdf.cone([0, 0.054, 0], [0, 0.15, 0], 0.0124, 0.0138),
        sdf.sphere(0.014).at(0, HANDLE_TOP - 0.014, 0),
      )
      .union(grip)
      .paintFn(handlePaint)
      .paintWhere(gripRegion, '#8a5a35')
      .rotateZ(-8)
      .at(SHIFT_X, 0, 0);
    k.body('handle', handle, {
      color: '#b5814a',
      roughness: 0.75,
      metalness: 0,
      detail: 0.003,
      textureDensity: 2,
      bump: (x, y, z) => 0.00022 * noise.fbm((x + z) * 120, along(x, y) * 6, (z - x) * 120, 2),
    });
  },
});
