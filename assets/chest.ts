import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — plain wooden storage chest (props/containers/chest).
 *
 * Role: cozy hamlet storage prop; must read at 128 px and match the chibi quest set.
 * Size: 0.7 m wide (X), 0.45 m deep (Z), ~0.45 m tall with the domed lid; on y = 0, front +Z.
 * One idea: a sturdy honey-oak plank box framed by dark walnut battens and chunky
 *   iron caps, clamped shut by a small padlock at the seam — honest, well-kept storage.
 * Shape language: square dominant (plank box, post-and-rail frame), round secondary
 *   (gently domed lid, rounded caps and padlock).
 * Palette: honey oak #b5814a dominant with warm brown #8a5a35 and pale cut #c9a06a;
 *   dark walnut battens #6b4226 / #54331d; iron #4a4f55 with shadow #363a3f and
 *   highlight #a8acb1. Value plan: mid wood body, dark frame, small bright iron accents.
 * Materials: wood (roughness 0.82, metalness 0) for body/lid/battens; worn iron
 *   (roughness 0.5, metalness 0.7) for caps, lid bands, hasp and padlock.
 * Detail: primary box + dome lid; secondary posts, rails, caps, bands, hasp, padlock;
 *   tertiary plank gaps, grain and wear in `bump`/paint. Focal point: padlock on the seam.
 * Rig/animation: none — a static, closed prop.
 */

const W = 0.7; // width (X)
const D = 0.45; // depth (Z)
const H = 0.28; // body height (lid caps it to ~0.45 total)
const LID_R = D / 2 + 0.006; // lid arc radius, slightly wider than the body
const LID_DOME = 0.72; // dome factor: lid apex at H + LID_R * LID_DOME = ~0.446

const HONEY = rgb('#b5814a'); // honey oak
const WARM = rgb('#8a5a35'); // warm brown
const PALE = rgb('#c9a06a'); // pale cut wood
const WALNUT = rgb('#6b4226'); // batten wood
const WALNUT_D = rgb('#54331d'); // dark walnut
const IRON = rgb('#4a4f55');
const IRON_HI = rgb('#a8acb1');
const IRON_LO = rgb('#363a3f');

/** Horizontal plank paint: board tint, dark gaps, grain, lighter toward the top. */
const plankPaint =
  (boardH: number) =>
  (x: number, y: number, z: number): readonly [number, number, number] => {
    const board = Math.floor(y / boardH);
    const f = y / boardH - board;
    const gap = f < 0.07 || f > 0.93 ? 0.8 : 0;
    const tint = noise.random(board, 5);
    const grain = 0.5 + 0.5 * noise.fbm(x * 8, y * 60, z * 8, 2);
    let c = mixRgb(HONEY, PALE, 0.15 + 0.35 * tint);
    c = mixRgb(c, WARM, 0.3 * grain);
    c = mixRgb(c, WALNUT_D, 0.22 * Math.max(0, 1 - y / H) ** 2);
    c = mixRgb(c, PALE, 0.16 * Math.max(0, (y / H - 0.6) / 0.4));
    return mixRgb(c, WALNUT_D, gap);
  };

/** Plank relief: grooves at the board gaps, fine grain between. */
const plankBump =
  (boardH: number) =>
  (x: number, y: number, z: number): number => {
    const f = y / boardH - Math.floor(y / boardH);
    const gap = f < 0.07 || f > 0.93 ? 1 : 0;
    return -0.0022 * gap + 0.0013 * noise.fbm(x * 22, y * 6, z * 22, 2);
  };

