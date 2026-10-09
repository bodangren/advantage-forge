import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Gravedigger — Chibi Quest settlement NPC (catalog `npcs/settlement/gravedigger`), about 1.0 m to
 * the top of the flat cap, faces +Z. Target: docs/npc-mockups/gravedigger_001.jpg. Built on the
 * humanoid kind.
 *
 * Role: the churchyard keeper who knows old stories; seen at the chapel yard in 3D and as a 128 px sprite.
 *   The red nose over the gray beard, the flat cap, and the lantern and spade must read.
 * One idea: a gentle lanky old man behind a huge gray beard and a round red nose, a green scarf
 *   under it, with a glowing lantern in one hand and a tall spade in the other.
 * Shape language: round and soft (beard, scarf, nose, coat), with the thin tall spade as the one long
 *   vertical and the lantern's glow as the small bright accent.
 * Palette (60/30/10): coat and cap gray #6a6870 with brown #7a5a3a patches; beard and brows #a8a4ac;
 *   scarf #2f4a3a; trousers #5a4434; boots #4a3428 with mud #6b5a44; lantern glow #ffc060 on #4a4448.
 * Value plan: the light beard against the dark scarf and gray coat is the focal point; the glowing
 *   lantern is the one warm accent.
 * Bodies: skin, nose, cap, hair, brows, beard, coat, patches, belt, scarf, trousers, boots, lantern, spade.
 * Rig: the humanoid kind's skeleton and clips. Both arms hold in every clip (a posed arm); the lantern
 *   is rigid on `knife.R` and the spade on `knife.L`.
 */

const C = {
  patch: '#7a5a3a',
  scarf: '#2f4a3a',
  pants: '#5a4434',
  boot: '#4a3428',
  mud: '#6b5a44',
  nose: '#e89080',
  belt: '#3a2a20',
  iron: '#4a4448',
  glow: '#ffd860',
  handle: '#8a6a3a',
  blade: '#4a4850',
  mouth: '#a4503f',
};

const hexRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};

