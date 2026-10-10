import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Caravan driver — Chibi Quest wilderness NPC (catalog `npcs/wilderness/caravan-driver`), about 1.0 m
 * to the top of the sun hat, faces +Z, stands on y = 0. Target: docs/npc-mockups/caravan-driver_001.jpg.
 *
 * Role: a road NPC who leads trade caravans and gives escort quests; seen in 3D and as a 128 px sprite.
 * One idea: a sturdy, bearded, friendly road man whose wide sand sun hat, big beard, and coil of rope
 *   (right hand) with a leather flask (left hand) read at a glance.
 * Shape language: round and soft (hat, beard, coil, flask), with the long vest and tall boots as the sturdy forms.
 * Palette (60/30/10): ochre #d2a466 / #a98348 (hat, hat band) and sand #c8b088 (vest); blue tunic #3a5a8a;
 *   brown trousers #6b4a2c, belt and boots #5a3a24, flask #7a4a2c; accent: red neckerchief #b03a3a; rope #c8a870.
 * Value plan: the light hat and vest frame the dark beard and face; the red neckerchief and the blue tunic
 *   are the small saturated accents; the rope is the light prop on the dark trousers.
 * Bodies: skin, nose, ears, hat, hair, beard, tunic, vest, neckerchief, belt, pouch, pants, boots, rope, flask, strap, cap.
 * Rig: the humanoid kind's skeleton and clips. The rope is rigid on `knife.R`, the flask on `knife.L`.
 */

const C = {
  hat: '#d2a466',
  cloth: '#a98348',
  belt: '#5a3a24',
  buckle: '#c8b070',
  tunic: '#3a5a8a',
  sash: '#b03a3a',
  sashDark: '#8a2a2a',
  pants: '#6b4a2c',
  boot: '#5a3a24',
  bootSole: '#3a2416',
  rope: '#c8a870',
  flask: '#7a4a2c',
  strap: '#4a3424',
  metal: '#a8a8a0',
  mouth: '#8a2e2a',
};

