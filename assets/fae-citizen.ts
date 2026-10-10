import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';
import { scaleAsset } from './parts/scale-asset.js';

/**
 * Fae citizen - Chibi Quest NPC (catalog `npcs/fantasy-peoples/fae-citizen`), about 0.85 m to the top
 * of the flower crown, faces +Z. Target: docs/npc-mockups/fae-citizen_001.jpg. Humanoid kind at 0.85x.
 *
 * Role: a fae of the flower meadow who knows garden secrets and gives flower errands; seen at the
 *   fairy ring in 3D and as a 128 px sprite; the lilac bob, the wings, and the daisy must read.
 * One idea: a tiny cheerful fae girl in a skirt of layered pink petals, a daisy held up like a parasol.
 * Shape language: round and soft (bob, petals, puffed sleeves); pointed ears and wings are the accents.
 * Palette (60/30/10): petal pink #f0a0b8 (dress) with #e080a0 edges; lilac #b8a0d8 (hair); leaf green
 *   #4a7a44 (sash, slippers, stem); accent white daisy #f6f1ea with a #f0c840 center.
 * Value plan: the mid lilac hair frames the face; the pink skirt is light; the white daisy is brightest.
 * Bodies: skin, ears, hair, crown flowers, dress, sash, wings, daisy parts.
 * Rig: the humanoid kind's skeleton and clips; the right arm is posed up (parasol) and keeps its pose;
 *   the wings are rigid on chest; the daisy is rigid on knife.R.
 */

const C = {
  petalEdge: '#e080a0',
  sash: '#3e6a3a',
  slipper: '#3e6a3a',
  stem: '#3e6a3a',
  daisy: '#f6f1ea',
  daisyEye: '#f0c840',
  crownPink: '#f4a0b8',
  crownWhite: '#f6f1ea',
  wing: '#f8d0e0',
  wingEdge: '#e8a0c0',
};

// The right fist is raised beside the head; the left arm hangs and keeps the clip motion.
const POSE_R = { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] } as const;

