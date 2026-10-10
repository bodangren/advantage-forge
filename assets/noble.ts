import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Noble — Chibi Quest court NPC (catalog `npcs/court-and-faction/noble`), about 1.0 m to the top of
 * the feather, faces +Z. Target: docs/npc-mockups/noble_001.jpg. Built on the humanoid kind.
 *
 * Role: a vain but friendly town NPC from a rich family (fetch and fashion quests), seen in the manor
 *   district in 3D and as a 128 px sprite; the wide feathered hat, the frilly collar, and the cane read.
 * One idea: a dashing boy dandy whose huge teal hat, white feather, and frills outshine a small body.
 * Shape language: round and soft (curls, frills, face), with the long cane as the one hard line.
 * Palette (60/30/10): teal #2a6a6a (hat, coat); cream #f6f1ea (feather, frills), #ece0c8 (trousers);
 *   gold #e0b040 (trim, buckles, cane knob), waistcoat #c8982a; black #2a2428 (shoes, cane).
 * Value plan: the dark teal hat frames the light face; the white frills and gold waistcoat sit on
 *   the teal coat; the black cane and shoes ground the figure.
 * Bodies: skin, ears, nose, hair, hat, hatTrim, feather, coat, coatTrim, waistcoat, frills, trousers,
 *   boots, buckles, cane, caneGold.
 * Rig: the humanoid kind's skeleton and clips. The cane is rigid on `knife.R` (the right fist).
 */

const C = {
  hat: '#2a6a6a',
  gold: '#e0b040',
  vest: '#c8982a',
  vestDark: '#9a6f1a',
  cream: '#f6f1ea',
  pants: '#ece0c8',
  black: '#2a2428',
  mouth: '#8a2e2a',
};

