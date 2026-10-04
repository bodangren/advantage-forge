import { profile, sdf } from '../src/index.js';
import { spiderAsset } from './parts/spider-kind.js';

/**
 * Giant spider queen — Chibi Quest monster (catalog `monsters/giant-and-ancient/giant-spider-queen`),
 * about 0.6 m to the crown and 0.95 m across the legs, faces +Z. Target:
 * docs/monster-mockups/giant-spider-queen_001.jpg (made with mmx from the giant spider mockup).
 *
 * The giant spider (`assets/giant-spider.ts`; body, legs, fangs, rig, and clips from
 * `assets/parts/spider-kind.ts`) as the queen of the nest: a violet spider with a calm, cute face
 * (two glossy black eyes with glowing ember pupils, white cheek dots, and a small smile), two
 * round palps on the head like ears, near-black leg bands, an orange chest disc with a violet
 * trident, and a lumpy gold crown with blue gems.
 * Role: the boss of the spider family (a cave or forest lair); the crown and the violet body read
 *   at 128 px, also from above.
 * Palette (60/30/10): violet #8a5ad8 (darker underside); near-black bands and claw tips #2a2030;
 *   an orange chest disc #f08a2a; a gold crown #f0cc58 with blue gems #2a5ad8; ember pupils as
 *   the accent.
 * Bodies added: eyes, eye-glow, palps, crown, gems (all rigid on the head).
 */

const EYE_X = 0.098;
const EYE_Y = 0.35;
const GEM = '#2a5ad8';

// The chest mark: an orange disc with a violet trident cut out of it.
const trident = sdf.union(
  sdf.extrude(profile.rect([0.02, 0.085], 0.004), 0.5).at(0, -0.012, 0),
  sdf.extrude(profile.rect([0.058, 0.018], 0.006), 0.5).at(0, -0.052, 0),
  sdf.extrude(profile.rect([0.017, 0.05], 0.006), 0.5).rotateZ(-28).at(0.03, 0.03, 0),
  sdf.extrude(profile.rect([0.017, 0.05], 0.006), 0.5).rotateZ(28).at(-0.03, 0.03, 0),
  sdf.extrude(profile.rect([0.017, 0.042], 0.006), 0.5).at(0, 0.04, 0),
);
const chestMark = sdf.extrude(profile.circle(0.09), 0.5).subtract(trident);

