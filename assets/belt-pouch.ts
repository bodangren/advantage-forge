import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - leather belt pouch (equipment/accessories/belt-pouch).
 *
 * Role: hero gear accessory, read at 128 px. Focal point: the brass button.
 * Size: 0.17 m wide, 0.16 m tall, 0.08 m body depth (0.096 with flap), on y = 0, faces +Z.
 * One idea: a neat, puffy leather pouch with a round bottom, a dark lower
 *   panel with zigzag teeth, a scalloped stitched flap, and a pointed strap.
 * Shape language: round dominant, square secondary (brass bar slider).
 * Palette: leather #b5703f, dark leather #6b3a24, cream stitch #e8cfa0, brass #c9a04a.
 * Value plan: mid leather flap and body, dark panel below the flap, bright brass.
 * Materials: leather (rough 0.6), dark leather belt loop (0.68), brass (rough 0.3, metal 1).
 * Detail: welt rim, flap with wavy stitch line, strap with stitched edges,
 *   dome button, bar slider, painted teeth, back belt loop.
 * Rig/animation: none.
 */

const LEATHER = rgb('#b5703f');
const LEATHER_DARK = rgb('#6b3a24');
const THREAD = rgb('#e8cfa0');
const BRASS = '#c9a04a';

const W = 0.17;
const H = 0.16;
const D = 0.08;
const FLAP_W = 0.16;
const FLAP_H = 0.1;
const FLAP_TOP = 0.16;
const TOOTH = rgb('#4e2a18');
const FLAP_CY = FLAP_TOP - FLAP_H / 2;
const FLAP_Z = D / 2 + 0.004;
const STRAP_W = 0.045;
const STRAP_BOT = 0.022;

/** Signed distance (negative inside) to a rounded rectangle centred on (cx, cy). */
const rrDist = (x: number, y: number, cx: number, cy: number, w: number, h: number, r: number): number => {
  const qx = Math.abs(x - cx) - (w / 2 - r);
  const qy = Math.abs(y - cy) - (h / 2 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};

export default defineAsset({
  name: 'belt-pouch',
  description:
    'A puffy leather belt pouch with a round bottom, a dark zigzag-trimmed lower panel, a scalloped stitched flap, a pointed strap with a brass button and bar slider, and a belt loop on the back.',
  detail: 0.005,
  reference: 'docs/item-mockups/belt-pouch-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const body = sdf.extrude(profile.rect([W, H], 0.07), D, 0.016).at(0, H / 2, 0);
    const flap = sdf
      .extrude(profile.rect([FLAP_W, FLAP_H], 0.055), 0.008, 0.003)
      .at(0, FLAP_CY, FLAP_Z);
    const strapProfile = profile.polygon(
      [
        [-STRAP_W / 2, 0.16],
        [STRAP_W / 2, 0.16],
        [STRAP_W / 2, 0.052],
        [0, STRAP_BOT],
        [-STRAP_W / 2, 0.052],
      ],
      { smooth: false },
    );
    const strap = sdf.extrude(strapProfile, 0.008, 0.003).at(0, 0, FLAP_Z + 0.006);
    const shape = sdf.smoothUnion(0.004, body, flap, strap);

    const leatherPaint = (x: number, y: number, z: number): readonly [number, number, number] => {
      let c = LEATHER;
      if (z > 0) {
        const dBody = rrDist(x, y, 0, H / 2, W, H, 0.07);
        const dFlap = rrDist(x, y, 0, FLAP_CY, FLAP_W, FLAP_H, 0.055);
        const onFlapLayer = z > D / 2 + 0.002;
        // dark lower panel inside a welt margin, with zigzag teeth on top edge
        const tooth = Math.abs(((x + 1) / 0.022) % 1 - 0.5) * 2; // 0..1 triangle wave
        void tooth;
        if (!onFlapLayer && dBody < -0.014 && dFlap > 0) c = LEATHER_DARK;
        // body welt stitches
        if (!onFlapLayer && Math.abs(dBody + 0.007) < 0.0012 && Math.sin((x + y) * 330) > 0.1) c = THREAD;
        // wavy flap border stitch
        const wave = 0.0035 * Math.sin((x + y) * 260);
        if (onFlapLayer && Math.abs(dFlap + 0.011 + wave) < 0.0011 && Math.abs(x) > STRAP_W / 2 + 0.004) c = THREAD;
        // strap edge stitches
        const sx = Math.abs(Math.abs(x) - (STRAP_W / 2 - 0.006));
        if (z > FLAP_Z + 0.008 && sx < 0.0012 && y > 0.04 && Math.sin(y * 320) > 0) c = THREAD;
      }
      return c;
    };

    k.body('leather', shape.paintFn(leatherPaint), {
      color: '#b8683a',
      roughness: 0.6,
      metalness: 0,
      detail: 0.0045,
      maxTriangles: 9000,
      bump: (x, y, z) =>
        0.00022 * noise.fbm(x * 40, y * 60, z * 40, 2) + 0.00012 * noise.fbm(x * 120, y * 120, z * 120, 1),
    });

    // Raised zigzag teeth under the flap edge (8 triangles, 0.012 m, 0.003 m proud).
    const toothPts: [number, number][] = [];
    for (const sgn of [-1, 1]) {
      for (const ax of [0.036, 0.048, 0.06, 0.072]) {
        const dx = Math.max(0, ax - (FLAP_W / 2 - 0.055));
        const edge = FLAP_CY - FLAP_H / 2 + 0.055 - Math.sqrt(Math.max(0, 0.055 * 0.055 - dx * dx));
        toothPts.push([sgn * ax, edge]);
      }
    }
    const toothShapes = toothPts.map(([tx, ty]) =>
      sdf
        .extrude(
          profile.polygon(
            [
              [-0.006, 0],
              [0.006, 0],
              [0, 0.012],
            ],
            { smooth: false },
          ),
          0.008,
          0.0015,
        )
        .rotateZ(180)
        .at(tx, ty - 0.001, D / 2),
    );
    k.body('teeth', sdf.union(...toothShapes).paintFn(() => TOOTH), {
      color: '#4e2a18',
      roughness: 0.6,
      metalness: 0,
      detail: 0.003,
      maxTriangles: 1500,
    });

    const loop = sdf
      .box([0.05, 0.1, 0.022], 0.006)
      .subtract(sdf.box([0.034, 0.08, 0.03], 0.004))
      .at(0, 0.09, -(D / 2 + 0.008));
    k.body('leather-dark', loop.paintFn(() => LEATHER_DARK), {
      color: '#6b3a24',
      roughness: 0.68,
      metalness: 0,
      detail: 0.0045,
      maxTriangles: 800,
    });

    const BZ = FLAP_Z + 0.006 + 0.004;
    const button = sdf.sphere(0.016).scale([1, 1, 0.6]).at(0, 0.11, BZ + 0.002);
    const slider = sdf.box([0.06, 0.016, 0.01], 0.003).at(0, 0.074, BZ + 0.002);
    k.body('brass', sdf.union(button, slider), {
      color: BRASS,
      roughness: 0.3,
      metalness: 1,
      detail: 0.0035,
      maxTriangles: 1200,
    });
  },
});
