import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Diplomat — Chibi Quest court NPC (catalog `npcs/court-and-faction/diplomat`), about 1.0 m to the top
 * of the quiff, faces +Z. Target: docs/npc-mockups/diplomat_001.jpg. Built on the humanoid kind.
 *
 * Role: a court NPC who settles quarrels between towns and gives peace quests, seen in 3D and as a
 *   128 px sprite; the olive branch, the scroll, and the friendly face must read.
 * One idea: a friendly young envoy in a cream coat with dark green lapels, one hand raised with an
 *   olive branch and the other held out with a scroll of terms.
 * Shape language: round and soft (hair roll, big ears, leaves), with the long coat as the one calm form.
 * Palette (60/30/10): cream coat #ece0c8, tan trousers #b8a478, white shirt; dark green lapels
 *   #2f4a3a and cravat; gold buttons #e0b040 as the accent; light brown hair #a8784a.
 * Value plan: the cream coat is the light mass, the dark green lapels frame the face and the cravat.
 * Bodies: skin, hair, coat, lapels, shirt, belt, cravat, buttons, trousers, boots, branch, leaves, scroll.
 * Rig: the humanoid kind's skeleton and clips; both arms keep a held pose. The branch is rigid on
 *   knife.R and the scroll on knife.L.
 */

const C = {
  hair: '#a8784a',
  lapel: '#2f4a3a',
  button: '#e0b040',
  shirt: '#f6f1ea',
  cravat: '#376040',
  belt: '#5a3a24',
  pants: '#b8a478',
  boot: '#6b4226',
  bootCuff: '#8a5a35',
  branch: '#6b4a2c',
  leaf: '#3f6034',
  scroll: '#f0e6cc',
  scrollEnd: '#c8b484',
  ribbon: '#3f6a44',
};

const POSE = {
  R: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] },
  L: { elbow: [0.19, 0.36, 0.05], wrist: [0.24, 0.4, 0.14] },
} as const;

