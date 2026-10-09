import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Town Crier — Chibi Quest settlement NPC (catalog `npcs/settlement/town-crier`), about 1.0 m to the
 * top of the tricorn hat, faces +Z. Target: docs/npc-mockups/town-crier_001.jpg. Built on the
 * humanoid kind (worked example: assets/baker.ts).
 *
 * Role: a town square NPC who calls out the news; seen in 3D and as a 128 px sprite. The tricorn,
 *   the wide open calling mouth, the gold-edged blue coat, and the brass bell must read.
 * One idea: an eager boy in a big blue tricorn and a gold-trimmed coat, shouting the news, with a
 *   brass hand bell in one hand and a parchment notice in the other.
 * Shape language: round and soft (face, coat, bell), with the three-pointed hat as the one hard form.
 * Palette (60/30/10): coat and hat #2f4f8a (the cloth slot); cream #e8dcc0 (vest, breeches), white
 *   #f6f1ea (cravat, cuffs, stockings); gold #e0b040 (trim, buttons, buckles); bell #c8a040;
 *   hair #5a301d; shoes #2a2428.
 * Value plan: the blue hat over the light face is the focal point; the cream vest and breeches frame
 *   the open coat; the gold trim and the brass bell are the accent.
 * Bodies: skin (open mouth), hat, hair, coat, vest, cream (cravat, cuffs, stockings), breeches,
 *   shoes, brass (trim, buttons, buckles), bell, handle, notice.
 * Rig: the humanoid kind's skeleton and clips. The bell is rigid on `knife.L` and the notice on
 *   `knife.R` (the fists' grip bones).
 */

const C = {
  gold: '#e0b040',
  white: '#f6f1ea',
  cream: '#e8dcc0',
  vest: '#efe6d0',
  belt: '#2a2428',
  shoe: '#2a2428',
  bell: '#c8a040',
  handle: '#6b4226',
  paper: '#ece0c4',
  ink: '#6b5a3a',
  mouth: '#7a2a2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'town-crier',
  description: 'An eager young town crier in a blue tricorn hat and a gold-trimmed coat, ringing a brass bell and holding a notice.',
  reference: 'docs/npc-mockups/town-crier_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { green: '#3d7a35', brown: '#6e4020', blue: '#2f6aa8', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { navy: '#2f4f8a', burgundy: '#7a2f3f', plum: '#5f3f7a', teal: '#2f6f6a' },
  },
  presets: {
    herald: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'burgundy' },
  },
  pose: { L: { elbow: [0.2, 0.355, 0.02], wrist: [0.26, 0.46, 0.07] } },
  lashes: false,
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,

  // A wide open shout: a tall oval mouth with a row of teeth at the top and a tongue at the bottom.
  // The kind's brows are painted over with skin; high arched brows read as eager and loud.
  paintSkin(skin, h) {
    const y = 0.512;
    const oval = profile.polygon(
      [
        [-0.058, 0.0],
        [-0.046, 0.026],
        [0, 0.036],
        [0.046, 0.026],
        [0.058, 0.0],
        [0.05, -0.028],
        [0.028, -0.046],
        [0, -0.05],
        [-0.028, -0.046],
        [-0.05, -0.028],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(oval, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y + 0.022))).intersect(sdf.box([0.13, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.04, 0.018, 0.08]), 0, y - 0.034);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.014, 52, 122), 0.3).at(0.1, 0.658, 0.1).mirror('x');
    // Wide eyes: a larger white with a dark outline, a big iris, and a small pupil.
    const eye = (rx: number, ry: number, dy = 0) => h.onFace(sdf.ellipsoid([rx, ry, 0.07]), 0.105, 0.632 + dy).mirror('x');
    const shine = sdf.union(...[0.105, -0.105].map((x) => h.onFace(sdf.sphere(0.013), x + 0.018, 0.652)));
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.016, 236, 304), 0.3).at(0, 0.6, 0.1);
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(eye(0.057, 0.064), '#2a1a12', 0.002)
      .paintWhere(eye(0.053, 0.06), '#f6f1ea', 0.002)
      .paintWhere(eye(0.036, 0.046, -0.004), '#2e1a10', 0.002)
      .paintWhere(eye(0.032, 0.042, -0.005), h.tint.iris!, 0.002)
      .paintWhere(eye(0.021, 0.027, -0.001), '#141a18', 0.002)
      .paintWhere(shine, '#ffffff', 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth, 0.002)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const GRIP = h.arms.R.GRIP;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const coatColor = h.tint.shirt ?? '#2f4f8a';

    // ------------------------------------------------------------------ the tricorn hat
    const hatPose = (s: sdf.Shape) => s.rotateX(-8).rotateZ(3).at(0, HEAD_Y + 0.012, 0);
    // A compact crown with a narrow brim folded up in three walls (one on each side of the crown)
    // and three flat points between them: one points forward, two point back to the sides.
    const crown = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.27],
            [0.1, 0.265],
            [0.165, 0.235],
            [0.2, 0.17],
            [0.212, 0.1],
            [0.212, 0.05],
            [0, 0.05],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.93]);
    // The brim is a wide soft disc cut to a rounded triangle (corners at the front and the two back
    // sides). Its edge is lifted by a smooth function of the angle with three lobes, so each corner
    // curls up softly and the sides between them stay low. No walls.
    const tri = profile.polygon(
      [
        [0, 0.42],
        [0.225, 0.13],
        [0.364, -0.21],
        [0, -0.26],
        [-0.364, -0.21],
        [-0.225, 0.13],
      ],
      { smooth: true, samples: 8 },
    );
    const outline = sdf.extrude(tri, 1.2).rotateX(90).at(0, 0.1, 0);
    const disc = sdf.revolve(
      profile.polygon(
        [
          [0, 0.05],
          [0.2, 0.05],
          [0.34, 0.054],
          [0.44, 0.06],
          [0.45, 0.072],
          [0.34, 0.082],
          [0.2, 0.084],
          [0, 0.084],
        ],
        { smooth: true, samples: 5 },
      ),
    );
    const lift = (x: number, z: number) => {
      const t = Math.min(1, Math.max(0, (Math.hypot(x, z) - 0.2) / 0.2));
      const lobe = 0.5 + 0.5 * Math.cos(3 * Math.atan2(x, z));
      return 0.14 * Math.pow(lobe, 1.4) * t * t * (3 - 2 * t);
    };
    const curl = (s: sdf.Shape) =>
      s.warp((x, y, z) => [x, y - lift(x, z), z], 2, { min: [-0.5, 0, -0.5], max: [0.5, 0.3, 0.5] });
    const flat = disc.smoothIntersect(0.03, outline);
    const brim = curl(flat);
    // The thin gold edge: a band at the outer rim of the brim, in its own body.
    const hatRim = hatPose(curl(disc.intersect(outline).subtract(outline.scale([0.955, 1, 0.955])).round(0.003))).bone('head');
    const hatShape = hatPose(sdf.smoothUnion(0.02, crown, brim)).bone('head');
    k.body('hat', hatShape, { color: coatColor, roughness: 0.85, detail: 0.0045 });

    // ------------------------------------------------------------------ hair under the hat
    const hairColor = k.tint('hair');
    const hairCap = hatPose(
      sdf
        .ellipsoid([0.212, 0.206, 0.196])
        .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06))
        .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], 0.01)),
    );
    const lock = (pts: number[][]) => hatPose(sdf.chain(pts.map((p) => [p[0]!, p[1]!, p[2]!, p[3]!]) as [number, number, number, number][], 0.02));
    const temples = pair(
      lock([
        [0.188, 0.085, 0.07, 0.03],
        [0.192, 0.03, 0.06, 0.028],
        [0.19, -0.02, 0.04, 0.024],
        [0.186, -0.055, 0.02, 0.018],
      ]),
    );
    const fringe = sdf.union(
      ...[
        [-0.085, 0.06, 0.164],
        [-0.04, 0.058, 0.176],
        [0.005, 0.062, 0.18],
        [0.05, 0.058, 0.176],
        [0.09, 0.056, 0.164],
      ].map(([x, y, z], i) => hatPose(sdf.chain([[x!, y! + 0.012, z! - 0.01, 0.02], [x! + 0.006, y! - 0.012 - 0.006 * (i % 2), z!, 0.017]], 0.01))),
    );
    k.body('hair', sdf.smoothUnion(0.02, hairCap, temples, fringe).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.005 });

    // ------------------------------------------------------------------ vest, cravat, belt
    const vest = h.weighted(h.torso.round(0.004)).paintWhere(h.band(0.208, 0.236), C.belt, 0.002);
    k.body('vest', vest, { color: C.vest, roughness: 0.85 });

    // ------------------------------------------------------------------ the long blue coat
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.28],
            [0.146, 0.28],
            [0.16, 0.23],
            [0.18, 0.18],
            [0.2, 0.12],
            [0.204, 0.108],
            [0, 0.108],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.053, 0.048).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.76), 0.048, 0.046).bone('forearm.L'),
      ),
    );
    // The open front: a long V from the neck to the hem, with a gold edge.
    const wedge = sdf
      .extrude(
        profile.polygon([
          [-0.016, 0.47],
          [0.016, 0.47],
          [0.05, 0.3],
          [0.13, 0.09],
          [-0.13, 0.09],
          [-0.05, 0.3],
        ]),
        0.5,
      )
      .at(0, 0, 0.25);
    const hem = sdf.halfSpace([0, 1, 0], 0.128);
    const coatBody = sdf.smoothUnion(0.012, h.weighted(sdf.smoothUnion(0.02, h.torso.round(0.012), skirt)), sleeves).subtract(wedge);
    const coat = coatBody.paintWhere(wedge.round(0.012), C.gold, 0.002).paintWhere(hem, C.gold, 0.002);
    k.body('coat', coat, { color: coatColor, roughness: 0.85 });

    // The standing collar and the white cravat at the neck, the white cuffs, and the stockings.
    const collar = sdf.torus(0.06, 0.02).at(0, 0.452, -0.012).bone('chest');
    const cravat = sdf
      .smoothUnion(0.012, sdf.ellipsoid([0.04, 0.05, 0.03]).at(0, 0.425, 0.075), sdf.ellipsoid([0.026, 0.03, 0.02]).at(0, 0.45, 0.085))
      .bone('chest');
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.8), lerp(j.ELBOW, j.WRIST, 1.06), 0.053, 0.05).round(0.004).bone('forearm.L'));
    const stocking = sdf
      .smoothUnion(0.01, sdf.cone(KNEE, [ANKLE[0], 0.1, 0.002], 0.044, 0.04).bone('shin.L'), sdf.capsule([ANKLE[0], 0.09, 0], [ANKLE[0], 0.06, 0.004], 0.037).bone('foot.L'));
    k.body('cream', sdf.union(collar.paint(coatColor), cravat, cuffs, pair(stocking)), { color: C.white, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ cream knee breeches and black shoes
    const breechesLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.052).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.108, 0.002], 0.052, 0.05).bone('shin.L'),
    );
    k.body('breeches', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(breechesLeg)), {
      color: C.cream,
      roughness: 0.85,
    });
    const shoe = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.056, 0.042, 0.1]).at(0, 0.04, 0.04), sdf.sphere(0.05).at(0, 0.05, -0.005))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0);
    k.body('shoes', pair(shoe.bone('foot.L')), { color: C.shoe, roughness: 0.55 });

    // ------------------------------------------------------------------ gold: buttons, buckles, cuff bands
    const coatProbe = sdf.smoothUnion(0.02, h.torso.round(0.012), skirt);
    const buttons = sdf.union(
      ...[0.4, 0.34, 0.28, 0.22].map((y) => {
        const hw = y > 0.3 ? 0.016 + ((0.47 - y) / 0.17) * 0.034 : 0.05 + ((0.3 - y) / 0.19) * 0.08;
        const x = hw + 0.034;
        const z = sdf.raycast(coatProbe, [x, y, 1], [0, 0, -1])![2];
        return pair(sdf.sphere(0.014).at(x, y, z));
      }),
    ).bone('chest');
    const beltZ = sdf.raycast(h.torso.round(0.004), [0, 0.222, 1], [0, 0, -1])![2];
    const buckle = sdf
      .box([0.052, 0.04, 0.014], 0.006)
      .subtract(sdf.box([0.03, 0.02, 0.05], 0.004))
      .at(0, 0.222, beltZ + 0.003)
      .bone('spine');
    const bandCuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 0.82), 0.051, 0.051).round(0.003).bone('forearm.L'));
    const shoeBuckle = sdf
      .box([0.046, 0.032, 0.012], 0.005)
      .subtract(sdf.box([0.026, 0.016, 0.05], 0.003))
      .rotateX(-35)
      .at(0, 0.078, 0.085)
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('rim', hatRim, { color: C.gold, roughness: 0.5, metalness: 0.5, detail: 0.005, maxTriangles: 9000 });
    k.body('brass', sdf.union(buttons, buckle, bandCuffs, pair(shoeBuckle)), { color: C.gold, roughness: 0.4, metalness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ the brass bell (left hand)
    // Local frame: the origin at the grip center, +Z along the bell axis, pointing down and out:
    // a short wooden handle in the fist, then the domed bell with its mouth down.
    const GL = h.arms.L.GRIP;
    const inHand = (s: sdf.Shape) => s.rotateX(46).rotateY(62).at(GL[0], GL[1], GL[2]);
    const handle = sdf.union(sdf.capsule([0, 0, -0.03], [0, 0, 0.034], 0.018), sdf.sphere(0.022).at(0, 0, -0.032));
    k.body('handle', inHand(handle).bone('knife.L'), { color: C.handle, roughness: 0.7, detail: 0.004 });
    const bellOuter = sdf.revolve(
      profile.polygon(
        [
          [0, 0.1],
          [0.016, 0.098],
          [0.03, 0.09],
          [0.037, 0.074],
          [0.039, 0.054],
          [0.039, 0.034],
          [0.041, 0.016],
          [0.046, 0.004],
          [0.047, 0.0],
          [0, 0.0],
        ],
        { smooth: true, samples: 6 },
      ),
    );
    const bellShell = bellOuter.subtract(
      sdf.revolve(
        profile.polygon(
          [
            [0, 0.088],
            [0.014, 0.084],
            [0.026, 0.072],
            [0.031, 0.05],
            [0.032, 0.03],
            [0.036, 0.008],
            [0.036, -0.01],
            [0, -0.01],
          ],
          { smooth: true, samples: 4 },
        ),
      ),
    );
    const clapper = sdf.sphere(0.012).at(0, 0.0, 0);
    // The apex at the origin, the mouth toward +Z, then moved to the end of the handle.
    const bell = sdf
      .union(bellShell, clapper, sdf.sphere(0.016).at(0, 0.1, 0))
      .at(0, -0.1, 0)
      .rotateX(-90)
      .at(0, 0, 0.036);
    k.body('bell', inHand(bell).bone('knife.L'), { color: C.bell, roughness: 0.3, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ the notice (right hand)
    // A rolled parchment held up in the fist: a roll at the top and a curved sheet 0.12 x 0.16 m
    // that hangs partly unrolled in front, with a few ink lines.
    const gx = -GRIP[0] - 0.012;
    const sheetZ = 0.09;
    const sheet = sdf
      .extrude(profile.arc(0.15, 0.008, 67, 113), 0.15)
      .rotateX(90)
      .at(gx, GRIP[1] + 0.075, sheetZ - 0.15);
    const roll = sdf.cylinder(0.018, 0.13, 0.006).rotateZ(90).at(gx, GRIP[1] + 0.16, sheetZ);
    const stub = sdf.cylinder(0.016, 0.1, 0.006).at(gx, GRIP[1] + 0.02, sheetZ - 0.005);
    const lines = sdf.union(
      ...[0.11, 0.08, 0.05, 0.02].map((dy, i) => sdf.box([0.08 - 0.012 * (i % 2), 0.008, 0.06], 0.002).at(gx, GRIP[1] + dy, sheetZ)),
    );
    const notice = sdf.smoothUnion(0.006, sheet, roll, stub).paintWhere(lines, C.ink, 0.002);
    k.body('notice', notice.bone('knife.R'), { color: C.paper, roughness: 0.9, detail: 0.003 });
  },
});
