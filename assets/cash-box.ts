import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — small iron-bound cash box (props/craft-and-trade/cash-box).
 *
 * Role: a stout little strongbox that sits on the blacksmith's bench and
 *   holds the day's takings; reads at 128 px as one chunky iron-bound box.
 * Size: 0.28 m long (X), 0.18 m deep (Z), 0.16 m tall (Y) — body ~0.10 m
 *   plus a 0.05 m lid that the top iron strap caps at ~0.16 m; stands on
 *   y = 0, front faces +Z.
 * One idea: a tight little walnut plank box hugged by dark iron straps at
 *   top, bottom and corners, with an iron hasp and padlock hanging on the
 *   front seam — clearly "the till", no other small box reads as well.
 * Shape language: square dominant (plank box, iron bands), round secondary
 *   (soft bevels on every timber, rounded iron fittings, rounded padlock).
 * Palette contract: walnut #6b4226, iron #4a4f55, shadow #363a3f (plus
 *   brass #caa24a for the lock). 60/30/10: walnut body (dominant), iron
 *   straps and hasp (secondary), brass padlock (small accent focal point).
 * Materials: walnut roughness 0.82 metalness 0; worn iron roughness 0.5
 *   metalness 0.7; brass roughness 0.3 metalness 1.
 * Detail: primary body + lid + 2 horizontal iron straps + 4 corner iron
 *   straps; secondary iron hasp + padlock, 2 iron hinges at the back, a
 *   thin coin slot on top; tertiary plank seams, walnut grain, iron wear
 *   patches and small rivets where straps meet corners. Focal point: the
 *   brass padlock hanging on the front seam.
 * Rig/animation: none — a static, closed prop.
 */

const WALNUT = rgb('#6b4226');
const WALNUT_DARK = rgb('#54331d');
const WALNUT_LIGHT = rgb('#8a6540');
const IRON = rgb('#4a4f55');
const IRON_DEEP = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');
const BRASS = rgb('#caa24a');
const BRASS_DARK = rgb('#9c6d1c');
const SLOT_DARK = rgb('#1a1206');

const W = 0.28; // width (X)
const D = 0.18; // depth (Z)
const BODY_H = 0.1; // body height (planks)
const LID_H = 0.045; // lid plank thickness
const LID_OVERHANG = 0.006; // how far the lid sits proud of the body
const STRAP_T = 0.014; // iron strap thickness
const SEAM_GAP = 0.005; // shadow gap between lid and body
const BODY_Y = BODY_H / 2;
const LID_Y = BODY_H + SEAM_GAP + LID_H / 2;

/** Walnut plank paint: per-board tint, dark seams, vertical grain, value plan. */
const plankPaint = (axis: 'y' | 'x', boardH: number) =>
  (x: number, y: number, z: number): readonly [number, number, number] => {
    const v = axis === 'y' ? y : x;
    const board = Math.floor(v / boardH);
    const f = v / boardH - board;
    const seam = f < 0.08 || f > 0.92 ? 0.7 : 0;
    const tint = noise.random(board, 7);
    const grain = 0.5 + 0.5 * noise.fbm(x * 10, y * 50, z * 10 + board * 13, 2);
    const patch = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
    let c = mixRgb(WALNUT, WALNUT_DARK, 0.2 + 0.3 * tint);
    c = mixRgb(c, WALNUT_DARK, 0.32 * grain);
    c = mixRgb(c, WALNUT, 0.18 * patch);
    // Top sun-lit lift; bottom shaded foot.
    const t = axis === 'y' ? Math.min(1, Math.max(0, y / BODY_H)) : 0.5;
    c = mixRgb(c, WALNUT_DARK, 0.28 * (1 - t) * (1 - t));
    c = mixRgb(c, WALNUT_LIGHT, 0.18 * Math.max(0, (t - 0.55) / 0.45));
    return mixRgb(c, WALNUT_DARK, seam);
  };

/** Walnut bump: dark seam grooves + fine grain. */
const plankBump = (axis: 'y' | 'x', boardH: number) =>
  (x: number, y: number, z: number): number => {
    const v = axis === 'y' ? y : x;
    const f = v / boardH - Math.floor(v / boardH);
    const seam = f < 0.08 || f > 0.92 ? 1 : 0;
    return -0.002 * seam + 0.0011 * noise.fbm(x * 24, y * 6, z * 24, 2);
  };

