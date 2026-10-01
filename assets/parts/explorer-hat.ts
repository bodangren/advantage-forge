import { noise, profile, sdf, type Part, type PartTint } from '../../src/index.js';

/**
 * Explorer hat (part of `assets/explorer.ts`; standalone `assets/explorer-hat.ts`).
 * A soft khaki bucket hat with a wide drooping brim and a band. Class: head. Local frame: the
 * brim plane at y = 0; the host tilts it up 10 degrees and sets it at (0, 0.765, 0).
 * Bodies: hat, hat-band (bone `head`). Tint slot: `hat` (the band is a darker shade of it).
 */
const BAND = '#8a7a58';

export function explorerHat(tint: PartTint): Part {
  const T = { hat: tint('hat'), band: tint('hat', { color: BAND, follow: 1 }) };
    // A low rounded crown (0.08 m above the brim) with a shallow dent on top and one soft crease
    // down the front.
    const crown = sdf.ellipsoid([0.218, 0.13, 0.212]).intersect(sdf.halfSpace([0, -1, 0], 0.004));
    const dent = sdf.ellipsoid([0.1, 0.025, 0.1]).at(0, 0.148, -0.005);
    const crease = sdf.box([0.014, 0.07, 0.022], 0.006).rotateX(-8).at(0, 0.06, 0.168);
    // The brim: wide (r 0.23), 0.018 thick, drooping 0.02 at the edge, rounded rim.
    const brim = sdf
      .revolve(
        profile.polygon(
          [
            [0.11, 0.01],
            [0.17, 0.009],
            [0.235, 0.0],
            [0.262, -0.012],
            [0.262, -0.03],
            [0.235, -0.018],
            [0.17, -0.009],
            [0.11, -0.008],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 1.02]);
    const hatShape = crown.smoothSubtract(0.02, dent, crease).smoothUnion(0.015, brim);
  const hatBand = sdf.torus(0.2145, 0.012).scale([1, 1, 0.975]).at(0, 0.026, 0);
  return {
    name: 'explorer-hat',
    bodies: [
      {
        name: 'hat',
        shape: hatShape,
        options: { color: T.hat, roughness: 0.85, bump: (x: number, y: number, z: number) => 0.0008 * noise.fbm(x * 90, y * 90, z * 90, 2) },
        bone: 'head',
      },
      { name: 'hat-band', shape: hatBand, options: { color: T.band, roughness: 0.75, detail: 0.006 }, bone: 'head' },
    ],
  };
}
