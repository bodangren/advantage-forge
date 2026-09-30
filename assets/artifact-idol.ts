import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

// Design note (items/quest-and-treasure/artifact-idol):
// Role: treasure pickup, 0.28 m tall on y = 0, faces +Z.
// One idea: a squat chibi gold idol, big head, big eyes, green forehead gem, on a dark plinth.
// Shape language: round, with a small crown of spikes. Palette: gold #d4a93a, crease #8a6a20, gem #22c860, plinth #3a3a40.
// Materials: gold (metal), plinth (stone), eyes and mouth (matte paint bodies), gem (emissive).
const GOLD = rgb('#d4a93a');
const CREASE = rgb('#8a6a20');
const HY = 0.212;

export default defineAsset({
  name: 'artifact-idol',
  description: 'A squat gold idol with big eyes, folded arms and a green forehead gem on a stone plinth.',
  detail: 0.004,
  reference: 'docs/item-mockups/artifact-idol-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    const plinth = sdf.box([0.16, 0.04, 0.16], 0.008).at(0, 0.02, 0);
    k.body('plinth', plinth, {
      color: '#3a3a42',
      roughness: 0.9,
      metalness: 0,
      bump: (x, y, z) => 0.001 * noise.fbm(x * 60, y * 60, z * 60, 2),
      maxTriangles: 500,
    });

    const belly = sdf.ellipsoid([0.06, 0.06, 0.055]).at(0, 0.1, 0);
    const head = sdf.ellipsoid([0.078, 0.066, 0.07]).at(0, HY, 0);
    const spikes = [
      sdf.cone([0, 0.25, 0], [0, 0.29, 0], 0.03, 0.006),
      sdf.cone([-0.06, 0.24, 0], [-0.08, 0.278, 0], 0.024, 0.005),
      sdf.cone([0.06, 0.24, 0], [0.08, 0.278, 0], 0.024, 0.005),
    ];
    const arms = sdf.union(
      sdf.capsule([-0.05, 0.115, 0.03], [0.02, 0.105, 0.058], 0.02),
      sdf.capsule([0.05, 0.115, 0.03], [-0.02, 0.095, 0.06], 0.02),
    );
    const feet = sdf.union(
      sdf.ellipsoid([0.024, 0.016, 0.03]).at(-0.032, 0.05, 0.03),
      sdf.ellipsoid([0.024, 0.016, 0.03]).at(0.032, 0.05, 0.03),
    );
    const ears = sdf.union(
      sdf.cone([-0.07, HY, 0], [-0.105, HY + 0.012, 0], 0.014, 0.004),
      sdf.cone([0.07, HY, 0], [0.105, HY + 0.012, 0], 0.014, 0.004),
    );
    const gold = sdf
      .smoothUnion(0.015, belly, head, arms, feet)
      .smoothUnion(0.008, ...spikes, ears)
      .paintFn((x, y, z) => {
        const crease = Math.max(0, Math.min(1, 0.25 + 0.7 * noise.fbm(x * 40, y * 40, z * 40, 2)));
        const low = y < 0.155 && y > 0.14 ? 0.5 : 0; // neck crease
        return mixRgb(GOLD, CREASE, Math.min(1, crease * 0.5 + low));
      });
    k.body('gold', gold, { color: '#d4a93a', roughness: 0.4, metalness: 1, detail: 0.004, maxTriangles: 2000 });

    const ez = 0.063;
    const whites = sdf.union(
      sdf.ellipsoid([0.02, 0.024, 0.01]).at(-0.033, HY, ez),
      sdf.ellipsoid([0.02, 0.024, 0.01]).at(0.033, HY, ez),
    );
    k.body('eyewhite', whites, { color: '#f4f0e6', roughness: 0.4, metalness: 0, detail: 0.003, maxTriangles: 300 });
    const pupils = sdf.union(
      sdf.ellipsoid([0.012, 0.016, 0.01]).at(-0.033, HY - 0.002, ez + 0.006),
      sdf.ellipsoid([0.012, 0.016, 0.01]).at(0.033, HY - 0.002, ez + 0.006),
    );
    k.body('pupils', pupils, { color: '#1a1410', roughness: 0.3, metalness: 0, detail: 0.003, maxTriangles: 300 });
    const mouth = sdf.extrude(profile.arc(0.032, 0.012, 215, 325), 0.014).at(0, HY - 0.006, 0.058);
    k.body('mouth', mouth, { color: '#3a1a10', roughness: 0.6, metalness: 0, detail: 0.003, maxTriangles: 400 });

    k.body('gem', sdf.sphere(0.02).at(0, 0.252, 0.046), {
      color: '#22c860',
      roughness: 0.1,
      metalness: 0,
      emissive: '#22c860',
      emissiveIntensity: 0.4,
      detail: 0.003,
      flat: false,
      maxTriangles: 500,
    });
  },
});
