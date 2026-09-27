import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — coiled hemp rope (props/decor/rope-coil).
 *
 * Role: blacksmith scene clutter prop; reads at 128 px as one stout rope donut.
 * Size: ~0.4 m diameter, 0.12 m tall, sits on y = 0, faces +Z.
 * One idea: a neat coil of warm tan hemp rope wound in three visible turns,
 *   with a free end tucked under the coil — a stout donut silhouette with
 *   diagonal twist strands breaking the smooth tube surface.
 * Shape language: round dominant (chunky torus turns, soft bevels).
 * Palette: hemp tan #c2a06a dominant; shade #9a7d4c (deep groove, tucked
 *   tip); light #d8b888 (sun-lit top of each turn).
 * Materials: hemp rope (roughness 0.85, twist in bump + paint). No metal.
 * Detail: 3 stacked torus rings (tangent so each turn reads) + free end
 *   curling out the front-right and tucking under + diagonal 3-strand twist
 *   baked into bump and paint.
 * Rig/animation: none (static prop).
 */

const ROPE = rgb('#c2a06a');
const ROPE_SHADE = rgb('#9a7d4c');
const ROPE_LIGHT = rgb('#d8b888');

const RING_R = 0.18; // mean ring radius (outer 0.20 m, inner 0.16 m)
const TUBE_R = 0.02; // rope tube radius (rope diameter 0.04 m)
// Three turns stacked tangent: bottom touches y=0, top touches y=0.12.
const RING_YS = [TUBE_R, 3 * TUBE_R, 5 * TUBE_R];

export default defineAsset({
  name: 'rope-coil',
  description:
    'Coiled length of hemp rope: three neat tan turns wound into a stout donut shape with a free end tucked under the coil.',
  detail: 0.008,
  reference: 'reference/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ coil
    // Three stacked torus rings, tangent to each other so each turn reads as
    // its own wrap. Together they fill a 0.4 m x 0.12 m stout donut.
    const rings = RING_YS.map((y) => sdf.torus(RING_R, TUBE_R).at(0, y, 0));
    const coilShape = sdf.union(...rings);

    // Diagonal 3-strand twist. The pattern uses the angle around the coil
    // axis plus a slope in Y, so each strand spirals along the rope.
    const twist = (a: number, y: number) => 0.5 + 0.5 * Math.cos(3 * (a + y * 34));

    const ropePaint = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const t = twist(a, y);
      let c = mixRgb(ROPE, ROPE_LIGHT, 0.16 + 0.34 * t);
      c = mixRgb(c, ROPE_SHADE, 0.32 * (1 - t));
      // Soft tonal patches across the coil so it doesn't read as plastic.
      const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
      c = mixRgb(c, ROPE_LIGHT, 0.08 * patch);
      // Sun-lit top, shaded seated bottom.
      const ty = Math.min(1, Math.max(0, y / 0.12));
      c = mixRgb(c, ROPE_LIGHT, 0.14 * Math.max(0, (ty - 0.55) / 0.45));
      c = mixRgb(c, ROPE_SHADE, 0.22 * Math.pow(1 - ty, 1.6));
      return c;
    };
    const ropeBump = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      // Diagonal 3-strand twist relief (bump only — keeps the mesh light).
      return 0.0014 * Math.cos(3 * (a + y * 34)) + 0.0006 * noise.fbm(x * 28, y * 28, z * 28, 2);
    };
    k.body('coil', coilShape.paintFn(ropePaint), {
      color: '#c2a06a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      bump: ropeBump,
      maxTriangles: 2400,
    });

    // ------------------------------------------------------------------ free end
    // A short length of rope escapes between the bottom and middle turns on
    // the front-right, curls outward and downward, then tucks back under the
    // coil. It pokes the silhouette so the donut doesn't read as a closed ring.
    // Lifted slightly so the tucked tip stays on y = 0.
    const tail = sdf.chain(
      [
        [0.155, 0.046, 0.085, 0.02], // start at front edge between bottom and middle turn
        [0.198, 0.028, 0.118, 0.019], // curl outward, slightly down
        [0.218, 0.012, 0.082, 0.017], // down and around
        [0.172, 0.014, 0.012, 0.014], // tucked under the coil, just above ground
        [0.098, 0.012, -0.05, 0.011], // taper to hidden tip
      ],
      0.012,
    );
    // Same twist paint, but darker near the tucked tip (in shadow).
    const tailPaint = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const t = twist(a, y * 0.6); // gentler twist on the curling tail
      let c = mixRgb(ROPE, ROPE_LIGHT, 0.18 + 0.3 * t);
      c = mixRgb(c, ROPE_SHADE, 0.32 * (1 - t));
      // Tucked tail end is in deep shadow.
      const tucked = Math.max(0, Math.min(1, (0.04 - y) / 0.04));
      c = mixRgb(c, ROPE_SHADE, 0.45 * tucked);
      return c;
    };
    k.body('tail', tail.paintFn(tailPaint), {
      color: '#c2a06a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      paintWeight: 1.5,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 800,
    });
  },
});
