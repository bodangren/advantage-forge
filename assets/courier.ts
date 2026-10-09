import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Courier — Chibi Quest settlement NPC (catalog `npcs/settlement/courier`), about 1.0 m to the top
 * of the feathered cap, faces +Z. Target: docs/npc-mockups/courier_001.jpg. Built on the humanoid
 * kind (worked examples: assets/baker.ts, assets/town-crier.ts).
 *
 * Role: a town NPC who delivers letters and quest messages; seen running in 3D and as a 128 px
 *   sprite. The tilted green cap with the long white feather, the red cape, the big satchel, and
 *   the raised sealed letters must read.
 * One idea: a speedy boy in a tilted green cap with a long white feather, a short red cape, and a
 *   bulging letter satchel, holding up two sealed letters.
 * Shape language: round and soft (cap, face, satchel), with the feather and the letters as the hard forms.
 * Palette (60/30/10): cape and scarf #b03a3a (the cloth slot); cream shirt #f0ead8; brown vest
 *   #7a4a2c, satchel #8a5a35, shorts #6b4a32, boots #5a3a24; cap #3f6a44; feather and letters
 *   #f6f1ea; hair #5a301d; the red wax seal is the accent.
 * Value plan: the green cap and the white feather over the light face are the focal point; the red
 *   cape frames the cream shirt; the cream letters against the dark satchel and the red seal are the accent.
 * Bodies: skin, cap, feather, hair, shirt, vest, straps, cape, scarf, shorts, boots, satchel,
 *   mail (letters in the satchel), brass (buckles), letter and seal (left hand).
 * Rig: the humanoid kind's skeleton and clips. The left arm keeps the raised `pose`; the letters
 *   are rigid on `knife.L`.
 */

const C = {
  cream: '#e6d1a2',
  vest: '#7a4a2c',
  satchel: '#8a5a35',
  strap: '#5f3a22',
  shorts: '#6b4a32',
  boot: '#5a3a24',
  sole: '#33211a',
  cap: '#3f6a44',
  paper: '#f6f1ea',
  seal: '#b03a3a',
  brass: '#c8a040',
};

