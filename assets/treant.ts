import { noise, profile, sdf } from '../src/index.js';
import type { Rgb } from '../src/sdf/color.js';
import { goblinAsset } from './parts/goblin-kind.js';

/**
 * Treant — Chibi Quest monster (catalog `monsters/fey-and-spirit/treant`), a young walking tree about
 * 1.05 m tall to the top of its leaves, faces +Z. Target: docs/monster-mockups/treant_001.jpg (made
 * with mmx from the forest spirit mockup).
 *
 * The goblin warrior (`assets/goblin-warrior.ts`; head, arms, rig, and clips from
 * `assets/parts/goblin-kind.ts`) as a sapling treant, built like the mushroom creature: no goblin
 * ears, face, or clothes; bark skin; a wide bark trunk that makes one round shape with the head, with
 * a dark hollow in the belly; short root legs with root toes; a raised bark mask around two sleepy
 * eyes; a small smile; and four big round leaves on top of the head.
 * Role: a forest guardian (friend or foe) that waddles and slaps; the leaves on top and the belly
 *   hollow read at 128 px.
 * Palette (60/30/10): bark #a87a58 skin and trunk; dark brown grooves and hollow; green #8ac84a
 *   leaves as the accent.
 * Bodies: trunk (body and legs), mask, eyes, lids, smile, leaves.
 */

type V3 = [number, number, number];

