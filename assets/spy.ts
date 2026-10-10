import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Spy — Chibi Quest court-and-faction NPC (catalog `npcs/court-and-faction/spy`), about 1.0 m to the
 * top of the hood, faces +Z. Target: docs/npc-mockups/spy_001.jpg. Built on the humanoid kind.
 *
 * Role: a town NPC who gathers rumors and gives sneaking quests; seen in 3D and as a 128 px sprite.
 *   The raised brass spyglass, the folded note, the hood with messy black hair, and the cheeky grin must read.
 * One idea: a cheeky kid in a dark green hooded cloak who holds a brass spyglass up beside the hood.
 * Shape language: round and soft (hood, face), with the cloak's flared hem and the hair spikes as the secondary form.
 * Palette (60/30/10): cloak #2f4a3a, gray sleeves and trousers #4f525a / #3a3c44 (60/30 dark);
 *   brown leather vest, pockets, and boots #6b4226 (30); brass spyglass #c8a040 and cream note #f0e6cc (10, the accents).
 * Value plan: the light face framed by black hair and the dark hood is the focal point; the brass and the note are the highlights.
 * Bodies: skin (grin), hood, mantle, cloak, knot, hair, shirt, vest, studs, pants, boots, spyglass, note.
 * Rig: the humanoid kind's skeleton and clips; the right arm is posed up (`pose.R`) and keeps the pose in every clip.
 *   The spyglass is rigid on `knife.R`, the note on `knife.L`; the cloak is rigid on `cloak`.
 */

const C = {
  cloak: '#2f4a3a',
  sleeve: '#4f525a',
  pants: '#3a3c44',
  leather: '#6b4226',
  pocket: '#7d4f2c',
  strap: '#3e2616',
  boot: '#6b4226',
  sole: '#2e1c12',
  brass: '#c8a040',
  brassDark: '#8a6a22',
  note: '#f0e6cc',
  noteEdge: '#cdbb94',
  ink: '#6a5a44',
  seal: '#8a3a2a',
  glove: '#26221e',
  mouth: '#8a3a30',
  teeth: '#fbf6ee',
  hair: '#231a17',
};

const DEG = 180 / Math.PI;

