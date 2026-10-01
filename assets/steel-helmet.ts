import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — steel great helm (equipment/armor/steel-helmet).
 *
 * Role: smithy pickup, icon, and avatar head piece. The opening, crest, and rim must read at 128 px.
 * Size: fit shape 1x (equipment-fit contract), whole build scaled by FIT = 1.36: inner cavity 0.215 m radius (head 0.205 + 0.01), about 0.49 wide, 0.45 tall, on its rim at y = 0, face toward +Z.
 * One idea: a rounded steel bucket with a raised crest and an open face framed by two hooks.
 * Shape language: round dominant (dome, rim, crest tube, hook bars). The opening is the crisp accent.
 * Palette: iron shell #4a4f55, shadow #363a3f, highlight #a8acb1. Bright trim is steel
 *   edge #c8ccd2. Hook studs are walnut #6b4226 so they read on the bright bar.
 * Materials: worn iron (roughness 0.5, metalness 0.7) and polished steel trim
 *   (roughness 0.32, metalness 0.9). Displacement on the metal stays under 1.2 mm.
 * Detail: primary bucket shell; secondary crest, brow band, rim, cheek hooks, nasal point;
 *   tertiary breathing holes, studs, crown highlights. Focal point: the face opening.
 * Rig: none. Static item.
 */

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');
const STEEL = rgb('#c8ccd2');

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Brow band centre. The face opening ends just under this band.
// Uniform fit scale of the whole build about the origin (rim centre on y = 0).
const FIT = 1.36;

const BAND_Y = 0.146;

