import { profile, sdf, type Part, type PartTint, type Vec3 } from '../../src/index.js';

/**
 * Dragoon helm (part of `assets/dragoon.ts`; standalone `assets/dragoon-helm.ts`).
 *
 * A dark-blue winged dragon helm: a riveted silver brim, three ribs, a center spike, two horn
 * blades, a bat wing at each temple, and cheek guards. Class: head. Local frame: the origin is
 * the head center (0, 0.675, 0) of the hero base, +Y up, the face toward +Z.
 * Bodies: helm, wings, helm-silver, rivets (bone `head`). Tint slot: `plate` (helm, wings).
 * Regions: `inside`, the space under the helm where hair stays.
 * The shape code is the dragoon's, unchanged; `local` and the host pose cancel.
 */

const C = {
  plate: '#4a5a7a',
  plateDark: '#2e3a52',
  silver: '#c3c8cf',
  rivet: '#d8dce0',
};
const rad = Math.PI / 180;
const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const hard = (s: sdf.Shape) => s.mirror('x', 0);

/** The mount point: the head center, rounded to 1/1024 m. */
export const DRAGOON_HELM_MOUNT: Vec3 = [0, Math.round(0.675 * 1024) / 1024, 0];
const local = (s: sdf.Shape) => s.at(-DRAGOON_HELM_MOUNT[0], -DRAGOON_HELM_MOUNT[1], -DRAGOON_HELM_MOUNT[2]);