export default humanoidAsset({
  name: 'courier',
  description: 'A speedy young courier in a feathered green cap and a short red cape, with a big letter satchel, holding up a sealed letter.',
  reference: 'docs/npc-mockups/courier_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { scarlet: '#b03a3a', wine: '#7a2f3f', rust: '#b8693a', plum: '#6a3f7a' },
  },
  presets: {
    swift: { skin: 'tan', hair: 'black', eyes: 'green', cloth: 'plum' },
  },
  pose: { L: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] }, R: { elbow: [0.19, 0.3, 0.05], wrist: [0.09, 0.35, 0.105] } },
  lashes: false,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const capeColor = h.tint.shirt ?? '#b03a3a';

    // ------------------------------------------------------------------ the green cap, tilted
    // A slouchy beret that sits low over the right temple (the viewer's left) and shows the hair at the left front.
    const capPose = (s: sdf.Shape) => s.rotateX(-12).rotateZ(14).at(0, HEAD_Y, 0);
    const capDome = sdf
      .smoothUnion(
        0.04,
        sdf.ellipsoid([0.232, 0.17, 0.222]).at(0, 0.06, -0.005),
        sdf.sphere(0.115).at(-0.13, 0.07, -0.02), // the big fold over the right temple
      )
      .smoothIntersect(0.02, sdf.halfSpace([0, -0.944, 0.33], -0.058));
    const capSolid = capPose(capDome);
    const cap = capSolid.bone('head');
    k.body('cap', cap, { color: C.cap, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(x * 55 + z * 35) * Math.cos(y * 45) });

    // ------------------------------------------------------------------ the long white feather
    // A quill that rises from the right fold of the beret and curls back at the tip, with swept barbs.
    const quill: [number, number, number, number][] = [
      [-0.14, 0.12, -0.04, 0.01],
      [-0.17, 0.2, -0.06, 0.009],
      [-0.15, 0.29, -0.09, 0.008],
      [-0.09, 0.35, -0.115, 0.007],
      [-0.02, 0.375, -0.135, 0.005],
    ];
    const barbs: sdf.Shape[] = [];
    for (let i = 1; i < quill.length; i++) {
      const p0 = quill[i - 1]!;
      const p1 = quill[i]!;
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const len = Math.hypot(dx, dy);
      const tx = dx / len;
      const ty = dy / len;
      for (const f of [0.1, 0.5, 0.85]) {
        const bx0 = p0[0] + dx * f;
        const by0 = p0[1] + dy * f;
        const bz0 = p0[2] + (p1[2] - p0[2]) * f;
        const size = 0.078 * (1 - 0.14 * i);
        for (const side of [1, -1]) {
          const nx = -ty * side;
          const ny = tx * side;
          barbs.push(
            sdf.cone(
              [bx0, by0, bz0],
              [bx0 + (nx * 0.75 + tx * 0.7) * size, by0 + (ny * 0.75 + ty * 0.7) * size, bz0 - 0.012],
              0.018,
              0.007,
            ),
          );
        }
      }
    }
    const plume = sdf.smoothUnion(0.012, sdf.chain(quill, 0.01), ...barbs);
    const quillOnly = sdf.chain(quill.slice(0, 4), 0.006).round(0.003);
    const feather = capPose(plume.paintWhere(quillOnly, '#d5c9a8', 0.004)).bone('head');
    k.body('feather', feather, { color: C.paper, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ messy hair: chain locks under the cap
    const hairColor = k.tint('hair');
    const hp = (s: sdf.Shape) => capPose(s);
    const hairCap = hp(
      sdf
        .ellipsoid([0.212, 0.206, 0.196])
        .smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], 0.07))
        .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], 0.01)),
    );
    const lock = (pts: number[][], r = 0.02) =>
      hp(sdf.chain(pts.map((p) => [p[0]!, p[1]!, p[2]!, p[3]!]) as [number, number, number, number][], r));
    const temples = pair(
      lock([
        [0.188, 0.09, 0.07, 0.03],
        [0.194, 0.03, 0.06, 0.028],
        [0.192, -0.025, 0.04, 0.024],
        [0.188, -0.065, 0.02, 0.016],
      ]),
    );
    // Bangs: soft wavy locks with rounded ends. They start inside the beret (the cut below removes
    // that part), so only the part under the rim hangs over the forehead, above the brows.
    const rimY = (z: number) => 0.35 * z + 0.075;
    const fringe = (deg: number, len: number, flick: number, radius: number) => {
      const a = (deg * Math.PI) / 180;
      const pt = (dd: number, drop: number, rr: number, grow = 1): number[] => {
        const b = ((deg + dd) * Math.PI) / 180;
        return [0.197 * grow * Math.sin(b), rimY(0.182 * Math.cos(a)) - drop, 0.18 * grow * Math.cos(b), rr];
      };
      return lock([pt(0, 0.0, radius * 0.9, 0.96), pt(flick * 0.6, len * 0.35, radius, 0.99), pt(-flick * 0.3, len * 0.7, radius * 0.95, 1.01), pt(flick * 0.7, len, radius * 0.85, 1.02)], 0.02);
    };
    const bangs = [
      fringe(-66, 0.06, 8, 0.024),
      fringe(-40, 0.05, -9, 0.024),
      fringe(-14, 0.055, 9, 0.024),
      fringe(12, 0.045, -9, 0.024),
      fringe(38, 0.058, 9, 0.024),
      fringe(62, 0.05, -8, 0.024),
    ];
    // The nape: a ragged row of short locks at the back.
    const nape = [-0.13, -0.065, 0, 0.065, 0.13].map((x, i) =>
      lock([[x, 0.02, -0.15, 0.034], [x * 1.02, -0.04, -0.158, 0.03], [x * 1.04, -0.082 - (i % 2) * 0.016, -0.152, 0.02]], 0.02),
    );
    k.body('hair', sdf
        .smoothUnion(0.02, hairCap, temples, sdf.smoothUnion(0.012, ...bangs).intersect(hp(sdf.halfSpace([0, 0.944, -0.33], 0.06))), ...nape)
        .subtract(capSolid.round(0.004)).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ cream shirt with long sleeves
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.05, 0.045).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.9), 0.045, 0.043).bone('forearm.L'),
      ),
    );
    k.body('shirt', sdf.smoothUnion(0.012, h.weighted(h.torso.intersect(sdf.halfSpace([0, -1, 0], -0.2))), sleeves), { color: C.cream, roughness: 0.85 });

    // The brown leather cuffs.
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.68), lerp(j.ELBOW, j.WRIST, 0.98), 0.048, 0.049).round(0.003).bone('forearm.L'));

    // ------------------------------------------------------------------ crossed leather straps and the belt
    const strapShell = h.torso.round(0.016);
    const chestBox = sdf.box([0.6, 0.27, 0.6]).at(0, 0.325, 0);
    const diagonal = strapShell.intersect(sdf.box([0.04, 0.7, 0.6], 0.006).rotateZ(35).at(0.017, 0.325, 0)).intersect(chestBox);
    const diagonal2 = strapShell.intersect(sdf.box([0.034, 0.7, 0.6], 0.006).rotateZ(-35).at(-0.017, 0.325, 0)).intersect(chestBox);
    const belt = strapShell.intersect(sdf.box([0.6, 0.032, 0.6]).at(0, 0.215, 0));
    k.body('straps', sdf.union(h.weighted(sdf.union(diagonal, diagonal2)), belt.bone('spine'), cuffs), {
      color: C.strap,
      roughness: 0.65,
      detail: 0.004,
    });

    // The brass ring where the straps cross and the belt buckle.
    const torsoZ = (x: number, y: number) => sdf.raycast(strapShell, [x, y, 1], [0, 0, -1])![2];
    const buckle = sdf
      .box([0.05, 0.05, 0.014], 0.006)
      .subtract(sdf.box([0.028, 0.028, 0.05], 0.004))
      .rotateZ(45)
      .at(0, 0.349, torsoZ(0, 0.349) + 0.002)
      .bone('chest');
    const beltBuckle = sdf
      .box([0.046, 0.034, 0.014], 0.005)
      .subtract(sdf.box([0.026, 0.018, 0.05], 0.004))
      .at(0, 0.215, torsoZ(0, 0.215) + 0.002)
      .bone('spine');
    k.body('brass', sdf.union(buckle, beltBuckle), { color: C.brass, roughness: 0.4, metalness: 0.7, detail: 0.004 });

    const satchelPose = (s: sdf.Shape) => s.rotateY(-18).at(-0.12, 0.29, -0.16);
    const bagCut = satchelPose(sdf.box([0.27, 0.3, 0.17], 0.05).at(0, 0.02, 0)).round(0.01);
    // ------------------------------------------------------------------ the short red cape and the scarf
    const T = { dark: k.tint('cloth', -0.2) };
    const folds = (x: number, y: number, z: number) => Math.sin(Math.atan2(z, x) * 6) * Math.min(1, Math.max(0, (0.38 - y) / 0.26));
    const capeCone = (r0: number, r1: number, y0: number, y1: number) =>
      sdf
        .revolve(
          profile.polygon([
            [0, y0],
            [r0, y0],
            [r1, y1],
            [0, y1],
          ]),
        )
        .scale([1, 1, 0.85])
        .displace(0.012, folds);
    const capeInner = capeCone(0.128, 0.265, 0.47, 0.18).at(0, 0, -0.03);
    const capeShell = capeCone(0.15, 0.285, 0.46, 0.18)
      .at(0, 0, -0.03)
      .subtract(capeInner)
      .intersect(sdf.halfSpace([0, 0, 1], 0.02));
    k.body('cape', capeShell.subtract(bagCut).paintWhere(capeInner.round(0.006), T.dark, 0.008).bone('cloak'), { color: capeColor, roughness: 0.85 });
    const scarf = sdf
      .smoothUnion(0.02, sdf.torus(0.07, 0.03).scale([1, 1, 0.95]).at(0, 0.445, -0.005), sdf.ellipsoid([0.05, 0.035, 0.03]).rotateZ(-20).at(0.03, 0.425, 0.065))
      .bone('chest');
    k.body('scarf', scarf, { color: capeColor, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ brown shorts with a bare knee above the boot
    const shortLeg = sdf.capsule(HIP, lerp(HIP, KNEE, 0.72), 0.057).bone('leg.L').intersect(sdf.halfSpace([0, -1, 0], -0.155));
    const shortTop = h.torso.round(0.014).intersect(sdf.box([0.6, 0.09, 0.6]).at(0, 0.2, 0)).bone('hips');
    k.body('shorts', sdf.smoothUnion(0.03, shortTop, pair(shortLeg)), { color: C.shorts, roughness: 0.85 });

    // ------------------------------------------------------------------ tall boots with a folded cuff
    const shaft = sdf.cone([ANKLE[0], 0.1, 0.002], [ANKLE[0], 0.05, 0.002], 0.05, 0.048).bone('shin.L');
    const cuffFold = sdf.torus(0.052, 0.014).at(ANKLE[0], 0.094, 0.002).bone('shin.L');
    const foot = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.056, 0.042, 0.1]).at(0, 0.04, 0.04), sdf.sphere(0.05).at(0, 0.05, -0.005))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    const boot = sdf
      .smoothUnion(0.02, shaft, foot, cuffFold)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintWhere(h.band(-0.2, 0.014), C.sole, 0.002);
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the brown backpack with a bundle of letters
    const bag = sdf.box([0.25, 0.28, 0.14], 0.05);
    const flap = sdf.box([0.256, 0.12, 0.15], 0.04).at(0, 0.1, 0);
    const bagFull = sdf
      .smoothUnion(0.012, bag, flap)
      .paintWhere(sdf.box([0.4, 0.02, 0.4]).at(0, 0.02, 0), C.strap, 0.004)
      .paintWhere(sdf.box([0.03, 0.4, 0.4]).at(0, 0.1, 0), C.strap, 0.004);
    k.body('satchel', satchelPose(bagFull).bone('chest'), { color: C.satchel, roughness: 0.7, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(x * 70 + y * 50 + z * 30) });
    // A tied stack of letters on the top flap.
    const stack = sdf
      .union(
        ...[0, 1, 2, 3].map((i) =>
          sdf
            .box([0.1, 0.017, 0.07], 0.004)
            .rotateY([-12, 8, -4, 14][i]!)
            .rotateZ([3, -2, 1, -3][i]!)
            .at([-0.006, 0.006, -0.004, 0.004][i]!, 0.178 + i * 0.016, [0.004, -0.004, 0.006, 0][i]!),
        ),
      )
      .paintWhere(sdf.box([0.016, 1, 1]).at(0.01, 0.2, 0), C.strap, 0.002);
    k.body('mail', satchelPose(stack).bone('chest'), { color: C.paper, roughness: 0.85, detail: 0.004 });

    // The small pouch on the left hip.
    const pouch = sdf
      .smoothUnion(0.01, sdf.box([0.07, 0.085, 0.05], 0.02), sdf.box([0.074, 0.035, 0.054], 0.015).at(0, 0.03, 0))
      .rotateZ(-6)
      .at(0.165, 0.2, -0.015)
      .bone('hips');
    k.body('pouch', pouch, { color: C.satchel, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ two sealed envelopes in the left hand
    const GL = h.arms.L.GRIP;
    const inHand = (s: sdf.Shape) => s.rotateX(-22).rotateY(8).at(GL[0] + 0.05, GL[1] + 0.045, GL[2] + 0.02);
    const W = 0.125;
    const H2 = 0.088;
    const back = sdf.box([W, H2, 0.016], 0.004).at(0, H2 / 2 - 0.02, 0).rotateZ(24).at(0.012, -0.012, -0.014);
    const flapOuter = profile.polygon([[-W / 2 + 0.004, H2 / 2 - 0.002], [W / 2 - 0.004, H2 / 2 - 0.002], [0, -0.004]]);
    const flapInner = profile.polygon([[-W / 2 + 0.014, H2 / 2 - 0.008], [W / 2 - 0.014, H2 / 2 - 0.008], [0, 0.006]]);
    const flapLine = sdf
      .extrude(flapOuter, 0.3)
      .subtract(sdf.extrude(flapInner, 0.3))
      .intersect(sdf.box([1, 1, 0.2]).at(0, 0, 0.1));
    const front = sdf.box([W, H2, 0.016], 0.004).at(0, 0, 0.004).rotateZ(-4).paintWhere(flapLine.rotateZ(-4), '#b9a981', 0.0015);
    k.body('letter', inHand(front).bone('knife.L'), { color: C.paper, roughness: 0.85, detail: 0.003 });
    k.body('letter2', inHand(back).bone('knife.L'), { color: '#eadcb4', roughness: 0.85, detail: 0.003 });
    const sealShape = sdf.union(sdf.cylinder(0.018, 0.01, 0.003).rotateX(90), sdf.sphere(0.009).at(0.012, -0.008, 0)).at(-0.03, -0.012, 0.016);
    k.body('seal', inHand(sealShape).bone('knife.L'), { color: C.seal, roughness: 0.4, detail: 0.003 });
  },
});