export default humanoidAsset({
  name: 'spy',
  description: 'A cheeky young spy in a dark green hooded cloak, holding up a brass spyglass and a folded note.',
  reference: 'docs/npc-mockups/spy_001.jpg',
  variants: {
    skin: { light: '#e8b48e', fair: '#f2c7a4', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { deep: '#27392e', forest: '#2f4a3a', plum: '#5a3a5a', dusk: '#3a4a6a' },
  },
  presets: {
    dusk: { skin: 'tan', hair: 'brown', eyes: 'green', cloth: 'dusk' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  pose: { R: { elbow: [0.22, 0.41, 0.02], wrist: [0.28, 0.52, 0.06] } },

  // A cheeky grin with round corners and one tooth band, and level, slightly arched brows.
  paintSkin(skin, h) {
    const y = 0.538;
    // A closed, gentle smile: one curved line with round ends.
    const mouth = h.onFace(sdf.extrude(profile.arc(0.06, 0.012, 232, 308), 0.3), 0, y + 0.057);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.08, 0.016, 62, 118), 0.3).at(0.1, 0.645, 0.1).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const hairColor = k.tint('hair');
    const cloakColor = h.tint.shirt!;
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const shellOf = (outer: sdf.Shape, t: number) => outer.subtract(outer.round(-t));
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);

    // ------------------------------------------------------------------ hair: a snug cap and many locks
    const skull = (th: number, ph: number, s = 1): [number, number, number] => {
      const t = th / DEG;
      const p = ph / DEG;
      return [0.214 * s * Math.sin(t) * Math.sin(p), 0.208 * s * Math.cos(t), 0.198 * s * Math.sin(t) * Math.cos(p)];
    };
    const lock = (ph: number, th0: number, th1: number, r0: number, flick: number, sweep = 0) => {
      const a = skull(th0, ph, 1.0);
      const b = skull((th0 + th1) / 2, ph, 1.03);
      const c = skull(th1, ph + sweep, 1.0 + flick);
      return sdf.chain(
        [
          [a[0], a[1], a[2], r0],
          [b[0], b[1], b[2], r0 * 0.9],
          [c[0], c[1], c[2], 0.008],
        ],
        0.012,
      );
    };
    const capShape = sdf
      .ellipsoid([0.211, 0.206, 0.196])
      .smoothIntersect(0.02, sdf.halfSpace([0, -0.894, 0.447], 0.031));
    const fringe = [
      [-64, 94], [-46, 88], [-28, 82], [-12, 78], [4, 76], [20, 80], [36, 84], [52, 90], [66, 96],
    ] as const;
    const locks = [
      ...fringe.map(([ph, th1], i) => lock(ph, 16, th1, 0.027, 0.16, i % 2 === 0 ? 14 : -10)),
      lock(80, 40, 102, 0.02, 0.03),
      lock(-80, 40, 102, 0.02, 0.03),
      lock(-100, 40, 118, 0.02, 0.03),
      lock(100, 40, 118, 0.02, 0.03),
      lock(180, 30, 100, 0.024, 0.04),
      lock(150, 30, 100, 0.022, 0.04),
      lock(-150, 30, 100, 0.022, 0.04),
      // tufts that spill forward out of the hood
      lock(-48, 8, 66, 0.02, 0.2, 18),
      lock(-16, 8, 70, 0.021, 0.22, -16),
      lock(14, 8, 68, 0.021, 0.22, 16),
      lock(46, 8, 66, 0.02, 0.2, -18),
      // crown spikes that flick forward and up
      lock(-20, 5, 38, 0.018, 0.03),
      lock(25, 5, 40, 0.018, 0.03),
      lock(-70, 10, 45, 0.016, 0.03),
    ];
    // ------------------------------------------------------------------ hood, mantle, and cloak
    const hoodOuter = sdf
      .smoothUnion(
        0.06,
        sdf.ellipsoid([0.258, 0.256, 0.252]).at(0, 0.03, -0.045),
        sdf.ellipsoid([0.11, 0.075, 0.075]).at(0, -0.09, -0.24), // the cowl that slumps onto the back
        sdf.chain(
          [
            [0, 0.17, -0.12, 0.07],
            [0, 0.26, -0.2, 0.045],
            [0, 0.25, -0.29, 0.028],
          ],
          0.03,
        ), // a soft peak that flops backward
      )
      .displace(0.008, (x, y, z) => noise.fbm(x * 13, y * 13, z * 13, 2));
    const hoodInner = sdf.ellipsoid([0.232, 0.228, 0.226]).at(0, 0.02, -0.04);
    const opening = sdf.ellipsoid([0.2, 0.25, 0.3]).at(0, 0.055, 0.32);
    const hoodShape = headPose(hoodOuter.subtract(hoodInner).subtract(opening)).bone('head');
    k.body('hood', hoodShape, { color: cloakColor, roughness: 0.9, detail: 0.005 });

    // The hair stays inside the hood: only the hood's front opening lets it out.
    const hairClip = sdf.union(hoodOuter.round(-0.005), opening);
    const hairShape = headPose(sdf.smoothUnion(0.01, capShape, ...locks).intersect(hairClip)).bone('head');
    k.body('hair', hairShape, { color: hairColor, roughness: 0.55, detail: 0.004 });

    const mantleOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.472],
            [0.075, 0.47],
            [0.125, 0.452],
            [0.172, 0.418],
            [0.208, 0.378],
            [0.222, 0.35],
            [0, 0.35],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.86])
      .at(0, 0, -0.005);
    const vOpen = sdf
      .extrude(
        profile.polygon([
          [-0.04, 0.424],
          [0.04, 0.424],
          [0.09, 0.36],
          [0.09, 0.3],
          [-0.09, 0.3],
          [-0.09, 0.36],
        ]),
        0.4,
      )
      .at(0, 0, 0.2);
    const mantle = shellOf(mantleOuter, 0.014).subtract(vOpen).bone('chest');
    k.body('mantle', mantle, { color: cloakColor, roughness: 0.9, detail: 0.005 });

    const capeOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.45],
            [0.13, 0.448],
            [0.2, 0.42],
            [0.25, 0.35],
            [0.285, 0.26],
            [0.31, 0.17],
            [0.315, 0.145],
            [0, 0.145],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.8])
      .at(0, 0, -0.03)
      .displace(0.013, (x, y, z) => {
        const a = Math.atan2(x, -(z + 0.03));
        const w = Math.min(1, Math.max(0, (0.42 - y) / 0.2));
        return Math.sin(a * 7 + Math.sin(a * 3) * 0.8) * w;
      });
    const cape = shellOf(capeOuter, 0.02)
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], -0.035))
            .bone('cloak');
    k.body('cloak-mesh', cape, { color: cloakColor, roughness: 0.92, detail: 0.005 });
    // A darker rolled hem so the bottom edge reads as cloth.
    const hem = cape.round(0.004).intersect(sdf.box([0.8, 0.045, 0.8]).at(0, 0.1675, -0.03)).bone('cloak');
    k.body('cloak-hem', hem, { color: k.tint('cloth', -0.22), roughness: 0.92, detail: 0.005 });

    // The knot that closes the cloak at the throat.
    const knot = sdf
      .smoothUnion(
        0.01,
        sdf.sphere(0.02).at(0, 0.436, 0.1),
        sdf.ellipsoid([0.026, 0.014, 0.012]).rotateZ(25).at(0.03, 0.42, 0.105),
        sdf.ellipsoid([0.026, 0.014, 0.012]).rotateZ(-25).at(-0.03, 0.42, 0.105),
      )
      .bone('chest');
    k.body('knot', knot, { color: cloakColor, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ gray shirt with long sleeves and glove cuffs
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.88), 0.043, 0.04).bone('forearm.L'),
      ),
    );
    k.body('shirt', sdf.smoothUnion(0.012, h.weighted(h.torso), sleeve), { color: C.sleeve, roughness: 0.88 });
    const cuffs = h.perArm((j) =>
      sdf.cone(lerp(j.ELBOW, j.WRIST, 0.72), lerp(j.ELBOW, j.WRIST, 1.0), 0.045, 0.045).round(0.003).bone('forearm.L'),
    );
    k.body('cuffs', cuffs, { color: C.glove, roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ the leather vest: pockets, belt, strap
    const vestSkin = h.torso.round(0.009).intersect(h.band(0.2, 0.452));
    const zAt = (x: number, y: number) => sdf.raycast(h.torso.round(0.009), [x, y, 1], [0, 0, -1])![2];
    const pocketAt = (x: number, y: number, w: number, hh: number, d = 0.022) => {
      const turn = Math.asin(Math.max(-0.9, Math.min(0.9, x / 0.13))) * DEG;
      return sdf.box([w, hh, d], 0.006).rotateY(turn).at(x, y, zAt(x, y) + 0.004);
    };
    const pockets = [
      pocketAt(-0.07, 0.35, 0.05, 0.045),
      pocketAt(0.072, 0.335, 0.05, 0.05),
      pocketAt(-0.095, 0.262, 0.05, 0.05),
      pocketAt(0.095, 0.262, 0.05, 0.05),
      pocketAt(0.0, 0.282, 0.038, 0.034),
      pocketAt(0.115, 0.4, 0.04, 0.034),
    ];
    const beltStencil = h.band(0.226, 0.254);
    const strapStencil = sdf.box([0.026, 0.45, 0.6]).rotateZ(-38).at(0.0, 0.345, 0);
    const vest = sdf
      .smoothUnion(0.004, vestSkin, ...pockets)
      .paintWhere(beltStencil, C.strap, 0.002)
      .paintWhere(strapStencil.intersect(h.band(0.255, 0.45)), C.strap, 0.002);
    k.body('vest', h.weighted(vest), { color: C.leather, roughness: 0.72, detail: 0.005 });
    const studs = sdf.union(
      sdf.box([0.03, 0.02, 0.01], 0.003).at(0, 0.24, zAt(0, 0.24) + 0.012), // the belt buckle
      ...[
        [-0.07, 0.364],
        [0.072, 0.35],
        [-0.095, 0.277],
        [0.095, 0.277],
        [0.115, 0.412],
      ].map(([x, y]) => sdf.sphere(0.005).at(x!, y!, zAt(x!, y!) + 0.016)),
    );
    k.body('studs', studs.bone('chest'), { color: C.brass, roughness: 0.35, metalness: 0.8, detail: 0.003 });

    // The hip pouch that hangs from the belt on the viewer's right.
    const pouch = sdf
      .smoothUnion(
        0.01,
        sdf.box([0.06, 0.07, 0.04], 0.012).at(0.165, 0.17, 0.045),
        sdf.box([0.064, 0.026, 0.044], 0.01).at(0.165, 0.2, 0.045),
      )
      .bone('hips');
    k.body('pouch', pouch, { color: C.pocket, roughness: 0.72, detail: 0.004 });

    // ------------------------------------------------------------------ trousers and boots
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.11, 0.002], 0.048, 0.046).bone('shin.L'),
    );
    k.body('pants', sdf.smoothUnion(0.03, sdf.ellipsoid([0.118, 0.052, 0.088]).at(0, 0.2, 0).bone('hips'), pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.88,
    });
    const boot = sdf
      .smoothUnion(
        0.02,
        sdf.ellipsoid([0.056, 0.042, 0.1]).at(0, 0.04, 0.045),
        sdf.sphere(0.05).at(0, 0.052, -0.005),
        sdf.cylinder(0.054, 0.07, 0.01).at(0, 0.088, 0),
      )
      .smoothUnion(0.008, sdf.torus(0.054, 0.013).at(0, 0.124, 0))
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintWhere(sdf.halfSpace([0, 1, 0], 0.014), C.sole, 0.003)
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.62, detail: 0.005 });

    // ------------------------------------------------------------------ the spyglass (right hand, posed) and the note (left hand)
    const gR = h.arms.R.GRIP;
    const tilt = 14; // degrees toward +Z
    const glass = sdf
      .smoothUnion(
        0.004,
        sdf.cylinder(0.016, 0.03, 0.005).at(0, -0.055, 0), // eyepiece
        sdf.cylinder(0.02, 0.06, 0.005).at(0, -0.015, 0), // inner tube
        sdf.cylinder(0.024, 0.05, 0.005).at(0, 0.03, 0), // outer tube
        sdf.cylinder(0.038, 0.024, 0.008).at(0, 0.06, 0), // the bell
        sdf.torus(0.022, 0.006).at(0, -0.04, 0),
        sdf.torus(0.026, 0.006).at(0, 0.0, 0),
      )
      .paintWhere(sdf.box([0.2, 0.012, 0.2]).at(0, 0.0, 0), C.brassDark, 0.002)
      .paintWhere(sdf.box([0.2, 0.012, 0.2]).at(0, -0.04, 0), C.brassDark, 0.002)
      .rotateX(tilt)
      .at(-gR[0], gR[1], gR[2]);
    k.body('spyglass', glass, { color: C.brass, roughness: 0.32, metalness: 0.8, detail: 0.003, bone: 'knife.R' });

    // The folded note: two leaves with a crease, a wax seal, and ink lines; it points forward and 20 degrees up.
    const gL = h.arms.L.GRIP;
    const leaf = (side: 1 | -1) =>
      sdf.box([0.014, 0.1, 0.085], 0.004).at(side * 0.002, 0, side * 0.045).rotateX(side * -8);
    const noteShape = sdf
      .smoothUnion(0.004, leaf(1), leaf(-1))
      .paintWhere(sdf.box([0.1, 0.012, 0.01]).at(0, 0.012, 0.045), C.ink, 0.002)
      .paintWhere(sdf.box([0.1, 0.012, 0.01]).at(0, -0.008, 0.04), C.ink, 0.002)
      .paintWhere(sdf.sphere(0.011).at(0.008, -0.026, 0.05), C.seal, 0.002)
      .rotateX(-20)
      .at(gL[0], gL[1] + 0.02, gL[2] + 0.04);
    k.body('note', noteShape, { color: C.note, roughness: 0.9, detail: 0.003, bone: 'knife.L' });
  },
});
