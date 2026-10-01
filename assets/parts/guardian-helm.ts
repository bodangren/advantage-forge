import { mixRgb, profile, rgb, sdf, type Part, type Vec3 } from '../../src/index.js';

/**
 * Guardian helm (part of `assets/guardian.ts`; standalone `assets/guardian-helm.ts`).
 * Class: head. Local frame: the head center of the hero base (0, 0.675, 0), the face toward +Z.
 * Bodies: helm, helm-gold (bone `head`). Tint slots: none.
 * The shape code is the guardian's, unchanged; `local` and the host pose cancel.
 */

const C = { steel: '#e8e4dc', steelDark: '#b8b4ac', gold: '#d4a93a' };
const rad = Math.PI / 180;

/** The mount point in the guardian frame, rounded to 1/1024 m. */
export const GUARDIAN_HELM_MOUNT: Vec3 = [0, Math.round(0.675 * 1024) / 1024, 0];
const local = (s: sdf.Shape) => s.at(-GUARDIAN_HELM_MOUNT[0], -GUARDIAN_HELM_MOUNT[1], -GUARDIAN_HELM_MOUNT[2]);

export function guardianHelm(): Part {
  // The helm: a round dome over the crown, a gold brow band around the head at y 0.735, and a
  // gold center crest over the top from the band to the back. Open at the face.
  const HELM_C = [0.226, 0.245, 0.214] as const;
  const helmAt = (s: sdf.Shape) => s.at(0, 0.71, -0.008);
  const dome = helmAt(sdf.ellipsoid(HELM_C)).intersect(sdf.halfSpace([0, -1, 0], -0.72)).round(0.004);
  const helm = dome.paintFn((x, y, z, base) => mixRgb(base, rgb(C.steelDark), Math.min(0.55, Math.max(0, (0.83 - y) * 3.2) * (x * x * 25 + 0.2))));
  const band = sdf
    .revolve(
      profile.polygon(
        [
          [0.196, 0.714],
          [0.233, 0.714],
          [0.239, 0.735],
          [0.234, 0.756],
          [0.196, 0.756],
        ],
        { smooth: true, samples: 3 },
      ),
    )
    .scale([1, 1, 0.945])
    .at(0, 0, -0.008);
  // A raised peak at the center of the band, and the ridge over the crown.
  const peak = sdf
    .extrude(
      profile.polygon([
        [-0.06, 0.716],
        [-0.03, 0.75],
        [0, 0.79],
        [0.03, 0.75],
        [0.06, 0.716],
      ]),
      0.02,
      0.004,
    )
    .at(0, 0, 0.208);
  const notches = sdf.union(
    ...[-60, -30, 30, 60].map((a) => {
      const px = 0.236 * Math.sin(a * rad);
      const pz = 0.236 * 0.945 * Math.cos(a * rad) - 0.008;
      return sdf.cone([px, 0.744, pz], [px, 0.772, pz], 0.012, 0.002);
    }),
  );
  const ridgeShape = sdf
    .ellipsoid([HELM_C[0] + 0.01, HELM_C[1] + 0.045, HELM_C[2] + 0.008])
    .at(0, 0.71, -0.008)
    .intersect(sdf.box([0.05, 0.6, 0.6], 0.016).at(0, 0.8, 0))
    .intersect(sdf.halfSpace([0, -1, 0], -0.735))
    .round(0.004);
  return {
    name: 'guardian-helm',
    bodies: [
      { name: 'helm', shape: local(helm), options: { color: C.steel, roughness: 0.5, metalness: 0.6, detail: 0.005 }, bone: 'head' },
      { name: 'helm-gold', shape: local(sdf.union(band, peak, ridgeShape, notches)), options: { color: C.gold, roughness: 0.35, metalness: 1, detail: 0.004 }, bone: 'head' },
    ],
  };
}
