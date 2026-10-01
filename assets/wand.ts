import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Crystal wand (equipment/weapons/wand), matched to docs/item-mockups/wand-mock.jpg.
 * Size: 0.36 m tall, standing on its butt. One idea: a gnarled, spiral-grooved wooden shaft
 * holding a gold cup with a glowing mint crystal cluster. Palette: wood #7a4a2e / groove
 * #4f2e1a, gold #d4a93a, crystal glow #5cf5d0 on a dark teal base #0c2624 (emissive bodies
 * need a dark base color). Materials: wood (0.7), gold (0.3, metal 1), crystal (0.1, flat).
 */

const WOOD = rgb('#7a4a2e');
const GROOVE = rgb('#4f2e1a');
const CUP_Y = 0.25; // bottom of the crystal cup

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

/** A hexagonal crystal with a pointed tip, centered on its base at the origin, along +Y. */
function crystal(len: number, r: number, tip: number) {
  const hex = profile.polygon(
    Array.from({ length: 6 }, (_, i) => [r * Math.cos((i * Math.PI) / 3), r * Math.sin((i * Math.PI) / 3)] as [number, number]),
  );
  const top = len + tip;
  const rf = r * Math.cos(Math.PI / 6);
  let s = sdf.extrude(hex, len + tip * 2).rotateX(-90).at(0, (len + tip * 2) / 2 - tip, 0);
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    const n: [number, number, number] = [Math.cos(a) * tip, rf, Math.sin(a) * tip];
    s = s.intersect(sdf.halfSpace(n, (rf * top) / Math.hypot(...n)));
  }
  return s.intersect(sdf.halfSpace([0, -1, 0], tip * 0.5));
}

export default defineAsset({
  name: 'wand',
  description: 'A crystal wand: a gnarled spiral-grooved wooden shaft with a gold cup holding a glowing mint crystal cluster.',
  detail: 0.0025,
  reference: 'docs/item-mockups/wand-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.1, 0] },

  build(k) {
    // Shaft: a gently wandering chain with a spiral groove.
    const shaft = sdf
      .chain(
        [
          [0, 0.012, 0, 0.014],
          [0.006, 0.07, 0.003, 0.0135],
          [-0.005, 0.13, -0.002, 0.013],
          [0.004, 0.19, 0.003, 0.0125],
          [0, CUP_Y + 0.005, 0, 0.012],
        ],
        0.01,
      )
      .displace(0.0022, (x, y, z) => Math.pow(0.5 + 0.5 * Math.cos(Math.atan2(z, x) + y * 55), 4));
    k.body(
      'shaft',
      shaft
        .intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([0.2, 1, 0.2]).at(0, 0.4, 0)))
        .paintFn((x, y, z) => {
          const g = Math.pow(0.5 + 0.5 * Math.cos(Math.atan2(z, x) + y * 55), 4);
          const n = 0.5 + 0.5 * noise.fbm(x * 80, y * 20, z * 80, 2);
          return mixRgb(mixRgb(WOOD, GROOVE, 0.2 * n), GROOVE, 0.8 * g);
        }),
      { color: '#7a4a2e', roughness: 0.7, metalness: 0 },
    );

    // Gold cup and a small butt cap.
    const cup = sdf.revolve(
      profile.polygon(
        [
          [0, CUP_Y - 0.012],
          [0.013, CUP_Y - 0.012],
          [0.016, CUP_Y + 0.004],
          [0.025, CUP_Y + 0.02],
          [0.029, CUP_Y + 0.03],
          [0.026, CUP_Y + 0.034],
          [0, CUP_Y + 0.026],
        ],
        { smooth: true },
      ),
    );
    const cap = sdf.cylinder(0.0145, 0.012, 0.003).at(0, 0.006, 0);
    k.body('gold', sdf.union(cup, cap), { color: '#d4a93a', roughness: 0.3, metalness: 1 });

    // Crystal cluster: one tall center crystal and four smaller ones leaning out.
    const base = CUP_Y + 0.018;
    const parts = [crystal(0.055, 0.016, 0.022).at(0, base, 0)];
    for (let i = 0; i < 4; i++) {
      const a = 45 + i * 90;
      const len = 0.026 + 0.008 * (i % 2);
      parts.push(
        crystal(len, 0.01, 0.013)
          .rotateZ(-26)
          .rotateY(a)
          .at(Math.cos((a * Math.PI) / 180) * 0.009, base, -Math.sin((a * Math.PI) / 180) * 0.009),
      );
    }
    k.body(
      'crystal',
      sdf.union(...parts).paintFn((_x, y) => mixRgb(rgb('#0c2624'), rgb('#123a36'), clamp((y - base) / 0.07))),
      { color: '#0c2624', roughness: 0.1, metalness: 0, flat: true, emissive: '#5cf5d0', emissiveIntensity: 1.8, detail: 0.002 },
    );
  },
});
