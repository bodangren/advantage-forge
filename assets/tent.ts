import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — A-frame camping tent (props/world/tent).
 *
 * Role: a cozy campsite prop in the forest clearing; must read at 128 px sprite.
 * Size: 1.6 m long (Z), 1.4 m wide (X), 1.1 m tall at the ridge; stands on y = 0,
 *   door facing +Z.
 * One idea: a soft, rounded canvas A-frame with one flap folded open on the ground,
 *   glowing with warm light against a dark doorway.
 * Shape language: triangular dominant (A-frame silhouette), round secondary
 *   (blobby flap, rope curves, chunky pegs).
 * Palette: canvas #d8c8a0 dominant (light #e9ddbd ridge side, shade #b39c6e at the
 *   hem), dark interior #6b4726, wood #8a5a35 / cut wood #c9a06a, hemp rope #9a7a4a.
 *   Value plan: light canvas top, dark doorway = strongest contrast = focal point.
 * Materials: canvas cloth (roughness 0.88), interior cloth (0.95), wood (0.8),
 *   hemp rope (0.9). No metal, no emissive.
 * Detail: primary shell + ridge pole; secondary door cut, flap, guy ropes, pegs,
 *   floor boards; tertiary weave bump, plank gaps. Focal: dark doorway + flap.
 * Rig/animation: none (static prop).
 */

const CANVAS = rgb('#d8c8a0');
const CANVAS_LIGHT = rgb('#e9ddbd');
const CANVAS_DARK = rgb('#a8916a');
const INNER = rgb('#6b4726');
const WOOD = rgb('#8a5a35');
const WOOD_DARK = rgb('#5f3d22');
const CUT_WOOD = rgb('#c9a06a');
const ROPE = rgb('#9a7a4a');

const W2 = 0.7; // half width
const H = 1.1; // ridge height
const L2 = 0.8; // half length (front at +Z)

