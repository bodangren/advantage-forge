import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — blue mage robe (equipment/armor/mage-robe).
 *
 * Role: equipment display piece for the Chibi Quest hamlet shop; must read at 128 px.
 * Size: 1.1 m tall, stands on y = 0, centered on the Y axis, front toward +Z.
 * One idea: a sky-blue wizard robe on an invisible body — a bell skirt, two huge
 *   drooping sleeves, gold stars along the hem and cuffs, one twisted rope belt.
 * Shape language: round dominant (bell, balloon sleeves, soft collar), pointed
 *   star accents as the silhouette-breaking feature.
 * Palette (60/30/10): robe blue #5a9fd4 dominant, deep blue #3a6a9a shadows,
 *   light blue #7ab8e0 on the shoulders; gold #d4a93a stars and bands (accent);
 *   honey-oak rope #b5814a with warm brown #8a5a35 strands.
 * Materials: robe cloth (roughness 0.88, weave in bump), gold trim (roughness
 *   0.3, metalness 1), rope (roughness 0.9, strand grooves in bump).
 * Detail: primary bell + sleeves + collar; secondary hem band, cuff bands, belt
 *   and knot; tertiary stars, pleats, weave. Focal point: the gold stars.
 * Rig/animation: none (static display prop).
 */

const BLUE = rgb('#5a9fd4');
const BLUE_DEEP = rgb('#3a6a9a');
const BLUE_DARK = rgb('#2e5a86');
const BLUE_LIGHT = rgb('#7ab8e0');
const GOLD = '#d4a93a';
const ROPE = rgb('#b5814a');
const ROPE_DARK = rgb('#8a5a35');

const ss = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// A 5-pointed star outline, one point up.
const star = (rOut: number, rIn: number) => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? rOut : rIn;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return profile.polygon(pts);
};

