import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — standing iron brazier (dungeon/light/brazier).
 *
 * Role: dungeon light prop; the warm focal point in a cool stone room. Reads at 128 px.
 * Size: 0.71 m tall with flame, 0.45 m wide at the feet, stands on y = 0, faces +Z.
 * One idea: a wide shallow iron dish riding high on three splayed legs over live coals.
 * Shape language: round dominant (dish, rim ring, side lugs), triangular secondary
 *   (tripod splay, flame tongues) for a stable, dangerous read.
 * Palette: cool dark iron #3a3f47 (dominant), rust #7a4a2c (secondary),
 *   warm accent #ff9a3c on the rim glow, coals and flames (focal point).
 * Materials: worn iron (metalness 0.8, roughness 0.55), charcoal (roughness 0.9),
 *   ember bed and flames emissive #ff9a3c.
 * Detail: primary dish + tripod; secondary rim ring, side lugs, coal lumps;
 *   tertiary rust patches and firelight paint. Rig/animation: none (static prop).
 */

const IRON = rgb('#3a3f47');
const RUST = rgb('#7a4a2c');
const GLOW = rgb('#ff9a3c');
const COAL = '#2a1f1a';
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
    const rim = sdf.torus(0.204, 0.015).at(0, RIM_Y, 0);
    // Two carry rings hanging off the sides; they break the silhouette.
    const lug = (side: number) =>
      sdf.torus(0.037, 0.014).rotateX(90).at(side * 0.241, 0.546, 0);

    // ------------------------------------------------------------------ tripod
    const legParts: ReturnType<typeof sdf.sphere>[] = [];
    for (const deg of LEG_ANGLES) {
      const a = (deg * Math.PI) / 180;
      const cx = Math.cos(a);
      const cz = Math.sin(a);
      legParts.push(
        sdf.cone([cx * 0.05, 0.37, cz * 0.05], [cx * 0.155, 0.08, cz * 0.155], 0.064, 0.055),
      );
      // Chunky foot pad, long axis pointing outward.
      legParts.push(
        sdf.box([0.14, 0.082, 0.115], 0.028).rotateY(-deg).at(cx * 0.16, 0.041, cz * 0.16),
      );
    }
    const hub = sdf.sphere(0.085).at(0, 0.34, 0);
    const undercarriage = sdf.smoothUnion(0.03, hub, ...legParts);

    const iron = sdf
      .union(bowl, rim, lug(1), lug(-1), undercarriage)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z, base) => {
        // Rust streaks that run down the iron (stretched vertically).
        const p = noise.fbm(x * 20, y * 6, z * 20, 3);
        // Firelight glow: only the lip of the dish picks up warm light.
        const g = clamp01((y - 0.53) / 0.05);
        let c = mixRgb(base, RUST, 0.6 * clamp01((p - 0.12) * 2.4) * (1 - 0.5 * g));
        c = mixRgb(c, GLOW, 0.4 * g * g);
        return c;
      });
    k.body('iron', iron, {
      color: '#3a3f47',
      roughness: 0.55,
      metalness: 0.8,
      detail: 0.013,
      paintWeight: 2,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 55, y * 55, z * 55, 2),
      maxTriangles: 2080,
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
      color: '#5a1c06',
      roughness: 0.95,
      metalness: 0,
      emissive: '#ff9a3c',
      emissiveIntensity: 1.5,
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
      maxTriangles: 800,
    });

    // ------------------------------------------------------------------ flames
    // Two tapered tongues: one tall centre flame, one small side flame.
    const flames = sdf
      .chain(
        [
          [-0.012, 0.572, 0.012, 0.05],
          [0.018, 0.632, -0.01, 0.03],
          [-0.01, 0.68, 0.01, 0.016],
          [0.014, 0.714, -0.004, 0.009],
        ],
        0.013,
      )
      .union(
        sdf.chain(
          [
            [0.09, 0.568, -0.05, 0.03],
            [0.108, 0.614, -0.046, 0.016],
            [0.1, 0.652, -0.05, 0.009],
          ],
          0.011,
        ),
      )
      .paintFn((x, y, z, _base) => {
        const t = clamp01((y - 0.56) / 0.15);
        return mixRgb(rgb(FLAME_HOT), rgb(FLAME_DEEP), t);
      });
    k.body('flames', flames, {
      color: FLAME,
      roughness: 0.35,
      metalness: 0,
      emissive: '#ff9a3c',
      emissiveIntensity: 2,
      detail: 0.01,
      maxTriangles: 620,
    });
  },
});
