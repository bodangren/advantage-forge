import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — red cape on a gold clasp (equipment/armor/cape).
 *
 * Role: hero gear shown as an icon and on a 128 px sprite; it must read as
 *   "red cape" from the silhouette alone.
 * Size: cloth exactly 1.0 m from clasp to hem, flared hem on y = 0, the collar
 *   and clasp crest a little above 1.0 m. Centered on the Y axis, faces +Z.
 * One idea: a heroic crimson cape hanging open from a rolled collar and a gold
 *   clasp band, with soft vertical folds that end in points at the hem.
 * Shape language: round and soft (rolled collar, pleated bell, wavy hem); the
 *   gold diamond clasp is the single crisp accent.
 * Palette: cape red #c04434 dominant, deep red #8e2a20 for valleys, inside and
 *   the ground shadow, light red #da6248 on the fold ridges; gold #d4a93a is
 *   the 10% accent at the focal point.
 * Materials: cloth (roughness 0.85, weave in bump), gold (roughness 0.3,
 *   metalness 1).
 * Detail: primary bell + collar; secondary clasp band and diamond; tertiary
 *   pleats, wavy hem, weave. Focal point: the gold clasp at the throat.
 * Rig/animation: none (static display piece).
 * Fit (avatar base, slot back): a full bell over the shoulders. The wall stays 3.5 cm (asset) outside
 *   the hanging arms and fists at 2x (shoulder x 0.34, elbow 0.43, fist 0.50), flares to 0.63 at the hem
 *   (hem 11 cm up = 2.3 cm worn above the ground), and one wedge cut opens the front below the chest so
 *   the legs and feet show. The collar ring stands clear of the torso at 2x (R 0.29) and of the neck.
 */

const RED = rgb('#c44636');
const RED_DEEP = rgb('#8e2a20');
const RED_IN = rgb('#7a2119');
const RED_LIGHT = rgb('#dc654c');
const GOLD = '#d4a93a';
const HEM = 0.11; // hem 11 cm up in asset meters = 2.3 cm above the ground worn

export default defineAsset({
  name: 'cape',
  description:
    'Heroic crimson cape hanging open from a rolled collar and a gold clasp band with a diamond, in soft vertical folds that end in points at the flared hem.',
  detail: 0.008,
  reference: 'docs/item-mockups/cape-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'back', fitScale: 2, origin: [0, 1.005, 0] },

  build(k) {
    // ------------------------------------------------------------- cloth
    // Outer wall of the bell (radius, height) in asset meters; the inner wall is 0.02 m inside it.
    const outer: [number, number][] = [
      [0.27, 0.975], [0.33, 0.925], [0.39, 0.87], [0.45, 0.8], [0.5, 0.72], [0.545, 0.6], [0.58, 0.42], [0.61, 0.25], [0.63, 0.1], [0.635, 0.05],
    ];
    const solid = sdf.revolve(profile.polygon([...outer, [0, 0.05], [0, 0.975]], { smooth: false })).scale([1, 1, 0.8]);
    // Seven to nine soft vertical folds: 0.006 m at the shoulders growing to 0.015 m at the hem.
    const foldFn = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const lower = Math.min(1, Math.max(0, (0.9 - y) / 0.8));
      return Math.cos(a * 8 + 0.4) * (0.4 + 0.6 * lower);
    };
    // Open front: an arch (inverted V, apex under the clasp) removes the front below the chest.
    const frontGap = sdf
      .extrude(
        profile.polygon([
          [-0.75, 0.55],
          [0, 0.8], // apex just below the clasp diamond
          [0.75, 0.55],
          [0.75, -0.2],
          [-0.75, -0.2],
        ]),
        0.9,
        0.03,
      )
      .at(0, 0, 0.5);
    // Wavy hem: keep cloth above a scalloped plane (points at the fold ridges).
    const hemCut = sdf.halfSpace([0, -1, 0], -HEM).displace(
      0.05,
      (x, y, z) => {
        const t = 0.5 - 0.5 * Math.cos(Math.atan2(z, x) * 8 + 0.4);
        return t * t;
      },
      1.3,
    );
    // Fold the solid first, then hollow it, so the wall keeps its 0.02 m thickness everywhere.
    const folded = solid.displace(0.015, foldFn, 1.5);
    // The core and the neck opening hold no cloth: they remove the bottom lid, the top cap, and any axis sliver.
    const neckHole = sdf.union(sdf.cylinder(0.27, 0.5).at(0, 1.1, 0), sdf.cylinder(0.3, 1.0).at(0, 0.35, 0));
    const clothShape = folded
      .subtract(folded.round(-0.02))
      .subtract(neckHole)
      .smoothSubtract(0.02, frontGap)
      .smoothIntersect(0.006, hemCut);
    const cavity = folded.round(-0.01);
    const clothPaint = (x: number, y: number, z: number) => {
      let c = RED;
      c = mixRgb(c, RED_LIGHT, 0.3 * Math.max(0, (y - 0.72) / 0.24));
      c = mixRgb(c, RED_DEEP, 0.42 * Math.min(1, Math.max(0, (0.5 - y) / 0.4)));
      const f = foldFn(x, y, z);
      if (f > 0) c = mixRgb(c, RED_LIGHT, 0.38 * f);
      else c = mixRgb(c, RED_DEEP, 0.38 * -f);
      const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2);
      return mixRgb(c, RED_DEEP, 0.12 * patch);
    };
    k.body('cloth', clothShape.paintFn(clothPaint).paintWhere(cavity, RED_IN, 0.008), {
      color: '#c44636',
      roughness: 0.85,
      metalness: 0,
      detail: 0.006,
      paintWeight: 2,
      maxTriangles: 9000,
      bump: (x, y, z) =>
        0.0016 * noise.fbm(x * 60, y * 60, z * 60, 2) + 0.0008 * noise.fbm(x * 130, y * 130, z * 130, 1),
    });

    // ------------------------------------------------------------- collar
    // A full rolled ring around the neck, clear of the torso and the head.
    const collarShape = sdf
      .torus(0.29, 0.045)
      .scale([1, 1, 0.8])
      .at(0, 0.95, 0)
      .displace(0.002, (x, y, z) => noise.fbm(x * 8, y * 8, z * 8, 2), 1.1);
    const collarPaint = (x: number, y: number, z: number) => {
      const c = mixRgb(RED, RED_LIGHT, 0.25);
      const patch = 0.5 + 0.5 * noise.fbm(x * 5, y * 5, z * 5, 2);
      return mixRgb(c, RED_DEEP, 0.1 * patch);
    };
    k.body('collar', collarShape.paintFn(collarPaint), {
      color: '#c8493a',
      roughness: 0.85,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 900,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });

    // ------------------------------------------------------------- clasp
    const band = sdf.torus(0.385, 0.02).scale([1, 1, 0.8]).at(0, 0.9, 0);
    const diamond = sdf
      .extrude(
        profile.polygon([
          [0, 0.066],
          [0.045, 0.01],
          [0.025, -0.06],
          [0, -0.076],
          [-0.025, -0.06],
          [-0.045, 0.01],
        ]),
        0.024,
        0.005,
      )
      .at(0, 0.9, 0.325);
    k.body('clasp', sdf.union(band, diamond), {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.003,
      maxTriangles: 700,
    });
  },
});
