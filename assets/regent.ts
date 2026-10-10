import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Regent — Chibi Quest court NPC (catalog `npcs/court-and-faction/regent`), about 1.0 m to the top of
 * the hair updo, faces +Z. Target: docs/npc-mockups/regent_001.jpg. Built on the humanoid kind.
 *
 * Role: the palace NPC who rules for the young prince and gives law and order quests, seen in the
 *   council room in 3D and as a 128 px sprite; the tall silver updo, the gold spectacles, the heavy
 *   gold seal stamp and the cream scroll must read.
 * One idea: a wise, strict, kind old regent: silver hair in a tall ridged updo, small gold spectacles,
 *   big ears and a round nose, a long dark plum robe with gold trim, a raised gold seal and a scroll.
 * Shape language: round and soft (hair ridges, ears, nose, spectacles), with the long A-line robe as
 *   the one big calm form.
 * Palette (60/30/10): plum #4a2a3a (robe, the `cloth` slot) / silver #c8c4cc (hair) / skin #f2c7a4;
 *   gold #e0b040 (trim, chain, key, seal, spectacles) as the accent; scroll #f0e6cc; shoes #2a2428.
 * Value plan: the light silver hair and face over the dark plum robe; the gold seal and the chain are
 *   the focal accents.
 * Bodies: skin (round nose, arched brows, small smile), ears, hair, spectacles, robe, collar, neckband,
 *   cuffs, hem, chain, pendant, seal, scroll.
 * Rig: the humanoid kind's skeleton and clips; the right arm is posed (the seal raised in front of the
 *   shoulder) and keeps the pose in every clip. The seal is rigid on `knife.R`, the scroll on `knife.L`.
 */

const C = {
  gold: '#e0b040',
  goldDark: '#a87a22',
  shoe: '#2a2428',
  under: '#3a2230',
  scroll: '#f0e6cc',
  scrollEnd: '#bfa77e',
  smile: '#8a4a3c',
};

// The raised right arm (left-side values; the kind mirrors it). The wrist is turned so that the grip
// axis (item direction) points up, leaning a little toward the head and forward.
const SEAL_DIR = [-0.15, 0.98, 0.1] as const;
// The left hand holds the scroll in front of the hip, forearm forward; the grip axis points up.
const SCROLL_DIR = [-0.41, 0.91, -0.04] as const;

