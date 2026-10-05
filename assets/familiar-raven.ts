import { noise, profile, sdf } from '../src/index.js';
import { birdAsset } from './parts/bird-kind.js';
import { collar, collarFront, crownTuft } from './parts/bird-extras.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Familiar raven — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/familiar-raven`), a
 * witch's raven about 0.4 m tall, faces +Z. Target: docs/wildlife-mockups/familiar-raven_001.jpg
 * (made with mmx).
 *
 * The bird of `assets/parts/bird-kind.ts` at 0.45 of its size, as the crow's shape
 * (`assets/crow.ts`) with a large hooked beak: soft dark charcoal feathers in round layered
 * shapes, big folded wings, glowing violet eyes close to the beak with bright white centers, a
 * small smile at the beak corners, a violet ribbon collar with a silver crescent moon charm, and a
 * small crown tuft. The glow and the ribbon follow the `eyes` slot.
 * Role: a pet that follows a hero or a witch (avatar pets later); the glowing eyes and the violet
 *   ribbon read at 128 px.
 * Palette (60/30/10): dark charcoal #3a3842 body, head, and wings; violet #9a4ae8 eyes and ribbon as the
 *   accent; a silver charm; dark grey beak and feet.
 */
export default scaleAsset(
  birdAsset({
    name: 'familiar-raven',
    description: 'Chibi familiar raven: a round dark charcoal raven with round glowing violet eyes with bright white centers close to a large hooked dark beak, a small smile, soft round layered chest feathers, big folded wings, a small crown tuft, a violet ribbon collar with a silver crescent moon charm, and dark grey feet; bird rig with wings.',
    reference: 'docs/wildlife-mockups/familiar-raven_001.jpg',
    variants: {
      body: { charcoal: '#3a3842', black: '#24222c', midnight: '#22263a', grey: '#4a4852' },
      head: { charcoal: '#3c3a44', black: '#26242e', midnight: '#24283c', grey: '#4e4c56' },
      wings: { charcoal: '#33313b', black: '#1e1c26', midnight: '#1c2034', grey: '#3e3c46' },
      eyes: { violet: '#c018e8', teal: '#2ac8c0', gold: '#e8b830', rose: '#e04a8a' },
    },
    presets: {
      moon: { body: 'midnight', head: 'midnight', wings: 'midnight', eyes: 'teal' },
      sun: { body: 'grey', head: 'grey', wings: 'grey', eyes: 'gold' },
      rose: { body: 'black', head: 'black', wings: 'black', eyes: 'rose' },
    },
    colors: { belly: '#3e3c48', flight: '#302e38', scale: '#3e3e46', scaleDark: '#2e2e36', talon: '#18181c', eyeRim: '#141218', mouth: '#2a2c32', pupil: '#0c0c10' },
    body: [0.235, 0.2, 0.22],
    head: 0.19,
    beak: 'hook',
    beakScale: 0.62,
    beakWidth: 1.15,
    beakDroop: 12,
    cheeks: 1,
    eyeStyle: 'bead',
    glint: 0.01,
    beakColors: ['#383a42', '#383a42'],
    mouth: false,
    brows: false,
    eyeScale: 1.0,
    featherBump: 0.0035,
    featherOn: { body: false, head: false, wings: false },
    walkBob: 0.5,
    stillNeck: true,
    wingRest: -128,
    wingTurn: 55,
    wingOut: 0.06,
    wingScale: 0.8,
    legLength: 0.25,
    wingStyle: 'paddle',
    neckScale: 1.2,
    tailPose: { lift: -0.2, tilt: -25, scale: 1.35 },
    eyeLift: 0.08,
    eyeSpread: 0.86,
    extra(k, b) {
      // The eyes slot is the magic color: the glowing irises and the ribbon.
      const magic = b.tint.eye;
      // Round glowing eyes: a ball set into the face at each painted eye, with a bright white
      // center and one shine.
      {
        const es = b.eye.scale;
        const e = b.eye.at;
        const { HEAD_C } = b.joints;
        const R = 0.04 * es;
        const n0 = [e[0] - HEAD_C[0], e[1] - HEAD_C[1], e[2] - HEAD_C[2]];
        const nl = Math.hypot(n0[0]!, n0[1]!, n0[2]!) || 1;
        const n = [n0[0]! / nl, n0[1]! / nl, n0[2]! / nl] as const;
        const c: [number, number, number] = [e[0] - n[0] * R * 0.55, e[1] - n[1] * R * 0.55, e[2] - n[2] * R * 0.55];
        const at = (u: number, v: number, w: number): [number, number, number] => [c[0] + n[0] * R * w + u * R, c[1] + n[1] * R * w + v * R, c[2] + n[2] * R * w];
        const ball = sdf
          .sphere(R)
          .at(...c)
          .paintWhere(sdf.sphere(R * 0.34).at(...at(-0.05, 0, 0.8)), '#fff0ff', R * 0.2)
          .paintWhere(sdf.sphere(R * 0.16).at(...at(0.35, 0.42, 0.85)), '#ffffff', 0.002);
        k.body('eye-glow', ball.mirror('x').bone('head'), { color: magic, emissive: magic, emissiveIntensity: 1.0, roughness: 0.15, detail: 0.002, textureDensity: 2 });
        // A bright white center that glows on its own.
        const core = sdf.sphere(R * 0.4).at(...at(-0.05, 0, 0.78));
        k.body('eye-core', core.mirror('x').bone('head'), { color: '#fff4ff', emissive: '#fff0ff', emissiveIntensity: 1.2, roughness: 0.2, detail: 0.002 });
        // A small smile at each corner of the beak: a short dark stroke that curves up and out.
        const sm = [
          [0.17, -0.42],
          [0.26, -0.4],
          [0.33, -0.32],
        ].map(([u, v]) => {
          const p = b.faceHit(HEAD_C[0] + u! * b.joints.HR, HEAD_C[1] + v! * b.joints.HR);
          return [p[0], p[1], p[2] - 0.002, 0.0045] as [number, number, number, number];
        });
        k.body('smile', sdf.chain(sm, 0.003).mirror('x').bone('head'), { color: '#141218', roughness: 0.6, detail: 0.002 });
      }
      // Shaggy feather clumps on the cheeks and the sides of the head: short pointed tufts that
      // point out and down, so the head reads wide and round.
      {
        const { HEAD_C: hc, HR } = b.joints;
        const tufts: sdf.Shape[] = [];
        for (let i = 0; i < 9; i++) {
          const a = ((-60 + i * 15) * Math.PI) / 180; // from the low front to the back of the side
          const el = ((-30 + 12 * Math.sin(i * 1.7)) * Math.PI) / 180;
          const d: [number, number, number] = [Math.cos(el) * Math.cos(a) * 0.95, Math.sin(el), Math.cos(el) * Math.sin(-a) * 0.6 + 0.2];
          const base: [number, number, number] = [hc[0] + d[0] * HR, hc[1] + d[1] * HR, hc[2] + d[2] * HR];
          const len = HR * (0.4 + 0.12 * noise.random(i, 2, 9));
          tufts.push(sdf.cone(base, [base[0] + d[0] * len, base[1] + d[1] * len - len * 0.35, base[2] + d[2] * len * 0.5], HR * 0.16, HR * 0.03));
        }
        k.body('cheek-tufts', sdf.smoothUnion(0.008, ...tufts).mirror('x').bone('head'), { color: b.tint.head, roughness: 0.85, detail: 0.003 });
      }
      // A soft crest of short round feather lumps on the crown.
      k.body('tuft', crownTuft(b, 0.06, 0.022), { color: b.tint.head, roughness: 0.85, detail: 0.003 });
      // Soft layered feathers on the chest and the sides under the ribbon: broad flat feathers with
      // round points, in staggered rows that overlap, a little lighter than the body, set into the
      // surface.
      const { BODY_C, B } = b.joints;
      // A soft feather: a round-ended flat oval.
      const leaf = sdf.extrude(profile.polygon([[-0.028, 0.02], [0, 0.026], [0.028, 0.02], [0.03, -0.012], [0.016, -0.034], [0, -0.04], [-0.016, -0.034], [-0.03, -0.012]], { smooth: true }), 0.009, 0.004);
      const clumps: sdf.Shape[] = [];
      for (let row = 0; row < 4; row++) {
        const y = BODY_C[1] + B[1] * (0.3 - row * 0.24);
        const n = 7 - (row % 2);
        for (let j = 0; j < n; j++) {
          const deg = (j - (n - 1) / 2) * 21;
          const ang = deg * (Math.PI / 180);
          const hit = sdf.raycast(b.trunk, [Math.sin(ang) * 2, y, Math.cos(ang) * 2], [-Math.sin(ang), 0, -Math.cos(ang)]);
          if (!hit || (row < 3 && Math.abs(hit[0] + 0.015) < 0.03)) continue; // the ribbon tails hang here
          const clump = leaf
            .scale(0.85 + 0.35 * noise.random(row, j, 4))
            .rotateZ((noise.random(row, j, 5) - 0.5) * 30)
            .rotateX(-6)
            .rotateY(deg)
            .at(hit[0] - Math.sin(ang) * 0.002, hit[1] - 0.006, hit[2] - Math.cos(ang) * 0.002);
          clumps.push(clump.bone(y > BODY_C[1] ? 'spine' : 'hips'));
        }
      }
      k.body('chest-clumps', sdf.smoothUnion(0.004, ...clumps), { color: b.tone('body', '#2e2c38', 0.9), roughness: 0.85, detail: 0.003 });
      k.body('ribbon', collar(b, 0.026), { color: b.tone('eyes', '#9a2ad0', 0.8), roughness: 0.6, detail: 0.003 });
      // A silver crescent moon hanging from the front of the ribbon.
      const f = collarFront(b);
      const moon = sdf
        .cylinder(0.026, 0.008, 0.002)
        .rotateX(90)
        .smoothSubtract(0.003, sdf.cylinder(0.022, 0.03).rotateX(90).at(0.012, 0.008, 0))
        .rotateZ(-20)
        .at(f[0], f[1] - 0.03, f[2] + 0.008);
      const ring = sdf.torus(0.007, 0.0025).rotateZ(90).at(f[0], f[1] - 0.006, f[2] + 0.006);
      k.body('charm', sdf.union(moon, ring).bone('neck'), { color: '#d8dce4', roughness: 0.25, metalness: 0.9, detail: 0.002 });
      // A knot at the front of the ribbon and one long ribbon tail that hangs down the chest.
      const knot = sdf.ellipsoid([0.018, 0.016, 0.012]).at(f[0] - 0.026, f[1] - 0.002, f[2] + 0.004);
      const tailTop = sdf.raycast(b.trunk, [f[0] - 0.03, f[1] - 0.09, 2], [0, 0, -1])!;
      // The strip, built about the knot and flattened against the chest.
      const K: [number, number, number] = [f[0] - 0.026, f[1] - 0.01, f[2] + 0.004];
      const strip = sdf
        .chain([[0, 0, 0, 0.009], [tailTop[0] - K[0], tailTop[1] - K[1], tailTop[2] + 0.006 - K[2], 0.009], [tailTop[0] + 0.006 - K[0], tailTop[1] - 0.035 - K[1], tailTop[2] - 0.004 - K[2], 0.008]], 0.004)
        .scale([1.6, 1, 0.55])
        .at(...K);
      // A second, longer tail beside the first.
      const tailTop2 = sdf.raycast(b.trunk, [f[0] - 0.008, f[1] - 0.12, 2], [0, 0, -1])!;
      const tailEnd2 = sdf.raycast(b.trunk, [f[0] - 0.002, f[1] - 0.17, 2], [0, 0, -1])!;
      const strip2 = sdf
        .chain([[0, 0, 0, 0.009], [tailTop2[0] - K[0], tailTop2[1] - K[1], tailTop2[2] + 0.006 - K[2], 0.009], [tailEnd2[0] - K[0], tailEnd2[1] - K[1], tailEnd2[2] + 0.004 - K[2], 0.008]], 0.004)
        .scale([1.6, 1, 0.55])
        .at(...K);
      const tails = sdf.union(knot, strip, strip2);
      k.body('ribbon-tail', tails.bone('neck'), { color: b.tone('eyes', '#9a2ad0', 0.8), roughness: 0.6, detail: 0.003 });
    },
  }),
  0.45,
);
