import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Trapper — Chibi Quest wilderness NPC (catalog `npcs/wilderness/trapper`), about 0.97 m to the top
 * of the hat, faces +Z. Target: docs/npc-mockups/trapper_001.jpg. Built on the humanoid kind.
 *
 * Role: a northern forest NPC (the trading post) who knows the trails and trades furs; seen in 3D and
 *   as a 128 px sprite; the round-eared hat, the big beard, the red scarf, the rope, and the lantern must read.
 * One idea: a rugged, friendly bear of a man: a brown hat with round ears over a huge beard, a long
 *   buckskin coat, a rope over his shoulder and a glowing lantern raised in the other hand.
 * Shape language: round and soft (hat, beard, fur cuffs), with the iron lantern as the one hard form.
 * Palette (60/30/10): buckskin #b8946a, fringes #9a7a50; browns #6b4a2c (hat, trousers), #4a3424 (boots),
 *   #5a3a24 (hair, beard); accent scarf #a83a30 with #2a2428 checks; glow #ffc060.
 * Value plan: the dark beard and the red scarf frame the face; the tan coat is the light mass; the
 *   warm lantern glow is the focal point.
 * Bodies: skin, hat, hair, beard, coat, fur, fringe, belt, pockets, buckle, scarf, boots, rope, lantern parts.
 * Rig: the humanoid kind's skeleton and clips. The left arm (viewer's right, as in the mockup) holds
 *   the lantern up in every clip; the right arm holds the rope low. The rope is rigid on knife.R and
 *   the lantern on knife.L.
 */

const C = {
  hat: '#6b4a2c',
  hatBand: '#3a281a',
  trousers: '#6b4a2c',
  boot: '#4a3424',
  cuff: '#b49c76',
  fringe: '#a88454',
  belt: '#4a3424',
  pocket: '#a58458',
  scarf: '#a83a30',
  check: '#2a2428',
  line: '#3d7a50',
  rope: '#c8a870',
  iron: '#4a4448',
  glow: '#ffc060',
  mouth: '#8a2e2a',
};

// The left arm (the viewer's right) holds the lantern up beside the head; the right arm holds the rope low.
const POSE = {
  L: { elbow: [0.2, 0.34, 0.02], wrist: [0.25, 0.42, 0.07] },
  R: { elbow: [0.19, 0.33, 0.03], wrist: [0.22, 0.26, 0.085] },
} as const;

