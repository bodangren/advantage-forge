import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Refugee — Chibi Quest settlement NPC (catalog `npcs/settlement/refugee`), about 0.9 m to the top of
 * the hair, faces +Z. Target: docs/npc-mockups/refugee_001.jpg. Built on the humanoid kind (worked
 * examples: assets/baker.ts, assets/orphan.ts for the one-arm pose and the hair locks).
 *
 * Role: a road NPC who lost a home and asks the player for help; seen on roads and at the town gate
 *   in 3D and as a 128 px sprite. The orange knit shawl, the bundle on a stick, the glowing lantern,
 *   and the brave small smile must read.
 * One idea: a hopeful small traveler wrapped in a big orange shawl, a bundle on her shoulder and a
 *   lantern in her hand.
 * Shape language: round and soft (hair locks, shawl, bundle), with the stick and the lantern frame
 *   as the thin hard forms.
 * Palette (60/30/10): faded blue dress #7a8aa8 (the cloth slot) with a #9a8a6a patch; shawl #d0803a
 *   with #b0602a knit lines; boots #5a3a24; hair #6b3e22; bundle #c8b088; lantern glow #ffc060.
 * Value plan: the dark hair frames the light face; the orange shawl is the focal point under it; the
 *   glowing lantern is the accent.
 * Bodies: skin, hair, dress, patch, cuffs, shawl, strap, boots, stick, bundle, rope, lantern, glow.
 * Rig: the humanoid kind's skeleton and clips. Both arms keep a held `pose`; the stick, the bundle,
 *   and the rope are rigid on `knife.R`, the lantern on `knife.L`.
 */

const C = {
  shawl: '#d0803a',
  knit: '#b0602a',
  patch: '#9a8a6a',
  cuff: '#46606a',
  strap: '#6a4630',
  boot: '#5a3a24',
  bootCuff: '#7a5238',
  sole: '#3a2418',
  stick: '#8a6a3a',
  bundle: '#aaa294',
  knot: '#a8885a',
  iron: '#4a4448',
  glow: '#ffbe1e',
  halo: '#ffa82a',
};