export default defineAsset({
  name: 'chest',
  description:
    'Plain honey-oak storage chest with walnut batten frame, iron corner caps, two iron lid bands, and a padlocked hasp.',
  detail: 0.006,
  reference: 'docs/item-mockups/chest-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ plank body
    const bodyShape = sdf.box([W, H, D], 0.018).at(0, H / 2, 0);
    k.body('body', bodyShape.paintFn(plankPaint(0.075)), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.007,
      bump: plankBump(0.075),
      maxTriangles: 2600,
    });

    // ------------------------------------------------------------------ domed lid
    // Half-ellipse arc (U = radius dir, V = up) with a short lip hanging over the seam,
    // extruded along X so the boards run along the width.
    const lidArc = Array.from({ length: 25 }, (_, i) => {
      const a = (Math.PI * i) / 24;
      return [Math.cos(a) * LID_R, Math.sin(a) * LID_R * LID_DOME] as [number, number];
    });
    const lidProfile = profile.polygon([
      [LID_R + 0.004, -0.028],
      ...lidArc,
      [-(LID_R + 0.004), -0.028],
    ]);
    const lidSolid = sdf.extrude(lidProfile, W - 0.02, 0.01).rotateY(90).at(0, H, 0);
    // Lid boards follow the arc of the dome; gaps get relief in bump.
    const lidPaint = (x: number, y: number, z: number) => {
      const angle = Math.atan2((y - H) / LID_DOME, z);
      const board = Math.floor((angle * 0.5) / 0.26);
      const f = (angle * 0.5) / 0.26 - board;
      const gap = f < 0.09 || f > 0.91 ? 0.75 : 0;
      const tint = noise.random(board, 9);
      const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 60, z * 6, 2);
      let c = mixRgb(HONEY, PALE, 0.2 + 0.35 * tint);
      c = mixRgb(c, WARM, 0.28 * grain);
      return mixRgb(c, WALNUT_D, gap);
    };
    const lidBump = (x: number, y: number, z: number) => {
      const angle = Math.atan2((y - H) / LID_DOME, z);
      const f = (angle * 0.5) / 0.26 - Math.floor((angle * 0.5) / 0.26);
      const gap = f < 0.09 || f > 0.91 ? 1 : 0;
      return -0.002 * gap + 0.0012 * noise.fbm(x * 22, y * 6, z * 22, 2);
    };
    k.body('lid', lidSolid.paintFn(lidPaint), {
      color: '#b5814a',
      roughness: 0.82,
      metalness: 0,
      detail: 0.006,
      bump: lidBump,
      maxTriangles: 2600,
    });

    // ------------------------------------------------------------------ walnut batten frame
    // Four corner posts plus top/bottom rails on all four faces, slightly proud of the planks.
    const post = (x: number, z: number) =>
      sdf.box([0.06, H, 0.06], 0.012).at(x, H / 2, z);
    const railX = (y: number, z: number) =>
      sdf.box([W - 0.05, 0.055, 0.034], 0.01).at(0, y, z);
    const railZ = (y: number, x: number) =>
      sdf.box([0.034, 0.055, D - 0.05], 0.01).at(x, y, 0);
    const px = W / 2 - 0.004;
    const pz = D / 2 - 0.004;
    const battenShape = sdf.union(
      post(px, pz).mirror('x', 0).mirror('z', 0),
      railX(H - 0.028, D / 2 + 0.004).mirror('z', 0),
      railX(0.032, D / 2 + 0.004).mirror('z', 0),
      railZ(H - 0.028, W / 2 + 0.004).mirror('x', 0),
      railZ(0.032, W / 2 + 0.004).mirror('x', 0),
    );
    const battenPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 2);
      let c = mixRgb(WALNUT, WALNUT_D, 0.2 + 0.4 * grain);
      c = mixRgb(c, WALNUT_D, 0.25 * Math.max(0, 1 - y / H) ** 2);
      return c;
    };
    k.body('battens', battenShape.paintFn(battenPaint), {
      color: '#6b4226',
      roughness: 0.82,
      metalness: 0,
      detail: 0.007,
      bump: (x, y, z) => 0.0012 * noise.fbm(x * 26, y * 26, z * 26, 2),
      maxTriangles: 2200,
    });

    // ------------------------------------------------------------------ iron fittings
    // Thin shells of the surfaces they hug, so bands and caps never float.
    const shellOf = (s: sdf.Shape, t: number) => s.round(t).subtract(s.round(-0.002));
    // Corner caps seat on the tops and bottoms of the four posts.
    const capAt = (y: number) =>
      sdf
        .box([0.074, 0.056, 0.074], 0.015)
        .at(px, y, pz)
        .mirror('x', 0)
        .mirror('z', 0);
    const caps = sdf.union(capAt(H - 0.02), capAt(0.03));
    // Rivets on the front faces of the front caps.
    const rivets = sdf.union(
      ...[H - 0.02, 0.03].flatMap((y) => [
        sdf.sphere(0.011).at(px, y, pz + 0.037),
        sdf.sphere(0.011).at(-px, y, pz + 0.037),
      ]),
    );
    // Two bands arch over the lid.
    const lidSkin = shellOf(lidSolid, 0.008);
    const lidBands = lidSkin.intersect(
      sdf
        .box([0.055, 0.4, 1.0], 0.008)
        .at(W * 0.27, H + 0.08, 0)
        .mirror('x', 0),
    );
    // Hasp plate over the seam, padlock hanging on the front, shackle loop, keyhole.
    const seamZ = D / 2;
    const hasp = sdf.box([0.08, 0.075, 0.02], 0.008).at(0, H + 0.02, LID_R - 0.004);
    const lockBody = sdf
      .box([0.06, 0.072, 0.028], 0.01)
      .at(0, H - 0.05, seamZ + 0.014);
    const shackle = sdf
      .torus(0.017, 0.0055)
      .rotateX(90)
      .intersect(sdf.halfSpace([0, -1, 0], -(H - 0.016)))
      .at(0, 0, seamZ + 0.012);
    const keyhole = sdf
      .extrude(profile.circle(0.008), 0.1)
      .at(0, H - 0.056, seamZ + 0.02);
    const ironShape = sdf
      .union(caps, rivets, lidBands, hasp, lockBody, shackle)
      .paintFn((x, y, z) => {
        let c = IRON;
        const up = Math.min(1, Math.max(0, (y - 0.18) / 0.25));
        c = mixRgb(c, IRON_HI, 0.28 * up * up);
        const down = Math.min(1, Math.max(0, (0.1 - y) / 0.1));
        c = mixRgb(c, IRON_LO, 0.45 * down);
        const wear = 0.5 + 0.5 * noise.fbm(x * 40, y * 40, z * 40, 2);
        c = mixRgb(c, IRON_HI, 0.08 * wear);
        // Bright face on the padlock, the focal point.
        const lockFace =
          Math.max(0, 1 - Math.abs(x) / 0.032) *
          Math.max(0, 1 - Math.abs(y - (H - 0.05)) / 0.055) *
          Math.max(0, (z - seamZ) / 0.05);
        return mixRgb(c, IRON_HI, 0.45 * lockFace);
      })
      .paintWhere(keyhole, '#241812', 0.004);
    k.body('iron', ironShape, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      bump: (x, y, z) => 0.0008 * noise.fbm(x * 60, y * 60, z * 60, 2),
      maxTriangles: 2400,
    });
  },
});
