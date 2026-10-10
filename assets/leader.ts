import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Leader — Chibi Quest court-and-faction NPC (catalog `npcs/court-and-faction/leader`), about 1.0 m
 * to the top of the hair, faces +Z. Target: docs/npc-mockups/leader_001.jpg. Built on the humanoid kind.
 *
 * Role: the leader of a free town who rallies the people and gives town-defense quests; seen in the
 *   town square in 3D and as a 128 px sprite. The banner pole, the sash, and the bright grin must read.
 * One idea: a cheering young leader with spiky silver-streaked hair, a gold-and-green sash across a
 *   dark red jacket, and a tall green banner held up in one fist.
 * Shape language: round and soft in the body, with the pole and the swallow-tail banner as the tall hard forms.
 * Palette (60/30/10): jacket #8a2a2a, trousers #3a3c44, boots and belt #5a3a24; sash gold #e0b040 and
 *   green #3f6a44; hair #231a17 with #a8a4a0 streaks; banner green #3f6a44 with a gold tree.
 * Value plan: the light streaked hair and the green banner are the focal points; the dark jacket
 *   and trousers frame the gold sash and buttons.
 * Bodies: skin (grin), hair, streaks, jacket, trim, belt, sash, gold, trousers (kind), boots, pole, banner, finial.
 * Rig: the humanoid kind's skeleton and clips. The left fist stays raised in a cheer and the right
 *   forearm stays forward around the pole in every clip; the pole and the banner are rigid on `knife.R`.
 */

const C = {
  jacket: '#8a2a2a',
  trim: '#3a2a2a',
  gold: '#e0b040',
  green: '#3f6a44',
  belt: '#5a3a24',
  boot: '#5a3a24',
  sole: '#33200f',
  pants: '#3a3c44',
  pole: '#8a6a3a',
  streak: '#a8a4a0',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

// The raised left fist (the kind mirrors nothing: each side has its own pose).
const POSE_L = { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] } as const;
// The right forearm points forward, so the fist closes around an upright pole (left-side coordinates).
const POSE_R = { elbow: [0.175, 0.325, 0.03], wrist: [0.19, 0.33, 0.13] } as const;

const HEAD_Y = 0.675;
const SASH_ANGLE = -49.8; // degrees: from the right shoulder down to the left hip

