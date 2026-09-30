import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — leather gauntlet gloves (equipment/armor/gloves).
 *
 * Role: wearable armor item for the Chibi Quest heroes; must read at 128 px as a pair
 *   of chunky gloves.
 * Size: pair 0.5 m wide, ~0.6 m tall, standing on y = 0, facing +Z, palms to the camera.
 * One idea: two fat mitten-fingered gauntlets standing on their flared cuffs, leaning
 *   toward each other, with brass stitch bars on the cuffs.
 * Shape language: round dominant (palm, fat fingers); flared cone cuffs secondary.
 * Palette: leather #b0603a, dark cuff band #7a3e26, pale stitches #e8d8b0, brass #c8a040.
 * Materials: leather (roughness 0.7), brass bars (roughness 0.35, metalness 1).
 * Detail: primary cuff + palm + fingers + thumb; secondary cuff band, stitches, brass bars.
 * Focal point: the brass bars on the cuffs. Rig/animation: none.
 * Built as the right glove at x +0.12 (leaning -12 deg toward the center), then mirrored.
 */

const LEATHER = rgb('#b0603a');
const BAND = rgb('#7a3e26');
const STITCH = rgb('#e8d8b0');
const BRASS = '#c8a040';

const X0 = 0.19;
const LEAN = 6;
const cuffR = (y: number) => 0.11 - (0.02 * y) / 0.18;

function gloveShape(): sdf.Shape {
  const cone = sdf.cone([0, -0.01, 0], [0, 0.18, 0], 0.11, 0.09).round(0.006);
  const cuff = sdf.intersect(
    cone,
    sdf.intersect(sdf.halfSpace([0, -1, 0], 0), sdf.box([0.4, 0.4, 0.4]).at(0, 0.2, 0)),
  );
  const palm = sdf.ellipsoid([0.1, 0.14, 0.06]).at(0, 0.3, 0);
  // Four fat fingers fanned 8 degrees apart, rooted at the palm top.
  const bases = [-0.075, -0.026, 0.026, 0.075];
  const angles = [-12, -4, 4, 12];
  const fingers = sdf.union(
    ...bases.map((bx, i) => {
      const a = (angles[i] * Math.PI) / 180;
      const y0 = 0.4 - Math.abs(bx) * 0.15;
      const len = i === 1 || i === 2 ? 0.125 : 0.115;
      return sdf.capsule(
        [bx, y0, 0.007],
        [bx + len * Math.sin(a), y0 + len * Math.cos(a), 0.012],
        0.042,
      );
    }),
  );
  // Thumb on the outer side, leaning out 35 degrees.
  const ta = (35 * Math.PI) / 180;
  const t0: [number, number, number] = [0.07, 0.3, 0.015];
  const thumb = sdf.capsule(
    t0,
    [t0[0] + 0.1 * Math.sin(ta), t0[1] + 0.1 * Math.cos(ta), 0.03],
    0.04,
  );
  return sdf.smoothUnion(0.03, cuff, palm, fingers, thumb);
}

const place = (s: sdf.Shape) => s.rotateZ(LEAN).at(X0, 0, 0).mirror('x', 0);

export default defineAsset({
  name: 'gloves',
  description:
    'A pair of chunky leather gauntlet gloves standing on flared cuffs, fingers up, leaning together, with pale stitches and brass bars.',
  detail: 0.006,
  reference: 'docs/item-mockups/gloves-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const stitchY = [0.05, 0.09, 0.13];
    const stitches = sdf.union(
      ...stitchY.map((y) => sdf.box([0.05, 0.012, 0.06], 0.003).at(0, y, cuffR(y))),
    );
    const bandRegion = sdf.box([0.4, 0.04, 0.4]).at(0, 0.16, 0);
    const glove = gloveShape()
      .paintFn((x, y, z, base) => {
        const g = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
        return mixRgb(base, rgb('#c07048'), 0.25 * g);
      })
      .paintWhere(bandRegion, BAND, 0.004)
      .paintWhere(stitches, STITCH, 0.002);
    k.body('leather', place(glove), {
      color: LEATHER,
      roughness: 0.7,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 4200,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 38, y * 30, z * 38, 2),
    });

    const barY = [0.07, 0.115];
    const bars = sdf.union(
      ...barY.flatMap((y) =>
        [-0.045, 0.045].map((x) => {
          const z = Math.sqrt(Math.max(0, cuffR(y) ** 2 - x * x)) + 0.004;
          return sdf.box([0.05, 0.012, 0.012], 0.004).at(x, y, z);
        }),
      ),
    );
    k.body('brass', place(bars), {
      color: BRASS,
      roughness: 0.35,
      metalness: 1,
      detail: 0.003,
      maxTriangles: 500,
    });
  },
});
