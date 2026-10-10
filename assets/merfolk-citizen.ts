import { profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Merfolk citizen — a P2 NPC of the harbor town (catalog `npcs/fantasy-peoples/merfolk-citizen`),
 * about 1.0 m to the top of the hair, faces +Z. Target: docs/npc-mockups/merfolk-citizen_001.jpg.
 * Built on the humanoid kind (skeleton, knees, clip set); the tail is rigid on the hips.
 *
 * Role: a harbor boy who brings news and sea errands; a 3D NPC and a 128 px sprite.
 * One idea: a cheerful boy with wild sea-blue fin locks, a teal fish tail that curls behind his right
 *   leg to a wide fan fin, and a glowing pearl held up beside his head.
 * Shape language: round and soft; the swept hair locks, the star clips, and the fan fin break the outline.
 * Palette: skin #d49a72, cheeks #e08a7a; hair #3a9a9a; starfish #f08a3a; tunic #5a9a8a with a #e07a3a
 *   clasp; rope belt #ece0c8; scale shorts and tail #2a8a8a with #4aa8a0 edges; fin #6ac0b8; pearl #fff8e8.
 * Value plan: the pearl and the open smile are the focal points; teal hair and tail are the mid values;
 *   the orange stars are the small accent.
 * Bodies: skin, hair, starfish, tunic, clasp, belt, shorts, feet, tail, fin, pearl.
 * Rig: the kind's skeleton and clips; the left arm is posed raised and holds the pearl on `knife.L`.
 */

const C = {
  hair: '#3a9a9a',
  star: '#f08a3a',
  clasp: '#e07a3a',
  belt: '#ece0c8',
  beltLine: '#c4b08a',
  scale: '#2a8a8a',
  scaleEdge: '#4aa8a0',
  fin: '#6ac0b8',
  pearl: '#fff8e8',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

const EDGE = rgb('#4aa8a0');
const LINE = rgb('#c4b08a');

type P4 = [number, number, number, number];

// Scale cells: 3D Worley noise, F2 - F1 (0 on a cell edge, about 0.5 in the middle).
const scaleCells = (x: number, y: number, z: number, f: number): number => {
  const px = x * f;
  const py = y * f * 1.15;
  const pz = z * f;
  const xi = Math.floor(px);
  const yi = Math.floor(py);
  const zi = Math.floor(pz);
  let f1 = 9;
  let f2 = 9;
  const rnd = (i: number, j: number, l: number): number => {
    const s = Math.sin(i * 127.1 + j * 311.7 + l * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++)
      for (let l = -1; l <= 1; l++) {
        const cx = xi + i;
        const cy = yi + j;
        const cz = zi + l;
        const dx = cx + 0.15 + 0.7 * rnd(cx, cy, cz) - px;
        const dy = cy + 0.15 + 0.7 * rnd(cy + 71, cz, cx) - py;
        const dz = cz + 0.15 + 0.7 * rnd(cz, cx + 13, cy) - pz;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < f1) {
          f2 = f1;
          f1 = d;
        } else if (d < f2) f2 = d;
      }
  return Math.sqrt(f2) - Math.sqrt(f1);
};

/** A five-arm star in the XY plane, `r` to the arm tips, `thick` deep, centered at the origin. */
const star = (r: number, thick: number): sdf.Shape => {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i + Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.5;
    pts.push([rr * Math.cos(a), rr * Math.sin(a)]);
  }
  return sdf.extrude(profile.polygon(pts), thick, thick * 0.4).round(r * 0.1);
};

export default humanoidAsset({
  name: 'merfolk-citizen',
  description: 'A cheerful merfolk boy with a teal fish tail, scaled shorts, and sea-blue hair, holding up a glowing pearl.',
  reference: 'docs/npc-mockups/merfolk-citizen_001.jpg',
  variants: {
    skin: { tan: '#d49a72', fair: '#f2c7a4', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { sea: C.hair, teal: '#2f6f6a', silver: '#b8b4c4', auburn: '#8e3b1c' },
    eyes: { blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { seafoam: '#5a9a8a', coral: '#c8705a', lilac: '#8a78b0', sand: '#c8a870' },
  },
  presets: {
    tide: { skin: 'tan', hair: 'sea', eyes: 'blue', cloth: 'seafoam' },
    reef: { skin: 'fair', hair: 'auburn', eyes: 'green', cloth: 'coral' },
  },
  pose: { L: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] } },
  lashes: false,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,

  // The open, laughing mouth: a wide crescent with round corners, one tooth band, and a tongue.
  paintSkin(skin, h) {
    const y = 0.538;
    const grin = profile.polygon(
      [
        [-0.056, 0.014],
        [-0.03, 0.003],
        [0, 0.0],
        [0.03, 0.003],
        [0.056, 0.014],
        [0.046, -0.012],
        [0.023, -0.03],
        [0, -0.036],
        [-0.023, -0.03],
        [-0.046, -0.012],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.011))).intersect(sdf.box([0.064, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.026, 0.014, 0.08]), 0, y - 0.03);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.014, 58, 122), 0.3).at(0.1, 0.657, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const skinColor = k.tint('skin');
    const hairColor = k.tint('hair');

    // ------------------------------------------------------------------ larger ears
    const ear = pair(
      sdf
        .ellipsoid([0.032, 0.054, 0.04])
        .subtract(sdf.sphere(0.021).at(0.018, 0, 0.007))
        .rotateY(-12)
        .at(0.205, 0.61, -0.01)
        .bone('head'),
    );
    k.body('ears', ear, { color: skinColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a small cap and fin-like locks
    const hp = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const lock = (pts: P4[], k2 = 0.02) => hp(sdf.chain(pts, k2));
    const cap = hp(
      sdf
        .ellipsoid([0.212, 0.206, 0.198])
        .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.05))
        .smoothSubtract(0.02, sdf.ellipsoid([0.165, 0.1, 0.17]).at(0, -0.015, 0.2)),
    );
    // The big upward fin locks (the one idea of the hair): each swoops up and curls over at the tip.
    const tops = [
      lock([[0.0, 0.15, 0.1, 0.05], [-0.05, 0.21, 0.1, 0.042], [-0.12, 0.25, 0.07, 0.03], [-0.2, 0.24, 0.02, 0.012]]),
      lock([[0.06, 0.16, 0.08, 0.05], [0.08, 0.22, 0.08, 0.042], [0.15, 0.28, 0.04, 0.03], [0.23, 0.28, -0.02, 0.012]]),
      lock([[-0.07, 0.15, 0.04, 0.05], [-0.15, 0.2, 0.02, 0.04], [-0.23, 0.24, -0.03, 0.026], [-0.3, 0.2, -0.1, 0.01]]),
      lock([[0.1, 0.12, 0.0, 0.05], [0.18, 0.18, -0.03, 0.04], [0.26, 0.2, -0.08, 0.026], [0.3, 0.16, -0.14, 0.01]]),
      lock([[0.0, 0.16, -0.05, 0.05], [0.02, 0.23, -0.08, 0.04], [0.0, 0.28, -0.15, 0.026], [-0.06, 0.28, -0.22, 0.01]]),
      lock([[-0.02, 0.13, 0.13, 0.04], [-0.01, 0.2, 0.17, 0.033], [0.05, 0.25, 0.15, 0.022], [0.1, 0.26, 0.1, 0.01]]),
    ];
    // The fringe: curved locks that sweep over the forehead from the right (viewer's left) to the left.
    const fringe = [
      lock([[-0.03, 0.16, 0.12, 0.034], [-0.07, 0.13, 0.17, 0.03], [-0.12, 0.1, 0.17, 0.024], [-0.15, 0.07, 0.16, 0.01]]),
      lock([[0.03, 0.17, 0.12, 0.034], [0.0, 0.14, 0.18, 0.03], [-0.04, 0.115, 0.195, 0.022], [-0.07, 0.1, 0.195, 0.009]]),
      lock([[0.08, 0.15, 0.1, 0.034], [0.09, 0.125, 0.17, 0.028], [0.07, 0.1, 0.19, 0.02], [0.05, 0.085, 0.195, 0.008]]),
      lock([[0.12, 0.13, 0.08, 0.034], [0.16, 0.1, 0.12, 0.028], [0.17, 0.07, 0.13, 0.018], [0.17, 0.05, 0.12, 0.008]]),
    ];
    // Side locks beside the ears, and a ragged row at the nape.
    const sides = pair(
      lock([[0.18, 0.1, 0.05, 0.038], [0.195, 0.03, 0.05, 0.032], [0.192, -0.04, 0.05, 0.024], [0.185, -0.1, 0.05, 0.01]]),
    );
    // Short curled locks that drape over the crown, the sides, and the back (they break up the cap).
    const drape = [55, 100, 140, 180, 220, 260, 305].map((deg, i) => {
      const r = (deg * Math.PI) / 180;
      const sx = Math.sin(r);
      const cz = Math.cos(r);
      const bend = i % 2 === 0 ? 0.03 : -0.03;
      return lock([
        [0.07 * sx, 0.19, 0.07 * cz, 0.04],
        [0.14 * sx + bend * cz, 0.15, 0.14 * cz - bend * sx, 0.036],
        [0.2 * sx + 1.5 * bend * cz, 0.02, 0.19 * cz - 1.5 * bend * sx, 0.03],
        [0.2 * sx + 2 * bend * cz, -0.065 - (i % 2) * 0.025, 0.19 * cz - 2 * bend * sx, 0.012],
      ]);
    });
    const nape: sdf.Shape[] = drape;
    const hair = sdf.smoothUnion(0.018, cap, ...tops, ...fringe, sides, ...nape).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.55, detail: 0.005 });

    // ------------------------------------------------------------------ the starfish hair clip (viewer's right)
    const clip = star(0.045, 0.02).rotateZ(-14).rotateY(70).at(0.226, HEAD_Y + 0.12, 0.07).bone('head');
    k.body('clip', clip, { color: C.star, roughness: 0.55, detail: 0.003 });

    // ------------------------------------------------------------------ the sea-green tunic with a keyhole
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.012,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), lerp(SHOULDER, j.ELBOW, 0.62), 0.05, 0.056).bone('upperarm.L'),
      ),
    );
    const slot = sdf.smoothUnion(0.01, sdf.box([0.09, 0.09, 0.4], 0.04).at(0, 0.335, 0.2), sdf.sphere(0.05).at(0, 0.355, 0.12));
    const body = h.torso.round(0.012).intersect(sdf.halfSpace([0, -1, 0], -0.305)).subtract(slot);
    k.body('tunic', sdf.smoothUnion(0.012, h.weighted(body), sleeves), { color: h.tint.shirt ?? '#5a9a8a', roughness: 0.85 });

    // The round clasp bead above the keyhole.
    const zc = sdf.raycast(h.torso.round(0.012), [0, 0.4, 1], [0, 0, -1]);
    const bead = sdf.sphere(0.019).at(0, 0.4, (zc ? zc[2] : 0.1) + 0.003).bone('chest');
    k.body('clasp', bead, { color: C.clasp, roughness: 0.4, detail: 0.003 });

    // ------------------------------------------------------------------ the rope belt and its starfish
    const beltShell = h.torso.round(0.016);
    const belt = h.weighted(beltShell.intersect(sdf.box([0.6, 0.044, 0.6]).at(0, 0.248, 0)));
    const weave = (x: number, y: number, z: number) => Math.sin(Math.atan2(x, z) * 26 + y * 150);
    k.body('belt', belt.paintFn((x, y, z, base) => (Math.abs(weave(x, y, z)) < 0.2 ? LINE : base)), {
      color: C.belt,
      roughness: 0.9,
      detail: 0.004,
      bump: (x, y, z) => 0.0028 * Math.abs(weave(x, y, z)),
    });
    const bz = sdf.raycast(beltShell, [0.045, 0.248, 1], [0, 0, -1]);
    const beltStar = star(0.06, 0.02).rotateZ(12).at(0.045, 0.245, (bz ? bz[2] : 0.12) + 0.006).rotateY(8).bone('spine');
    k.body('beltstar', beltStar, { color: C.star, roughness: 0.55, detail: 0.003 });

    // ------------------------------------------------------------------ scaled shorts to the knee
    const legTube = sdf.smoothUnion(0.015, sdf.capsule(HIP, [KNEE[0], 0.135, 0], 0.058).bone('leg.L'), sdf.cone([KNEE[0], 0.135, 0], [KNEE[0], 0.122, 0.002], 0.058, 0.056).bone('shin.L'));
    const shortsTop = h.weighted(h.torso.round(0.012).intersect(sdf.halfSpace([0, -1, 0], -0.152)).intersect(sdf.halfSpace([0, 1, 0], 0.236)));
    const shorts = sdf.smoothUnion(0.03, shortsTop, pair(legTube));
    // Layered scale lobes hanging from the belt, front and sides.
    const lobes = sdf.union(
      ...[-80, -58, -36, -14, 14, 36, 58, 80, 100, -100].map((a) => {
        const r = (a * Math.PI) / 180;
        return sdf
          .ellipsoid([0.028, 0.04, 0.011])
          .rotateX(-12)
          .rotateY(a)
          .at(0.137 * Math.sin(r), 0.21, 0.107 * Math.cos(r))
          .bone('hips');
      }),
    );
    const scaleSurf = (x: number, y: number, z: number) => scaleCells(x, y, z, 44);
    const shortsAll = sdf.smoothUnion(0.01, shorts, lobes);
    k.body('shorts', shortsAll.paintFn((x, y, z, base) => (scaleSurf(x, y, z) < 0.13 ? EDGE : base)), {
      color: C.scale,
      roughness: 0.55,
      detail: 0.004,
      bump: (x, y, z) => 0.003 * Math.min(1, scaleSurf(x, y, z) / 0.45),
    });

    // ------------------------------------------------------------------ bare feet
    const foot = sdf
      .smoothUnion(
        0.02,
        sdf.capsule([ANKLE[0], 0.075, 0], [ANKLE[0], 0.045, 0.02], 0.036),
        sdf.ellipsoid([0.043, 0.035, 0.08]).at(ANKLE[0], 0.036, 0.04),
        ...[-0.026, -0.0085, 0.0085, 0.026].map((dx, i) => sdf.sphere(0.0125 - Math.abs(dx) * 0.1).at(ANKLE[0] + dx * 1.0, 0.017, 0.116 - Math.abs(dx) * 0.4 + 0.0 * i)),
        sdf.sphere(0.014).at(ANKLE[0] - 0.034, 0.018, 0.1),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(10)
      .bone('foot.L');
    k.body('feet', pair(foot), { color: skinColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the fish tail (rigid on the hips)
    // From the lower back it curls down behind the right leg (x < 0) and up into the fan fin.
    const tailPts: P4[] = [
      [0.0, 0.21, -0.07, 0.07],
      [-0.03, 0.15, -0.17, 0.06],
      [-0.1, 0.095, -0.23, 0.053],
      [-0.17, 0.088, -0.235, 0.042],
      [-0.22, 0.13, -0.225, 0.03],
    ];
    const tail = sdf.chain(tailPts, 0.02).bone('hips');
    const tailScale = (x: number, y: number, z: number) => scaleCells(x, y, z, 52);
    k.body('tail', tail.paintFn((x, y, z, base) => (tailScale(x, y, z) < 0.14 ? EDGE : base)), {
      color: C.scale,
      roughness: 0.5,
      detail: 0.004,
      bump: (x, y, z) => 0.0035 * Math.min(1, tailScale(x, y, z) / 0.45),
    });
    const fanProfile = profile.polygon(
      [
        [0, -0.025],
        [0.08, -0.07],
        [0.17, -0.12],
        [0.225, -0.135],
        [0.215, -0.07],
        [0.24, 0.0],
        [0.235, 0.09],
        [0.25, 0.19],
        [0.17, 0.165],
        [0.09, 0.1],
        [0, 0.03],
      ],
      { smooth: true, samples: 6 },
    );
    const fin = sdf
      .extrude(fanProfile, 0.02, 0.007)
      .scale(1.15)
      .rotateY(168)
      .rotateZ(-10)
      .at(-0.215, 0.16, -0.225)
      .bone('hips');
    k.body('fin', fin, {
      color: C.fin,
      roughness: 0.45,
      detail: 0.004,
      bump: (x, y) => 0.003 * Math.abs(Math.sin(((y - 0.14) / (Math.abs(x + 0.215) + 0.05)) * 9)),
    });

    // ------------------------------------------------------------------ the glowing pearl in the raised fist
    const W = h.arms.L.WRIST;
    const E = h.arms.L.ELBOW;
    const dir = [W[0] - E[0], W[1] - E[1], W[2] - E[2]];
    const dl = Math.hypot(dir[0]!, dir[1]!, dir[2]!);
    const c: [number, number, number] = [W[0] + (dir[0]! / dl) * 0.095, W[1] + (dir[1]! / dl) * 0.095, W[2] + (dir[2]! / dl) * 0.095];
    const pearl = sdf.sphere(0.036).at(...c).bone('knife.L');
    k.body('pearl', pearl, { color: C.pearl, roughness: 0.2, emissive: C.pearl, emissiveIntensity: 0.7, detail: 0.003 });
  },
});
