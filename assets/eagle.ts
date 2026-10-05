import { sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';
import { collarFront, crownTuft } from './parts/bird-extras.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Eagle — Chibi Quest wildlife (catalog `wildlife/birds/eagle`), a golden eagle about 0.48 m tall,
 * faces +Z. Target: docs/wildlife-mockups/eagle_001.jpg (made with mmx).
 *
 * The giant eagle of `assets/giant-eagle.ts` (the bird of `assets/parts/bird-kind.ts`) at 0.56 of
 * its size, as a golden eagle: a dark brown body and wings, a golden head with spiky crown
 * feathers, a short hooked yellow beak, a smooth face, friendly brown eyes in white rims, and yellow feet with dark
 * talons. The giant eagle stays the white-headed monster of the kind.
 * Role: a mountain and cliff bird, and a scout companion; the golden head on the dark body reads
 *   at 128 px.
 * Palette (60/30/10): dark brown #5a3a24 body and wings; a golden head #c8902e; a yellow beak and
 *   feet and white-ringed eyes as the accent.
 */
export default scaleAsset(
  birdAsset({
    name: 'eagle',
    description: 'Chibi eagle: a squat golden eagle with a big golden head covered in spiky feathers, a dark grey ruff under it, a dark brown body and wings with feather relief, a short hooked yellow beak, a smooth face, brown eyes in white rings, and short yellow legs with dark talons; bird rig with wings.',
    reference: 'docs/wildlife-mockups/eagle_001.jpg',
    variants: {
      body: { brown: '#5a3a24', dark: '#3e2a20', tawny: '#7a5430' },
      head: { golden: '#e0a828', pale: '#e0c080', rust: '#a85a2a' },
      wings: { brown: '#4a2e1c', dark: '#30201a', tawny: '#6a4628' },
      eyes: { brown: '#6a3a1a', amber: '#b8701a', dark: '#2a1a12' },
    },
    presets: {
      dark: { body: 'dark', head: 'rust', wings: 'dark', eyes: 'amber' },
      tawny: { body: 'tawny', head: 'pale', wings: 'tawny', eyes: 'dark' },
    },
    colors: { belly: '#62402a', flight: '#3a2418', eyeRim: '#2a1a12' },
    body: [0.22, 0.18, 0.2],
    head: 0.19,
    beak: 'short',
    beakScale: 0.9,
    beakWidth: 1.35,
    beakDroop: 34,
    cheeks: 0,
    beakColors: ['#f0c030', '#f0c030'],
    mouth: false,
    brows: false,
    eyeStyle: 'white',
    eyeScale: 1.0,
    featherBump: 0.006,
    featherOn: { head: false },
    walkBob: 0.4,
    wingRest: -128,
    wingTurn: 40,
    wingOut: 0.1,
    wingScale: 0.66,
    legLength: 0.25,
    tailPose: { lift: 0.45, tilt: -4, scale: 1.25 },
    wingStyle: 'paddle',
    neckScale: 1.35,
    extra(k, b) {
      const { HEAD_C, HR } = b.joints;
      // Big golden feather locks that lie on the head and sweep back from the face: each a fat rounded lock from
      // just under the surface, along the head toward the back and down, its tip lifting a little.
      const locks: sdf.Shape[] = [];
      const ring = (elev: number, from: number, to: number, n: number, len: number) => {
        for (let i = 0; i < n; i++) {
          const a = ((from + ((to - from) * i) / (n - 1)) * Math.PI) / 180;
          const e = (elev * Math.PI) / 180;
          const d: [number, number, number] = [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)];
          // The flow: back and down, along the surface (the part across the normal).
          const f0: [number, number, number] = [0, -0.35, -1];
          const fd = f0[0] * d[0] + f0[1] * d[1] + f0[2] * d[2];
          let f: [number, number, number] = [f0[0] - fd * d[0], f0[1] - fd * d[1], f0[2] - fd * d[2]];
          const fl = Math.hypot(...f) || 1;
          f = [f[0] / fl, f[1] / fl, f[2] / fl];
          const base: [number, number, number] = [HEAD_C[0] + d[0] * HR * 0.9, HEAD_C[1] + d[1] * HR * 0.9, HEAD_C[2] + d[2] * HR * 0.9];
          const L = HR * len;
          const tip: [number, number, number] = [base[0] + f[0] * L + d[0] * HR * 0.1, base[1] + f[1] * L + d[1] * HR * 0.1, base[2] + f[2] * L + d[2] * HR * 0.1];
          locks.push(sdf.cone(base, tip, 0.034, 0.012));
        }
      };
      ring(-5, -120, 120, 9, 0.45);
      ring(28, -105, 105, 8, 0.48);
      ring(58, -80, 80, 7, 0.48);
      ring(84, -30, 30, 3, 0.42);
      // Spiky feathers round the edge of the face: they point out from the face rim and a little
      // back, all round except under the beak.
      const fc: [number, number, number] = [HEAD_C[0], HEAD_C[1], HEAD_C[2] + HR * 0.45];
      for (let i = 0; i < 13; i++) {
        const t = ((-35 + (250 * i) / 12) * Math.PI) / 180; // from low right, over the top, to low left
        const rd: [number, number, number] = [Math.cos(t), Math.sin(t), 0];
        const base: [number, number, number] = [fc[0] + rd[0] * HR * 0.86, fc[1] + rd[1] * HR * 0.86, fc[2] - HR * 0.12];
        const L = HR * (0.32 + 0.08 * (i % 2));
        locks.push(sdf.cone(base, [base[0] + rd[0] * L, base[1] + rd[1] * L, base[2] - HR * 0.12], 0.03, 0.008));
      }
      k.body('head-spikes', sdf.smoothUnion(0.01, ...locks).bone('head'), { color: b.tint.head, roughness: 0.85, detail: 0.004 });
      k.body('crown', crownTuft(b, 0.07, 0.022), { color: b.tint.head, roughness: 0.85, detail: 0.003 });
      // A dark grey ruff under the head: two rows of overlapping petal feathers that hang down and out.
      const cf = collarFront(b);
      const lobes = [0, 1].flatMap((row) =>
        Array.from({ length: 16 }, (_, i) => {
          const a = ((i + row * 0.5) / 16) * 2 * Math.PI;
          const dir: [number, number, number] = [-Math.sin(a), 0, -Math.cos(a)];
          const hit = sdf.raycast(b.trunk, [Math.sin(a) * 2, cf[1] - 0.006 - row * 0.03, HEAD_C[2] + Math.cos(a) * 2], dir)!;
          return sdf
            .ellipsoid([0.034, 0.05, 0.014])
            .rotateX(-28)
            .rotateY((a * 180) / Math.PI)
            .at(hit[0] + Math.sin(a) * (0.008 + row * 0.004), hit[1] - 0.01, hit[2] + Math.cos(a) * (0.008 + row * 0.004));
        }),
      );
      k.body('ruff', sdf.smoothUnion(0.012, ...lobes).bone('neck'), { color: b.tone('body', '#4a4448', 0.3), roughness: 0.85, detail: 0.004 });
    },
  }),
  0.56,
);
