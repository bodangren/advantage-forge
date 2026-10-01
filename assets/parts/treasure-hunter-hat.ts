import { noise, profile, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Treasure hunter fedora (part of `assets/treasure-hunter.ts`; standalone `assets/treasure-hunter-hat.ts`).
 * Class: head. Local frame: the brim plane at y = 0 on the head axis; the host tips it up 10 degrees
 * at the front and sets it at y = 0.81 with its `hatPose`. Bodies: hat, hat-band (bone `head`).
 */

const C = { hat: '#8a5a35', hatBand: '#6b4226', hatLight: '#a16a40' };
const pair = (s: sdf.Shape) => s.mirror('x');

export function treasureHunterHat(): Part {
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0.12, 0.014],
            [0.24, 0.012],
            [0.292, 0.008],
            [0.305, -0.002],
            [0.305, -0.026],
            [0.292, -0.022],
            [0.24, -0.014],
            [0.12, -0.014],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 1.02]);
    const crown0 = sdf.revolve(
      profile.polygon(
        [
          [0, 0.198],
          [0.05, 0.196],
          [0.11, 0.186],
          [0.155, 0.162],
          [0.178, 0.12],
          [0.188, 0.06],
          [0.192, 0.0],
          [0.19, -0.02],
          [0, -0.02],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    // A groove along the top and two pinches at the front corners: the fedora's crown.
    const groove = sdf.box([0.05, 0.07, 0.5], 0.022).at(0, 0.228, 0.01);
    const pinches = pair(sdf.sphere(0.042).at(0.152, 0.13, 0.108));
    const crown = crown0.smoothSubtract(0.03, groove, pinches);
    const hatShape = sdf.smoothUnion(0.012, crown, brim).paintFn((x, y, z, base) => {
      const t = Math.min(1, Math.max(0, (y - 0.1) / 0.08)) * 0.45;
      const l = rgb(C.hatLight);
      return [base[0] + (l[0] - base[0]) * t, base[1] + (l[1] - base[1]) * t, base[2] + (l[2] - base[2]) * t];
    });
    const hatBand = sdf.torus(0.19, 0.0125).scale([1, 1, 1.02]).at(0, 0.034, 0);
  return {
    name: 'treasure-hunter-hat',
    bodies: [
      {
        name: 'hat',
        shape: hatShape,
        options: { color: C.hat, roughness: 0.85, bump: (x, y, z) => 0.0008 * noise.fbm(x * 90, y * 90, z * 90, 2) },
        bone: 'head',
      },
      { name: 'hat-band', shape: hatBand, options: { color: C.hatBand, roughness: 0.75, detail: 0.005 }, bone: 'head' },
    ],
  };
}
