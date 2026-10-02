import { HAND_FIT, defineAsset, profile, rgb, sdf, mixRgb } from '../src/index.js';

/**
 * Crystal focus (equipment/magic-weapons/crystal-focus), matched to docs/item-mockups/crystal-focus-mock.jpg.
 * Size: 0.36 m tall, on y = 0. One idea: a pointed hexagonal purple crystal held up by three curved
 * silver claws rising from a small round silver base. Palette: silver #c0c6cc / #8e959e, crystal
 * glow #b060ff on a dark base #2a0a3a (emissive bodies need a dark base color).
 */

const SILVER = rgb('#c0c6cc');
const SILVER_DARK = rgb('#8e959e');

/** A hexagonal crystal with a pointed tip and a pointed foot, standing on its foot at the origin. */
function crystal(len: number, r: number, tip: number) {
  const hex = profile.polygon(
    Array.from({ length: 6 }, (_, i) => [r * Math.cos((i * Math.PI) / 3), r * Math.sin((i * Math.PI) / 3)] as [number, number]),
  );
  const rf = r * Math.cos(Math.PI / 6);
  let s = sdf.extrude(hex, len + tip * 2).rotateX(-90).at(0, (len + tip * 2) / 2, 0);
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    const up: [number, number, number] = [Math.cos(a) * tip, rf, Math.sin(a) * tip];
    s = s.intersect(sdf.halfSpace(up, (rf * (len + tip)) / Math.hypot(...up)));
    const down: [number, number, number] = [Math.cos(a) * tip, -rf, Math.sin(a) * tip];
    s = s.intersect(sdf.halfSpace(down, (rf * tip) / Math.hypot(...down)));
  }
  return s;
}

// The lowest point sat 3 cm below y = 0; LIFT stands the display on y = 0, and the equip
// origin moves with it so the worn fit does not change.
const LIFT = 0.03;

export default defineAsset({
  name: 'crystal-focus',
  description: 'A pointed hexagonal purple crystal held by three curved silver claws on a small round silver base.',
  detail: 0.0025,
  reference: 'docs/item-mockups/crystal-focus-mock.jpg',
  texture: { size: 512 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, frame: 'body', origin: [0, 0.03 + LIFT, 0], offset: [-0.03, -0.02, 0.03] },

  build(k) {
    const base = sdf.smoothUnion(
      0.008,
      sdf.cylinder(0.075, 0.02, 0.008).at(0, 0.01, 0),
      sdf.cone([0, 0.02, 0], [0, 0.06, 0], 0.05, 0.022),
    );
    const claws = Array.from({ length: 3 }, (_, i) => {
      const a = (i * 2 * Math.PI) / 3 + Math.PI / 6;
      const c = Math.cos(a);
      const s = Math.sin(a);
      return sdf.chain(
        [
          [c * 0.02, 0.055, s * 0.02, 0.012],
          [c * 0.06, 0.09, s * 0.06, 0.011],
          [c * 0.065, 0.15, s * 0.065, 0.009],
          [c * 0.045, 0.2, s * 0.045, 0.006],
          [c * 0.03, 0.215, s * 0.03, 0.003],
        ],
        0.01,
      );
    });
    k.body(
      'silver',
      sdf.smoothUnion(0.01, base, ...claws).paintFn((_x, y) => mixRgb(SILVER_DARK, SILVER, Math.min(1, y / 0.08))).at(0, LIFT, 0),
      { color: '#c0c6cc', roughness: 0.3, metalness: 0.9 },
    );
    k.body('crystal', crystal(0.16, 0.042, 0.06).at(0, 0.05, 0).at(0, LIFT, 0), {
      color: '#2a0a3a',
      roughness: 0.12,
      metalness: 0,
      flat: true,
      emissive: '#b060ff',
      emissiveIntensity: 1.6,
    });
  },
});
