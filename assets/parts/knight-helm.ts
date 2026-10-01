import { mixRgb, profile, rgb, sdf, type Part, type PartTint, type Vec3 } from '../../src/index.js';

/**
 * Knight helm (part of `assets/knight.ts`; standalone `assets/knight-helm.ts`).
 *
 * A big round steel helm with a gold brow band, crest plate, ear discs, and finial, and a red
 * plume of feathers that falls over toward the right and back.
 * Class: head. Local frame: the origin is the head center of the 1x hero base (knight frame
 * (0, 0.675, 0)), +Y up, the face toward +Z. Fit: the helm takes the 1x hero head.
 * Bodies: helm, helm-gold (bone `head`), feathers (bone `plume`, a child of `head` at the socket).
 * Tint slot: `plume` (the feathers; the knight maps it to `clothing`).
 * Regions: `inside`, the space under the helm where hair may stay.
 *
 * The shape code is the knight's, unchanged, in the knight's frame; `local` moves the mount point
 * to the origin, and the host's pose moves it back, so the worn helm stays the same.
 */

const C = {
  steel: '#bcc2cb',
  steelDark: '#8e959f',
  gold: '#e0b040',
  plume: '#e03a44',
  plumeDark: '#a8202c',
};

/** The mount point in the knight frame: the head center of the hero base. */
export const KNIGHT_HELM_MOUNT: Vec3 = [0, 0.675, 0];
const local = (s: sdf.Shape) => s.at(-KNIGHT_HELM_MOUNT[0], -KNIGHT_HELM_MOUNT[1], -KNIGHT_HELM_MOUNT[2]);

const hard = (s: sdf.Shape) => s.mirror('x', 0);
const PLUME_AT: Vec3 = [0, 0.985, -0.012];

