import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — leather cuirass on an armor stand (equipment/armor/leather-armor).
 *
 * Role: shop display piece / equipment item for the Chibi Quest hamlet; must read at 128 px.
 * Size: stand 1.11 m tall; torso shell 0.56 m wide, 0.64 m tall, 0.44 m deep (chest armor
 *   contract v2, 2x the hero torso); on y = 0, front toward +Z. Hem height above base 0.34 m.
 * One idea: a smooth brown leather vest with a big pointed chest flap, crossed shoulder straps
 *   and rolled two-lame pauldrons, like a clay toy armor, on a round wooden disc base.
 * Shape language: round dominant (rolled lames, rounded flap), square secondary (belt, peplum).
 * Palette (60/30/10): leather #a0613a, dark edge #6e3f22, strap #8a5230, walnut #4a2c17 (stand),
 *   cream stitch #e6cfa3; brass #d9a93a buckles and studs (accent); iron #3d4047 side buckles.
 * Materials: walnut (rough 0.85), leather (0.65), iron (0.55, metal 0.7), brass (0.3, metal 1).
 * Detail: peplum skirt with a shallow front point and stitched hem; two lames and a strap per
 *   shoulder; two crossed chest straps with brass buckles; diagonal chest flap with stitching;
 *   belt with 6 brass studs and a brass buckle. Focal point: the chest flap and belt buckle.
 * Rig/animation: none (static display prop).
 */

const LEATHER = rgb('#a0613a');
const EDGE = rgb('#6e3f22');
const STRAPC = rgb('#8a5230');
const STITCH = rgb('#e6cfa3');
const WALNUT = rgb('#4a2c17');
const WALNUT_DARK = rgb('#33200f');
const WALNUT_LIGHT = rgb('#5f3a1f');
const IRON = rgb('#6e3f22'); // side clips: brown leather loops
const BRASS = rgb('#d9a93a');

const Y_HEM = 0.34; // vest bottom hem above the stand base
const BELT_Y = 0.41; // 0.07 m above the vest hem
const STRAP_Y = 0.465;

const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Distance from (x, y) to a segment, plus the arc coordinate along it.
function seg(x: number, y: number, x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  let t = ((x - x0) * dx + (y - y0) * dy) / (len * len);
  t = Math.max(0, Math.min(1, t));
  return { d: Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy)), u: t * len };
}


type Pt = readonly [number, number];

// Flap outline (x, y in meters on the chest): a leaf with a rounded point at the lower right.
const FLAP: readonly Pt[] = [
  [-0.2, 0.74],
  [-0.14, 0.775],
  [-0.04, 0.77],
  [0.06, 0.74],
  [0.14, 0.7],
  [0.19, 0.65],
  [0.185, 0.6],
  [0.14, 0.565],
  [0.08, 0.555],
  [0.0, 0.575],
  [-0.08, 0.62],
  [-0.15, 0.68],
];

// Strap quad from (x0, y0) to (x1, y1) with width w.
function strapPoly(x0: number, y0: number, x1: number, y1: number, w: number): Pt[] {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = (-(y1 - y0) / len) * (w / 2);
  const ny = ((x1 - x0) / len) * (w / 2);
  return [
    [x0 + nx, y0 + ny],
    [x1 + nx, y1 + ny],
    [x1 - nx, y1 - ny],
    [x0 - nx, y0 - ny],
  ];
}

const STRAP_A: readonly [number, number, number, number] = [-0.12, 1.0, 0.045, 0.7];

// Hem line of the peplum in local y (below the vest hem): shallow point at the front center.
const hemY = (x: number) => -0.05 - 0.035 * Math.max(0, 1 - Math.abs(x) / 0.3);

