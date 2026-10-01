import { noise, profile, rgb, sdf, type Part, type Vec3 } from '../../src/index.js';

/**
 * Druid mushroom cap (part of `assets/druid.ts`; standalone `assets/druid-cap.ts`).
 * Class: head. Local frame: the center of the underside at the origin, upright, the front toward +Z.
 * The host tips it with `capPose` (rotateX -19, rotateZ -3, then to CAP_AT). Bodies: cap, gills,
 * cap-growth, cap-leaves (bone `caproot`). Region `inside`: the cavity under the cap (for the hair).
 * Tint slots: none.
 */
const C = {
  cap: '#d23a32',
  spot: '#f4ead6',
  gills: '#eadcc0',
  gillsDark: '#cdb892',
  stem: '#efe2c8',
  leaf: '#4f8a34',
};

export const CAP_AT: Vec3 = [0, 0.755, -0.01];
const CAP_SCALE: Vec3 = [1.24, 1.16, 1.24];

export function druidCap(): Part {
    const dome = sdf
      .revolve(
        profile.polygon(
          [
            [0.0, 0.25],
            [0.12, 0.235],
            [0.23, 0.18],
            [0.31, 0.1],
            [0.345, 0.03],
            [0.338, -0.004],
            [0.31, -0.012],
            [0.26, 0.004],
            [0.0, 0.03],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .displace(0.004, (x, y, z) => noise.fbm(x * 12, y * 12, z * 12, 2))
      .scale(CAP_SCALE);
    const capInner = sdf.ellipsoid([0.21, 0.2, 0.2]).at(0, -0.07, 0.01);
    // Spots: flat patches where small spheres cross the dome.
    const spots = sdf.union(
      ...(
        [
          [0.0, 0.25, 0.02, 0.05],
          [0.15, 0.21, 0.1, 0.045],
          [-0.17, 0.2, 0.07, 0.04],
          [0.24, 0.13, -0.09, 0.038],
          [-0.12, 0.2, -0.15, 0.042],
          [0.08, 0.2, -0.19, 0.036],
          [-0.27, 0.1, -0.06, 0.034],
          [0.28, 0.1, 0.1, 0.034],
          [-0.05, 0.17, 0.25, 0.04],
          [0.2, 0.12, 0.22, 0.032],
          [-0.23, 0.12, 0.19, 0.03],
        ] as const
      ).map(([x, y, z, r]) => sdf.sphere(r).at(x, y, z)),
    ).scale(CAP_SCALE);
    const capTop = dome
      .subtract(capInner)
      .intersect(sdf.halfSpace([0, -1, 0], -0.012))
      .paintWhere(spots, C.spot, 0.004);
    const gillShell = dome.round(0.002).intersect(sdf.halfSpace([0, 1, 0], 0.016)).subtract(capInner.round(0.004));
    const gills = gillShell.paintFn((x, _y, z, base) => (Math.sin(Math.atan2(z, x) * 36) > 0.8 ? rgb(C.gillsDark) : base));
    // The radial folds live in the normal map (fine, regular detail), not in the mesh.
    const gillFolds = (x: number, y: number, z: number) => {
      const p = [x, y - CAP_AT[1], z - CAP_AT[2]] as const;
      return 0.0035 * Math.abs(Math.sin(Math.atan2(p[2], p[0]) * 36));
    };
    const shroom = (x: number, z: number, h: number, r: number, tilt: number) =>
      sdf
        .union(
          sdf.cone([0, 0, 0], [0, h, 0], r * 0.32, r * 0.28).paint(C.stem),
          sdf
            .revolve(
              profile.polygon(
                [
                  [0, h + r * 0.75],
                  [r * 0.6, h + r * 0.62],
                  [r, h + r * 0.1],
                  [r * 0.9, h - r * 0.05],
                  [0, h + r * 0.15],
                ],
                { smooth: true, samples: 4 },
              ),
            )
            .paintWhere(sdf.union(sdf.sphere(r * 0.22).at(r * 0.4, h + r * 0.62, 0), sdf.sphere(r * 0.18).at(-r * 0.3, h + r * 0.6, r * 0.3)), C.spot),
        )
        .rotateZ(tilt)
        .at(x, 0.17, z);
    const leafShape = (len: number) =>
      sdf.extrude(profile.polygon([[0, 0], [len * 0.35, len * 0.35], [0, len], [-len * 0.35, len * 0.35]], { smooth: true, samples: 4 }), 0.008, 0.003);
    const onCap = (x: number, z: number) => sdf.surfacePoint(dome, [x, 0.4, z], 0);
    const capShroom = (x: number, z: number, h: number, r: number, tilt: number, yaw: number) => {
      const p = onCap(x, z);
      return shroom(0, 0, h, r, tilt).rotateY(yaw).at(p[0], p[1] - 0.17 - 0.01, p[2]);
    };
    const capGrowth = sdf.union(capShroom(-0.4, 0.02, 0.1, 0.075, 38, 0), capShroom(-0.34, -0.14, 0.075, 0.056, 26, 40));
    const capLeaves = sdf.union(
      ...(
        [
          [-0.36, 0.12, 55, 20, 0.11],
          [-0.28, 0.06, 20, -30, 0.1],
          [-0.4, -0.08, 75, 60, 0.1],
        ] as const
      ).map(([x, z, rz, ry, len]) => {
        const p = onCap(x, z);
        return leafShape(len).rotateZ(rz).rotateY(ry).at(p[0], p[1] - 0.006, p[2]);
      }),
    );
  return {
    name: 'druid-cap',
    bodies: [
      { name: 'cap', shape: capTop, options: { color: C.cap, roughness: 0.6 }, bone: 'caproot' },
      { name: 'gills', shape: gills, options: { color: C.gills, roughness: 0.8, bump: gillFolds }, bone: 'caproot' },
      { name: 'cap-growth', shape: capGrowth, options: { color: C.cap, roughness: 0.6, detail: 0.004 }, bone: 'caproot' },
      { name: 'cap-leaves', shape: capLeaves, options: { color: C.leaf, roughness: 0.7, detail: 0.0035 }, bone: 'caproot' },
    ],
    regions: { inside: capInner },
  };
}