export default humanoidAsset({
  name: 'gravedigger',
  description: 'A gentle lanky old churchyard keeper in a flat cap, a patched gray coat, and a green scarf, with a lantern and a spade.',
  reference: 'docs/npc-mockups/gravedigger_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { gray: '#a8a4ac', silver: '#b8b4c4', brown: '#5a301d', black: '#231a17', auburn: '#8e3b1c', blond: '#c4974a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { gray: '#6a6870', umber: '#6e5a48', lichen: '#5e6a60', dusk: '#5a5f74' },
  },
  presets: {
    keeper: { skin: 'fair', hair: 'gray', eyes: 'brown', cloth: 'gray' },
    night: { skin: 'light', hair: 'silver', eyes: 'blue', cloth: 'dusk' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  // The left fist holds the spade up at the side; the right fist holds the lantern low.
  pose: {
    L: { elbow: [0.235, 0.325, 0.04], wrist: [0.285, 0.375, 0.12] },
    R: { elbow: [0.215, 0.31, 0.03], wrist: [0.29, 0.3, 0.115] },
  },

  // The default brows are covered with skin (the bushy ones are their own body), and the smile
  // stays under the mustache.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.04, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    return skin.paintWhere(oldBrows, h.tint.skin!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const cloth = h.tint.shirt!;
    const patch = k.tint('cloth', { color: C.patch, follow: 0.35 });
    const gray = k.tint('hair');
    const fz = h.faceZ;

    // ------------------------------------------------------------------ flat cap: a low puffed crown and a short visor
    const capPose = (s: sdf.Shape) => s.rotateX(-6).at(0, HEAD_Y, 0);
    const crown = sdf
      .ellipsoid([0.232, 0.11, 0.24])
      .at(0, 0.17, 0.012)
      .intersect(sdf.halfSpace([0, -1, 0], -0.1));
    const visor = sdf.ellipsoid([0.115, 0.014, 0.09]).rotateX(14).at(0, 0.108, 0.226);
    const capBand = sdf.torus(0.208, 0.016).scale([1, 1, 1.02]).at(0, 0.116, 0.004);
    const button = sdf.sphere(0.014).at(0, 0.282, 0.0);
    const cap = capPose(sdf.smoothUnion(0.02, crown, visor, capBand, button)).bone('head');
    k.body('cap', cap, { color: cloth, roughness: 0.92, detail: 0.005, bump: (x, y, z) => 0.0035 * Math.sin(x * 120 + z * 80) * Math.cos(y * 110 + x * 40) });

    // Hair: a soft shell under the cap with lock tips at the nape, and locks at the temples.
    const shellH = sdf.ellipsoid([0.214, 0.208, 0.198]);
    const tips = sdf.union(
      ...[-70, -45, -22, 0, 22, 45, 70].map((a) => sdf.sphere(0.026).at(0.18 * Math.sin((a * Math.PI) / 180), -0.068, -0.167 * Math.cos((a * Math.PI) / 180))),
    );
    const back = shellH.smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], 0.06)).smoothIntersect(0.03, sdf.halfSpace([0, 0, 1], -0.02));
    const temples = shellH
      .smoothIntersect(0.015, sdf.halfSpace([0, -1, 0], 0.07))
      .smoothIntersect(0.015, sdf.halfSpace([-1, 0, 0], -0.15).mirror('x'))
      .smoothIntersect(0.015, sdf.halfSpace([0, 0, 1], 0.11));
    k.body('hair', capPose(sdf.smoothUnion(0.015, back, tips, temples)).bone('head'), { color: gray, roughness: 0.7, detail: 0.005 });

    // ------------------------------------------------------------------ the long coat: torso, sleeves, a flared skirt to the knees
    const sleeve = h.perArm((j) =>
      sdf
        .smoothUnion(
          0.02,
          sdf.cone(lerp(SHOULDER, j.ELBOW, -0.12), j.ELBOW, 0.056, 0.052).bone('upperarm.L'),
          sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.86), 0.052, 0.05).bone('forearm.L'),
        )
        .paintWhere(sdf.ellipsoid([0.034, 0.04, 0.034]).at(j.ELBOW[0] + 0.026, j.ELBOW[1] + 0.012, j.ELBOW[2] - 0.034), patch, 0.004),
    );
    const skirt = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.136, 0.3],
            [0.15, 0.26],
            [0.158, 0.2],
            [0.166, 0.15],
            [0.17, 0.112],
            [0.166, 0.1],
            [0, 0.1],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9]);
    const kneePatch = pair(sdf.box([0.075, 0.07, 0.4], 0.012).at(0.075, 0.185, 0.2));
    const pocket = pair(sdf.box([0.06, 0.04, 0.4], 0.008).at(0.12, 0.25, 0.2));
    const mudColor = hexRgb('#54463a');
    // The lapels: two soft folded edges along the open front.
    const lapel = (s: number) =>
      sdf.chain(
        [
          [0.075 * s, 0.455, 0.085, 0.02],
          [0.068 * s, 0.4, 0.103, 0.022],
          [0.058 * s, 0.33, 0.115, 0.018],
          [0.056 * s, 0.26, 0.12, 0.014],
        ],
        0.01,
      );
    const lapels = h.weighted(sdf.smoothUnion(0.01, lapel(1), lapel(-1)));
    const coat = sdf
      .smoothUnion(0.014, h.weighted(h.torso.round(0.014)), sleeve, h.weighted(skirt))
      .smoothUnion(0.012, lapels)
      .subtract(sdf.box([0.1, 0.4, 0.3], 0.01).at(0, 0.3, 0.2)) // the open front: the shirt and the trousers show
      .paintWhere(kneePatch, patch, 0.004)
      .paintFn((x, y, z, base) => {
        if (y > 0.19) return base;
        const n = noise.fbm(x * 38, y * 30, z * 38, 2);
        const t = n > 0.4 ? Math.min(0.9, (n - 0.4) * 7) * Math.min(1, (0.19 - y) * 12) : 0;
        return [base[0] + (mudColor[0] - base[0]) * t, base[1] + (mudColor[1] - base[1]) * t, base[2] + (mudColor[2] - base[2]) * t] as const;
      });
    k.body('coat', coat, { color: cloth, roughness: 0.92, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(y * 70 + Math.atan2(x, z) * 9) });

    // The tan shirt in the open front, above the belt.
    const shirt = h.weighted(h.torso.round(0.004)).intersect(h.band(0.255, 0.47));
    k.body('shirt', shirt, { color: '#b8a47e', roughness: 0.9, detail: 0.005 });

    // Brown cuffs at the wrists.
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 0.9), 0.056, 0.056).round(0.004).bone('forearm.L'));
    k.body('patches', cuffs, { color: patch, roughness: 0.95, detail: 0.004 });

    // The pocket flaps on the coat skirt.
    const flapBase = skirt.round(0.007).intersect(sdf.box([0.4, 0.4, 0.4]).at(0, 0.2, 0.2)).subtract(skirt.round(-0.002));
    const flaps = pair(flapBase.intersect(sdf.box([0.064, 0.042, 0.4], 0.006).at(0.113, 0.222, 0.2)));
    k.body('flaps', h.weighted(flaps), { color: patch, roughness: 0.9, detail: 0.004 });

    // The belt with a square buckle.
    const belt = h.torso.round(0.02).intersect(h.band(0.232, 0.262)).bone('spine');
    const buckle = sdf.box([0.062, 0.044, 0.02], 0.007).at(0, 0.247, 0.128).bone('spine').paint('#a8a090');
    k.body('belt', sdf.union(belt, buckle), { color: C.belt, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ scarf: a thick dark green wrap
    const scarf = sdf
      .smoothUnion(
        0.03,
        sdf.torus(0.1, 0.056).scale([1, 1, 0.95]).at(0, 0.45, -0.005),
        sdf.ellipsoid([0.185, 0.062, 0.14]).at(0, 0.415, 0.0),
        sdf.ellipsoid([0.165, 0.07, 0.125]).at(0, 0.39, 0.05),
        sdf.chain(
          [
            [0.06, 0.45, 0.1, 0.034],
            [0.095, 0.4, 0.12, 0.034],
            [0.1, 0.34, 0.125, 0.03],
          ],
          0.01,
        ),
      )
      .bone('chest');
    k.body('scarf', scarf, { color: C.scarf, roughness: 0.95, detail: 0.005, bump: (x, y, z) => 0.003 * Math.sin(x * 90 + y * 70) * Math.cos(z * 80 + y * 20) });

    // ------------------------------------------------------------------ nose, brows, mustache, beard
    const noseZ = fz(0, 0.57);
    k.body('nose', sdf.sphere(0.046).at(0, 0.57, noseZ + 0.016).bone('head'), {
      color: k.tint('skin', { color: C.nose, follow: 0.6 }),
      roughness: 0.45,
      detail: 0.004,
    });

    const brow = (s: number) =>
      sdf.chain(
        [
          [0.045 * s, 0.712, fz(0.045, 0.712) + 0.006, 0.019],
          [0.085 * s, 0.728, fz(0.085, 0.728) + 0.006, 0.022],
          [0.125 * s, 0.722, fz(0.125, 0.722) + 0.005, 0.02],
          [0.158 * s, 0.695, fz(0.155, 0.695) + 0.003, 0.014],
        ],
        0.012,
      );
    k.body('brows', sdf.smoothUnion(0.01, brow(1), brow(-1)).bone('head'), { color: gray, roughness: 0.7, detail: 0.004 });

    const mus = (s: number) =>
      sdf.chain(
        [
          [0.01 * s, 0.538, fz(0.01, 0.538) + 0.012, 0.022],
          [0.05 * s, 0.536, fz(0.05, 0.536) + 0.014, 0.025],
          [0.092 * s, 0.522, fz(0.09, 0.522) + 0.008, 0.023],
          [0.12 * s, 0.505, fz(0.115, 0.505) + 0.0, 0.017],
        ],
        0.014,
      );
    const jaw = (s: number) =>
      sdf.chain(
        [
          [0.15 * s, 0.6, 0.05, 0.03],
          [0.148 * s, 0.54, 0.09, 0.042],
          [0.105 * s, 0.5, 0.125, 0.042],
          [0.05 * s, 0.475, 0.15, 0.042],
        ],
        0.02,
      );
    const lock = (x0: number, x1: number, tip: number, r: number, z: number) =>
      sdf.chain(
        [
          [x0, 0.5, 0.14, 0.05],
          [(x0 + x1) / 2, 0.43, z, r],
          [x1, tip, z - 0.01, r * 0.55],
          [x1 * 1.05, tip - 0.035, z - 0.012, r * 0.25],
        ],
        0.02,
      );
    const beard = sdf.smoothUnion(
      0.014,
      pair(jaw(1)),
      sdf.ellipsoid([0.095, 0.075, 0.06]).at(0, 0.46, 0.13),
      lock(0, 0, 0.345, 0.07, 0.2),
      lock(0.04, 0.09, 0.365, 0.054, 0.19),
      lock(-0.04, -0.09, 0.365, 0.054, 0.19),
      lock(0.07, 0.115, 0.395, 0.045, 0.165),
      lock(-0.07, -0.115, 0.395, 0.045, 0.165),
      lock(0.02, 0.045, 0.35, 0.052, 0.195),
      lock(-0.02, -0.045, 0.35, 0.052, 0.195),
    );
    const mustache = sdf.smoothUnion(0.012, mus(1), mus(-1));
    k.body('beard', sdf.smoothUnion(0.015, beard, mustache).bone('head'), {
      color: gray,
      roughness: 0.75,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(x * 140 + y * 8 + z * 30),
    });

    // ------------------------------------------------------------------ trousers and muddy boots
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.1, 0.002], 0.047, 0.046).bone('shin.L'),
    );
    const waist = h.weighted(h.torso.round(0.006)).intersect(h.band(0.14, 0.248));
    k.body('trousers', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg), waist), {
      color: C.pants,
      roughness: 0.85,
    });
    const mud = hexRgb('#54463a');
    const boot = sdf
      .smoothUnion(
        0.025,
        sdf.cylinder(0.055, 0.075, 0.016).at(0, 0.065, 0),
        sdf.ellipsoid([0.058, 0.046, 0.102]).at(0, 0.045, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L')
      .paintFn((x, y, z, base) => {
        const n = noise.fbm(x * 45, y * 35, z * 45, 2);
        const t = Math.max(0, Math.min(0.85, (0.035 - y) * 20 + (n - 0.15) * 3));
        return [base[0] + (mud[0] - base[0]) * t, base[1] + (mud[1] - base[1]) * t, base[2] + (mud[2] - base[2]) * t] as const;
      });
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.75, detail: 0.005 });

    // ------------------------------------------------------------------ the lantern, hanging from the right fist
    const gr = h.arms.R.GRIP;
    const lx = -gr[0] + 0.04; // the fist center sits a little inward of the grip point
    const lz = gr[2];
    const topY = gr[1] - 0.015; // the roof apex
    const H = 0.17; // the lantern body height
    const lanternBottom = topY - H;
    const frame = sdf.smoothUnion(
      0.006,
      sdf.cone([lx, topY - 0.04, lz], [lx, topY, lz], 0.05, 0.014), // the roof
      sdf.cylinder(0.045, 0.026, 0.006).at(lx, lanternBottom + 0.013, lz), // the base
      sdf.torus(0.034, 0.0085).rotateZ(90).at(lx, topY + 0.022, lz), // the ring handle
      ...[0, 90, 180, 270].map((a) => {
        const r = 0.04;
        const px = lx + r * Math.cos((a * Math.PI) / 180);
        const pz = lz + r * Math.sin((a * Math.PI) / 180);
        return sdf.capsule([px, lanternBottom + 0.012, pz], [px, topY - 0.04, pz], 0.0055);
      }),
    );
    k.body('lantern', frame.bone('knife.R'), { color: C.iron, roughness: 0.5, metalness: 0.6, detail: 0.003 });
    const paneH = H - 0.07;
    const pane = sdf.cylinder(0.037, paneH, 0.014).at(lx, lanternBottom + 0.026 + paneH / 2, lz).bone('knife.R');
    k.body('glow', pane, { color: C.glow, emissive: C.glow, emissiveIntensity: 0.7, roughness: 0.3, detail: 0.003 });

    // ------------------------------------------------------------------ the spade, upright in the left fist
    const sx = h.arms.L.GRIP[0] - 0.035; // the fist center sits a little inward of the grip point
    const sz = h.arms.L.GRIP[2];
    const bottom = 0.055;
    const top = 0.5; // a short plain shaft: the top stays at shoulder height
    const bladeH = 0.16;
    const shaft = sdf.capsule([sx, bottom + bladeH, sz], [sx, top, sz], 0.0165);
    k.body('spade', shaft.bone('knife.L'), {
      color: C.handle,
      roughness: 0.8,
      detail: 0.004,
      bump: (x, y, z) => 0.0015 * Math.sin(y * 90 + Math.sin(x * 60 + z * 60)),
    });
    const bladeShape = sdf
      .extrude(
        profile.polygon(
          [
            [-0.07, 0.0],
            [-0.066, -0.1],
            [-0.04, -0.15],
            [0, -0.168],
            [0.04, -0.15],
            [0.066, -0.1],
            [0.07, 0.0],
          ],
          { smooth: true, samples: 6 },
        ),
        0.016,
        0.006,
      )
      .at(sx, bottom + bladeH + 0.006, sz);
    const socket = sdf.cylinder(0.024, 0.05, 0.006).at(sx, bottom + bladeH + 0.03, sz);
    k.body('spade-blade', sdf.smoothUnion(0.008, bladeShape, socket).bone('knife.L'), { color: C.blade, roughness: 0.5, metalness: 0.5, detail: 0.004 });
    void HEAD_Y;
  },
});
