import { defineAsset, mixRgb, rgb, sdf } from '../src/index.js';

/**
 * Fishing rod (equipment/tools/fishing-rod), matched to docs/item-mockups/fishing-rod-mock.jpg.
 * Role: equipment icon, read at 128 px. Size: 1.5 m tall, on y = 0, faces +Z, leaning to -X, curving to +X at the tip.
 * One idea: a chunky curved bamboo rod with a big red reel and a line dropping to a red-and-white bobber.
 * Shape language: round and chunky; secondary: the arc of the rod.
 * Palette: honey #d9a656, nodes #b48a3c, walnut grip #8a5a35, reel red #d84a3a, line #efe4c8, bobber white/red.
 * Materials: wood (rod, grip, reel housing), reel (red), line, bobber (painted two colors).
 * Focal point: the red reel. Rig: none.
 */

const HONEY = rgb('#d9a656');
const NODE = rgb('#b48a3c');
const PTS: [number, number, number, number][] = [
  [0, 0, 0, 0.035],
  [-0.1, 0.5, 0, 0.03],
  [-0.15, 0.95, 0, 0.022],
  [-0.1, 1.3, 0, 0.017],
  [0.02, 1.5, 0, 0.012],
];
// point and tangent angle along the polyline at parameter u (0..1 by segment index)
const along = (u: number) => {
  const f = Math.min(PTS.length - 1.0001, u * (PTS.length - 1));
  const i = Math.floor(f);
  const t = f - i;
  const a = PTS[i];
  const b = PTS[i + 1];
  return {
    x: a[0] + (b[0] - a[0]) * t,
    y: a[1] + (b[1] - a[1]) * t,
    r: a[3] + (b[3] - a[3]) * t,
    ang: (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI,
  };
};

export default defineAsset({
  name: 'fishing-rod',
  description: 'A chunky curved bamboo fishing rod with a walnut grip, a big red reel, and a line to a red and white bobber.',
  detail: 0.005,
  reference: 'docs/item-mockups/fishing-rod-mock.jpg',
  texture: { size: 512 },

  build(k) {
    let rod = sdf.chain(PTS, 0.03);
    const nodeYs: number[] = [];
    for (const u of [0.3, 0.42, 0.55, 0.68, 0.82]) {
      const p = along(u);
      nodeYs.push(p.y);
      rod = rod.smoothUnion(0.008, sdf.torus(p.r + 0.002, 0.009).rotateZ(-p.ang).at(p.x, p.y, 0));
    }
    const grip = sdf.cylinder(0.045, 0.3, 0.012).rotateZ(11).at(-0.03, 0.15, 0).paintFn(() => rgb('#8a5a35'));
    const housing = sdf.torus(0.09, 0.02).rotateX(90).at(0.02, 0.45, 0);
    const wood = rod
      .paintFn((x, y) => {
        let m = 0;
        for (const ny of nodeYs) m = Math.max(m, Math.exp(-Math.pow((y - ny) / 0.02, 2)));
        return mixRgb(HONEY, NODE, m);
      })
      .smoothUnion(0.01, grip);
    k.body('wood', wood, { color: '#d9a656', roughness: 0.7, metalness: 0 });
    k.body('housing', housing.paintFn(() => rgb('#d9a656')), { color: '#d9a656', roughness: 0.7, metalness: 0 });

    const disc = sdf.cylinder(0.09, 0.06, 0.008).rotateX(90).at(0.02, 0.45, 0);
    const hub = sdf.cylinder(0.02, 0.09, 0.004).rotateX(90).at(0.02, 0.45, 0.02);
    const arm = sdf.capsule([0.02, 0.45, 0.06], [0.08, 0.5, 0.06], 0.01);
    const cknob = sdf.sphere(0.02).at(0.08, 0.5, 0.085);
    k.body('reel', sdf.union(disc, hub, arm, cknob), { color: '#d84a3a', roughness: 0.5, metalness: 0 });

    const tip = PTS[4];
    const line = sdf.chain(
      [
        [tip[0], tip[1], 0, 0.01],
        [0.18, 1.2, 0, 0.01],
        [0.3, 0.9, 0, 0.01],
        [0.31, 0.7, 0, 0.01],
        [0.3, 0.58, 0, 0.01],
      ],
      0.02,
    );
    k.body('line', line, { color: '#efe4c8', roughness: 0.6, metalness: 0 });

    const bob = sdf
      .union(sdf.sphere(0.06).at(0.3, 0.5, 0), sdf.sphere(0.05).at(0.3, 0.6, 0))
      .paintFn((x, y) => (y > 0.555 ? rgb('#f4efe2') : rgb('#d84a3a')));
    k.body('bobber', bob, { color: '#f4efe2', roughness: 0.4, metalness: 0 });
  },
});
