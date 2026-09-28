import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Design note — leather gloves (equipment/armor/gloves).
 *
 * Role: wearable armor item for the Chibi Quest heroes; a paired prop that
 *   must read at 128 px as two soft leather gloves lying side by side.
 * Size: each glove ~0.20 m long; the pair spans ~0.36 m wide, ~0.07 m tall,
 *   lying on y = 0, centered on the Y axis, fingers toward +Z.
 * One idea: two plush brown gloves tossed palm-down, fingers slightly curled
 *   up off the ground, flared cuffs with a dark strap and a small gold buckle.
 *   Exaggerate the chunky curled fingers and the bell cuffs.
 * Shape language: round dominant (soft fingers, domed hand backs, rolled
 *   cuffs); square secondary (strap band, buckle frame).
 * Palette (60/30/10): leather #8a5a35 dominant, dark leather #5c3a22
 *   secondary (strap, shadows, cuff opening), gold #d4a93a accent (the buckle).
 * Materials: leather (roughness 0.65, metalness 0), strap leather (0.7, 0),
 *   gold (roughness 0.3, metalness 1).
 * Detail: primary hand + cuff + fingers; secondary strap, buckle, cuff rim;
 *   tertiary leather grain in bump. Focal point: the gold buckle on each cuff.
 * Rig/animation: none (static equipment item).
 *
 * Local frame per glove: fingers +Z, back of hand +Y, thumb +X, wrist at -Z.
 * place() puts one glove at +X and mirrors it, so the pair fans outward.
 */

const LEATHER = rgb('#8a5a35'); // glove body, mid brown
const LEATHER_LIGHT = rgb('#b07a45'); // sunlit back of hand and knuckles
const LEATHER_DARK = rgb('#5c3a22'); // strap, edge shadow
const SHADOW = rgb('#4e3018'); // fold shadow at the cuff junction
const OPENING = rgb('#38220f'); // dark cuff mouth
const GOLD = rgb('#d4a93a');
const GOLD_HI = rgb('#f0d48a');

const X0 = 0.098; // center of one glove (the pair straddles x = 0)
const YAW = 10; // casual outward fan per glove

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ss = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// One finger: a smooth chain rooted in the palm, tip curled up off the ground.
function finger(fx: number, len: number, w: number, fan: number): sdf.Shape {
  const z0 = 0.008;
  const pts: [number, number, number, number][] = [
    [fx, 0.018, z0, w * 0.6],
    [fx + fan * 0.4, 0.019, z0 + len * 0.55, w * 0.54],
    [fx + fan, 0.033, z0 + len * 0.9, w * 0.44],
  ];
  const tip = pts[2];
  return sdf
    .chain(pts, 0.005)
    .smoothUnion(0.004, sdf.sphere(w * 0.46).at(tip[0], tip[1], tip[2]));
}

// Squash factors for the wrist oval; pieces are built at y = 0, scaled, then
// lifted so the cuff bottom rests exactly on the ground plane.
const CUFF_X = 1.1;
const CUFF_Y = 0.6;
const CUFF_LIFT = (0.04 + 0.004) * CUFF_Y; // cone radius + round, squashed

function gloveBody(): sdf.Shape {
  // Cuff: a soft flared tube, squashed into a wrist oval, rolled rim at the end.
  const cuffCone = sdf
    .cone([0, 0, -0.116], [0, 0, -0.06], 0.04, 0.032)
    .round(0.004)
    .scale([CUFF_X, CUFF_Y, 1])
    .at(0, CUFF_LIFT, 0);
  const rim = sdf
    .torus(0.037, 0.008)
    .rotateX(90)
    .scale([CUFF_X, CUFF_Y, 1])
    .at(0, CUFF_LIFT + 0.001, -0.114);
  const cuff = cuffCone.smoothUnion(0.006, rim);

  // Hand: a flat rounded pad, slightly domed on the back, widest at the knuckles.
  const palm = sdf.ellipsoid([0.045, 0.015, 0.042]).at(0, 0.014, -0.028);

  // Four chunky fingers, fanned and curled; thumb on +X.
  const fingers = sdf.union(
    finger(0.031, 0.064, 0.018, 0.003), // index
    finger(0.01, 0.07, 0.019, 0), // middle
    finger(-0.011, 0.064, 0.0175, 0), // ring
    finger(-0.0305, 0.052, 0.0155, -0.004), // pinky
  );
  const thumbTip: [number, number, number] = [0.072, 0.022, 0.02];
  const thumb = sdf
    .chain(
      [
        [0.03, 0.016, -0.008, 0.013],
        [0.052, 0.017, 0.004, 0.0115],
        [thumbTip[0], thumbTip[1], thumbTip[2], 0.0095],
      ],
      0.006,
    )
    .smoothUnion(0.004, sdf.sphere(0.0095).at(thumbTip[0], thumbTip[1], thumbTip[2]));

  return cuff
    .smoothUnion(0.01, palm)
    .smoothUnion(0.007, fingers)
    .smoothUnion(0.007, thumb);
}