export default defineAsset({
  name: 'leather-armor',
  description:
    'Brown leather cuirass with pauldrons, a pointed chest flap, crossed straps, and a peplum, on a walnut armor stand.',
  detail: 0.005,
  reference: 'docs/item-mockups/leather-armor-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'chest', fitScale: 2, origin: [0, Y_HEM, 0], hides: ['undershirt'], displayOnly: ['stand'] },

  build(k) {
    // ------------------------------------------------------------------ stand (walnut)
    const base = sdf.cylinder(0.2, 0.06, 0.02).at(0, 0.03, 0);
    const post = sdf.cylinder(0.032, 1.06, 0.01).at(0, 0.53, 0);
    const crossbar = sdf.cylinder(0.02, 0.6, 0.008).rotateZ(90).at(0, 0.93, 0);
    const knob = sdf.sphere(0.036).at(0, 1.075, 0);
    const wood = sdf.union(base, post, crossbar, knob).paintFn((x, y, z, c0) => {
      const patch = 0.5 + 0.5 * noise.fbm(x * 6, y * 6, z * 6, 2);
      const streak = 0.5 + 0.5 * noise.fbm(x * 18, y * 3, z * 18, 2);
      let c = mixRgb(c0, WALNUT_LIGHT, 0.28 * patch);
      c = mixRgb(c, WALNUT_DARK, 0.4 * streak);
      c = mixRgb(c, rgb('#9a6a3c'), 0.7 * (1 - ss(0.055, 0.075, y)) * ss(0.03, 0.05, Math.hypot(x, z)));
      return c;
    });
    k.body('stand', wood, {
      color: WALNUT,
      roughness: 0.85,
      metalness: 0,
      detail: 0.008,
      maxTriangles: 1400,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 24, y * 5, z * 24, 2),
    });

    // ------------------------------------------------------------------ vest shell (leather)
    const torso = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.636],
            [0.14, 0.636],
            [0.21, 0.576],
            [0.25, 0.496],
            [0.26, 0.376],
            [0.248, 0.276],
            [0.26, 0.196],
            [0.276, 0.096],
            [0.28, 0.026],
            [0.264, 0],
            [0, 0],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78])
      .at(0, Y_HEM, 0);
    const vNeck = sdf
      .extrude(
        profile.polygon([
          [-0.13, 1.06],
          [0.13, 1.06],
          [0, 0.87],
        ]),
        0.5,
        0.006,
      )
      .at(0, 0, 0.15);
    const armHole = sdf.cylinder(0.09, 0.28, 0.01).rotateZ(90).scale([1, 1, 1.2]).at(0.29, 0.83, 0);
    const shell = torso.smoothSubtract(0.004, vNeck, armHole, armHole.mirror('x', 0));

    // Peplum: a flared ring below the hem; the front half is cut by a shallow V so it ends in a point.
    const ring = (lo: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0.262, 0.02],
            [0.288, 0.02],
            [0.318, lo],
            [0.296, lo],
          ]),
        )
        .scale([1, 1, 0.78])
        .at(0, Y_HEM, 0);
    const vCut = sdf
      .extrude(
        profile.polygon([
          [-0.5, 0.2],
          [0.5, 0.2],
          [0.5, hemY(0.5) - 0.0],
          [0.3, hemY(0.3)],
          [0, hemY(0)],
          [-0.3, hemY(0.3)],
          [-0.5, hemY(0.5)],
        ]),
        0.5,
      )
      .at(0, Y_HEM, 0.25);
    const peplum = sdf
      .union(ring(-0.05), ring(-0.09).intersect(vCut))
      .round(0.004);

    // Pauldrons: two overlapping rolled lames per side (domed caps), plus a short strap over them.
    const lame = (rx: number, ry: number, rz: number) => {
      const outer = sdf.ellipsoid([rx, ry, rz]);
      const inner = sdf.ellipsoid([rx - 0.012, ry - 0.012, rz - 0.012]);
      const cap = outer
        .subtract(inner)
        .intersect(sdf.box([rx * 2.4, ry * 2, rz * 2.4]).at(0, ry * 0.8 - 0.002, 0));
      const rim = sdf.torus(1, 0.011).scale([rx - 0.004, 1, rz - 0.004]).at(0, 0.0, 0);
      return cap.union(rim).round(0.003);
    };
    const lameLow = lame(0.13, 0.075, 0.13).rotateZ(-40).at(0.25, 0.88, 0);
    const lameHigh = lame(0.095, 0.055, 0.105).rotateZ(-22).at(0.2, 0.96, 0);
    const pads = sdf.union(lameLow, lameHigh);
    const padsBoth = pads.mirror('x', 0);

    // Hugging overlays: thin shells of the vest cut by an outline, so they follow the curved front.
    const front = sdf.box([1, 1.4, 0.5]).at(0, 0.7, 0.31);
    const hugShell = (grow: number) => shell.round(grow).subtract(shell.round(-0.004));
    const flapOutline = sdf.extrude(profile.polygon([...FLAP]), 1, 0.01).at(0, 0, 0.5);
    const flap = hugShell(0.012).intersect(flapOutline).intersect(front);

    const leatherPaint = (x: number, y: number, z: number, base: typeof LEATHER) => {
      let c = base;
      const mottle = 0.5 + 0.5 * noise.fbm(x * 14, y * 14, z * 14, 2);
      c = mixRgb(c, EDGE, 0.06 * mottle);
      c = mixRgb(c, EDGE, 0.3 * ss(-0.03, -0.18, z)); // shaded back
      c = mixRgb(c, EDGE, 0.5 * ss(0.23, 0.28, Math.abs(x)) * (1 - ss(0.0, 0.02, y - 0.34))); // side edge
      // Dark edge bands on the hem, neckline, and arm holes.
      c = mixRgb(c, EDGE, 0.7 * (1 - ss(0.345, 0.365, y)));
      const nd = seg(x, y, 0.0, 0.92, 0.1, 0.99).d;
      const nd2 = seg(x, y, 0.0, 0.92, -0.1, 0.99).d;
      c = mixRgb(c, EDGE, 0.5 * (1 - ss(0.012, 0.024, Math.min(nd, nd2))) * ss(0.05, 0.1, z));
      // Peplum hem edge and stitch (cream dashes 16 mm above the hem line).
      if (y < Y_HEM + 0.025) {
        const h = Y_HEM + hemY(x);
        const above = y - h;
        c = mixRgb(c, EDGE, 0.8 * (1 - ss(0.008, 0.016, above)) * ss(-0.02, 0.0, z));
        if (Math.abs(above - 0.024) < 0.0028 && z > -0.02 && Math.sin((x * Math.PI * 2) / 0.016) > -0.2) {
          c = mixRgb(c, STITCH, 1);
        }
      }
      return c;
    };
    k.body('leather', sdf.union(shell, padsBoth, peplum).paintFn(leatherPaint), {
      color: LEATHER,
      roughness: 0.65,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 5000,
      textureDensity: 2,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 38, y * 38, z * 38, 2),
    });
    k.body('flap', flap.paintFn((x, y, z, base) => {
      let fd = 9;
      for (let i = 0; i < FLAP.length; i++) {
        const a = FLAP[i] ?? [0, 0];
        const b = FLAP[(i + 1) % FLAP.length] ?? [0, 0];
        fd = Math.min(fd, seg(x, y, a[0], a[1], b[0], b[1]).d);
      }
      return mixRgb(base, EDGE, 0.9 * (1 - ss(0.003, 0.006, fd)));
    }), {
      color: LEATHER,
      roughness: 0.62,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 3500,
      textureDensity: 2,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 38, y * 38, z * 38, 2),
    });

    // ------------------------------------------------------------------ belt, straps (strap leather)
    const hug = (y: number, h: number) =>
      shell
        .round(0.0035)
        .subtract(shell.round(-0.012))
        .smoothIntersect(0.005, sdf.box([0.7, h, 0.5], 0.008).at(0, y, 0));
    const belt = hug(BELT_Y, 0.05);
    const strap = hug(STRAP_Y, 0.038);
    const [sx0, sy0, sx1, sy1] = STRAP_A;
    const chestStrap = (m: number) =>
      hugShell(0.014)
        .intersect(sdf.extrude(profile.polygon(strapPoly(sx0 * m, sy0, sx1 * m, sy1, 0.036)), 1).at(0, 0, 0.5))
        .intersect(front);
    const chestStraps = sdf.union(chestStrap(1), chestStrap(-1));
    // Short strap over each pauldron: a slab through both lames.
    const padStrap = (m: number) => {
      const slab = sdf.box([0.034, 0.5, 0.5]).at(0.2 * m, 0.95, 0);
      return padsBoth.round(0.01).intersect(slab);
    };
    const padStraps = sdf.union(padStrap(1), padStrap(-1));
    k.body('belt', sdf.union(belt, strap, chestStraps, padStraps), {
      color: STRAPC,
      roughness: 0.65,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 2600,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 38, y * 38, z * 38, 2),
    });

    // ------------------------------------------------------------------ brass: belt buckle, studs, strap buckles
    const beltHit = sdf.raycast(belt, [0, BELT_Y, 0.6], [0, 0, -1]);
    const beltZ = (beltHit ? beltHit[2] : 0.2) + 0.006;
    const parts = [
      sdf.box([0.07, 0.05, 0.014], 0.006).subtract(sdf.box([0.046, 0.03, 0.06])).at(0, BELT_Y, beltZ),
      sdf.box([0.008, 0.052, 0.009], 0.003).at(0, BELT_Y, beltZ),
      sdf.box([0.02, 0.008, 0.008], 0.003).at(0, BELT_Y + 0.028, beltZ - 0.008),
    ];
    for (const deg of [-44, -30, -16, 16, 30, 44]) {
      const r = (deg * Math.PI) / 180;
      const hit = sdf.raycast(belt, [Math.sin(r) * 0.7, BELT_Y, Math.cos(r) * 0.7], [-Math.sin(r), 0, -Math.cos(r)]);
      if (hit) parts.push(sdf.sphere(0.011).at(hit[0], hit[1], hit[2] + 0.002));
    }
    // Small frame buckles on the crossed straps and on the pauldron straps.
    const sdx = sx1 - sx0;
    const sdy = sy1 - sy0;
    const strapDeg = (Math.atan2(sdy, sdx) * 180) / Math.PI + 90;
    for (const m of [1, -1]) {
      const px = (sx0 + sdx * 0.3) * m;
      const py = sy0 + sdy * 0.3;
      const hit = sdf.raycast(shell, [px, py, 0.7], [0, 0, -1]);
      const z = (hit ? hit[2] : 0.17) + 0.02;
      const frame = sdf
        .box([0.046, 0.032, 0.014], 0.004)
        .subtract(sdf.box([0.026, 0.014, 0.05]))
        .rotateZ(strapDeg * m)
        .at(px, py, z);
      parts.push(frame);
    }
    for (const m of [1, -1]) {
      const top = sdf.raycast(padsBoth, [0.2 * m, 1.3, 0], [0, -1, 0]);
      if (top) {
        parts.push(
          sdf
            .box([0.04, 0.014, 0.034], 0.004)
            .subtract(sdf.box([0.022, 0.05, 0.016]))
            .rotateZ(-18 * m)
            .at(top[0], top[1] + 0.004, top[2]),
        );
      }
    }
    k.body('brass', sdf.union(...parts), {
      color: BRASS,
      roughness: 0.3,
      metalness: 1,
      detail: 0.0035,
      maxTriangles: 1200,
    });

    // Iron buckles where the side straps cinch.
    const strapHit = sdf.raycast(strap, [0.6, STRAP_Y, 0.25], [-0.93, 0, -0.37]) ?? [0.26, STRAP_Y, 0.115];
    const faceDeg = (Math.atan2(strapHit[0], strapHit[2]) * 180) / Math.PI;
    const sideBuckle = (sx: number) =>
      sdf.union(
        sdf.torus(0.024, 0.007).rotateX(90).rotateY(faceDeg * sx).at(strapHit[0] * sx + 0.004 * sx, STRAP_Y, strapHit[2] + 0.004),
        sdf.box([0.008, 0.038, 0.007], 0.003).rotateY(faceDeg * sx).at(strapHit[0] * sx + 0.006 * sx, STRAP_Y, strapHit[2] + 0.006),
        sdf
          .box([0.04, 0.028, 0.012], 0.005)
          .rotateY(faceDeg * sx - 14 * sx)
          .at(strapHit[0] * sx + 0.022 * sx, STRAP_Y - 0.006, strapHit[2] + 0.012),
      );
    k.body('iron', sideBuckle(1).union(sideBuckle(-1)), {
      color: IRON,
      roughness: 0.65,
      metalness: 0,
      detail: 0.0035,
      maxTriangles: 600,
    });
  },
});
