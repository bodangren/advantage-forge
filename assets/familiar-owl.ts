import { noise, profile, sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';
import { collar, collarFront, earTufts, glowEyes } from './parts/bird-extras.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Familiar owl — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/familiar-owl`), a wizard's
 * snowy owl about 0.4 m tall to the ear tufts, faces +Z. Target:
 * docs/wildlife-mockups/familiar-owl_001.jpg (made with mmx).
 *
 * The owl of `assets/owl.ts` (the bird of `assets/parts/bird-kind.ts`) at 0.44 of the bird's size,
 * as a snowy owl familiar: white feathers with soft grey speckles, small ear tufts, big glowing blue
 * eyes, a tiny dark beak, a blue ribbon collar with a gold star pendant, and white feathered feet.
 * The glow and the ribbon follow the `eyes` slot.
 * Role: a pet that follows a hero or a wizard (avatar pets later); the glowing eyes and the gold
 *   star read at 128 px.
 * Palette (60/30/10): white #f4f2ee body, head, and wings with grey speckles; blue #3aa8f0 eyes and
 *   ribbon as the accent; a gold star; a dark beak.
 */
export default scaleAsset(
  birdAsset({
    name: 'familiar-owl',
    description: 'Chibi familiar owl: a white snowy owl with small grey speckles of different sizes on the chest, grey wing bars, soft grey shade on the sides, small ear tufts, glowing cyan eyes under stern lids, a small round grey beak, a blue ribbon collar with a bow and hanging tails, a big gold star pendant, and short legs; bird rig with wings.',
    reference: 'docs/wildlife-mockups/familiar-owl_001.jpg',
    variants: {
      body: { white: '#f4f2ee', cream: '#f0e6d2', grey: '#c8c8cc' },
      head: { white: '#f6f4f0', cream: '#f2e8d6', grey: '#cccdd0' },
      wings: { white: '#e8e6e2', cream: '#e4d8c2', grey: '#b8b8bc' },
      eyes: { cyan: '#22c8e8', blue: '#3aa8f0', violet: '#9a5ae8', green: '#3ac87a', gold: '#f0b830' },
    },
    presets: {
      cream: { body: 'cream', head: 'cream', wings: 'cream', eyes: 'gold' },
      silver: { body: 'grey', head: 'grey', wings: 'grey', eyes: 'violet' },
      forest: { body: 'white', head: 'white', wings: 'white', eyes: 'green' },
    },
    colors: { belly: '#faf8f4', flight: '#d8d6d2', scale: '#5c5c64', scaleDark: '#4a4a52', talon: '#2e2e34', eyeRim: '#2a2a30' },
    body: [0.2, 0.21, 0.2],
    pear: 0.92,
    head: 0.16,
    beak: 'short',
    beakScale: 0.46,
    beakWidth: 1.35,
    beakDroop: 30,
    beakColors: ['#3c3c44', '#3c3c44'],
    mouth: false,
    brows: false,
    eyeScale: 1.1,
    lids: 0.45,
    featherBump: 0.0035,
    featherOn: { body: false, head: false, wings: true },
    wingBars: { color: '#c4c6cc', at: [0.14, 0.22, 0.3] },
    walkBob: 0.3,
    wingRest: -128,
    wingTurn: 55,
    wingOut: 0.06,
    wingScale: 0.56,
    legLength: 0.2,
    wingStyle: 'paddle',
    neckScale: 1.5,
    paintBody(body, b) {
      // Soft grey shade on the sides and the back, so the big white areas have form.
      const { BODY_C, B } = b.joints;
      const shade = b.tone('body', '#d6d6dc', 1);
      const sides = sdf.union(sdf.halfSpace([-1, 0, 0], -B[0] * 0.6), sdf.halfSpace([1, 0, 0], -B[0] * 0.6), sdf.halfSpace([0, 0, 1], BODY_C[2] - B[2] * 0.55));
      return body.paintWhere(sides.intersect(sdf.box([2, 2, 2]).at(0, 1, 0)), shade, 0.06);
    },
    extra(k, b) {
      const magic = b.tint.eye;
      glowEyes(k, b, magic, 2.6, true, 0.45);
      k.body('tufts', earTufts(b, 0.05, 0.022), { color: b.tint.head, roughness: 0.85, detail: 0.003 });
      // A thin round cord, not a band.
      k.body('ribbon', collar(b, 0.009), { color: magic, roughness: 0.6, detail: 0.002 });
      // A gold five-pointed star hanging from the front of the ribbon.
      const f = collarFront(b);
      const pts: [number, number][] = [];
      for (let i = 0; i < 10; i++) {
        const a = Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? 0.04 : 0.017;
        pts.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      const star = sdf.extrude(profile.polygon(pts), 0.01, 0.002).at(f[0], f[1] - 0.046, f[2] + 0.008);
      const ring = sdf.torus(0.006, 0.0025).rotateZ(90).at(f[0], f[1] - 0.006, f[2] + 0.006);
      k.body('pendant', sdf.union(star, ring).bone('neck'), { color: '#f0c040', roughness: 0.3, metalness: 0.85, detail: 0.002 });
      // A small bow on the cord left of the star: two loops and two tails that hang down, one long.
      const a = (24 * Math.PI) / 180;
      const side = sdf.raycast(b.trunk.round(0.01), [Math.sin(a) * 2, f[1], b.joints.HEAD_C[2] + Math.cos(a) * 2], [-Math.sin(a), 0, -Math.cos(a)])!;
      const bowAt = (sh: sdf.Shape) => sh.scale(1.6).rotateY(24).at(side[0], side[1], side[2]);
      const bow = sdf.union(
        bowAt(sdf.ellipsoid([0.018, 0.01, 0.006]).rotateZ(25).at(0.016, 0.006, 0)),
        bowAt(sdf.ellipsoid([0.018, 0.01, 0.006]).rotateZ(-25).at(-0.016, 0.006, 0)),
        bowAt(sdf.sphere(0.008)),
        bowAt(sdf.chain([[0.002, 0, 0.002, 0.005], [0.012, -0.04, 0.004, 0.0045], [0.02, -0.085, 0.002, 0.004]], 0.004)),
        bowAt(sdf.chain([[-0.002, 0, 0.002, 0.005], [-0.012, -0.03, 0.004, 0.0045], [-0.016, -0.05, 0.002, 0.004]], 0.004)),
      );
      k.body('bow', bow.bone('neck'), { color: magic, roughness: 0.6, detail: 0.003 });
      // Small dark teardrop speckles of different sizes on the chest and the sides, below the cord:
      // flat drops with the point up, set into the surface, in loose rows with gaps and a jitter.
      const { BODY_C, B } = b.joints;
      const marks: sdf.Shape[] = [];
      const ROWS = 7;
      for (let row = 0; row < ROWS; row++) {
        const y0 = BODY_C[1] + B[1] * (0.42 - row * 0.19);
        const n = 8 - (row % 2);
        for (let j = 0; j < n; j++) {
          const jit = noise.random(row, j, 3) - 0.5;
          const ang = ((j - (n - 1) / 2) * 17 + jit * 14) * (Math.PI / 180);
          const y = y0 + (noise.random(row, j, 7) - 0.5) * B[1] * 0.16;
          if (Math.abs(ang) < 0.2 && row < 2) continue; // the star hangs here
          if (noise.random(row, j, 13) < 0.22) continue; // gaps, so the rows do not read as a grid
          const hit = sdf.raycast(b.trunk, [Math.sin(ang) * 2, y, Math.cos(ang) * 2], [-Math.sin(ang), 0, -Math.cos(ang)]);
          if (!hit) continue;
          const sz = 0.5 + 0.45 * noise.random(row, j, 11);
          const drop = sdf
            .smoothUnion(0.004, sdf.ellipsoid([0.0065, 0.0065, 0.0025]).scale(sz), sdf.cone([0, 0, 0], [0, 0.012 * sz, 0], 0.005 * sz, 0.0012).at(0, 0.001, 0))
            .rotateZ(jit * 30)
            .rotateY((ang * 180) / Math.PI)
            .at(hit[0] - Math.sin(ang) * 0.0012, hit[1], hit[2] - Math.cos(ang) * 0.0012);
          marks.push(drop.bone(y > BODY_C[1] ? 'spine' : 'hips'));
        }
      }
      k.body('marks', sdf.union(...marks), { color: b.tone('body', '#6a6a74', 0.4), roughness: 0.8, detail: 0.002 });
    },
  }),
  0.44,
);
