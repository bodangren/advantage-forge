import { profile, sdf } from '../src/index.js';
import { goblinAsset } from './parts/goblin-kind.js';

/**
 * Gremlin — Chibi Quest monster (catalog `monsters/small/gremlin`), about 0.9 m tall, faces +Z.
 * Target: docs/monster-mockups/gremlin_001.jpg (made with mmx).
 *
 * The goblin warrior (`assets/goblin-warrior.ts`; head, ears, face, arms, rig, and clips from
 * `assets/parts/goblin-kind.ts`) as a gremlin, a little tinkerer: bigger ears without nicks, no
 * crest, two brown locks of hair over the temples, a green body in brown work overalls (a bib with
 * two straps and two buttons), bare feet, and a steel wrench in place of the dagger.
 * Role: a small trickster of the monster family; the huge ears, the red eyes, and the wrench read
 *   at 128 px.
 * Palette (60/30/10): olive green skin #8a9a40 with tan ear insides and feet; brown overalls
 *   #8a5634; brown hair #5a3a22; a steel wrench; red eyes as the accent.
 * Bodies added: torso (skin), overalls, buttons, feet, hair, wrench.
 */
export default goblinAsset({
  name: 'gremlin',
  description:
    'Chibi gremlin monster: a little green tinkerer with huge ears, big red eyes, two brown locks of hair, a sly smile, brown work overalls, bare feet, and a steel wrench.',
  reference: 'docs/monster-mockups/gremlin_001.jpg',
  variants: {
    eyes: { red: '#a01e18', amber: '#8f5a10', green: '#2e6a1e' },
    skin: { olive: '#8a9a40', moss: '#6b7c34', grey: '#8a9676' },
    clothing: { brown: '#8a5634', blue: '#4a6a9a', grey: '#6a6460' },
    hair: { brown: '#5a3a22', black: '#2a2020', ginger: '#8a4a22' },
  },
  presets: {
    moss: { eyes: 'amber', skin: 'moss', clothing: 'blue', hair: 'black' },
    sewer: { eyes: 'green', skin: 'grey', clothing: 'grey', hair: 'ginger' },
  },
  colors: { skinDark: '#6e7c30', earInner: '#d0ae7a', blush: '#e0a050', irisLow: '#e0503a', brow: '#4a3222' },
  earScale: 1.28,
  nicks: false,
  tuft: false,
  outfit(k, g) {
    const { HIP, ANKLE } = g.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    // The green body under the overalls.
    k.body('torso', g.torso.bone('spine'), { color: g.tint.skin, roughness: 0.55 });
    // Overalls: trousers from the waist down, a bib on the chest, and two straps over the shoulders.
    const cloth = g.torso.round(0.007);
    const trousers = sdf.smoothUnion(
      0.03,
      cloth.smoothIntersect(0.006, sdf.halfSpace([0, 1, 0], 0.3)).bone('spine'),
      sdf.ellipsoid([0.12, 0.055, 0.09]).at(0, 0.21, 0).bone('hips'),
      pair(sdf.capsule([HIP[0], 0.2, 0], [ANKLE[0] + 0.004, 0.105, 0.004], 0.064).bone('leg.L')),
    );
    const bib = cloth.smoothIntersect(
      0.006,
      sdf
        .extrude(
          profile.polygon([
            [-0.08, 0.28],
            [0.08, 0.28],
            [0.072, 0.425],
            [-0.072, 0.425],
          ]),
          0.3,
          0.008,
        )
        .at(0, 0, 0.2),
    );
    const straps = cloth
      .round(0.002)
      .smoothIntersect(0.005, pair(sdf.box([0.03, 0.3, 0.6], 0.006).rotateZ(-6).at(0.072, 0.43, 0)).intersect(sdf.halfSpace([0, -1, 0], -0.3)));
    k.body('overalls', sdf.union(trousers, bib.bone('spine'), straps.bone('chest')), { color: g.tint.clothing, roughness: 0.85 });
    const front = (x: number, y: number) => sdf.raycast(bib, [x, y, 1], [0, 0, -1])!;
    const buttons = pair(sdf.cylinder(0.014, 0.012, 0.004).rotateX(90).at(...front(0.058, 0.405)));
    k.body('buttons', buttons.bone('chest'), { color: '#2a2224', roughness: 0.4, detail: 0.003 });
    // Bare feet: a round sole with three toes, turned out a little.
    const foot = sdf
      .smoothUnion(
        0.018,
        sdf.ellipsoid([0.06, 0.05, 0.1]).at(0, 0.045, 0.025),
        ...[-0.032, 0, 0.032].map((x) => sdf.sphere(0.024).at(x, 0.026, 0.11 - Math.abs(x) * 0.4)),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(16)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('feet', pair(foot), { color: g.tone('skin', '#c4a868'), roughness: 0.6 });
  },
  weapon(k, g) {
    // A steel open-end wrench: a flat handle, an open jaw at the top, and a ring at the bottom
    // (the dagger frame: the guard at the origin, up +Y, the flat facing +Z).
    const handle = sdf.box([0.026, 0.2, 0.012], 0.005).at(0, 0, 0);
    const jaw = sdf
      .cylinder(0.036, 0.014, 0.004)
      .rotateX(90)
      .at(0, 0.12, 0)
      .subtract(sdf.box([0.03, 0.06, 0.05]).rotateZ(-15).at(0.004, 0.145, 0));
    const ring = sdf
      .cylinder(0.026, 0.014, 0.004)
      .rotateX(90)
      .at(0, -0.11, 0)
      .subtract(sdf.cylinder(0.012, 0.05).rotateX(90).at(0, -0.11, 0));
    const wrench = sdf.smoothUnion(0.008, handle, jaw, ring);
    k.body('wrench', g.held(wrench), { color: '#a8b0bc', roughness: 0.35, metalness: 0.7, bone: 'dagger', detail: 0.003 });
  },
  extra(k, g) {
    // Hair: a cap on the top and back of the head (its front edge rises toward the face), and two
    // thick locks that sweep down over the temples in front of the ears.
    const n = Math.hypot(1, 0.35);
    const cap = sdf
      .ellipsoid([0.205, 0.168, 0.205])
      .at(0, 0.7, -0.005)
      .round(0.016)
      .intersect(sdf.halfSpace([0, -1 / n, 0.35 / n], -0.735 / n));
    const lock = sdf.chain(
      [
        [0.06, 0.86, 0.08, 0.034],
        [0.14, 0.82, 0.1, 0.036],
        [0.18, 0.74, 0.09, 0.03],
        [0.175, 0.67, 0.07, 0.014],
      ],
      0.02,
    );
    const hair = sdf.smoothUnion(0.02, cap, lock.mirror('x')).bone('head');
    k.body('hair', hair, { color: k.tint('hair'), roughness: 0.75, detail: 0.004 });
    void g;
  },
});