export default humanoidAsset({
  name: 'leader',
  description: 'A confident young town leader in a dark red jacket and a gold and green sash, cheering and holding up a tall green banner.',
  reference: 'docs/npc-mockups/leader_001.jpg',
  variants: {
    skin: { tan: '#d49a72', fair: '#f2c7a4', light: '#e8b48e', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { crimson: '#8a2a2a', wine: '#6a2a3a', rust: '#9a4a2a', plum: '#5a2f4a' },
  },
  presets: {
    default: { skin: 'tan', hair: 'black', eyes: 'brown', cloth: 'crimson' },
    festival: { skin: 'light', hair: 'brown', eyes: 'hazel', cloth: 'plum' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: false,
  lashes: false,
  pose: { L: POSE_L, R: POSE_R },

  // A bright open grin: round corners, one tooth band in the middle, and arched brows.
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
    const brows = sdf.extrude(profile.arc(0.075, 0.015, 55, 125), 0.3).at(0.1, 0.65, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const rad = Math.PI / 180;
    const jacketColor = h.tint.shirt ?? C.jacket;

    // ------------------------------------------------------------------ hair: a small cap and many swept locks
    // Each lock starts on the skull at (az from +Z toward +X, el above the horizon) and sweeps by (sx, sy, sz).
    type Lock = readonly [az: number, el: number, sx: number, sy: number, sz: number, r: number, lift?: number];
    const skull = (az: number, el: number, s: number): [number, number, number] => [
      0.205 * s * Math.cos(el * rad) * Math.sin(az * rad),
      0.2 * s * Math.sin(el * rad),
      0.19 * s * Math.cos(el * rad) * Math.cos(az * rad),
    ];
    const lock = ([az, el, sx, sy, sz, r, lift = 0.25]: Lock) => {
      const a = skull(az, el, 0.95);
      const b = skull(az, el, 1.03 + 0.07 * lift);
      const c = skull(az, el, 1.06 + 0.14 * lift);
      return sdf.chain(
        [
          [a[0], a[1], a[2], r],
          [b[0] + sx * 0.45, b[1] + sy * 0.45, b[2] + sz * 0.45, r * 0.98],
          [c[0] + sx, c[1] + sy, c[2] + sz, r * 0.55],
        ],
        0.014,
      );
    };
    const darkLocks: Lock[] = [
      [-32, 50, -0.05, -0.04, 0.06, 0.036], // fringe
      [30, 48, 0.09, -0.04, 0.05, 0.038],
      [-62, 40, -0.015, -0.07, -0.01, 0.034], // temples
      [62, 38, 0.05, -0.07, -0.01, 0.036],
      [10, 70, 0.09, 0.0, -0.03, 0.04, 0.4], // crown
      [-80, 60, -0.015, 0.0, -0.04, 0.034, 0.1],
      [180, 50, 0.04, 0.05, -0.06, 0.04, 0.4], // back
      [-140, 52, -0.02, 0.0, -0.06, 0.035, 0.1],
      [112, 18, 0.03, -0.1, -0.02, 0.03, 0.1], // behind the ears
      [-112, 18, -0.03, -0.1, -0.02, 0.03, 0.1],
      [150, 0, 0.01, -0.08, -0.03, 0.032, 0.1], // nape
      [-150, 0, -0.01, -0.08, -0.03, 0.032, 0.1],
    ];
    const silverLocks: Lock[] = [
      [0, 56, 0.07, -0.045, 0.06, 0.038], // fringe
      [-50, 46, -0.03, -0.05, 0.04, 0.034],
      [52, 44, 0.08, -0.03, 0.03, 0.036],
      [-25, 74, -0.03, 0.02, -0.02, 0.038, 0.3], // crown spikes
      [0, 80, 0.0, 0.03, -0.05, 0.04, 0.35],
      [35, 72, 0.07, 0.02, -0.03, 0.038, 0.35],
      [80, 58, 0.08, 0.02, -0.03, 0.036, 0.3],
      [140, 54, 0.07, 0.03, -0.05, 0.037],
      [-175, 30, -0.05, 0.0, -0.06, 0.038],
      [180, -5, 0, -0.08, -0.02, 0.034, 0.1], // nape
    ];
    const hairline = sdf.halfSpace([0, -0.894, 0.447], -0.04);
    const cap = sdf.ellipsoid([0.214, 0.208, 0.198]).smoothIntersect(0.02, hairline);
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
    k.body('hair', headPose(sdf.smoothUnion(0.014, cap, ...darkLocks.map(lock))), { color: k.tint('hair'), roughness: 0.55, detail: 0.005 });
    k.body('streaks', headPose(sdf.smoothUnion(0.014, ...silverLocks.map(lock))), {
      color: k.tint('hair', { color: C.streak, follow: 1 }),
      roughness: 0.5,
      detail: 0.005,
    });

    // ------------------------------------------------------------------ jacket: a flared hem, long sleeves, buttons
    const peplum = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.27],
            [0.136, 0.27],
            [0.146, 0.22],
            [0.155, 0.185],
            [0.152, 0.172],
            [0, 0.172],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.016,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.05, 0.046).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.78), 0.046, 0.044).bone('forearm.L'),
      ),
    );
    const jacketBody = h.weighted(sdf.union(h.torso.round(0.011).intersect(sdf.halfSpace([0, -1, 0], -0.172)), peplum.round(0.004)));
    const jacket = sdf.smoothUnion(0.012, jacketBody, sleeve);
    const front = (x: number, y: number) => sdf.raycast(jacket, [x, y, 1], [0, 0, -1])?.[2] ?? 0.1;
    k.body('jacket', jacket, { color: jacketColor, roughness: 0.82, detail: 0.004 });

    // The dark high collar and the dark cuffs.
    const collar = sdf.torus(0.06, 0.02).scale([1, 1, 0.95]).at(0, 0.456, -0.012).bone('chest');
    const cuff = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.72), lerp(j.ELBOW, j.WRIST, 1.0), 0.049, 0.046).round(0.002).bone('forearm.L'));
    k.body('trim', sdf.union(collar, cuff), { color: C.trim, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ belt and sash
    const beltShape = h.weighted(h.torso.round(0.018).intersect(h.band(0.236, 0.266)));
    k.body('belt', beltShape, { color: C.belt, roughness: 0.6, detail: 0.004 });

    const mid: [number, number] = [0.01, 0.33];
    const slab = (w: number) => sdf.box([0.9, w, 1.0]).rotateZ(SASH_ANGLE).at(mid[0], mid[1], 0);
    const sashBase = h.weighted(h.torso.round(0.02).intersect(slab(0.05)).intersect(sdf.halfSpace([0, -1, 0], -0.19)));
    const sash = sashBase.paintWhere(slab(0.032), C.green, 0.002);
    k.body('sash', sash, { color: C.gold, roughness: 0.7, detail: 0.004 });

    // Gold: the belt buckle, two sash buckles, and the jacket buttons.
    const beltZ = sdf.raycast(beltShape, [0, 0.251, 1], [0, 0, -1])?.[2] ?? 0.12;
    const frame = (w: number, hgt: number) => sdf.box([w, hgt, 0.014], 0.005).subtract(sdf.box([w - 0.022, hgt - 0.022, 0.05]));
    const beltBuckle = frame(0.06, 0.042).at(0, 0.251, beltZ + 0.002).bone('spine');
    const sashPoint = (t: number): [number, number] => [-0.1 + 0.22 * t, 0.46 - 0.26 * t];
    const buckleAt = (t: number) => {
      const [x, y] = sashPoint(t);
      const z = sdf.raycast(sash, [x, y, 1], [0, 0, -1])?.[2] ?? 0.12;
      return frame(0.07, 0.04).rotateZ(SASH_ANGLE + 90).at(x, y, z + 0.0015).bone('chest');
    };
    const button = ([x, y]: [number, number]) => sdf.ellipsoid([0.012, 0.012, 0.007]).at(x, y, front(x, y) + 0.001).bone('chest');
    const buttons = sdf.union(...([[0.05, 0.43], [0.078, 0.385], [-0.07, 0.27]] as [number, number][]).map(button));
    k.body('gold', sdf.union(beltBuckle, buckleAt(0.36), buckleAt(0.9), buttons), { color: C.gold, roughness: 0.35, metalness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ tall boots (trousers come from the kind)
    const shaft = sdf.smoothUnion(
      0.01,
      sdf.cone([ANKLE[0], 0.07, 0.002], [ANKLE[0], 0.12, 0.002], 0.054, 0.055).bone('shin.L'),
      sdf.torus(0.056, 0.012).scale([1, 1, 1]).at(ANKLE[0], 0.124, 0.002).bone('shin.L'),
    );
    const bootFoot = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.044, 0.1]).at(0, 0.041, 0.04), sdf.sphere(0.052).at(0, 0.05, -0.005))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(8)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L')
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.014), C.sole, 0.003);
    k.body('boots', pair(sdf.smoothUnion(0.012, shaft, bootFoot)), { color: C.boot, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ the banner pole: upright in the right fist
    const g = h.arms.R.GRIP;
    const px = -g[0] + 0.027; // the fist closes around the pole (measured on the render)
    const pz = g[2] - 0.035;
    const footY = 0.046; // the lean of the rest and run clips lowers the foot by up to 2.6 cm
    const topY = footY + 1.0;
    const barY = topY - 0.04;
    const bar = sdf.capsule([px + 0.004, barY, pz], [px - 0.245, barY, pz], 0.012);
    const tilt = (sh: sdf.Shape) => sh.at(-px, -g[1], -pz).rotateZ(11).at(px, g[1], pz);
    const pole = tilt(sdf.smoothUnion(0.008, sdf.cylinder(0.016, 1.0, 0.004).at(px, footY + 0.5, pz), bar));
    k.body('pole', pole, {
      color: C.pole,
      roughness: 0.75,
      bone: 'knife.R',
      detail: 0.004,
      bump: (x, y, z) => 0.002 * Math.sin(y * 70 + (x + z) * 160),
    });

    // The crossbar and the swallow-tail banner hang toward the right side (x < 0), away from the head.
    const bw = 0.22;
    const bh = 0.3;
    const bcx = px - 0.012 - bw / 2;
    const bcy = barY - 0.008 - bh / 2;
    const flag = sdf.extrude(
      profile.polygon([
        [-bw / 2, bh / 2],
        [bw / 2, bh / 2],
        [bw / 2, -bh / 2],
        [0, -bh / 2 + 0.06],
        [-bw / 2, -bh / 2],
      ]),
      0.012,
      0.002,
    );
    const tree = sdf.union(
      sdf.extrude(profile.circle(0.034), 0.3).at(bcx - 0.03, bcy + 0.035, pz),
      sdf.extrude(profile.circle(0.034), 0.3).at(bcx + 0.03, bcy + 0.035, pz),
      sdf.extrude(profile.circle(0.04), 0.3).at(bcx, bcy + 0.07, pz),
      sdf.extrude(profile.rect([0.02, 0.085], 0.004), 0.3).at(bcx, bcy - 0.005, pz),
    );
    const edge = sdf.box([bw + 0.1, 0.02, 0.3]).at(bcx, bcy + bh / 2 - 0.01, pz);
    const banner = tilt(flag.at(bcx, bcy, pz).paintWhere(tree, C.gold, 0.002).paintWhere(edge, C.gold, 0.002));
    k.body('banner', banner, {
      color: C.green,
      roughness: 0.8,
      bone: 'knife.R',
      detail: 0.003,
    });

    // The gold finial on top and a gold ring under the crossbar.
    const finial = tilt(sdf.union(sdf.sphere(0.026).at(px, topY + 0.03, pz), sdf.cylinder(0.024, 0.014, 0.005).at(px, topY - 0.005, pz), sdf.cylinder(0.022, 0.014, 0.005).at(px, barY - 0.2, pz)));
    k.body('finial', finial, { color: C.gold, roughness: 0.35, metalness: 0.7, bone: 'knife.R', detail: 0.003 });
  },
});
