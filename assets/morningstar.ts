import { defineAsset, mixRgb, noise, rgb, sdf } from '../src/index.js';

/**
 * Morningstar, 0.7 m, standing on its handle end with the head up (+Y), facing +Z.
 * Role: hero equipment, seen in hand and as a pickup icon; must read at 128 px.
 * One idea: a chunky iron ball bristling with eight spikes on a tall honey-oak handle.
 * Shape language: round head (dominant) + triangular spikes (secondary danger cue).
 * Palette: wood honey oak #b5814a dominant on the shaft, dark walnut pommel,
 *   iron #4a4f55 head with #363a3f shadows and #c8ccd2 spike tips,
 *   small gold #d4a93a collar as the accent, leather #5c3a22 spiral grip.
 * Materials: wood (rough 0.8), leather (rough 0.7, spiral bump), iron (rough 0.5,
 *   metal 0.7), gold (metal 1). No rig; static item.
 * Detail list: turned shaft + pommel, leather grip, gold collar, iron head,
 *   8 spikes (top, bottom, 6 in a 45-degree ring).
 */

const HEAD = [0, 0.565, 0] as const;
const HEAD_R = 0.08;

const headCenter = { x: HEAD[0], y: HEAD[1], z: HEAD[2] };

// Unit spike directions: up, down, and 6 around at 45 degrees elevation.
const spikeDirs: number[][] = [[0, 1, 0], [0, -1, 0]];
for (let i = 0; i < 6; i++) {
  const az = (i * Math.PI) / 3;
  const e = Math.PI / 4;
  spikeDirs.push([Math.cos(e) * Math.cos(az), Math.sin(e), Math.cos(e) * Math.sin(az)]);
}
const spikeLen = (d: number[]) => (d[1] === 1 ? 0.055 : d[1] === -1 ? 0.03 : 0.048);

export default defineAsset({
  name: 'morningstar',
  description:
    'A morningstar: iron ball with eight cone spikes on a honey-oak handle with a leather grip and a gold collar.',
  detail: 0.004,
  texture: { size: 1024 },
  reference: 'docs/item-mockups/morningstar-mock.jpg',

  build(k) {
    // ---------------------------------------------------------------- wood handle
    const pommel = sdf.sphere(0.024).at(0, 0.024, 0);
    const shaft = sdf.cylinder(0.017, 0.44, 0.005).at(0, 0.25, 0);
    // Turned bulb on the shaft, like the mockup's baluster handle.
    const bulb = sdf.sphere(0.024).scale([1, 1.5, 1]).at(0, 0.4, 0);
    const wood = sdf
      .smoothUnion(0.012, pommel, shaft, bulb)
      // Pale cut-wood ring where the grip starts.
      .paintWhere(sdf.cylinder(0.019, 0.012).at(0, 0.278, 0), '#c9a06a', 0.004)
      .paintFn((x, y, z, base) =>
        // Subtle warm-brown grain variation along the shaft.
        mixRgb(base, rgb('#8a5a35'), 0.28 * (0.5 + 0.5 * noise.fbm(x * 40, y * 6, z * 40, 2)) * (y > 0.05 && y < 0.47 ? 1 : 0)),
      );
    k.body('wood', wood, {
      color: '#b5814a',
      roughness: 0.8,
      detail: 0.0055,
      bump: (x, y, z) => 0.0005 * noise.fbm(x * 120, y * 10, z * 120, 2),
    });

    // ---------------------------------------------------------------- leather grip
    const grip = sdf.cylinder(0.0215, 0.22, 0.007).at(0, 0.16, 0);
    k.body('grip', grip, {
      color: '#5c3a22',
      roughness: 0.7,
      detail: 0.005,
      // Leather strap wound in a spiral.
      bump: (x, y, z) => 0.0015 * Math.abs(Math.sin(Math.atan2(z, x) + y * 160)),
    });

    // ---------------------------------------------------------------- gold collar
    const collar = sdf.torus(0.019, 0.007).at(0, 0.465, 0);
    k.body('gold', collar, { color: '#d4a93a', roughness: 0.3, metalness: 1, detail: 0.006 });

    // ---------------------------------------------------------------- iron head + spikes
    const head = sdf.sphere(HEAD_R).at(headCenter.x, headCenter.y, headCenter.z);
    const spikes = spikeDirs.map((d) => {
      const len = spikeLen(d);
      const a: [number, number, number] = [
        headCenter.x + d[0] * (HEAD_R - 0.02),
        headCenter.y + d[1] * (HEAD_R - 0.02),
        headCenter.z + d[2] * (HEAD_R - 0.02),
      ];
      const b: [number, number, number] = [
        headCenter.x + d[0] * (HEAD_R + len),
        headCenter.y + d[1] * (HEAD_R + len),
        headCenter.z + d[2] * (HEAD_R + len),
      ];
      return sdf.cone(a, b, 0.023, 0.004);
    });
    // Iron neck plugs the gap between handle top and head bottom.
    const neck = sdf.sphere(0.03).at(0, 0.5, 0);
    const iron = sdf
      .smoothUnion(0.008, head, neck, ...spikes)
      .paintFn((x, y, z, base) =>
        // Worn iron: darker patches plus faint warm highlight toward the light.
        mixRgb(base, rgb('#363a3f'), 0.3 * (0.5 + 0.5 * noise.fbm(x * 30, y * 30, z * 30, 3))),
      );
    // Steel tips on every spike.
    let ironPainted = iron;
    for (const d of spikeDirs) {
      const len = spikeLen(d);
      ironPainted = ironPainted.paintWhere(
        sdf
          .sphere(0.012)
          .at(
            headCenter.x + d[0] * (HEAD_R + len - 0.006),
            headCenter.y + d[1] * (HEAD_R + len - 0.006),
            headCenter.z + d[2] * (HEAD_R + len - 0.006),
          ),
        '#c8ccd2',
        0.008,
      );
    }
    k.body('iron', ironPainted, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.007,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 200, y * 200, z * 200, 2), // forged pitting
    });
  },
});
