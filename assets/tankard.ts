import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — pewter tankard (props/food/tankard).
 *
 * Role: drinkware on the tavern bar; reads at 128 px next to the hamlet set.
 * Size: ~0.16 m tall with the lid up, 0.09 m top diameter, stands on y = 0, faces +Z.
 * One idea: a stout, slightly tapered pewter mug with a chunky D-handle and a
 *   lidded-stein silhouette — rolled lip, lid tilted open at the back hinge.
 * Shape language: round/soft dominant (rolled lip, bulged handle, domed lid),
 *   square secondary (flat foot, straight taper) for a sturdy bar-mug read.
 * Palette: iron family — mid #6c7178 (dominant), shadow #363a3f (foot, inside,
 *   tarnish), highlight #a8acb1 (lip roll, lid crown, handle crest).
 * Materials: one body of pewter, roughness 0.45, metalness 0.85.
 * Detail: primary tapered body + rolled lip + D-handle; secondary lid + hinge
 *   barrels + thumb-rest curve on the back; tertiary tarnish patches, two small
 *   dents, faint hammered bump. Focal point: lid vs rolled lip at the top.
 * Rig/animation: none (static prop).
 */

const MID = rgb('#6c7178'); // pewter mid
const DARK = rgb('#363a3f'); // pewter shadow / tarnish
const LIGHT = rgb('#a8acb1'); // pewter highlight

export default defineAsset({
  name: 'tankard',
  description: 'Stout pewter tankard with a rolled lip, chunky D-handle, and a hinged lid resting slightly open.',
  detail: 0.006,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ body
    // Revolved stout body: flat foot, slight outward taper, rolled lip, and a
    // shallow dish inside so the open lid shows a dark interior.
    const bodyProfile = profile.polygon(
      [
        [0, 0],
        [0.033, 0],
        [0.0395, 0.004],
        [0.041, 0.012],
        [0.0405, 0.03],
        [0.0415, 0.06],
        [0.043, 0.095],
        [0.0452, 0.118],
        [0.0460, 0.13],
        [0.0461, 0.133],
        [0.0439, 0.1335],
        [0.0434, 0.128],
        [0.0430, 0.124],
        [0.0, 0.1225],
      ],
      { smooth: true, samples: 10 },
    );
    const revolve = sdf
      .revolve(bodyProfile)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      // Soft rolled lip: a fat ring blended onto the plain rim.
      .smoothUnion(0.005, sdf.torus(0.0445, 0.0062).at(0, 0.1352, 0));

    // Chunky D-handle on +X: smooth chain from the top lug to the bottom lug.
    const handle = sdf.chain(
      [
        [0.038, 0.118, 0, 0.0135],
        [0.057, 0.112, 0, 0.011],
        [0.068, 0.088, 0, 0.0105],
        [0.070, 0.066, 0, 0.0105],
        [0.061, 0.041, 0, 0.011],
        [0.038, 0.035, 0, 0.0135],
      ],
      0.009,
    );

    // Hinge barrels at the back rim (the lid pivots between them).
    const hinge = sdf.union(
      sdf.cylinder(0.007, 0.018, 0.002).rotateZ(90).at(-0.019, 0.1345, -0.044),
      sdf.cylinder(0.007, 0.018, 0.002).rotateZ(90).at(0.019, 0.1345, -0.044),
    );

    const pewter = sdf
      .smoothUnion(0.006, revolve, handle)
      .union(hinge)
      .paintFn((x, y, z, _base) => {
        // Vertical value plan: gently shaded foot, lighter shoulder.
        let c = mixRgb(MID, DARK, 0.24 * Math.max(0, 1 - y / 0.05) ** 2);
        c = mixRgb(c, LIGHT, 0.32 * Math.max(0, (y - 0.1) / 0.04));
        // Dark interior dish.
        const r = Math.hypot(x, z);
        const inside = Math.max(0, (0.044 - r) / 0.044) * Math.max(0, (y - 0.118) / 0.02);
        c = mixRgb(c, DARK, 0.85 * Math.min(1, inside));
        // Broad soft tarnish, a little heavier toward the foot.
        const tarnish = Math.max(0, noise.fbm(x * 12, y * 12, z * 12, 3)) ** 1.5;
        c = mixRgb(c, DARK, 0.16 * tarnish * (1 - 0.5 * Math.min(1, y / 0.14)));
        // Faint hammered sheen.
        const hammer = 0.5 + 0.5 * noise.fbm(x * 55, y * 55, z * 55, 2);
        c = mixRgb(c, hammer > 0.66 ? LIGHT : DARK, 0.05);
        return c;
      })
      // Two small dents, soft-edged.
      .paintWhere(sdf.sphere(0.011).at(0.012, 0.052, 0.0385), mixRgb(MID, DARK, 0.6), 0.006)
      .paintWhere(sdf.sphere(0.009).at(-0.031, 0.112, 0.029), mixRgb(MID, DARK, 0.6), 0.005);

    k.body('pewter', pewter, {
      color: '#6c7178',
      roughness: 0.45,
      metalness: 0.85,
      detail: 0.005,
      maxTriangles: 1700,
      paintWeight: 2,
      bump: (x, y, z) => {
        const hammer = 0.0005 * noise.fbm(x * 60, y * 60, z * 60, 2);
        // Dent depressions match the painted dents above.
        const d1 = Math.hypot(x - 0.012, y - 0.052, z - 0.0385);
        const d2 = Math.hypot(x + 0.031, y - 0.112, z - 0.029);
        const dent = -0.0016 * Math.exp(-((d1 / 0.009) ** 2)) - 0.0013 * Math.exp(-((d2 / 0.007) ** 2));
        return hammer + dent;
      },
    });

    // ------------------------------------------------------------------ lid
    // Lid group pivots on the hinge line at the back rim, resting slightly open.
    k.group('lid', { at: [0, 0.1345, -0.043], rotate: [-10, 0, 0] }, (g) => {
      const lid = sdf
        .smoothUnion(
          0.003,
          sdf.cylinder(0.0445, 0.005, 0.0025).at(0, 0.004, 0.0425),
          sdf.sphere(0.042).scale([1, 0.11, 1]).at(0, 0.0055, 0.0425),
        )
        // Thumb-rest curve on the back: a little crest rising over the hinge.
        .smoothUnion(
          0.0035,
          sdf.chain(
            [
              [0, 0.006, 0.004, 0.005],
              [0, 0.015, -0.005, 0.0045],
              [0, 0.024, -0.013, 0.004],
            ],
            0.003,
          ),
        )
        .paintFn((x, y, z, _base) => {
          // Crown highlight on top, soft dark underside.
          let c = mixRgb(MID, LIGHT, 0.55 * Math.max(0, (y - 0.003) / 0.008));
          c = mixRgb(c, DARK, 0.35 * Math.max(0, (0.0015 - y) / 0.005));
          // Match the body's tarnish so the lid reads as the same metal.
          const tarnish = Math.max(0, noise.fbm(x * 12, y * 12 + 3.7, z * 12, 3)) ** 1.5;
          c = mixRgb(c, DARK, 0.2 * tarnish);
          return c;
        });
      g.body('lid-pewter', lid, {
        color: '#6c7178',
        roughness: 0.45,
        metalness: 0.85,
        detail: 0.005,
        maxTriangles: 600,
        paintWeight: 2,
        bump: (x, y, z) => 0.0005 * noise.fbm(x * 60, y * 60, z * 60, 2),
      });
    });
  },
});
