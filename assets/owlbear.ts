import { sdf } from '../src/index.js';
import { goblinAsset } from './parts/goblin-kind.js';

/**
 * Owlbear — Chibi Quest monster (catalog `monsters/beast/owlbear`), a round owl-bear about 0.95 m
 * tall, faces +Z. Target: docs/monster-mockups/owlbear_001.jpg (made with mmx from the giant boar
 * mockup).
 *
 * The goblin warrior (`assets/goblin-warrior.ts`; head, arms, rig, and clips from
 * `assets/parts/goblin-kind.ts`) as an owl-headed bear: no goblin ears, face, or clothes; brown fur
 * with a pear-shaped body and a tan belly; a raised cream facial disc with two big orange eyes and a
 * short hooked yellow beak; round bear ears; a white feather ruff at the neck; thick feathered wing
 * arms with black claws; and black talons.
 * Role: a forest brute that swipes with its wings; the round bear ears on the owl face and the white
 *   ruff read at 128 px.
 * The right wing is raised in front of the body at rest: it follows the goblin's dagger arm, so the
 *   attack clip swipes with it.
 * Palette (60/30/10): brown fur #7a4a2e (darker wings and ears); cream face disc #f2e6c8, a tan belly,
 *   and a white ruff; orange eyes #ee7a2a and a yellow beak as the accent; black pupils and claws.
 * Bodies: fur (body and legs), wings, face-disc, eyes, beak, ears, ruff, talons.
 */

type V3 = [number, number, number];

