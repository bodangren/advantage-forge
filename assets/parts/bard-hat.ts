import { profile, sdf, type Part, type PartTint } from '../../src/index.js';

/**
 * Bard hat (part of `assets/bard.ts`; standalone `assets/bard-hat.ts`).
 *
 * A wide teal cap with a dark band, a gold badge on the crown, and a big red plume that arcs
 * back and to the right.
 * Class: head. Local frame: the origin is the center of the brim plane, +Y up, the face toward +Z.
 * The host tips it back and a little to the left, and sets it on the head (see `hatPose`).
 * Bodies: hat, badge, plume (bone `head`).
 * Tint slot: `clothing` (the cap and the band; the bard uses the same slot).
 */

const C = {
  cap: '#4a948a',
  clothDark: '#2c655d',
  feather: '#c4403c',
  featherDark: '#8e2a2c',
  gold: '#d8a93c',
};

export function bardHat(tint: PartTint): Part {
  const T = {
    cap: tint('clothing', { color: C.cap, follow: 1 }),
    clothDark: tint('clothing', { color: C.clothDark, follow: 1 }),
  };
  const crown = sdf.ellipsoid([0.19, 0.2, 0.18]).at(0, 0, -0.005).intersect(sdf.halfSpace([0, -1, 0], 0.01));
  const brim = sdf
    .revolve(
      profile.polygon(
        [
          [0, -0.012],
          [0.22, -0.012],
          [0.3, -0.002],
          [0.335, 0.022],
          [0.345, 0.036],
          [0.333, 0.04],
          [0.305, 0.02],
          [0.22, 0.008],
          [0, 0.008],
        ],
        { smooth: true, samples: 6 },
      ),
    )
    .scale([1, 1, 0.82]);
  const hat = sdf.smoothUnion(0.02, crown, brim).paintWhere(sdf.box([0.5, 0.03, 0.5]).at(0, 0.022, 0), T.clothDark, 0.004);
  // A gold badge on the front of the crown: a thin shell of the crown, cut to the outline.
  const badge = crown
    .round(0.01)
    .subtract(crown.round(-0.004))
    .intersect(
      sdf
        .extrude(
          profile.polygon(
            [
              [-0.075, 0],
              [0.075, 0],
              [0.06, 0.062],
              [0.025, 0.038],
              [0, 0.07],
              [-0.025, 0.038],
              [-0.06, 0.062],
            ],
            { smooth: false },
          ),
          0.4,
        )
        .at(0, 0.022, 0.2),
    );
  const plume = sdf
    .chain(
      [
        [-0.01, 0.05, 0, 0.014],
        [-0.025, 0.15, 0, 0.032],
        [-0.055, 0.235, 0, 0.044],
        [-0.115, 0.29, 0, 0.046],
        [-0.195, 0.3, 0, 0.04],
        [-0.262, 0.262, 0, 0.03],
        [-0.3, 0.19, 0, 0.015],
      ],
      0.03,
    )
    .displace(0.004, (x, y) => Math.sin((x - y) * 150))
    .scale([1, 1, 0.35])
    .rotateY(-20)
    .at(0, 0, 0.12)
    .paintWhere(sdf.halfSpace([0, -1, 0], -0.2), C.featherDark, 0.05);

  return {
    name: 'bard-hat',
    bodies: [
      { name: 'hat', shape: hat, options: { color: T.cap, roughness: 0.85 }, bone: 'head' },
      { name: 'badge', shape: badge, options: { color: C.gold, roughness: 0.32, metalness: 0.9 }, bone: 'head' },
      { name: 'plume', shape: plume, options: { color: C.feather, roughness: 0.75, detail: 0.004 }, bone: 'head' },
    ],
  };
}
