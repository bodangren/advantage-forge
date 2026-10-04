import { profile, sdf } from '../src/index.js';
import { serpentAsset } from './parts/serpent-kind.js';

/**
 * Sea serpent — Chibi Quest monster (catalog `monsters/beast/sea-serpent`), a friendly sea serpent
 * about 0.95 m to the top of the head, faces +Z. Target: docs/monster-mockups/sea-serpent_001.jpg
 * (made with mmx).
 *
 * The serpent of `assets/parts/serpent-kind.ts` (a spine path, belly plates, the drake head, rig, and
 * clips) as an upright curve like the number 3: a fat lower loop on the ground with a pale belly in
 * front, a waist, and a neck that carries a big drake head with a toothy grin and big eyes on top.
 * Triangle fins run along the back, two small fins stand at the chest, and the tail rises behind
 * with a three-lobed fan fin.
 * Role: a beast of the sea and the coast; the number-3 curve, the grin, and the tail fan read at
 *   128 px.
 * Palette (60/30/10): teal #5cc4c0 body and head; cream #f2efdf belly; darker teal #3aa8a8 fins as
 *   the accent with the white teeth.
 * Bodies added: back fins and chest fins (tagged to the body bones), tail fan (on the tail tip bone).
 */
type V3 = [number, number, number];

export default serpentAsset({
  name: 'sea-serpent',
  description: 'Chibi sea serpent monster: an upright teal serpent curved like the number 3, a big drake head with a toothy grin and big round eyes on top, a cream belly with plate lines, triangle fins along the back, two small chest fins, and a tail with a three-lobed fan fin; serpent rig with a jaw.',
  reference: 'docs/monster-mockups/sea-serpent_001.jpg',
  variants: {
    body: { teal: '#5cc4c0', blue: '#5a9ad8', green: '#6ab87a' },
    belly: { cream: '#f2efdf', yellow: '#f4e8b8', pearl: '#e8eef2' },
    fins: { teal: '#3aa8a8', coral: '#f08a7a', violet: '#8a6ac8' },
    eyes: { black: '#1a1a20', blue: '#2a5a9a', green: '#2a6a40' },
  },
  presets: {
    reef: { body: 'blue', belly: 'yellow', fins: 'coral', eyes: 'blue' },
    kelp: { body: 'green', belly: 'pearl', fins: 'violet', eyes: 'green' },
  },
  colors: { bellyLine: '#d6d2bc' },
  path: [
    [0, 0.46, -0.4, 0.022],
    [0, 0.32, -0.42, 0.04],
    [0, 0.17, -0.36, 0.065],
    [0, 0.1, -0.2, 0.095],
    [0, 0.115, 0.0, 0.115],
    [0, 0.16, 0.15, 0.12],
    [0, 0.29, 0.21, 0.115],
    [0, 0.42, 0.14, 0.1],
    [0, 0.52, 0.03, 0.085],
    [0, 0.63, 0.0, 0.075],
    [0, 0.72, 0.04, 0.07],
  ],
  root: 4,
  bellyFrom: 0.3,
  bellyEdge: 0.5,
  face: { style: 'drake', r: 0.19 },
  extra(k, s) {
    const fin = k.tint('fins');
    // Triangle fins along the back, tallest at the middle of the body, flat in the body plane.
    const backFins = [0.08, 0.15, 0.22, 0.29, 0.36, 0.43, 0.5, 0.57, 0.64, 0.71, 0.78, 0.85].map((t) => {
      const f = s.frame(t);
      const back: V3 = [-f.belly[0], -f.belly[1], -f.belly[2]];
      const len = Math.max(0.03, f.r * (0.6 + 0.3 * Math.sin(Math.PI * t)));
      const tilt = (Math.atan2(back[2], back[1]) * 180) / Math.PI;
      return sdf
        .cone([0, 0, 0], [0, len, -len * 0.25], f.r * 0.5, 0.004)
        .scale([0.45, 1, 1])
        .rotateX(tilt)
        .at(f.p[0] + back[0] * f.r * 0.7, f.p[1] + back[1] * f.r * 0.7, f.p[2] + back[2] * f.r * 0.7)
        .bone(f.bone);
    });
    // Two small fins at the chest, swept back and out.
    const chest = s.frame(0.74);
    const chestFin = sdf
      .ellipsoid([0.05, 0.016, 0.03])
      .rotateZ(-30)
      .rotateY(25)
      .at(chest.p[0] + chest.r * 0.95, chest.p[1] - 0.01, chest.p[2] + 0.02)
      .mirror('x')
      .bone(chest.bone);
    // A three-lobed fan at the tail tip, flat in the body plane.
    const tip = s.path[0]!;
    const lobe = (deg: number, len: number) =>
      sdf.extrude(profile.polygon([[0, 0], [0.032, len * 0.55], [0, len], [-0.032, len * 0.55]], { smooth: true }), 0.018, 0.006).rotateZ(deg);
    const fan = sdf
      .smoothUnion(0.01, lobe(-40, 0.1), lobe(0, 0.12), lobe(40, 0.1))
      .rotateY(90)
      .rotateX(-20)
      .at(tip[0], tip[1] - 0.03, tip[2])
      .bone(s.boneAt[1]!);
    k.body('fins', sdf.union(...backFins, chestFin, fan), { color: fin, roughness: 0.55, detail: 0.004 });
  },
});
