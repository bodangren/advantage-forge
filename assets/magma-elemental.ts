import { mixRgb, motion, noise, rgb, sdf } from '../src/index.js';
import { flameTongue } from './parts/element-features.js';
import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Magma elemental — Chibi Quest monster (catalog `monsters/elemental/magma-elemental`), a floating
 * lava spirit about 0.95 m tall with its crest, faces +Z. Target:
 * docs/monster-mockups/magma-elemental_001.jpg (made with mmx).
 *
 * The spirit of `assets/parts/spirit-kind.ts` (the ghost's egg head, face, arms, rig, and clips)
 * in dark cooled rock with glowing lava spots, a warm brown face framed by a rock hood, and a
 * crest of lava flames along the top of its head.
 * Role: a heavy fire spirit of the elemental family, the fire elemental's darker cousin; the
 *   glowing spots and the flame crest read at 128 px against the dark rock.
 * Palette (60/30/10): dark rock #2e2628 hood, body, and tail; a warm brown face #8a5a40; glowing
 *   orange lava #ff6a1a; orange pupils.
 * Features: lava spots on the body (a thin glowing skin over the rock), and five flame tongues in
 *   a row on the `crown` bone that flicker in every clip.
 */

const FLAME_ROOT = rgb('#e8380e');
const FLAME_TIP = rgb('#ffd04a');
const CYCLES: Record<string, number> = { idle: 6, walk: 4, attack: 4, hit: 2, death: 6, taunt: 6 };

export default spiritAsset({
  name: 'magma-elemental',
  description: 'Chibi magma elemental monster: a warm brown face in a dark rock hood with a crest of lava flames, dark eyes with orange glowing pupils, on a dark rock wisp body with glowing lava spots and a curled tail.',
  reference: 'docs/monster-mockups/magma-elemental_001.jpg',
  variants: {
    body: { clay: '#8a5a40', umber: '#6e4a36', ochre: '#9a6a3a' },
    element: { rock: '#2e2628', basalt: '#26282c', ember: '#3e2420' },
    eyes: { orange: '#ff8a2a', yellow: '#ffd040', red: '#ff4a2a' },
  },
  presets: {
    basalt: { body: 'umber', element: 'basalt', eyes: 'yellow' },
    ember: { body: 'ochre', element: 'ember', eyes: 'red' },
  },
  colors: { eye: '#120c0a', pupilBase: '#5a1e08', mouth: '#2a140c' },
  head: {
    roughness: 0.75,
    // The rock hood: everything but a round face on the front.
    paint: (head, s) => {
      const face = sdf.ellipsoid([0.205, 0.215, 0.3]).at(0, 0.45, 0.14);
      const hood = sdf.box([0.8, 0.8, 0.8]).at(0, 0.5, 0).subtract(face);
      return head.paintWhere(hood, s.tint.element, 0.008);
    },
  },
  wisp: {
    roughness: 0.85,
    bump: (x, y, z) => 0.002 * noise.fbm(x * 40, y * 40, z * 40, 3),
    paint: (wisp) => wisp.displace(0.004, (x, y, z) => noise.fbm(x * 18, y * 18, z * 18, 2)),
  },
  extra: {
    bones: { crown: { parent: 'head', at: [0, 0.74, -0.04] } },
    build(k, s) {
      // Lava spots: a thin glowing skin over the rock where round spots cross it.
      const spots = sdf.union(
        ...[
          [0.05, 0.22, 0.14, 0.035],
          [-0.08, 0.15, 0.12, 0.028],
          [0.11, 0.12, 0.07, 0.022],
          [-0.12, 0.26, 0.04, 0.026],
          [0.02, 0.27, -0.13, 0.03],
          [-0.06, 0.12, -0.1, 0.024],
          [0.12, 0.25, -0.06, 0.022],
          [0.17, 0.05, -0.08, 0.018],
        ].map(([x, y, z, r]) => sdf.sphere(r!).at(...s.on(s.wisp!, x!, y!, z!))),
      );
      const lava = s.wisp!.round(0.003).intersect(spots).paintFn((x, y, z) => mixRgb(FLAME_ROOT, FLAME_TIP, 0.3 + 0.3 * noise.noise3(x * 50, y * 50, z * 50)));
      k.body('lava', lava, { color: '#ff6a1a', roughness: 0.4, emissive: '#ff5a10', emissiveIntensity: 0.9, detail: 0.003 });
      // The crest: five flame tongues in a row from the brow to the back of the head.
      const crest = sdf
        .smoothUnion(
          0.03,
          flameTongue(0, 0.74, 0.06, 0, 0.18, 0.055, 0.04),
          flameTongue(0, 0.77, -0.03, 0, 0.24, 0.065, 0.05),
          flameTongue(0, 0.73, -0.12, 0, 0.18, 0.055, 0.06),
          flameTongue(0.13, 0.68, -0.04, 38, 0.16, 0.05, 0.03),
          flameTongue(-0.13, 0.68, -0.04, -38, 0.16, 0.05, 0.03),
        )
        .scale([1, 1, 0.9])
        .paintFn((_x, y) => mixRgb(FLAME_ROOT, FLAME_TIP, Math.min(1, Math.max(0, (y - 0.82) / 0.18))));
      k.body('flames', crest, { color: '#ff7a1c', roughness: 0.3, emissive: '#ff7a20', emissiveIntensity: 0.8, bone: 'crown', detail: 0.004 });
    },
    pose(clip, p) {
      const n = CYCLES[clip] ?? 2;
      const w = motion.wave(p, n);
      return { crown: { rotate: [3 * motion.wave(p, n, 0.3), 0, 4 * motion.wave(p, n / 2, 0.1)], scale: [1 - 0.04 * w, 1 + 0.1 * w, 1 - 0.04 * w] } };
    },
  },
});