const fae = humanoidAsset({
  name: 'fae-citizen',
  description: 'A tiny fae girl with butterfly wings, a lilac bob, a flower crown, and a petal skirt, holding a big daisy like a parasol.',
  reference: 'docs/npc-mockups/fae-citizen_001.jpg',
  variants: {
    skin: { peach: '#f6dcc4', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e' },
    hair: { lilac: '#b8a0d8', rose: '#d890a8', mint: '#88c8a8', gold: '#d8b060' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', violet: '#6a4a9a' },
    cloth: { pink: '#f0a0b8', lavender: '#c8a8e0', peach: '#f4b890', butter: '#f0d078' },
  },
  presets: {
    meadow: { skin: 'peach', hair: 'lilac', eyes: 'brown', cloth: 'pink' },
    dusk: { skin: 'fair', hair: 'rose', eyes: 'violet', cloth: 'lavender' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: C.slipper,
  pose: { R: POSE_R },

  extra(k, h) {
    const { SHOULDER, ELBOW, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const rad = Math.PI / 180;
    type P4 = [number, number, number, number];
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const skinColor = h.tint.skin ?? '#f6dcc4';
    const clothColor = h.tint.shirt ?? '#f0a0b8';
    const edgeColor = k.tint('cloth', -0.14);
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);

    const surf = (aDeg: number, y: number, lift = 0): [number, number, number] => {
      const a = aDeg * rad;
      const hit = sdf.raycast(h.head, [0.6 * Math.sin(a), y, 0.6 * Math.cos(a)], [-Math.sin(a), 0, -Math.cos(a)]);
      const p = hit ?? [0.2 * Math.sin(a), y, 0.19 * Math.cos(a)];
      return [p[0]! + lift * Math.sin(a), y, p[2]! + lift * Math.cos(a)];
    };

    // ------------------------------------------------------------------ small pointed ears (skin tint)
    const earShell = sdf
      .smoothUnion(
        0.008,
        sdf.cone([0, 0, 0], [0.07, 0.07, -0.02], 0.03, 0.005),
        sdf.ellipsoid([0.022, 0.034, 0.026]).at(-0.004, -0.004, 0),
      )
      .scale([1, 1, 0.5])
      .at(0.19, 0.6, -0.008)
      .bone('head');
    k.body('ears', pair(earShell), { color: skinColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a cap, a swept fringe, a bob of locks
    const lock = (pts: P4[], kk = 0.012) => sdf.chain(pts, kk);
    const onFace = (x: number, y: number, dz: number, r: number): P4 => [x, y, h.faceZ(x, y) + dz, r];
    const hairCap = sdf
      .ellipsoid([0.217, 0.212, 0.2])
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.14))
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.09))
      .smoothSubtract(0.025, sdf.ellipsoid([0.165, 0.19, 0.13]).at(0, -0.075, 0.115))
      .smoothSubtract(0.02, sdf.ellipsoid([0.07, 0.075, 0.07]).at(0.215, -0.05, 0.0).mirror('x', 0));
    // A big fringe lobe swept from the right of the part to the left temple, a short one to the right.
    const fringeBig = lock([
      onFace(-0.07, 0.845, 0.03, 0.04),
      onFace(-0.01, 0.838, 0.036, 0.046),
      onFace(0.06, 0.815, 0.034, 0.046),
      onFace(0.13, 0.775, 0.026, 0.04),
      onFace(0.185, 0.71, 0.01, 0.036),
    ], 0.016);
    const fringeSmall = lock([
      onFace(-0.07, 0.84, 0.026, 0.034),
      onFace(-0.13, 0.805, 0.026, 0.034),
      onFace(-0.175, 0.755, 0.014, 0.032),
      onFace(-0.19, 0.69, 0.004, 0.03),
    ], 0.014);
    // The bob: locks leave the skull behind the ears and end at the chin line, flipped out a little.
    const angles = [96, 112, 128, 144, 160, 176, 192, 208, 224, 240, 256, 272, 284];
    const bobLocks = angles.map((a, i) => {
      const s = Math.sin(a * rad);
      const c = Math.cos(a * rad);
      const p0 = surf(a, 0.74, 0.004);
      const p1 = surf(a, 0.64, 0.016);
      const flare = i % 2 === 0 ? 1.0 : 0.94;
      const w = 0.19 * flare;
      return lock(
        [
          [p0[0], p0[1], p0[2], 0.036],
          [p1[0], p1[1], p1[2], 0.038],
          [w * s, 0.56, w * c * 0.92 - 0.01, 0.036],
          [(w + 0.012) * s, 0.5, (w + 0.012) * c * 0.92 - 0.012, 0.03],
          [(w + 0.02) * s, 0.47 + 0.012 * (i % 3), (w + 0.02) * c * 0.92 - 0.012, 0.016],
        ],
        0.014,
      );
    });
    const hairShape = sdf.union(sdf.smoothUnion(0.022, headPose(hairCap), fringeBig, fringeSmall, ...bobLocks));
    k.body('hair', hairShape.bone('head'), {
      color: hairColor,
      roughness: 0.55,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * noise.fbm(x * 40, y * 30, z * 40, 2) + 0.003 * Math.sin(x * 160),
    });

    // ------------------------------------------------------------------ crown: small pink and white flower clusters
    const topHit = (x: number, z: number): [number, number, number] => {
      const hit = sdf.raycast(hairShape, [x, 1.3, z], [0, -1, 0]);
      return hit ? [hit[0], hit[1], hit[2]] : [x, HEAD_Y + 0.2, z];
    };
    const cluster = (x: number, z: number, r: number, lean: number) => {
      const p = topHit(x, z);
      const ring = [0, 1, 2, 3, 4].map((i) => {
        const a = (i * 72 + lean) * rad;
        return sdf.sphere(r * 0.62).at(Math.sin(a) * r * 0.85, 0, Math.cos(a) * r * 0.85);
      });
      return sdf.smoothUnion(0.006, sdf.sphere(r * 0.6), ...ring).at(p[0], p[1] + r * 0.25, p[2]);
    };
    const pinkFlowers = sdf.union(cluster(-0.12, 0.03, 0.04, 10), cluster(0.09, 0.07, 0.036, 40), cluster(-0.06, 0.12, 0.032, 20));
    const whiteFlowers = sdf.union(cluster(-0.01, 0.09, 0.044, 0), cluster(0.115, -0.02, 0.03, 25));
    k.body('crownPink', pinkFlowers.bone('head'), { color: C.crownPink, roughness: 0.7, detail: 0.003 });
    k.body('crownWhite', whiteFlowers.bone('head'), { color: C.crownWhite, roughness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ dress: bodice, puffed sleeves, layered petal skirt
    const vNeck = sdf.extrude(profile.polygon([[-0.06, 0.5], [0.06, 0.5], [0.0, 0.43]]), 0.6).at(0, 0, 0.3);
    const bodice = h.torso.round(0.016).smoothIntersect(0.01, h.band(0.27, 0.468)).smoothSubtract(0.01, vNeck);
    const sleeveOf = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) =>
      sdf.smoothUnion(
        0.02,
        sdf.sphere(0.064).scale([1, 0.9, 1]).at(...lerp(SHOULDER, j.ELBOW, 0.22)),
        sdf.cone(lerp(SHOULDER, j.ELBOW, 0.05), lerp(SHOULDER, j.ELBOW, 0.5), 0.058, 0.062),
      ).bone('upperarm.L');
    // The petal layers: each petal is a flat ellipsoid flared outward and down; the layers shift in angle.
    const petal = (a: number, y: number, R: number, len: number, wid: number, flare: number) =>
      sdf
        .ellipsoid([wid, 0.009, len])
        .rotateX(flare)
        .at(0, y, R + len * 0.7)
        .rotateY(a);
    const ring = (n: number, off: number, y: number, R: number, len: number, wid: number, flare: number) =>
      sdf.union(...Array.from({ length: n }, (_, i) => petal(off + (i * 360) / n, y, R, len, wid, flare)));
    const baseSkirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.33],
            [0.125, 0.33],
            [0.14, 0.26],
            [0.17, 0.2],
            [0.18, 0.17],
            [0, 0.17],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.94]);
    const layers = sdf.union(
      ring(9, 0, 0.28, 0.07, 0.07, 0.04, 22),
      ring(11, 16, 0.22, 0.09, 0.075, 0.042, 26),
      ring(13, 8, 0.165, 0.11, 0.075, 0.044, 28),
    );
    const tips = sdf.union(
      sdf.torus(0.195, 0.022).at(0, 0.145, 0),
      sdf.torus(0.17, 0.02).at(0, 0.185, 0),
    );
    const dress = sdf
      .union(h.weighted(bodice), h.perArm((j) => sleeveOf(j)), h.weighted(baseSkirt.smoothUnion(0.01, layers)))
      .paintWhere(tips, edgeColor, 0.012);
    k.body('dress', dress, {
      color: clothColor,
      roughness: 0.8,
      detail: 0.0055,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 60, y * 60, z * 60, 2),
    });

    // ------------------------------------------------------------------ leaf sash with a bow of two leaves
    const sashBand = sdf.torus(0.133, 0.017).scale([1, 1, 0.84]).at(0, 0.318, -0.004);
    const leafShape = (len: number, wid: number) => sdf.ellipsoid([wid, len, 0.008]).rotateX(-8);
    const leafL = leafShape(0.05, 0.022).rotateZ(-40).at(0.05, 0.285, 0.12);
    const leafR = leafShape(0.045, 0.02).rotateZ(25).at(0.0, 0.29, 0.125);
    const sash = sdf.smoothUnion(0.008, sashBand, leafL, leafR);
    k.body('sash', h.weighted(sash), { color: C.sash, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ butterfly wings (see-through, rigid on chest)
    const wingOne = (len: number, wid: number, dir: number, start: [number, number]) => {
      const a = dir * rad;
      const cx = start[0] + Math.sin(a) * len;
      const cy = start[1] + Math.cos(a) * len;
      return sdf.ellipsoid([wid, len, 0.0065]).rotateZ(-dir).at(cx, cy, -0.285);
    };
    const wingShapes = [wingOne(0.21, 0.12, 36, [0.03, 0.42]), wingOne(0.13, 0.08, 112, [0.03, 0.405])];
    const wingFill = sdf.union(...wingShapes.map((w) => w));
    const wingRim = sdf.union(
      ...wingShapes.map((w) => w.subtract(w.scale([0.93, 0.95, 4]))),
      sdf.capsule([0.0, 0.41, -0.12], [0.03, 0.412, -0.285], 0.013),
      sdf.capsule([0.03, 0.412, -0.285], [0.0, 0.41, -0.285], 0.013),
    );
    k.body('wings', pair(wingFill), {
      color: C.wing,
      roughness: 0.3,
      opacity: 0.6,
      emissive: C.wing,
      emissiveIntensity: 0.25,
      detail: 0.003,
      bone: 'chest',
    });
    k.body('wingEdge', pair(wingRim), { color: C.wingEdge, roughness: 0.4, opacity: 0.85, detail: 0.003, bone: 'chest' });

    // ------------------------------------------------------------------ the daisy parasol (right fist)
    const gl = h.arms.R.GRIP;
    const G: [number, number, number] = [-gl[0], gl[1], gl[2]];
    const at = (x: number, y: number, z: number, r: number): P4 => [G[0] + x, G[1] + y, G[2] + z, r];
    const top = at(-0.1, 0.24, 0.0, 0.01);
    const stem = sdf.smoothUnion(
      0.006,
      sdf.chain(
        [
          at(0.03, -0.12, 0.015, 0.011),
          at(0.0, -0.07, 0.0, 0.0125),
          at(0.0, -0.02, 0.0, 0.0125),
          at(-0.02, 0.07, 0.0, 0.011),
          top,
        ],
        0.01,
      ),
      sdf.ellipsoid([0.024, 0.006, 0.011]).rotateZ(35).at(G[0] - 0.03, G[1] + 0.09, G[2] + 0.012),
    );
    k.body('stem', stem.bone('knife.R'), { color: C.stem, roughness: 0.7, detail: 0.003 });

    const petalD = (i: number, n: number) =>
      sdf
        .ellipsoid([0.014, 0.036, 0.0065])
        .rotateX(i % 2 === 0 ? 6 : -4)
        .at(0, 0.054, 0)
        .rotateZ((i * 360) / n);
    const nPet = 16;
    const daisyShape = sdf
      .union(...Array.from({ length: nPet }, (_, i) => petalD(i, nPet)))
      .smoothUnion(0.004, sdf.ellipsoid([0.034, 0.034, 0.012]));
    const daisyAt = (s: sdf.Shape) => s.rotateX(-30).rotateY(-12).at(top[0] - 0.012, top[1] + 0.03, top[2] + 0.012);
    k.body('daisy', daisyAt(daisyShape), { color: C.daisy, roughness: 0.6, detail: 0.003, bone: 'knife.R' });
    const eye = sdf.ellipsoid([0.034, 0.034, 0.012]).at(0, 0, 0.007);
    k.body('daisyEye', daisyAt(eye), { color: C.daisyEye, roughness: 0.6, detail: 0.003, bone: 'knife.R' });
  },
});

export default scaleAsset(fae, 0.85);