export default spiderAsset({
  name: 'giant-spider-queen',
  description:
    'Chibi giant spider queen monster: a violet spider with a cute face (glossy black eyes with glowing ember pupils, a small smile), round palps like ears, a lumpy gold crown with blue gems, near-black banded legs, and an orange chest disc with a trident.',
  reference: 'docs/monster-mockups/giant-spider-queen_001.jpg',
  // Color slots for individual queens (the first option is the default look).
  variants: {
    body: { violet: '#8a5ad8', plum: '#8a4a9a', midnight: '#4a4a9a' },
    markings: { orange: '#f08a2a', gold: '#e8b030', rose: '#e05a7a' },
    eyes: { ember: '#ff8a1a', red: '#ff3a2a', gold: '#ffd040' },
    crown: { gold: '#f0cc58', silver: '#d0d4e0', rose: '#e8a890' },
  },
  presets: {
    midnight: { body: 'midnight', markings: 'gold', eyes: 'gold', crown: 'silver' },
    plum: { body: 'plum', markings: 'rose', eyes: 'red', crown: 'rose' },
  },
  colors: { bodyDark: '#5e3a9a', claw: '#2a2030', fang: '#e8dcf0' },
  bands: 'dark',
  fangScale: 0.55,
  chestMark,
  face: {
    build(k, s) {
      // Two glossy black eyes set into the face, and a glowing ember pupil in each.
      const hit = s.faceHit(EYE_X, EYE_Y);
      const eye = sdf.ellipsoid([0.037, 0.042, 0.026]).at(hit[0], hit[1], hit[2] - 0.01);
      k.body('eyes', s.headPose(eye.mirror('x')), { color: '#141018', roughness: 0.08, bone: 'head', detail: 0.003 });
      const pupil = sdf.sphere(0.016).at(hit[0] - 0.002, hit[1] - 0.002, hit[2] + 0.005);
      k.body('eye-glow', s.headPose(pupil.mirror('x')), { color: s.tint.eye, emissive: s.tint.eye, emissiveIntensity: 1.5, roughness: 0.3, bone: 'head', detail: 0.0025 });
    },
    paint(carapace, s) {
      // A small smile, and a white dot on each cheek, under the outer corner of the eye.
      const mouth = s.faceHit(0, 0.3);
      const smile = sdf.extrude(profile.arc(0.032, 0.009, 205, 335), 0.16).at(0, 0.326, mouth[2]);
      const cheek = s.faceHit(0.142, 0.302);
      const dots = sdf.sphere(0.011).at(...cheek).mirror('x');
      return carapace.paintWhere(s.headPose(smile), s.tone('body', '#1e1426'), 0.002).paintWhere(s.headPose(dots), '#fbf8f2', 0.002);
    },
  },
  extra(k, s) {
    // Two round palps on the top corners of the head, like the ears in the mockup.
    const palps = sdf.ellipsoid([0.05, 0.056, 0.042]).rotateZ(-20).at(0.17, 0.495, 0.13).mirror('x');
    k.body('palps', s.headPose(palps), { color: s.tint.body, roughness: 0.8, bone: 'head' });

    // The crown: a gold cap on the top of the head with a ring of round lobes along its rim and
    // three lumps on top, as the lumpy clay crown in the mockup; blue gems sit in the front lobes.
    const C: readonly [number, number, number] = [0, 0.37, 0.14]; // the upright head center
    const RIM_Y = 0.5;
    const rim = (deg: number, out: number) => {
      const a = (deg * Math.PI) / 180;
      const d: [number, number, number] = [Math.sin(a), 0, Math.cos(a)];
      const p = sdf.raycast(s.headUp, [C[0] + d[0], RIM_Y, C[2] + d[2]], [-d[0], 0, -d[2]])!;
      return [p[0] + d[0] * out, p[1], p[2] + d[2] * out] as const;
    };
    const cap = s.headUp.round(0.014).intersect(sdf.halfSpace([0, -1, 0], -(RIM_Y - 0.01)));
    const lobes = [...Array(10)].map((_, i) => {
      const p = rim(i * 36, 0.004);
      return sdf.sphere(0.03).at(p[0], p[1] + 0.03, p[2]);
    });
    const lumps = [
      sdf.sphere(0.034).at(0, 0.562, 0.17),
      sdf.sphere(0.03).at(0.06, 0.556, 0.12),
      sdf.sphere(0.03).at(-0.06, 0.556, 0.12),
      sdf.sphere(0.028).at(0, 0.552, 0.07),
    ];
    const crown = sdf.smoothUnion(0.012, cap, ...lobes, ...lumps);
    k.body('crown', s.headPose(crown), { color: k.tint('crown'), roughness: 0.42, metalness: 0.35, bone: 'head', detail: 0.004 });
    const gems = sdf.union(
      ...[-36, 0, 36].map((deg) => {
        const p = rim(deg, 0.026);
        const a = (deg * Math.PI) / 180;
        const g: [number, number, number] = [p[0] + Math.sin(a) * 0.006, p[1] + 0.03, p[2] + Math.cos(a) * 0.006];
        return sdf.sphere(0.02).at(...g).paintWhere(sdf.sphere(0.0155).at(g[0] + Math.sin(a) * 0.012, g[1], g[2] + Math.cos(a) * 0.012), GEM, 0.002);
      }),
    );
    k.body('gems', s.headPose(gems), { color: '#1e2440', roughness: 0.15, bone: 'head', detail: 0.003 });
  },
});
