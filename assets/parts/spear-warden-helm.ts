import { profile, sdf, type Part, type Vec3 } from '../../src/index.js';

/**
 * Spear warden helm (part of `assets/spear-warden.ts`; standalone `assets/spear-warden-helm.ts`).
 * A faceted bronze cap with a studded rim band, a pentagon brow plate, a nose ridge, two cheek
 * plates, and a flared neck guard; the face and the ears stay open. Class: head. Local frame: the
 * origin is the head center of the hero base (rounded to 1/1024 m), +Y up, the face toward +Z.
 * Bodies: helmet, helmet-dark (skin tag `head`). Tint slots: none. The red crest is the separate
 * part `spear-warden-crest`; the standalone crest shows it on this helm.
 * The shape code is the spear warden's, unchanged; `local` and the host pose cancel.
 */

const C = { bronze: '#c99a30', bronzeDark: '#86601f' };
const HEAD_Y = 0.675;
const HEAD = [0.205, 0.2, 0.19] as const;
const pair = (s: sdf.Shape) => s.mirror('x');
const rad = Math.PI / 180;

/** The mount point: the head center, rounded to 1/1024 m (the same point as the crest's). */
export const SPEAR_WARDEN_HELM_MOUNT: Vec3 = [0, Math.round(0.675 * 1024) / 1024, 0];
const local = (s: sdf.Shape) => s.at(-SPEAR_WARDEN_HELM_MOUNT[0], -SPEAR_WARDEN_HELM_MOUNT[1], -SPEAR_WARDEN_HELM_MOUNT[2]);

/**
 * The rest pose on a table: tipped back `tilt` degrees about X so that the nose ridge and the neck
 * guard touch the ground, then lifted by `lift` onto y = 0. The standalone helm and crest use it.
 */
export const SPEAR_WARDEN_HELM_REST = { tilt: -3.5, lift: 0.074 } as const;

