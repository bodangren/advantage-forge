import { noise, profile, rgb, sdf, type Part, type PartTint } from '../../src/index.js';

/**
 * Wizard hat (part of `assets/wizard.ts`; standalone `assets/wizard-hat.ts`).
 *
 * A huge floppy red witch hat: a wide brim that droops at the edge, a cone crown with a point that
 * bends over to the left and back, gold sparks on the felt, and a leather band with a gold flame
 * emblem and a red gem.
 * Class: head. Local frame: the character axes, with the origin at the hat pivot (the crown base
 * center, MOUNT). The code is the wizard's, unchanged, tipped as the wizard wears it; the host
 * moves the origin back with a translation, so the mesh stays the same.
 * Bodies: hat (skin tags on `hatroot` and `hattip`), hat-band (bone `hatroot`).
 * Tint slot: `clothing` (the felt and its dark underside).
 */

type V3 = readonly [number, number, number];

const C = {
  redDark: '#7e1f1c',
  hatInside: '#5a1a17',
  leather: '#74462a',
  gold: '#e2b04a',
  gem: '#c0222a',
};

/** The hat's pivot: the center of the crown's base (and the `hatroot` bone). */
export const HAT_AT: V3 = [0, 0.735, -0.012];
/** The part origin: the pivot rounded to 1/1024 m, so the host round trip adds no float error. */
export const MOUNT: V3 = HAT_AT.map((v) => Math.round(v * 1024) / 1024) as unknown as V3;

export function wizardHat(tint: PartTint): Part {
  const T = {
    cloth: tint('clothing'),
    hatInside: tint('clothing', { color: C.hatInside, follow: 1 }),
  };
  const local = (s: sdf.Shape) => s.at(-MOUNT[0], -MOUNT[1], -MOUNT[2]);
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
    return y0 + ((y1 - y0) * Math.min(1, Math.max(0, (r - r0) / (r1 - r0))));
  };
  const brimWave = (x: number, z: number) => Math.sin(Math.atan2(z, x) * 4 - 1.3) * Math.min(1, Math.max(0, (Math.hypot(x, z) - 0.2) / 0.15));
  const hatPose = (s: sdf.Shape) => s.rotateX(-12).rotateZ(-10).at(...HAT_AT);
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
    // Soft felt: the edge rises and falls in four broad waves. The sign flips across the
    // brim's middle surface, so both faces move the same way and the brim keeps its thickness.
    .displace(0.016, (x, y, z) => brimWave(x, z) * Math.tanh((y - brimMid(Math.hypot(x, z))) / 0.004), 2);
  const crownCone = sdf.cone([0, 0.0, 0], [0, 0.19, -0.006], 0.212, 0.1);
  const point = sdf.chain(
    [
      [0.0, 0.18, -0.008, 0.1],
      [0.02, 0.25, -0.02, 0.072],
      [0.08, 0.305, -0.04, 0.05],
      [0.17, 0.322, -0.06, 0.034],
      [0.24, 0.285, -0.07, 0.022],
      [0.272, 0.228, -0.07, 0.013],
      [0.268, 0.19, -0.066, 0.006],
    ],
    0.03,
  );
  const hatInner = sdf.ellipsoid([0.212, 0.2, 0.2]).at(0, -0.06, 0.01);
  // A few gold sparks are stitched over the felt.
  const sparks = (x: number, y: number, z: number, base: readonly [number, number, number]) => {
    const c = 0.055;
    const i = Math.floor(x / c);
    const j = Math.floor(y / c);
    const l = Math.floor(z / c);
    if (noise.random(i, j, l) < 0.8) return base;
    const cx = (i + 0.3 + 0.4 * noise.random(j, l, i)) * c;
    const cy = (j + 0.3 + 0.4 * noise.random(l, i, j)) * c;
    const cz = (l + 0.3 + 0.4 * noise.random(i, l, j)) * c;
    return Math.hypot(x - cx, y - cy, z - cz) < 0.008 ? rgb(C.gold) : base;
  };
  const hatLocal = sdf
    .smoothUnion(0.03, brim.bone('hatroot'), crownCone.bone('hatroot'), point.bone('hattip'))
    .subtract(hatInner)
    .paintFn((x, y, z, base) => {
      // The underside of the brim and the inside of the crown are dark.
      const r = Math.hypot(x, z);
      return r < 0.4 && y < brimMid(r) - 0.016 * brimWave(x, z) ? rgb(T.hatInside) : base;
    });
  const hatShape = hatPose(hatLocal).paintFn(sparks);
  const band = crownCone
    .round(0.009)
    .smoothIntersect(0.004, sdf.box([0.6, 0.048, 0.6], 0.008).at(0, 0.058, 0))
    .subtract(hatInner);
  const emblemAt: V3 = [0.086, 0.064, 0.183];
  const emblem = sdf
    .extrude(
      profile.polygon(
        [
          [0, -0.026],
          [0.024, -0.006],
          [0.022, 0.018],
          [0.006, 0.042],
          [0.004, 0.016],
          [-0.012, 0.03],
          [-0.022, 0.004],
        ],
        { smooth: true, samples: 4 },
      ),
      0.016,
      0.004,
    )
    .scale(1.6)
    .rotateY(25)
    .at(...emblemAt);
  const emblemGem = sdf.sphere(0.018).scale([1, 1.2, 0.7]).rotateY(25).at(emblemAt[0] + 0.006, emblemAt[1] - 0.004, emblemAt[2] + 0.012);
  const bandShape = hatPose(band.union(emblem.paint(C.gold), emblemGem.paint(C.gem)));

  return {
    name: 'wizard-hat',
    bodies: [
      { name: 'hat', shape: local(hatShape), options: { color: T.cloth, roughness: 0.85 } },
      { name: 'hat-band', shape: local(bandShape), options: { color: C.leather, roughness: 0.6 }, bone: 'hatroot' },
    ],
  };
}
