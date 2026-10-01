import { noise, profile, sdf, type Part } from '../../src/index.js';

/**
 * Adventurer map (part of `assets/adventurer.ts`; standalone `assets/adventurer-map.ts`).
 * Class: hand-held. Local frame: the top roll along X through the fist, the sheet hanging down
 * (-Y), its inked face toward +Z. Bodies: map (bone `hand.L`). Tint slots: none.
 */
const C = { map: '#efe0b8', mapEdge: '#d8c08a', mapInk: '#7a5a34', mapRed: '#b8342c' };

export function adventurerMap(): Part {
  const MAP_W = 0.1;
  const MAP_H = 0.105;
  const MAP_X = 0.022;
  const sheet = sdf.box([MAP_W, MAP_H, 0.005], 0.0022).at(MAP_X, -MAP_H / 2 - 0.004, 0.006);
  const topRoll = sdf.capsule([MAP_X - MAP_W / 2 - 0.004, 0, 0], [MAP_X + MAP_W / 2 + 0.004, 0, 0], 0.013);
  const lowRoll = sdf.capsule([MAP_X - MAP_W / 2, -MAP_H - 0.004, 0.014], [MAP_X + MAP_W / 2, -MAP_H - 0.004, 0.014], 0.011);
  const ink = (s: sdf.Shape) => s.at(MAP_X, -MAP_H / 2 - 0.004, 0.006);
  const coast = sdf.extrude(profile.arc(0.05, 0.006, 200, 300), 0.03).at(0.012, 0.03, 0);
  const trail = sdf.union(
    ...Array.from({ length: 6 }, (_, i) => {
      const t = i / 5;
      return sdf.cylinder(0.005, 0.03).rotateX(90).at(-0.032 + t * 0.052, 0.028 - t * 0.05 + 0.012 * Math.sin(t * 5), 0);
    }),
  );
  const cross2 = sdf
    .union(sdf.box([0.028, 0.0075, 0.03], 0.001).rotateZ(45), sdf.box([0.028, 0.0075, 0.03], 0.001).rotateZ(-45))
    .at(0.026, -0.03, 0);
  const mapShape = sdf
    .union(sheet, topRoll, lowRoll.paint(C.mapEdge))
    .paintWhere(ink(sdf.union(coast, trail)), C.mapInk, 0.001)
    .paintWhere(ink(cross2), C.mapRed, 0.001);
  return {
    name: 'adventurer-map',
    bodies: [
      {
        name: 'map',
        shape: mapShape,
        options: {
          color: C.map,
          roughness: 0.85,
          detail: 0.003,
          textureDensity: 2,
          bump: (x: number, y: number, z: number) => 0.0004 * noise.fbm(x * 200, y * 200, z * 200, 2),
        },
        bone: 'hand.L',
      },
    ],
  };
}
