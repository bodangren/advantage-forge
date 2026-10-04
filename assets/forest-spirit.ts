import { mixRgb, motion, noise, rgb, sdf } from '../src/index.js';
import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Forest spirit — Chibi Quest monster (catalog `monsters/fey-and-spirit/forest-spirit`), a small
 * floating woodland spirit about 0.95 m tall with its flower, faces +Z. Target:
 * docs/monster-mockups/forest-spirit_001.jpg (made with mmx).
 *
 * The spirit of `assets/parts/spirit-kind.ts` (the ghost's egg head, face, arms, rig, and clips)
 * with a hood of green leaves around its cream face, a pink flower on top, and a mossy green wisp
 * body that tapers into a vine tail.
 * Role: a shy forest spirit (friend or foe); the leaf hood and the flower read at 128 px.
 * Palette (60/30/10): cream face #f3ead6; leaf green #5e9a46 hood and moss #6aa04a body, darker
 *   in the grooves; a pink flower #f4a0b8 with a yellow heart; green pupils.
 * Features: a hood of overlapping leaves on the head (rigid on the `head` bone) and a flower on
 *   the `crown` bone that sways in every clip.
 */

type V3 = readonly [number, number, number];
const DEG = 180 / Math.PI;
/** Point `s` (built facing +Z at the origin) along the normal `n` and move it to `p`. */
const facing = (s: sdf.Shape, n: V3, p: V3) => s.rotateX(-Math.asin(n[1]) * DEG).rotateY(Math.atan2(n[0], n[2]) * DEG).at(...p);

export default spiritAsset({
  name: 'forest-spirit',
  description: 'Chibi forest spirit monster: a cream egg face in a hood of green leaves with a pink flower on top, dark eyes with green glowing pupils, on a mossy green wisp body that tapers into a vine tail.',
  reference: 'docs/monster-mockups/forest-spirit_001.jpg',
  variants: {
    body: { cream: '#f3ead6', bark: '#e8d8c0', pale: '#f4f0e8' },
    element: { moss: '#6aa04a', autumn: '#c0782e', sage: '#8aa878' },
    eyes: { green: '#7af07a', amber: '#ffc040', blue: '#8ad8ff' },
  },
  presets: {
    autumn: { body: 'bark', element: 'autumn', eyes: 'amber' },
    sage: { body: 'pale', element: 'sage', eyes: 'blue' },
  },
  colors: { eye: '#121a10', pupilBase: '#1a4a10', mouth: '#4a2a1a' },
  head: { roughness: 0.6 },
  wisp: {
    girth: 1.08,
    roughness: 0.85,
    paint: (wisp, s) => {
      const dark = rgb(s.tone('element', '#3e6e2e'));
      return wisp
        .displace(0.004, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2))
        .paintFn((x, y, z, c) => mixRgb(c, dark, Math.max(0, noise.fbm(x * 22, y * 22, z * 22, 2)) * 0.8));
    },
  },
  extra: {
    bones: { crown: { parent: 'head', at: [0, 0.8, 0] } },
    build(k, s) {
      // The hood: a shell around the head with an oval opening for the face, covered in leaves
      // that point down like shingles.
      const face = sdf.ellipsoid([0.2, 0.215, 0.3]).at(0, 0.45, 0.16);
      const hood = s.head.round(0.016).subtract(face);
      const leaves: sdf.Shape[] = [];
      const rings: [number, number][] = [
        [0.3, 10],
        [0.4, 12],
        [0.52, 12],
        [0.63, 11],
        [0.72, 9],
        [0.785, 5],
      ];
      rings.forEach(([y, count], ri) => {
        for (let i = 0; i < count; i++) {
          const a = ((i + (ri % 2) * 0.5) / count) * Math.PI * 2;
          const x = Math.sin(a) * 0.4;
          const z = Math.cos(a) * 0.4;
          // Leave the face open: no leaf over the opening.
          const at = s.on(hood, x, y, z);
          if (face.dist(at[0], at[1], at[2]) < 0.025) continue;
          const n = sdf.normalAt(hood, at);
          const leaf = sdf.ellipsoid([0.042, 0.06, 0.012]).at(0, -0.02, 0).rotateX(12);
          leaves.push(facing(leaf, n, at));
        }
      });
      const dark = rgb(s.tone('element', '#3e6e2e'));
      const leafy = sdf
        .smoothUnion(0.006, hood, ...leaves)
        .paintFn((x, y, z, c) => mixRgb(c, dark, Math.max(0, noise.fbm(x * 18, y * 18, z * 18, 2)) * 0.6))
        .bone('head');
      k.body('hood', leafy, { color: s.tone('element', '#5e9a46'), roughness: 0.7, textureDensity: 1.5 });
      // The flower: five pink petals around a yellow heart, on a short stem.
      const petals = sdf.union(
        ...Array.from({ length: 5 }, (_, i) =>
          sdf
            .ellipsoid([0.046, 0.014, 0.028])
            .at(0.04, 0, 0)
            .rotateZ(20)
            .rotateY(i * 72)
            .at(0, 0.89, -0.01),
        ),
      );
      const flower = sdf.union(
        petals.paint('#f4a0b8'),
        sdf.sphere(0.022).at(0, 0.898, -0.01).paint('#ffd040'),
        sdf.cylinder(0.009, 0.09).at(0, 0.84, -0.01).paint('#5e9a46'),
      );
      k.body('flower', flower, { color: '#f4a0b8', roughness: 0.5, bone: 'crown', detail: 0.0025 });
    },
    pose(clip, p) {
      const n = clip === 'hit' ? 1 : 2;
      return { crown: { rotate: [5 * motion.wave(p, n, 0.2), 0, 8 * motion.wave(p, n)] } };
    },
  },
});
