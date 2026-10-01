import { HAND_FIT, defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Halberd (equipment/melee-weapons/halberd), matched to docs/item-mockups/halberd-mock.jpg.
 * Role: two-handed melee weapon, avatar item. Size: 2.04 m tall, standing on its knob; blade 0.5 m tall, haft of fat barrel segments, blade toward +X.
 * One idea: a chunky chibi head, a big crescent axe blade (top spike, bottom hook) against a fan-lobed fluke.
 * Shape language: heavy angular steel on a round banded haft.
 * Palette: haft #8a5a35, brass rings #c9a04a, blade #b9c0c8 / edge #dfe4ea, socket and fluke #5a6068.
 * Materials: haft (wood, grain in bump), rings (brass), socket and fluke (dark steel), blade (bright steel).
 * Focal point: the blade's bright edge band.
 */

const WOOD = rgb('#8a5a35');
const GRAIN = rgb('#5e3a20');
const STEEL = rgb('#b9c0c8');
const EDGE = rgb('#dfe4ea');
const HEAD_Y = 1.75;
const HAFT_TOP = 1.6;

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const pt = (x: number, y: number): [number, number] => [x, HEAD_Y + y];

export default defineAsset({
  name: 'halberd',
  description: 'A halberd: a thick banded wooden haft under a chunky steel head with a crescent axe blade and a fan-lobed fluke.',
  detail: 0.004,
  reference: 'docs/item-mockups/halberd-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'mainhand', fitScale: HAND_FIT, origin: [0, 0.8, 0], twoHanded: true },

  build(k) {
    const SEG0 = 0.17;
    const SEGS = 6;
    const segLen = (HAFT_TOP - SEG0) / SEGS;
    const segments = Array.from({ length: SEGS }, (_, i) =>
      sdf.ellipsoid([0.036, segLen / 2 - 0.004, 0.036]).at(0, SEG0 + segLen * (i + 0.5), 0),
    );
    const haft = sdf.union(sdf.cylinder(0.026, HAFT_TOP - 0.1, 0.004).at(0, (HAFT_TOP + 0.1) / 2, 0), ...segments);
    k.body(
      'haft',
      haft.paintFn((x, y, z) => mixRgb(WOOD, GRAIN, 0.15 + 0.4 * (0.5 + 0.5 * noise.fbm(x * 60, y * 5, z * 60, 3)))),
      {
        color: '#8a5a35',
        roughness: 0.75,
        metalness: 0,
        bump: (x, y, z) => 0.0015 * noise.fbm(x * 90, y * 7, z * 90, 3),
      },
    );
    k.body('brass', sdf.union(sdf.sphere(0.052).at(0, 0.052, 0), sdf.sphere(0.04).at(0, 0.14, 0)), {
      color: '#c9a04a',
      roughness: 0.4,
      metalness: 0.8,
    });

    const socket = sdf.union(
      sdf.cylinder(0.042, 0.2, 0.01).at(0, HAFT_TOP + 0.04, 0),
      sdf
        .box([0.13, 0.13, 0.08], 0.004)
        .intersect(sdf.box([0.16, 0.16, 0.2], 0.004).rotateZ(45))
        .intersect(sdf.box([0.2, 0.16, 0.115], 0.004).rotateY(45))
        .at(0, HEAD_Y, 0),
    );
    const flukeOutline = profile.polygon(
      [
        [-0.06, 0.035], [-0.17, 0.045], [-0.21, 0.115], [-0.285, 0.095], [-0.3, 0.04], [-0.265, 0],
        [-0.3, -0.04], [-0.285, -0.095], [-0.21, -0.115], [-0.17, -0.045], [-0.06, -0.035],
      ].map(([x = 0, y = 0]) => pt(x, y)),
    );
    const fluke = sdf.extrude(flukeOutline, 0.04, 0.008);
    k.body('socket', sdf.smoothUnion(0.01, socket, fluke), { color: '#5a6068', roughness: 0.5, metalness: 0.75 });

    const bladeOutline = profile.polygon(
      [
        pt(0.05, 0.09), pt(0.14, 0.15), pt(0.24, 0.24), pt(0.3, 0.29), pt(0.335, 0.15), pt(0.35, 0.0),
        pt(0.33, -0.1), pt(0.26, -0.18), pt(0.22, -0.21), pt(0.2, -0.12), pt(0.12, -0.08), pt(0.05, -0.08),
      ],
      { smooth: true },
    );
    // Thickness 0.036 at the socket (x 0.06) tapering to 0.008 at the edge (x 0.3).
    const slope = 0.045;
    const half = 0.0175 + slope * 0.05;
    // Unit normals keep the distance field exact, so the bevel planes mesh flat.
    const len = Math.hypot(slope, 1);
    const blade = sdf
      .extrude(bladeOutline, 0.05, 0.002)
      .intersect(sdf.halfSpace([slope / len, 0, 1 / len], half / len))
      .intersect(sdf.halfSpace([slope / len, 0, -1 / len], half / len));
    k.body(
      'blade',
      blade.paintFn((x) => mixRgb(STEEL, EDGE, clamp((x - 0.27) / 0.05))),
      // Flat shading: the blade faces are planes, and smooth normals over the long reduced
      // triangles showed crumpled creases.
      { color: '#b9c0c8', roughness: 0.3, metalness: 0.9, flat: true },
    );
  },
});
