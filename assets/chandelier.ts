import { defineAsset, sdf, profile, rgb, mixRgb } from '../src/index.js';

// Design note (9 lines):
// - Role: hanging candle-ring chandelier for the tavern hall; the overhead warm anchor. Reads at 128 px.
// - Size: ~0.6 m ring diameter, ring center at y = 0, chain rises +Y to ~0.55 m. Faces +Z.
// - The one idea: a dark-iron ring of six lit candles — six warm dots in a dark circle.
// - Shape language: round dominant (ring, curved arms, drip cups, flame teardrops); no sharp edges.
// - Palette: dark iron #4a4f55 (ring, arms, cups, chain), beeswax cream #f3dfa4 stubs,
//   flame amber #ffb255 with hot core #fff1c2. Dark metal vs bright flames = focal contrast.
// - Materials: iron (metal 0.7, rough 0.5), wax (matte), flame (strong emissive).
// - Details: central hub + finial ball, six S-curved arms, six revolved drip cups, thin chain + eye.
// - Rig/animation: none (static hanging prop).

const IRON = '#4a4f55';
const WAX = '#f3dfa4';
const FLAME = '#ffb255';
const FLAME_HOT = '#fff1c2';

const RING_R = 0.27; // ring major radius (0.582 m outer diameter)
const RING_TUBE = 0.021; // ~0.04 m thick ring bar
const CUP_Y = 0.03; // arm end height where cups sit
const CANDLE_TOP = 0.124; // wax top (cup base 0.03 + cup 0.034 + candle 0.06)

export default defineAsset({
  name: 'chandelier',
  description: 'Hanging dark-iron candle-ring chandelier with six lit beeswax candles.',
  detail: 0.006,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ ironwork
    // Six S-curved arms: leave the hub low, dip, then curl up to the ring.
    const armPoints: readonly (readonly [number, number, number, number])[] = [
      [0.03, -0.01, 0, 0.028],
      [0.1, -0.055, 0, 0.022],
      [0.18, -0.05, 0, 0.017],
      [0.245, -0.012, 0, 0.014],
      [0.272, CUP_Y, 0, 0.013],
    ];
    const arms = [0, 60, 120, 180, 240, 300].map((deg) => sdf.chain(armPoints, 0.02).rotateY(deg));
    // Hub + finial: the arms grow from a soft central boss with a dangling ball.
    const hub = sdf.smoothUnion(
      0.016,
      sdf.sphere(0.042).at(0, 0, 0),
      sdf.sphere(0.021).at(0, -0.062, 0),
      ...arms,
    );
    // Drip cup: small revolved dish at each arm end.
    const cupProfile = profile.polygon(
      [
        [0, 0],
        [0.024, 0.002],
        [0.036, 0.012],
        [0.042, 0.026],
        [0.042, 0.034],
      ],
      { smooth: true },
    );
    const cupAt = (deg: number) => {
      const a = (deg * Math.PI) / 180;
      return sdf.revolve(cupProfile).at(RING_R * Math.cos(a), CUP_Y, RING_R * Math.sin(a));
    };
    const cups = [0, 60, 120, 180, 240, 300].map(cupAt);
    // Ring + chain: thin dark line rising to a hanging eye.
    const ring = sdf.torus(RING_R, RING_TUBE).at(0, 0, 0);
    const chain = sdf.union(
      sdf.capsule([0, 0.015, 0], [0, 0.5, 0], 0.009),
      sdf.torus(0.02, 0.007).rotateX(90).at(0, 0.515, 0),
    );
    const iron = sdf.union(hub, ring, ...cups, chain);
    k.body('iron', iron, { color: IRON, roughness: 0.5, metalness: 0.7, detail: 0.014 });

    // ------------------------------------------------------------------ candles
    const candleAt = (deg: number) => {
      const a = (deg * Math.PI) / 180;
      return sdf.cylinder(0.015, 0.06, 0.006).at(RING_R * Math.cos(a), 0.094, RING_R * Math.sin(a));
    };
    const candles = [0, 60, 120, 180, 240, 300].map(candleAt);
    k.body('candles', sdf.union(...candles), { color: WAX, roughness: 0.6, detail: 0.008 });

    // ------------------------------------------------------------------ flames
    // Teardrop: round belly + smaller tip, pale hot core at the bottom.
    const flameOne = sdf.smoothUnion(
      0.014,
      sdf.sphere(0.02).at(0, 0.021, 0),
      sdf.sphere(0.011).at(0, 0.043, 0),
    );
    const flameAt = (deg: number) => {
      const a = (deg * Math.PI) / 180;
      return flameOne.at(RING_R * Math.cos(a), CANDLE_TOP, RING_R * Math.sin(a));
    };
    const flames = [0, 60, 120, 180, 240, 300].map(flameAt);
    const flame = sdf
      .union(...flames)
      .paintFn((_x, y, _z, _base) => {
        const t = Math.max(0, Math.min(1, (y - CANDLE_TOP - 0.004) / 0.048));
        return mixRgb(rgb(FLAME_HOT), rgb(FLAME), t);
      });
    k.body('flames', flame, {
      color: FLAME,
      roughness: 0.4,
      emissive: FLAME,
      emissiveIntensity: 2.2,
      detail: 0.007,
      textureDensity: 2,
    });
  },
});