export default humanoidAsset({
  name: 'refugee',
  description: 'A hopeful young traveler in an orange knit shawl, with a bundle on a stick over one shoulder and a small lantern in her hand.',
  reference: 'docs/npc-mockups/refugee_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#4a2a18', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { green: '#3d7a35', brown: '#6e4020', blue: '#2f6aa8', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { faded: '#587882', sage: '#6f8a74', mauve: '#8a6a7e', slate: '#5f6c84' },
  },
  presets: {
    wanderer: { skin: 'tan', hair: 'auburn', eyes: 'hazel', cloth: 'sage' },
  },
  pose: {
    R: { elbow: [0.2, 0.3, 0.0], wrist: [0.19, 0.34, 0.11] },
    L: { elbow: [0.19, 0.32, 0.03], wrist: [0.225, 0.345, 0.12] },
  },
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
    const hairColor = k.tint('hair');
    const dressColor = h.tint.shirt ?? '#587882';

    // ------------------------------------------------------------------ hair: a small cap and many chain locks
    const hp = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    // A point on the skull (a = azimuth from the front, e = elevation), pushed out by s.
    const P = (a: number, e: number, s = 1.03): [number, number, number] => {
      const ra = (a * Math.PI) / 180;
      const re = (e * Math.PI) / 180;
      return [0.205 * s * Math.cos(re) * Math.sin(ra), 0.2 * s * Math.sin(re), 0.19 * s * Math.cos(re) * Math.cos(ra)];
    };
    const lock = (pts: [number, number, number, number][], r = 0.012) =>
      hp(sdf.chain(pts.map(([a, e, s, rad]) => [...P(a, e, s), rad] as [number, number, number, number]), r));
    // The cap hugs the skull: the top and back, ending above the brow line and the ears.
    const skull = sdf.ellipsoid([0.211, 0.206, 0.196]);
    const hairCap = hp(
      sdf.smoothUnion(
        0.02,
        skull.smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], 0.0)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], 0.045)),
        // the nape: the cap runs down the back of the skull so no bare scalp shows between the locks
        skull
          .smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], 0.095))
          .smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.03))
          .smoothIntersect(0.03, sdf.box([0.31, 0.6, 0.6])),
        // the front: the hairline sits low over the forehead
        skull.smoothIntersect(0.03, sdf.halfSpace([0, -1, 0], -0.075)),
      ),
    );
    // The side-swept fringe: locks that start at the parting on the crown and sweep across the forehead.
    const fringe = [
      lock([[-34, 84, 1.03, 0.04], [-50, 62, 1.045, 0.04], [-36, 36, 1.055, 0.034], [-12, 16, 1.06, 0.018]]),
      lock([[-22, 86, 1.03, 0.04], [-18, 62, 1.05, 0.04], [0, 34, 1.058, 0.034], [20, 14, 1.06, 0.018]]),
      lock([[-6, 88, 1.03, 0.04], [8, 64, 1.05, 0.04], [30, 38, 1.058, 0.033], [48, 16, 1.06, 0.018]]),
      lock([[10, 88, 1.03, 0.038], [32, 70, 1.05, 0.036], [54, 46, 1.058, 0.03], [68, 22, 1.06, 0.016]]),
      lock([[-60, 72, 1.03, 0.036], [-68, 48, 1.05, 0.034], [-64, 24, 1.058, 0.028], [-54, 8, 1.06, 0.015]]),
      lock([[-4, 80, 1.04, 0.036], [-26, 58, 1.058, 0.034], [-22, 30, 1.062, 0.03], [-2, 20, 1.065, 0.016]]),
    ];
    // The crown and the back: locks that run from the crown down over the skull.
    const back = [
      lock([[160, 80, 1.03, 0.04], [160, 50, 1.04, 0.038], [165, 20, 1.045, 0.034], [168, -5, 1.05, 0.026]]),
      lock([[-120, 80, 1.03, 0.04], [-125, 50, 1.045, 0.036], [-130, 20, 1.05, 0.03], [-135, -8, 1.05, 0.022]]),
      lock([[120, 80, 1.03, 0.04], [125, 50, 1.045, 0.036], [130, 20, 1.05, 0.03], [135, -8, 1.05, 0.022]]),
      lock([[-170, 70, 1.03, 0.038], [-175, 40, 1.045, 0.036], [180, 10, 1.05, 0.03], [175, -14, 1.05, 0.02]]),
      lock([[90, 75, 1.03, 0.036], [95, 50, 1.045, 0.034], [92, 24, 1.05, 0.028], [90, 4, 1.05, 0.02]]),
    ];
    // The side locks in front of the ears, and the small flips at the nape.
    const sides = [
      lock([[66, 46, 1.03, 0.032], [72, 20, 1.055, 0.03], [74, -2, 1.075, 0.026], [66, -18, 1.1, 0.014]]),
      lock([[-66, 46, 1.03, 0.032], [-72, 20, 1.055, 0.03], [-74, -2, 1.075, 0.026], [-66, -18, 1.1, 0.014]]),
    ];
    // Long wavy hair to the shoulders: thick locks around the back of the skull (behind the ears) that
    // overlap and blend into one wavy mass, each swaying left and right and flipping out at the tip.
    const hang = (deg: number, sway: number, drop: number) => {
      const t = (deg * Math.PI) / 180;
      const o = [Math.sin(t), Math.cos(t)] as const; // outward
      const tg = [Math.cos(t), -Math.sin(t)] as const; // tangent
      const at = (rad: number, out: number, w: number, y: number, r: number): [number, number, number, number] => [
        rad * 0.205 * o[0] + out * o[0] + w * tg[0],
        y,
        rad * 0.19 * o[1] + out * o[1] + w * tg[1],
        r,
      ];
      return hp(
        sdf.chain(
          [
            at(0.9, 0.0, 0, 0.09, 0.044),
            at(1.0, 0.012, sway, -0.03, 0.044),
            at(0.95, 0.02, -sway, -0.12, 0.042),
            at(0.92, 0.032, sway, drop + 0.02, 0.036),
            at(0.95, 0.07, sway * 1.5, drop - 0.005, 0.024),
          ],
          0.02,
        ),
      );
    };
    const flips = [118, 133.5, 149, 164.5, 180, 195.5, 211, 226.5, 242].map((deg, i) =>
      hang(deg, i % 2 ? -0.02 : 0.02, i % 2 ? -0.235 : -0.215),
    );
    k.body('hair', sdf.smoothUnion(0.022, hairCap, ...fringe, ...back, ...sides, ...flips).bone('head'), {
      color: hairColor,
      roughness: 0.6,
      detail: 0.005,
    });

    // Larger ears: a shell over each kind ear, in the skin tint.
    const ear = sdf
      .ellipsoid([0.033, 0.056, 0.04])
      .subtract(sdf.sphere(0.018).at(0.017, 0, 0.007))
      .rotateY(-12)
      .at(0.206, 0.612, -0.01)
      .bone('head');
    k.body('ears', pair(ear), { color: k.tint('skin'), roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the long faded dress
    // Long sleeves that follow each arm, a bodice from the torso, and a flared hollow skirt to the shins.
    const sleeves = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), j.ELBOW, 0.049, 0.045).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.92), 0.045, 0.042).bone('forearm.L'),
      ),
    );
    const bodice = h.torso.round(0.012).intersect(sdf.halfSpace([0, -1, 0], -0.25));
    const HEM = 0.115;
    const outer = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.134, 0.3],
            [0.15, 0.24],
            [0.168, 0.17],
            [0.18, HEM],
            [0, HEM],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.92]);
    const inner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.31],
            [0.12, 0.31],
            [0.136, 0.24],
            [0.154, 0.17],
            [0.166, HEM - 0.01],
            [0, HEM - 0.01],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9]);
    const skirt = outer.subtract(inner);
    // Patches: a ragged tan square on the hem front (the viewer's left) and one on the chest (the viewer's right).
    const hemPatch = sdf.box([0.07, 0.05, 0.6], 0.008).rotateZ(12).at(-0.07, 0.16, 0.1);
    const hemPatch2 = sdf.box([0.035, 0.03, 0.6], 0.006).rotateZ(-20).at(-0.115, 0.135, 0.1);
    const chestPatch = sdf.box([0.034, 0.05, 0.6], 0.008).rotateZ(-28).at(0.075, 0.3, 0.1);
    const hemStitch = sdf.box([0.6, 0.006, 0.6]).at(0, HEM + 0.016, 0);
    const dress = sdf
      .smoothUnion(0.02, h.weighted(bodice), h.weighted(skirt), sleeves)
      .paintWhere(sdf.union(hemPatch, hemPatch2, chestPatch), C.patch, 0.002)
      .paintWhere(hemStitch, mixRgb(rgb(dressColor), rgb('#000000'), 0.18), 0.002);
    k.body('dress', dress, {
      color: dressColor,
      roughness: 0.9,
      detail: 0.005,
      bump: (x, y, z) => 0.002 * Math.sin(x * 120 + y * 90) * Math.cos(z * 100 - y * 40),
    });

    // Cuffs at the wrists.
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.76), lerp(j.ELBOW, j.WRIST, 0.97), 0.047, 0.046).round(0.005).bone('forearm.L'));
    k.body('cuffs', cuffs, { color: C.cuff, roughness: 0.9, detail: 0.004 });

    // The leather strap across the chest (the bag strap).
    const dressSurface = h.torso.round(0.02).subtract(h.torso.round(0.008)).intersect(sdf.halfSpace([0, -1, 0], -0.25));
    const strap = dressSurface.intersect(sdf.box([0.034, 0.5, 0.6], 0.006).rotateZ(-42).at(0.0, 0.34, 0));
    k.body('strap', h.weighted(strap), { color: C.strap, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ the knitted orange shawl
    const ring = sdf.torus(0.1, 0.042).scale([1, 1, 0.96]).at(0, 0.438, -0.004);
    const cape = h.torso
      .round(0.028)
      .smoothIntersect(0.02, sdf.box([0.6, 0.11, 0.6], 0.02).at(0, 0.405, 0));
    const wrap = pair(
      sdf.chain(
        [
          [-0.11, 0.44, 0.04, 0.032],
          [-0.05, 0.415, 0.118, 0.034],
          [0.03, 0.385, 0.138, 0.032],
          [0.1, 0.35, 0.12, 0.028],
        ],
        0.015,
      ),
    );
    const orange = rgb(C.shawl);
    const knitC = rgb(C.knit);
    const shawl = sdf.smoothUnion(0.02, ring, cape, wrap).paintFn((x, y, z) => {
      const line = Math.sin((x * 0.6 + y + z * 0.4) * 230);
      return line > 0.55 ? knitC : orange;
    });
    k.body('shawl', shawl.bone('chest'), {
      color: C.shawl,
      roughness: 0.95,
      detail: 0.004,
      bump: (x, y, z) => 0.0025 * Math.sin(y * 260) * Math.cos((x + z) * 200),
    });

    // ------------------------------------------------------------------ sturdy brown boots with turned cuffs
    const trailing = sdf.smoothUnion(0.012, sdf.cone([ANKLE[0], 0.106, 0.002], [ANKLE[0], 0.05, 0.002], 0.05, 0.048).bone('shin.L'));
    const foot = sdf
      .smoothUnion(0.025, sdf.ellipsoid([0.058, 0.044, 0.104]).at(0, 0.042, 0.042), sdf.sphere(0.05).at(0, 0.052, -0.005))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    const cuff = sdf.torus(0.05, 0.015).at(ANKLE[0], 0.103, 0.002).bone('shin.L');
    const boot = sdf
      .smoothUnion(0.02, trailing, foot, cuff)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintWhere(h.band(-0.2, 0.014), C.sole, 0.002)
      .paintWhere(sdf.box([0.4, 0.034, 0.4]).at(ANKLE[0], 0.1, 0), C.bootCuff, 0.003);
    void HIP;
    void KNEE;
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.7, bump: (x, y, z) => 0.0015 * Math.sin(x * 90 + z * 70 + y * 40) });

    // ------------------------------------------------------------------ the stick and the bundle (right hand)
    const GR = h.arms.R.GRIP;
    const G: [number, number, number] = [-GR[0], GR[1], GR[2]];
    // The stick runs from the fist back past the shoulder; a big gray sack hangs from its back end at
    // the side of the body, behind the arm.
    const E: [number, number, number] = [-0.345, 0.315, -0.14];
    const dl = Math.hypot(E[0] - G[0], E[1] - G[1], E[2] - G[2]);
    const dv = [(E[0] - G[0]) / dl, (E[1] - G[1]) / dl, (E[2] - G[2]) / dl] as const;
    const along = (t: number): [number, number, number] => [G[0] + dv[0] * t, G[1] + dv[1] * t, G[2] + dv[2] * t];
    const stick = sdf.capsule(along(-0.07), along(dl + 0.02), 0.0175).round(0.002);
    k.body('stick', stick.bone('knife.R'), { color: C.stick, roughness: 0.8, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(z * 110 + x * 30) });
    const tip = E;
    const sc: [number, number, number] = [-0.37, 0.195, -0.1];
    const sack = sdf.smoothUnion(
      0.035,
      sdf.ellipsoid([0.11, 0.135, 0.105]).rotateZ(-8).at(sc[0], sc[1], sc[2]),
      sdf.ellipsoid([0.075, 0.065, 0.07]).at(sc[0] - 0.02, sc[1] - 0.075, sc[2] + 0.03), // a lumpy base
      sdf.cone([tip[0], tip[1] + 0.005, tip[2]], [sc[0], sc[1] + 0.08, sc[2]], 0.026, 0.075), // the gathered neck
      sdf.capsule([tip[0] - 0.005, tip[1] + 0.01, tip[2] - 0.005], [tip[0] - 0.035, tip[1] + 0.03, tip[2] - 0.03], 0.02), // the cloth tail
    );
    k.body('bundle', sack.bone('knife.R'), {
      color: C.bundle,
      roughness: 0.95,
      detail: 0.005,
      bump: (x, y, z) => 0.004 * Math.sin(x * 70 + y * 50) * Math.cos(z * 60 - x * 30),
    });
    // The rope: two turns around the neck and a knot with two ends.
    const nk = (t: number): [number, number, number] => [tip[0] + (sc[0] - tip[0]) * t, tip[1] + 0.005 + (sc[1] + 0.08 - tip[1] - 0.005) * t, tip[2] + (sc[2] - tip[2]) * t];
    const ropeAt = (t: number, r: number) => sdf.torus(r, 0.0095).scale([1, 1, 1]).at(...nk(t));
    const rope = sdf.smoothUnion(
      0.006,
      ropeAt(0.4, 0.058),
      ropeAt(0.55, 0.068),
      sdf.sphere(0.017).at(nk(0.47)[0], nk(0.47)[1], nk(0.47)[2] + 0.04),
      sdf.capsule([nk(0.47)[0], nk(0.47)[1], nk(0.47)[2] + 0.04], [nk(0.47)[0] - 0.03, nk(0.47)[1] - 0.045, nk(0.47)[2] + 0.05], 0.007),
      sdf.capsule([nk(0.47)[0], nk(0.47)[1], nk(0.47)[2] + 0.04], [nk(0.47)[0] + 0.03, nk(0.47)[1] - 0.04, nk(0.47)[2] + 0.05], 0.007),
    );
    k.body('rope', rope.bone('knife.R'), { color: C.knot, roughness: 0.9, detail: 0.003 });

    // ------------------------------------------------------------------ the lantern (left hand)
    const GL = h.arms.L.GRIP;
    const LS = 1.4;
    const L = (sh: sdf.Shape) => sh.scale(LS).at(GL[0], GL[1], GL[2]);
    // A short wooden handle in the fist at hip height; the iron cage and the round glass hang below it.
    const handle = sdf.capsule([0, 0.035, 0], [0, -0.03, 0], 0.012);
    const ringTop = sdf.torus(0.012, 0.004).rotateX(90).at(0, -0.03, 0);
    const topCap = sdf.cone([0, -0.028, 0], [0, -0.05, 0], 0.011, 0.036).round(0.003);
    const basePlate = sdf.cylinder(0.037, 0.012, 0.004).at(0, -0.136, 0);
    const posts = sdf.union(
      ...[45, 135, 225, 315].map((a) => {
        const x = 0.033 * Math.sin((a * Math.PI) / 180);
        const z = 0.033 * Math.cos((a * Math.PI) / 180);
        return sdf.capsule([x, -0.05, z], [x, -0.134, z], 0.006);
      }),
    );
    k.body('lantern', L(sdf.smoothUnion(0.006, ringTop, topCap, basePlate, posts)).bone('knife.L'), {
      color: C.iron,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.0035,
      maxTriangles: 3500,
    });
    k.body('handle', L(handle).bone('knife.L'), { color: C.stick, roughness: 0.8, detail: 0.003 });
    k.body('glow', L(sdf.ellipsoid([0.033, 0.04, 0.033]).at(0, -0.092, 0)).bone('knife.L'), {
      color: C.glow,
      roughness: 0.3,
      emissive: C.glow,
      emissiveIntensity: 0.7,
      detail: 0.003,
    });
    // A soft see-through halo around the glass.
    k.body('halo', L(sdf.ellipsoid([0.058, 0.064, 0.058]).at(0, -0.092, 0)).bone('knife.L'), {
      color: C.halo,
      roughness: 0.3,
      opacity: 0.35,
      emissive: C.halo,
      emissiveIntensity: 0.7,
      detail: 0.004,
    });
  },
});
