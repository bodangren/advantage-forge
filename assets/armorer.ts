import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Armorer — Chibi Quest settlement NPC (catalog `npcs/settlement/armorer`), about 1.0 m to the top
 * of the hair, faces +Z. Target: docs/npc-mockups/armorer_001.jpg. Built on the humanoid kind.
 *
 * Role: the armor shop NPC (sells and repairs armor), seen in the smithy in 3D and as a 128 px sprite;
 *   the big beard, the mail shoulders, and the round shield must read.
 * One idea: a broad, cheerful dwarf-like armorer, all beard and shoulders, with a round steel-rimmed
 *   shield on one arm and a small hammer in the other fist.
 * Shape language: square and sturdy (apron, bracers, boots) with round curls and a round shield.
 * Palette (60/30/10): leather browns #4a3428 (apron), #6b4226 (bracers), #7a5a3a (tunic), #3a2a20 (boots),
 *   hair and beard #5a301d; mail grey #8a8e98 and trousers #3a3438; steel #a8acb4 (shield rim and boss),
 *   #6a6e78 (hammer), wood #9a6a3a; skin #f2c7a4.
 * Value plan: the bright steel shield and the pale face frame the dark brown beard and apron; the
 *   grey mail shoulders are the mid value.
 * Bodies: skin (grin, brows), hair, beard, tunic, mail, apron, belt, steel, bracers, trousers, boots,
 *   shield, shield-steel, hammer.
 * Rig: the humanoid kind's skeleton and clips; the shield is rigid on `knife.R`, the hammer on `knife.L`.
 */

