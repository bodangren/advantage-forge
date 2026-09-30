import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Rolled parchment scroll (equipment/tools/scroll): an inventory and tabletop prop, read at 128 px.
 * Size: 0.37 m long with its knobs, 0.08 m thick, lying on y = 0 with its axis along X.
 * One idea: a cream paper roll on a wooden rod with round knobs, tied with a red ribbon that
 * carries a red wax seal. The paper ends show the rolled spiral.
 * Palette: parchment #f2e3c2 / #d9c49a, spiral lines #b89e72, wood #8a5a32, ribbon #b8312a,
 * wax #a4221b. Materials: matte paper (0.85), waxed wood (0.6), wax (0.35).
 */

const PAPER = rgb('#d8b98a');
const PAPER_DARK = rgb('#a88a5c');
const SPIRAL = rgb('#b89e72');
const WOOD = rgb('#e8dcc0');
const WOOD_DARK = rgb('#b8a888');
const RIBBON = rgb('#7a4a8a');
const WAX = rgb('#2a2622');
const WAX_DARK = rgb('#141210');

const R = 0.04; // paper roll radius
const L = 0.26; // paper roll length
const RIB_X = 0.035; // ribbon position along the roll

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export default defineAsset({
  name: 'ancient-scroll',
  description: 'An aged scroll with torn ends, bone knobs, a faded purple ribbon and a cracked black seal with a gold rune.',
  detail: 0.004,
  reference: 'docs/item-mockups/ancient-scroll-mock.jpg',
  texture: { size: 512 },

  build(k) {
    const roll = sdf.cylinder(R, L, 0.006).rotateZ(90).at(0, R, 0);
    // The outer sheet's loose edge: a shallow step along the front of the roll.
    const sheetEdge = sdf.box([L - 0.004, 0.012, 0.004], 0.002).at(0, R - 0.012, R - 0.0005);

    const notches = sdf.union(
      ...[[-1, 0.02, 0.018], [-1, 0.06, -0.02], [1, 0.05, 0.02], [1, 0.03, -0.022], [1, 0.075, -0.005]].map(([s, y, z]) =>
        sdf.box([0.024, 0.014, 0.014], 0.003).rotateX(30).at(s! * (L / 2), y!, z!),
      ),
    );
    k.body(
      'paper',
      sdf.smoothUnion(0.003, roll, sheetEdge).subtract(notches).paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 12, y * 12, z * 12, 2);
        let c = mixRgb(PAPER, PAPER_DARK, 0.15 + 0.35 * n);
        c = mixRgb(c, PAPER_DARK, clamp((R * 0.35 - y) / (R * 0.35)) * 0.5);
        if (Math.abs(x) > L / 2 - 0.004) {
          // Rolled spiral on each end face.
          const dy = y - R;
          const r = Math.hypot(dy, z);
          const a = Math.atan2(dy, z * Math.sign(x)) / (2 * Math.PI);
          const turn = r / 0.0075 - a;
          const line = Math.abs(turn - Math.round(turn));
          c = mixRgb(c, SPIRAL, (1 - clamp((line - 0.08) / 0.1)) * clamp((r - 0.01) / 0.004));
        }
        return c;
      }),
      {
        color: '#d8b98a',
        roughness: 0.85,
        metalness: 0,
        textureDensity: 2,
        paintWeight: 2,
        bump: (x, y, z) => 0.0006 * noise.fbm(x * 60, y * 60, z * 60, 2),
      },
    );

    // Wooden rod through the roll, with a round knob and a small finial at each end.
    const knob = (s: number) =>
      sdf.smoothUnion(
        0.004,
        sdf.sphere(0.017).at(s * 0.158, R, 0),
        sdf.sphere(0.009).at(s * 0.178, R, 0),
        sdf.cylinder(0.019, 0.006, 0.002).rotateZ(90).at(s * 0.141, R, 0),
      );
    const rod = sdf.capsule([-0.15, R, 0], [0.15, R, 0], 0.0085);
    k.body(
      'wood',
      sdf.union(rod, knob(1), knob(-1)).paintFn((x, y, z) =>
        mixRgb(WOOD, WOOD_DARK, 0.3 + 0.3 * noise.fbm(x * 40, y * 90, z * 90, 2)),
      ),
      { color: '#e8dcc0', roughness: 0.55, metalness: 0 },
    );

    // Ribbon band around the roll.
    const ribbon = roll
      .round(0.0035)
      .intersect(sdf.box([0.022, 0.2, 0.2], 0.003).at(RIB_X, R, 0))
      .paintFn((x, y, z) => mixRgb(RIBBON, WAX_DARK, 0.2 * (0.5 + 0.5 * noise.fbm(x * 90, y * 90, z * 90, 2))));
    k.body('ribbon', ribbon, { color: '#7a4a8a', roughness: 0.7, metalness: 0, textureDensity: 2 });

    // Wax seal on the ribbon, on the upper front of the roll, facing the viewer and the sky.
    const up = Math.sin((35 * Math.PI) / 180);
    const out = Math.cos((35 * Math.PI) / 180);
    const at = (d: number): [number, number, number] => [RIB_X, R + d * up, d * out];
    const seal = sdf
      .smoothUnion(
        0.003,
        sdf.cylinder(0.021, 0.008, 0.003).rotateX(55).at(...at(R + 0.004)),
        sdf.sphere(0.012).at(...at(R + 0.002)),
      )
      .paintWhere(sdf.cylinder(0.011, 0.03, 0).rotateX(55).at(...at(R + 0.009)), WAX_DARK, 0.002)
      .paintWhere(sdf.cylinder(0.006, 0.03, 0).rotateX(55).at(...at(R + 0.009)), WAX, 0.002)
      .paintWhere(sdf.box([0.003, 0.03, 0.011]).rotateX(55).at(...at(R + 0.009)), rgb('#e0b040'), 0.001)
      .paintWhere(sdf.box([0.009, 0.03, 0.003]).rotateX(55).at(...at(R + 0.009)), rgb('#e0b040'), 0.001);
    k.body('seal', seal, { color: '#2a2622', roughness: 0.35, metalness: 0, detail: 0.003, textureDensity: 2 });
  },
});