export function dragoonHelm(tint: PartTint): Part {
  const T = {
    plate: tint('plate'),
    plateDark: tint('plate', { color: C.plateDark, follow: 1 }),
  };
    const head = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
        pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
        sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
      )
      .bone('head');
    const helmOuter = sdf.ellipsoid([0.246, 0.275, 0.246]).at(0, 0.69, -0.012);
    const helmInner = sdf.ellipsoid([0.226, 0.255, 0.226]).at(0, 0.69, -0.012);
    const BROW_Y = 0.745;
    const HEM_Y = 0.585; // the dome ends at the jaw line at the back and the sides
    // The face opening: ear to ear under the brim; the fringe and the brows show.
    const opening = sdf
      .extrude(
        profile.polygon(
          [
            [-0.2, BROW_Y],
            [0.2, BROW_Y],
            [0.212, 0.66],
            [0.2, 0.5],
            [-0.2, 0.5],
            [-0.212, 0.66],
          ],
          { smooth: true, samples: 6 },
        ),
        0.5,
        0.01,
      )
      .at(0, 0, 0.27);
    const helm = helmOuter
      .subtract(helmInner)
      .smoothSubtract(0.006, opening)
      .intersect(sdf.halfSpace([0, -1, 0], -HEM_Y))
      .paintWhere(helmInner.round(0.005), T.plateDark, 0.01);
    // Two flat cheek guards beside the face, hugging the head, with a silver lower edge.
    const CHEEK_Y = 0.604;
    const cheekGuard = head
      .round(0.026)
      .subtract(head.round(0.01))
      .intersect(sdf.box([0.1, 0.104, 0.14], 0.012).at(0.2, CHEEK_Y + 0.052, 0.02))
      .paintWhere(sdf.halfSpace([0, 1, 0], CHEEK_Y + 0.011), C.silver, 0.004);
    const helmBody = sdf.union(helm, hard(cheekGuard));

    // Silver: a riveted brim band standing 0.01 proud, three ribs up the dome, the horn blades,
    // the center spike.
    const shellOf = (s: sdf.Shape, out: number, inn: number) => s.round(out).subtract(s.round(-inn));
    const BAND_Y = BROW_Y + 0.0135;
    const band = shellOf(helmOuter, 0.01, 0.016)
      .smoothIntersect(0.004, sdf.box([0.8, 0.025, 0.8], 0.008).at(0, BAND_Y, 0))
      .smoothSubtract(0.004, opening.round(-0.004));
    const rib = (x: number, w: number) =>
      shellOf(helmOuter, 0.012, 0.016)
        .smoothIntersect(0.004, sdf.box([w, 0.7, 0.7], 0.008).at(x, 0.9, 0))
        .intersect(sdf.halfSpace([0, -1, 0], -(BROW_Y + 0.02)))
        .intersect(sdf.halfSpace([0, 0, -1], 0.03));
    const ribs = sdf.union(hard(rib(0.135, 0.036)), rib(0, 0.03));
    // A curved horn blade rises from the top of each side rib, tip leaning out.
    const blade = sdf
      .extrude(
        profile.polygon(
          [
            [0.104, 0.89],
            [0.17, 0.89],
            [0.188, 0.94],
            [0.212, 0.99],
            [0.228, 1.035],
            [0.174, 1.0],
            [0.132, 0.958],
          ],
          { smooth: true, samples: 4 },
        ),
        0.03,
        0.006,
      )
      .at(0, 0, -0.02);
    const crownAt = sdf.surfacePoint(helmOuter, [0, 1.1, -0.012], 0);
    const spike = sdf
      .cone([0, crownAt[1] - 0.012, crownAt[2]], [0, crownAt[1] + 0.14, crownAt[2]], 0.032, 0.005)
      .union(sdf.cylinder(0.042, 0.026, 0.008).at(0, crownAt[1] + 0.002, crownAt[2]));
    // Eight rivets on the front half of the brim.
    const rivet = (a: number) => {
      const s = Math.sin(a * rad);
      const c = Math.cos(a * rad);
      const p = sdf.raycast(band, [0.7 * s, BAND_Y, -0.012 + 0.7 * c], [-s, 0, -c]);
      return sdf.sphere(0.0075).at(...(p ?? [0, BAND_Y, 0.25]));
    };
    const rivets = sdf.union(...[-82, -58, -34, -11, 11, 34, 58, 82].map(rivet));
    // A bat wing on each side of the helm at the temple: a thin membrane, an arm along the
    // leading edge (silver), and three fingers, swept back.
    const rootAt = sdf.surfacePoint(helmOuter, [0.4, 0.7, -0.012], -0.014);
    const WING = [
      [0, 0.02],
      [0.03, 0.05],
      [0.075, 0.075],
      [0.118, 0.06],
      [0.16, 0.035],
      [0.125, 0.03],
      [0.146, -0.015],
      [0.102, -0.003],
      [0.096, -0.04],
      [0.058, -0.008],
      [0.016, -0.022],
    ] as const;
    const WRIST = [0.075, 0.072] as const;
    const wingPose = (s: sdf.Shape) => s.scale(1.3).rotateZ(12).rotateY(30).at(...rootAt);
    const membrane = wingPose(sdf.extrude(profile.polygon(WING.map(([x, y]) => [x, y] as [number, number])), 0.009, 0.003));
    const fingers = wingPose(
      sdf.union(...[WING[4], WING[6], WING[8]].map(([x, y]) => sdf.capsule([WRIST[0], WRIST[1], 0], [x * 0.97, y * 0.97 + 0.002, 0], 0.0072))),
    );
    const leading = wingPose(
      sdf.union(sdf.capsule([0.004, 0.02, 0], [WRIST[0], WRIST[1], 0], 0.0095), sdf.capsule([WRIST[0], WRIST[1], 0], [0.158, 0.038, 0], 0.0085)),
    );
    const wingsBody = hard(sdf.union(membrane, fingers));
    const silverBody = sdf.union(band, ribs, hard(blade), spike, hard(leading));
    
    const insideHelm = helmInner.round(-0.003).union(opening.round(-0.008).intersect(helmOuter.round(-0.002)));

  return {
    name: 'dragoon-helm',
    bodies: [
      { name: 'helm', shape: local(helmBody), options: { color: T.plate, roughness: 0.55, metalness: 0.4 }, bone: 'head' },
      { name: 'wings', shape: local(wingsBody), options: { color: T.plate, roughness: 0.55, metalness: 0.4, detail: 0.0042 }, bone: 'head' },
      { name: 'helm-silver', shape: local(silverBody), options: { color: C.silver, roughness: 0.35, metalness: 0.8, detail: 0.0045 }, bone: 'head' },
      { name: 'rivets', shape: local(rivets), options: { color: C.rivet, roughness: 0.3, metalness: 0.85, detail: 0.004 }, bone: 'head' },
    ],
    regions: { inside: local(insideHelm) },
  };
}
