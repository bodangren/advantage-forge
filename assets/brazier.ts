import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — standing iron brazier (dungeon/light/brazier), reworked.
 *
 * Role: dungeon light prop; warm focal point in a cool stone room. Reads at 128 px.
 * Size: 0.58 x 0.72+ m (flame to about 0.85 m), stands on y = 0, faces +Z.
 * One idea: a shallow iron dish on three slim splayed legs, crowned by one wide flame.
 * Shape language: round dish, rolled rim, ring handles; triangular splay and flame lobes.
 * Palette: iron #3b3a3f (dominant), rust on the rim, coals #2a1a14 with #ff5a1a cracks,
 *   flame gradient #ffd23a / #ffa010 / #ff6a00 / #e8400a (focal point).
 * Materials: iron (metal 0.7, rough 0.5), coals, matte emissive flame.
 * Detail: slim legs with curled scroll feet and a ring brace, bump on iron. Static prop.
 */

const IRON = rgb('#3b3a3f');
const RUST = rgb('#7a4a2c');
const GLOW = rgb('#ff9a3c');
const COAL = '#2a1a14';
const COAL_HOT = rgb('#93401c');
const FLAME = '#ff9a3c';
const FLAME_HOT = '#ffab45';
const FLAME_DEEP = '#c9500f';

const RIM_Y = 0.566;
const LEG_ANGLES = [30, 150, 270];

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

