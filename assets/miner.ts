import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Miner — Chibi Quest settlement NPC (catalog `npcs/settlement/miner`), about 1.0 m to the top of
 * the helmet, faces +Z. Target: docs/npc-mockups/miner_001.jpg. Built on the humanoid kind.
 *
 * Role: a mine NPC (sells ore and gems, opens mine quests), seen at the mine entrance in 3D and as
 *   a 128 px sprite; the yellow helmet with its glowing lamp, the raised hammer, and the blue crystal must read.
 * One idea: a sturdy, cheerful miner in a big yellow hard hat with a glowing lamp, one fist raised
 *   with a hammer and the other holding out a glowing blue crystal.
 * Shape language: round and soft (helmet, hair, boots, fists) with the hard hammer head and faceted crystal.
 * Palette (60/30/10): helmet yellow #e0b030 and shirt #2f4a6a, brown leather #6b4226, gray trousers
 *   #6a6870, black boots #2a2428; accent glow lamp #ffd080 and crystal #5ab0e8.
 * Value plan: the bright helmet against black hair frames the face; the dark blue shirt and black
 *   boots anchor the body; the two glows are the focal points.
 * Bodies: skin, nose, hair, locks, helmet, ridge, lamp, lens, shirt, collar, vest, trousers, belt,
 *   buckle, pouches, boots, hammer, hammerhead, crystal.
 * Rig: the humanoid kind's skeleton and clips with a posed arm each: the hammer is rigid on
 *   `knife.R` and the crystal on `knife.L`.
 */

