import { Sdf, profile, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Duelist hat (part of `assets/duelist.ts`; standalone `assets/duelist-hat.ts`).
 * A wide grey felt hat with a gold edge, a brim curled up on one side, and a long white plume.
 * Class: head. Local frame: the hat's own origin (the brim plane); the host tips it back 8 degrees
 * and sets it at (0, 0.772, -0.005) with its `hatPose`. Bodies: hat, plume (bone `head`).
 */

const rad = Math.PI / 180;
const C = { hat: '#8a8078', hatShadow: '#6a6058', hatGold: '#e0b040', plume: '#f4f0e8', plumeShade: '#d8d0c2' };

export function duelistHat(): Part {
    const HAT = rgb(C.hat);
    const SHADE = rgb(C.hatShadow);
    const GOLDEDGE = rgb(C.hatGold);
    // The crown: a dome raised 0.02 m with a soft dent along the top.
    const crownDome = sdf
      .ellipsoid([0.208, 0.17, 0.198])
      .at(0, 0.02, -0.005)
      .intersect(sdf.halfSpace([0, -1, 0], 0.02))
      .paintFn((x, y, z, base) => (y < 0.034 ? SHADE : base));
    const crown = sdf.smoothSubtract(0.03, crownDome, sdf.ellipsoid([0.075, 0.06, 0.15]).at(0, 0.235, -0.01));
    // The brim: a 0.012 m plate reaching 0.09 m past the crown, gold edge band 0.008 m, then warped in height.
    const brimFlat = sdf
      .revolve(
        profile.polygon(
          [
            [0, -0.006],
            [0.2, -0.006],
            [0.27, -0.006],
            [0.278, 0],
            [0.27, 0.006],
            [0.2, 0.006],
            [0, 0.006],
          ],
          { smooth: false },
        ),
      )
      .scale([1.08, 1, 1.04])
      .paintFn((x, y, z, base) => (Math.hypot(x / 1.08, z / 1.04) > 0.2695 ? GOLDEDGE : y < -0.002 ? SHADE : HAT));
    // Droop 15 degrees at the front and back, curl up 20 degrees on the +X side only.
    const DROOP = Math.tan(15 * rad);
    const CURL = Math.tan(20 * rad);
    const lift = (x: number, z: number) =>
      -DROOP * Math.max(0, Math.abs(z) - 0.15) + CURL * Math.max(0, x - 0.15);
    const brim = new Sdf(
      (x, y, z) => brimFlat.dist(x, y - lift(x, z), z) * 0.85,
      {
        min: [brimFlat.bounds.min[0], brimFlat.bounds.min[1] - 0.06, brimFlat.bounds.min[2]],
        max: [brimFlat.bounds.max[0], brimFlat.bounds.max[1] + 0.08, brimFlat.bounds.max[2]],
      },
      (x, y, z, f) => brimFlat.color(x, y - lift(x, z), z, f),
    );
    const hat = sdf.smoothUnion(0.014, crown, brim);
    // The plume: a white feather sweeping up from the right side of the crown and back, curling at the tip.
    const plumeMain = sdf.chain(
      [
        [-0.14, 0.09, -0.02, 0.0232],
        [-0.2, 0.15, -0.04, 0.0377],
        [-0.243, 0.23, -0.08, 0.0493],
        [-0.25, 0.29, -0.14, 0.0522],
        [-0.225, 0.33, -0.21, 0.0435],
        [-0.195, 0.3, -0.27, 0.0319],
        [-0.175, 0.23, -0.3, 0.0174],
      ],
      0.03,
    );
    const plumeTuft = sdf.chain(
      [
        [-0.17, 0.11, 0.0, 0.0203],
        [-0.25, 0.17, 0.0, 0.0319],
        [-0.305, 0.2, -0.05, 0.0290],
        [-0.315, 0.16, -0.11, 0.0174],
      ],
      0.03,
    );
    const PL = rgb(C.plume);
    const PS = rgb(C.plumeShade);
    const plume = sdf
      .smoothUnion(0.03, plumeMain, plumeTuft)
      .displace(0.005, (x, y, z) => Math.sin(x * 95 + y * 70) * Math.cos(z * 80 + y * 40))
      .paintFn((x, y, z, base) => (y < 0.2 ? PS : PL));
  return {
    name: 'duelist-hat',
    bodies: [
      { name: 'hat', shape: hat, options: { color: C.hat, roughness: 0.85, detail: 0.005 }, bone: 'head' },
      { name: 'plume', shape: plume, options: { color: C.plume, roughness: 0.9, detail: 0.004 }, bone: 'head' },
    ],
  };
}