export default defineAsset({
  name: 'cash-box',
  description:
    'Small iron-bound walnut cash box with horizontal iron straps, corner straps, an iron hasp with a brass padlock, two iron hinges at the back, and a coin slot on top.',
  detail: 0.005,
  reference: 'docs/blacksmith-mockups/blacksmith-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ============================================================ WALNUT BODY
    // Plank box body, two horizontal boards per face with a real groove
    // between them. Slight bevel on every edge so nothing reads sharp.
    const bodyShape = sdf.box([W, BODY_H, D], 0.012).at(0, BODY_Y, 0);
    const bodyGroove = sdf.box([W + 0.02, 0.01, D + 0.02]).at(0, BODY_Y, 0);
    k.body(
      'body',
      bodyShape
        .subtract(bodyGroove)
        .paintFn(plankPaint('y', BODY_H / 2))
        .paintWhere(bodyGroove.round(0.003), WALNUT_DARK, 0.006),
      {
        color: '#6b4226',
        roughness: 0.82,
        metalness: 0,
        detail: 0.005,
        textureDensity: 2,
        bump: plankBump('y', BODY_H / 2),
        maxTriangles: 2200,
      },
    );

    // ============================================================ WALNUT LID
    // Slightly overhanging plank lid with two real grooves separating three
    // boards running along X. Sits with a small shadow gap above the body.
    // A coin slot is cut INTO the lid and painted dark so it reads as a
    // recess, not a raised bar.
    const coinSlotCutter = sdf
      .box([0.062, 0.012, 0.01], 0.002)
      .at(0, LID_Y + LID_H / 2 - 0.001, 0.02);
    const coinSlotPaint = coinSlotCutter.round(0.003);

    const lidBase = sdf
      .box([W + LID_OVERHANG * 2, LID_H, D + LID_OVERHANG * 2], 0.01)
      .at(0, LID_Y, 0);
    const lidGrooveA = sdf
      .box([W + 0.04, 0.008, 0.004])
      .at(0, LID_Y, -D / 6);
    const lidGrooveB = sdf
      .box([W + 0.04, 0.008, 0.004])
      .at(0, LID_Y, D / 6);
    k.body(
      'lid',
      lidBase
        .subtract(lidGrooveA)
        .subtract(lidGrooveB)
        .subtract(coinSlotCutter)
        .paintFn(plankPaint('x', (W + LID_OVERHANG * 2) / 3))
        .paintWhere(lidGrooveA.round(0.002), WALNUT_DARK, 0.006)
        .paintWhere(lidGrooveB.round(0.002), WALNUT_DARK, 0.006)
        .paintWhere(coinSlotPaint, SLOT_DARK, 0.004),
      {
        color: '#6b4226',
        roughness: 0.82,
        metalness: 0,
        detail: 0.005,
        textureDensity: 2,
        bump: plankBump('x', (W + LID_OVERHANG * 2) / 3),
        maxTriangles: 1400,
      },
    );

    // ============================================================ IRON FITTINGS
    // The "solid" composite of body + lid is the surface every iron strap
    // hugs. We build thin shells of that composite and intersect with the
    // strap boxes. This keeps straps flush with the wood (never floating)
    // and follows the bevels.
    const solid = sdf.union(bodyShape, lidBase);
    const shellOf = (s: sdf.Shape, t: number) => s.round(t).subtract(s.round(-0.001));
    const bodyShell = shellOf(bodyShape, 0.006);
    const lidShell = shellOf(lidBase, 0.006);

    // -------------------------------------- horizontal straps across the body
    // Two straps wrap the body at top and bottom, hugging the bevels.
    const bottomStrap = bodyShell.intersect(
      sdf.box([W + 0.02, STRAP_T, D + 0.02], 0.003).at(0, STRAP_T * 0.55, 0),
    );
    const topStrap = bodyShell.intersect(
      sdf.box([W + 0.02, STRAP_T, D + 0.02], 0.003).at(0, BODY_H - STRAP_T * 0.55, 0),
    );

    // -------------------------------------- vertical corner straps
    // Four vertical straps along the four vertical edges, proud of the body.
    const cornerStrap = (x: number, z: number) =>
      bodyShell.intersect(
        sdf.box([STRAP_T * 0.85, BODY_H + 0.005, STRAP_T * 0.85], 0.003).at(x, BODY_Y, z),
      );
    const corners = sdf.union(
      cornerStrap(W / 2, D / 2),
      cornerStrap(-W / 2, D / 2),
      cornerStrap(W / 2, -D / 2),
      cornerStrap(-W / 2, -D / 2),
    );

    // -------------------------------------- lid iron bands (one across, two short)
    // A single full-width iron band over the top of the lid, hugging the
    // bevel so it reads like a cap rather than a slab on the lid.
    const lidBand = lidShell.intersect(
      sdf.box([W + 0.018, STRAP_T, D + 0.018], 0.003).at(0, LID_Y + LID_H * 0.1, 0),
    );

    // ============================================================ HASP + LOCK
    // Iron hasp plate on the front, hinged over the seam. The padlock hangs
    // on the hasp, sitting on the front face of the body. Together they
    // are the focal point — biggest value contrast (mid wood body, dark
    // iron hasp, bright brass lock).
    const seamZ = D / 2;
    const seamY = BODY_H; // hinge line at the seam between body and lid
    // Hasp plate: a small chamfered rectangle on the front of the body.
    const haspPlate = sdf
      .box([0.07, 0.05, 0.012], 0.006)
      .at(0, seamY - 0.025, seamZ + 0.006);
    // Hasp staple arms that hook over the lip of the lid (purely visual).
    const haspArmL = sdf
      .box([0.014, 0.034, 0.012], 0.004)
      .at(-0.028, seamY + 0.018, seamZ + 0.006);
    const haspArmR = sdf
      .box([0.014, 0.034, 0.012], 0.004)
      .at(0.028, seamY + 0.018, seamZ + 0.006);
    const hasp = sdf.union(haspPlate, haspArmL, haspArmR);

    // Padlock body (chunky brass rectangle) hanging on the hasp.
    const lockBody = sdf
      .box([0.052, 0.06, 0.024], 0.012)
      .at(0, seamY - 0.062, seamZ + 0.012);
    // Padlock shackle: a small torus loop rising out of the body and tucked
    // under the hasp arms.
    const shackle = sdf
      .torus(0.014, 0.0048)
      .rotateX(90)
      .at(0, seamY - 0.018, seamZ + 0.012)
      // Clip the bottom of the torus so it looks like a shackle, not a hoop.
      .intersect(sdf.halfSpace([0, 1, 0], -(seamY - 0.038)));
    // Keyhole punched through the lock body (paint only — sits inside the
    // same body).
    const keyhole = sdf
      .extrude(profile.circle(0.006), 0.1)
      .at(0, seamY - 0.066, seamZ + 0.02);

    // ============================================================ HINGES
    // Two iron strap hinges at the back: face strap on the body, pin barrel
    // across the seam, lid strap over the lid. Mirror across X for symmetry.
    const hingeX = 0.09;
    const hinge = sdf.union(
      // Body face strap.
      sdf
        .box([0.034, 0.07, 0.01], 0.004)
        .at(hingeX, BODY_Y - 0.005, -D / 2 - 0.005),
      // Pin barrel straddling the seam.
      sdf
        .cylinder(0.011, 0.045)
        .rotateZ(90)
        .at(hingeX, BODY_H + 0.002, -D / 2 - 0.006),
      // Lid strap over the lid.
      sdf
        .box([0.034, 0.014, 0.05], 0.004)
        .at(hingeX, LID_Y + LID_H / 2, -D / 2 - 0.005),
    );
    const hinges = hinge.mirror('x', 0);

    // ============================================================ RIVETS
    // Small nail/rivet heads where the straps cross the corners and where
    // the hasp and hinges attach. They sit on top of the wood and never
    // pierce it, so they read as bright dots against the dark iron.
    const rivet = (x: number, y: number, z: number) => sdf.sphere(0.0055).at(x, y, z);
    // Bottom strap corner rivets (4).
    const bottomCornerRivets = sdf.union(
      ...[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) =>
          rivet((sx * W) / 2, STRAP_T * 0.55, (sz * D) / 2),
        ),
      ),
    );
    // Top strap corner rivets (4).
    const topCornerRivets = sdf.union(
      ...[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) =>
          rivet((sx * W) / 2, BODY_H - STRAP_T * 0.55, (sz * D) / 2),
        ),
      ),
    );
    // Hasp rivets (2).
    const haspRivets = sdf.union(
      rivet(-0.025, seamY - 0.04, seamZ + 0.012),
      rivet(0.025, seamY - 0.04, seamZ + 0.012),
    );
    // Hinge rivets (2 per hinge, body strap + lid strap).
    const hingeRivets = sdf.union(
      rivet(-hingeX, BODY_Y - 0.03, -D / 2 - 0.008),
      rivet(-hingeX, BODY_Y + 0.02, -D / 2 - 0.008),
      rivet(hingeX, BODY_Y - 0.03, -D / 2 - 0.008),
      rivet(hingeX, BODY_Y + 0.02, -D / 2 - 0.008),
      rivet(-hingeX, LID_Y + LID_H / 2 + 0.001, -D / 2 - 0.005),
      rivet(hingeX, LID_Y + LID_H / 2 + 0.001, -D / 2 - 0.005),
    );

    // ============================================================ IRON PAINT
    // Single iron body for all iron parts. Iron gets darker at the bottom,
    // brighter on the lid strap and the padlock face, and patchy wear from
    // fbm noise so the metal reads as worked, not pristine.
    const ironShape = sdf
      .union(bottomStrap, topStrap, corners, lidBand, hasp, hinges)
      .paintFn((x, y, z) => {
        let c = IRON;
        // Bottom shaded (against the dark foot), top sun-lit.
        const yFrac = Math.min(1, Math.max(0, y / (LID_Y + LID_H)));
        c = mixRgb(c, IRON_DEEP, 0.45 * (1 - yFrac) * (1 - yFrac));
        c = mixRgb(c, IRON_HI, 0.18 * Math.max(0, (yFrac - 0.6) / 0.4));
        // Patchy wear so the iron looks worked.
        const wear = 0.5 + 0.5 * noise.fbm(x * 28, y * 28, z * 28, 2);
        c = mixRgb(c, IRON_HI, 0.1 * wear);
        // Brighten the hasp plate (the focal point neighborhood).
        const onHasp =
          Math.max(0, 1 - Math.abs(x) / 0.038) *
          Math.max(0, 1 - Math.abs(y - (seamY - 0.025)) / 0.028) *
          Math.max(0, 1 - Math.abs(z - (seamZ + 0.006)) / 0.012);
        c = mixRgb(c, IRON_HI, 0.35 * onHasp);
        return c;
      });

    k.body('iron', ironShape, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      bump: (x, y, z) => 0.0009 * noise.fbm(x * 50, y * 50, z * 50, 2),
      maxTriangles: 2400,
    });

    // ============================================================ RIVETS + PADLOCK
    // Rivets read as small bright iron domes on top of the straps.
    k.body(
      'rivets',
      sdf
        .union(bottomCornerRivets, topCornerRivets, haspRivets, hingeRivets)
        .paintFn((x, y, z) => {
          const wear = 0.5 + 0.5 * noise.fbm(x * 60, y * 60, z * 60, 2);
          return mixRgb(IRON_HI, IRON, 0.55 * wear);
        }),
      {
        color: '#a8acb1',
        roughness: 0.45,
        metalness: 0.85,
        detail: 0.003,
        maxTriangles: 200,
      },
    );

    // Padlock: brass body + brass shackle. Keyhole painted inside the body
    // so it reads without a real subtraction.
    const lockPaint = (x: number, y: number, z: number) => {
      const wear = 0.5 + 0.5 * noise.fbm(x * 50, y * 50, z * 50, 2);
      let c = mixRgb(BRASS, BRASS_DARK, 0.25 + 0.25 * wear);
      // Bright sun-lit face on the +Z side (focal point).
      const front = Math.max(0, (z - seamZ) / 0.04);
      c = mixRgb(c, IRON_HI, 0.2 * front);
      return c;
    };
    k.body(
      'padlock',
      sdf.union(lockBody.paintFn(lockPaint), shackle.paintFn(lockPaint)).paintWhere(
        keyhole,
        '#241812',
        0.003,
      ),
      {
        color: '#caa24a',
        roughness: 0.3,
        metalness: 1,
        detail: 0.004,
        textureDensity: 2,
        maxTriangles: 350,
      },
    );
  },
});