export default humanoidAsset({
  name: 'caravan-driver',
  description: 'A sturdy, cheerful caravan driver in a wide sun hat and a long vest, holding a coiled rope and a water flask.',
  reference: 'docs/npc-mockups/caravan-driver_001.jpg',
  variants: {
    skin: { tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28', light: '#e8b48e' },
    hair: { black: '#231a17', brown: '#5a301d', auburn: '#8e3b1c', silver: '#b8b4c4' },
    eyes: { brown: '#6e4020', hazel: '#8a6a2a', green: '#3d7a35', blue: '#2f6aa8' },
    cloth: { sand: '#c8b088', ochre: '#c49a4a', clay: '#b87a5a', olive: '#8c8a56' },
  },
  presets: {
    dusty: { skin: 'light', hair: 'brown', eyes: 'hazel', cloth: 'olive' },
  },
  hair: false,
  undershirt: false,
  pants: C.pants,
  shoes: false,
  lashes: false,
  // Both fists in front of the body: the left holds the flask at chest-waist height, the right holds
  // the rope coil a little lower and further out. The arms keep this pose in every clip.
  pose: {
    L: { elbow: [0.172, 0.335, 0.045], wrist: [0.185, 0.345, 0.14] },
    R: { elbow: [0.178, 0.315, 0.04], wrist: [0.2, 0.3, 0.135] },
  },

  // A big friendly smile under the mustache, and heavy arched brows.
  paintSkin(skin, h) {
    const y = 0.538;
    const grin = profile.polygon(
      [
        [-0.05, 0.014],
        [-0.03, 0.005],
        [0, 0.0],
        [0.03, 0.005],
        [0.05, 0.014],
        [0.04, -0.004],
        [0.022, -0.016],
        [0, -0.02],
        [-0.022, -0.016],
        [-0.04, -0.004],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.075, 0.022, 58, 122), 0.3).at(0.1, 0.65, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth);
  },

  extra(k, h) {
    const { ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const hairColor = k.tint('hair');
    const skinColor = h.tint.skin!;
    const rad = Math.PI / 180;

    // ------------------------------------------------------------------ face extras: a round nose and big ears
    const noseY = 0.582;
    const nose = sdf.ellipsoid([0.032, 0.028, 0.03]).at(0, noseY, h.faceZ(0, noseY) + 0.004).bone('head');
    k.body('nose', nose, { color: skinColor, roughness: 0.55, detail: 0.004 });
    const ear = sdf
      .ellipsoid([0.03, 0.054, 0.04])
      .subtract(sdf.sphere(0.02).at(0.018, 0, 0.008))
      .rotateY(-12)
      .at(0.206, 0.612, -0.01);
    k.body('ears', pair(ear).bone('head'), { color: skinColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the sun hat: a crown, a wide brim, a fold
    const hatPose = (s: sdf.Shape) => s.rotateX(-5).at(0, HEAD_Y, 0);
    const crown = sdf.ellipsoid([0.212, 0.215, 0.205]).at(0, 0.11, 0).intersect(sdf.halfSpace([0, -1, 0], -0.06));
    const dent = sdf.ellipsoid([0.075, 0.05, 0.14]).at(0, 0.33, -0.01);
    const brim = sdf.revolve(
      profile.polygon(
        [
          [0, 0.088],
          [0.2, 0.094],
          [0.29, 0.086],
          [0.345, 0.062],
          [0.352, 0.076],
          [0.3, 0.1],
          [0.2, 0.112],
          [0, 0.112],
        ],
        { smooth: true, samples: 6 },
      ),
    ).scale([1, 1, 0.95]);
    const fold = sdf.torus(0.205, 0.02).scale([1, 1, 0.97]).at(0, 0.135, 0);
    const hat = hatPose(
      sdf
        .smoothUnion(0.02, crown, brim, fold)
        .smoothSubtract(0.03, dent)
        .paintWhere(sdf.torus(0.205, 0.033).scale([1, 1, 0.97]).at(0, 0.135, 0), C.cloth, 0.004),
    ).bone('head');
    k.body('hat', hat, {
      color: C.hat,
      roughness: 0.92,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 70 + z * 50) * Math.cos(y * 60 + x * 20),
    });

    // ------------------------------------------------------------------ hair: a small cap and separate locks
    const surf = (az: number, el: number, r: number): [number, number, number] => [
      0.215 * r * Math.cos(el * rad) * Math.sin(az * rad),
      0.208 * r * Math.sin(el * rad),
      0.2 * r * Math.cos(el * rad) * Math.cos(az * rad),
    ];
    const lock = (az: number, top: number, bottom: number, r0: number) => {
      const els = [top, top + (bottom - top) * 0.35, top + (bottom - top) * 0.7, bottom];
      const radii = [r0, r0, r0 * 0.9, r0 * 0.66];
      return sdf.chain(
        els.map((e, i) => {
          const p = surf(az, e, 1.02);
          return [p[0], p[1], p[2], radii[i]!] as [number, number, number, number];
        }),
        0.01,
      );
    };
    const cap = sdf
      .ellipsoid([0.211, 0.205, 0.195])
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.02))
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.1));
    const locks = [
      lock(68, 48, -22, 0.034), // the temple locks that run down into the beard
      lock(-68, 48, -22, 0.03),
      lock(95, 50, 12, 0.026),
      lock(-95, 50, 12, 0.026),
      lock(120, 45, -16, 0.028),
      lock(-120, 45, -16, 0.028),
      lock(145, 45, -30, 0.028),
      lock(-145, 45, -30, 0.028),
      lock(165, 40, -34, 0.028),
      lock(-165, 40, -34, 0.028),
      lock(180, 40, -36, 0.03),
    ];
    const hair = sdf.smoothUnion(0.012, cap, ...locks).at(0, HEAD_Y, 0).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ beard: a mustache, the jaw, and a chin lobe
    const jawZone = sdf.union(
      sdf.box([0.5, 0.3, 0.5]).at(0, 0.507 - 0.15, 0.2),
      sdf.box([0.3, 0.3, 0.5]).at(0.26, 0.57 - 0.15, 0.2).mirror('x', 0),
    );
    const jaw = h.head
      .round(0.018)
      .smoothIntersect(0.02, jawZone)
      .intersect(sdf.halfSpace([0, 0, -1], 0.03));
    const chin = sdf.smoothUnion(
      0.03,
      sdf.ellipsoid([0.1, 0.06, 0.075]).at(0, 0.488, 0.098),
      sdf.ellipsoid([0.075, 0.055, 0.06]).at(0, 0.458, 0.1),
    );
    const mustache = sdf.chain(
      [
        [0.0, 0.56, h.faceZ(0, 0.56) + 0.004, 0.013],
        [0.03, 0.56, h.faceZ(0.03, 0.56) + 0.006, 0.013],
        [0.058, 0.553, h.faceZ(0.058, 0.553) + 0.003, 0.012],
        [0.078, 0.54, h.faceZ(0.078, 0.54) + 0.0, 0.011],
      ],
      0.01,
    ).mirror('x');
    const beard = sdf.smoothUnion(0.02, jaw, chin, mustache);
    k.body('beard', beard.bone('head'), {
      color: hairColor,
      roughness: 0.65,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(x * 90 + y * 40) * Math.cos(z * 70 + y * 60),
    });

    // ------------------------------------------------------------------ blue tunic with short sleeves
    const { SHOULDER } = h.joints;
    const sleeves = h.perArm((j) => {
      const end: [number, number, number] = [
        SHOULDER[0] + 0.75 * (j.ELBOW[0] - SHOULDER[0]),
        SHOULDER[1] + 0.75 * (j.ELBOW[1] - SHOULDER[1]),
        SHOULDER[2] + 0.75 * (j.ELBOW[2] - SHOULDER[2]),
      ];
      return sdf.cone([0.11, 0.405, 0], end, 0.049, 0.045).bone('upperarm.L');
    });
    const tunic = sdf.smoothUnion(0.012, h.weighted(h.torso.round(0.004)), sleeves);
    k.body('tunic', tunic, { color: C.tunic, roughness: 0.85 });

    // ------------------------------------------------------------------ the long vest, open at the front
    const outerTorso = h.torso.round(0.014).intersect(sdf.halfSpace([0, 1, 0], 0.442));
    const hemOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.18],
            [0.147, 0.18],
            [0.152, 0.15],
            [0.16, 0.128],
            [0, 0.128],
          ],
          { smooth: false },
        ),
      )
      .scale([1, 1, 0.8]);
    const hemInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.2],
            [0.135, 0.2],
            [0.14, 0.15],
            [0.148, 0.1],
            [0, 0.1],
          ],
          { smooth: false },
        ),
      )
      .scale([1, 1, 0.78]);
    const opening = sdf.extrude(
      profile.polygon([
        [-0.052, 0.46],
        [0.052, 0.46],
        [0.04, 0.12],
        [-0.04, 0.12],
      ]),
      0.3,
    ).at(0, 0, 0.15);
    const armholes = pair(sdf.sphere(0.058).at(0.15, 0.395, 0));
    const vestShell = sdf
      .smoothUnion(0.012, outerTorso, hemOuter)
      .subtract(sdf.union(h.torso.round(0.002), hemInner))
      .subtract(opening)
      .subtract(armholes);
    k.body('vest', h.weighted(vestShell), {
      color: h.tint.shirt!,
      roughness: 0.88,
      detail: 0.004,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 80 + y * 70) * Math.cos(z * 60 - y * 30),
    });

    // ------------------------------------------------------------------ red neckerchief over the shoulders
    const collar = h.torso.round(0.024).intersect(h.band(0.388, 0.446));
    const point = h.torso
      .round(0.024)
      .intersect(sdf.extrude(profile.polygon([[-0.1, 0.44], [0.1, 0.44], [0, 0.318]]), 0.3).at(0, 0, 0.15));
    k.body('neckerchief', h.weighted(sdf.smoothUnion(0.012, collar, point)), { color: C.sash, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ brown belt with a buckle
    const beltBand = h.torso.round(0.022).smoothIntersect(0.006, h.band(0.222, 0.264));
    k.body('belt', h.weighted(beltBand), { color: C.belt, roughness: 0.75, detail: 0.005 });
    k.body('buckle', sdf.box([0.04, 0.034, 0.02], 0.008).at(0.0, 0.242, 0.136).bone('hips'), { color: C.buckle, roughness: 0.4, metalness: 0.8, detail: 0.003 });

    // A small leather pouch on the belt.
    const pouch = sdf.box([0.052, 0.056, 0.03], 0.01).at(-0.06, 0.232, 0.134).bone('hips');
    k.body('pouch', pouch, { color: C.flask, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ tall boots with turned cuffs
    const boot = sdf
      .smoothUnion(
        0.03,
        sdf.cylinder(0.052, 0.118, 0.02).at(0, 0.059, 0),
        sdf.ellipsoid([0.058, 0.046, 0.108]).at(0, 0.044, 0.042),
        sdf.sphere(0.05).at(0, 0.05, -0.006),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const cuff = sdf.cylinder(0.059, 0.034, 0.014).at(0, 0.104, 0);
    const sole = boot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.016)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootFoot = sdf.union(boot, cuff, sole.paint(C.bootSole)).rotateY(10).at(ANKLE[0], 0, 0).bone('foot.L');
    const bootShin = sdf.union(sdf.cylinder(0.053, 0.05, 0.015).at(ANKLE[0], 0.097, 0), cuff.at(ANKLE[0], 0, 0)).bone('shin.L');
    k.body('boots', pair(sdf.union(bootFoot, bootShin)), { color: C.boot, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ the rope coil in the right hand (x < 0)
    const gR = h.arms.R.GRIP;
    const gL = h.arms.L.GRIP;
    const ropeAt = [-gR[0] - 0.02, gR[1] - 0.012, gR[2] + 0.012] as const;
    const turn = (dz: number, R: number) => sdf.torus(R, 0.0115).rotateX(90).at(ropeAt[0], ropeAt[1], ropeAt[2] + dz);
    const coil = sdf.smoothUnion(0.006, turn(-0.0075, 0.0575), turn(0, 0.0475), turn(0.0075, 0.0375));
    const tail = sdf.chain(
      [
        [ropeAt[0] + 0.01, ropeAt[1] - 0.056, ropeAt[2] + 0.012, 0.0115],
        [ropeAt[0] + 0.02, ropeAt[1] - 0.08, ropeAt[2] + 0.018, 0.0105],
      ],
      0.008,
    );
    const rope = sdf.smoothUnion(0.008, coil, tail).bone('knife.R');
    k.body('rope', rope, {
      color: C.rope,
      roughness: 0.9,
      detail: 0.004,
      bump: (x, y, z) => 0.004 * Math.sin(Math.atan2(y - ropeAt[1], x - ropeAt[0]) * 40 + z * 260),
    });

    // ------------------------------------------------------------------ the leather flask on a short strap (left hand, x > 0)
    const flaskAt = [gL[0] + 0.035, gL[1] - 0.022, gL[2] + 0.012] as const;
    const flask = sdf
      .smoothUnion(
        0.012,
        sdf.ellipsoid([0.048, 0.05, 0.04]).at(...flaskAt),
        sdf.cylinder(0.019, 0.034, 0.006).at(flaskAt[0], flaskAt[1] + 0.054, flaskAt[2]),
      )
      .bone('knife.L');
    k.body('flask', flask, {
      color: C.flask,
      roughness: 0.6,
      detail: 0.004,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 70) * Math.cos(y * 60 + z * 30),
    });
    const stopper = sdf.cylinder(0.014, 0.016, 0.004).at(flaskAt[0], flaskAt[1] + 0.08, flaskAt[2]).bone('knife.L');
    k.body('cap', stopper, { color: C.metal, roughness: 0.4, metalness: 0.85, detail: 0.003 });
    const strap = sdf
      .chain(
        [
          [gL[0] + 0.0, gL[1] + 0.02, gL[2] + 0.0, 0.009],
          [gL[0] + 0.03, gL[1] + 0.0, gL[2] + 0.01, 0.009],
          [flaskAt[0], flaskAt[1] + 0.055, flaskAt[2], 0.009],
        ],
        0.008,
      )
      .union(sdf.torus(0.02, 0.007).at(flaskAt[0], flaskAt[1] + 0.058, flaskAt[2]))
      .bone('knife.L');
    k.body('strap', strap, { color: C.strap, roughness: 0.75, detail: 0.003 });
  },
});