const C = {
  helmet: '#e0b030',
  helmetRidge: '#c89a22',
  lamp: '#7a5a22',
  glow: '#ffd860',
  soot: '#6a5a52',
  suspender: '#6b4226',
  belt: '#4e2e1c',
  pouch: '#8a8050',
  buckle: '#c8a040',
  trousers: '#9a9070',
  boot: '#2a2428',
  bootSole: '#14100f',
  handle: '#9a6a3a',
  steel: '#3c4048',
  crystal: '#48c0dc',
  mouth: '#7a2a2c',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'miner',
  description: 'A sturdy, cheerful miner in a yellow helmet with a glowing lamp, holding up a hammer and a blue crystal.',
  reference: 'docs/npc-mockups/miner_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { slate: '#2e3a48', rust: '#8a4a32', moss: '#3f5a38', plum: '#5a4068' },
  },
  presets: {
    sunny: { skin: 'tan', hair: 'brown', eyes: 'green', cloth: 'rust' },
  },
  hair: false,
  lashes: false,
  undershirt: false,
  pants: false,
  shoes: false,
  // The right fist (x < 0 after the mirror) is raised beside the head with the hammer; the left fist
  // holds the crystal out in front at chest height.
  pose: {
    R: { elbow: [0.22, 0.36, 0.02], wrist: [0.3, 0.455, 0.06] },
    L: { elbow: [0.22, 0.36, 0.04], wrist: [0.3, 0.44, 0.12] },
  },

  // The open, laughing grin (round corners, one tooth band) and thick arched black brows.
  paintSkin(skin, h) {
    const y = 0.517; // just under the nose: lower, the stencil smears where the chin turns away
    const grin = profile.polygon(
      [
        [-0.064, 0.016],
        [-0.034, 0.003],
        [0, 0.0],
        [0.034, 0.003],
        [0.064, 0.016],
        [0.053, -0.014],
        [0.026, -0.035],
        [0, -0.042],
        [-0.026, -0.035],
        [-0.053, -0.014],
      ],
      { smooth: true, samples: 6 },
    );
    // The smooth outline gives round corners (dark corner dots read as fangs or as blood at 128 px).
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    // The kind paints a smile arc along the lower lip: cover it with skin so no hard outline shows.
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.022, 238, 302), 0.3).at(0, 0.53 + 0.07, 0.1);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.015))).intersect(sdf.box([0.078, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.026, 0.014, 0.08]), 0, y - 0.03);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.075, 0.025, 56, 124), 0.3).at(0.1, 0.645, 0.1).mirror('x');
    // Soot smudges on the cheekbones, clear of the mouth. Turn each smudge before it goes onto the
    // face: a turn after `onFace` swings it about the world origin, off the face.
    const smudge = (x: number, y2: number, rx: number, ry: number, deg: number) => h.onFace(sdf.ellipsoid([rx, ry, 0.08]).rotateZ(deg), x, y2);
    // One soft smudge low on the cheek: a dark mark beside the eye reads as a bruise.
    const soot = smudge(-0.162, 0.548, 0.026, 0.011, 10);
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(soot, C.soot, 0.006)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(mouth, C.mouth, 0.003)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.003);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const hatPose = (s: sdf.Shape) => s.rotateX(-6).at(0, HEAD_Y, 0);

    // ------------------------------------------------------------------ a rounder nose
    const noseY = 0.562;
    const nose = sdf.ellipsoid([0.034, 0.028, 0.03]).at(0, noseY, h.faceZ(0, noseY) - 0.004).bone('head');
    k.body('nose', nose, { color: h.tint.skin!, roughness: 0.55, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ helmet: dome, brim, ridge, lamp
    const dome = sdf.ellipsoid([0.235, 0.215, 0.225]).at(0, 0.1, 0).intersect(sdf.halfSpace([0, -1, 0], -0.09));
    const brim = sdf.ellipsoid([0.275, 0.03, 0.27]).at(0, 0.112, 0.02);
    const ridge = dome
      .round(0.014)
      .intersect(sdf.box([0.046, 0.6, 0.6]))
      .intersect(sdf.halfSpace([0, -1, 0], -0.2));
    const sideRibs = pair(
      dome
        .round(0.008)
        .intersect(sdf.box([0.018, 0.6, 0.6]).at(0.09, 0, 0))
        .intersect(sdf.halfSpace([0, -1, 0], -0.2)),
    );
    const helmet = hatPose(sdf.smoothUnion(0.02, dome, brim)).bone('head');
    k.body('helmet', helmet, { color: C.helmet, roughness: 0.45, detail: 0.005 });
    k.body('ridge', hatPose(sdf.smoothUnion(0.01, ridge, sideRibs)).bone('head'), { color: C.helmetRidge, roughness: 0.45, detail: 0.004 });

    // The lamp: a brass housing on the front of the dome with a glowing lens, tilted with the dome slope.
    const lampPose = (s: sdf.Shape) => hatPose(s.rotateX(-29).at(0, 0.2, 0.199));
    const housing = sdf.box([0.108, 0.076, 0.05], 0.016);
    k.body('lamp', lampPose(housing).bone('head'), { color: C.lamp, roughness: 0.4, metalness: 0.6, detail: 0.003 });
    k.body('lens', lampPose(sdf.ellipsoid([0.043, 0.029, 0.022]).at(0, 0, 0.032)).bone('head'), {
      color: C.glow,
      roughness: 0.3,
      emissive: C.glow,
      emissiveIntensity: 0.7,
      detail: 0.003,
    });

    k.body('halo', lampPose(sdf.ellipsoid([0.066, 0.05, 0.034]).at(0, 0, 0.034)).bone('head'), {
      color: C.glow,
      roughness: 0.3,
      emissive: C.glow,
      emissiveIntensity: 0.7,
      opacity: 0.35,
      detail: 0.004,
    });

    // ------------------------------------------------------------------ hair: locks over a cap, under the helmet
    const hairColor = k.tint('hair');
    const skullShell = sdf.ellipsoid([0.214, 0.208, 0.198]);
    // The back hair reaches down to the nape (a band that ends under the brim reads as a slab).
    const back = skullShell.round(0.004).smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], 0.08)).smoothIntersect(0.04, sdf.halfSpace([0, 0, 1], -0.045));
    // A few small dark locks at the temples, below the brim and behind the eye.
    const sideburn = pair(
      sdf.union(
        sdf.chain(
          [
            [0.186, 0.085, 0.05, 0.022],
            [0.192, 0.045, 0.048, 0.018],
            [0.194, 0.012, 0.044, 0.012],
          ],
          0.008,
        ),
        sdf.chain(
          [
            [0.17, 0.088, 0.09, 0.02],
            [0.178, 0.055, 0.092, 0.015],
            [0.18, 0.03, 0.09, 0.009],
          ],
          0.008,
        ),
      ),
    );
    // Short locks on the skull surface at the nape give the lower edge a soft, scalloped line.
    const nape = sdf.union(
      ...[-60, -36, -12, 12, 36, 60].map((a) => {
        const sa = Math.sin((a * Math.PI) / 180);
        const ca = Math.cos((a * Math.PI) / 180);
        return sdf.chain(
          [
            [0.205 * sa, -0.03, -0.192 * ca, 0.031],
            [0.196 * sa, -0.088, -0.182 * ca, 0.027],
          ],
          0.01,
        );
      }),
    );
    // Hair stays below the brim or inside the helmet shell, so no lock pokes through the dome.
    const underHelmet = sdf.union(sdf.halfSpace([0, 1, 0], HEAD_Y + 0.1), hatPose(dome.round(-0.012)));
    const hairBase = headPose(sdf.smoothUnion(0.02, back, sideburn, nape)).intersect(underHelmet).bone('head');
    k.body('hair', hairBase, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // The fringe: separate locks swept to the viewer's left across the forehead, under the brim.
    const lock = (x0: number, len: number, sweep: number) =>
      sdf.chain(
        [
          [x0, 0.13, 0.15, 0.036],
          [x0 + sweep * 0.4, 0.1, 0.175, 0.03],
          [x0 + sweep * 1.5, 0.074 - len * 0.2, 0.185, 0.02],
        ],
        0.01,
      );
    const fringe = sdf.union(
      lock(0.15, 0.1, -0.012),
      lock(0.11, 0.05, -0.03),
      lock(0.07, -0.04, -0.03),
      lock(0.03, 0.06, -0.034),
      lock(-0.01, -0.03, -0.034),
      lock(-0.05, 0.06, -0.03),
      lock(-0.09, -0.02, -0.03),
      lock(-0.13, 0.06, -0.016),
    );
    k.body('locks', headPose(fringe.round(0.004)).intersect(underHelmet).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ shirt: rolled sleeves, collar, buttons
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.01,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), lerp(SHOULDER, j.ELBOW, 0.88), 0.047, 0.043).bone('upperarm.L'),
      ),
    );
    // The sleeves rolled to the elbow: two thick stacked rolls in the darker trim shade.
    const rolls = h.perArm((j) =>
      sdf.smoothUnion(
        0.004,
        sdf.cone(lerp(SHOULDER, j.ELBOW, 0.74), lerp(SHOULDER, j.ELBOW, 0.88), 0.058, 0.06).round(0.006).bone('upperarm.L'),
        sdf.cone(lerp(SHOULDER, j.ELBOW, 0.9), lerp(j.ELBOW, j.WRIST, 0.1), 0.06, 0.057).round(0.006).bone('upperarm.L'),
      ),
    );
    // The rolls and the collar in the cloth color, the placket a darker shade (the kind's trim stays blue).
    const clothLight = k.tint('cloth');
    const clothDark = k.tint('cloth', -0.15);
    k.body('rolls', rolls, { color: clothLight, roughness: 0.85, detail: 0.004 });
    const torsoGrown = h.torso.round(0.003);
    const zAt = (x: number, y: number, s: sdf.Shape = h.torso.round(0.017)) => sdf.raycast(s, [x, y, 1], [0, 0, -1])?.[2] ?? 0.1;
    const buttons = sdf.union(...[0.43, 0.395, 0.36].map((y) => sdf.sphere(0.008).at(0, y, zAt(0, y, torsoGrown))));
    const shirt = sdf
      .smoothUnion(0.012, h.weighted(h.torso), sleeves)
      .paintWhere(sdf.box([0.012, 0.2, 0.6]).at(0, 0.4, 0.3), clothDark, 0.003)
      .paintWhere(buttons, '#1c2a3c', 0.002);
    k.body('shirt', shirt, { color: h.tint.shirt ?? '#26384f', roughness: 0.85 });
    k.body('collar', sdf.torus(0.06, 0.019).at(0, 0.452, -0.012).bone('chest'), { color: clothLight, roughness: 0.85, detail: 0.004 });

    // ------------------------------------------------------------------ suspenders, belt, pouches
    // The brown leather vest over the shirt: open at the front so the buttons show, cut away at the arms.
    const vest = h.weighted(
      h.torso
        .round(0.014)
        .intersect(h.band(0.25, 0.432))
        .intersect(sdf.box([0.215, 0.5, 0.6]).at(0, 0.34, 0))
        .subtract(sdf.box([0.07, 0.3, 0.4]).at(0, 0.36, 0.2)),
    );
    k.body('vest', vest, { color: C.suspender, roughness: 0.7, detail: 0.004 });
    const beltRing = h.torso.round(0.019).intersect(h.band(0.226, 0.272));
    const pouchZ = zAt(0.105, 0.225, h.torso.round(0.019));
    const pouch = pair(
      sdf
        .smoothUnion(
          0.006,
          sdf.box([0.052, 0.07, 0.034], 0.012).at(0.105, 0.222, pouchZ + 0.006),
          sdf.box([0.056, 0.026, 0.038], 0.01).at(0.105, 0.252, pouchZ + 0.006), // the flap
        )
        .bone('hips'),
    );
    k.body('belt', h.weighted(beltRing), { color: C.belt, roughness: 0.65, detail: 0.004 });
    k.body('pouches', pouch, { color: C.pouch, roughness: 0.8, detail: 0.004 });
    k.body('buckle', sdf.box([0.04, 0.032, 0.012], 0.005).at(0, 0.249, zAt(0, 0.249, h.torso.round(0.019)) + 0.003).bone('hips'), {
      color: C.buckle,
      roughness: 0.4,
      metalness: 0.7,
      detail: 0.003,
    });

    // ------------------------------------------------------------------ trousers
    const grown = h.torso.round(0.011);
    const waist = grown.intersect(h.band(0.15, 0.258));
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.052).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.1, 0.002], 0.05, 0.047).bone('shin.L'),
    );
    k.body('trousers', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg), h.weighted(waist)), {
      color: C.trousers,
      roughness: 0.85,
      detail: 0.005,
    });

    // ------------------------------------------------------------------ heavy boots with a flared top
    const bootFoot = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.062, 0.05, 0.108]).at(0, 0.048, 0.044),
        sdf.cylinder(0.056, 0.092, 0.014).at(0, 0.072, 0),
        sdf.torus(0.052, 0.012).at(0, 0.118, 0).scale([1.04, 1, 1.04]), // the flared top
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.018)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf.union(bootFoot, sole.paint(C.bootSole)).rotateY(12).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.6 });

    // ------------------------------------------------------------------ the hammer (rigid on knife.R)
    const gR = h.arms.R.GRIP;
    const GR: [number, number, number] = [-gR[0] + 0.024, gR[1], gR[2]]; // the fist's center sits inside the grip point
    const hammerPose = (s: sdf.Shape) => s.at(GR[0], GR[1], GR[2]).bone('knife.R');
    const handle = sdf.capsule([0, -0.17, 0], [0, 0.19, 0], 0.02);
    const butt = sdf.sphere(0.027).at(0, -0.17, 0);
    k.body('hammer', hammerPose(sdf.smoothUnion(0.01, handle, butt)), { color: C.handle, roughness: 0.75, detail: 0.003 });
    // The head across the top: a block, a round striking face on the outer side (x < 0), a peen inside.
    const headBlock = sdf.box([0.08, 0.07, 0.07], 0.012).at(0, 0.2, 0);
    const face = sdf.cylinder(0.042, 0.045, 0.008).rotateZ(90).at(-0.065, 0.2, 0);
    const peen = sdf.cone([0.035, 0.2, 0], [0.056, 0.2, 0], 0.03, 0.013);
    k.body('hammerhead', hammerPose(sdf.smoothUnion(0.008, headBlock, face, peen).rotateY(40)), { color: C.steel, roughness: 0.45, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ the crystal (rigid on knife.L)
    const gL = h.arms.L.GRIP;
    // A faceted crystal: a hexagonal body capped by five sloped facets on top and five below.
    const slab = (r: number) => sdf.box([0.086, 0.2, 0.086], 0.004).rotateY(r);
    const facet = (a: number, up: number, off: number) => {
      const ar = (a * Math.PI) / 180;
      return sdf.halfSpace([0.55 * Math.cos(ar), up * 0.835, 0.55 * Math.sin(ar)], off);
    };
    const angles = [0, 72, 144, 216, 288];
    const gem = [slab(60), slab(120), sdf.ellipsoid([0.075, 0.09, 0.075]), ...angles.map((a) => facet(a, 1, 0.052)), ...angles.map((a) => facet(a + 36, -1, 0.046))]
      .reduce((acc, s2) => acc.intersect(s2), slab(0))
      .scale(1.3)
      .rotateZ(-8)
      .rotateX(-8)
      .at(gL[0] - 0.024, gL[1] + 0.06, gL[2] + 0.005)
      .bone('knife.L');
    k.body('crystal', gem, { color: C.crystal, roughness: 0.15, emissive: C.crystal, emissiveIntensity: 0.6, flat: true, detail: 0.004 });
  },
});
