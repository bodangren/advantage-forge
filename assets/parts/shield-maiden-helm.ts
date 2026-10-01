import { mixRgb, profile, rgb, sdf, type Part, type Vec3 } from '../../src/index.js';

/**
 * Shield-maiden winged helm (part of `assets/shield-maiden.ts`; standalone `assets/shield-maiden-helm.ts`).
 * Class: head. Origin: the head center of the hero base (0, 0.675, 0), +Y up, the face toward +Z.
 * Bodies: helm, plate, rivets, wings (bone `head`). The shape code is the host's, shifted by the mount.
 */
const C = { steel: '#8a9099', steelDark: '#5a6068', rivet: '#d8dce0' };
const rad = Math.PI / 180;
export const SHIELD_MAIDEN_HELM_MOUNT: Vec3 = [0, 0.675, 0];
const local = (s: sdf.Shape) => s.at(-SHIELD_MAIDEN_HELM_MOUNT[0], -SHIELD_MAIDEN_HELM_MOUNT[1], -SHIELD_MAIDEN_HELM_MOUNT[2]);
const hard = (s: sdf.Shape) => s.mirror('x', 0);

export function shieldMaidenHelm(): Part {
    const helmOuter = sdf.ellipsoid([0.246, 0.25, 0.246]).at(0, 0.685, -0.012);
    const helmInner = sdf.ellipsoid([0.226, 0.23, 0.226]).at(0, 0.685, -0.012);
    const shellOf = (s: sdf.Shape, out: number, inn: number) => s.round(out).subtract(s.round(-inn));
    // The rim is a tilted plane: y = 0.67 + 0.34 z. High over the brow, low over the ears and nape.
    const RIM_N = [0, -0.947, 0.322] as const;
    const RIM_D = -0.634;
    const rimY = (z: number) => 0.67 + 0.34 * z;
    const rimKeep = sdf.halfSpace([...RIM_N], RIM_D);
    // A low comb over the crown, from the brow plate back to the nape.
    const comb = shellOf(helmOuter, 0.011, 0.01)
      .smoothIntersect(0.006, sdf.box([0.024, 0.5, 0.7], 0.01).at(0, 0.9, -0.1))
      .smoothIntersect(0.01, sdf.halfSpace([0, 0, 1], 0.12));
    const helm = helmOuter
      .smoothUnion(0.008, comb)
      .subtract(helmInner)
      .intersect(rimKeep)
      .paintWhere(helmInner.round(0.005), C.steelDark, 0.01)
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.72), C.steelDark, 0.03)
      .paintFn((x, y, z, base) => (y - rimY(z) < 0.026 ? rgb(C.steelDark) : base));


    // The diamond brow plate: a rhombus that follows the dome, its lower point below the rim.
    const plateAt = 0.785;
    const rhombus = profile.polygon([
      [0, plateAt + 0.062],
      [0.056, plateAt],
      [0, plateAt - 0.07],
      [-0.056, plateAt],
    ]);
    const plate = shellOf(helmOuter, 0.016, 0.016)
      .smoothIntersect(0.004, sdf.extrude(rhombus, 0.6, 0.004).at(0, 0, 0.3))
      .paintWhere(sdf.halfSpace([0, 1, 0], plateAt - 0.012), C.steelDark, 0.012);


    // Rivets: four on the plate, then a row along the rim on both sides.
    const rivetAt = (x: number, y: number, z: number) => {
      const p = sdf.surfacePoint(helmOuter.round(0.016), [x * 1.4, y, z * 1.4 + 0.02], 0);
      return sdf.sphere(0.0085).at(...p);
    };
    const rivetSpots: [number, number][] = [];
    for (let i = 0; i < 5; i++) {
      const a = (18 + i * 26) * rad;
      rivetSpots.push([Math.sin(a) * 0.24, Math.cos(a) * 0.24]);
    }
    const rimRivets = rivetSpots.map(([x, z]) => rivetAt(x, rimY(z) + 0.028, z));
    const plateRivets = [
      rivetAt(0, plateAt + 0.034, 0.5),
      rivetAt(0.034, plateAt - 0.004, 0.5),
      rivetAt(0, plateAt - 0.044, 0.5),
      rivetAt(-0.034, plateAt - 0.004, 0.5),
    ];
    const rivetsShape = sdf.union(hard(sdf.union(...rimRivets)), ...plateRivets);

    // Wings: three overlapping feathers fan up and out from each temple and sweep back.
    const feather = (deg: number, len: number) =>
      sdf.ellipsoid([len, 0.0135, 0.0065]).at(len * 0.85, 0, 0).rotateZ(deg);
    const wingLocal = sdf
      .smoothUnion(0.005, feather(16, 0.05), feather(48, 0.056), feather(80, 0.046), sdf.sphere(0.014))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.026), C.steelDark, 0.012)
      .paintFn((x, y, z, base) => (Math.abs(z) < 0.0012 ? mixRgb(base, rgb(C.steelDark), 0.5) : base));
    const wing = wingLocal.scale(1.35).rotateY(24).rotateZ(-4).at(0.205, 0.795, -0.03).bone('head');

  return {
    name: 'shield-maiden-helm',
    regions: { inside: local(helmInner) },
    bodies: [
      { name: 'helm', shape: local(helm), options: { color: C.steel, roughness: 0.45, metalness: 0.8, detail: 0.0055 }, bone: 'head' },
      { name: 'plate', shape: local(plate), options: { color: C.steel, roughness: 0.45, metalness: 0.8, detail: 0.004 }, bone: 'head' },
      { name: 'rivets', shape: local(rivetsShape), options: { color: C.rivet, roughness: 0.45, metalness: 0.8, detail: 0.006 }, bone: 'head' },
      { name: 'wings', shape: local(hard(wing)), options: { color: C.steel, roughness: 0.45, metalness: 0.8, detail: 0.0038 }, bone: 'head' },
    ],
  };
}
