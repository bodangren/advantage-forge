import { mixRgb, noise, profile, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Gladiator helmet (part of `assets/gladiator.ts`; standalone `assets/gladiator-helmet.ts`).
 * A bronze crested helmet with an open face, V ridge, cheek plates, and a dark brush crest.
 * Class: head. Local frame: the origin is the head center (0, 0.675, 0), the face toward +Z.
 * Bodies: helmet (bone `head`), crest (bone `plume`).
 */
const C = { bronze: '#b08a3a', bronzeDark: '#7a5a20', crest: '#5a3320' };
export const GLADIATOR_HELMET_MOUNT = [0, 0.675, 0] as const;
const local = (s: sdf.Shape) => s.at(-GLADIATOR_HELMET_MOUNT[0], -GLADIATOR_HELMET_MOUNT[1], -GLADIATOR_HELMET_MOUNT[2]);
const hard = (s: sdf.Shape) => s.mirror('x', 0);

export function gladiatorHelmet(): Part {
    const outer = sdf.ellipsoid([0.226, 0.216, 0.208]).at(0, 0.685, -0.014);
    const inner = sdf.ellipsoid([0.206, 0.196, 0.188]).at(0, 0.678, -0.012);
    const keepZone = sdf.union(sdf.box([1, 1, 1]).at(0, 0.665 + 0.5, 0), sdf.box([1, 1, 0.5]).at(0, 0.6 + 0.5, -0.075 - 0.25));
    const faceWindow = sdf
      .extrude(
        profile.polygon([
          [-0.25, 0.6],
          [-0.25, 0.7],
          [-0.19, 0.735],
          [-0.12, 0.756],
          [0, 0.728],
          [0.12, 0.756],
          [0.19, 0.735],
          [0.25, 0.7],
          [0.25, 0.6],
        ]),
        0.5,
      )
      .at(0, 0, 0.25);
    // The brim: a shell 0.012 to 0.02 outside the dome, level all round at the brow, with a dip of
    // 0.03 at the front (a narrow tab over the nose bridge) and at the back.
    const flangeShell = outer.round(0.02).subtract(outer.round(0.011));
    const level = sdf.box([0.7, 0.017, 0.7]).at(0, 0.7435, 0);
    const dipFront = sdf.box([0.056, 0.05, 0.3]).at(0, 0.7135 + 0.008, 0.25).round(0.006);
    const dipBack = sdf.box([0.26, 0.05, 0.3]).at(0, 0.7135 + 0.008, -0.25).round(0.006);
    const brim = flangeShell.intersect(sdf.smoothUnion(0.008, level, dipFront, dipBack));
    // The V ridge: two strokes 0.012 wide from the brow center up and out, hugging the dome.
    const stroke = (sgn: number) => {
      const A: [number, number] = [0, 0.722];
      const B: [number, number] = [0.052 * sgn, 0.87];
      const dx = B[0] - A[0];
      const dy = B[1] - A[1];
      const l = Math.hypot(dx, dy);
      const nx = (dy / l) * 0.006;
      const ny = (-dx / l) * 0.006;
      return sdf.extrude(profile.polygon([[A[0] + nx, A[1] + ny], [B[0] + nx, B[1] + ny], [B[0] - nx, B[1] - ny], [A[0] - nx, A[1] - ny]]), 0.3);
    };
    const vRidge = sdf.union(stroke(1), stroke(-1)).at(0, 0, 0.2).intersect(outer.round(0.011));
    const dome = sdf.smoothUnion(0.008, outer.intersect(keepZone), vRidge).subtract(inner).subtract(faceWindow);
    // Cheek plate: a rounded wedge, wide at the helmet edge and narrowing toward the jaw.
    const wedge = sdf
      .extrude(
        profile.polygon(
          [
            [0.058, 0.715],
            [0.0, 0.722],
            [-0.05, 0.7],
            [-0.05, 0.64],
            [-0.028, 0.585],
            [-0.006, 0.55],
            [0.02, 0.575],
            [0.046, 0.63],
          ],
          { smooth: true, samples: 3 },
        ),
        0.02,
        0.007,
      )
      .rotateY(70)
      .at(0.199, 0, 0.078);
    const cheekPlate = hard(wedge);
    const domeY = (z: number) => 0.685 + 0.216 * Math.sqrt(Math.max(0, 1 - ((z + 0.014) / 0.208) ** 2));
    const finTop: [number, number][] = [];
    for (let z = 0.15; z >= -0.171; z -= 0.04) finTop.push([-z, domeY(z) + 0.014 + 0.066 * Math.cos((z * Math.PI) / 0.42) ** 2]);
    const fin = sdf
      .extrude(profile.polygon([[-0.19, 0.735], ...finTop, [0.2, 0.72], [0.1, 0.78], [-0.1, 0.78]]), 0.014, 0.004)
      .rotateY(90);
    const helmet = sdf
      .union(dome, brim, cheekPlate.bone('head'), fin)
      .bone('head')
      .paintFn((x, y, z, base) => mixRgb(base, rgb(C.bronzeDark), Math.min(0.55, Math.max(0, (0.72 - y) / 0.12) * 0.55 + 0.25 * Math.max(0, noise.fbm(x * 30, y * 30, z * 30, 2)))));
    const brush = sdf
      .smoothUnion(
        0.012,
        ...[-0.05, -0.025, 0, 0.025, 0.05].map((z, i) => sdf.ellipsoid([0.011, 0.034 + 0.008 * (i % 2) - 0.006 * Math.abs(z) * 20, 0.02]).at(0, 1.0 - 0.006 * Math.abs(i - 2), -0.014 + z)),
      )
      .displace(0.003, (x, y, z) => noise.fbm(x * 90, y * 60, z * 90, 2));
  return {
    name: 'gladiator-helmet',
    bodies: [
      { name: 'helmet', shape: local(helmet), options: { color: C.bronze, roughness: 0.4, metalness: 0.7, detail: 0.0048 }, bone: 'head' },
      { name: 'crest', shape: local(brush), options: { color: C.crest, roughness: 0.75, detail: 0.004 }, bone: 'plume' },
    ],
  };
}
