import { sdf, type Part } from '../../src/index.js';

/**
 * Treasure hunter torch (part of `assets/treasure-hunter.ts`; standalone `assets/treasure-hunter-torch.ts`).
 * Class: hand-held. Local frame: the grip center at the origin, the stick along +Y, the flame on top
 * (before the host's 1.25 scale and `torchPose`). Bodies: torch, torch-wrap, torch-head, torch-band,
 * flame, flame-core (bone `hand.L`).
 */

const C = { torch: '#6b4226', wrap: '#c8a870', torchHead: '#5a2a05', cloth: '#2a160a', flame: '#f0a030', flameGlow: '#ff8a20', flameCore: '#ffe060' };

export function treasureHunterTorch(): Part {
    const stick = sdf.cylinder(0.0125, 0.21, 0.004).at(0, 0.035, 0);
    const wrap = sdf.cylinder(0.0185, 0.078, 0.006).at(0, 0.086, 0);
    const cup = sdf
      .union(sdf.cone([0, 0.12, 0], [0, 0.17, 0], 0.016, 0.032).round(0.003), sdf.torus(0.032, 0.0055).at(0, 0.17, 0))
      .subtract(sdf.cylinder(0.025, 0.02).at(0, 0.18, 0));
    // A dark cloth band wraps the cup.
    const clothBand = sdf.cylinder(0.0275, 0.017, 0.004).at(0, 0.142, 0).subtract(sdf.cylinder(0.02, 0.05));
    // The flame: a teardrop 0.09 tall with two thin tongues leaning out, and a yellow core on the
    // front (full-bright colors under a moderate emissive, so it stays saturated orange).
    const flame = sdf.smoothUnion(
      0.01,
      sdf.cone([0, 0.165, 0], [0.001, 0.256, 0], 0.03, 0.004),
      sdf.cone([0.014, 0.17, 0.002], [0.034, 0.23, 0.004], 0.014, 0.003),
      sdf.cone([-0.014, 0.17, -0.002], [-0.032, 0.222, 0], 0.013, 0.003),
    );
    const core = sdf.smoothUnion(0.008, sdf.sphere(0.021).at(0, 0.19, 0.008), sdf.cone([0, 0.19, 0.008], [0, 0.236, 0.006], 0.019, 0.004));
  const hand = 'hand.L';
  return {
    name: 'treasure-hunter-torch',
    bodies: [
      { name: 'torch', shape: stick, options: { color: C.torch, roughness: 0.75, detail: 0.004 }, bone: hand },
      {
        name: 'torch-wrap',
        shape: wrap,
        options: { color: C.wrap, roughness: 0.9, detail: 0.004, bump: (x, y, z) => 0.0014 * Math.sin((x + y * 1.4 + z) * 420) },
        bone: hand,
      },
      { name: 'torch-head', shape: cup, options: { color: C.torchHead, roughness: 0.85, detail: 0.004 }, bone: hand },
      { name: 'torch-band', shape: clothBand, options: { color: C.cloth, roughness: 0.95, detail: 0.004 }, bone: hand },
      {
        name: 'flame',
        shape: flame,
        options: { color: C.flame, roughness: 0.5, emissive: C.flameGlow, emissiveIntensity: 0.6, detail: 0.004 },
        bone: hand,
      },
      {
        name: 'flame-core',
        shape: core,
        options: { color: C.flameCore, roughness: 0.5, emissive: C.flameCore, emissiveIntensity: 0.7, detail: 0.004 },
        bone: hand,
      },
    ],
  };
}