export default humanoidAsset({
  name: 'regent',
  description: 'A wise, strict old regent in a dark plum robe with gold trim, a silver updo and gold spectacles, holding a gold royal seal and a scroll.',
  reference: 'docs/npc-mockups/regent_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { silver: '#c8c4cc', white: '#f0ece4', brown: '#5a301d', auburn: '#8e3b1c' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { plum: '#4a2a3a', indigo: '#3c4a78', pine: '#2f5a44', burgundy: '#6a2a34' },
  },
  presets: {
    default: { skin: 'fair', hair: 'silver', eyes: 'brown', cloth: 'plum' },
    vigil: { skin: 'tan', hair: 'white', eyes: 'hazel', cloth: 'indigo' },
  },
  hair: false,
  undershirt: false,
  pants: C.under,
  shoes: C.shoe,
  lashes: false,
  // The right hand holds the seal up beside the head; the left hand holds the scroll in front of the hip.
  pose: {
    R: { elbow: [0.22, 0.4, 0.03], wrist: [0.255, 0.4, 0.14] },
    L: { elbow: [0.19, 0.31, 0.03], wrist: [0.22, 0.31, 0.13] },
  },

  // A big round nose, thick arched grey brows, and a small knowing smile low on the chin.
  paintSkin(skin, h) {
    const noseZ = h.faceZ(0, 0.566) + 0.012;
    const nose = sdf.ellipsoid([0.033, 0.03, 0.034]).at(0, 0.572, noseZ + 0.002).bone('head');
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.016, 236, 304), 0.3).at(0, 0.6, 0.1);
    const brows = sdf.extrude(profile.arc(0.08, 0.03, 60, 116), 0.3).at(0.104, 0.667, 0.1).mirror('x');
    const smile = sdf.extrude(profile.arc(0.06, 0.012, 236, 304), 0.3).at(0, 0.565, 0.1);
    return skin
      .smoothUnion(0.012, nose)
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(brows, '#8e8a96', 0.003)
      .paintWhere(smile, C.smile, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y } = h.joints;
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const surf = (shape: sdf.Shape, x: number, y: number): number => sdf.raycast(shape, [x, y, 1], [0, 0, -1])?.[2] ?? 0.1;
    const cloth = h.tint.shirt!;
    const skinColor = h.tint.skin!;

    // ------------------------------------------------------------------ big ears (a larger shell over each kind ear)
    const ear = sdf
      .ellipsoid([0.032, 0.058, 0.042])
      .subtract(sdf.sphere(0.02).at(0.018, 0, 0.008))
      .rotateY(-16)
      .at(0.212, 0.615, -0.012)
      .bone('head');
    k.body('ears', ear.mirror('x'), { color: skinColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ silver updo
    // Local frame: the head center at the origin. A small cap hugs the skull; the visible hair is made
    // of separate ridged locks: combed ridges that run from the hairline up into a tall knot, stacked
    // rolls at the temples, and a short roll at the nape. The ears stay free.
    const hairPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const R3 = [0.216, 0.208, 0.2] as const;
    const shell = sdf.ellipsoid(R3).at(0, 0.012, -0.008);
    const faceMask = sdf.ellipsoid([0.19, 0.17, 0.24]).at(0, -0.03, 0.2).smoothUnion(0.03, sdf.ellipsoid([0.3, 0.16, 0.2]).at(0, -0.18, 0.1));
    const onCap = (az: number, el: number, out = 1.04): [number, number, number] => {
      const a = (az * Math.PI) / 180;
      const e = (el * Math.PI) / 180;
      return [R3[0] * out * Math.cos(e) * Math.sin(a), 0.012 + R3[1] * out * Math.sin(e), -0.008 + R3[2] * out * Math.cos(e) * Math.cos(a)];
    };
    const lock = (r0: number, taper: number, ...pts: [number, number, number][]) =>
      sdf.chain(pts.map((p, i) => [p[0], p[1], p[2], r0 * (1 - taper * i)] as [number, number, number, number]), 0.01);
    const locks: sdf.Shape[] = [];
    // Combed ridges: from the hairline over the forehead, up and back into the knot.
    [-1, -0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1].forEach((u) => {
      const edge = Math.abs(u);
      locks.push(
        lock(
          0.023,
          0.08,
          onCap(u * 56, 38 - 3 * edge),
          onCap(u * 44, 60),
          [u * 0.075, 0.26 - 0.015 * edge, 0.0],
          [u * 0.03, 0.3 - 0.02 * edge, -0.05],
        ),
      );
    });
    // Rolls at the temples, three per side, each shorter and lower, ending above the ear.
    for (const sx of [1, -1]) {
      locks.push(lock(0.024, 0.1, onCap(sx * 54, 40), onCap(sx * 78, 36), onCap(sx * 104, 32), onCap(sx * 126, 30)));
      locks.push(lock(0.023, 0.1, onCap(sx * 64, 24), onCap(sx * 84, 21), onCap(sx * 108, 18), onCap(sx * 128, 17)));
      locks.push(lock(0.022, 0.1, onCap(sx * 74, 9), onCap(sx * 92, 8), onCap(sx * 112, 7), onCap(sx * 130, 6)));
    }
    // The knot at the crown and the nape rolls at the back.
    const knot = sdf.ellipsoid([0.085, 0.06, 0.08]).at(0, 0.255, -0.05);
    const nape = [128, 152, 176, 200, 224].map((az) => sdf.sphere(0.05).at(...onCap(az, -12, 0.98)));
    const back = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.09)).smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], -0.08));
    const cap = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.008)).smoothSubtract(0.02, faceMask);
    const hairShape = hairPose(sdf.smoothUnion(0.012, cap, back, knot, ...locks, ...nape)).bone('head');
    const hairColor = k.tint('hair');
    k.body('hair', hairShape, {
      color: hairColor,
      roughness: 0.7,
      detail: 0.005,
      bump: (x, y, z) => 0.004 * Math.sin(x * 110 + y * 60) * Math.cos(z * 90 + y * 40),
    });

    // ------------------------------------------------------------------ small gold spectacles, off the skin
    const [ex, ey] = h.joints.EYE;
    const ez = h.faceZ(ex, ey);
    const rim = (s: number) =>
      sdf
        .torus(0.061, 0.0075)
        .rotateX(90)
        .scale([1.08, 0.96, 1])
        .rotateY(-s * 16)
        .at(s * ex, ey - 0.002, ez + 0.022);
    const bridge = sdf.capsule([-0.04, ey + 0.008, ez + 0.03], [0.04, ey + 0.008, ez + 0.03], 0.0075);
    const sideX = (y: number, z: number) => sdf.raycast(h.head, [1, y, z], [-1, 0, 0])?.[0] ?? 0.2;
    const armPts: [number, number, number][] = [ez - 0.02, ez - 0.06, ez - 0.1, ez - 0.14].map((z, i) => [sideX(ey + 0.01, z) + 0.008, ey + 0.012 - i * 0.002, z]);
    const armStart: [number, number, number] = [ex + 0.066, ey + 0.004, ez - 0.002];
    const armOf = (s: number) => {
      const pts = [armStart, ...armPts];
      return sdf.union(...pts.slice(1).map((q, i) => sdf.capsule([s * pts[i]![0], pts[i]![1], pts[i]![2]], [s * q[0], q[1], q[2]], 0.0055)));
    };
    const glasses = sdf.smoothUnion(0.005, rim(1), rim(-1), bridge).union(armOf(1), armOf(-1)).bone('head');
    k.body('spectacles', glasses, { color: C.gold, roughness: 0.3, metalness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ plum robe: torso, long A-line skirt, wide sleeves
    const bell = (r0: number, r1: number, r2: number, r3: number, yEnd: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.3],
              [r0, 0.3],
              [r1, 0.24],
              [r2, 0.15],
              [r3, yEnd],
              [0, yEnd],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.88]);
    const skirt = bell(0.138, 0.155, 0.184, 0.205, 0.078).bone('hips');
    const robeCore = sdf.smoothUnion(0.02, h.torso.round(0.014), bell(0.138, 0.155, 0.184, 0.205, 0.078));
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.02,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.052, 0.056).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.88), 0.056, 0.066).bone('forearm.L'),
      ),
    );
    const robeBody = sdf
      .smoothUnion(0.02, h.weighted(h.torso.round(0.014)), skirt)
      .smoothUnion(0.012, sleeves)
      .paintWhere(sdf.box([0.014, 0.13, 0.4]).at(0, 0.4, 0.2), C.gold, 0.002)
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(x, z);
        const f = Math.max(0, Math.sin(a * 7 + Math.sin(y * 9) * 0.6) - 0.3) * Math.min(1, Math.max(0, (0.3 - y) / 0.1)) * 0.2;
        return [base[0] * (1 - f), base[1] * (1 - f), base[2] * (1 - f)] as const;
      });
    k.body('robe', robeBody, {
      color: cloth,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(Math.atan2(x, z) * 9 + y * 6) * Math.min(1, Math.max(0, (0.28 - y) * 8)),
    });

    // The gold hem: a slightly fuller band at the bottom of the skirt.
    const hem = bell(0.138, 0.155, 0.184, 0.205, 0.078).round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.108)).bone('hips');
    k.body('hem', hem, { color: C.gold, roughness: 0.45, metalness: 0.5, detail: 0.004 });

    // ------------------------------------------------------------------ folded collar, gold neckband, gold cuffs
    const collar = sdf
      .torus(0.095, 0.036)
      .scale([1, 0.85, 0.95])
      .at(0, 0.436, -0.016)
      .smoothSubtract(0.01, sdf.box([0.09, 0.2, 0.2]).at(0, 0.42, 0.14))
      .bone('chest');
    k.body('collar', collar, { color: cloth, roughness: 0.85, detail: 0.004 });
    const band = sdf.torus(0.062, 0.011).scale([1, 1, 0.95]).at(0, 0.466, -0.012).bone('chest');
    k.body('neckband', band, { color: C.gold, roughness: 0.4, metalness: 0.6, detail: 0.003 });

    const cuffs = h.perArm((j) => {
      const d = [j.WRIST[0] - j.ELBOW[0], j.WRIST[1] - j.ELBOW[1], j.WRIST[2] - j.ELBOW[2]];
      const len = Math.hypot(d[0]!, d[1]!, d[2]!);
      const n: [number, number, number] = [d[0]! / len, d[1]! / len, d[2]! / len];
      const at = (t: number) => lerp(j.ELBOW, j.WRIST, t);
      const dot = (p: readonly number[]) => n[0] * p[0]! + n[1] * p[1]! + n[2] * p[2]!;
      return sdf
        .cone(at(0.6), at(1.1), 0.072, 0.072)
        .intersect(sdf.halfSpace(n, dot(at(0.9))))
        .intersect(sdf.halfSpace([-n[0], -n[1], -n[2]], -dot(at(0.8))))
        .round(0.002)
        .bone('forearm.L');
    });
    k.body('cuffs', cuffs, { color: C.gold, roughness: 0.45, metalness: 0.5, detail: 0.004 });

    // ------------------------------------------------------------------ gold chain with a small key
    const chainPts: [number, number, number][] = [];
    for (let i = 0; i <= 16; i++) {
      const t = (i / 16) * 2 - 1;
      const x = t * 0.1;
      const y = 0.348 + 0.075 * t * t;
      chainPts.push([x, y, surf(robeCore, x, y) + 0.004]);
    }
    const links = sdf.union(
      ...chainPts.flatMap((p, i) => {
        const beads = [sdf.ellipsoid([0.0085, 0.0065, 0.0065]).at(p[0], p[1], p[2])];
        const q = chainPts[i + 1];
        if (q) beads.push(sdf.capsule(p, q, 0.0045));
        return beads;
      }),
    );
    k.body('chain', links.bone('chest'), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003 });
    const pz = surf(robeCore, 0, 0.335) + 0.012;
    const kz = surf(robeCore, 0, 0.29) + 0.01;
    const pendant = sdf.sphere(0.017).at(0, 0.335, pz);
    const key = sdf.smoothUnion(
      0.004,
      sdf.torus(0.011, 0.0045).rotateX(90).at(0, 0.303, kz),
      sdf.capsule([0, 0.293, kz], [0, 0.248, kz], 0.0055),
      sdf.box([0.016, 0.007, 0.01], 0.002).at(0.009, 0.26, kz),
      sdf.box([0.012, 0.007, 0.01], 0.002).at(0.007, 0.272, kz),
    );
    k.body('pendant', sdf.smoothUnion(0.006, pendant, key).bone('chest'), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ the royal seal, right hand (x < 0)
    const gr = h.arms.R.GRIP;
    const GR = [-gr[0], gr[1], gr[2]] as const;
    // Built along +Y from the grip center: a handle through the fist with a pommel ball below, and a
    // lobed round seal face on top (the face looks along +Z).
    const handle = sdf
      .smoothUnion(
        0.006,
        sdf.capsule([0, -0.04, 0], [0, 0.07, 0], 0.014),
        sdf.sphere(0.022).at(0, -0.055, 0),
        sdf.torus(0.019, 0.006).at(0, 0.05, 0),
        sdf.torus(0.017, 0.005).at(0, -0.028, 0),
        sdf.cone([0, 0.06, 0], [0, 0.09, 0], 0.016, 0.026),
      );
    const FY = 0.12;
    const lobes = Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2;
      return sdf.ellipsoid([0.017, 0.017, 0.012]).at(0.043 * Math.cos(a), FY + 0.043 * Math.sin(a), 0);
    });
    const faceCore = sdf.cylinder(0.04, 0.024, 0.006).rotateX(90).at(0, FY, 0);
    const emboss = sdf.union(
      sdf.torus(0.029, 0.0055).rotateX(90).at(0, FY, 0.012),
      sdf.sphere(0.013).at(0, FY, 0.015),
      ...[0, 1, 2, 3, 4].map((i) => sdf.sphere(0.0065).at(0.0185 * Math.cos((i / 5) * Math.PI * 2 + 0.4), FY + 0.0185 * Math.sin((i / 5) * Math.PI * 2 + 0.4), 0.014)),
    );
    const field = sdf.cylinder(0.0225, 0.2, 0).rotateX(90).at(0, FY, 0.1).subtract(sdf.cylinder(0.012, 0.4, 0).rotateX(90).at(0, FY, 0.1));
    const seal = sdf
      .smoothUnion(0.008, handle, faceCore, ...lobes, emboss)
      .paintWhere(field, C.goldDark, 0.003)
      .rotateX(Math.asin(SEAL_DIR[2]) * (180 / Math.PI))
      .rotateZ(Math.atan2(SEAL_DIR[0], SEAL_DIR[1]) * (180 / Math.PI))
      .at(GR[0], GR[1], GR[2]);
    k.body('seal', seal, { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003, bone: 'knife.R' });

    // ------------------------------------------------------------------ the rolled scroll, left hand (x > 0)
    const G = h.arms.L.GRIP;
    // Built along +Y from the grip center, then turned to the grip axis of the posed left fist.
    const scrollAt = (s: sdf.Shape) =>
      s
        .at(0, 0.04, 0)
        .rotateX(Math.asin(SCROLL_DIR[2]) * (180 / Math.PI))
        .rotateZ(-Math.atan2(SCROLL_DIR[0], SCROLL_DIR[1]) * (180 / Math.PI))
        .at(G[0], G[1], G[2]);
    const tube = sdf
      .cylinder(0.021, 0.2, 0.005)
      .subtract(sdf.cylinder(0.014, 0.03, 0).at(0, 0.0975, 0))
      .paintWhere(sdf.box([0.1, 0.014, 0.1]).at(0, 0.1, 0).subtract(sdf.cylinder(0.0158, 0.1, 0).at(0, 0.1, 0)), C.scrollEnd, 0.002);
    k.body('scroll', scrollAt(tube), { color: C.scroll, roughness: 0.85, detail: 0.003, bone: 'knife.L' });
    const ribbon = sdf.torus(0.0225, 0.0045).at(0, -0.05, 0);
    k.body('scrollband', scrollAt(ribbon), { color: C.gold, roughness: 0.4, metalness: 0.5, detail: 0.003, bone: 'knife.L' });
  },
});
