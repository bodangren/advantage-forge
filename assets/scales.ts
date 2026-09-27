import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — merchant balance scale (props/craft-and-trade/scales).
 *
 * Role: trade / merchant set dressing in a cozy chibi hamlet; must read as "scales" at 128 px.
 * Size: 0.50 m tall, ~0.46 m across the beam; stands on y = 0, centred on Y, faces +Z.
 * One idea: two oversize shallow brass pans hang from a chunky turned brass post on a warm
 *   oak plinth — one pan heavy with coins, the other light and slightly higher.
 * Shape language: round dominant (turned post, ball beam tips, round pans and base);
 *   square secondary (the little hub block and the stepped base give a sturdy read).
 * Palette: brass #c9a040 (dominant, metalness 1), honey oak #b5814a / warm brown #8a5a35 /
 *   pale cut #c9a06a / dark walnut #6b4226 (base), gold coins #e0bb60 (accent, focal point).
 * Materials: wood base (roughness 0.82, metalness 0), brass (roughness 0.28, metalness 1),
 *   darker bronze chains (roughness 0.45, metalness 0.9), gold coins (roughness 0.25, 1).
 * Detail: primary post + beam + plinth + pans; secondary rings, rims, hub, coin pile;
 *   tertiary chain beads and wood grain (bump only). Focal point: the coin pile.
 * Rig/animation: none (static prop).
 */

const OAK = rgb('#b5814a');
const OAK_LIGHT = rgb('#c9a06a');
const BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const BRASS = rgb('#c9a040');
const BRASS_DARK = rgb('#9a7322');
const BRONZE = rgb('#8a6626');
const BRONZE_DARK = rgb('#5f4416');
const GOLD = rgb('#e0bb60');
const GOLD_DARK = rgb('#b98a2a');

// Key heights (metres).
const BASE_TOP = 0.045;
const BEAM_Y = 0.405;
const BEAM_HALF = 0.168; // ring / pan centre line
const POST_TOP = 0.428;
const HEAVY_BOTTOM = 0.112; // +X pan (coins) hangs lower
const LIGHT_BOTTOM = 0.122;
const PAN_R = 0.061;
const PAN_H = 0.032;

