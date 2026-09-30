import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — sheathed short sword (equipment/accessories/scabbard).
 *
 * Role: hero gear pickup icon; must read at 128 px.
 * Size: 0.8 m tall, standing upright on its chape (y = 0), facing +Z.
 * One idea: a chunky sheathed sword: dark leather scabbard, bright gold guard, fat grip.
 * Shape language: square/rounded boxes (sturdy) with a round pommel.
 * Palette: scabbard #5a3a28 with #8a5a35 center strip, grip #a8603a, gold #d4a93a.
 * Materials: leather (roughness 0.7), grip leather (0.75), gold (roughness 0.35, metal 1).
 * Detail: primary scabbard, guard, grip; secondary chape, throat, belt-loop band, rivets,
 *   pommel lobes; tertiary leather bump. Focal point: the gold guard.
 * Rig/animation: none.
 */

export default defineAsset({
  name: 'scabbard',
  description:
    'Upright sheathed short sword: dark leather scabbard, gold chape, throat and guard, chunky wrapped grip with belt-loop band and rivets, round pommel.',
  detail: 0.005,
  reference: 'docs/item-mockups/scabbard-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // Scabbard: tapered rounded slab, narrow at the tip.
    const outline = profile.polygon([
      [-0.034, 0.02],
      [0.034, 0.02],
      [0.05, 0.44],
      [-0.05, 0.44],
    ]);
    const slab = sdf.extrude(outline, 0.05, 0.02);
    const strip = sdf.box([0.028, 0.4, 0.06], 0.008).at(0, 0.23, 0.005);
    k.body(
      'leather',
      slab.paintWhere(strip, '#8a5a35', 0.004).paint('#5a3a28').paintWhere(strip, '#8a5a35', 0.004),
      {
        color: '#5a3a28',
        roughness: 0.7,
        maxTriangles: 1400,
        bump: (x, y, z) => 0.0006 * noise.fbm(x * 90, y * 90, z * 90, 2),
      },
    );

    // Grip with belt-loop band and pommel.
    const grip = sdf.capsule([0, 0.5, 0], [0, 0.72, 0], 0.045);
    const band = sdf.box([0.14, 0.1, 0.09], 0.025).at(0, 0.6, 0);
    const grp = sdf
      .smoothUnion(0.01, grip, band)
      .paintFn((x, y, z, base) =>
        mixRgb(base, rgb('#8a4a2a'), 0.5 + 0.5 * Math.sin(y * 150 + Math.atan2(z, x) * 2) ) ,
      );
    k.body('grip', grp, {
      color: '#a8603a',
      roughness: 0.75,
      maxTriangles: 1000,
      bump: (x, y, z) => 0.0007 * noise.fbm(x * 80, y * 80, z * 80, 2),
    });

    // Gold: chape, throat, guard, rivets, pommel.
    const chape = sdf.box([0.09, 0.06, 0.06], 0.02).at(0, 0.035, 0);
    const throat = sdf.box([0.11, 0.035, 0.062], 0.014).at(0, 0.425, 0);
    const guard = sdf.box([0.24, 0.05, 0.06], 0.02).at(0, 0.47, 0);
    const rivets = sdf.union(
      sdf.sphere(0.018).at(-0.04, 0.6, 0.045),
      sdf.sphere(0.018).at(0.04, 0.6, 0.045),
    );
    const pommel = sdf.union(
      sdf.sphere(0.05).at(0, 0.76, 0),
      sdf.sphere(0.02).at(-0.05, 0.76, 0),
      sdf.sphere(0.02).at(0.05, 0.76, 0),
    );
    k.body('gold', sdf.union(chape, throat, guard, rivets, pommel), {
      color: '#d4a93a',
      roughness: 0.35,
      metalness: 1,
      detail: 0.004,
      maxTriangles: 1400,
    });
  },
});
