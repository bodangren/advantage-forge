import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Ambassador — Chibi Quest court NPC (catalog `npcs/court-and-faction/ambassador`), about 1.0 m to
 * the top of the hair bun, faces +Z. Target: docs/npc-mockups/ambassador_001.jpg. Built on the humanoid kind.
 *
 * Role: a court NPC from a far kingdom who brings messages and peace quests; seen at the palace hall
 *   and embassies in 3D and as a 128 px sprite. The high bun, the teal and gold robe, and the held-out
 *   scroll with its red seal must read.
 * One idea: a graceful girl whose high black bun, wide gold-rimmed sleeves, and gold-trimmed teal robe
 *   frame a sealed scroll held out to the viewer.
 * Shape language: round and soft (bun, locks, earrings), with the long robe and trumpet sleeves as the secondary flare.
 * Palette (60/30/10): teal #2a7a7a (robe, the cloth slot); gold #e0b040 (trim, sash, pin, earrings,
 *   medallion), #c8a040 (shoes); black #231a17 (hair); accents: scroll #f0e6cc, seal #b03a3a.
 * Value plan: the dark hair over the warm face is the focal point; the mid teal robe carries the gold
 *   trim lines; the pale scroll with the red seal is the second accent.
 * Bodies: skin, hair (cap and locks), gold (pin, earrings, medallion), robe, sleeve rims, sash, shoes, scroll.
 * Rig: the humanoid kind's skeleton and clips. The right arm keeps a held-out pose; the scroll is rigid
 *   on `knife.R`. The robe hem stays above the knee split's swing (y 0.1).
 */

const C = {
  gold: '#e0b040',
  shoe: '#c8a040',
  paper: '#f0e6cc',
  paperDark: '#d8c9a2',
  sashRed: '#d4552e',
  seal: '#b03a3a',
  sealDark: '#8a2a2a',
};

// The right hand held out in front at chest height (left-side values; the kind mirrors them).
const OFFER = { elbow: [0.19, 0.335, 0.03], wrist: [0.2, 0.42, 0.08] } as const;

