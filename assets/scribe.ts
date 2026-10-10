import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Scribe — Chibi Quest settlement NPC (catalog `npcs/settlement/scribe`), about 1.0 m to the top of
 * the hair, faces +Z. Target: docs/npc-mockups/scribe_001.jpg. Built on the humanoid kind.
 *
 * Role: the town hall and library NPC who writes letters and records quests; seen in 3D and as a
 *   128 px sprite. The long white quill and the cream scroll board are the focal points.
 * One idea: a neat young scribe whose tousled brown fringe, bunched hood, and ink pot frame a long
 *   white quill held out toward a cream scroll on a wooden board.
 * Shape language: round and soft (hair locks, hood roll, ink pot), with the flat board and the
 *   feather as the harder, lighter forms.
 * Palette (60/30/10): brown #7a5a3a tunic, #4a3424 belt, #5a3a24 boots; cream #f0e6cc shirt and
 *   #ece0c4 scroll; dark green #2f4a3a trousers; white #f6f1ea quill; the ink pot #2a2428 is the dark accent.
 * Value plan: the white quill and the cream scroll are the lightest forms, on the mid brown tunic;
 *   the dark trousers and boots hold the base.
 * Bodies: skin (freckles, small smile), ears, hair (cap, locks), shirt, cuffs, tunic (hood roll),
 *   belt, ink pot, spare quills, trousers, boots, quill, board, scroll.
 * Rig: the humanoid kind's skeleton and clips. Both arms keep a held pose (`pose`); the board with the scroll is
 *   rigid on `knife.R` and the quill on `knife.L`.
 */

const C = {
  cream: '#f0e6cc',
  cuff: '#ddd0aa',
  belt: '#33221a',
  brass: '#c8a040',
  ink: '#2a2428',
  quill: '#f6f1ea',
  pants: '#2f4a3a',
  boot: '#5a3a24',
  bootSole: '#3a2416',
  board: '#9a6a3a',
  scroll: '#ece0c4',
  line: '#4a4448',
  tunicDark: '#5a432a',
};

const HEAD_Y = 0.675;