const C = {
  hair: '#5a301d',
  mail: '#8a8e98',
  apron: '#4a3428',
  strap: '#6a4a38',
  belt: '#5a3a28',
  bracer: '#6b4226',
  pants: '#3a443c',
  boot: '#3a2a20',
  wood: '#9a6a3a',
  woodLine: '#6e4a28',
  steel: '#a8acb4',
  hammerHead: '#a4a8b2',
  handle: '#8a5a35',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'armorer',
  description: 'A broad, cheerful armorer with a short brown beard, in a chain mail shirt and a leather apron, holding a round shield and a small hammer.',
  reference: 'docs/npc-mockups/armorer_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#5a301d', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { umber: '#7a5a3a', ochre: '#a8803a', moss: '#5f6b3c', madder: '#8e4a3a' },
  },
  presets: {
    sunny: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'moss' },
  },
  hair: false,
  lashes: false,
  // The shield arm keeps one pose in every clip (the elbow bent, the fist forward at the side), so the
  // shield never swings into the beard. Written for the left side; it is mirrored to the right arm.
  pose: { R: { elbow: [0.18, 0.325, 0.02] as const, wrist: [0.2, 0.29, 0.11] as const } },
  undershirt: false,
  pants: C.pants,
  shoes: false,

  // A wide cheerful grin with arched, thick brows. The kind's smile and brows are painted over first.
  paintSkin(skin, h) {
    const y = 0.512;
    const grin = profile.polygon(
      [
        [-0.05, 0.012],
        [-0.026, 0.003],
        [0, 0.0],
        [0.026, 0.003],
        [0.05, 0.012],
        [0.042, -0.01],
        [0.02, -0.026],
        [0, -0.031],
        [-0.02, -0.026],
        [-0.042, -0.01],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.009))).intersect(sdf.box([0.056, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.022, 0.012, 0.08]), 0, y - 0.026);
    const oldSmile = sdf.extrude(profile.arc(0.07, 0.016, 238, 302), 0.3).at(0, 0.6, 0.1);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.08, 0.03, 60, 116), 0.3).at(0.105, 0.648, 0.1).mirror('x');
    return skin
      .paintWhere(oldSmile, h.tint.skin!, 0.002)
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ELBOW, WRIST, HIP, KNEE, ANKLE, GRIP, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x', 0);
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');

    // ------------------------------------------------------------------ hair: a soft cap and thick curls
    // A cap that hugs the skull and stops above the ears (it reaches lower only behind them, ending in
    // a row of rounded tips at the nape), short sideburns, and a few big wavy locks swept back over the top.
    const SK = [0.216, 0.212, 0.202] as const; // the cap ellipsoid, centered at (0, HEAD_Y + 0.006, -0.008)
    const skullY = (x: number, z: number) =>
      HEAD_Y + 0.006 + SK[1] * Math.sqrt(Math.max(0.02, 1 - (x / SK[0]) ** 2 - ((z + 0.008) / SK[2]) ** 2));
    const full = sdf.ellipsoid([...SK]).at(0, HEAD_Y + 0.006, -0.008).smoothSubtract(0.025, sdf.ellipsoid([0.18, 0.17, 0.2]).at(0, 0.62, 0.2));
    const above = full.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.69));
    const behind = full
      .smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.585))
      .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.07));
    const napeTips = sdf.union(
      ...[-70, -50, -30, -10, 10, 30, 50, 70].map((a) =>
        sdf.sphere(0.026).at(0.19 * Math.sin((a * Math.PI) / 180), 0.598, -0.008 - 0.178 * Math.cos((a * Math.PI) / 180)),
      ),
    );
    const sideburns = sdf.union(...[-1, 1].map((sx) => sdf.ellipsoid([0.024, 0.045, 0.04]).at(sx * 0.186, 0.672, 0.05)));
    // [x at the hairline, lean] for each swept lock; every lock runs back over the crown in a wave.
    const lockXs: [number, number][] = [
      [-0.125, -0.02],
      [-0.065, 0.015],
      [0.0, -0.012],
      [0.065, 0.016],
      [0.125, -0.016],
    ];
    const locks = sdf.union(
      ...lockXs.map(([x0, lean], i) => {
        const zs = [0.115, 0.06, 0.0, -0.06, -0.115];
        const rs = [0.034, 0.042, 0.04, 0.036, 0.028];
        return sdf.chain(
          zs.map((z, j) => {
            const x = x0 * (1 - 0.18 * j * 0.25) + lean * Math.sin(j * 1.7 + i);
            return [x, skullY(x, z) - 0.006 + 0.004 * Math.sin(j * 2.2 + i), z, rs[j]!] as [number, number, number, number];
          }),
          0.018,
        );
      }),
    );
    const hair = sdf.smoothUnion(0.014, above, behind, napeTips, sideburns, locks).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.65, detail: 0.005, bump: (x, y, z) => 0.0015 * noise.fbm(x * 90, y * 90, z * 90, 2) });

    // ------------------------------------------------------------------ nose: a big round nose in the skin tint
    const noseY = 0.562;
    const nose = sdf.ellipsoid([0.032, 0.03, 0.032]).at(0, noseY, h.faceZ(0, noseY) + 0.008).bone('head');
    k.body('nose', nose, { color: h.tint.blush!, roughness: 0.55, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ beard: a shell of the lower face and a chin mass
    const faceShell = h.head.round(0.014);
    const lower = sdf.union(
      faceShell.smoothIntersect(0.03, sdf.halfSpace([0, 1, 0], 0.55)),
      faceShell.smoothIntersect(0.02, sdf.ellipsoid([0.05, 0.075, 0.09]).at(0.175, 0.585, 0.03)),
      faceShell.smoothIntersect(0.02, sdf.ellipsoid([0.05, 0.075, 0.09]).at(-0.175, 0.585, 0.03)),
    ).smoothIntersect(0.03, sdf.halfSpace([0, 0, -1], 0.01));
    const chin = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.108, 0.06, 0.09]).at(0, 0.503, 0.06),
      sdf.ellipsoid([0.05, 0.036, 0.044]).at(0, 0.48, 0.1),
    );
    const window = h.onFace(sdf.ellipsoid([0.06, 0.03, 0.09]), 0, 0.514);
    const stache = (s: number) =>
      sdf.chain(
        [
          [0.0, 0.553, h.faceZ(0, 0.553) + 0.006, 0.014],
          [s * 0.035, 0.55, h.faceZ(0.035, 0.55) + 0.006, 0.013],
          [s * 0.065, 0.542, h.faceZ(0.065, 0.542) + 0.004, 0.012],
          [s * 0.083, 0.55, h.faceZ(0.083, 0.55) + 0.004, 0.01],
        ],
        0.01,
      );
    const beard = sdf
      .smoothUnion(0.03, lower, chin)
      .smoothSubtract(0.012, window)
      .smoothUnion(0.01, stache(1), stache(-1))
      .bone('head');
    k.body('beard', beard, { color: hairColor, roughness: 0.65, detail: 0.004, textureDensity: 2, bump: (x, y, z) => 0.0035 * noise.fbm(x * 80, y * 80, z * 80, 2) });

    // ------------------------------------------------------------------ tunic: the torso and a flared skirt
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.27],
            [0.136, 0.27],
            [0.148, 0.22],
            [0.158, 0.17],
            [0.162, 0.14],
            [0, 0.14],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const tunicBody = sdf.smoothUnion(0.02, h.torso, skirtOuter);
    const tunic = h.weighted(tunicBody.round(0.002));
    k.body('tunic', tunic, { color: h.tint.shirt ?? '#7a5a3a', roughness: 0.85 });

    // ------------------------------------------------------------------ chain mail: a yoke over the shoulders and short sleeves
    const mailSleeve = h.perArm((j) =>
      sdf.cone(lerp(SHOULDER, j.ELBOW, -0.2), lerp(SHOULDER, j.ELBOW, 0.88), 0.055, 0.05).bone('upperarm.L'),
    );
    const yoke = h.torso.round(0.012).smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], -0.315));
    const mail = sdf.smoothUnion(0.015, h.weighted(yoke), mailSleeve);
    const rings = (x: number, y: number, z: number) => {
      const u = (x + z) * 230;
      const v = y * 230 + (Math.floor(u / Math.PI) % 2) * 1.6;
      return 0.0032 * Math.cos(u) * Math.cos(v);
    };
    k.body('mail', mail, { color: C.mail, roughness: 0.5, metalness: 0.7, detail: 0.005, bump: rings });

    // ------------------------------------------------------------------ leather apron with crossed straps
    const body2 = sdf.smoothUnion(0.02, h.torso, skirtOuter);
    const apronShell = body2.round(0.022).subtract(body2.round(0.006));
    const panel = sdf
      .extrude(
        profile.polygon(
          [
            [-0.085, 0.43],
            [0.085, 0.43],
            [0.105, 0.3],
            [0.125, 0.19],
            [0.0, 0.118],
            [-0.125, 0.19],
            [-0.105, 0.3],
          ],
          { smooth: false },
        ),
        0.4,
        0.008,
      )
      .at(0, 0, 0.2);
    const crossA = sdf.box([0.034, 0.5, 0.8]).rotateZ(38).at(0, 0.33, 0);
    const crossB = sdf.box([0.034, 0.5, 0.8]).rotateZ(-38).at(0, 0.33, 0);
    const apron = h
      .weighted(apronShell.intersect(panel))
      .paintWhere(crossA, C.strap, 0.003)
      .paintWhere(crossB, C.strap, 0.003)
      .paintWhere(h.band(0.15, 0.17), C.strap, 0.002);
    k.body('apron', apron, { color: C.apron, roughness: 0.8, detail: 0.005, bump: (x, y, z) => 0.002 * noise.fbm(x * 40, y * 40, z * 40, 2) });

    // ------------------------------------------------------------------ wide belt across the hips, square buckle, pouches
    const hipBody = sdf.smoothUnion(0.02, h.torso, skirtOuter);
    const beltY = 0.19;
    const beltShell = hipBody.round(0.034).subtract(hipBody.round(0.012)).intersect(h.band(beltY - 0.027, beltY + 0.027));
    k.body('belt', h.weighted(beltShell), { color: C.belt, roughness: 0.75, detail: 0.004 });
    const buckleZ = sdf.raycast(hipBody.round(0.034), [0, beltY, 1], [0, 0, -1])?.[2] ?? 0.14;
    const buckle = sdf.box([0.08, 0.06, 0.014], 0.006).subtract(sdf.box([0.052, 0.034, 0.05])).at(0, beltY, buckleZ + 0.002).bone('hips');
    const prong = sdf.box([0.012, 0.04, 0.012], 0.003).at(0, beltY, buckleZ + 0.004).bone('hips');
    const pouch = pair(sdf.box([0.05, 0.075, 0.07], 0.014).at(0.178, beltY - 0.05, 0.015).bone('hips'));
    const flap = pair(sdf.box([0.054, 0.028, 0.074], 0.01).at(0.178, beltY - 0.018, 0.015).bone('hips'));
    k.body('steel', sdf.union(buckle, prong), { color: C.steel, roughness: 0.35, metalness: 0.8, detail: 0.003 });
    k.body('pouch', sdf.union(pouch, flap), { color: C.bracer, roughness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ bracers on both forearms
    const bracers = h.perArm((j) =>
      sdf.cone(lerp(j.ELBOW, j.WRIST, 0.34), lerp(j.ELBOW, j.WRIST, 0.9), 0.047, 0.043).round(0.002).bone('forearm.L'),
    );
    k.body('bracers', bracers, { color: C.bracer, roughness: 0.75, detail: 0.004, bump: (x, y, z) => 0.002 * noise.fbm(x * 60, y * 60, z * 60, 2) });

    // ------------------------------------------------------------------ heavy boots with strapped cuffs
    const bootFoot = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.044, 0.102]).at(0, 0.042, 0.042),
        sdf.cylinder(0.053, 0.1, 0.014).at(0, 0.075, 0),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.014)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const cuffBand = sdf.cylinder(0.058, 0.042, 0.01).at(0, 0.108, 0);
    const boot = sdf
      .union(bootFoot, sole.paint('#241812'))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    const bootCuff = cuffBand.rotateY(10).at(ANKLE[0], 0, 0).bone('shin.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.7, detail: 0.005 });
    k.body('boot-cuffs', pair(bootCuff), { color: C.bracer, roughness: 0.75, detail: 0.004 });
    void HIP;
    void KNEE;

    // ------------------------------------------------------------------ the round shield in the posed right fist
    // The fist is at the side and forward; the shield stands in front of it (the fist behind its back),
    // facing forward, turned out a little, at torso height.
    const gR = h.arms.R.GRIP;
    const R = 0.15;
    const shieldPose = (s: sdf.Shape) => s.rotateY(-12).at(-gR[0] - 0.05, gR[1] + 0.005, gR[2] + 0.065);
    const disc = sdf.cylinder(R - 0.006, 0.036, 0.008).rotateX(90);
    const planks = sdf.union(...[-0.075, 0, 0.075].map((x) => sdf.box([0.004, 0.4, 0.2]).at(x, 0, 0.02)));
    const wood = disc.paintWhere(planks, C.woodLine, 0.002);
    const rim = sdf.torus(R - 0.008, 0.012).rotateX(90);
    const boss = sdf.smoothUnion(0.01, sdf.ellipsoid([0.05, 0.05, 0.028]).at(0, 0, 0.022), sdf.cylinder(0.054, 0.014, 0.004).rotateX(90).at(0, 0, 0.014));
    const rivets = sdf.union(
      ...Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI * 2) / 12;
        return sdf.sphere(0.0105).at((R - 0.03) * Math.cos(a), (R - 0.03) * Math.sin(a), 0.02);
      }),
    );
    k.body('shield', shieldPose(wood), { color: C.wood, roughness: 0.8, bone: 'knife.R', detail: 0.004, bump: (x, y, z) => 0.0025 * Math.sin(y * 90 + noise.fbm(x * 12, y * 4, z * 12, 2) * 5) });
    k.body('shield-steel', shieldPose(sdf.union(rim, boss, rivets)), { color: C.steel, roughness: 0.35, metalness: 0.8, bone: 'knife.R', detail: 0.003 });

    // ------------------------------------------------------------------ the small hammer in the left fist
    // Held out to the side: the handle leaves the fist toward +X and up, the head at its end seen in
    // profile from the front (built along +Y, then tipped 65 degrees outward).
    const hamPose = (s: sdf.Shape) => s.rotateZ(-65).at(GRIP[0], GRIP[1], GRIP[2]);
    const handle = sdf.capsule([0, -0.045, 0], [0, 0.15, 0], 0.0175);
    const head = sdf.smoothUnion(
      0.006,
      sdf.box([0.1, 0.062, 0.07], 0.014).at(0, 0.16, 0),
      sdf.cylinder(0.037, 0.016, 0.005).rotateZ(90).at(0.058, 0.16, 0),
      sdf.cylinder(0.037, 0.016, 0.005).rotateZ(90).at(-0.058, 0.16, 0),
    );
    k.body('hammer-handle', hamPose(handle), { color: C.handle, roughness: 0.8, bone: 'knife.L', detail: 0.004 });
    k.body('hammer-head', hamPose(head), { color: C.hammerHead, roughness: 0.4, metalness: 0.8, bone: 'knife.L', detail: 0.004 });
  },
});