export default humanoidAsset({
  name: 'noble',
  description: 'A dashing young noble in a big feathered teal hat, a teal coat with a frilly collar, and a gold waistcoat, leaning on a fancy cane.',
  reference: 'docs/npc-mockups/noble_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { chestnut: '#7a4a2c', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { teal: '#2a6a6a', wine: '#7a2f3f', plum: '#5e3f6e', ink: '#34506a' },
  },
  presets: {
    dandy: { skin: 'light', hair: 'black', eyes: 'hazel', cloth: 'wine' },
  },
  hair: false,
  undershirt: false,
  lashes: false,
  pants: false,
  shoes: C.black,

  // A playful confident smile (a closed smile with lifted corners) and thick arched brows.
  paintSkin(skin, h) {
    const brows = sdf.extrude(profile.arc(0.1, 0.032, 56, 124), 0.3).at(0.1, 0.618, 0.1).mirror('x');
    const smile = sdf.extrude(profile.arc(0.072, 0.012, 236, 304), 0.3).at(0, 0.608, 0.1);
    return skin.paintWhere(smile.round(0.003), h.tint.mouth!, 0.002).paintWhere(brows, h.tint.brow!, 0.002);
  },

  extra(k, h) {
    const { HEAD_Y, ANKLE, KNEE, HIP } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const above = (y: number) => sdf.halfSpace([0, -1, 0], -y); // solid where world y >= y
    const hairColor = k.tint('hair');
    const skinColor = k.tint('skin');
    const hatColor = k.tint('cloth', { color: C.hat, follow: 1 });

    // ------------------------------------------------------------------ hair: a small cap and many curled locks
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
    const shell = sdf.ellipsoid([0.212, 0.207, 0.197]);
    const top = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.085));
    const back = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.07)).smoothIntersect(0.04, sdf.halfSpace([0, 0, 1], -0.02));
    const temples = shell
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.02))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.1));
    const lock = (pts: number[][]) => sdf.chain(pts.map((p) => [p[0]!, p[1]!, p[2]!, p[3]!] as [number, number, number, number]), 0.012);
    const locks = [
      // the fringe: four curls swept from the parting (the viewer's left of center) over the brow
      lock([[-0.02, 0.18, 0.08, 0.04], [0.0, 0.13, 0.14, 0.036], [0.03, 0.105, 0.165, 0.03], [0.07, 0.115, 0.158, 0.026]]),
      lock([[0.05, 0.18, 0.08, 0.04], [0.08, 0.13, 0.135, 0.036], [0.115, 0.1, 0.14, 0.03], [0.14, 0.085, 0.12, 0.026]]),
      lock([[-0.05, 0.17, 0.09, 0.04], [-0.08, 0.125, 0.14, 0.035], [-0.11, 0.098, 0.145, 0.03], [-0.13, 0.088, 0.13, 0.025]]),
      lock([[-0.12, 0.16, 0.06, 0.04], [-0.16, 0.11, 0.1, 0.034], [-0.175, 0.07, 0.1, 0.03], [-0.17, 0.05, 0.12, 0.024]]),
      // the side locks, in front of and behind each ear
      ...[1, -1].flatMap((s) => [
        lock([[s * 0.19, 0.1, 0.03, 0.036], [s * 0.2, 0.05, 0.05, 0.034], [s * 0.2, 0.0, 0.06, 0.03], [s * 0.185, -0.015, 0.07, 0.028]]),
        lock([[s * 0.19, 0.08, -0.04, 0.036], [s * 0.2, 0.02, -0.07, 0.034], [s * 0.19, -0.035, -0.09, 0.034]]),
      ]),
      // the nape curls
      ...[-0.12, -0.04, 0.04, 0.12].map((x) =>
        lock([[x, 0.02, -0.17, 0.042], [x * 1.1, -0.03, -0.17, 0.04], [x * 1.1, -0.065, -0.16, 0.034]]),
      ),
    ];
    k.body('hair', headPose(sdf.smoothUnion(0.015, top, back, temples, ...locks)), { color: hairColor, roughness: 0.6, detail: 0.005 });

    // Larger ears and a rounder nose, as in the mockup.
    const ear = sdf.ellipsoid([0.032, 0.054, 0.04]).subtract(sdf.sphere(0.021).at(0.019, 0.0, 0.008)).rotateY(-12).at(0.208, 0.61, -0.008).bone('head');
    const noseZ = h.faceZ(0, 0.566);
    const nose = sdf.ellipsoid([0.027, 0.022, 0.022]).at(0, 0.566, noseZ - 0.002).bone('head');
    k.body('ears', sdf.union(pair(ear), nose), { color: skinColor, roughness: 0.55, detail: 0.005 });

    // ------------------------------------------------------------------ the hat: a wide dished brim, a crown, a feather
    // Built in head-local coordinates (the origin is the head center), tilted a little: the front lifts.
    const hatPose = (s: sdf.Shape) => s.rotateZ(7).rotateX(-6).at(0, HEAD_Y, 0).bone('head');
    const brim = sdf.revolve(
      profile.polygon(
        [
          [0.09, 0.15],
          [0.2, 0.146],
          [0.29, 0.152],
          [0.338, 0.18],
          [0.352, 0.222],
          [0.328, 0.226],
          [0.314, 0.19],
          [0.27, 0.13],
          [0.2, 0.122],
          [0.09, 0.126],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const crown = sdf.revolve(
      profile.polygon(
        [
          [0, 0.3],
          [0.12, 0.296],
          [0.188, 0.272],
          [0.212, 0.21],
          [0.218, 0.13],
          [0, 0.13],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const hat = sdf.smoothUnion(0.012, brim, crown);
    // A dark teal band around the crown, painted on the hat.
    const bandZone = sdf.cylinder(0.3, 0.03).at(0, 0.165, 0);
    const bandColor = k.tint('cloth', { color: '#1b4848', follow: 1 });
    k.body('hat', hatPose(hat.paintWhere(bandZone, bandColor, 0.003)), { color: hatColor, roughness: 0.85, detail: 0.006 });

    // The big white feather: curled fronds on the crown side (the viewer's right), sweeping up and out.
    const plume = (pts: number[][], k0: number) =>
      sdf.chain(pts.map((p) => [p[0]!, p[1]!, p[2]!, p[3]!] as [number, number, number, number]), k0);
    const feather = sdf
      .smoothUnion(
        0.03,
        plume([[0.14, 0.2, -0.02, 0.022], [0.19, 0.29, -0.03, 0.036], [0.235, 0.39, -0.05, 0.046], [0.25, 0.49, -0.08, 0.042], [0.22, 0.575, -0.12, 0.03], [0.16, 0.625, -0.16, 0.014]], 0.03),
        plume([[0.17, 0.22, -0.02, 0.02], [0.24, 0.3, -0.035, 0.032], [0.285, 0.39, -0.06, 0.036], [0.3, 0.47, -0.09, 0.028], [0.285, 0.52, -0.11, 0.012]], 0.03),
        plume([[0.12, 0.21, -0.03, 0.02], [0.15, 0.3, -0.05, 0.03], [0.18, 0.4, -0.08, 0.034], [0.175, 0.49, -0.12, 0.026], [0.14, 0.545, -0.15, 0.01]], 0.03),
      )
      .at(-0.14, -0.2, 0)
      .scale([0.85, 0.8, 0.55])
      .at(0.14, 0.2, 0);
    k.body('feather', hatPose(feather), { color: C.cream, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ coat: a long teal shell with an open front
    const outer = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.465],
            [0.085, 0.462],
            [0.122, 0.44],
            [0.145, 0.4],
            [0.15, 0.34],
            [0.146, 0.29],
            [0.16, 0.22],
            [0.18, 0.16],
            [0.188, 0.135],
            [0, 0.135],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.072, 0.5],
          [0.072, 0.5],
          [0.072, 0.36],
          [0.078, 0.2],
          [0.088, 0.12],
          [-0.088, 0.12],
          [-0.078, 0.2],
          [-0.072, 0.36],
        ]),
        0.3,
      )
      .at(0, 0, 0.15);
    const coatShell = outer.subtract(h.torso.round(0.006)).subtract(opening);
    const sleeves = h.perArm((j) => {
      const upper = sdf.cone([0.11, 0.405, 0], j.ELBOW, 0.049, 0.045).bone('upperarm.L');
      const fore = sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.86), 0.045, 0.042).bone('forearm.L');
      return sdf.smoothUnion(0.015, upper, fore);
    });
    const coatTeal = sdf.smoothUnion(0.012, h.weighted(coatShell), sleeves);
    k.body('coat', coatTeal, { color: h.tint.shirt!, roughness: 0.85, detail: 0.005 });

    // Plain teal stand collar and lapel wings.
    const collarRing = sdf
      .torus(0.074, 0.02)
      .scale([1, 1, 0.9])
      .at(0, 0.458, -0.012)
      .subtract(sdf.box([0.08, 0.12, 0.2]).at(0, 0.458, 0.12))
      .bone('chest');
    const wings = pair(sdf.ellipsoid([0.03, 0.044, 0.016]).rotateZ(-24).rotateX(-12).at(0.062, 0.462, 0.058)).bone('chest');
    k.body('collar', sdf.smoothUnion(0.008, collarRing, wings), { color: h.tint.shirt!, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ gold brocade waistcoat
    const diamonds = sdf.union(
      ...[0.4, 0.34, 0.28].flatMap((y) =>
        [-0.04, 0.0, 0.04].map((x, i) => sdf.box([0.022, 0.022, 0.4]).rotateZ(45).at(x + (y === 0.34 ? 0.0 : 0.0), y - (i === 1 ? 0.0 : 0.012), 0.15)),
      ),
    );
    const waist = h
      .weighted(h.torso.round(0.004))
      .intersect(above(0.2))
      .paintWhere(diamonds.intersect(sdf.halfSpace([0, 0, -1], -0.03)), C.vestDark, 0.003);
    k.body('waistcoat', waist, { color: C.vest, roughness: 0.55, metalness: 0.35, detail: 0.005, bump: (x, y, z) => 0.0015 * Math.sin(x * 140) * Math.sin(y * 140) + 0 * z });

    // ------------------------------------------------------------------ frills: ruff, jabot, and cuffs
    const ruff = sdf.torus(0.064, 0.018).at(0, 0.447, -0.008).bone('chest');
    const bits: sdf.Shape[] = [ruff];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      bits.push(sdf.sphere(0.017).at(0.08 * Math.sin(a), 0.446, -0.008 + 0.08 * Math.cos(a) * 0.9).bone('chest'));
    }
    const jabot: sdf.Shape[] = [];
    // Cascading ruffle rows: each row is a run of small puffs, narrower toward the waist.
    const rows: [number, number, number][] = [
      [0.425, 5, 0.04],
      [0.4, 4, 0.034],
      [0.374, 4, 0.028],
      [0.348, 3, 0.022],
    ];
    rows.forEach(([y, n, half], r) => {
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1) - 0.5;
        const x = t * 2 * half;
        const z = 0.1 + 0.006 * (r % 2) + 0.004 * (1 - Math.abs(t * 2));
        jabot.push(sdf.ellipsoid([0.02, 0.016, 0.016]).rotateZ(t * -50).at(x, y - 0.005 * Math.abs(t * 2), z).bone('chest'));
      }
    });
    const cuffs = h.perArm((j) => {
      const layers = [0.6, 0.72, 0.84].map((t) => sdf.cone(lerp(j.ELBOW, j.WRIST, t), lerp(j.ELBOW, j.WRIST, t + 0.12), 0.046, 0.053).round(0.003));
      return sdf.union(...layers).bone('forearm.L');
    });
    k.body('frills', sdf.smoothUnion(0.008, ...bits, ...jabot).union(cuffs), { color: C.cream, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ cream trousers, tall black buckled boots
    const lowerTorso = h.weighted(h.torso.round(0.003).intersect(h.band(0.152, 0.204)));
    const legs = pair(
      sdf.smoothUnion(
        0.012,
        sdf.capsule(HIP, KNEE, 0.052).bone('leg.L'),
        sdf.cone(KNEE, [ANKLE[0], 0.125, 0.002], 0.05, 0.048).bone('shin.L'),
        sdf.torus(0.05, 0.012).at(ANKLE[0], 0.122, 0.002).bone('shin.L'), // a rolled cuff
      ),
    );
    k.body('trousers', sdf.smoothUnion(0.02, lowerTorso, legs), { color: C.pants, roughness: 0.85, detail: 0.005 });
    const shaft = sdf.cylinder(0.047, 0.07, 0.012).at(ANKLE[0], 0.075, 0.002).bone('shin.L');
    k.body('boots', pair(shaft), { color: C.black, roughness: 0.45, detail: 0.004 });
    // The buckle sits on the instep, found by a probe on the shoe.
    const buckleAt = (x: number): sdf.Shape => {
      const shoe = sdf.ellipsoid([0.056, 0.042, 0.1]).at(x, 0.04, 0.04);
      const hit = sdf.raycast(shoe, [x, 0.2, 0.08], [0, -1, 0]);
      const p = hit ?? [x, 0.075, 0.08];
      return sdf
        .box([0.04, 0.012, 0.03], 0.004)
        .subtract(sdf.box([0.024, 0.02, 0.016]).at(0, 0, 0))
        .at(p[0], p[1] + 0.004, p[2])
        .bone('foot.L');
    };
    k.body('buckles', pair(buckleAt(ANKLE[0])), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ the cane (right fist, x < 0)
    const gR = h.arms.R.GRIP;
    const gx = -gR[0];
    const gz = gR[2];
    const gy = gR[1];
    const lean = (sh: sdf.Shape) => sh.at(-gx, -gy, -gz).rotateZ(-10).at(gx, gy, gz); // the tip swings out
    const shaftC = sdf.capsule([gx, 0.045, gz], [gx, 0.3, gz], 0.016);
    const hook = sdf.chain(
      [
        [gx, 0.29, gz, 0.017],
        [gx - 0.004, 0.328, gz, 0.0175],
        [gx - 0.02, 0.356, gz, 0.0175],
        [gx - 0.048, 0.364, gz, 0.0175],
        [gx - 0.074, 0.348, gz, 0.0175],
        [gx - 0.085, 0.318, gz, 0.0175],
        [gx - 0.08, 0.292, gz, 0.0175],
      ],
      0.01,
    );
    k.body('cane', lean(sdf.smoothUnion(0.012, shaftC, hook)), { color: C.black, roughness: 0.3, metalness: 0.2, detail: 0.003, bone: 'knife.R' });
    const knob = sdf.sphere(0.024).at(gx, 0.2, gz);
    const tip = sdf.sphere(0.02).at(gx - 0.08, 0.288, gz);
    const ferrule = sdf.cone([gx, 0.03, gz], [gx, 0.075, gz], 0.012, 0.019);
    k.body('caneGold', lean(sdf.union(knob, tip, ferrule)), { color: C.gold, roughness: 0.3, metalness: 0.85, detail: 0.003, bone: 'knife.R' });
  },
});
