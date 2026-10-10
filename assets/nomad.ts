import { profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';
import type { ArmJoints } from './parts/humanoid-kind.js';

/**
 * Nomad — Chibi Quest wilderness NPC (catalog `npcs/wilderness/nomad`), about 1.0 m to the top of
 * the staff crook, faces +Z. Target: docs/npc-mockups/nomad_001.jpg. Built on the humanoid kind.
 *
 * Role: a desert NPC (news, spices, travel quests) seen at oases and camps, in 3D and as a 128 px
 *   sprite; the staff with the bell, the goggles, the curly dark hair, and the smile must read.
 * One idea: a cheerful desert wanderer whose brass goggles, thick curls, and tall bell staff stand
 *   out of a warm rust-orange and cream body, with a bedroll on the back.
 * Shape language: round and soft (curls, scarf roll, coat), with the thin staff as the one long form.
 * Palette (60/30/10): rust coat #b0603a, cream #f0e6cc / #ece0c8 / #d8c8a0 (sash, trousers, scarf);
 *   dark curls #231a17; brass #c8a040 with light blue lenses #6a9ab0; boots #7a4a2c; bedroll #8a3a3a.
 * Value plan: the dark hair frames the face, the brass goggles are the accent, the orange coat is the
 *   mass, and the cream scarf and trousers lift the neck and legs.
 * Bodies: skin, hair, goggles, lenses, scarf, shirt, coat, sash, brass, cream, pants, boots, bedroll,
 *   staff, bell.
 * Rig: the humanoid kind's skeleton and clips. The staff is rigid on `knife.R` (the right fist),
 *   upright and tilted out a little from the head; the bedroll is rigid on `chest`.
 */

const C = {
  hair: '#231a17',
  scarf: '#d8c8a0',
  sash: '#f0e6cc',
  pants: '#ece0c8',
  brass: '#c8a040',
  lens: '#6a9ab0',
  boot: '#7a4a2c',
  bootTop: '#946036',
  roll: '#c8a870',
  rollEdge: '#7a5636',
  strap: '#7a4a2c',
  staff: '#8a6a3a',
  mouth: '#7a3028',
  belt: '#5a3a26',
};

// The staff line: it passes through the right fist (the grip), its foot is just above the ground,
// and it leans out (x < 0) so it clears the head.
const LEAN = 0.19;

export default humanoidAsset({
  name: 'nomad',
  description: 'A cheerful young desert wanderer with brass goggles, a cream scarf, and a rust coat, carrying a bedroll and a staff with a bell.',
  reference: 'docs/npc-mockups/nomad_001.jpg',
  variants: {
    skin: { brown: '#8a5a3e', deep: '#5e3b28', tan: '#d49a72', light: '#e8b48e', fair: '#f2c7a4' },
    hair: { black: '#231a17', brown: '#5a301d', auburn: '#8e3b1c', silver: '#b8b4c4', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { rust: '#b0603a', saffron: '#c88a2e', indigo: '#44577a', madder: '#8e3a3a' },
  },
  presets: {
    wanderer: { skin: 'tan', hair: 'brown', eyes: 'hazel', cloth: 'indigo' },
  },
  // Both arms keep one pose (the left hand rests by the bedroll). The staff arm keeps one pose in every clip (the elbow bent, the fist forward at the side), so the
  // staff never swings into the head. Written for the left side; it is mirrored to the right arm.
  pose: {
    R: { elbow: [0.19, 0.325, 0.02] as const, wrist: [0.225, 0.345, 0.115] as const },
    L: { elbow: [0.19, 0.32, 0.02] as const, wrist: [0.225, 0.285, 0.085] as const },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,

  // A closed soft smile and thick arched brows.
  paintSkin(skin, h) {
    const y = 0.538;
    const smile = sdf.extrude(profile.arc(0.05, 0.009, 235, 305), 0.3).at(0, 0.05, 0);
    const mouth = h.onFace(smile, 0, y);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.075, 0.016, 56, 124), 0.3).at(0.1, 0.656, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const GR = h.arms.R.GRIP;
    const STAFF_Z = GR[2];
    const staffX = (y: number) => -GR[0] - LEAN * (y - GR[1]);
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const rad = Math.PI / 180;
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);

    // ------------------------------------------------------------------ hair: a skull cap and curly locks
    const hairColor = k.tint('hair');
    const A = 0.213;
    const B = 0.207;
    const Cz = 0.196;
    const shell = sdf.ellipsoid([A, B, Cz]);
    const top = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.1));
    const back = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.03));
    const sides = shell
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.0))
      .smoothIntersect(0.02, sdf.halfSpace([-1, 0, 0], -0.14).mirror('x'))
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.09));
    const cap = sdf.smoothUnion(0.015, top, back, sides);

    // A lock follows the skull from elevation `e0` to `e1` (degrees) at azimuth `az` (0 = front,
    // 90 = the character's left), curling as it falls and flaring out toward the tip.
    const lock = (az: number, e0: number, e1: number, r0: number, r1: number, wig: number, out: number, flare: number) => {
      const pts: [number, number, number, number][] = [];
      for (let i = 0; i <= 9; i++) {
        const t = i / 9;
        const el = (e0 + (e1 - e0) * t) * rad;
        const ph = t * 12 + az * 0.37;
        const a = (az + (wig * 1.6 + 4) * Math.sin(ph)) * rad;
        const o = out + flare * t + 0.014 * Math.sin(ph + 1.6) * t;
        const r = (r0 + (r1 - r0) * t) * (1 + 0.22 * Math.sin(ph * 1.5 + 0.7));
        pts.push([(A + o) * Math.cos(el) * Math.sin(a), (B + o) * Math.sin(el), (Cz + o) * Math.cos(el) * Math.cos(a), r]);
      }
      return sdf.chain(pts, 0.008);
    };
    const locks = sdf.smoothUnion(
      0.012,
      // the fringe over the forehead, swept and curled
      lock(-52, 72, 40, 0.024, 0.016, 8, 0.01, 0.004),
      lock(-32, 76, 36, 0.025, 0.016, 7, 0.012, 0.006),
      lock(-12, 78, 38, 0.025, 0.015, 9, 0.012, 0.006),
      lock(10, 78, 34, 0.025, 0.016, 8, 0.012, 0.008),
      lock(30, 76, 38, 0.025, 0.016, 7, 0.012, 0.006),
      lock(52, 72, 40, 0.024, 0.016, 8, 0.01, 0.004),
      // the long locks beside the face and behind the ears
      lock(-76, 52, -34, 0.026, 0.016, 7, 0.01, 0.04),
      lock(76, 52, -34, 0.026, 0.016, -7, 0.01, 0.04),
      lock(-62, 56, 4, 0.024, 0.016, 6, 0.012, 0.028),
      lock(62, 56, 4, 0.024, 0.016, -6, 0.012, 0.028),
      lock(-118, 54, -36, 0.026, 0.017, 8, 0.01, 0.02),
      lock(118, 54, -36, 0.026, 0.017, -8, 0.01, 0.02),
      // the back of the head, down to the nape
      lock(-146, 56, -44, 0.026, 0.017, 7, 0.01, 0.014),
      lock(146, 56, -44, 0.026, 0.017, -7, 0.01, 0.014),
      lock(-172, 58, -46, 0.027, 0.017, 7, 0.01, 0.012),
      lock(172, 58, -46, 0.027, 0.017, -7, 0.01, 0.012),
      lock(0, 40, -40, 0.028, 0.018, 0, 0.01, 0.014).rotateY(180),
    );
    // A small loop of hair on the crown, as in the mockup.
    const loop = sdf.torus(0.026, 0.012).rotateX(90).at(-0.025, 0.205, -0.01);
    k.body('hair', headPose(sdf.smoothUnion(0.012, cap, locks, loop)).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ brass goggles on the forehead
    const goggleAt = (s: sdf.Shape) => s.rotateX(-48).at(0, 0.19, 0.14).rotateX(0);
    const rim = pair(sdf.torus(0.05, 0.012).rotateX(90).at(0.076, 0, 0));
    const bridge = sdf.capsule([-0.03, 0, 0], [0.03, 0, 0], 0.009).at(0, 0, 0.0);
    const lensDisc = pair(sdf.cylinder(0.051, 0.014, 0.004).rotateX(90).at(0.076, 0, -0.004));
    const goggles = goggleAt(sdf.smoothUnion(0.008, rim.mirror('x', 0), bridge));
    // The strap runs around the head in a plane that slopes back and down from the lenses.
    k.body('goggles', headPose(goggles).bone('head'), { color: C.brass, roughness: 0.35, metalness: 0.8, detail: 0.004 });
    k.body('lenses', headPose(goggleAt(lensDisc)).bone('head'), { color: C.lens, roughness: 0.12, metalness: 0.1, detail: 0.004 });

    // ------------------------------------------------------------------ scarf: a wide soft roll at the neck
    const roll1 = sdf.torus(0.092, 0.04).scale([1, 1, 0.9]).at(0, 0.436, -0.012);
    const roll2 = sdf.torus(0.108, 0.032).scale([1, 1, 0.9]).rotateX(-8).at(0, 0.412, -0.005);
    const tail = sdf.ellipsoid([0.04, 0.05, 0.022]).rotateZ(-14).at(0.07, 0.385, 0.088);
    const scarf = sdf.smoothUnion(0.022, roll1, roll2, tail);
    k.body('scarf', scarf.bone('chest'), {
      color: C.scarf,
      roughness: 0.92,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 70 + y * 20) * Math.cos(z * 60 + y * 40),
    });

    // ------------------------------------------------------------------ cream shirt under the coat, V at the chest
    k.body('shirt', h.weighted(h.torso.round(0.004)), { color: C.sash, roughness: 0.9 });

    // ------------------------------------------------------------------ coat: long, rust, to the knees
    const HEM = 0.115;
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.138, 0.3],
            [0.15, 0.255],
            [0.158, 0.225],
            [0.166, 0.2],
            [0, 0.2],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    // The long skirts follow each leg and flare toward the hem, so the legs never pass through them.
    const flap = pair(
      sdf
        .cone([HIP[0], 0.26, 0], [KNEE[0] + 0.012, 0.1, 0], 0.092, 0.115)
        .scale([1, 1, 0.9])
        .intersect(sdf.halfSpace([0, -1, 0], -HEM))
        .bone('leg.L'),
    );
    const trunk = h.torso.round(0.013).intersect(sdf.halfSpace([0, 1, 0], 0.5));
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.052, 0.5],
          [0.052, 0.5],
          [0.0, 0.272],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const coatBase = sdf.smoothUnion(0.02, trunk, skirt).subtract(opening);
    const upper = (j: ArmJoints) => sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.05, 0.047).bone('upperarm.L');
    const fore = (j: ArmJoints) => sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.78), 0.047, 0.044).bone('forearm.L');
    const sleeve = h.perArm((j) => sdf.smoothUnion(0.015, upper(j), fore(j)));
    const hemTint = k.tint('cloth', { color: '#8a4a2c', follow: 1 });
    const coat = sdf
      .smoothUnion(0.012, sdf.smoothUnion(0.025, h.weighted(coatBase), flap), sleeve)
      .paintWhere(h.band(0.1, HEM + 0.03), hemTint, 0.004);
    k.body('coat', coat, { color: h.tint.shirt ?? '#b0603a', roughness: 0.9, detail: 0.005 });

    // The scarf ends: two flat tails that hang down the chest from the knot, one longer than the other.
    const chestZ = (x: number, y: number) => sdf.raycast(coatBase, [x, y, 1], [0, 0, -1])?.[2] ?? 0.12;
    const endA = sdf.box([0.052, 0.17, 0.02], 0.009).rotateZ(5).at(0.052, 0.335, chestZ(0.052, 0.33) + 0.01);
    const endB = sdf.box([0.05, 0.12, 0.02], 0.009).rotateZ(-7).at(0.1, 0.35, chestZ(0.09, 0.35) + 0.002);
    k.body('scarf-ends', sdf.smoothUnion(0.008, endA, endB).bone('chest'), {
      color: C.scarf,
      roughness: 0.92,
      detail: 0.004,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 70 + y * 20) * Math.cos(z * 60 + y * 40),
    });

    // The brown leather belt with a brass buckle, in front on the viewer's left.
    const beltBand = coatBase.round(0.008).intersect(h.band(0.238, 0.272));
    k.body('belt', h.weighted(beltBand), { color: C.belt, roughness: 0.75, detail: 0.004 });
    const buckleZ = chestZ(-0.07, 0.255);
    const buckle = sdf.box([0.04, 0.04, 0.014], 0.006).subtract(sdf.box([0.024, 0.024, 0.04])).at(-0.07, 0.255, buckleZ + 0.008);
    const tongueBar = sdf.box([0.006, 0.026, 0.01], 0.002).at(-0.07, 0.255, buckleZ + 0.01);

    // Brass buttons down the coat front, placed on its surface.
    const buttonAt = (x: number, y: number) => {
      const z = sdf.raycast(coatBase, [x, y, 1], [0, 0, -1])?.[2] ?? 0.12;
      return sdf.sphere(0.012).at(x, y, z + 0.003);
    };
    const buttons = sdf.union(buttonAt(0.052, 0.375), buttonAt(0.056, 0.332), buttonAt(0.03, 0.205), buttonAt(0.032, 0.17), buckle, tongueBar);
    k.body('brass', h.weighted(buttons), { color: C.brass, roughness: 0.35, metalness: 0.8, detail: 0.004 });

    // Rolled cream cuffs.
    const cuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.68), lerp(j.ELBOW, j.WRIST, 1.0), 0.052, 0.053).round(0.003).bone('forearm.L'));
    k.body('cream', cuff, { color: C.sash, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ loose cream trousers
    const trouserLeg = sdf.smoothUnion(
      0.015,
      sdf.capsule(HIP, KNEE, 0.056).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.098, 0.002], 0.058, 0.057).bone('shin.L'),
    );
    k.body('pants', sdf.smoothUnion(0.03, sdf.ellipsoid([0.122, 0.054, 0.09]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.9,
      detail: 0.005,
    });

    // ------------------------------------------------------------------ soft brown boots
    const bootFoot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.05, 0.1, 0.02).at(0, 0.075, 0),
        sdf.ellipsoid([0.057, 0.046, 0.1]).at(0, 0.044, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootFold = sdf.cylinder(0.052, 0.03, 0.01).at(0, 0.113, 0);
    const boot = sdf
      .union(bootFoot, bootFold.paint(C.bootTop))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.014), '#4a2c1c')
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.65, detail: 0.005 });

    // ------------------------------------------------------------------ round bedroll at the left hip
    const rollLen = 0.075;
    const rollR = 0.095;
    const rollLocal = sdf.cylinder(rollR, rollLen, 0.025).paintFn((x, y, z, base) => {
      return Math.hypot(x, z) > rollR - 0.014 ? rgb(C.rollEdge) : base;
    });
    const rollAt = (s: sdf.Shape) => s.rotateX(90).at(0.232, 0.29, -0.08);
    const bedroll = rollAt(rollLocal);
    const straps = sdf.union(...[-0.022, 0.022].map((y) => rollAt(sdf.torus(rollR + 0.002, 0.008).at(0, y, 0))));
    k.body('bedroll', bedroll, { color: C.roll, roughness: 0.9, bone: 'hips', detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(Math.atan2(z, x) * 14 + y * 90) });
    k.body('bedroll-straps', straps, { color: C.strap, roughness: 0.8, bone: 'hips', detail: 0.004 });

    // ------------------------------------------------------------------ the walking staff and the bell
    const FOOT = 0.065;
    const TOP = 0.985;
    const p = (y: number): [number, number, number] => [staffX(y), y, STAFF_Z];
    const shaft = sdf.smoothUnion(0.01, sdf.capsule(p(FOOT + 0.01), p(TOP), 0.016), sdf.capsule(p(0.14), p(0.27), 0.019));
    const hx = staffX(TOP);
    const crook = sdf.chain(
      [
        [hx, TOP - 0.01, STAFF_Z, 0.016],
        [hx - 0.006, TOP + 0.04, STAFF_Z, 0.0165],
        [hx - 0.03, TOP + 0.078, STAFF_Z, 0.016],
        [hx - 0.068, TOP + 0.076, STAFF_Z, 0.0155],
        [hx - 0.093, TOP + 0.045, STAFF_Z, 0.015],
      ],
      0.01,
    );
    const ringAt = (y: number) => sdf.cylinder(0.022, 0.016, 0.005).rotateZ(-8).at(staffX(y), y, STAFF_Z);
    const ferrule = sdf.cone(p(FOOT), p(FOOT + 0.05), 0.017, 0.02);
    const staffWood = sdf.smoothUnion(0.012, shaft, crook).paintFn((x, y, z, base) => (Math.sin(y * 70 + x * 20) > 0.93 ? rgb('#6e5028') : base));
    k.body('staff', staffWood, { color: C.staff, roughness: 0.7, bone: 'knife.R', detail: 0.004, bump: (x, y, z) => 0.0012 * Math.sin(y * 120 + Math.sin(x * 60)) });
    k.body('staff-brass', sdf.union(ringAt(0.285), ringAt(TOP - 0.03), ferrule), { color: C.brass, roughness: 0.35, metalness: 0.8, bone: 'knife.R', detail: 0.004 });

    // The bell hangs on a short brass link from the crook's tip.
    const tipX = hx - 0.093;
    const tipY = TOP + 0.045;
    const link = sdf.capsule([tipX, tipY - 0.01, STAFF_Z], [tipX, tipY - 0.05, STAFF_Z], 0.006);
    const bellProfile = profile.polygon(
      [
        [0, 0.032],
        [0.012, 0.03],
        [0.021, 0.018],
        [0.026, 0.0],
        [0.034, -0.012],
        [0.034, -0.02],
        [0.0, -0.02],
      ],
      { smooth: true, samples: 6 },
    );
    const bell = sdf.revolve(bellProfile).at(tipX, tipY - 0.095, STAFF_Z);
    const clapper = sdf.sphere(0.01).at(tipX, tipY - 0.12, STAFF_Z);
    k.body('bell', sdf.smoothUnion(0.008, link, bell, clapper), { color: C.brass, roughness: 0.3, metalness: 0.85, bone: 'knife.R', detail: 0.003 });
  },
});