export default humanoidAsset({
  name: 'trapper',
  description: 'A rugged, friendly woodland trapper in a round-eared brown hat, a big beard, and a long buckskin coat, with a rope on his shoulder and a lantern.',
  reference: 'docs/npc-mockups/trapper_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { chestnut: '#5a3a24', brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { umber: '#8a6038', buckskin: '#b8946a', hide: '#9a7a58', ash: '#8a8070' },
  },
  presets: {
    trapper: { skin: 'light', hair: 'chestnut', eyes: 'brown', cloth: 'umber' },
    northern: { skin: 'tan', hair: 'black', eyes: 'green', cloth: 'ash' },
  },
  hair: false,
  undershirt: false,
  pants: C.trousers,
  shoes: false,
  lashes: false,
  pose: { L: POSE.L, R: POSE.R },

  // Level, bushy brows and a wide, round-cornered smile. The kind's brows and smile are painted out first.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.034, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.02, 58, 120), 0.3).at(0.105, 0.645, 0.1).mirror('x');
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.024, 241, 299), 0.3).at(0, 0.6, 0.1);
    const smile = sdf.extrude(profile.arc(0.08, 0.014, 240, 300), 0.3).at(0, 0.608, 0.1);
    const ends = sdf.union(...[-1, 1].map((s) => sdf.sphere(0.0075).at(s * 0.0395, 0.5395, 0.1)));
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(smile, C.mouth, 0.001)
      .paintWhere(ends.intersect(sdf.box([1, 1, 0.4]).at(0, 0.54, 0.1)), C.mouth, 0.001);
  },

  extra(k, h) {
    const { SHOULDER, HEAD_Y, ANKLE } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const coatColor = h.tint.shirt!;
    const fringeColor = k.tint('cloth', { color: C.fringe, follow: 1 });

    // ------------------------------------------------------------------ hat: crown, wide brim, round ears
    const hatPose = (s: sdf.Shape) => s.rotateX(-4).at(0, HEAD_Y, 0);
    const crown = sdf.ellipsoid([0.215, 0.155, 0.205]).at(0, 0.08, -0.004).intersect(sdf.halfSpace([0, -1, 0], -0.06));
    const brim = sdf
      .smoothUnion(0.01, sdf.cylinder(1, 0.02, 0.009).scale([0.285, 1, 0.28]).at(0, 0.075, 0.01), sdf.cylinder(1, 0.02, 0.009).scale([0.27, 1, 0.268]).at(0, 0.085, 0.012))
      .rotateX(5);
        const band = sdf.torus(0.2, 0.015).scale([1, 1, 0.97]).at(0, 0.09, 0).intersect(sdf.halfSpace([0, -1, 0], -0.08));
    const hatShape = sdf.smoothUnion(0.018, crown, brim);
    const hat = hatPose(hatShape.paintWhere(band.round(0.004), C.hatBand, 0.002));
    k.body('hat', hat.bone('head'), {
      color: C.hat,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(x * 55 + z * 35) * Math.cos(y * 45),
    });

    // ------------------------------------------------------------------ hair: a small cap, temple, fringe, and nape locks
    const lockAt = (p: readonly (readonly [number, number, number, number])[]) => sdf.chain(p, 0.01);
    const nape = sdf
      .ellipsoid([0.19, 0.1, 0.172])
      .at(0, -0.03, -0.03)
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.02));
    const temples = [-1, 1].flatMap((s) => [
      lockAt([
        [s * 0.168, 0.1, 0.03, 0.03],
        [s * 0.192, 0.07, 0.03, 0.03],
        [s * 0.196, 0.0, 0.03, 0.028],
      ]),
      lockAt([
        [s * 0.18, 0.06, -0.03, 0.032],
        [s * 0.196, -0.02, -0.02, 0.028],
        [s * 0.19, -0.075, -0.01, 0.024],
      ]),
    ]);
    const fringe = [-0.07, -0.025, 0.025, 0.07].map((x, i) =>
      lockAt([
        [x, 0.12, 0.12, 0.024],
        [x + (i % 2 ? 0.012 : -0.012), 0.112, 0.145, 0.022],
        [x + (i % 2 ? 0.015 : -0.015), 0.1, 0.155, 0.018],
      ]),
    );
    const skull = sdf.ellipsoid([0.207, 0.202, 0.192]);
    const skullCap = sdf.union(
      skull.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.01)),
      skull.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.12)),
    );
    const hairShape = sdf.smoothUnion(0.03, skullCap, nape).smoothUnion(0.012, ...temples, ...fringe);
    k.body('hair', hatPose(hairShape).bone('head'), { color: hairColor, roughness: 0.6, detail: 0.006 });

    // ------------------------------------------------------------------ beard: sideburns, chin, locks, and mustache
    const fz = (x: number, y: number) => h.faceZ(Math.abs(x), y);
    const side = [-1, 1].map((s) =>
      sdf.chain(
        [
          [s * 0.186, 0.62, 0.02, 0.034],
          [s * 0.18, 0.57, 0.05, 0.038],
          [s * 0.155, 0.52, 0.088, 0.044],
          [s * 0.105, 0.485, 0.12, 0.05],
          [s * 0.03, 0.472, 0.135, 0.05],
        ],
        0.015,
      ),
    );
    const chinMass = sdf.ellipsoid([0.14, 0.095, 0.115]).at(0, 0.475, 0.075).intersect(sdf.halfSpace([0, 1, 0], 0.52));
    const hang = [-0.105, -0.075, -0.045, -0.015, 0.015, 0.045, 0.075, 0.105].map((x, i) =>
      sdf.cone([x, 0.5, 0.105 - Math.abs(x) * 0.3], [x * 1.08, 0.41 - (i % 2) * 0.02, 0.125 - Math.abs(x) * 0.3], 0.04, 0.016),
    );
    const mustache = [-1, 1].map((s) =>
      sdf.chain(
        [
          [s * 0.01, 0.558, fz(0.01, 0.558) + 0.012, 0.017],
          [s * 0.04, 0.553, fz(0.04, 0.553) + 0.01, 0.017],
          [s * 0.075, 0.54, fz(0.075, 0.54) + 0.004, 0.015],
        ],
        0.01,
      ),
    );
    const beardShape = sdf.smoothUnion(0.018, ...side, chinMass, ...hang, ...mustache);
    k.body('beard', beardShape.bone('head'), { color: hairColor, roughness: 0.65, detail: 0.005 });

    // ------------------------------------------------------------------ long buckskin coat
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.14, 0.3],
            [0.152, 0.24],
            [0.16, 0.19],
            [0.168, 0.15],
            [0.172, 0.13],
            [0, 0.13],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.82]);
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.05, 0.047).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.8), 0.047, 0.045).bone('forearm.L'),
      ),
    );
    const coatBody = h.torso.round(0.012).smoothUnion(0.02, skirtOuter);
    const front = sdf.box([0.012, 0.3, 0.2], 0.004).at(0, 0.22, 0.13);
    const coat = sdf
      .smoothUnion(0.012, h.weighted(coatBody), sleeves)
      .paintWhere(front, '#9a7a50', 0.003)
      .paintWhere(sdf.torus(0.12, 0.012).scale([1, 1, 0.8]).at(0, 0.2, 0).intersect(sdf.box([0.4, 0.4, 0.4]).at(0, 0.2, 0)), coatColor, 0.01);
    k.body('coat', coat, {
      color: coatColor,
      roughness: 0.8,
      detail: 0.005,
    });

    // Fur cuffs on the sleeves.
    const cuffs = h.perArm((j) =>
      sdf.cone(lerp(j.ELBOW, j.WRIST, 0.72), lerp(j.ELBOW, j.WRIST, 1.0), 0.056, 0.058).round(0.004).bone('forearm.L'),
    );
    k.body('fur', cuffs, { color: C.cuff, roughness: 0.95, detail: 0.004, bump: (x, y, z) => 0.004 * Math.sin(x * 140 + y * 110) * Math.cos(z * 130 + y * 90) });

    // Fringes: a row along the hem and short locks under each upper arm.
    const hemLocks = Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2;
      const x = 0.172 * Math.sin(a);
      const z = 0.172 * 0.82 * Math.cos(a);
      return sdf.cone([x, 0.135, z], [x * 1.01, 0.085, z * 1.01], 0.016, 0.009);
    });
    const hem = sdf.union(...hemLocks).bone('hips');
    const armFringe = h.perArm((j) =>
      sdf.union(
        ...[0.25, 0.42, 0.59, 0.76].map((t) => {
          const p = lerp(j.ELBOW, SHOULDER, t);
          return sdf.cone([p[0] + 0.01, p[1] - 0.04, p[2]], [p[0] + 0.012, p[1] - 0.09, p[2]], 0.013, 0.007).bone('upperarm.L');
        }),
      ),
    );
    k.body('fringe', sdf.union(hem, armFringe), { color: fringeColor, roughness: 0.9, detail: 0.005 });

    // Belt, buckle, and two pockets.
    const belt = h.weighted(h.torso.round(0.02).subtract(h.torso.round(0.005)).intersect(h.band(0.232, 0.264)));
    k.body('belt', belt, { color: C.belt, roughness: 0.7, detail: 0.004 });
    const buckle = sdf.box([0.045, 0.036, 0.012], 0.004).subtract(sdf.box([0.026, 0.018, 0.03])).at(0, 0.248, 0.117).bone('spine');
    k.body('buckle', buckle, { color: '#8a8070', roughness: 0.4, metalness: 0.8, detail: 0.003 });
    const pockets = pair(sdf.box([0.06, 0.07, 0.022], 0.008).rotateY(-14).at(0.085, 0.19, 0.122)).bone('hips');
    k.body('pockets', pockets, { color: C.pocket, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ red plaid scarf
    const wrap = sdf.torus(0.092, 0.036).scale([1, 1, 0.92]).at(0, 0.425, -0.005);
    const tail = sdf.box([0.046, 0.19, 0.034], 0.014).rotateZ(-8).at(0.05, 0.325, 0.112);
    const tail2 = sdf.box([0.04, 0.13, 0.032], 0.014).rotateZ(10).at(0.012, 0.345, 0.12);
    const rows = (step: number, w: number, y0: number, y1: number, off: number) =>
      sdf.union(...Array.from({ length: Math.floor((y1 - y0) / step) + 1 }, (_, i) => sdf.box([0.6, w, 0.6]).at(0, y0 + off + i * step, 0)));
    const cols = (step: number, w: number, x0: number, n: number, off: number) =>
      sdf.union(...Array.from({ length: n }, (_, i) => sdf.box([w, 0.6, 0.6]).at(x0 + off + i * step, 0.3, 0)));
    const plaid = sdf
      .smoothUnion(0.012, wrap, tail, tail2)
      .paintWhere(rows(0.034, 0.009, 0.2, 0.5, 0), C.check, 0.001)
      .paintWhere(cols(0.034, 0.009, -0.12, 8, 0), C.check, 0.001)
      .paintWhere(rows(0.034, 0.004, 0.2, 0.5, 0.017), C.line, 0.001);
    k.body('scarf', plaid.bone('chest'), { color: C.scarf, roughness: 0.92, detail: 0.006 });

    // ------------------------------------------------------------------ tall boots with fur cuffs
    const boot = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.043, 0.102]).at(0, 0.042, 0.042),
        sdf.cylinder(0.054, 0.12, 0.012).at(0, 0.06, -0.002),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    const cuffRing = sdf.cylinder(0.066, 0.04, 0.014).at(ANKLE[0], 0.1, 0.0).bone('shin.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.55, detail: 0.004 });
    k.body('bootCuffs', pair(cuffRing), { color: C.cuff, roughness: 0.95, detail: 0.004, bump: (x, y, z) => 0.004 * Math.sin(x * 140 + y * 110) * Math.cos(z * 130) });

    // ------------------------------------------------------------------ the rope: over the right shoulder, coiled at the fist
    const gr = h.arms.R.GRIP;
    const g: [number, number, number] = [-gr[0], gr[1], gr[2]];
    const strand = sdf.chain(
      [
        [-0.13, 0.385, -0.09, 0.016],
        [-0.17, 0.44, -0.02, 0.017],
        [-0.185, 0.405, 0.07, 0.017],
        [-0.19, 0.33, 0.115, 0.017],
        [-0.2, 0.25, 0.125, 0.017],
        [g[0], g[1] + 0.02, g[2] + 0.01, 0.017],
      ],
      0.01,
    );
    const ring = (dx: number, r: number) => sdf.torus(r, 0.0175).rotateZ(90).at(g[0] + dx, g[1] - r + 0.002, g[2] + 0.005);
    const rope = sdf.smoothUnion(0.008, strand, ring(0, 0.0725), ring(-0.026, 0.065)).bone('knife.R');
    k.body('rope', rope, {
      color: C.rope,
      roughness: 0.95,
      detail: 0.005,
      bump: (x, y, z) => 0.004 * Math.sin((y + z * 0.7 + x * 0.7) * 260),
    });

    // ------------------------------------------------------------------ the lantern: hangs from the left fist
    const gl = h.arms.L.GRIP;
    const L = (s: sdf.Shape) => s.at(gl[0] - 0.03, gl[1] + 0.02, gl[2]).bone('knife.L');
    const top = -0.04; // the cap sits 0.04 m under the grip
    const bail = L(sdf.torus(0.028, 0.008).rotateX(90).at(0, top + 0.016, 0));
    const lampCap = L(
      sdf.smoothUnion(0.006, sdf.cone([0, top, 0], [0, top + 0.026, 0], 0.045, 0.02), sdf.cylinder(0.046, 0.018, 0.006).at(0, top - 0.004, 0)),
    );
    const baseDisc = L(sdf.cylinder(0.048, 0.02, 0.006).at(0, top - 0.104, 0));
    const posts = L(sdf.union(...[0, 90, 180, 270].map((a) => sdf.cylinder(0.008, 0.1).at(0.037, top - 0.054, 0).rotateY(a))));
    const iron = { color: C.iron, roughness: 0.45, metalness: 0.7, detail: 0.005 };
    k.body('lanternCaps', sdf.union(lampCap, baseDisc), { ...iron, detail: 0.004 });
    k.body('lanternPosts', posts, iron);
    k.body('lanternBail', bail, { ...iron, detail: 0.004 });
    const glass = L(sdf.cylinder(0.034, 0.088, 0.012).at(0, top - 0.054, 0));
    k.body('lanternGlow', glass, { color: C.glow, roughness: 0.3, emissive: C.glow, emissiveIntensity: 0.6, detail: 0.003 });
  },
});
