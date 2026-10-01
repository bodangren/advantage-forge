import { noise, profile, rgb, sdf, type Part, type PartTint } from '../../src/index.js';

/**
 * Witch hat (part of `assets/witch.ts`; standalone `assets/witch-hat.ts`).
 * A huge black hat with a wavy brim, a tall cone crown bent over into a drooping tip, a purple
 * band with a gold buckle, and one patch. Class: head. Local frame: the origin is the center of
 * the crown base, +Y up, the front toward +Z; the host's `hatPose` tips and places it.
 * Bodies: hat (skin tags hatroot and hattip), band, buckle (bone hatroot).
 * Regions: `inner` (the cavity under the crown), `brim` (the brim shape).
 * Tint slot: `band`.
 */
const C = {
  hat: '#1c1a1e',
  hatLit: '#2e2a30',
  hatInside: '#0e0c10',
  band: '#7a3aa0',
  gold: '#c9a24a',
  patch: '#8a4ab0',
};

export function witchHat(tint: PartTint): Part {
  const T = { band: tint('band') };
  const BRIM_MID = [
    [0, 0.021],
    [0.2, 0.016],
    [0.26, 0.004],
    [0.32, -0.0215],
    [0.36, -0.047],
    [0.6, -0.1],
  ] as const;
  const brimMid = (r: number) => {
    let i = 0;
    while (i < BRIM_MID.length - 2 && r > BRIM_MID[i + 1]![0]) i++;
    const [r0, y0] = BRIM_MID[i]!;
    const [r1, y1] = BRIM_MID[i + 1]!;
    return y0 + (y1 - y0) * Math.min(1, Math.max(0, (r - r0) / (r1 - r0)));
  };
  const brimWave = (x: number, z: number) => Math.sin(Math.atan2(z, x) * 3 - 0.6) * Math.min(1, Math.max(0, (Math.hypot(x, z) - 0.2) / 0.15));
  const brim = sdf
    .revolve(
      profile.polygon(
        [
          [0.0, 0.012],
          [0.2, 0.006],
          [0.27, -0.008],
          [0.32, -0.03],
          [0.35, -0.058],
          [0.364, -0.052],
          [0.357, -0.036],
          [0.32, -0.013],
          [0.26, 0.014],
          [0.2, 0.026],
          [0.0, 0.03],
        ],
        { smooth: true, samples: 6 },
      ),
    )
    .displace(0.02, (x, y, z) => brimWave(x, z) * Math.tanh((y - brimMid(Math.hypot(x, z))) / 0.004), 2);
  const crownCone = sdf.revolve(
    profile.polygon(
      [
        [0, -0.02],
        [0.215, -0.02],
        [0.2, 0.04],
        [0.172, 0.1],
        [0.14, 0.16],
        [0.108, 0.212],
        [0.085, 0.245],
        [0, 0.25],
      ],
      { smooth: true, samples: 6 },
    ),
  );
  const point = sdf.chain(
    [
      [0.0, 0.215, 0, 0.095],
      [-0.005, 0.255, 0, 0.072],
      [-0.018, 0.295, 0, 0.053],
      [-0.055, 0.33, 0, 0.038],
      [-0.108, 0.35, 0, 0.026],
      [-0.16, 0.345, 0, 0.017],
      [-0.2, 0.325, 0, 0.011],
      [-0.225, 0.302, 0, 0.007],
    ],
    0.02,
  );
  const hatInner = sdf.ellipsoid([0.212, 0.2, 0.2]).at(0, -0.06, 0.01);
  const crown = sdf.smoothUnion(0.03, crownCone, point);
  const patchAt = sdf.surfacePoint(crown, [0.06, 0.2, 0.3], 0);
  const hatLit = rgb(C.hatLit);
  const hatDark = rgb(C.hatInside);
  const hatLocal = sdf
    .smoothUnion(0.03, brim.bone('hatroot'), crownCone.bone('hatroot'), point.bone('hattip'))
    .subtract(hatInner)
    .paintFn((x, y, z, base) => {
      const r = Math.hypot(x, z);
      if (r < 0.4 && y < brimMid(r) - 0.016 * brimWave(x, z)) return hatDark;
      return noise.fbm(x * 14, y * 9, z * 14, 2) > 0.28 ? hatLit : base;
    })
    .paintWhere(sdf.ellipsoid([0.03, 0.034, 0.03]).at(...patchAt), C.patch);
  const BAND_Y = 0.062;
  const band = crownCone.round(0.008).smoothIntersect(0.006, sdf.box([1, 0.052, 1]).at(0, BAND_Y, 0));
  const crownZ = sdf.raycast(crownCone, [0, BAND_Y, 1], [0, 0, -1])![2];
  const buckle = sdf
    .union(
      sdf.box([0.06, 0.056, 0.014], 0.004).subtract(sdf.box([0.036, 0.03, 0.05])),
      sdf.box([0.007, 0.032, 0.012], 0.002),
    )
    .rotateX(-14)
    .at(0, BAND_Y, crownZ + 0.012);

  return {
    name: 'witch-hat',
    bodies: [
      { name: 'hat', shape: hatLocal, options: { color: C.hat, roughness: 0.9, detail: 0.007 } },
      { name: 'band', shape: band, options: { color: T.band, roughness: 0.7 }, bone: 'hatroot' },
      { name: 'buckle', shape: buckle, options: { color: C.gold, roughness: 0.32, metalness: 0.9, detail: 0.003 }, bone: 'hatroot' },
    ],
    regions: { inner: hatInner, brim },
  };
}
