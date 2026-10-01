import { mixRgb, noise, profile, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Samurai katana (part of `assets/samurai.ts`; standalone `assets/samurai-katana.ts`).
 *
 * A long wrapped grip, a round gold guard, and a gently curved blade (about 0.55 m in all).
 * Class: hand-held. Local frame: the grip center at the origin, the blade toward -Y, the flat
 * facing +Z, the curve toward -X. The host keeps its pose function (`katanaPose`).
 * Bodies: katana, katana-gold, katana-grip (bone `hand.R`).
 * Tint slots: none.
 */

const C = {
  gold: '#e0b040',
  steel: '#c3c8cf',
  grip: '#2a2320',
  gripLight: '#4a3f38',
};

export function samuraiKatana(): Part {
  const BLADE_W = 0.036;
  const curve = (y: number) => -0.024 * Math.pow((-y - 0.08) / 0.34, 2);
  const ys = [-0.08, -0.15, -0.23, -0.31, -0.375];
  const bladePts: [number, number][] = [
    ...ys.map((y) => [-BLADE_W / 2 + curve(y), y] as [number, number]),
    [curve(-0.42) - 0.004, -0.42],
    ...[...ys].reverse().map((y) => [BLADE_W / 2 + curve(y) - (y < -0.35 ? 0.008 : 0), y] as [number, number]),
  ];
  const blade = sdf
    .extrude(profile.polygon(bladePts), 0.011, 0.0035)
    .paintWhere(sdf.box([0.014, 0.6, 0.2]).at(0.006, -0.25, 0), '#a9b0ba', 0.004);
  const tsuba = sdf.cylinder(0.036, 0.009, 0.003).scale([1, 1, 0.8]).at(0, -0.076, 0);
  const habaki = sdf.box([0.03, 0.03, 0.02], 0.006).at(0, -0.094, 0);
  const kashira = sdf.smoothUnion(0.006, sdf.ellipsoid([0.02, 0.014, 0.017]).at(0, 0.108, 0), sdf.cylinder(0.019, 0.01, 0.003).at(0, 0.096, 0));
  const tsuka = sdf
    .cylinder(0.0155, 0.17, 0.005)
    .scale([1.12, 1, 0.9])
    .at(0, 0.01, 0)
    .paintFn((x, y, z, base) => {
      const w = Math.sin((x + z) * 220 + y * 210) * Math.sin((x - z) * 220 - y * 210);
      return w > 0.2 ? mixRgb(base, rgb(C.gripLight), Math.min(0.9, w * 1.3)) : base;
    });
  return {
    name: 'samurai-katana',
    bodies: [
      { name: 'katana', shape: blade, options: { color: C.steel, roughness: 0.28, metalness: 0.9, detail: 0.003 }, bone: 'hand.R' },
      {
        name: 'katana-gold',
        shape: sdf.union(tsuba, habaki, kashira),
        options: { color: C.gold, roughness: 0.3, metalness: 0.9, detail: 0.003 },
        bone: 'hand.R',
      },
      {
        name: 'katana-grip',
        shape: tsuka,
        options: { color: C.grip, roughness: 0.75, detail: 0.004, bump: (x: number, y: number, z: number) => 0.0008 * noise.noise3(x * 90, y * 90, z * 90) },
        bone: 'hand.R',
      },
    ],
  };
}