export default defineAsset({
  name: 'tent',
  description:
    'Small A-frame camping tent in warm canvas with a ridge pole, one flap tied open, guy ropes on wooden pegs, and a dark interior over a plank floor.',
  detail: 0.008,
  reference: 'docs/item-mockups/tent-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- canvas shell
    // Triangular prism shell: 5-point cross-section bellies the panels slightly,
    // hollow so the doorway and the open ends show a dark interior. Sharp polygon
    // profiles (the tabulated smooth spline does not survive boolean cuts).
    const tri = (pts: readonly (readonly [number, number])[]) => profile.polygon(pts);
    // Outer: sides bow out a touch for canvas tension; inner: matching inset.
    const outerPrism = sdf.extrude(
      tri([
        [-W2, 0.004],
        [-0.35, 0.63],
        [0, H],
        [0.35, 0.63],
        [W2, 0.004],
      ]),
      L2 * 2,
    );
    const innerPrism = sdf.extrude(
      tri([
        [-(W2 - 0.05), 0.055],
        [-0.31, 0.575],
        [0, H - 0.07],
        [0.31, 0.575],
        [W2 - 0.05, 0.055],
      ]),
      L2 * 2 + 0.02,
    );
    // Doorway: a smaller triangle cut through the front of the shell. The wedge
    // pokes out past the front cap so its end face is never coplanar with the
    // canvas (a coplanar cut face seals the hole in the tabulated field).
    const door = sdf
      .extrude(
        tri([
          [-0.37, 0],
          [0.37, 0],
          [0, 0.66],
        ]),
        0.7,
      )
      .at(0, 0, L2 - 0.2);

    const canvasPaint = (x: number, y: number, z: number) => {
      // Sun-lit near the ridge, shaded toward the hem, gentle cloth patches.
      const t = Math.min(1, Math.max(0, y / H));
      let c = mixRgb(CANVAS_DARK, CANVAS_LIGHT, 0.3 + 0.5 * t);
      const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2);
      c = mixRgb(c, CANVAS_DARK, 0.14 * patch);
      // Slightly warmer on the sun side (+X face of the cloth).
      c = mixRgb(c, CANVAS_LIGHT, 0.04 * Math.max(0, x / W2));
      return c;
    };
    // Dark interior: a band around the inner wall (inside the inner prism,
    // outside the outer one) so the outer canvas never catches the dark paint.
    const innerBand = innerPrism.round(0.03).subtract(outerPrism);
    // End caps close the front and back triangles; the front one gets the door.
    const capProfile = profile.polygon([
      [-W2, 0.004],
      [W2, 0.004],
      [0, H],
    ]);
    const capRound = 0.006;
    const frontCap = sdf
      .extrude(capProfile, 0.045)
      .at(0, 0, L2 - 0.0225)
      .subtract(door)
      .round(capRound)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const backCap = sdf
      .extrude(capProfile, 0.045)
      .at(0, 0, -(L2 - 0.0225))
      .round(capRound)
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const canvas = sdf
      .union(
        outerPrism
          .subtract(innerPrism, door)
          .round(0.008)
          .intersect(sdf.halfSpace([0, -1, 0], 0)),
        frontCap,
        backCap,
      )
      .paintFn(canvasPaint)
      .paintWhere(innerBand, INNER, 0.02);
    k.body('canvas', canvas, {
      color: '#d8c8a0',
      roughness: 0.88,
      metalness: 0,
      detail: 0.014,
      paintWeight: 2,
      maxTriangles: 3600,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // Dark inner core: a shrunken inner prism floating just inside the void, so
    // the doorway always reads as a dark interior instead of the lit back cap.
    const core = innerPrism
      .round(-0.03)
      .intersect(sdf.halfSpace([0, -1, 0], -0.06))
      .paintFn((x, y, z) =>
        mixRgb(INNER, rgb('#4a2f18'), 0.3 + 0.3 * noise.fbm(x * 3, y * 3, z * 3, 2)),
      );
    k.body('interior', core, {
      color: '#6b4726',
      roughness: 0.95,
      metalness: 0,
      detail: 0.016,
      maxTriangles: 600,
    });

    // ------------------------------------------------------------- flap (door side)
    // One triangular flap folded open, lying on the ground beside the door,
    // canvas on top and dark cloth underneath.
    const flapProfile = profile.polygon([
      [0, 0],
      [0, 0.52],
      [0.5, 0],
    ]);
    const flap = sdf
      .extrude(flapProfile, 0.018, 0.006)
      .rotateX(90) // lie flat: hinge edge runs along Z
      .rotateZ(30) // free edge props up, mockup-style (before the swing, so nothing dips)
      .rotateY(-26) // swing outward toward the front
      .at(0.52, 0.032, 0.38)
      .paintFn((x, y, z) => {
        // Folded cloth reads a touch darker and warmer than the walls.
        let c = mixRgb(CANVAS_DARK, CANVAS, 0.45 + 0.2 * noise.fbm(x * 6, y * 6, z * 6, 2));
        c = mixRgb(c, CANVAS_DARK, 0.25 * Math.max(0, (0.4 - y) / 0.4));
        return c;
      })
      .paintWhere(sdf.halfSpace([0, -1, 0], -0.03), INNER, 0.008);
    k.body('flap', flap, {
      color: '#d8c8a0',
      roughness: 0.9,
      metalness: 0,
      detail: 0.007,
      paintWeight: 2,
      maxTriangles: 700,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 40, y * 40, z * 40, 2),
    });

    // ------------------------------------------------------------- ridge pole
    const pole = sdf
      .smoothUnion(
        0.012,
        sdf.capsule([0, H + 0.018, -L2 - 0.07], [0, H + 0.018, L2 + 0.07], 0.023),
        sdf.sphere(0.032).at(0, H + 0.018, -L2 - 0.09),
        sdf.sphere(0.032).at(0, H + 0.018, L2 + 0.09),
      )
      .paintFn((x, y, z) => mixRgb(WOOD, CUT_WOOD, 0.25 + 0.2 * noise.fbm(0, y * 3, z * 30, 2)));
    k.body('ridge-pole', pole, {
      color: '#8a5a35',
      roughness: 0.8,
      metalness: 0,
      detail: 0.007,
      maxTriangles: 600,
      bump: (x, y, z) => 0.0018 * noise.fbm(x * 10, y * 10, z * 34, 2),
    });

    // ------------------------------------------------------------- guy ropes + pegs
    // Ropes run from the front panel (near the door corners) down-out to pegs.
    const ropeAt = (a: readonly number[], b: readonly number[]) =>
      sdf.capsule(a as [number, number, number], b as [number, number, number], 0.011);
    const frontRope = ropeAt([0.47, 0.38, L2 - 0.01], [0.98, 0.05, L2 + 0.38]);
    const backRope = ropeAt([0.47, 0.38, -(L2 - 0.01)], [0.98, 0.05, -L2 - 0.38]);
    const ropes = sdf
      .union(frontRope, backRope)
      .mirror('x', 0)
      .paintFn((x, y, z) => mixRgb(ROPE, WOOD_DARK, 0.3 + 0.2 * noise.fbm(x * 30, y * 30, z * 30, 2)));
    k.body('ropes', ropes, {
      color: '#9a7a4a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.007,
      maxTriangles: 800,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });

    // Wooden pegs at each rope end, tilted outward, tips touching the ground.
    const peg = sdf
      .cone([0.98, 0.1, L2 + 0.38], [1.06, 0.012, L2 + 0.44], 0.02, 0.012)
      .paintFn((x, y, z) => mixRgb(CUT_WOOD, WOOD, 0.25 + 0.45 * Math.max(0, (0.06 - y) / 0.12)));
    const pegs = sdf
      .union(peg, sdf.cone([0.98, 0.1, -L2 - 0.38], [1.06, 0.012, -L2 - 0.44], 0.02, 0.012))
      .mirror('x', 0);
    k.body('pegs', pegs, {
      color: '#c9a06a',
      roughness: 0.8,
      metalness: 0,
      detail: 0.006,
      maxTriangles: 500,
    });

    // ------------------------------------------------------------- plank floor
    const floorPaint = (x: number, y: number, z: number) => {
      const boardW = 0.145;
      const u = (x + 0.55) / boardW;
      const board = Math.floor(u);
      const f = u - board;
      const gap = f < 0.07 || f > 0.93 ? 0.7 : 0;
      const tint = noise.random(board, 5, 1);
      const grain = 0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 40, 2);
      let c = mixRgb(CUT_WOOD, WOOD, 0.18 + 0.28 * tint);
      c = mixRgb(c, CUT_WOOD, 0.14 * grain);
      c = mixRgb(c, WOOD_DARK, gap);
      return c;
    };
    const floor = sdf
      .box([1.12, 0.045, 1.44], 0.012)
      .at(0, 0.026, 0)
      .paintFn(floorPaint)
      .paintWhere(sdf.halfSpace([0, -1, 0], 0.028), WOOD_DARK, 0.006);
    k.body('floor', floor, {
      color: '#c9a06a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      maxTriangles: 1000,
      bump: (x, y, z) => {
        const f = (x + 0.55) / 0.145 - Math.floor((x + 0.55) / 0.145);
        const gap = f < 0.07 || f > 0.93 ? 1 : 0;
        return -0.002 * gap + 0.0014 * noise.fbm(x * 24, y * 24, z * 24, 2);
      },
    });
  },
});
