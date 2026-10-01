import { noise, rgb, sdf, type Part } from '../../src/index.js';

/**
 * Explorer map (part of `assets/explorer.ts`; standalone `assets/explorer-map.ts`).
 * A rolled parchment map with a red cord ring. Class: hand-held. Local frame: the roll along +Z,
 * centered on the fist; the host sets it with `rollPose`. Bodies: map (bone `hand.R`). No tint slot.
 */
const C = { map: '#ece0c4', mapEdge: '#d8c08a', mapRed: '#b8342c' };

export function explorerMap(): Part {
    const R_MAP = 0.037;
    const mapRoll = sdf
      .cylinder(R_MAP, 0.19, 0.008)
      .rotateX(90)
      .at(0, 0, 0.045)
      .subtract(sdf.cylinder(0.016, 0.07, 0.002).rotateX(90).at(0, 0, 0.12))
      .union(sdf.torus(R_MAP + 0.002, 0.0055).rotateX(90).at(0, 0, 0.075).paint(C.mapRed));
    const mapPainted = mapRoll
      .paintWhere(sdf.cylinder(0.0165, 0.07).rotateX(90).at(0, 0, 0.12), '#4a3a24')
      // The spiral of the rolled sheet shows on the open end.
      .paintFn((x, y, z, base) => (z > 0.11 && Math.sin(Math.hypot(x, y) * 330) > 0.3 ? rgb(C.mapEdge) : base));
  return {
    name: 'explorer-map',
    bodies: [
      {
        name: 'map',
        shape: mapPainted,
        options: {
          color: C.map,
          roughness: 0.85,
          detail: 0.004,
          textureDensity: 2,
          bump: (x: number, y: number, z: number) => 0.0004 * noise.fbm(x * 200, y * 200, z * 200, 2),
        },
        bone: 'hand.R',
      },
    ],
  };
}