export default humanoidAsset({
  name: 'diplomat',
  description: 'A friendly young diplomat in a cream coat with green lapels, holding up an olive branch and a scroll of terms.',
  reference: 'docs/npc-mockups/diplomat_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', honey: '#a8784a', black: '#231a17', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { cream: '#ece0c8', sand: '#d6b98c', rose: '#d9a8a0', sage: '#b5bf9c' },
  },
  presets: {
    envoy: { skin: 'tan', hair: 'honey', eyes: 'green', cloth: 'sand' },
  },
  hair: false,
  paintSkin(skin, h) {
    // Wipe the kind's small smile, then paint a wide open smile with one band of teeth.
    const y = 0.536;
    const old = sdf.extrude(profile.arc(0.07, 0.016, 238, 302), 0.3).at(0, 0.6, 0.1);
    const grin = profile.polygon(
      [[-0.056, 0.008], [-0.03, 0.004], [0, 0.002], [0.03, 0.004], [0.056, 0.008], [0.05, -0.008], [0.026, -0.022], [0, -0.026], [-0.026, -0.022], [-0.05, -0.008]],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.002)));
    const tongue = h.onFace(sdf.ellipsoid([0.024, 0.01, 0.08]), 0, y - 0.022);
    return skin
      .paintWhere(old, h.tint.skin!, 0.002)
      .paintWhere(mouth, h.tint.mouth!)
      .paintWhere(tongue.intersect(mouth), '#d9707a', 0.004)
      .paintWhere(teeth, '#fbf6ee', 0.002);
  },
  undershirt: false,
  lashes: false,
  pants: C.pants,
  shoes: C.boot,
  pose: {
    R: { elbow: POSE.R.elbow, wrist: POSE.R.wrist },
    L: { elbow: POSE.L.elbow, wrist: POSE.L.wrist },
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y, ANKLE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const above = (y: number) => sdf.halfSpace([0, -1, 0], -y); // solid where world y >= y
    const hairColor = k.tint('hair');
    const skinColor = k.tint('skin');

    // ------------------------------------------------------------------ hair: a close cap and separate locks
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
    const shell = sdf.ellipsoid([0.212, 0.207, 0.197]);
    const top = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.085));
    const back = shell.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.095)).smoothIntersect(0.04, sdf.halfSpace([0, 0, 1], -0.01));
    const temples = shell
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.01))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.06));
    const lock = (pts: number[][]) => sdf.chain(pts.map((p) => [p[0]!, p[1]!, p[2]!, p[3]!] as [number, number, number, number]), 0.02);
    const locks = [
      // the swept quiff, rolling from the part (the viewer's right) over the brow to the viewer's left
      lock([[0.07, 0.15, 0.115, 0.05], [0.0, 0.19, 0.1, 0.056], [-0.08, 0.185, 0.09, 0.05], [-0.15, 0.14, 0.09, 0.042], [-0.19, 0.07, 0.07, 0.032]]),
      lock([[0.1, 0.1, 0.15, 0.034], [0.03, 0.145, 0.14, 0.042], [-0.05, 0.15, 0.135, 0.042], [-0.12, 0.12, 0.125, 0.036], [-0.178, 0.05, 0.09, 0.027]]),
      lock([[0.1, 0.13, 0.12, 0.04], [0.15, 0.1, 0.1, 0.034], [0.185, 0.03, 0.07, 0.028]]),
      // the sideburns
      lock([[0.185, 0.03, 0.05, 0.028], [0.19, -0.02, 0.04, 0.022]]),
      lock([[-0.185, 0.03, 0.05, 0.028], [-0.19, -0.02, 0.04, 0.022]]),
    ];
    // one smooth mass of volume on top, and a smooth back that ends in a clean line above the collar
    const crown = sdf.ellipsoid([0.2, 0.1, 0.19]).at(0, 0.115, 0.0);
    k.body('hair', headPose(sdf.smoothUnion(0.03, top, back, temples, crown, ...locks)), { color: hairColor, roughness: 0.6, detail: 0.004 });

    // Larger ears, as in the mockup.
    const ear = sdf.ellipsoid([0.03, 0.05, 0.036]).subtract(sdf.sphere(0.019).at(0.018, 0.0, 0.008)).rotateY(-12).at(0.205, 0.612, -0.008).bone('head');
    k.body('ears', pair(ear), { color: skinColor, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ coat: a long shell with an open front
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
            [0.158, 0.22],
            [0.172, 0.15],
            [0, 0.15],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.062, 0.5],
          [0.062, 0.5],
          [0.034, 0.3],
          [0.03, 0.14],
          [-0.03, 0.14],
          [-0.034, 0.3],
        ]),
        0.3,
      )
      .at(0, 0, 0.15);
    const lapelZone = sdf
      .extrude(
        profile.polygon([
          [-0.105, 0.5],
          [0.105, 0.5],
          [0.07, 0.34],
          [0.0, 0.34],
          [-0.07, 0.34],
        ]),
        0.3,
      )
      .at(0, 0, 0.15);
    const coatShell = outer.subtract(h.torso.round(0.006)).subtract(opening);
    // Sleeves follow each arm: the upper arm, the forearm, and a dark green cuff at the wrist.
    const sleeves = h.perArm((j) => {
      const upper = sdf.cone([0.11, 0.405, 0], j.ELBOW, 0.049, 0.045).bone('upperarm.L');
      const fore = sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.86), 0.045, 0.042).bone('forearm.L');
      return sdf.smoothUnion(0.015, upper, fore);
    });
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.72), lerp(j.ELBOW, j.WRIST, 1.0), 0.047, 0.048).round(0.003).bone('forearm.L'));
    const coat = sdf
      .smoothUnion(0.012, h.weighted(coatShell), sleeves)
      .paintWhere(lapelZone.intersect(sdf.halfSpace([0, 0, -1], 0.0)), C.lapel, 0.004);
    k.body('coat', coat, { color: h.tint.shirt!, roughness: 0.85, detail: 0.005 });

    // The collar wings stand up at the neck, and the cuffs are dark green.
    const collarRing = sdf
      .torus(0.074, 0.022)
      .scale([1, 1, 0.9])
      .at(0, 0.462, -0.012)
      .subtract(sdf.box([0.07, 0.12, 0.2]).at(0, 0.462, 0.12));
    const wings = pair(sdf.ellipsoid([0.026, 0.04, 0.014]).rotateZ(-22).rotateX(-12).at(0.058, 0.468, 0.062));
    k.body('lapels', sdf.union(sdf.smoothUnion(0.01, collarRing, wings).bone('chest'), cuffs), { color: C.lapel, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ shirt, belt, cravat, buttons
    const shirtShape = h.weighted(h.torso.round(0.004)).intersect(above(0.238));
    const shirt = sdf.union(shirtShape, sdf.torus(0.056, 0.016).at(0, 0.45, -0.01).bone('chest'));
    k.body('shirt', shirt, { color: C.shirt, roughness: 0.85, detail: 0.005 });

    const beltBand = h.weighted(h.torso.round(0.009).intersect(h.band(0.238, 0.264)));
    const buckle = sdf.box([0.034, 0.03, 0.012], 0.004).at(0, 0.251, 0.108).bone('spine');
    k.body('belt', beltBand, { color: C.belt, roughness: 0.7, detail: 0.004 });
    k.body('buckle', buckle, { color: C.button, roughness: 0.35, metalness: 0.8, detail: 0.004 });

    const cravat = sdf
      .smoothUnion(
        0.008,
        sdf.ellipsoid([0.024, 0.02, 0.02]).at(0, 0.434, 0.096),
        sdf.ellipsoid([0.03, 0.024, 0.012]).rotateZ(-28).at(0.028, 0.416, 0.098),
        sdf.ellipsoid([0.03, 0.024, 0.012]).rotateZ(28).at(-0.028, 0.416, 0.098),
        sdf.ellipsoid([0.014, 0.03, 0.01]).at(0, 0.4, 0.094),
      )
      .bone('chest');
    k.body('cravat', cravat, { color: C.cravat, roughness: 0.8, detail: 0.004 });

    // Gold buttons, placed on the coat surface by probes.
    const dots: sdf.Shape[] = [];
    for (const [x, y] of [[0.085, 0.385], [0.092, 0.285], [0.1, 0.21]] as const) {
      const hit = sdf.raycast(coatShell, [x, y, 1], [0, 0, -1]);
      if (hit) dots.push(sdf.sphere(0.0125).at(hit[0], hit[1], hit[2] + 0.002));
    }
    if (dots.length) k.body('buttons', pair(sdf.union(...dots).bone('chest')), { color: C.button, roughness: 0.35, metalness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ trousers under the open coat, boot cuffs
    const lowerTorso = h.weighted(h.torso.round(0.003).intersect(h.band(0.152, 0.246)));
    k.body('trousers', lowerTorso, { color: C.pants, roughness: 0.85, detail: 0.005 });
    const cuff = sdf.cylinder(0.052, 0.034, 0.012).at(ANKLE[0], 0.104, 0.002).bone('shin.L');
    const shaft = sdf.cylinder(0.047, 0.07, 0.012).at(ANKLE[0], 0.075, 0.002).bone('shin.L');
    k.body('bootcuff', pair(cuff), { color: C.bootCuff, roughness: 0.7, detail: 0.004 });
    k.body('bootshaft', pair(shaft), { color: C.boot, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ the olive branch (right hand, x < 0)
    const gR = h.arms.R.GRIP;
    const gripR = [-gR[0], gR[1], gR[2]] as const;
    const leaf = (x: number, y: number, a: number, s = 1) => sdf.ellipsoid([0.036 * s, 0.015 * s, 0.0075]).rotateZ(a).at(x, y, 0.0);
    const stem = sdf.chain(
      [
        [0, -0.045, 0, 0.011],
        [0, 0.03, 0, 0.009],
        [0, 0.16, 0, 0.006],
      ],
      0.005,
    );
    const leaves = sdf.union(
      leaf(0.03, 0.065, 38),
      leaf(-0.03, 0.065, -38),
      leaf(0.032, 0.105, 42),
      leaf(-0.032, 0.105, -42),
      leaf(0.026, 0.14, 50, 0.9),
      leaf(-0.026, 0.14, -50, 0.9),
      leaf(0.01, 0.185, 78, 0.85),
      leaf(-0.012, 0.19, -80, 0.85),
    );
    const branchPose = (s: sdf.Shape) => s.rotateZ(14).rotateX(-8).at(...gripR);
    k.body('branch', branchPose(stem), { color: C.branch, roughness: 0.8, bone: 'knife.R', detail: 0.003 });
    k.body('leaves', branchPose(leaves), { color: C.leaf, roughness: 0.65, bone: 'knife.R', detail: 0.003 });

    // ------------------------------------------------------------------ the scroll (left hand, x > 0)
    const gL = h.arms.L.GRIP;
    const rod = sdf.cylinder(0.03, 0.25, 0.01);
    const endCap = (y: number) => sdf.cylinder(0.04, 0.02, 0.007).at(0, y, 0);
    const roll = sdf.union(rod, endCap(0.115), endCap(-0.115)).paintWhere(sdf.box([0.1, 0.04, 0.1]).at(0, 0.0, 0), C.ribbon, 0.002);
    const scrollPose = (s: sdf.Shape) => s.rotateZ(-38).rotateY(-12).at(gL[0], gL[1], gL[2]);
    k.body('scroll', scrollPose(roll), { color: C.scroll, roughness: 0.8, bone: 'knife.L', detail: 0.003 });
    void SHOULDER;
  },
});
