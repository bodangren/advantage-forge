import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Bamboo fishing pole (equipment/tools/fishing-pole), matched to docs/item-mockups/fishing-pole-mock.jpg.
 * Role: equipment icon, read at 128 px. Size: 1.5 m tall, standing on y = 0, leaning 12 degrees to -X, faces +Z.
 * One idea: a chunky bamboo cane with a thick cream line arcing to a fat yellow float on the +X side.
 * Shape language: round and chunky (thick line, fat float), one secondary: nodes.
 * Palette: bamboo #e0b45a / node #b48a3c, walnut #8a5a35, line #efe4c8, float #f0c040 with red band, steel hook.
 * Materials: cane, butt (brass ring + walnut reel knob), line, float (yellow, grey cap), hook (steel).
 * Focal point: the float. Rig: none.
 */

const BAMBOO = rgb('#e0b45a');
const NODE = rgb('#b48a3c');
const LEAN = 12;
const SHIFT = 0.15; // centers the leaning cane on the Y axis
const H = 1.48; // cane length along its axis
const rad = (t: number) => 0.04 - 0.02 * t; // t in 0..1 along the cane
const lean = (s: ReturnType<typeof sdf.sphere>) => s.rotateZ(LEAN).at(SHIFT, 0.02, 0);
const world = (x: number, y: number, z = 0) => [x, y, z] as const;

export default defineAsset({
  name: 'fishing-pole',
  description: 'A chunky bamboo fishing pole standing upright and leaning, with a thick line to a fat yellow float, a reel knob, and a hook.',
  detail: 0.004,
  reference: 'docs/item-mockups/fishing-pole-mock.jpg',
  texture: { size: 512 },

  build(k) {
    // Local frame: cane along +Y from the origin, then leaned and placed.
    let cane = sdf.cone([0, 0, 0], [0, H, 0], 0.04, 0.02);
    const nodeTs = [0.14, 0.32, 0.5, 0.68, 0.86];
    for (const t of nodeTs) {
      cane = cane.smoothUnion(0.01, sdf.torus(rad(t) + 0.002, 0.008).at(0, t * H, 0));
    }
    const nodeYs = nodeTs.map((t) => t * H);
    const canePlaced = lean(cane).paintFn((x, y, z, base) => {
      // undo the transform to find the local height along the cane
      const px = x - SHIFT;
      const py = y - 0.02;
      const c = Math.cos((LEAN * Math.PI) / 180);
      const s = Math.sin((LEAN * Math.PI) / 180);
      const ly = px * s + py * c;
      let m = 0;
      for (const ny of nodeYs) m = Math.max(m, Math.exp(-Math.pow((ly - ny) / 0.014, 2)));
      return mixRgb(BAMBOO, NODE, m);
    });
    k.body('cane', canePlaced, { color: '#e0b45a', roughness: 0.7, metalness: 0 });

    const cap = lean(sdf.torus(0.04, 0.012).at(0, 0.005, 0));
    k.body('cap', cap, { color: '#c9a24a', roughness: 0.35, metalness: 0.85 });
    const knob = sdf.cylinder(0.05, 0.06, 0.012).rotateX(90).rotateZ(LEAN).at(-0.055 - 0.2 * Math.sin((LEAN * Math.PI) / 180) + SHIFT + 0.02, 0.2, 0);
    k.body('knob', knob, { color: '#8a5a35', roughness: 0.75, metalness: 0 });

    // Line from the tip, arcing out to +X and down, in the front-view plane.
    const tip = [SHIFT - H * Math.sin((LEAN * Math.PI) / 180), 0.02 + H * Math.cos((LEAN * Math.PI) / 180), 0];
    const dx = 0.15;
    const line = sdf.chain(
      [
        [tip[0], tip[1], 0, 0.014],
        [0.2 + dx - 0.15, 1.4, 0, 0.012],
        [0.32 + dx - 0.15, 1.2, 0, 0.012],
        [0.34, 0.95, 0, 0.012],
        [0.34, 0.9, 0, 0.012],
      ],
      0.02,
    );
    k.body('line', line, { color: '#efe4c8', roughness: 0.6, metalness: 0 });

    const fl = sdf.ellipsoid([0.07, 0.1, 0.07]).at(0.34, 0.85, 0);
    const floatBody = fl.paintFn((x, y) => {
      const d = Math.abs(y - 0.85);
      return d < 0.018 ? rgb('#c8302a') : rgb('#f0c040');
    });
    k.body('float', floatBody, { color: '#f0c040', roughness: 0.4, metalness: 0 });
    k.body('floatcap', sdf.sphere(0.035).at(0.34, 0.94, 0), { color: '#8a8f96', roughness: 0.5, metalness: 0.2 });

    const ring = sdf.torus(0.03, 0.006).rotateX(90).at(0.34, 0.66, 0);
    const cut = sdf.box([0.2, 0.2, 0.2]).at(0.34 + 0.1 + 0.0, 0.66 + 0.05, 0); // removes upper right quadrant
    const hook = ring.subtract(cut);
    const shank = sdf.capsule([0.34 - 0.03, 0.66, 0], [0.34 - 0.03, 0.74, 0], 0.006);
    k.body('hook', hook.smoothUnion(0.005, shank), { color: '#9aa0a8', roughness: 0.3, metalness: 0.85 });
  },
});