export function spearWardenHelm(): Part {
    // The hero base head: the helm measures the face on it.
    const head = sdf.smoothUnion(
      0.06,
      sdf.ellipsoid(HEAD).at(0, HEAD_Y, 0),
      pair(sdf.sphere(0.1).at(0.095, 0.575, 0.072)), // round cheeks
      sdf.ellipsoid([0.11, 0.055, 0.085]).at(0, 0.53, 0.058), // soft chin
    );
    const faceZ = (x: number, y: number) => sdf.raycast(head, [x, y, 1], [0, 0, -1])![2];

    const dome = sdf
      .ellipsoid([HEAD[0] + 0.022, HEAD[1] + 0.024, HEAD[2] + 0.022])
      .at(0, HEAD_Y + 0.012, -0.008)
      .intersect(sdf.halfSpace([0, -1, 0], -0.738))
      // Angular crown: the vertical corners are chamfered, so the dome reads as a faceted bronze cap.
      .smoothIntersect(0.008, sdf.box([0.42, 1, 0.41], 0.01).rotateY(45).at(0, 0.7, -0.008))
      .smoothIntersect(0.006, sdf.box([0.47, 1.0, 0.46], 0.012).at(0, 0.5, -0.008));
    const rimBand = dome.round(0.016).intersect(sdf.box([1, 0.05, 1]).at(0, 0.77, 0));
    // The neck guard flares out behind; the ears and the face stay open.
    const guardShape = sdf
      .revolve(
        profile.polygon(
          [
            [0.205, 0.75],
            [0.226, 0.7],
            [0.238, 0.66],
            [0.242, 0.625],
            [0.224, 0.618],
            [0.216, 0.66],
            [0.208, 0.7],
            [0.19, 0.735],
          ],
          { smooth: true, samples: 4 },
        ),
      )
      .scale([1, 1, 0.95])
      .at(0, 0, -0.012)
      .intersect(sdf.halfSpace([0, 0, 1], -0.05));
    // Brow plate: a flat pentagon 0.08 wide on the forehead, tipped back so its point meets the skin.
    const domeFront = sdf.raycast(dome, [0, 0.78, 1], [0, 0, -1])![2];
    const pent = profile.polygon([
      [-0.045, 0.045],
      [0.045, 0.045],
      [0.05, -0.005],
      [0, -0.058],
      [-0.05, -0.005],
    ]);
    const plateAt = (s: sdf.Shape) => s.rotateX(14).at(0, 0.742, domeFront - 0.008);
    const plate = plateAt(sdf.extrude(pent, 0.06, 0.004));
    const plateRim = plateAt(
      sdf
        .extrude(profile.offsetProfile(pent, 0.0035), 0.068, 0.003)
        .subtract(sdf.extrude(profile.offsetProfile(pent, -0.009), 0.3)),
    );
    // Nose ridge: a thin bar from the brow plate down the bridge of the nose.
    const nb0 = faceZ(0, 0.695);
    const nb1 = faceZ(0, 0.6);
    const ridge = sdf.capsule([0, 0.7, nb0 + 0.012], [0, 0.6, nb1 + 0.022], 0.0095).scale([1, 1, 0.8]).at(0, 0, 0);
    // Cheek guards: flat pentagon plates 0.05 x 0.065 x 0.012 hanging from the rim beside the eyes.
    const chx = 0.176;
    const chy = 0.703;
    const chz = faceZ(chx, chy);
    const chPhi = Math.atan2(chx / (HEAD[0] * HEAD[0]), chz / (HEAD[2] * HEAD[2])) / rad;
    const cheekP = profile.polygon([
      [-0.025, 0.032],
      [0.025, 0.032],
      [0.025, -0.008],
      [0, -0.033],
      [-0.025, -0.008],
    ]);
    const cheekAt = (sh: sdf.Shape) => sh.rotateY(chPhi).at(chx + 0.004 * Math.sin(chPhi * rad), chy, chz + 0.004 * Math.cos(chPhi * rad));
    const cheek = pair(cheekAt(sdf.extrude(cheekP, 0.012, 0.003)));
    const cheekRim = pair(
      cheekAt(
        sdf
          .extrude(profile.offsetProfile(cheekP, 0.003), 0.017, 0.002)
          .subtract(sdf.extrude(profile.offsetProfile(cheekP, -0.006), 0.3)),
      ),
    );
    const helmet = sdf
      .smoothUnion(0.01, dome, rimBand, guardShape, plate, ridge, cheek)
      .paintWhere(sdf.box([1, 0.05, 1]).at(0, 0.77, 0), C.bronzeDark, 0.004)
      .paintWhere(sdf.box([0.04, 1, 1]).at(0, 0.9, 0), C.bronzeDark, 0.004);
    // Rims and trim: raised plate edge, cheek edge, the lower edge of the neck guard, studs on the band.
    const guardEdge = guardShape.round(0.005).intersect(sdf.box([1, 0.022, 1]).at(0, 0.626, 0));
    const studs = sdf.union(
      ...[-80, -58, -36, -14, 14, 36, 58, 80].map((a) => {
        const s = sdf.surfacePoint(rimBand, [0.4 * Math.sin(a * rad), 0.77, 0.4 * Math.cos(a * rad) - 0.008], 0.004);
        return sdf.sphere(0.0065).at(s[0], s[1], s[2]);
      }),
    );
  return {
    name: 'spear-warden-helm',
    bodies: [
      { name: 'helmet', shape: local(helmet.bone('head')), options: { color: C.bronze, roughness: 0.35, metalness: 0.9, detail: 0.006 } },
      {
        name: 'helmet-dark',
        shape: local(sdf.union(plateRim, cheekRim, guardEdge, studs).bone('head')),
        options: { color: C.bronzeDark, roughness: 0.35, metalness: 0.9, detail: 0.006 },
      },
    ],
  };
}
