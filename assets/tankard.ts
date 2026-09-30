import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note: pewter tankard (props/food/tankard), catch-up rework.
 * Role: tavern tableware; reads at 128 px. Size ~0.13 x 0.18 x 0.11 m, on y = 0, faces +Z, handle +X.
 * One idea: a stout tapered pewter stein with a closed domed lid, finial, and thumb-lift.
 * Shape language: round dominant (dome, finial), square secondary (straight taper, foot ring).
 * Palette: pewter #8a9096 (dominant), bands #5e656b (dark), lid highlight lighter.
 * Materials: one pewter body, metalness 0.8, roughness 0.45, hammered bump only (no displace).
 * Detail: revolved body with foot ring and two raised bands, C handle, hinge knuckle on +X,
 *   thumb-lift rising from the hinge. Focal point: lid and finial.
 * Rig/animation: none.
 */


const MID = rgb('#8a9096');
const DARK = rgb('#5e656b');
const LIGHT = rgb('#b4b8bc');

export default defineAsset({
  name: 'tankard',
  description: 'Stout pewter tankard with foot ring, raised bands, C handle, and a closed domed lid with thumb-lift.',
  detail: 0.005,
  reference: 'docs/tavern-mockups/tavern-quest_001.jpg',
  texture: { size: 1024 },

  build(k) {
    const prof = profile.polygon(
      [
        [0, 0],
        [0.046, 0],
        [0.0485, 0.004],
        [0.0485, 0.012],
        [0.0455, 0.016],
        [0.0445, 0.06],
        [0.0435, 0.1],
        [0.0425, 0.125],
        [0.0435, 0.1335],
        [0.0, 0.1335],
      ],
      { smooth: false },
    );
    const band = (y: number) => sdf.torus(0.0455 - 0.03 * (y - 0.02) * 0.1, 0.0045).at(0, y, 0);
    const base = sdf
      .revolve(prof)
      .smoothUnion(0.004, band(0.04), band(0.092));

    const handle = sdf.chain(
      [
        [0.040, 0.115, 0, 0.008],
        [0.060, 0.108, 0, 0.008],
        [0.070, 0.085, 0, 0.008],
        [0.069, 0.060, 0, 0.008],
        [0.060, 0.040, 0, 0.008],
        [0.041, 0.034, 0, 0.008],
      ],
      0.01,
    );

    // Closed lid: thick rim, dome, finial, hinge knuckle, thumb-lift.
    const lid = sdf
      .cylinder(0.0475, 0.012, 0.004)
      .at(0, 0.1395, 0)
      .smoothUnion(
        0.006,
        sdf.sphere(1).scale([0.04, 0.022, 0.04]).at(0, 0.142, 0),
        sdf.sphere(0.0075).at(0, 0.172, 0),
        sdf.cylinder(0.0075, 0.02, 0.002).rotateX(90).at(0.05, 0.1395, 0),
        sdf.chain(
          [
            [0.05, 0.142, 0, 0.007],
            [0.061, 0.152, 0, 0.0065],
            [0.066, 0.162, 0, 0.0065],
          ],
          0.004,
        ),
      );

    const pewter = sdf
      .smoothUnion(0.006, base, handle)
      .union(lid)
      .paintFn((x, y, z, _b) => {
        let c = mixRgb(MID, DARK, 0.2 * Math.max(0, 1 - y / 0.04));
        for (const by of [0.04, 0.092]) c = mixRgb(c, DARK, Math.max(0, 1 - Math.abs(y - by) / 0.0048));
        c = mixRgb(c, LIGHT, 0.4 * Math.max(0, (y - 0.15) / 0.02));
        return c;
      });

    k.body('pewter', pewter, {
      color: '#8a9096',
      roughness: 0.45,
      metalness: 0.8,
      detail: 0.005,
      maxTriangles: 3000,
      paintWeight: 2,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });
  },
});
