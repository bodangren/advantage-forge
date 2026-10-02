import { HAND_FIT, defineAsset, noise, sdf } from '../src/index.js';

/**
 * Trident, 1.6 m tall, standing on y = 0, centred on the Y axis, prongs up (+Y).
 *
 * Role: hero gear / pickup icon for Chibi Quest heroes; must read as a silhouette at 128 px.
 * One idea: three sweeping golden prongs with barbs, crowning a chunky rounded hub.
 * Shape language: round and chunky (soft bevels), secondary triangular spikes on the barbs.
 * Palette: honey oak pole #b5814a (dominant), gold #d4a93a (accent, focal point),
 *   warm brown leather grip #8a5a35. Value plan: mid wood pole, bright gold head.
 * Materials: wood (roughness 0.8), leather (0.7), gold (roughness 0.3, metalness 1).
 * Detail list: pole + grip + butt cap; gold hub; three curved prongs; two side barbs;
 *   gold rings. Focal point: the prong head.
 * Grip centre is at about y = 0.17 for attaching to a character hand.
 */

// The lowest point sat 0.6 cm below y = 0; LIFT stands the display on y = 0, and the equip
// origin moves with it so the worn fit does not change.
const LIFT = 0.006;

export default defineAsset({
  name: 'trident',
  description: 'Bronze-gold trident with three barbed prongs on a honey-oak pole.',
  detail: 0.004,
  reference: 'docs/item-mockups/trident-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.17 + LIFT, 0] },

  build(k) {
    // ------------------------------------------------------------- wood pole
    const pole = sdf.cylinder(0.016, 1.07, 0.005).at(0, 0.555, 0);
    // Darker toward the butt, lighter toward the head.
    const poleShade = pole.paintFn((_x, y, _z, base) => {
      const t = Math.min(1, Math.max(0, y / 1.1));
      const g = 0.3 + 0.7 * t;
      return [base[0] * g, base[1] * g, base[2] * g];
    });
    k.body('pole', poleShade.at(0, LIFT, 0), {
      color: '#b5814a',
      roughness: 0.8,
      detail: 0.006,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 90, y * 8, z * 90, 3), // grain along the pole
    });

    // ------------------------------------------------------------- leather grip
    const grip = sdf.cylinder(0.02, 0.22, 0.008).at(0, 0.17, 0);
    k.body('grip', grip.at(0, LIFT, 0), {
      color: '#6b4226',
      roughness: 0.7,
      detail: 0.008,
      bump: (x, y, z) => 0.0015 * Math.abs(Math.sin(Math.atan2(z, x) + y * 120)), // spiral wrap
    });

    // ------------------------------------------------------------- gold head
    const hub = sdf.sphere(0.045).at(0, 1.09, 0);

    // Centre prong: straight, tallest.
    const centerProng = sdf.chain(
      [
        [0, 1.07, 0, 0.02],
        [0, 1.34, 0, 0.016],
        [0, 1.6, 0, 0.006],
      ],
      0.01,
    );

    // Side prongs: sweep out from the hub, then curve up.
    const sideProng = sdf.chain(
      [
        [0.025, 1.05, 0, 0.017],
        [0.065, 1.14, 0, 0.013],
        [0.1, 1.28, 0, 0.012],
        [0.11, 1.42, 0, 0.009],
        [0.1, 1.55, 0, 0.006],
      ],
      0.012,
    ).mirror('x');

    // Barbs: spikes on the outer side of each side prong, pointing out and down.
    const barb = sdf
      .cone([0.1, 1.28, 0], [0.175, 1.19, 0], 0.016, 0.006)
      .mirror('x', 0);

    // Gold furniture: butt cap, grip rings, collar under the hub.
    const buttCap = sdf.ellipsoid([0.02, 0.02, 0.02]).at(0, 0.014, 0);
    const gripRings = sdf.union(
      sdf.torus(0.0195, 0.005).at(0, 0.05, 0),
      sdf.torus(0.0195, 0.005).at(0, 0.29, 0),
    );
    const collar = sdf.torus(0.017, 0.006).at(0, 1.0, 0);

    const gold = sdf
      .smoothUnion(0.012, hub, centerProng, sideProng)
      .union(barb)
      .union(buttCap)
      .union(gripRings)
      .union(collar)
      .paintFn((x, y, z, base) => {
        // Slight warm variation so the gold is not flat; darker bronze near the hub.
        const v = noise.fbm(x * 40, y * 40, z * 40, 2) * 0.06;
        const shade = y < 1.2 ? 0.82 : 1;
        return [
          Math.min(1, (base[0] + v) * shade),
          Math.min(1, (base[1] + v * 0.7) * shade),
          base[2] * shade,
        ];
      });
    k.body('gold', gold.at(0, LIFT, 0), {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.006,
      maxTriangles: 2600,
    });
  },
});