function place(s: sdf.Shape): sdf.Shape {
  // Fingers fan slightly outward; mirror the copy so the pair stays symmetric.
  return s.rotateY(YAW).at(X0, 0, 0).mirror('x', 0);
}

export default defineAsset({
  name: 'gloves',
  description:
    'A pair of soft brown leather gloves lying palm-down with fingers slightly curled, flared cuffs closed by a dark strap with a small gold buckle.',
  detail: 0.006,
  reference: 'docs/item-mockups/gloves-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const glove = gloveBody();

    const leatherPaint = (x: number, y: number, z: number, base: typeof LEATHER) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 34, y * 22, z * 34, 2);
      const mottle = 0.5 + 0.5 * noise.fbm(x * 7 + 3, y * 7, z * 7, 2);
      let c = mixRgb(base, LEATHER_DARK, 0.14 * mottle);
      c = mixRgb(c, LEATHER_LIGHT, 0.1 * grain);
      // Sunlit back of the hand.
      c = mixRgb(c, LEATHER_LIGHT, 0.34 * ss(0.012, 0.04, y));
      // Darker toward the ground-facing edges.
      c = mixRgb(c, LEATHER_DARK, 0.3 * ss(0.008, 0.0, y));
      // Fold shadow where the cuff meets the hand.
      const fold = ss(-0.072, -0.058, z) * (1 - ss(-0.052, -0.04, z));
      c = mixRgb(c, SHADOW, 0.5 * fold);
      return c;
    };

    k.body(
      'leather',
      place(
        glove
          .paintFn(leatherPaint)
          .paintWhere(
            sdf
              .cylinder(0.031, 0.03, 0.002)
              .rotateX(90)
              .scale([CUFF_X, CUFF_Y, 1])
              .at(0, CUFF_LIFT, -0.117),
            OPENING,
            0.002,
          ),
      ),
      {
        color: LEATHER,
        roughness: 0.65,
        metalness: 0,
        detail: 0.005,
        paintWeight: 1.5,
        maxTriangles: 2000,
        bump: (x, y, z) => 0.0008 * noise.fbm(x * 38, y * 24, z * 38, 2),
      },
    );

    // Strap: a dark band wrapped around the cuff, plus its gold buckle.
    const strapBand = sdf
      .torus(0.0375, 0.0085)
      .rotateX(90)
      .scale([CUFF_X, CUFF_Y, 1])
      .at(0, CUFF_LIFT + 0.001, -0.078);
    k.body('strap', place(strapBand.paint(LEATHER_DARK)), {
      color: LEATHER_DARK,
      roughness: 0.7,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 320,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 40, y * 24, z * 40, 2),
    });

    // Gold buckle on the top of the strap, probed so it sits on the surface.
    const strapTop = sdf.surfacePoint(strapBand, [0, 0.12, -0.078], 0.002);
    const buckleLocal = sdf
      .union(
        sdf.box([0.028, 0.016, 0.007], 0.003).subtract(sdf.box([0.018, 0.008, 0.02], 0.0015)),
        sdf.box([0.004, 0.011, 0.005], 0.0015),
      )
      .at(strapTop[0], strapTop[1] + 0.004, strapTop[2]);
    const rivetX = sdf.surfacePoint(strapBand, [0.05, 0.03, -0.078], 0.001);
    const rivet = (p: [number, number, number]) => sdf.sphere(0.0045).at(p[0], p[1], p[2]);
    const goldLocal = sdf
      .union(buckleLocal, rivet(rivetX), rivet([-rivetX[0], rivetX[1], rivetX[2]]))
      .paintFn((x, y, z, base) => mixRgb(base, GOLD_HI, 0.45 * ss(0.055, 0.075, y)));

    k.body('buckle', place(goldLocal), {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.0035,
      maxTriangles: 420,
    });
  },
});