export default humanoidAsset({
  name: 'scribe',
  description: 'A neat young scribe in a brown tunic with a bunched hood, holding a long white quill and a wooden scroll board.',
  reference: 'docs/npc-mockups/scribe_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#4e2c1a', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { umber: '#5e4228', plum: '#6a4a5a', ochre: '#a8803a', slate: '#4f5a6a' },
  },
  presets: {
    ink: { skin: 'tan', hair: 'black', eyes: 'hazel', cloth: 'plum' },
  },
  hair: false,
  lashes: false,
  undershirt: false,
  pants: false,
  shoes: false,
  pose: {
    L: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] },
    R: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] },
  },

  // A calm small smile (the kind's), brows kept, and freckles on both cheeks.
  paintSkin(skin, h) {
    const freckle = (x: number, y: number) => h.onFace(sdf.sphere(0.0045), x, y);
    const dots: [number, number][] = [
      [0.1, 0.545],
      [0.125, 0.56],
      [0.14, 0.538],
      [0.15, 0.57],
      [0.115, 0.52],
      [0.095, 0.57],
    ];
    const spots = sdf.union(...dots.flatMap(([x, y]) => [freckle(x, y), freckle(-x, y)]));
    return skin.paintWhere(spots, '#c98a68', 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const rad = Math.PI / 180;

    // ------------------------------------------------------------------ bigger ears
    const ears = pair(
      sdf
        .ellipsoid([0.031, 0.054, 0.04])
        .subtract(sdf.sphere(0.02).at(0.018, 0, 0.008))
        .rotateY(-12)
        .at(0.205, 0.612, -0.012),
    ).bone('head');
    k.body('ears', ears, { color: k.tint('skin'), roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ hair: a small cap and many locks
    const hairColor = k.tint('hair');
    const C0: readonly [number, number, number] = [0, HEAD_Y + 0.008, -0.01];
    const R0: readonly [number, number, number] = [0.205, 0.202, 0.19];
    const skull = (out: number) => sdf.ellipsoid([R0[0] + out, R0[1] + out, R0[2] + out]).at(...C0);
    // A point on the hair surface: azimuth th (0 = front, + = toward +X) and elevation ph, in degrees.
    const surf = (th: number, ph: number, out: number): [number, number, number] => {
      const t = th * rad;
      const p = ph * rad;
      return [(R0[0] + out) * Math.cos(p) * Math.sin(t), C0[1] + (R0[1] + out) * Math.sin(p), C0[2] + (R0[2] + out) * Math.cos(p) * Math.cos(t)];
    };
    // A lock: a chain along the surface from (th0, ph0) to (th1, ph1), thick in the middle, tapering to a tip.
    const lock = (th0: number, ph0: number, th1: number, ph1: number, w = 0.03, lift = 0.02, tip = 0.3): sdf.Shape => {
      const pts = [0, 0.35, 0.7, 1].map((t, i): [number, number, number, number] => {
        const q = surf(th0 + (th1 - th0) * t, ph0 + (ph1 - ph0) * t, lift * (i === 3 ? 0.55 : 1));
        return [q[0], q[1], q[2], w * [0.85, 1, 0.85, tip][i]!];
      });
      return sdf.chain(pts, 0.006);
    };
    const topCap = skull(0.008).smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.69));
    const backCap = skull(0.008).smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], -0.64)).smoothIntersect(0.04, sdf.halfSpace([0, 0, -1], 0.06));
    const faceCut = sdf.ellipsoid([0.26, 0.14, 0.24]).at(0.0, 0.595, 0.15);
    const cap = sdf.smoothUnion(0.02, topCap, backCap).smoothSubtract(0.012, faceCut);
    // Side-swept hair: the part is left of center (the viewer's left); the long locks sweep to +X.
    const fringe = [
      lock(-26, 80, 4, 12, 0.044),
      lock(-16, 82, 18, 11, 0.046),
      lock(-4, 84, 34, 14, 0.046),
      lock(6, 84, 48, 20, 0.044),
      lock(16, 82, 62, 28, 0.042),
      lock(-30, 78, -46, 16, 0.038), // short locks left of the part
      lock(-38, 74, -62, 24, 0.036),
      lock(-8, 86, 30, 26, 0.036, 0.028), // a forelock over the rest
    ];
    const sides = [lock(-70, 48, -74, 10, 0.03), lock(70, 48, 74, 10, 0.03)];
    const back = [118, 152, 180, -152, -118].map((a) => lock(a, 60, a, 4, 0.058, 0.012, 0.8));
    const crown = [lock(-90, 82, 90, 82, 0.03, 0.02), lock(-150, 80, 150, 80, 0.03, 0.02)];
    // The cowlick: a curl that rises at the top, on the viewer's left (x < 0).
    const cow = sdf.chain(
      [
        [-0.05, 0.868, 0.02, 0.026],
        [-0.075, 0.905, 0.01, 0.022],
        [-0.07, 0.945, -0.005, 0.017],
        [-0.045, 0.955, -0.02, 0.012],
      ],
      0.012,
    );
    const hair = sdf.smoothUnion(0.006, cap, ...fringe, ...sides, ...back, ...crown, cow).bone('head');
    k.body('hair', hair, {
      color: hairColor,
      roughness: 0.55,
      detail: 0.004,
      bump: (x, y, z) => 0.0015 * Math.sin(x * 130 + y * 70) * Math.cos(z * 110),
    });

    // ------------------------------------------------------------------ shirt: cream torso and long sleeves, cuffs
    const shirtSleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.012,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.046, 0.042).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.95), 0.042, 0.04).bone('forearm.L'),
      ),
    );
    const shirt = sdf.smoothUnion(0.012, h.weighted(h.torso.round(0.004)).intersect(sdf.halfSpace([0, -1, 0], -0.17)), shirtSleeves);
    k.body('shirt', shirt, { color: C.cream, roughness: 0.88 });
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.72), lerp(j.ELBOW, j.WRIST, 0.98), 0.0455, 0.047).round(0.003).bone('forearm.L'));
    const sockBand = pair(sdf.cylinder(0.05, 0.03, 0.01).at(ANKLE[0], 0.12, 0.002).bone('shin.L'));
    k.body('cuffs', sdf.union(cuffs, sockBand), { color: C.cuff, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ tunic: open at the front, short sleeves, hood roll and hood back
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.134, 0.3],
            [0.15, 0.25],
            [0.162, 0.21],
            [0.168, 0.19],
            [0, 0.19],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    // The open front: a V, wide at the neck and narrow at the hem, shows the cream shirt.
    const slot = sdf
      .extrude(
        profile.polygon([
          [-0.062, 0.5],
          [0.062, 0.5],
          [0.034, 0.18],
          [-0.034, 0.18],
        ]),
        0.4,
        0.01,
      )
      .at(0, 0, 0.2);
    const tunicBody = sdf
      .smoothUnion(0.02, h.torso.round(0.012), skirt)
      .intersect(sdf.halfSpace([0, -1, 0], -0.19))
      .subtract(slot);
    const tunicSleeves = h.perArm((j) =>
      sdf.cone(lerp(SHOULDER, j.ELBOW, -0.14), lerp(SHOULDER, j.ELBOW, 0.92), 0.056, 0.052).round(0.004).bone('upperarm.L'),
    );
    // The hood is down: a full, darker scarf roll around the neck and a soft hood drape on the back.
    const roll = sdf.smoothUnion(
      0.02,
      sdf.torus(0.092, 0.042).scale([1, 0.85, 0.95]).at(0, 0.436, 0.012),
      sdf.torus(0.088, 0.03).scale([1, 0.9, 0.95]).at(0, 0.41, 0.022),
    );
    const drape = sdf.smoothUnion(0.03, sdf.ellipsoid([0.1, 0.075, 0.035]).at(0, 0.4, -0.092), sdf.ellipsoid([0.045, 0.07, 0.03]).at(0, 0.34, -0.104));
    const tunic = sdf.smoothUnion(0.01, h.weighted(tunicBody), tunicSleeves, drape.bone('chest'));
    k.body('tunic', tunic, { color: h.tint.shirt ?? '#5e4228', roughness: 0.86, detail: 0.005 });
    k.body('scarf', roll.bone('chest'), { color: k.tint('cloth', { color: '#44301e', follow: 1 }), roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(x * 70 + z * 50) * Math.cos(y * 60) });

    // ------------------------------------------------------------------ belt, buckle, shoulder strap
    const grown = h.torso.round(0.02);
    const beltRing = grown.intersect(sdf.box([0.6, 0.026, 0.6]).at(0, 0.25, 0));
    const shell = h.torso.round(0.019).subtract(h.torso.round(0.008));
    const strapBar = sdf.box([0.5, 0.034, 0.8]).rotateZ(-49).at(0.015, 0.32, 0);
    const strap = shell.intersect(strapBar).intersect(sdf.halfSpace([0, 1, 0], 0.45)).intersect(sdf.halfSpace([0, -1, 0], -0.2));
    const belt = sdf.smoothUnion(0.006, h.weighted(beltRing), h.weighted(strap));
    k.body('belt', belt, { color: C.belt, roughness: 0.65, detail: 0.004 });
    const buckleZ = sdf.raycast(grown, [0, 0.25, 1], [0, 0, -1])![2];
    k.body('buckle', sdf.box([0.036, 0.034, 0.012], 0.004).at(0, 0.25, buckleZ + 0.003).bone('spine'), {
      color: C.brass,
      roughness: 0.35,
      metalness: 0.85,
      detail: 0.003,
    });

    // The ink pot on the left hip (x > 0): a squat black bottle with a brass band and a cork.
    const potZ = sdf.raycast(grown, [0.116, 0.225, 1], [0, 0, -1])![2];
    const pc: [number, number, number] = [0.118, 0.222, potZ + 0.026];
    const pot = sdf
      .smoothUnion(
        0.01,
        sdf.ellipsoid([0.034, 0.034, 0.034]).at(...pc),
        sdf.cylinder(0.017, 0.03, 0.005).at(pc[0], pc[1] + 0.04, pc[2]),
      )
      .paintWhere(sdf.box([0.2, 0.012, 0.2]).at(pc[0], pc[1] + 0.03, pc[2]), C.brass, 0.002);
    k.body('ink-pot', pot.bone('spine'), { color: C.ink, roughness: 0.3, detail: 0.003 });
    k.body('ink-cork', sdf.cylinder(0.013, 0.014, 0.004).at(pc[0], pc[1] + 0.063, pc[2]).bone('spine'), { color: '#8a5a3a', roughness: 0.8, detail: 0.003 });

    // Two spare quills tucked in the belt at the left hip, behind the ink pot, tips up and out.
    const spare = (dz: number, tilt: number) => {
      const shaft = sdf.capsule([0, 0, 0], [0, 0.11, 0], 0.0055);
      const vane = sdf.ellipsoid([0.0075, 0.045, 0.0045]).at(0, 0.08, 0);
      return sdf.smoothUnion(0.004, shaft, vane).rotateZ(-tilt).at(0.11, 0.245, -0.04 + dz);
    };
    k.body('spare-quills', sdf.union(spare(0, 14), spare(0.028, 22)).bone('spine'), { color: C.quill, roughness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ dark green trousers and brown boots
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.12, 0.002], 0.048, 0.046).bone('shin.L'),
    );
    k.body('trousers', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), h.weighted(h.torso.round(0.006).intersect(h.band(0.15, 0.215))), pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.86,
    });
    const bootFoot = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.044, 0.1]).at(0, 0.044, 0.04),
        sdf.sphere(0.052).at(0, 0.056, -0.005),
        sdf.cylinder(0.054, 0.075, 0.016).at(0, 0.095, 0), // the boot shaft
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const soleBand = bootFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.016)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf.union(bootFoot, soleBand.paint(C.bootSole)).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ held items
    const gR = h.arms.R.GRIP;
    const gL = h.arms.L.GRIP;

    // The quill (left hand, x > 0, the viewer's right): built along +X (the nib at +X), 0.16 m long, then aimed so the nib
    // points in toward the board and the feather rises outward.
    const quillLocal = (() => {
      const shaft = sdf.capsule([-0.2, 0, 0], [0.12, 0, 0], 0.0065);
      const nib = sdf.cone([0.1, 0, 0], [0.14, 0, 0], 0.0055, 0.0018);
      // A flat vane (0.03 wide, 0.014 thick) with a scalloped outer edge.
      const vane = sdf.ellipsoid([0.1, 0.008, 0.02]).at(-0.1, 0, 0);
      const notches = sdf.union(...[-0.17, -0.145, -0.12, -0.095, -0.07, -0.045].flatMap((x) => [sdf.sphere(0.006).at(x, 0, 0.0205), sdf.sphere(0.006).at(x, 0, -0.0205)]));
      const feather = vane.subtract(notches);
      return sdf
        .smoothUnion(0.004, shaft, nib, feather)
        .paintWhere(sdf.box([0.024, 0.1, 0.1]).at(0.138, 0, 0), C.ink, 0.002);
    })();
    const dir = [-0.55, -0.7, 0.45];
    const dl = Math.hypot(...dir);
    const elev = Math.atan2(dir[1]! / dl, Math.hypot(dir[0]! / dl, dir[2]! / dl)) / rad;
    const yaw = -Math.atan2(dir[2]! / dl, dir[0]! / dl) / rad;
    const quillAt = (s: sdf.Shape) => s.rotateZ(elev).rotateY(yaw).at(gL[0], gL[1], gL[2]);
    k.body('quill', quillAt(quillLocal).bone('knife.L'), { color: C.quill, roughness: 0.6, detail: 0.003 });

    // The writing board (right hand, x < 0, the viewer's left): 0.16 wide, 0.2 tall, 0.02 thick, a cream scroll sheet with a
    // rolled top and ruled lines, held upright, its top tilted back toward the face.
    const boardLocal = (() => {
      const plank = sdf.box([0.16, 0.2, 0.02], 0.006);
      const ledge = sdf.box([0.17, 0.016, 0.034], 0.005).at(0, -0.096, 0.007);
      return sdf.smoothUnion(0.004, plank, ledge);
    })();
    const sheetLocal = (() => {
      const sheet = sdf.box([0.136, 0.17, 0.008], 0.003).at(0, -0.005, 0.012);
      const roll = sdf.cylinder(0.0125, 0.15, 0.003).rotateZ(90).at(0, 0.088, 0.015);
      const lines = sdf.union(...[0.05, 0.03, 0.01, -0.01, -0.03, -0.05, -0.07].map((y) => sdf.box([0.1, 0.0075, 0.1], 0.001).at(y === 0.05 ? -0.008 : 0, y, 0.015)));
      return sdf.smoothUnion(0.004, sheet, roll).paintWhere(lines.intersect(sdf.box([0.2, 0.2, 0.03]).at(0, 0, 0.0155)), C.line, 0.0015);
    })();
    const boardAt = (s: sdf.Shape) => s.rotateX(-12).at(-gR[0] - 0.02, gR[1] + 0.04, gR[2] + 0.02);
    k.body('board', boardAt(boardLocal).bone('knife.R'), { color: C.board, roughness: 0.75, detail: 0.003 });
    k.body('scroll', boardAt(sheetLocal).bone('knife.R'), { color: C.scroll, roughness: 0.9, detail: 0.003 });
  },
});
