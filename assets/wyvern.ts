import { sdf } from '../src/index.js';
import { dragonAsset } from './parts/dragon-kind.js';

/**
 * Wyvern — Chibi Quest monster (catalog `monsters/beast/wyvern`), a young two-legged dragon whose
 * wings are its arms, about 0.95 m to the horns, faces +Z. Target: docs/monster-mockups/wyvern_001.jpg
 * (made with mmx from the drake mockup).
 *
 * The fire dragon (`assets/dragon-fire.ts`; body, head, wings, rig, and clips from
 * `assets/parts/dragon-kind.ts`) as a friendly wyvern: no arms, smaller olive wings at the back, a
 * green body with a cream belly, two short ridged horns, big round ear fins on the sides of the
 * head, a friendly face (no brows, no glaring lids), and an orange leaf fin at the tail tip. The
 * attack breathes a puff of green-gold fire.
 * Role: a sky beast of the cliffs and the hills, smaller than a dragon; the ear fins and the wings
 *   read at 128 px.
 * * Palette (60/30/10): green #6cc05a scales and ear fins; cream #f2ecc0 belly; olive #4f8a3e wings;
 *   an orange #f0a040 tail fin as the accent.
 * Bodies added: ear fins (rigid on the head).
 */
export default dragonAsset({
  name: 'wyvern',
  description: 'Chibi wyvern monster: a young green two-legged dragon with no arms, small olive bat wings, a cream belly, two short ridged horns, big round ear fins, big friendly eyes, a toothy smile, and an orange leaf fin at the tail tip; dragon rig with wings.',
  reference: 'docs/monster-mockups/wyvern_001.jpg',
  variants: {
    scales: { green: '#6cc05a', teal: '#4ab0a0', blue: '#5a8ad0' },
    belly: { cream: '#f2ecc0', pale: '#eef2e4', peach: '#f4d4b0' },
    eyes: { brown: '#3a2a20', blue: '#2a4a7a', green: '#2a5a30' },
  },
  presets: {
    lagoon: { scales: 'teal', belly: 'pale', eyes: 'blue' },
    sky: { scales: 'blue', belly: 'peach', eyes: 'green' },
  },
  palette: {
    redDark: '#4a9a40',
    creamLine: '#d4cc98',
    eyeLow: '#1e1612',
    orange: '#f0a040',
    horn: '#8a9a50',
    hornBase: '#6a7a3e',
    claw: '#f2ecd0',
    fireCore: '#fbffd0',
    fire: '#c8e85a',
    fireTip: '#e8a030',
  },
  looks: {
    wings: { color: '#4f8a3e' },
  },
  arms: false,
  wingScale: 0.95,
  friendly: true,
  headCrest: false,
  horn: [
    [0.08, 0.8, -0.04, 0.036],
    [0.095, 0.86, -0.07, 0.028],
    [0.1, 0.91, -0.1, 0.016],
    [0.1, 0.935, -0.12, 0.006],
  ],
  hornBaseBelow: 0.82,
  extra(k, d) {
    // Big round ear fins on the sides of the head at eye height, turned out and a little up, with
    // three ribs that fan out from the root.
    const root = d.faceHit(0.17, 0.72);
    const finPose = (s: sdf.Shape) => s.rotateY(-25).rotateZ(-18).at(root[0] + 0.06, root[1] + 0.02, root[2] - 0.07);
    const fin = finPose(sdf.ellipsoid([0.1, 0.08, 0.016]).at(0.07, 0, 0));
    const ribs = finPose(sdf.union(...[-32, 0, 32].map((deg) => sdf.capsule([0, 0, 0.004], [0.14, 0, 0.004], 0.007).rotateZ(deg))));
    k.body('ear-fins', sdf.smoothUnion(0.006, fin, ribs.paint(k.tint('scales', -0.15))).mirror('x').bone('head'), { color: k.tint('scales', 0.08), roughness: 0.6, detail: 0.004 });
  },
});
