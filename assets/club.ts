import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Spiked wooden club (equipment/weapons/club), matched to docs/item-mockups/club-mock.jpg.
 * Size: 0.7 m long, standing head down on y = 0 as it rests against a wall or rack.
 * One idea: a chunky rounded wooden head set with iron spikes and round studs, on a tapered
 * handle wrapped with raised rings. Palette: head wood #c8995a / grain #9a6a38, handle
 * #8a5a32 with rings #5e3a1e, iron #7c8288. Materials: wood (0.75), iron (0.4, metal 0.85).
 */

const WOOD = rgb('#c8995a');
const WOOD_GRAIN = rgb('#9a6a38');
const HANDLE = rgb('#8a5a32');
const RING = rgb('#5e3a1e');

const HEAD_Y = 0.105; // head center
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const bounded = (s: ReturnType<typeof sdf.sphere>) =>
  s.intersect(sdf.halfSpace([0, -1, 0], 0).intersect(sdf.box([1, 2, 1]).at(0, 0.5, 0)));

export default defineAsset({
  name: 'club',
  description: 'A spiked wooden club: a chunky rounded head set with iron spikes and studs, on a ringed tapered handle.',
  detail: 0.004,
  reference: 'docs/item-mockups/club-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Head: a rounded, slightly swollen block with a lumpy hand-carved surface.
    const head = sdf
      .smoothUnion(
        0.03,
        sdf.box([0.15, 0.19, 0.15], 0.045).at(0, HEAD_Y, 0),
        sdf.sphere(0.095).at(0, HEAD_Y, 0),
      )
      .displace(0.004, (x, y, z) => noise.fbm(x * 18, y * 18, z * 18, 2));
    // Handle: tapers from the head to the grip, with a round pommel.
    const shaft = sdf.cone([0, HEAD_Y + 0.08, 0], [0, 0.66, 0], 0.036, 0.026);
    const pommel = sdf.ellipsoid([0.034, 0.026, 0.034]).at(0, 0.672, 0);
    const wood = bounded(sdf.smoothUnion(0.02, head, shaft).smoothUnion(0.008, pommel)).paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 6, z * 30, 3);
      const onHead = clamp((0.235 - y) / 0.03);
      const base = mixRgb(HANDLE, WOOD, onHead);
      return mixRgb(base, onHead > 0.5 ? WOOD_GRAIN : RING, 0.15 + 0.35 * grain);
    });
    k.body('wood', wood, {
      color: '#c8995a',
      roughness: 0.75,
      metalness: 0,
      paintWeight: 2,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 40, y * 12, z * 40, 2),
    });

    // Raised leather rings along the grip.
    const rings = sdf.union(
      ...[0.3, 0.36, 0.42, 0.48, 0.54, 0.6].map((y) => {
        const r = 0.036 - ((y - (HEAD_Y + 0.08)) / (0.66 - HEAD_Y - 0.08)) * 0.01;
        return sdf.torus(r, 0.0075).at(0, y, 0);
      }),
    );
    k.body('rings', rings, { color: '#5e3a1e', roughness: 0.7, metalness: 0, detail: 0.003 });

    // Iron: spikes out of the four sides and the four upper corners, round studs below.
    const spike = (dir: [number, number, number], at: [number, number, number], len: number) => {
      const n = Math.hypot(...dir);
      const d: [number, number, number] = [dir[0] / n, dir[1] / n, dir[2] / n];
      return sdf.cone(at, [at[0] + d[0] * len, at[1] + d[1] * len, at[2] + d[2] * len], 0.02, 0.003);
    };
    const iron = [];
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      iron.push(spike([c, -0.1, s], [c * 0.07, HEAD_Y, s * 0.07], 0.07));
      const d = a + Math.PI / 4;
      iron.push(spike([Math.cos(d), -0.8, Math.sin(d)], [Math.cos(d) * 0.065, HEAD_Y - 0.06, Math.sin(d) * 0.065], 0.06));
      iron.push(sdf.sphere(0.017).at(c * 0.074, HEAD_Y + 0.07, s * 0.074));
    }
    k.body('iron', sdf.union(...iron), { color: '#7c8288', roughness: 0.4, metalness: 0.85, detail: 0.003 });
  },
});