export default goblinAsset({
  name: 'treant',
  description: 'Chibi treant monster: a young walking tree with a round bark body and head, a dark hollow in the belly, short root legs, a raised bark mask around two sleepy eyes, a small smile, and four big round green leaves on top of its head.',
  reference: 'docs/monster-mockups/treant_001.jpg',
  variants: {
    skin: { bark: '#a87a58', oak: '#8a6040', birch: '#d8c8b0' },
    clothing: { bark: '#9e7050', oak: '#7e5638', birch: '#cbbaa2' },
    eyes: { brown: '#5a3418', green: '#3a6a2a', amber: '#a86a1a' },
    leaves: { green: '#8ac84a', autumn: '#e8963a', blossom: '#f0a8c4' },
  },
  presets: {
    oak: { skin: 'oak', clothing: 'oak', eyes: 'green', leaves: 'autumn' },
    birch: { skin: 'birch', clothing: 'birch', eyes: 'amber', leaves: 'blossom' },
  },
  colors: { skinDark: '#7a5236', earInner: '#7a5236' },
  ears: false,
  face: false,
  tuft: false,
  outfit(k, g) {
    const { HIP, KNEE, ANKLE } = g.joints;
    // The trunk: a wide bell from the neck to the ground line, tagged chest, spine, and hips.
    const bell = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.62],
            [0.16, 0.6],
            [0.205, 0.52],
            [0.232, 0.38],
            [0.222, 0.26],
            [0.19, 0.16],
            [0.12, 0.12],
            [0, 0.12],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.95]);
    // The hollow: a tall dark hole in the belly.
    const front = sdf.raycast(bell, [0, 0.32, 2], [0, 0, -1])!;
    const hollow = sdf.ellipsoid([0.07, 0.095, 0.09]).at(0, 0.32, front[2] + 0.03);
    const trunk = sdf.union(
      bell.intersect(sdf.halfSpace([0, -1, 0], -0.42)).bone('chest'),
      bell.intersect(sdf.box([0.6, 0.14, 0.6]).at(0, 0.35, 0)).bone('spine'),
      bell.intersect(sdf.halfSpace([0, 1, 0], 0.28)).bone('hips'),
    );
    // Short root legs with three root toes that spread on the ground.
    const toes = sdf.union(
      ...[-40, 0, 40].map((deg) => {
        const a = (deg * Math.PI) / 180;
        return sdf.cone([ANKLE[0], 0.035, ANKLE[2]], [ANKLE[0] + Math.sin(a) * 0.08, 0.014, ANKLE[2] + 0.02 + Math.cos(a) * 0.07], 0.03, 0.014);
      }),
    );
    const leg = sdf.smoothUnion(
      0.02,
      sdf.cone(HIP, KNEE, 0.052, 0.046).bone('leg.L'),
      sdf.cone(KNEE, ANKLE, 0.046, 0.042).bone('shin.L'),
      sdf.smoothUnion(0.02, sdf.ellipsoid([0.05, 0.034, 0.055]).at(ANKLE[0], 0.034, ANKLE[2]), toes).bone('foot.L'),
    );
    // Bark: dark vertical grooves that wander a little, and the dark inside of the hollow.
    const dark = g.tone('clothing', '#6a4630');
    const bark = (x: number, y: number, z: number, c: Rgb): Rgb => {
      const a = Math.atan2(x, z) * 7 + noise.fbm(x * 9, y * 4, z * 9, 2) * 2;
      return Math.sin(a * 2.2) > 0.82 ? [c[0] * 0.72, c[1] * 0.72, c[2] * 0.72] : c;
    };
    const body = sdf.smoothUnion(0.02, trunk, leg.mirror('x')).smoothSubtract(0.012, hollow).paintFn(bark).paintWhere(hollow.round(0.012), dark, 0.006);
    k.body('trunk', body, { color: g.tint.clothing, roughness: 0.85, bump: (x, y, z) => 0.0012 * noise.fbm(x * 40, y * 12, z * 40, 3) });
  },
  weapon() {
    // No held item: it slaps with its twig hands.
  },
  extra(k, g) {
    const at = (x: number, y: number, dz = 0): V3 => [x, y, g.faceZ(Math.abs(x), y) + dz];
    const EYE_X = 0.085;
    const EYE_Y = 0.665;
    const barkDark = g.tone('skin', '#7a5236');
    // A raised bark mask: a rounded frame around each eye, joined over the nose.
    const frame = (x: number) => {
      const c = at(x, EYE_Y, -0.02);
      const outer = sdf.box([0.1, 0.075, 0.07], 0.03).at(...c);
      const inner = sdf.box([0.066, 0.046, 0.12], 0.02).at(c[0], c[1] - 0.002, c[2]);
      return outer.subtract(inner);
    };
    const bridge = sdf.capsule(at(-0.03, EYE_Y + 0.02, -0.012), at(0.03, EYE_Y + 0.02, -0.012), 0.014);
    const mask = sdf.union(frame(EYE_X), frame(-EYE_X), bridge).intersect(g.head.round(0.016));
    k.body('mask', mask.bone('head'), { color: g.tint.skin, roughness: 0.85, detail: 0.004 });
    // Sleepy eyes: a white ball with a slot-colored iris, a dark pupil, and a shine, under a heavy lid.
    const eye = (x: number) => {
      const c = at(x, EYE_Y - 0.004, -0.018);
      return sdf
        .sphere(0.03)
        .at(...c)
        .paintWhere(sdf.sphere(0.021).at(c[0], c[1] - 0.004, c[2] + 0.018), k.tint('eyes'), 0.002)
        .paintWhere(sdf.sphere(0.011).at(c[0], c[1] - 0.004, c[2] + 0.026), '#1a1210', 0.001)
        .paintWhere(sdf.sphere(0.006).at(c[0] + 0.008, c[1] + 0.004, c[2] + 0.028), '#ffffff', 0.001);
    };
    k.body('eyes', sdf.union(eye(EYE_X), eye(-EYE_X)).bone('head'), { color: '#f6f0e4', roughness: 0.15, textureDensity: 2, detail: 0.003 });
    const lid = (x: number) => {
      const c = at(x, EYE_Y - 0.004, -0.018);
      return sdf.sphere(0.034).at(...c).intersect(sdf.halfSpace([0, -1, 0], -(c[1] + 0.004)));
    };
    k.body('lids', sdf.union(lid(EYE_X), lid(-EYE_X)).bone('head'), { color: barkDark, roughness: 0.8, detail: 0.003 });
    // A small smile under the mask.
    const smileStroke = sdf.extrude(profile.arc(0.05, 0.008, 228, 312), 0.3).at(0, 0.64, 0.1);
    const smile = g.head.round(0.0015).intersect(smileStroke).intersect(sdf.halfSpace([0, 0, -1], -0.1));
    k.body('smile', smile.bone('head'), { color: '#3a2418', roughness: 0.5, detail: 0.002 });
    // Four big round leaves on top of the head, each on a short stem, with a darker middle vein.
    const leafColor = k.tint('leaves');
    const vein = k.tint('leaves', -0.25);
    // Each leaf is a thick round pad with a raised rim and a bud in the middle, built flat at the
    // origin, lifted on its stem, and tipped out from the crown.
    const leaves = (
      [
        [-0.1, 0.0, 40, 10, 0.135, 0.08],
        [0.0, 0.05, -5, -25, 0.115, 0.1],
        [0.11, -0.02, -40, 5, 0.14, 0.07],
        [0.02, -0.1, 5, 35, 0.125, 0.06],
      ] as const
    ).map(([x, z, tiltZ, tiltX, r, lift]) => {
      const root = sdf.raycast(g.head, [x, 2, z], [0, -1, 0])!;
      const pad = sdf
        .smoothUnion(0.02, sdf.ellipsoid([r, 0.055, r * 0.85]), sdf.ellipsoid([r * 0.32, 0.03, r * 0.5]).at(0, 0.04, r * 0.25))
        .paintWhere(sdf.box([0.014, 0.2, r * 1.8]), vein, 0.004);
      const leaf = pad
        .at(0, lift, 0)
        .rotateX(tiltX)
        .rotateZ(tiltZ)
        .at(root[0], root[1] - 0.01, root[2]);
      const tip = sdf.raycast(leaf, [root[0], root[1] - 0.01, root[2]], [0, 1, 0]) ?? [root[0], root[1] + lift, root[2]];
      const stem = sdf.capsule([root[0], root[1] - 0.01, root[2]], [tip[0], tip[1], tip[2]], 0.014).paint(vein);
      return sdf.smoothUnion(0.012, leaf, stem);
    });
    k.body('leaves', sdf.union(...leaves).bone('head'), { color: leafColor, roughness: 0.6, detail: 0.004 });
  },
});
