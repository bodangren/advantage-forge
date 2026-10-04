import { noise, sdf } from '../src/index.js';
import { golemAsset } from './parts/golem-kind.js';

/**
 * Colossal golem — Chibi Quest monster (catalog `monsters/giant-and-ancient/colossal-golem`), an
 * ancient war golem about 1 m tall in the model (a game shows it bigger), faces +Z. Target:
 * docs/monster-mockups/colossal-golem_001.jpg (made with mmx from the stone golem mockup).
 *
 * The stone golem (`assets/stone-golem.ts`; body, rig, and clips from `assets/parts/golem-kind.ts`)
 * as an ancient colossus: dark charcoal stone with faceted shading and no moss, a dark core, and
 * glowing cyan veins that run over the shoulder boulders, the collar, the forearm and fist blocks,
 * the knees, and the feet.
 * Role: a boss of the giant family; the glowing veins and eyes on the dark stone read at 128 px.
 * Palette (60/30/10): charcoal stone #4a4e54; a darker core #3a3e44; cyan glow #2ee6ff (eyes,
 *   rune, veins) as the accent.
 * Bodies added: veins (on the mantle, rigid on the chest), limb-veins (on the limb blocks, tagged).
 */

type Face = 'x' | 'y' | 'z';
type Vein = readonly [number, number, number, Face];

/**
 * Glowing veins: thin zigzag cracks that lie on the surface of `shape`. Each vein is drawn in the
 * plane of its face (`z` front, `y` top, `x` side), and each point is moved onto the stone by a
 * ray along the face normal, so the chain lies half sunk in the stone; a short branch leaves from
 * the middle.
 */
const veins = (shape: sdf.Shape, centers: readonly Vein[], seed: number) =>
  sdf.union(
    ...centers.flatMap(([x, y, z, face], i) => {
      const n: [number, number, number] = face === 'z' ? [0, 0, 1] : face === 'y' ? [0, 1, 0] : [Math.sign(x), 0, 0];
      const u: [number, number, number] = face === 'x' ? [0, 0, 1] : [1, 0, 0];
      const v: [number, number, number] = face === 'y' ? [0, 0, 1] : [0, 1, 0];
      const a = (20 + noise.random(seed, i, 1) * 140) * (Math.PI / 180);
      const b = a + (55 + noise.random(seed, i, 2) * 30) * (Math.PI / 180);
      const at = (s: number, t: number, ang: number, from: readonly number[] = [x, y, z]) => {
        const d = [Math.cos(ang), Math.sin(ang)];
        const q = [0, 1, 2].map((j) => from[j]! + (u[j]! * d[0]! - v[j]! * d[1]!) * s + (u[j]! * d[1]! + v[j]! * d[0]!) * t);
        const hit = sdf.raycast(shape, [q[0]! + n[0] * 0.3, q[1]! + n[1] * 0.3, q[2]! + n[2] * 0.3], [-n[0], -n[1], -n[2]]);
        return hit ? ([hit[0] - n[0] * 0.002, hit[1] - n[1] * 0.002, hit[2] - n[2] * 0.002] as [number, number, number]) : null;
      };
      const chain = (pts: ([number, number, number] | null)[], r: number) => {
        const ok = pts.filter((q): q is [number, number, number] => q !== null);
        return ok.length < 2 ? [] : [sdf.chain(ok.map((q, j) => [...q, r * (j === ok.length - 1 ? 0.6 : 1)] as [number, number, number, number]), 0.003)];
      };
      return [
        ...chain([at(-0.06, 0, a), at(-0.02, 0.012, a), at(0.02, -0.01, a), at(0.06, 0.006, a)], 0.0078),
        ...chain([at(0, 0, a), at(0.022, 0.006, b), at(0.042, -0.004, b)], 0.0062),
      ];
    }),
  );

export default golemAsset({
  name: 'colossal-golem',
  description:
    'Chibi colossal golem monster: an ancient war golem of dark faceted charcoal stone with glowing cyan veins over its huge boulder shoulders, fists, knees, and feet, glowing cyan eyes, and a glowing chest rune.',
  reference: 'docs/monster-mockups/colossal-golem_001.jpg',
  variants: {
    stone: { charcoal: '#4a4e54', obsidian: '#2e3036', slate: '#5e646c' },
    glow: { cyan: '#2ee6ff', violet: '#a86aff', amber: '#ffb03a' },
  },
  presets: {
    obsidian: { stone: 'obsidian', glow: 'violet' },
    forge: { stone: 'slate', glow: 'amber' },
  },
  colors: { sage: '#3e4248', olive: '#4a4e54', sageDark: '#24262a' },
  moss: false,
  flat: true,
  extra(k, g) {
    const glow = { color: g.tint.glow, emissive: g.tint.glow, emissiveIntensity: 1.6, roughness: 0.35, detail: 0.0035 };
    const mantleVeins = veins(
      g.mantle,
      [
        [0.4, 0.76, 0.13, 'z'],
        [0.52, 0.7, 0.04, 'x'],
        [0.34, 0.88, 0.0, 'y'],
        [0.36, 0.6, 0.12, 'z'],
        [-0.4, 0.76, 0.13, 'z'],
        [-0.52, 0.7, 0.04, 'x'],
        [-0.34, 0.88, 0.0, 'y'],
        [-0.36, 0.6, 0.12, 'z'],
        [0.1, 0.79, 0.16, 'z'],
      ],
      70,
    );
    k.body('veins', mantleVeins, { ...glow, bone: 'chest' });
    const limbCenters = (s: 1 | -1): Vein[] => [
      [0.43 * s, 0.46, 0.16, 'z'],
      [0.56 * s, 0.44, 0.04, 'x'],
      [0.59 * s, 0.28, 0.06, 'x'],
      [0.2 * s, 0.19, 0.14, 'z'],
      [0.2 * s, 0.07, 0.185, 'z'],
    ];
    k.body('limb-veins', veins(g.limbs, [...limbCenters(1), ...limbCenters(-1)], 80), glow);
  },
});
