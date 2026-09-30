import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - flying-carpet (vehicles/air/flying-carpet).
 * Role: hovering mount prop; reads at 128 px as a red slab with gold trim over a teal glow.
 * Size: 1.4 wide (X) x 2.2 long (Z), lowest ripple at y 0.25, front edge lifted toward +Z.
 * One idea: a rippling red carpet with a lifted front edge and a glowing teal disc beneath.
 * Shape language: round, soft, thick bevels.
 * Palette: red #a8302a, gold #d4a93a, teal #2f8a8a, glow #6ff0e8.
 * Materials: wool carpet, gold tassels, glow disc.
 * Detail: gold border, diamond medallion, corner motifs, 12 tassels per short edge.
 */
const RED = rgb('#a8302a');
const RED_DARK = rgb('#8a2420');
const GOLD = rgb('#d4a93a');
const TEAL = rgb('#2f8a8a');
const L = 2.2, W = 1.4, T = 0.07;
const sstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const rawWave = (z: number) => 0.12 * Math.sin((2 * Math.PI * z) / 1.4) + 0.16 * sstep(0.5, 1.1, z);
const N = 44;
let minW = 9;
for (let i = 0; i <= N; i++) minW = Math.min(minW, rawWave(-L / 2 + (L * i) / N));
const yAt = (z: number) => 0.25 + T / 2 + rawWave(z) - minW; // slab center height

export default defineAsset({
  name: 'flying-carpet',
  description: 'A rippled red flying carpet with a gold border, teal medallion, tassels, and a teal glow disc.',
  reference: 'docs/vehicle-mockups/flying-carpet-mock.jpg',
  detail: 0.008,
  texture: { size: 1024 },

  build(k) {
    const pts: [number, number][] = [];
    for (let i = 0; i <= N; i++) { const z = L / 2 - (L * i) / N; pts.push([-z, yAt(z) + T / 2]); }
    for (let i = N; i >= 0; i--) { const z = L / 2 - (L * i) / N; pts.push([-z, yAt(z) - T / 2]); }
    // profile x = -z; extrude along local Z (becomes world X after rotateY(90))
    const slab = sdf.extrude(profile.polygon(pts.slice(0, -1), {}), W, 0.02).rotateY(90);
    const carpet = slab;
    const paint = (x: number, y: number, z: number) => {
      const ax = Math.abs(x), az = Math.abs(z);
      let c = mixRgb(RED, RED_DARK, 0.3 * (0.5 + 0.5 * noise.fbm(x * 9, 0, z * 9, 2)));
      const edge = Math.min(W / 2 - ax, L / 2 - az);
      if (edge < 0.12) c = GOLD;
      else if (edge < 0.16) c = mixRgb(c, RED_DARK, 0.6);
      const d = ax / 0.34 + az / 0.55;
      if (d < 1.0) c = GOLD;
      if (d < 0.78) c = TEAL;
      if (d < 0.3) c = GOLD;
      // corner motifs
      const cx = W / 2 - 0.27, cz = L / 2 - 0.27;
      if (Math.hypot(ax - cx, az - cz) < 0.07) c = GOLD;
      return c;
    };
    k.body('carpet', carpet.paintFn(paint), {
      color: '#a8302a', roughness: 0.75, metalness: 0, detail: 0.008,
      bump: (x, y, z) => 0.0015 * Math.sin(x * 160) * Math.sin(z * 160) + 0.001 * noise.fbm(x * 40, y * 10, z * 40, 2),
      textureDensity: 2, maxTriangles: 9000,
    });

    // tassels: 12 per short edge, hanging from the slab edge
    const tass: ReturnType<typeof sdf.capsule>[] = [];
    for (const s of [1, -1]) {
      const z0 = s * (L / 2 + 0.005);
      for (let i = 0; i < 12; i++) {
        const x = -W / 2 + 0.06 + (i * (W - 0.12)) / 11;
        const y = yAt(z0);
        tass.push(sdf.capsule([x, y, z0], [x, y - 0.06, z0 + s * 0.13], 0.02));
      }
    }
    k.body('tassels', sdf.union(...tass).paint(GOLD), {
      color: '#d4a93a', roughness: 0.5, metalness: 0.2, detail: 0.005, maxTriangles: 6000,
    });

    k.body('glow', sdf.ellipsoid([1.0, 0.06, 1.3]).at(0, 0.1, 0), {
      color: '#6ff0e8', emissive: '#6ff0e8', emissiveIntensity: 0.5, opacity: 0.5,
      roughness: 0.4, metalness: 0, detail: 0.008, maxError: 0.01, maxTriangles: 3000,
    });
  },
});
