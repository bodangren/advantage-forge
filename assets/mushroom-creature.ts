import { profile, sdf } from '../src/index.js';
import { goblinAsset } from './parts/goblin-kind.js';

/**
 * Mushroom creature — Chibi Quest monster (catalog `monsters/small/mushroom-creature`), a
 * small mushroom child about 0.95 m tall to the top of its cap, faces +Z. Target:
 * docs/monster-mockups/mushroom-creature_001.jpg (made with mmx from the green slime mockup).
 *
 * The goblin warrior (`assets/goblin-warrior.ts`; head, arms, rig, and clips from
 * `assets/parts/goblin-kind.ts`) as a mushroom folk child: no goblin ears, face, or clothes; cream
 * skin; a big red cap with raised white spots and pale gills underneath; small round ears; two
 * glossy black dot eyes and a small smile; a stem-like body that widens to the hem; and short legs
 * with round feet.
 * Role: a shy forest creature (friend or foe) that waddles and slaps; the big spotted cap reads at
 *   128 px from every side and from above.
 * Palette (60/30/10): cream skin and stem #f2d8b4; a red cap #e05a4a; white spots; black eyes.
 * Bodies: stem (body and legs), cap, spots, eyes, smile, ears.
 */

type V3 = [number, number, number];

export default goblinAsset({
  name: 'mushroom-creature',
  description: 'Chibi mushroom creature monster: a cream mushroom child with a big red cap with raised white spots, small round ears, black dot eyes, a small smile, a stem-like body, and short legs.',
  reference: 'docs/monster-mockups/mushroom-creature_001.jpg',
  variants: {
    skin: { cream: '#f2d8b4', pale: '#f4e8d8', tan: '#e0b88a' },
    clothing: { cream: '#f0d8a4', white: '#f4ecdc', sand: '#dcc08a' },
    eyes: { black: '#141012', brown: '#3a2416', blue: '#1e2a48' },
    cap: { red: '#e05a4a', brown: '#9a6a3e', blue: '#4a7ac0' },
  },
  presets: {
    porcini: { skin: 'tan', clothing: 'sand', eyes: 'brown', cap: 'brown' },
    bluecap: { skin: 'pale', clothing: 'white', eyes: 'blue', cap: 'blue' },
  },
  colors: { skinDark: '#d8b48a', earInner: '#f0b0a0' },
  ears: false,
  face: false,
  tuft: false,
  outfit(k, g) {
    const { HIP, KNEE, ANKLE } = g.joints;
    // The stem: a soft bell from the neck to a wide hem, tagged chest, spine, and hips from the top.
    const bell = sdf.revolve(
      profile.polygon(
        [
          [0, 0.5],
          [0.08, 0.49],
          [0.11, 0.44],
          [0.125, 0.36],
          [0.14, 0.27],
          [0.158, 0.18],
          [0.15, 0.15],
          [0, 0.15],
        ],
        { smooth: true, samples: 6 },
      ),
    ).scale([1, 1, 0.85]);
    const stem = sdf.union(
      bell.intersect(sdf.halfSpace([0, -1, 0], -0.38)).bone('chest'),
      bell.intersect(sdf.box([0.5, 0.12, 0.5]).at(0, 0.32, 0)).bone('spine'),
      bell.intersect(sdf.halfSpace([0, 1, 0], 0.26)).bone('hips'),
    );
    // Short legs with round feet.
    const leg = sdf.smoothUnion(
      0.02,
      sdf.cone(HIP, KNEE, 0.046, 0.042).bone('leg.L'),
      sdf.cone(KNEE, ANKLE, 0.042, 0.04).bone('shin.L'),
      sdf.ellipsoid([0.05, 0.036, 0.07]).at(ANKLE[0], 0.036, ANKLE[2] + 0.025).bone('foot.L'),
    );
    k.body('stem', sdf.smoothUnion(0.02, stem, leg.mirror('x')), { color: g.tint.clothing, roughness: 0.75, bump: (x, y, z) => 0.0008 * Math.sin(y * 300 + Math.sin(Math.atan2(x, z) * 9) * 3) });
  },
  weapon() {
    // No held item: it slaps with its little hands.
  },
  extra(k, g) {
    const at = (x: number, y: number): V3 => [x, y, g.faceZ(Math.abs(x), y)];
    // Two glossy black dot eyes, half sunk, and a small smile.
    const EYE_X = 0.082;
    const EYE_Y = 0.665;
    const eye = (x: number) => {
      const p = at(x, EYE_Y);
      const c: V3 = [p[0], p[1], p[2] - 0.01];
      return sdf.sphere(0.024).at(...c).paintWhere(sdf.sphere(0.007).at(c[0] + 0.008, c[1] + 0.01, c[2] + 0.02), '#ffffff', 0.002);
    };
    k.body('eyes', sdf.union(eye(EYE_X), eye(-EYE_X)).bone('head'), { color: k.tint('eyes'), roughness: 0.1, textureDensity: 2, detail: 0.003 });
    const smileStroke = sdf.extrude(profile.arc(0.036, 0.006, 225, 315), 0.3).at(0, 0.636, 0.1);
    const smile = g.head.round(0.0015).intersect(smileStroke).intersect(sdf.halfSpace([0, 0, -1], -0.1));
    k.body('smile', smile.bone('head'), { color: '#3a2420', roughness: 0.5, detail: 0.002 });
    // Small round ears on the sides of the head, pink inside.
    const earAt = sdf.surfacePoint(g.head, [0.24, 0.66, 0.03], -0.012);
    const ear = sdf
      .ellipsoid([0.026, 0.042, 0.034])
      .paintWhere(sdf.ellipsoid([0.012, 0.026, 0.022]).at(0.018, 0, 0.006), g.tint.earInner, 0.006)
      .at(earAt[0], earAt[1], earAt[2]);
    k.body('ears', ear.mirror('x').bone('head'), { color: g.tint.skin, roughness: 0.6, detail: 0.004 });

    // The cap: a wide dome that sits on the head down to the brow, with pale gills underneath.
    const capColor = g.tone('cap', '#e05a4a');
    const cap = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.99],
            [0.16, 0.97],
            [0.27, 0.905],
            [0.325, 0.815],
            [0.32, 0.765],
            [0.27, 0.755],
            [0.14, 0.78],
            [0, 0.79],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.94])
      .at(0, 0, -0.01);
    const gills = sdf.halfSpace([0, 1, 0], 0.775).intersect(sdf.sphere(0.4).at(0, 0.8, 0));
    k.body('cap', cap.paintWhere(gills, g.tone('clothing', '#f4e6c8'), 0.01).bone('head'), { color: capColor, roughness: 0.6, detail: 0.005 });
    // Raised white spots on the cap.
    const spotAt = (x: number, z: number, r: number) => {
      const p = sdf.raycast(cap, [x, 2, z], [0, -1, 0])!;
      const n = sdf.normalAt(cap, p);
      const R = r * 1.3;
      return sdf.ellipsoid([R, R * 0.42, R * 0.8]).at(p[0] - n[0] * R * 0.1, p[1] - n[1] * R * 0.1, p[2] - n[2] * R * 0.1);
    };
    const spots = sdf.union(
      spotAt(-0.12, 0.08, 0.05),
      spotAt(0.1, 0.12, 0.058),
      spotAt(0.03, -0.02, 0.04),
      spotAt(0.2, -0.06, 0.04),
      spotAt(-0.2, -0.08, 0.042),
      spotAt(-0.06, -0.18, 0.05),
      spotAt(0.12, -0.2, 0.038),
      spotAt(-0.24, 0.12, 0.03),
      spotAt(0.25, 0.12, 0.032),
    );
    k.body('spots', spots.bone('head'), { color: '#f8f4ea', roughness: 0.6, detail: 0.004 });
  },
});