export default goblinAsset({
  name: 'owlbear',
  description: 'Chibi owlbear monster: a round brown bear body with an owl head: a cream facial disc, big orange eyes, a hooked yellow beak, round bear ears, a white feather ruff, feathered wing arms with black claws, and black talons.',
  reference: 'docs/monster-mockups/owlbear_001.jpg',
  variants: {
    skin: { brown: '#7a4a2e', grey: '#6a6460', snowy: '#d8d2c8' },
    clothing: { cream: '#f2e6c8', white: '#f8f6f0', sand: '#e8cc98' },
    eyes: { orange: '#ee7a2a', yellow: '#f2c020', red: '#d8402a' },
  },
  presets: {
    grey: { skin: 'grey', clothing: 'white', eyes: 'yellow' },
    snowy: { skin: 'snowy', clothing: 'sand', eyes: 'red' },
  },
  colors: { skinDark: '#5a321e', earInner: '#4a2818' },
  ears: false,
  face: false,
  tuft: false,
  outfit(k, g) {
    const { HIP, KNEE, ANKLE } = g.joints;
    // A pear-shaped body: wide at the belly, tagged hips, spine, and chest from the bottom up.
    const body = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid([0.16, 0.1, 0.14]).at(0, 0.21, 0).bone('hips'),
      sdf.ellipsoid([0.175, 0.14, 0.155]).at(0, 0.3, 0.01).bone('spine'),
      sdf.ellipsoid([0.15, 0.1, 0.13]).at(0, 0.42, 0).bone('chest'),
    );
    const leg = sdf.smoothUnion(0.02, sdf.cone(HIP, KNEE, 0.06, 0.054).bone('leg.L'), sdf.cone(KNEE, [ANKLE[0], 0.05, ANKLE[2] + 0.01], 0.054, 0.05).bone('shin.L'));
    const fur = sdf
      .smoothUnion(0.03, body, leg.mirror('x'))
      .paintWhere(sdf.ellipsoid([0.11, 0.14, 0.12]).at(0, 0.29, 0.13), g.tone('clothing', '#d8a468'), 0.02);
    k.body('fur', fur, { color: g.tint.skin, roughness: 0.75 });

    // Black talons: three forward and one back on each foot.
    const talon = (dx: number, dz: number) => sdf.cone([ANKLE[0] + dx, 0.03, 0.02 + dz * 0.5], [ANKLE[0] + dx * 1.4, 0.012, dz], 0.022, 0.008);
    const talons = sdf.union(talon(-0.035, 0.085), talon(0, 0.1), talon(0.035, 0.085), talon(0, -0.065)).bone('foot.L');
    k.body('talons', talons.mirror('x'), { color: '#1e1a1c', roughness: 0.3, detail: 0.003 });

    // The white ruff: a ring of feather petals at the neck, tilted out and down.
    const petals = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * 360;
      const front = Math.cos((a * Math.PI) / 180);
      return sdf
        .ellipsoid([0.05, 0.065, 0.024])
        .at(0, -0.035, 0)
        .rotateX(-35 - 10 * front)
        .at(0, 0, 0.125 + 0.02 * front)
        .rotateY(a)
        .at(0, 0.53, 0.0);
    });
    k.body('ruff', sdf.smoothUnion(0.012, ...petals).bone('chest'), { color: g.tone('clothing', '#faf8f2'), roughness: 0.8 });
  },
  weapon() {
    // No held item: the owlbear swipes with its wings.
  },
  extra(k, g) {
    const { SHOULDER, ELBOW, WRIST, ELBOW_R, WRIST_R } = g.joints;
    const faceAt = (x: number, y: number): V3 => [x, y, g.faceZ(Math.abs(x), y)];
    // Wings: thick feathered arms over the goblin's thin arms and fists, with a fan of feather tips
    // and three black claws at the end.
    const wing = (sh: V3, el: V3, wr: V3, side: 'L' | 'R') => {
      const d: V3 = [wr[0] - el[0], wr[1] - el[1], wr[2] - el[2]];
      const tip: V3 = [wr[0] + d[0] * 0.9, wr[1] + d[1] * 0.9 - 0.035, wr[2] + d[2] * 0.9];
      return {
        fur: sdf.smoothUnion(
          0.03,
          sdf.chain([[...sh, 0.075], [...el, 0.072]], 0.02).bone(`upperarm.${side}`),
          sdf.chain([[...el, 0.072], [...wr, 0.068], [...tip, 0.05]], 0.02).bone(`forearm.${side}`),
        ),
        claws: sdf
          .union(...[-0.025, 0, 0.025].map((dz) => sdf.cone([tip[0], tip[1] - 0.025, tip[2] + dz], [tip[0], tip[1] - 0.065, tip[2] + dz * 1.4 + 0.012], 0.014, 0.003)))
          .bone(`hand.${side}`),
      };
    };
    const wl = wing(SHOULDER as V3, ELBOW as V3, WRIST as V3, 'L');
    const wr = wing([-SHOULDER[0], SHOULDER[1], SHOULDER[2]], ELBOW_R as V3, WRIST_R as V3, 'R');
    k.body('wings', sdf.union(wl.fur, wr.fur), { color: g.tint.skinDark, roughness: 0.75 });
    k.body('claws', sdf.union(wl.claws, wr.claws), { color: '#1e1a1c', roughness: 0.3, detail: 0.003 });

    // The facial disc: a raised cream mask over the front of the face, two rings joined above the beak.
    const EYE_X = 0.088;
    const EYE_Y = 0.69;
    const mask = sdf.union(sdf.cylinder(0.098, 0.6).rotateX(90).at(EYE_X, EYE_Y, 0), sdf.cylinder(0.098, 0.6).rotateX(90).at(-EYE_X, EYE_Y, 0), sdf.box([0.1, 0.12, 0.6]).at(0, 0.66, 0));
    const disc = g.head.round(0.008).intersect(mask).intersect(sdf.halfSpace([0, 0, -1], -0.08));
    k.body('face-disc', disc.bone('head'), { color: g.tint.clothing, roughness: 0.7, textureDensity: 1.5, detail: 0.004 });
    // Big round eyes: orange balls with black pupils, half sunk in the disc.
    const eye = (x: number) => {
      const p = faceAt(x, EYE_Y);
      const c: V3 = [p[0], p[1], p[2] - 0.018];
      return sdf
        .sphere(0.056)
        .at(...c)
        .paintWhere(sdf.sphere(0.036).at(c[0] - x * 0.06, c[1], c[2] + 0.05), '#141012', 0.003)
        .paintWhere(sdf.sphere(0.011).at(c[0] - x * 0.06 + 0.014, c[1] + 0.016, c[2] + 0.058), '#ffffff', 0.002);
    };
    k.body('eyes', sdf.union(eye(EYE_X), eye(-EYE_X)).bone('head'), { color: k.tint('eyes'), roughness: 0.2, textureDensity: 2, detail: 0.003 });
    // A short hooked beak between the eyes.
    const b = faceAt(0, 0.645);
    const beak = sdf.chain(
      [
        [0, b[1] + 0.015, b[2] - 0.005, 0.034],
        [0, b[1] - 0.012, b[2] + 0.028, 0.026],
        [0, b[1] - 0.045, b[2] + 0.036, 0.013],
        [0, b[1] - 0.06, b[2] + 0.024, 0.004],
      ],
      0.01,
    );
    k.body('beak', beak.scale([1.15, 1, 1]).bone('head'), { color: '#f2c030', roughness: 0.35, detail: 0.003 });
    // Round bear ears on the top corners of the head.
    const root = sdf.surfacePoint(g.head, [0.16, 0.86, -0.02], -0.02);
    const ear = sdf
      .sphere(0.06)
      .scale([1, 1, 0.5])
      .paintWhere(sdf.sphere(0.042).scale([1, 1, 0.4]).at(0.004, 0.008, 0.024), g.tint.earInner, 0.006)
      .rotateZ(-30)
      .at(root[0], root[1] + 0.025, root[2]);
    k.body('ears', ear.mirror('x').bone('head'), { color: g.tint.skin, roughness: 0.75 });
  },
});
