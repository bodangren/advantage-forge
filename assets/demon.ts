import { sdf } from '../src/index.js';
import { impAsset } from './parts/imp-kind.js';

/**
 * Demon — Chibi Quest monster (catalog `monsters/abyssal-and-cosmic/demon`), a chunky devil brute
 * about 0.75 m to the horn tips, faces +Z. Target: docs/monster-mockups/demon_001.jpg (made with
 * mmx from the imp mockup).
 *
 * The imp of `assets/parts/imp-kind.ts` (head, face, body, bat wings, rig, and clips) built heavy:
 * a thicker body and limbs (bulk 1.35), short black horns with a small third horn on the brow,
 * dark wings, and dark stone armbands and a belt.
 * Role: a tough melee demon of the abyss; the bulk, the dark wings, and the armbands set it apart
 *   from the imp at 128 px.
 * The mockup's bracers sit on the upper arms here: bands on the forearms count as held items, and
 *   the shared death clip swings the forearms past the head.
 * Palette (60/30/10): dark crimson skin #a8282a; near-black horns, wings, and claws; dark grey
 *   stone armbands and belt #3e3a3c; yellow eyes as the accent.
 */

export default impAsset({
  name: 'demon',
  description: 'Chibi demon monster: a chunky dark crimson devil brute with thick arms, short black horns and a small brow horn, dark bat wings, yellow eyes, a fanged grin, black claws, and dark stone armbands and belt.',
  reference: 'docs/monster-mockups/demon_001.jpg',
  variants: {
    skin: { crimson: '#a8282a', maroon: '#7a2030', rust: '#a8482a' },
    wings: { night: '#3a2026', blood: '#6a1a22', smoke: '#4a4448' },
    eyes: { yellow: '#f0d030', orange: '#ff8a1a', green: '#9ad02a' },
    horns: { black: '#1e1618', bone: '#8a8074', iron: '#4a4a52' },
  },
  presets: {
    maroon: { skin: 'maroon', wings: 'blood', eyes: 'orange', horns: 'bone' },
    rust: { skin: 'rust', wings: 'smoke', eyes: 'green', horns: 'iron' },
  },
  colors: { skinDark: '#781a1e', belly: '#c04a40', brow: '#3a0e10', irisDark: '#a87a10', vein: '#2a141a' },
  bulk: 1.35,
  crest: false,
  wingScale: 1.05,
  hornRings: false,
  horns: [
    [
      [0.07, 0.6, 0.0, 0.034],
      [0.115, 0.645, -0.012, 0.028],
      [0.13, 0.695, 0.012, 0.018],
      [0.112, 0.725, 0.04, 0.006],
    ],
    [
      [0.0, 0.61, 0.1, 0.02],
      [0.0, 0.645, 0.115, 0.012],
      [0.0, 0.665, 0.13, 0.003],
    ],
  ],
  extra(k, imp) {
    const { SHOULDER, ELBOW } = imp.joints;
    // Stone armbands on the upper arms, skinned to them. (Bands on the forearms count as held
    // items, and the tumble of the death clip swings the forearms past the head.)
    const along = (t: number): [number, number, number] => [SHOULDER[0] + (ELBOW[0] - SHOULDER[0]) * t, SHOULDER[1] + (ELBOW[1] - SHOULDER[1]) * t, SHOULDER[2] + (ELBOW[2] - SHOULDER[2]) * t];
    const dir = [ELBOW[0] - SHOULDER[0], ELBOW[1] - SHOULDER[1], ELBOW[2] - SHOULDER[2]];
    const len = Math.hypot(dir[0]!, dir[1]!, dir[2]!);
    const tilt = (Math.acos(dir[1]! / len) * 180) / Math.PI;
    const yaw = (Math.atan2(dir[0]!, dir[2]!) * 180) / Math.PI;
    const band = sdf.cylinder(0.054, len * 0.45, 0.008).rotateX(tilt).rotateY(yaw).at(...along(0.55));
    k.body('armbands', band.bone('upperarm.L').mirror('x'), { color: '#3e3a3c', roughness: 0.85, detail: 0.004 });
    // A belt: a band around the waist, with a round buckle.
    const waist = sdf.ellipsoid([0.085 * 1.35, 0.07 * 1.35, 0.075 * 1.35]).at(0, 0.27, 0.015);
    const belt = waist.round(0.008).intersect(sdf.box([0.5, 0.036, 0.5]).at(0, 0.235, 0));
    const buckle = sdf.cylinder(0.022, 0.012, 0.004).rotateX(90).at(0, 0.235, 0.015 + 0.075 * 1.35 * Math.sqrt(1 - (0.035 / (0.07 * 1.35)) ** 2) + 0.004);
    k.body('belt', sdf.union(belt, buckle.paint('#8a8478')), { color: '#3e3a3c', roughness: 0.8, bone: 'spine', detail: 0.004 });
  },
});