export default defineAsset({
  name: 'scales',
  description:
    'Merchant balance scale: a turned brass post on an oak plinth, a crossbeam with two hanging brass pans, one pan heavy with coins.',
  detail: 0.007,
  reference: 'docs/item-mockups/scales-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ oak plinth
    // Two chunky rounded steps, flat on the ground. Grain is concentric turned rings.
    const plinth = sdf.smoothUnion(
      0.008,
      sdf.cylinder(0.086, 0.022, 0.008).at(0, 0.011, 0),
      sdf.cylinder(0.062, 0.03, 0.009).at(0, 0.03, 0),
    );
    const woodPaint = (x: number, y: number, z: number) => {
      const r = Math.hypot(x, z);
      const ring = 0.5 + 0.5 * Math.sin(r * 150 + noise.fbm(x * 12, 0, z * 12, 2) * 3);
      const patch = 0.5 + 0.5 * noise.fbm(x * 7, y * 9, z * 7, 2);
      let c = mixRgb(OAK, OAK_LIGHT, 0.1 + 0.28 * ring);
      c = mixRgb(c, BROWN, 0.42 * patch);
      // Walnut shadow in the recess between the two steps.
      const recess = Math.max(0, 1 - Math.abs(y - 0.022) / 0.014);
      c = mixRgb(c, WALNUT, 0.6 * recess);
      // Dark walnut under the bottom chamfer.
      c = mixRgb(c, WALNUT, 0.4 * Math.max(0, (0.016 - y) / 0.016));
      // Pale sun-lit top face.
      c = mixRgb(c, OAK_LIGHT, 0.2 * Math.max(0, (y - 0.03) / 0.016));
      return c;
    };
    k.body('plinth', plinth.paintFn(woodPaint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.009,
      paintWeight: 2,
      maxTriangles: 340,
      bump: (x, y, z) => 0.0014 * noise.fbm(x * 24, y * 60, z * 24, 2),
    });

    // ------------------------------------------------------------------ brass post
    // Turned profile: foot, two soft knops, thin waist, shoulder under the beam.
    const postProfile = profile.polygon(
      [
        [0, BASE_TOP - 0.008],
        [0.024, BASE_TOP],
        [0.021, BASE_TOP + 0.016],
        [0.026, 0.078],
        [0.022, 0.095],
        [0.018, 0.115],
        [0.027, 0.148],
        [0.029, 0.172],
        [0.026, 0.198],
        [0.0225, 0.228],
        [0.020, 0.258],
        [0.019, 0.288],
        [0.020, 0.318],
        [0.023, 0.35],
        [0.021, 0.378],
        [0.018, 0.398],
        [0.0165, 0.412],
        [0.019, POST_TOP - 0.008],
        [0.016, POST_TOP],
      ],
      { smooth: true, samples: 12 },
    );
    const post = sdf.revolve(postProfile);

    // Rounded teardrop finial above the beam.
    const finialProfile = profile.polygon(
      [
        [0, POST_TOP - 0.006],
        [0.018, POST_TOP + 0.002],
        [0.024, POST_TOP + 0.02],
        [0.025, POST_TOP + 0.036],
        [0.019, POST_TOP + 0.055],
        [0.009, POST_TOP + 0.068],
        [0, POST_TOP + 0.072],
      ],
      { smooth: true, samples: 10 },
    );
    const finial = sdf.revolve(finialProfile);

    // ------------------------------------------------------------------ beam
    // Tapered arms with ball tips and a rounded hub block at the centre.
    const arm = sdf
      .cone([-0.014, BEAM_Y, 0], [BEAM_HALF - 0.012, BEAM_Y, 0], 0.017, 0.012)
      .mirror('x', 0);
    const tip = sdf.sphere(0.02).at(BEAM_HALF, BEAM_Y, 0).mirror('x', 0);
    const hub = sdf.box([0.056, 0.052, 0.04], 0.014).at(0, BEAM_Y, 0);

    // Hanging rings under each ball tip (plane vertical, facing +Z).
    const ring = sdf
      .torus(0.0145, 0.0045)
      .rotateX(90)
      .at(BEAM_HALF, BEAM_Y - 0.024, 0)
      .mirror('x', 0);

    // ------------------------------------------------------------------ pans
    // Shallow dish: a rounded cylinder hollowed from the top, leaving a thick
    // floor and a softly rolled rim (clean and cheap to mesh).
    const panAt = (x: number, bottom: number) => {
      const outer = sdf.cylinder(PAN_R, PAN_H, 0.011).at(x, bottom + PAN_H / 2, 0);
      const inner = sdf.cylinder(PAN_R - 0.008, PAN_H + 0.02, 0.006).at(x, bottom + 0.033, 0);
      return outer.subtract(inner);
    };
    const panHeavy = panAt(BEAM_HALF, HEAVY_BOTTOM);
    const panLight = panAt(-BEAM_HALF, LIGHT_BOTTOM);

    // Small rim lugs where the chains attach.
    const lugAt = (x: number, bottom: number, a: number) =>
      sdf
        .sphere(0.007)
        .at(x + Math.cos(a) * (PAN_R - 0.006), bottom + PAN_H + 0.001, Math.sin(a) * (PAN_R - 0.006));
    const lugAngles = [Math.PI / 2, (Math.PI * 7) / 6, (Math.PI * 11) / 6];
    const lugs = sdf.union(
      ...lugAngles.map((a) => lugAt(BEAM_HALF, HEAVY_BOTTOM, a)),
      ...lugAngles.map((a) => lugAt(-BEAM_HALF, LIGHT_BOTTOM, a)),
    );

    const brassPaint = (x: number, y: number, z: number) => {
      const warm = 0.5 + 0.5 * noise.fbm(x * 26, y * 26, z * 26, 2);
      const c = mixRgb(BRASS, BRASS_DARK, 0.2 * warm);
      // Slightly brighter highlight down the smooth forms (reads as polished).
      return mixRgb(c, rgb('#dcb85e'), 0.18 * warm);
    };

    k.body(
      'brass',
      sdf
        .smoothUnion(0.003, post, finial, hub, arm, tip, ring, panHeavy, panLight, lugs)
        .paintFn(brassPaint),
      {
        color: '#c9a040',
        roughness: 0.4,
        metalness: 1,
        detail: 0.0085,
        paintWeight: 2,
        maxTriangles: 2100,
        bump: (x, y, z) => 0.0006 * noise.fbm(x * 40, y * 40, z * 40, 2),
      },
    );

    // ------------------------------------------------------------------ chains
    // Three beaded strands per pan from the ring down to the rim lugs.
    const chainTo = (x: number, bottom: number, a: number) => {
      const top: [number, number, number] = [x, BEAM_Y - 0.036, 0];
      const bot: [number, number, number] = [
        x + Math.cos(a) * (PAN_R - 0.008),
        bottom + PAN_H - 0.001,
        Math.sin(a) * (PAN_R - 0.008),
      ];
      const n = 6;
      const pts: [number, number, number, number][] = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        pts.push([
          top[0] + (bot[0] - top[0]) * t,
          top[1] + (bot[1] - top[1]) * t,
          top[2] + (bot[2] - top[2]) * t,
          0.0052 + 0.0009 * Math.cos(Math.PI * i),
        ]);
      }
      return sdf.chain(pts, 0.003);
    };
    const chains = sdf.union(
      ...lugAngles.map((a) => chainTo(BEAM_HALF, HEAVY_BOTTOM, a)),
      ...lugAngles.map((a) => chainTo(-BEAM_HALF, LIGHT_BOTTOM, a)),
    );
    k.body(
      'chains',
      chains.paintFn((x, y, z) => mixRgb(BRONZE, BRONZE_DARK, 0.4 * (0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2)))),
      {
        color: '#8a6626',
        roughness: 0.45,
        metalness: 0.9,
        detail: 0.0052,
        maxTriangles: 1150,
      },
    );

    // ------------------------------------------------------------------ coins
    // A low pile in the heavy pan plus a few loose coins leaning on the rim.
    const coinFloor = HEAVY_BOTTOM + 0.009;
    // A heaped pile that crests above the pan rim, so the coins read from the front.
    const heap = sdf
      .ellipsoid([0.034, 0.022, 0.034])
      .at(BEAM_HALF, coinFloor + 0.017, 0)
      .intersect(sdf.cylinder(PAN_R - 0.002, 0.06, 0.004).at(BEAM_HALF, coinFloor + 0.03, 0));
    const loose = sdf.union(
      ...Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2 + 0.6;
        const rr = 0.014 + noise.random(i, 5) * 0.016;
        return sdf
          .cylinder(0.0125, 0.0038, 0.0012)
          .rotate(noise.random(i, 1) * 45 - 22, 0, noise.random(i, 2) * 45 - 22)
          .at(
            BEAM_HALF + Math.cos(a) * rr,
            coinFloor + 0.03 + noise.random(i, 3) * 0.014,
            Math.sin(a) * rr,
          );
      }),
    );
    k.body(
      'coins',
      sdf.smoothUnion(0.003, heap, loose).paintFn((x, y, z) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 70, y * 70, z * 70, 2);
        const up = Math.min(1, Math.max(0, (y - coinFloor) / 0.02));
        return mixRgb(mixRgb(GOLD_DARK, GOLD, 0.35 + 0.5 * n), GOLD, 0.25 * up);
      }),
      {
        color: '#e0bb60',
        roughness: 0.25,
        metalness: 1,
        detail: 0.005,
        maxTriangles: 320,
      },
    );
  },
});