export default defineAsset({
  name: 'mage-robe',
  description:
    'Sky-blue chibi mage robe standing as on an invisible body: bell skirt, wide drooping sleeves, gold star trim along the hem and cuffs, and a twisted rope belt with a knot.',
  detail: 0.006,
  reference: 'docs/item-mockups/mage-robe-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ---------------------------------------------------------- robe (cloth)
    // Bell profile: closed rounded shoulder top (the invisible body's neck), a
    // slim chest, then the skirt flaring hard to a wavy hem at the ground.
    const robeProfile = profile.polygon(
      [
        [0, 1.05],
        [0.04, 1.062],
        [0.08, 1.05],
        [0.11, 1.005],
        [0.135, 0.955],
        [0.155, 0.9],
        [0.165, 0.82],
        [0.172, 0.72],
        [0.18, 0.61],
        [0.19, 0.55],
        [0.2, 0.49],
        [0.225, 0.41],
        [0.255, 0.32],
        [0.285, 0.22],
        [0.31, 0.12],
        [0.325, 0.06],
        [0.33, 0.035],
        [0.315, 0.02],
        [0.27, 0.017],
        [0, 0.016],
      ],
      { smooth: true, samples: 14 },
    );
    // The shoulder dome, clipped flat so the smooth profile cannot spike.
    const skirtCore = sdf.revolve(robeProfile).intersect(sdf.halfSpace([0, 1, 0], 1.062));
    // A soft raised collar ring at the neck.
    const collar = sdf.torus(0.11, 0.022).scale([1, 0.7, 1]).at(0, 0.998, 0.004);
    // One wide sleeve, mirrored hard: from the shoulder, ballooning out and
    // hanging down to a wide cuff at the hip, clear of the skirt silhouette.
    const sleeveL = sdf.cone([0.15, 0.9, 0.005], [0.31, 0.47, 0.02], 0.11, 0.075).round(0.012);
    const sleeves = sleeveL.mirror('x', 0);
    const robeCore = sdf
      .smoothUnion(0.045, skirtCore, collar)
      .smoothUnion(0.04, sleeves)
      // The smooth profile closure can overshoot below the floor: clip it.
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    const robeShape = robeCore
      // Pleats grow toward the hem; a slow 3-lobe warp keeps the hem wavy.
      .displace(
        0.012,
        (x, y, z) => {
          const a = Math.atan2(z, x);
          const lower = Math.min(1, Math.max(0, (0.62 - y) / 0.52));
          const pleat = Math.sin(a * 6 + 0.4) * (0.25 + 0.75 * lower);
          const warp = Math.sin(a * 3 - 1.2) * 0.4 * lower;
          return (pleat + warp) * 0.8;
        },
        1.4,
      )
      // Soft cloth irregularity so the silhouette is not machine-perfect.
      .displace(0.0035, (x, y, z) => noise.fbm(x * 7, y * 7, z * 7, 3), 1.2)
      .paintFn((x, y, z) => {
        let c = BLUE;
        // Damp shadow near the ground, sun-caught shoulders.
        c = mixRgb(c, BLUE_DEEP, 0.55 * ss(0.5, 0.08, y));
        c = mixRgb(c, BLUE_DARK, 0.55 * ss(0.24, 0.03, y));
        c = mixRgb(c, BLUE_LIGHT, 0.55 * ss(0.78, 0.99, y));
        // Cloth patchiness.
        const patch = 0.5 + 0.5 * noise.fbm(x * 4, y * 4, z * 4, 2);
        c = mixRgb(c, BLUE_DEEP, 0.18 * patch);
        return c;
      })
      // A darker wrap band crosses the chest from the left shoulder to the belt.
      .paintWhere(sdf.box([0.05, 0.42, 0.3], 0.012).rotateZ(-38).at(0.055, 0.72, 0.1), BLUE_DARK, 0.02)
      .paintWhere(collar.round(0.008), BLUE_DARK, 0.02);
    k.body('robe', robeShape, {
      color: '#5a9fd4',
      roughness: 0.88,
      metalness: 0,
      detail: 0.006,
      paintWeight: 2,
      maxTriangles: 3000,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 46, y * 46, z * 46, 2),
    });

    // ---------------------------------------------------------- gold trim
    // Thin shells of the cloth shapes: bands are flush, stars stand proud.
    const bandShell = robeCore.round(0.008).subtract(robeCore.round(-0.003));
    const starShell = robeCore.round(0.017).subtract(robeCore.round(-0.002));
    const sleeveStarShell = sleeveL.round(0.016).subtract(sleeveL.round(-0.002));

    // The hem band: a gold ring hugging the skirt just above the edge.
    const hemBand = bandShell.intersect(sdf.box([0.9, 0.05, 0.9], 0.01).at(0, 0.055, 0));
    // The cuff bands: gold rings at the sleeve openings.
    const cuffBand = sleeveL
      .round(0.008)
      .subtract(sleeveL.round(-0.003))
      .intersect(sdf.box([0.4, 0.05, 0.4], 0.01).at(0.308, 0.5, 0.02))
      .mirror('x', 0);

    // Hem stars: a ring of nine, probed onto the displaced skirt surface.
    const hemStars: sdf.Shape[] = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.18;
      const dx = Math.sin(a);
      const dz = Math.cos(a);
      const hit = sdf.raycast(robeShape, [dx * 0.6, 0.13, dz * 0.6], [-dx, 0, -dz]);
      if (!hit) continue;
      hemStars.push(
        sdf
          .extrude(star(0.032, 0.014), 0.3, 0.002)
          .rotateY((a * 180) / Math.PI)
          .at(hit[0] + dx * 0.002, 0.13, hit[2] + dz * 0.002),
      );
    }
    const hemStarTrim = sdf.intersect(sdf.union(...hemStars), starShell);

    // Sleeve stars: one big gold star on the front-outer face of each sleeve,
    // like the appliqué stars on the mock.
    const sleeveStarHit = sdf.raycast(sleeveL, [0.75, 0.8, 0.85], [-0.485, -0.108, -0.862]);
    const sleeveStars =
      sleeveStarHit === null
        ? null
        : sdf.union(
            sdf
              .extrude(star(0.042, 0.018), 0.3, 0.002)
              .rotateY(45)
              .at(sleeveStarHit[0] + 0.0015, sleeveStarHit[1], sleeveStarHit[2] + 0.0015),
            sdf
              .extrude(star(0.042, 0.018), 0.3, 0.002)
              .rotateY(-45)
              .at(-sleeveStarHit[0] - 0.0015, sleeveStarHit[1], sleeveStarHit[2] + 0.0015),
          );

    // Cuff stars: one small gold star on the front-outer face of each cuff.
    const cuffStarHit = sdf.raycast(sleeveL, [0.6, 0.55, 0.7], [-0.446, -0.064, -0.892]);
    const cuffStars =
      cuffStarHit === null
        ? null
        : sdf.union(
            sdf
              .extrude(star(0.02, 0.0085), 0.3, 0.002)
              .rotateY(45)
              .at(cuffStarHit[0] + 0.0015, cuffStarHit[1], cuffStarHit[2] + 0.0015),
            sdf
              .extrude(star(0.02, 0.0085), 0.3, 0.002)
              .rotateY(-45)
              .at(-cuffStarHit[0] - 0.0015, cuffStarHit[1], cuffStarHit[2] + 0.0015),
          );

    const sleeveStarTrim = sleeveStars === null ? null : sdf.intersect(sleeveStars, sleeveStarShell.mirror('x', 0));
    const cuffStarTrim = cuffStars === null ? null : sdf.intersect(cuffStars, sleeveStarShell.mirror('x', 0));

    k.body(
      'trim-gold',
      sdf.union(hemBand, cuffBand, hemStarTrim, sleeveStarTrim ?? sdf.sphere(0.001), cuffStarTrim ?? sdf.sphere(0.001)),
      {
        color: GOLD,
        roughness: 0.3,
        metalness: 1,
        detail: 0.004,
        maxTriangles: 1000,
        bump: (x, y, z) => 0.0004 * noise.fbm(x * 60, y * 60, z * 60, 2),
      },
    );

    // ---------------------------------------------------------- rope belt
    const BELT_Y = 0.55;
    const belt = sdf.torus(0.185, 0.022).scale([1, 0.85, 1]).at(0, BELT_Y, 0);
    // The knot at the front: two squashed spheres, and two smooth rope ends
    // hanging down from it.
    const knot = sdf.smoothUnion(
      0.01,
      sdf.sphere(0.024).scale([1.15, 0.85, 0.8]).at(0, BELT_Y, 0.2),
      sdf.sphere(0.015).at(0, BELT_Y + 0.018, 0.208),
    );
    const ends = sdf.union(
      sdf.capsule([0.018, BELT_Y - 0.01, 0.2], [0.034, 0.36, 0.228], 0.013),
      sdf.capsule([-0.018, BELT_Y - 0.01, 0.2], [-0.03, 0.43, 0.22], 0.013),
    );
    // Helical strand groove around the belt tube, kept in bump only: sharp
    // paint stripes here would seam-split the mesh and block reduction.
    const strand = (x: number, y: number, z: number) => {
      const a = Math.atan2(z, x);
      const b = Math.atan2((y - BELT_Y) / 0.85, Math.hypot(x, z) - 0.185);
      return Math.sin(3 * b + 20 * a);
    };
    const ropeShape = sdf
      .union(belt, knot, ends)
      .paintFn((x, y, z) => {
        let c = ROPE;
        // Smooth fiber variation only, so the paint never cuts mesh seams.
        const fiber = 0.5 + 0.5 * noise.fbm(x * 18, y * 18, z * 18, 2);
        c = mixRgb(c, ROPE_DARK, 0.3 * fiber);
        c = mixRgb(c, ROPE_DARK, 0.3 * ss(0.52, 0.34, y));
        return c;
      });
    k.body('rope', ropeShape, {
      color: '#b5814a',
      roughness: 0.9,
      metalness: 0,
      detail: 0.005,
      maxTriangles: 900,
      bump: (x, y, z) => 0.001 * Math.max(0, strand(x, y, z)),
    });
  },
});