export default defineAsset({
  name: 'steel-helmet',
  description:
    'Polished steel helm for a chibi hero: a rounded bucket, an open face framed by two curled hooks, breathing holes, a raised crest, and bright steel trim.',
  detail: 0.005,
  reference: 'docs/item-mockups/steel-helmet-mock.jpg',
  texture: { size: 1024 },
  // The origin sits 2.7 cm under the old 0.19, so the brow band clears the large chibi eyes.
  equip: { slot: 'head', origin: [0, 0.163, 0], hides: ['hair'] },

  build(k) {
    // ------------------------------------------------------------------ shell
    // One closed profile: up the outside, over the crown, down the inside.
    // The result is a rounded bucket, open at the bottom, with a 12 mm wall.
    const shellProfile = profile.polygon(
      [
        [0.156, 0.0],
        [0.164, 0.024],
        [0.17, 0.058],
        [0.172, 0.1],
        [0.17, 0.142],
        [0.156, 0.19],
        [0.13, 0.232],
        [0.09, 0.268],
        [0.042, 0.294],
        [0.0, 0.306],
        [0.0, 0.294],
        [0.034, 0.282],
        [0.078, 0.256],
        [0.116, 0.222],
        [0.142, 0.184],
        [0.156, 0.14],
        [0.158, 0.098],
        [0.156, 0.056],
        [0.15, 0.022],
        [0.142, 0.0],
      ],
      { smooth: true, samples: 8 },
    );
    const outerProfile = profile.polygon(
      [
        [0.156, -0.01],
        [0.164, 0.024],
        [0.17, 0.058],
        [0.172, 0.1],
        [0.17, 0.142],
        [0.156, 0.19],
        [0.13, 0.232],
        [0.09, 0.268],
        [0.042, 0.294],
        [0.0, 0.306],
      ],
      { smooth: true, samples: 8 },
    );
    const innerProfile = profile.polygon(
      [
        [0.142, -0.01],
        [0.15, 0.022],
        [0.156, 0.056],
        [0.158, 0.098],
        [0.156, 0.14],
        [0.142, 0.184],
        [0.116, 0.222],
        [0.078, 0.256],
        [0.034, 0.282],
        [0.0, 0.294],
      ],
      { smooth: true, samples: 8 },
    );
    const domeOuter = sdf.revolve(outerProfile);
    const domeInner = sdf.revolve(innerProfile);

    // Face opening, as in the mock: the whole front between the hooks, from the brow band down
    // to the bottom edge. Worn, it shows both eyes. The cutter stops before the back wall.
    const slit = sdf.box([0.24, 0.16, 0.24], 0.03).at(0, 0.05, 0.16);

    // Breathing holes: two in the brow band and two on the sides.
    const radialHole = (yawDeg: number, y: number, radius: number) => {
      const a = (yawDeg * Math.PI) / 180;
      const s = Math.sin(a);
      const c = Math.cos(a);
      return sdf.capsule([s * 0.26, y, c * 0.26], [s * 0.08, y, c * 0.08], radius);
    };
    const browHoles = sdf.union(radialHole(62, BAND_Y, 0.007), radialHole(-62, BAND_Y, 0.007));
    const cheekHoles = sdf.union(
      radialHole(98, 0.086, 0.0062),
      radialHole(-98, 0.086, 0.0062),
    );
    const holes = sdf.union(browHoles, cheekHoles);

    const shell = sdf
      .revolve(shellProfile)
      .smoothSubtract(0.004, slit)
      .subtract(holes)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .displace(0.0011, (x, y, z) => {
        const fade = clamp01((y - 0.018) / 0.028);
        return fade * noise.fbm(x * 10, y * 8, z * 10, 2);
      })
      .paintFn((x, y, z) => {
        const up = clamp01((y - 0.02) / 0.24);
        const crown = clamp01((y - 0.17) / 0.1);
        const shine = 0.5 + 0.5 * noise.fbm(x * 16 + 2, y * 14, z * 16 - 1, 3);
        const front = clamp01((z + 0.02) / 0.14);
        let c = mixRgb(IRON_DARK, IRON, 0.4 + 0.6 * up);
        c = mixRgb(c, IRON_HI, (0.22 + 0.4 * crown) * (0.35 + 0.65 * shine));
        c = mixRgb(c, STEEL, 0.55 * crown * front * clamp01((shine - 0.1) / 0.9));
        return c;
      })
      .paintWhere(domeInner.round(0.005), IRON_DARK, 0.01)
      .paintWhere(slit, IRON_DARK, 0.008)
      .scale(FIT);

    k.body('shell', shell, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      textureDensity: 2,
      paintWeight: 2,
      maxError: 0.0018,
      bump: (x, y, z) => 0.00035 * noise.fbm(x * 70, y * 70, z * 70, 2),
    });

    // ------------------------------------------------------------------ polished trim
    // Round brow band. torus() already lies in the XZ plane, so it rings the helm.
    // Outer radius stays inside the rim so the helm is 0.36 m wide.
    const band = sdf.torus(0.16, 0.015).at(0, BAND_Y, 0).subtract(browHoles);

    // Chunky round rim. Outer radius 0.18 m, so the helm is 0.36 m wide.
    // The bottom of the tube sits on y = 0.
    // The rim stops at the hooks: the face opening reaches the bottom edge.
    const rim = sdf
      .torus(0.163, 0.017)
      .at(0, 0.017, 0)
      .subtract(sdf.box([0.22, 0.08, 0.2]).at(0, 0.017, 0.17));

    // Raised crest. Points follow the known dome profile, pushed 9 mm outward, so the
    // bar sits on the crown instead of bridging over it. Front runs to the back.
    const meridian: Array<[number, number]> = [
      [0.168, 0.15],
      [0.158, 0.172],
      [0.138, 0.2],
      [0.11, 0.228],
      [0.078, 0.256],
      [0.044, 0.28],
      [0.016, 0.298],
      [0.0, 0.306],
      [-0.016, 0.298],
      [-0.044, 0.28],
      [-0.078, 0.256],
      [-0.11, 0.228],
      [-0.138, 0.2],
      [-0.158, 0.172],
      [-0.168, 0.15],
    ];
    const crestPts = meridian.map(([u, v]) => {
      const side = u < 0 ? -1 : 1;
      const au = Math.abs(u);
      const dy = v - 0.15;
      const len = Math.hypot(au, dy) || 1;
      const ou = au + (au / len) * 0.005;
      const ov = v + (dy / len) * 0.005;
      return [0, ov, side * ou, 0.014] as const;
    });
    const crest = sdf.chain(crestPts, 0.014);

    // Cheek hooks, as in the mock: each hook trims one side of the face opening, from the rim up,
    // and curls outward at the top. Points are probed onto the uncut dome so the bar sits on the
    // iron, not in it. The bar stays outside the eyes when the helm is worn. The last point is the
    // bottom tip with the stud.
    const hookXY: Array<[number, number, number]> = [
      [0.158, 0.094, 0.012],
      [0.148, 0.112, 0.013],
      [0.132, 0.108, 0.014],
      [0.124, 0.082, 0.014],
      [0.122, 0.05, 0.014],
      [0.12, 0.024, 0.013],
    ];
    const hookPts = hookXY.map(([x, y, r]) => {
      const hit = sdf.raycast(domeOuter, [x, y, 0.5], [0, 0, -1]);
      const p = hit ?? [x, y, 0.16];
      const at = sdf.surfacePoint(domeOuter, p, 0.008);
      return [at[0], at[1], at[2], r] as const;
    });
    const hooks = sdf.chain(hookPts, 0.01).mirror('x', 0);

    // Short nasal point. It hangs from the brow into the top of the face opening.
    const nasal = sdf
      .extrude(
        profile.polygon(
          [
            [-0.028, 0.018],
            [0.028, 0.018],
            [0.016, -0.004],
            [0.0, -0.026],
            [-0.016, -0.004],
          ],
          { smooth: true, samples: 4 },
        ),
        0.018,
        0.005,
      )
      .at(0, 0.138, 0.178);

    const trim = sdf
      .smoothUnion(0.005, band, crest, nasal, hooks)
      .smoothUnion(0.003, rim)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .displace(0.0004, (x, y, z) => {
        const fade = clamp01((y - 0.024) / 0.02);
        return fade * noise.fbm(x * 8, y * 6, z * 8, 2);
      })
      .paintFn((x, y, z) => {
        const up = clamp01((y - 0.08) / 0.22);
        const n = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 2);
        return mixRgb(STEEL, IRON_HI, 0.1 * n * (1 - up));
      })
      .scale(FIT);

    k.body('trim', trim, {
      color: '#c8ccd2',
      roughness: 0.32,
      metalness: 0.9,
      detail: 0.005,
      textureDensity: 1.4,
      paintWeight: 1.5,
      maxError: 0.0017,
      bump: (x, y, z) => 0.0002 * noise.fbm(x * 55, y * 55, z * 55, 2),
    });

    // Studs at the hook tips. Walnut pegs, as in the mock, so they read on the steel bar.
    const tip = hookPts[hookPts.length - 1]!;
    const studs = sdf
      .sphere(0.011)
      .at(tip[0] + 0.004, tip[1] - 0.008, tip[2] + 0.012)
      .mirror('x', 0)
      .scale(FIT);
    k.body('studs', studs, {
      color: '#6b4226',
      roughness: 0.55,
      metalness: 0.15,
      detail: 0.004,
      maxError: 0.001,
    });
  },
});