export default humanoidAsset({
  name: 'ambassador',
  description: 'A graceful, smiling ambassador in a teal and gold robe with a high bun, holding out a sealed scroll with a gold ribbon.',
  reference: 'docs/npc-mockups/ambassador_001.jpg',
  variants: {
    skin: { caramel: '#b8744c', deep: '#5e3b28', brown: '#8a5a3e', tan: '#d49a72', light: '#e8b48e', fair: '#f2c7a4' },
    hair: { black: '#231a17', brown: '#5a301d', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { teal: '#2a7a7a', wine: '#8a3a4a', indigo: '#3a4a82', plum: '#6a4a8a' },
  },
  presets: {
    envoy: { skin: 'tan', hair: 'brown', eyes: 'hazel', cloth: 'wine' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  pose: { R: OFFER },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const robeColor = h.tint.shirt ?? '#2a7a7a';
    type P4 = [number, number, number, number];

    // ------------------------------------------------------------------ hair: a small cap, a fringe of locks, a high bun
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const faceMask = sdf.ellipsoid([0.15, 0.135, 0.12]).at(0, -0.082, 0.175);
    const lowCut = sdf.halfSpace([0, -1, 0.586], 0.03 / 1.159);
    const earCut = pair(sdf.ellipsoid([0.05, 0.06, 0.05]).at(0.2, -0.065, -0.01));
    const cap = sdf.ellipsoid([0.211, 0.205, 0.195]).smoothIntersect(0.03, lowCut).smoothSubtract(0.03, faceMask, earCut);
    const headZ = (x: number, y: number) => 0.19 * Math.sqrt(Math.max(0.04, 1 - (x / 0.205) ** 2 - ((y - HEAD_Y) / 0.2) ** 2));
    const onHead = ([x, y, r]: [number, number, number]): P4 => [x, y + 0.024 - HEAD_Y, headZ(x, y) + 0.004, r];
    const lockOf = (pts: [number, number, number][]) => sdf.chain(pts.map(onHead), 0.02);
    const fringe = [
      // Swept from a part above the character's right brow, across the forehead, to the left temple.
      [[-0.1, 0.835, 0.024], [-0.06, 0.8, 0.023], [0.0, 0.775, 0.022], [0.07, 0.755, 0.02], [0.13, 0.735, 0.018]],
      [[-0.04, 0.845, 0.024], [0.0, 0.815, 0.023], [0.06, 0.785, 0.022], [0.11, 0.76, 0.02], [0.16, 0.72, 0.018], [0.18, 0.67, 0.015]],
      [[-0.14, 0.805, 0.022], [-0.1, 0.775, 0.021], [-0.04, 0.752, 0.02], [0.02, 0.745, 0.018]],
      [[0.03, 0.85, 0.023], [0.08, 0.82, 0.022], [0.13, 0.79, 0.02], [0.17, 0.75, 0.018], [0.185, 0.7, 0.015]],
      [[-0.07, 0.84, 0.022], [-0.03, 0.805, 0.021], [0.03, 0.775, 0.02], [0.08, 0.76, 0.017]],
      // Locks at the temples, beside the face.
      [[-0.17, 0.79, 0.022], [-0.185, 0.745, 0.021], [-0.192, 0.69, 0.019], [-0.19, 0.64, 0.014]],
      [[-0.12, 0.81, 0.022], [-0.15, 0.775, 0.021], [-0.17, 0.74, 0.018]],
      [[0.175, 0.74, 0.022], [0.19, 0.7, 0.021], [0.198, 0.65, 0.018], [0.194, 0.6, 0.014]],
    ] as [number, number, number][][];
    // The bun: a round mass on top, tilted back, wrapped by ridged locks (local head coordinates).
    const BUN = { c: [0, 0.25, -0.06] as const, r: [0.112, 0.1, 0.1] as const };
    const bunBase = sdf.ellipsoid(BUN.r).at(...BUN.c);
    const wraps = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const phi = (i / 8) * Math.PI * 2;
      const pts: P4[] = [];
      for (let j = 0; j <= 6; j++) {
        const th = 0.25 + (j / 6) * 2.3;
        const sx = Math.sin(th) * Math.cos(phi + th * 0.55);
        const sz = Math.sin(th) * Math.sin(phi + th * 0.55);
        pts.push([BUN.c[0] + (BUN.r[0] + 0.004) * sx, BUN.c[1] + (BUN.r[1] + 0.004) * Math.cos(th), BUN.c[2] + (BUN.r[2] + 0.004) * sz, 0.03]);
      }
      return sdf.chain(pts, 0.02);
    });
    const bun = sdf.smoothUnion(0.045, bunBase, ...wraps);
    // A small neck of hair joins the bun to the cap.
    const bunStem = sdf.capsule([0, 0.15, -0.05], [0, 0.23, -0.055], 0.065);
    const hairShape = headPose(
      cap.smoothUnion(0.04, ...fringe.map(lockOf)).smoothUnion(0.03, bunStem, bun),
    ).bone('head');
    k.body('hair', hairShape, { color: hairColor, roughness: 0.55, detail: 0.004 });

    const skirtProfile = (g: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.3],
              [0.13 + g, 0.3],
              [0.143 + g, 0.22],
              [0.153 + g, 0.14],
              [0.158 + g, 0.06],
              [0, 0.06],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.92]);

    // ------------------------------------------------------------------ gold: pin, earrings, medallion
    const pin = sdf.sphere(0.024).at(0, 0.238, 0.046);
    const earring = sdf.smoothUnion(0.006, sdf.sphere(0.009).at(0.205, -0.085, 0.003), sdf.sphere(0.021).at(0.206, -0.13, 0.006));
    const jewelry = headPose(sdf.union(pin, pair(earring))).bone('head');
    // The medallion sits on the sash at the middle of the chest.
    const robeTorso = h.torso.round(0.008);
    const sashShape = skirtProfile(0.007).intersect(h.band(0.262, 0.302));
    const chestZ = sdf.raycast(sashShape, [0, 0.281, 1], [0, 0, -1])?.[2] ?? 0.12;
    const medallion = sdf.cylinder(0.04, 0.014, 0.005).rotateX(90).at(0, 0.281, chestZ + 0.012).bone('chest');
    const medal = medallion.paintWhere(sdf.sphere(0.022).at(0, 0.281, chestZ + 0.034), C.seal, 0.003);
    k.body('gold', sdf.union(jewelry, medal), { color: C.gold, roughness: 0.35, metalness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ robe: wide sleeves, long skirt, gold trim bands
    const sleeveOf = (j: { ELBOW: readonly [number, number, number]; WRIST: readonly [number, number, number] }) => {
      const at = (t: number) => lerp(j.ELBOW, j.WRIST, t);
      const upper = sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.054, 0.058).bone('upperarm.L');
      const axis = [j.WRIST[0] - j.ELBOW[0], j.WRIST[1] - j.ELBOW[1], j.WRIST[2] - j.ELBOW[2]];
      const len = Math.hypot(axis[0]!, axis[1]!, axis[2]!);
      const n: [number, number, number] = [axis[0]! / len, axis[1]! / len, axis[2]! / len];
      const dotN = (p: readonly number[]) => n[0] * p[0]! + n[1] * p[1]! + n[2] * p[2]!;
      if (j.WRIST[1] > j.ELBOW[1]) {
        // The forearm points up: a snug sleeve to the wrist and a wide drape that hangs down from it.
        const forearm = sdf.cone(at(0.05), at(0.95), 0.05, 0.043).bone('forearm.L');
        const cuff = sdf.cone(at(0.82), at(0.97), 0.047, 0.048).intersect(sdf.halfSpace(n, dotN(at(0.97)))).intersect(sdf.halfSpace([-n[0], -n[1], -n[2]], -dotN(at(0.82)))).bone('forearm.L');
        const T = at(0.3);
        const B: [number, number, number] = [T[0] + 0.015, T[1] - 0.15, T[2]];
        const yRim = B[1] + 0.025;
        const drape = sdf.cone(T, B, 0.05, 0.092).intersect(sdf.halfSpace([0, -1, 0], -B[1])).bone('forearm.L');
        const cavity = sdf.cone([T[0], T[1] - 0.06, T[2]], [B[0], B[1] - 0.1, B[2]], 0.03, 0.082);
        const rim = sdf
          .cone([B[0], yRim, B[2]], B, 0.0925, 0.095)
          .intersect(sdf.halfSpace([0, -1, 0], -B[1]))
          .intersect(sdf.halfSpace([0, 1, 0], yRim))
          .smoothSubtract(0.004, cavity)
          .bone('forearm.L');
        return { body: sdf.smoothUnion(0.02, upper, forearm, drape).smoothSubtract(0.01, cavity), rim: sdf.union(rim, cuff) };
      }
      // The forearm hangs: a trumpet flares past the wrist, with a gold rim at the open end.
      const rAt = (t: number) => 0.054 + (0.108 - 0.054) * ((t - 0.1) / 1.2);
      const end = dotN(at(1.3));
      const trumpet = sdf.cone(at(0.1), at(1.3), rAt(0.1), rAt(1.3)).intersect(sdf.halfSpace(n, end)).bone('forearm.L');
      const cavity = sdf.cone(at(0.6), at(1.5), 0.03, 0.094);
      const rim = sdf
        .cone(at(1.0), at(1.3), rAt(1.0) + 0.004, rAt(1.3) + 0.004)
        .intersect(sdf.halfSpace(n, end))
        .intersect(sdf.halfSpace([-n[0], -n[1], -n[2]], -dotN(at(1.15))))
        .smoothSubtract(0.004, cavity)
        .bone('forearm.L');
      return { body: sdf.smoothUnion(0.02, upper, trumpet).smoothSubtract(0.01, cavity), rim };
    };
    const sleeves = h.perArm((j) => sleeveOf(j).body);
    const rims = h.perArm((j) => sleeveOf(j).rim);
    const bodyRobe = h.weighted(robeTorso.smoothIntersect(0.01, h.band(0.152, 0.452)));
    const stripe = sdf.box([0.05, 0.42, 0.5], 0.004).at(0, 0.26, 0.25);
    const collarV = [-1, 1].map((s) => sdf.box([0.03, 0.17, 0.5], 0.004).rotateZ(-s * 38).at(s * 0.036, 0.41, 0.25));
    const robe = sdf
      .smoothUnion(0.02, bodyRobe, h.weighted(skirtProfile(0)))
      .union(sleeves)
      .paintWhere(h.band(0.06, 0.092), C.gold, 0.004)
      .paintWhere(stripe.intersect(h.band(0.06, 0.45)), C.gold, 0.003)
      .paintWhere(sdf.union(...collarV).intersect(h.band(0.36, 0.455)), C.gold, 0.003);
    k.body('robe', robe, { color: robeColor, roughness: 0.85, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(x * 70 + y * 50) * Math.cos(z * 60) });
    k.body('rims', rims, { color: C.gold, roughness: 0.5, metalness: 0.25, detail: 0.004 });

    // The sash: a gold band around the waist.
    const sash = h.weighted(sashShape.round(0.004));
    k.body('sash', sash, { color: C.sashRed, roughness: 0.6, detail: 0.004 });
    const sashTrim = h.weighted(
      sdf.union(
        skirtProfile(0.01).intersect(h.band(0.262, 0.2695)),
        skirtProfile(0.01).intersect(h.band(0.2945, 0.302)),
      ).round(0.003),
    );
    k.body('sashTrim', sashTrim, { color: C.gold, roughness: 0.4, metalness: 0.5, detail: 0.004 });

    // ------------------------------------------------------------------ soft gold shoes with a rounded toe
    const shoeBody = sdf
      .smoothUnion(0.03, sdf.ellipsoid([0.054, 0.04, 0.1]).at(0, 0.04, 0.045), sdf.sphere(0.047).at(0, 0.05, -0.012))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const shoe = shoeBody.rotateY(8).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.5, metalness: 0.15, detail: 0.004 });

    // ------------------------------------------------------------------ the scroll, held in the right fist
    // Built along +Z around the grip, then turned outward and up as in the mockup.
    const G = h.arms.R.GRIP;
    const paper = sdf.cylinder(0.02, 0.18, 0.004).rotateX(90);
    const rimRing = (z: number) => sdf.torus(0.0165, 0.0065).rotateX(90).at(0, 0, z);
    const ribbonZ = 0.055;
    const ribbon = sdf.cylinder(0.0235, 0.016, 0.003).rotateX(90).at(0, 0, ribbonZ);
    const bow = sdf.smoothUnion(
      0.006,
      sdf.ellipsoid([0.014, 0.008, 0.009]).at(0.012, 0.025, ribbonZ),
      sdf.ellipsoid([0.014, 0.008, 0.009]).at(-0.012, 0.025, ribbonZ),
    );
    const tails = sdf.union(
      sdf.chain([[0.006, 0.022, ribbonZ, 0.006], [0.02, 0.0, ribbonZ + 0.03, 0.005], [0.03, -0.03, ribbonZ + 0.04, 0.004]], 0.004),
      sdf.chain([[-0.006, 0.022, ribbonZ, 0.006], [-0.02, 0.0, ribbonZ + 0.03, 0.005], [-0.03, -0.03, ribbonZ + 0.04, 0.004]], 0.004),
    );
    const seal = sdf.smoothUnion(0.006, sdf.ellipsoid([0.016, 0.01, 0.016]).rotateX(90).at(0, 0.026, ribbonZ - 0.024), sdf.sphere(0.012).at(0.008, 0.022, ribbonZ - 0.03));
    const scroll = sdf
      .union(
        paper.paint(C.paper),
        rimRing(0.088).paint(C.paperDark),
        rimRing(-0.088).paint(C.paperDark),
        ribbon.paint(C.gold),
        bow.paint(C.gold),
        tails.paint(C.gold),
        seal.paint(C.seal),
      )
      .at(0, 0, 0.04)
      .scale(1.45)
      .rotateX(-40)
      .rotateY(-70)
      .at(-G[0], G[1], G[2])
      .bone('knife.R');
    k.body('scroll', scroll, { color: C.paper, roughness: 0.8, detail: 0.004 });
  },
});
