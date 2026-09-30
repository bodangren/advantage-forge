import { defineAsset, rgb, sdf } from '../src/index.js';

/**
 * Gold stud earrings (equipment/accessories/earring), matched to docs/item-mockups/earring-mock.jpg.
 * Role: equipment pickup icon. Size: pair 0.5 m wide, each stud 0.2 m across, standing on y = 0, facing +Z.
 * One idea: two fat gold studs, each a thick bezel holding a big green cabochon with four gold claws.
 * Shape language: round, chunky. Palette: gold #d4a93a (metal), green #58c85a (focal), light green highlight.
 * Materials: gold (bezel, back disc, claws), gem (cabochon). Right stud leans 10 degrees.
 */

export default defineAsset({
  name: 'earring',
  description: 'A pair of fat gold stud earrings standing upright, each with a big green cabochon and four claws.',
  detail: 0.005,
  reference: 'docs/item-mockups/earring-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const gold = [];
    const gems = [];
    const stud = (x: number, lean: number) => {
      const g = [
        sdf.torus(0.08, 0.035).rotateX(90),
        sdf.cylinder(0.09, 0.03, 0.008).rotateX(90).at(0, 0, -0.03),
      ];
      for (const a of [45, 135, 225, 315]) {
        const c = Math.cos((a * Math.PI) / 180), s = Math.sin((a * Math.PI) / 180);
        g.push(sdf.cone([c * 0.088, s * 0.088, 0.0], [c * 0.06, s * 0.06, 0.04], 0.014, 0.008));
      }
      const dome = sdf.sphere(0.09).at(0, 0, -0.05).intersect(sdf.box([0.3, 0.3, 0.1]).at(0, 0, 0.04))
        .paintWhere(sdf.sphere(0.02).at(-0.025, 0.03, 0.03), rgb('#b8f5b0'), 0.03);
      const place = (s: any) => s.rotateZ(lean).at(x, 0.115, 0.0);
      return { g: g.map(place), gem: place(dome) };
    };
    for (const [x, l] of [[-0.14, 0], [0.14, -10]] as const) {
      const s = stud(x, l);
      gold.push(...s.g);
      gems.push(s.gem);
    }
    k.body('gold', sdf.union(...gold), { color: '#d4a93a', roughness: 0.35, metalness: 1 });
    k.body('gems', sdf.union(...gems), { color: '#58c85a', roughness: 0.2, metalness: 0 });
  },
});