export function knightHelm(tint: PartTint): Part {
  const T = {
    plume: tint('plume', { color: C.plume, follow: 1 }),
    plumeDark: tint('plume', { color: C.plumeDark, follow: 1 }),
    clothBlack: tint('plume', -1), // black in the default look, full in the slot: for paintFn shades
  };

  const helmOuter = sdf.ellipsoid([0.246, 0.275, 0.246]).at(0, 0.69, -0.012);
  const helmInner = sdf.ellipsoid([0.226, 0.255, 0.226]).at(0, 0.69, -0.012);
  const shellOf2 = (s: sdf.Shape) => s.round(0.011).subtract(s.round(-0.01));
  // The face opening: straight across under the brow band, down between the cheek guards,
  // which close in toward the chin.
  const BROW_Y = 0.745;
  const opening = sdf
    .extrude(
      profile.polygon(
        [
          [-0.168, BROW_Y],
          [0.168, BROW_Y],
          [0.176, 0.68],
          [0.162, 0.6],
          [0.13, 0.53],
          [0.11, 0.4],
          [-0.11, 0.4],
          [-0.13, 0.53],
          [-0.162, 0.6],
          [-0.176, 0.68],
        ],
        { smooth: true, samples: 6 },
      ),
      0.5,
      0.01,
    )
    .at(0, 0, 0.27);
  // A notch behind each cheek guard separates it from the neck guard.
  const notch = hard(sdf.capsule([0.25, 0.46, -0.045], [0.25, 0.575, -0.045], 0.016));
  // A low comb over the crown, from the crest plate back to the nape.
  const comb = shellOf2(helmOuter)
    .smoothIntersect(0.006, sdf.box([0.024, 0.5, 0.7], 0.01).at(0, 0.9, -0.1))
    .smoothIntersect(0.01, sdf.halfSpace([0, 0, 1], 0.12));
  const helm = helmOuter
    .smoothUnion(0.008, comb)
    .subtract(helmInner)
    .smoothSubtract(0.006, opening, notch)
    .intersect(sdf.halfSpace([0, -1, 0], -0.49))
    .paintWhere(helmInner.round(0.005), C.steelDark, 0.01);

  // Gold: the brow band all around, the crest plate over the brow, ear discs, and the finial.
  const shellOf = (s: sdf.Shape, out: number, inn: number) => s.round(out).subtract(s.round(-inn));
  // Smooth intersections: hard cuts leave crumpled side walls that metal highlights exaggerate.
  const band = shellOf(helmOuter, 0.008, 0.016)
    .smoothIntersect(0.006, sdf.box([0.8, 0.044, 0.8], 0.01).at(0, BROW_Y + 0.02, 0))
    .smoothSubtract(0.004, opening);
  const crest = shellOf(helmOuter, 0.014, 0.016).smoothIntersect(
    0.005,
    sdf
      .extrude(
        profile.polygon([
          [0, BROW_Y - 0.03],
          [0.058, BROW_Y + 0.02],
          [0.05, BROW_Y + 0.12],
          [-0.05, BROW_Y + 0.12],
          [-0.058, BROW_Y + 0.02],
        ]),
        0.4,
        0.006,
      )
      .at(0, 0, 0.3),
  );
  const earAt = sdf.surfacePoint(helmOuter, [0.3, 0.64, 0.01], 0.004);
  const earDisc = hard(
    sdf
      .cylinder(0.044, 0.02, 0.008)
      .union(sdf.sphere(0.014).at(0, 0.012, 0))
      .rotateZ(-90)
      .at(...earAt),
  );
  const crownAt = sdf.surfacePoint(helmOuter, [0, 1.1, -0.012], 0);
  const finial = sdf
    .union(sdf.cylinder(0.034, 0.03, 0.008).at(0, 0.01, 0), sdf.cylinder(0.024, 0.02, 0.006).at(0, 0.03, 0))
    .at(...crownAt);

  // Plume: a tuft of feathers rises out of the finial and falls over toward the right (-X)
  // and back; the tips droop. Strands blend into one soft mass; darker streaks read as barbs.
  const feather = (dx: number, dz: number, h: number, r: number) =>
    sdf.chain(
      [
        [PLUME_AT[0], PLUME_AT[1], PLUME_AT[2], r * 0.7],
        [PLUME_AT[0] + dx * 0.15, PLUME_AT[1] + h * 0.55, PLUME_AT[2] + dz * 0.2, r],
        [PLUME_AT[0] + dx * 0.5, PLUME_AT[1] + h * 0.95, PLUME_AT[2] + dz * 0.6, r * 0.85],
        [PLUME_AT[0] + dx * 0.85, PLUME_AT[1] + h * 0.85, PLUME_AT[2] + dz * 0.9, r * 0.5],
        [PLUME_AT[0] + dx, PLUME_AT[1] + h * 0.6, PLUME_AT[2] + dz, r * 0.18],
      ],
      0.012,
    );
  const feathers = sdf
    .smoothUnion(
      0.022,
      feather(-0.2, -0.02, 0.13, 0.022),
      feather(-0.17, -0.07, 0.16, 0.026),
      feather(-0.12, -0.1, 0.175, 0.027),
      feather(-0.07, -0.09, 0.17, 0.025),
      feather(-0.03, -0.05, 0.15, 0.022),
      feather(0.04, -0.04, 0.12, 0.018),
      feather(-0.15, 0.03, 0.14, 0.02),
    )
    .paintWhere(sdf.sphere(0.07).at(...PLUME_AT), T.plumeDark, 0.04)
    .paintFn((x, y, z, base) =>
      Math.sin(Math.atan2(x - PLUME_AT[0], z - PLUME_AT[2]) * 26 + y * 40) > 0.6 ? mixRgb(base, rgb(T.clothBlack), 0.2) : base,
    );

  // Under the helm: the inside of the shell and the face opening, for hair.
  const inside = helmInner.round(-0.003).union(opening.round(-0.008).intersect(helmOuter.round(-0.002)));

  return {
    name: 'knight-helm',
    bodies: [
      { name: 'helm', shape: local(helm), options: { color: C.steel, roughness: 0.4, metalness: 0.8 }, bone: 'head' },
      {
        name: 'helm-gold',
        shape: local(sdf.union(band, crest, earDisc, finial)),
        options: { color: C.gold, roughness: 0.3, metalness: 0.9, detail: 0.0035 },
        bone: 'head',
      },
      { name: 'feathers', shape: local(feathers), options: { color: T.plume, roughness: 0.8, detail: 0.004 }, bone: 'plume' },
    ],
    regions: { inside: local(inside) },
    sockets: {
      plume: [PLUME_AT[0] - KNIGHT_HELM_MOUNT[0], PLUME_AT[1] - KNIGHT_HELM_MOUNT[1], PLUME_AT[2] - KNIGHT_HELM_MOUNT[2]],
    },
  };
}