export default defineAsset({
  name: 'brazier',
  description: 'Standing iron tripod brazier with a wide dish of glowing coals and small flames.',
  detail: 0.013,
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ dish
    // Solid outer dish, then a smaller revolve cut out of it for the bowl cavity.
    const outer = sdf.revolve(
      profile.polygon(
        [
          [0, 0.404],
          [0.09, 0.408],
          [0.15, 0.426],
          [0.19, 0.456],
          [0.209, 0.5],
          [0.215, 0.545],
          [0.213, 0.568],
          [0, 0.568],
        ],
        { smooth: true, samples: 8 },
      ),
    );
    const cavity = sdf.revolve(
      profile.polygon(
        [
          [0, 0.452],
          [0.1, 0.455],
          [0.15, 0.473],
          [0.183, 0.512],
          [0.196, 0.552],
          [0.2, 0.595],
          [0, 0.595],
        ],
        { smooth: true, samples: 8 },
      ),
    );
    const bowl = outer.subtract(cavity);
    // Small ring rim: a slim torus that rounds the lip.
    const rim = sdf.torus(0.204, 0.02).at(0, RIM_Y, 0);
    // Two carry rings hanging off the sides; they break the silhouette.
    const lug = (side: number) =>
      sdf.torus(0.037, 0.014).rotateX(90).at(side * 0.241, 0.546, 0);

    // ------------------------------------------------------------------ tripod
    const legParts: ReturnType<typeof sdf.sphere>[] = [];
    for (const deg of LEG_ANGLES) {
      const a = (deg * Math.PI) / 180;
      const cx = Math.cos(a);
      const cz = Math.sin(a);
      legParts.push(sdf.cone([cx * 0.06, 0.42, cz * 0.06], [cx * 0.165, 0.06, cz * 0.165], 0.024, 0.022));
      // Curled scroll foot: a torus ring in the radial vertical plane, outside the leg.
      legParts.push(sdf.torus(0.03, 0.015).rotateX(90).at(0.192, 0.046, 0).rotateY(-deg));
    }
    const brace = sdf.torus(0.117, 0.014).at(0, 0.22, 0);
    const hub = sdf.sphere(0.05).at(0, 0.40, 0);
    const undercarriage = sdf.smoothUnion(0.012, hub, brace, ...legParts);

    const iron = sdf
      .union(bowl, rim, lug(1), lug(-1), undercarriage)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z, base) => {
        // Rust streaks that run down the iron (stretched vertically).
        const p = noise.fbm(x * 20, y * 6, z * 20, 3);
        // Firelight glow: only the lip of the dish picks up warm light.
        const g = clamp01((y - 0.53) / 0.05);
        let c = mixRgb(base, RUST, 0.45 * clamp01((p - 0.25) * 2.4) * (1 - 0.5 * g) * (y > 0.5 ? 1.5 : 0.4));
        c = mixRgb(c, GLOW, 0.4 * g * g);
        return c;
      });
    k.body('iron', iron, {
      color: '#3b3a3f',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.008,
      paintWeight: 2,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 55, y * 55, z * 55, 2),
      maxTriangles: 3400,
    });

    // ------------------------------------------------------------------ coals
    // A glowing coal core inside the dark bed, seen through the lump gaps.
    const emberProfile = profile.polygon(
      [
        [0, 0.453],
        [0.09, 0.456],
        [0.128, 0.473],
        [0.115, 0.507],
        [0.109, 0.548],
        [0.106, 0.586],
        [0, 0.586],
      ],
      { smooth: true, samples: 6 },
    );
    const embers = sdf
      .revolve(emberProfile)
      .displace(0.011, (x, y, z) => noise.fbm(x * 24, y * 24, z * 24, 2));
    k.body('embers', embers, {
      // Very dark ember base so the emissive glow reads saturated, not washed.
      color: '#ff5a1a',
      roughness: 0.95,
      metalness: 0,
      emissive: '#ff5a1a',
      emissiveIntensity: 0.5,
      detail: 0.014,
      maxTriangles: 300,
    });

    // Dark lumps mounded over the bed, with glowing seams between them.
    const lumps: [number, number, number, number][] = [
      [0, 0.578, 0, 0.048],
      [0.105, 0.573, 0.02, 0.045],
      [-0.09, 0.576, 0.04, 0.043],
      [0.031, 0.571, -0.093, 0.045],
      [-0.06, 0.568, -0.08, 0.041],
      [0.118, 0.566, -0.031, 0.038],
      [-0.118, 0.565, 0, 0.038],
      [0.05, 0.573, 0.1, 0.047],
      [-0.045, 0.566, 0.115, 0.041],
      [0.135, 0.567, 0.075, 0.035],
      [-0.13, 0.567, 0.08, 0.037],
      [0.007, 0.571, 0.115, 0.036],
      [-0.074, 0.571, 0.088, 0.035],
      [0.08, 0.571, 0.083, 0.035],
    ];
    // Dark bed that fills the dish and holds the lumps up (the glow plate
    // pokes through it in the gaps between lumps).
    const bed = sdf.revolve(
      profile.polygon(
        [
          [0, 0.453],
          [0.1, 0.457],
          [0.15, 0.478],
          [0.164, 0.512],
          [0.166, 0.548],
          [0.15, 0.552],
          [0, 0.552],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const coals = sdf
      .smoothUnion(
        0.004,
        bed,
        ...lumps.map(([x, y, z, r]) => sdf.sphere(r).at(x, y, z)),
      )
      .displace(0.005, (x, y, z) => noise.fbm(x * 42, y * 42, z * 42, 2))
      .paintFn((x, y, z, base) => {
        // Hot only where the lumps meet the bed; the bed itself stays dark.
        const hot = clamp01((y - 0.545) / 0.02) * clamp01((0.615 - y) / 0.07);
        const grain = 0.5 + 0.5 * noise.fbm(x * 34, y * 34, z * 34, 2);
        return mixRgb(base, COAL_HOT, 0.45 * hot * grain + 0.25 * hot);
      });
    k.body('coals', coals, {
      color: COAL,
      roughness: 0.9,
      metalness: 0,
      detail: 0.011,
      paintWeight: 2,
      maxTriangles: 1500,
    });

    // ------------------------------------------------------------------ flames
    // One wide wavy mass with five curling lobes, one body, one gradient.
    const lobe = (pts: [number, number, number, number][]) => sdf.chain(pts, 0.02);
    const flames = sdf
      .smoothUnion(
        0.03,
        sdf.ellipsoid([0.15, 0.05, 0.14]).at(0, 0.615, 0),
        lobe([[0, 0.6, 0, 0.085], [0.02, 0.69, 0.01, 0.06], [0.05, 0.77, 0, 0.038], [0.09, 0.85, -0.01, 0.014]]),
        lobe([[0.08, 0.6, 0.03, 0.06], [0.11, 0.66, 0.04, 0.045], [0.15, 0.72, 0.03, 0.022]]),
        lobe([[-0.08, 0.6, 0.02, 0.06], [-0.11, 0.67, 0.03, 0.045], [-0.14, 0.74, 0.02, 0.022]]),
        lobe([[0.02, 0.6, 0.09, 0.055], [0.0, 0.66, 0.11, 0.04], [-0.03, 0.71, 0.11, 0.02]]),
        lobe([[-0.02, 0.6, -0.09, 0.055], [0.01, 0.66, -0.1, 0.04], [0.04, 0.71, -0.1, 0.02]]),
      )
      .displace(0.008, (x, y, z) => noise.fbm(x * 14, y * 10, z * 14, 2))
      .paintFn((x, y, z, _base) => {
        const t = clamp01((y - 0.58) / 0.27);
        const rad = clamp01(Math.hypot(x, z) / 0.16);
        const u = clamp01(t * 0.9 + rad * 0.35 * t);
        const yellow = rgb('#ffd23a');
        const orange = rgb('#ffa010');
        const deep = rgb('#ff6a00');
        const tip = rgb('#e8400a');
        let c = u < 0.3 ? mixRgb(yellow, orange, u / 0.3) : mixRgb(orange, deep, clamp01((u - 0.3) / 0.3));
        if (u >= 0.6) c = mixRgb(deep, tip, clamp01((u - 0.6) / 0.3));
        // Yellow along the axis.
        return mixRgb(c, yellow, 0.5 * (1 - rad) * (1 - t));
      });
    k.body('flames', flames, {
      color: '#ffa010',
      roughness: 0.95,
      metalness: 0,
      emissive: '#ff5a00',
      emissiveIntensity: 0.25,
      detail: 0.01,
      paintWeight: 2,
      maxTriangles: 1500,
    });
  },
});
