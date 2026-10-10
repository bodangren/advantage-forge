import { profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Tanner — Chibi Quest settlement NPC (catalog `npcs/settlement/tanner`), about 1.0 m to the top of
 * the kerchief knot, faces +Z. Target: docs/npc-mockups/tanner_001.jpg. Built on the humanoid kind.
 *
 * Role: a craft NPC (the tannery by the river), seen in 3D and as a 128 px sprite; the orange
 *   kerchief, the dark apron, and the rolled hide in both fists must read.
 * One idea: a strong, cheerful tanner whose bright orange kerchief and tan hide roll stand out of a
 *   dark leather apron and tall boots.
 * Shape language: round and soft (kerchief, hide roll, boots) with the apron as the one flat form.
 * Palette (60/30/10): apron #4a3020, boots #5a3a24, trousers #7a5a3a (dark and warm); cream shirt
 *   #f0e6cc; accent kerchief #c87a3a and hide #c8a070 with #a88050 ends and a #6b4226 strap.
 * Value plan: the orange kerchief over the face and the light hide on the dark apron are the focal points.
 * Bodies: skin (the kind's face), kerchief, knot, hair, shirt, cuffs, apron, belt, pants, boots, hide, strap.
 * Rig: the humanoid kind's skeleton and clips with a two-hand `hold`; the hide and its strap are
 *   rigid on `hand.R` and stay level between the fists.
 */

// The two-hand hold (left arm; the right mirrors it): fists near the middle of the chest.
const HOLD_ELBOW = [0.155, 0.322, 0.03] as const;
const HOLD_WRIST = [0.12, 0.312, 0.15] as const;
// The hide roll: center and size, level across the chest.
const HIDE = { x: 0, y: 0.312, z: 0.178, len: 0.3, r: 0.044, tilt: 90 };

const C = {
  kerchief: '#c87a3a',
  kerchiefDark: '#a85f28',
  apron: '#4a3020',
  apronEdge: '#33200f',
  strap: '#6b4226',
  buckle: '#b0904a',
  pants: '#7a5a3a',
  boot: '#5a3a24',
  bootSole: '#33200f',
  hide: '#c8a070',
  hideEdge: '#a88050',
  hideDark: '#8a6338',
};

export default humanoidAsset({
  name: 'tanner',
  description: 'A strong, cheerful tanner in an orange kerchief and a thick leather apron, carrying a rolled leather hide.',
  reference: 'docs/npc-mockups/tanner_001.jpg',
  variants: {
    skin: { tan: '#c18556', fair: '#f2c7a4', light: '#e8b48e', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#2c1b12', black: '#1a1412', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { tan: '#d6b684', cream: '#f0e6cc', ochre: '#d8b46c', clay: '#c48466' },
  },
  presets: {
    river: { skin: 'light', hair: 'auburn', eyes: 'green', cloth: 'ochre' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  lashes: false,
  hold: { elbow: HOLD_ELBOW, wrist: HOLD_WRIST },

  extra(k, h) {
    const { SHOULDER, ELBOW, WRIST, HIP, KNEE, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];

    // ------------------------------------------------------------------ kerchief, knot, and hair
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0).bone('head');
    // The kerchief: a slanted band across the brow and the temples, with the knot on top.
    const crown = sdf.ellipsoid([0.245, 0.236, 0.228]);
    // The kerchief covers the whole crown above the band's lower edge, so no hair shows over it.
    const aboveBand = sdf.box([0.7, 0.5, 0.7], 0.01).rotateX(-14).at(0, 0.0625 + 0.25, 0);
    const kerchief = crown.smoothIntersect(0.01, aboveBand);
    // The tied knot at the left temple: a center, two small flared ends, and two loose tails hanging back.
    const knot = sdf.smoothUnion(
      0.012,
      sdf.sphere(0.036).at(0.205, 0.1, -0.078),
      sdf.ellipsoid([0.05, 0.026, 0.034]).rotateZ(-30).at(0.235, 0.135, -0.082),
      sdf.ellipsoid([0.05, 0.026, 0.034]).rotateZ(30).at(0.235, 0.065, -0.082),
      sdf.chain(
        [
          [0.215, 0.09, -0.09, 0.026],
          [0.225, 0.04, -0.13, 0.022],
          [0.215, -0.01, -0.16, 0.017],
        ],
        0.01,
      ),
      sdf.chain(
        [
          [0.21, 0.09, -0.09, 0.024],
          [0.185, 0.05, -0.15, 0.02],
          [0.16, 0.0, -0.19, 0.016],
        ],
        0.01,
      ),
    );
    k.body('kerchief', headPose(sdf.union(kerchief, knot)), {
      color: C.kerchief,
      roughness: 0.85,
      detail: 0.004,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 90 + y * 30) * Math.cos(z * 80),
    });

    // Hair: a close cap under the kerchief (temples, nape), a topknot tuft out of the knot, a short tail,
    // and 11 fringe locks over the kerchief's front edge.
    const hairColor = k.tint('hair');
    const shell = sdf.ellipsoid([0.232, 0.226, 0.214]);
    // A smooth cap over the back and the top of the skull, with a soft lower edge at the nape.
    const nape = shell.smoothIntersect(0.02, sdf.box([0.6, 0.32, 0.36], 0.04).at(0, 0.05, -0.12));
    const topCap = sdf.ellipsoid([0.234, 0.228, 0.216]).smoothIntersect(0.02, sdf.halfSpace([0, -1, 0], -0.1));
    // A fringe lock hangs from the kerchief edge down toward the brow, on the head ellipsoid.
    const onHead = (yy: number, deg: number, out: number): [number, number, number] => {
      const s = Math.sqrt(Math.max(0.05, 1 - (yy / 0.2) ** 2));
      const a = (deg * Math.PI) / 180;
      return [(0.205 + out) * s * Math.sin(a), yy, (0.19 + out) * s * Math.cos(a)];
    };
    const lock = (deg: number, top: number, bottom: number, sweep: number, r: number) => {
      const p = [top, (top * 2 + bottom) / 3, (top + bottom * 2) / 3, bottom].map((yy, i) => {
        const [x, y, z] = onHead(yy, deg + sweep * (i / 3) ** 1.5, 0.012 + 0.004 * i);
        return [x, y, z, r * (1 - 0.35 * (i / 3))] as [number, number, number, number];
      });
      return sdf.chain(p, 0.012);
    };
    const fringe = sdf.smoothUnion(
      0.015,
      lock(-62, 0.1, 0.045, -10, 0.03),
      lock(-46, 0.115, 0.06, -8, 0.026),
      lock(-31, 0.12, 0.068, 12, 0.026),
      lock(-17, 0.122, 0.072, 6, 0.024),
      lock(-4, 0.124, 0.066, 14, 0.026),
      lock(10, 0.124, 0.074, -8, 0.025),
      lock(24, 0.122, 0.07, -14, 0.026),
      lock(38, 0.118, 0.062, -6, 0.026),
      lock(52, 0.112, 0.056, 10, 0.027),
      lock(66, 0.1, 0.04, 8, 0.03),
    );
    const sideburns = sdf
      .smoothUnion(0.012, lock(72, 0.09, -0.02, 3, 0.03), lock(94, 0.085, -0.04, 6, 0.032), lock(116, 0.075, -0.06, 8, 0.034))
      .mirror('x');
    // Hair shows only below the kerchief's lower edge, plus the tuft out of the back.
    const hair = sdf.smoothUnion(0.012, nape, topCap, fringe, sideburns).subtract(kerchief.round(0.004));
    k.body('hair', headPose(hair), { color: hairColor, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ shirt: sleeves rolled to the elbow
    const upper = sdf.cone(lerp(SHOULDER, ELBOW, -0.1), lerp(ELBOW, WRIST, -0.1), 0.049, 0.05).bone('upperarm.L');
    const shirtShape = sdf
      .smoothUnion(0.012, h.weighted(h.torso.round(0.004)), pair(upper))
      .intersect(sdf.halfSpace([0, -1, 0], -0.2).union(pair(upper).scale(1)));
    k.body('shirt', shirtShape, { color: h.tint.shirt ?? '#d6b684', roughness: 0.88, detail: 0.005 });

    // The rolled cuffs at the elbows and the open collar, in a darker shade of the shirt color.
    const trim = k.tint('cloth', { color: '#b8956a', follow: 1 });
    const cuff = sdf.cone(lerp(ELBOW, WRIST, -0.24), lerp(ELBOW, WRIST, -0.02), 0.059, 0.059).round(0.006).bone('upperarm.L');
    const collar = sdf
      .torus(0.062, 0.017)
      .scale([1, 1, 1])
      .at(0, 0.452, -0.014)
      .subtract(sdf.box([0.07, 0.1, 0.1]).rotateX(-35).at(0, 0.435, 0.07))
      .bone('chest');
    k.body('cuffs', sdf.union(pair(cuff), collar), { color: trim, roughness: 0.9, detail: 0.004 });

    // Thick bare forearms below the rolled sleeves.
    const forearm = sdf.cone(lerp(ELBOW, WRIST, -0.1), lerp(ELBOW, WRIST, 0.92), 0.054, 0.046).bone('forearm.L');
    k.body('forearms', pair(forearm), { color: k.tint('skin'), roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ apron: bib, neck strap, belt, skirt
    const shell2 = h.torso.round(0.012).subtract(h.torso.round(-0.003));
    const front = (x: number, y0: number, y1: number) => sdf.box([2 * x, y1 - y0, 0.4], 0.012).at(0, (y0 + y1) / 2, 0.2);
    const bib = shell2.intersect(front(0.084, 0.265, 0.425));
    const neckStrap = shell2
      .intersect(sdf.box([0.034, 0.5, 0.6]).rotateZ(-8).at(0.07, 0.4, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.33))
      .intersect(sdf.halfSpace([0, 1, 0], 0.5))
      .bone('chest');
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.29],
            [0.138, 0.29],
            [0.15, 0.25],
            [0.158, 0.21],
            [0.17, 0.2],
            [0.178, 0.17],
            [0, 0.17],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.8]);
    const skirtInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.123, 0.3],
            [0.135, 0.25],
            [0.143, 0.21],
            [0.155, 0.2],
            [0.162, 0.16],
            [0, 0.16],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.78]);
    const skirt = skirtOuter.subtract(skirtInner).intersect(sdf.box([0.29, 0.27, 0.4], 0.025).at(0, 0.2, 0.2));
    // The stitched hem and a round maker's stamp on the bib.
    const stampZ = sdf.raycast(h.torso, [0, 0.36, 1], [0, 0, -1])?.[2] ?? 0.1;
    const stamp = sdf.torus(0.03, 0.006).rotateX(90).at(0, 0.36, stampZ + 0.012);
    const apron = sdf
      .smoothUnion(0.008, h.weighted(bib), pair(neckStrap), h.weighted(skirt))
      .paintWhere(h.band(0.162, 0.178), C.apronEdge, 0.002)
      .paintWhere(stamp, C.strap, 0.003);
    k.body('apron', apron, { color: C.apron, roughness: 0.78, detail: 0.005, bump: (x, y, z) => 0.0025 * Math.sin(x * 70 + y * 50) * Math.sin(z * 60 + x * 20) });

    // A belt over the apron with a brass buckle, and a stamp ring.
    const beltOuter = h.torso.round(0.024).intersect(h.band(0.262, 0.292));
    const belt = h.weighted(beltOuter.subtract(h.torso.round(0.006)));
    const buckleZ = sdf.raycast(h.torso.round(0.024), [0, 0.277, 1], [0, 0, -1])?.[2] ?? 0.12;
    const buckle = sdf.box([0.05, 0.036, 0.012], 0.005).at(0, 0.277, buckleZ).bone('chest');
    k.body('belt', belt, { color: C.strap, roughness: 0.7, detail: 0.004 });
    k.body('buckle', buckle, { color: C.buckle, roughness: 0.4, metalness: 0.8, detail: 0.003 });

    // ------------------------------------------------------------------ trousers and tall boots
    const trouserLeg = sdf.smoothUnion(
      0.012,
      sdf.capsule(HIP, KNEE, 0.05).bone('leg.L'),
      sdf.cone(KNEE, [ANKLE[0], 0.1, 0.002], 0.048, 0.046).bone('shin.L'),
    );
    k.body('pants', sdf.smoothUnion(0.03, h.weighted(h.torso.round(0.006).intersect(h.band(0.15, 0.2))), pair(trouserLeg)), {
      color: C.pants,
      roughness: 0.85,
    });
    const BOOT_TOP = 0.118;
    const shaft = sdf
      .smoothUnion(
        0.012,
        sdf.cone([ANKLE[0], 0.05, 0.0], [ANKLE[0], BOOT_TOP, 0.0], 0.054, 0.058),
        sdf.cone([ANKLE[0], BOOT_TOP - 0.02, 0.0], [ANKLE[0], BOOT_TOP, 0.0], 0.057, 0.063), // the folded cuff
      )
      .bone('shin.L');
    const bootFoot = sdf
      .smoothUnion(
        0.025,
        sdf.ellipsoid([0.058, 0.044, 0.1]).at(0, 0.042, 0.04),
        sdf.sphere(0.053).at(0, 0.06, -0.005),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = bootFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.016)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf
      .union(bootFoot.bone('foot.L'), sole.paint(C.bootSole).bone('foot.L'))
      .rotateY(10)
      .at(ANKLE[0], 0, 0);
    k.body('boots', sdf.union(pair(shaft), pair(boot)), { color: C.boot, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the rolled hide and its strap
    // The hide stands diagonal against the chest (top toward the right shoulder), built upright at the
    // origin and tilted into place. The right fist grips its middle.
    const { len, r } = HIDE;
    const half = len / 2;
    const place = (sh: sdf.Shape) => sh.rotateZ(HIDE.tilt).at(HIDE.x, HIDE.y, HIDE.z);
    const rollProfile = profile.polygon(
      [
        [0, -half],
        [r * 0.78, -half],
        [r * 1.12, -half + 0.012],
        [r * 1.02, -half + 0.05],
        [r, -half + 0.1],
        [r, half - 0.1],
        [r * 1.02, half - 0.05],
        [r * 1.12, half - 0.012],
        [r * 0.78, half],
        [0, half],
      ],
      { smooth: true, samples: 5 },
    );
    const tube = sdf.revolve(rollProfile);
    const ends = sdf.union(
      sdf.cylinder(r * 1.2, 0.02).at(0, -half + 0.004, 0),
      sdf.cylinder(r * 1.2, 0.02).at(0, half - 0.004, 0),
    );
    const endFace = sdf.union(
      sdf.cylinder(r * 0.55, 0.03).at(0, -half, 0),
      sdf.cylinder(r * 0.55, 0.03).at(0, half, 0),
    );
    const hideShape = place(tube.paintWhere(ends, C.hideEdge, 0.004).paintWhere(endFace, C.hideDark, 0.006)).bone('hand.R');
    k.body('hide', hideShape, {
      color: C.hide,
      roughness: 0.65,
      detail: 0.004,
      bump: (x, y, z) => 0.003 * Math.sin(x * 40 + y * 30) * Math.cos(z * 45) + 0.002 * Math.sin(y * 110),
    });

    // Two tie straps around the roll, with a small knot and a hanging end on the front one.
    const strapRing = (y: number) => sdf.torus(r + 0.004, 0.009).at(0, y, 0);
    const knotAt = sdf.smoothUnion(
      0.006,
      sdf.sphere(0.014).at(0.01, -0.045, r + 0.012),
      sdf.capsule([0.01, -0.045, r + 0.012], [0.005, -0.09, r + 0.01], 0.008),
    );
    const straps = place(sdf.smoothUnion(0.004, strapRing(-0.045), strapRing(0.07), knotAt)).bone('hand.R');
    k.body('strap', straps, { color: C.strap, roughness: 0.7, detail: 0.003 });
  },
});
