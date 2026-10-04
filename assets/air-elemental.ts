import { mixRgb, rgb, sdf } from '../src/index.js';
import { curl } from './parts/element-features.js';
import { spiritAsset } from './parts/spirit-kind.js';

/**
 * Air elemental — Chibi Quest monster (catalog `monsters/elemental/air-elemental`), a floating
 * wind spirit about 0.85 m tall, faces +Z. Target: docs/monster-mockups/air-elemental_001.jpg
 * (made with mmx).
 *
 * The spirit of `assets/parts/spirit-kind.ts` (the ghost's egg head, face, arms, rig, and clips)
 * on a cream wisp body, wrapped in mint wind ribbons, with a wind curl on its head.
 * Role: a wind caster of the elemental family; the spiral ribbons read at 128 px.
 * Palette (60/30/10): cream head and body #f3f0e2; mint ribbons #a8e2c2 with paler edges; amber
 *   pupils.
 * Features: two wind ribbons that spiral around the head and the body, close to the surface (each
 *   rides the bone of the part it wraps), and a wind curl on the `crown` bone that sways.
 */

type V3 = readonly [number, number, number];

export default spiritAsset({
  name: 'air-elemental',
  description: 'Chibi air elemental monster: a cream egg head and wisp body wrapped in spiraling mint wind ribbons, a wind curl on top, and dark eyes with amber glowing pupils.',
  reference: 'docs/monster-mockups/air-elemental_001.jpg',
  variants: {
    body: { cream: '#f3f0e2', cloud: '#eef2f4', sand: '#f2e8d4' },
    element: { mint: '#a8e2c2', sky: '#a8d4f0', lilac: '#cdbcef' },
    eyes: { amber: '#ffcc4a', white: '#f4fff8', mint: '#7af0b8' },
  },
  presets: {
    sky: { body: 'cloud', element: 'sky', eyes: 'white' },
    dusk: { body: 'sand', element: 'lilac', eyes: 'amber' },
  },
  colors: { eye: '#14141a', pupilBase: '#5a3a08', mouth: '#3a2a26' },
  wisp: { slot: 'body', roughness: 0.6 },
  extra: {
    bones: { crown: { parent: 'head', at: [0, 0.77, 0] } },
    build(k, s) {
      /** A ribbon: a tube that spirals around `shape` close to its surface. */
      const ribbon = (shape: sdf.Shape, y0: number, y1: number, a0: number, turns: number, r: number) => {
        const steps = Math.round(turns * 20);
        const pts = Array.from({ length: steps + 1 }, (_, i): [number, number, number, number] => {
          const t = i / steps;
          const a = a0 + t * turns * Math.PI * 2;
          // Close to the surface, and trailing off it at the end like a gust.
          const p: V3 = s.on(shape, Math.sin(a) * 0.4, y0 + (y1 - y0) * t, Math.cos(a) * 0.4, r * 0.4 + 0.07 * Math.max(0, t - 0.75) ** 1.5 * 8);
          // Thin at both ends.
          return [p[0], p[1], p[2], r * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.15)))];
        });
        return sdf.chain(pts, 0.01);
      };
      // The upper ribbon stays above the eyes (their hollows end at y 0.52); the lower one stays
      // under the arms (they start at y 0.24), so the flapping arms never cross it.
      const lower = ribbon(s.wisp!, 0.08, 0.215, 2.2, 1.1, 0.024).bone('body');
      const upper = ribbon(s.head, 0.58, 0.74, -0.8, 1.1, 0.026).bone('head');
      // A wind tuft: a curl that lies back over the crown (seen from the side, not as a ring).
      const tuft = curl([0, 0.77, 0.04], [0, 0, -1], 0.06, 1.1, 0.026).bone('crown');
      const pale = rgb(s.tone('element', '#e2f6ea'));
      const wind = sdf.union(lower, upper, tuft).paintFn((x, y, z, c) => mixRgb(c, pale, 0.5 + 0.5 * Math.sin(x * 40 + y * 55 + z * 40)));
      k.body('wind', wind, { color: s.tint.element, roughness: 0.4, emissive: s.tint.element, emissiveIntensity: 0.12, detail: 0.004 });
    },
    pose(clip, p) {
      const w = Math.sin(p * Math.PI * 2 * (clip === 'hit' ? 1 : 2));
      return { crown: { rotate: [4 * w, 0, 6 * w] } };
    },
  },
});
