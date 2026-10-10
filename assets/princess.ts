import { noise, profile, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Princess — Chibi Quest court NPC (catalog `npcs/court-and-faction/princess`), about 1.0 m to the
 * top of the hair puffs, faces +Z. Target: docs/npc-mockups/princess_001.jpg. Built on the humanoid kind.
 *
 * Role: a palace NPC who gives garden and rescue quests, seen in 3D and as a 128 px sprite; the two
 *   black puffs, the gold tiara, the pink gown, and the bouquet held out must read.
 * One idea: a cheerful girl whose two big black curl puffs and small gold tiara sit over a rose pink
 *   gown, with a bright bouquet held out in front.
 * Shape language: round and soft (curls, puffed sleeves, flared skirt), small points in the tiara.
 * Palette (60/30/10): rose pink #d87a9a (gown, shoes); black #231a17 (hair); gold #e0b040 (tiara, sash,
 *   trims) with a #e86a9a jewel; skin #8a5a3e; flowers #f6f1ea and #f0c840, leaves #3f6a44.
 * Value plan: the dark hair frames the face; the bright bouquet and the gold trim are the accents.
 * Bodies: skin, hair, bows, gown, ruffle, gold, jewel, shoes, stems, flowers, ribbon.
 * Rig: the humanoid kind's skeleton and clips; the right arm holds a rest pose with the bouquet rigid
 *   on `knife.R`. The skirt is short (above the knee) because the mockup shows a short flared skirt.
 */

const C = {
  hair: '#231a17',
  gold: '#e0b040',
  gown: '#d87a9a',
  jewel: '#e86a9a',
  bow: '#e86a9a',
  white: '#f6f1ea',
  yellow: '#f0c840',
  leaf: '#3f6a44',
  sole: '#a8506e',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
};

export default humanoidAsset({
  name: 'princess',
  description: 'A kind, adventurous young princess with two curly puffs, a gold tiara, a rose pink gown, and a bouquet.',
  reference: 'docs/npc-mockups/princess_001.jpg',
  variants: {
    skin: { brown: '#8a5a3e', fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', deep: '#5e3b28' },
    hair: { black: '#231a17', brown: '#5a301d', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { rose: '#d87a9a', peach: '#e49a7a', lavender: '#b18ac4', coral: '#d8707a' },
  },
  presets: {
    royal: { skin: 'brown', hair: 'black', eyes: 'brown', cloth: 'rose' },
    meadow: { skin: 'light', hair: 'auburn', eyes: 'green', cloth: 'lavender' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  // The right hand held out in front at chest height (left-side values; the kind mirrors R).
  pose: { R: { elbow: [0.17, 0.335, 0.05], wrist: [0.2, 0.33, 0.15] } },

  // A bright closed-corner smile with a white tooth band, and thick arched brows.
  paintSkin(skin, h) {
    const y = 0.536;
    const grin = profile.polygon(
      [
        [-0.048, 0.012],
        [-0.026, 0.003],
        [0, 0.0],
        [0.026, 0.003],
        [0.048, 0.012],
        [0.04, -0.01],
        [0.02, -0.025],
        [0, -0.029],
        [-0.02, -0.025],
        [-0.04, -0.01],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.006))).intersect(sdf.box([0.056, 0.1, 1]).at(0, y - 0.004, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.02, 0.01, 0.08]), 0, y - 0.024);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.017, 56, 124), 0.3).at(0.1, 0.654, 0.1).mirror('x');
    const dot = h.onFace(sdf.ellipsoid([0.01, 0.014, 0.1]), 0, 0.636);
    return skin
      .paintWhere(dot, '#2e1a12', 0.002)
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ELBOW, WRIST, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const rad = Math.PI / 180;
    const hairColor = k.tint('hair');
    const pink = k.tint('cloth', { color: '#d87a9a', follow: 1 });

    // ------------------------------------------------------------------ hair: a cap of curl lobes and two puffs
    const hp = (s: sdf.Shape) => s.at(0, HEAD_Y, 0); // head-local frame
    const shell = sdf.ellipsoid([0.212, 0.207, 0.197]);
    const above = (y: number) => sdf.halfSpace([0, -1, 0], -y); // solid where y >= value
    const fringeZone = shell.smoothIntersect(0.02, above(0.075));
    const sides = shell.smoothIntersect(0.02, above(-0.015)).smoothIntersect(0.02, sdf.halfSpace([0, 0, 1], 0.07));
    const nape = shell
      .smoothIntersect(0.02, above(-0.075))
      .smoothIntersect(0.02, sdf.box([0.3, 1, 0.2]).at(0, 0, -0.14));
    const lobe = (azDeg: number, y: number, r: number) => {
      const f = Math.sqrt(Math.max(0.05, 1 - (y / 0.207) ** 2));
      const a = azDeg * rad;
      return sdf.sphere(r).at(0.216 * f * Math.sin(a), y, 0.2 * f * Math.cos(a));
    };
    const lobes: sdf.Shape[] = [];
    for (let a = -72; a <= 72; a += 16) lobes.push(lobe(a, 0.105 + 0.006 * Math.cos(a * 0.12), 0.032)); // the fringe
    for (let a = -160; a <= 160; a += 40) lobes.push(lobe(a, 0.15, 0.03));
    for (const a of [0, 90, 180, 270]) lobes.push(lobe(a, 0.19, 0.028));
    for (const s of [-1, 1]) {
      lobes.push(lobe(s * 66, 0.065, 0.031), lobe(s * 92, 0.045, 0.031), lobe(s * 112, 0.03, 0.031)); // framing the face
    }
    for (let a = 130; a <= 230; a += 25) lobes.push(lobe(a, -0.02, 0.032));
    for (let a = 150; a <= 210; a += 20) lobes.push(lobe(a, -0.062, 0.03));
    const capHair = hp(sdf.smoothUnion(0.014, fringeZone, sides, nape, ...lobes)).bone('head');

    // A puff: a round core with a ring of curl lobes, on each side of the crown.
    const dirs: [number, number, number][] = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1],
      [0.7, 0.7, 0], [-0.7, 0.7, 0], [0, 0.7, 0.7], [0, 0.7, -0.7], [0.6, 0, 0.6], [0.6, 0, -0.6], [-0.6, 0, 0.6],
    ];
    const P = [0.18, 0.895, -0.035] as const;
    const puffL = sdf.smoothUnion(
      0.016,
      sdf.sphere(0.092).at(...P),
      sdf.sphere(0.065).at(0.158, 0.83, -0.03),
      ...dirs.map(([x, y, z], i) => sdf.sphere(i < 5 ? 0.058 : 0.046).at(P[0] + x * 0.088, P[1] + y * 0.088, P[2] + z * 0.088)),
    );
    const hair = sdf.smoothUnion(0.012, capHair, puffL.mirror('x', 0).bone('head'));
    k.body('hair', hair, { color: hairColor, roughness: 0.65, detail: 0.005, bump: (x, y, z) => 0.004 * noise.fbm(x * 70, y * 70, z * 70, 2) });

    // Pink bows at the base of the puffs.
    const bowL = sdf
      .smoothUnion(
        0.006,
        sdf.ellipsoid([0.026, 0.016, 0.012]).rotateZ(25).at(0.158, 0.842, 0.04),
        sdf.ellipsoid([0.026, 0.016, 0.012]).rotateZ(-25).at(0.158 + 0.012, 0.806, 0.04),
        sdf.sphere(0.012).at(0.158, 0.826, 0.044),
      )
      .bone('head');
    k.body('bows', bowL.mirror('x', 0), { color: C.bow, roughness: 0.55, detail: 0.004 });

    // ------------------------------------------------------------------ the tiara: a thin gold arch with a jewel
    const wire = hp(
      sdf.smoothUnion(
        0.006,
        sdf.chain(
          [
            [-0.13, 0.12, 0.13, 0.0075],
            [-0.08, 0.152, 0.158, 0.0075],
            [-0.04, 0.17, 0.168, 0.0075],
            [0, 0.178, 0.172, 0.0075],
            [0.04, 0.17, 0.168, 0.0075],
            [0.08, 0.152, 0.158, 0.0075],
            [0.13, 0.12, 0.13, 0.0075],
          ],
          0.01,
        ),
        sdf.sphere(0.013).at(-0.075, 0.188, 0.158),
        sdf.sphere(0.013).at(0.075, 0.188, 0.158),
        sdf.sphere(0.012).at(-0.128, 0.138, 0.13),
        sdf.sphere(0.012).at(0.128, 0.138, 0.13),
        sdf.cone([0, 0.176, 0.172], [0, 0.208, 0.174], 0.016, 0.006),
      ),
    ).bone('head');
    const jewel = hp(sdf.ellipsoid([0.02, 0.024, 0.014]).at(0, 0.19, 0.18)).bone('head');
    k.body('jewel', jewel, { color: C.jewel, roughness: 0.15, detail: 0.003, flat: true });

    // ------------------------------------------------------------------ gown: bodice, puffed sleeves, flared skirt
    const bodice = h.weighted(h.torso.round(0.009).intersect(h.band(0.26, 0.446)));
    const sleeve = h.perArm((j) => {
      const c = lerp(SHOULDER, j.ELBOW, 0.18);
      return sdf
        .smoothUnion(0.012, sdf.ellipsoid([0.058, 0.054, 0.058]).at(c[0] + 0.012, c[1] - 0.005, c[2]), sdf.cone(c, lerp(SHOULDER, j.ELBOW, 0.5), 0.055, 0.05))
        .bone('upperarm.L');
    });
    const flare = (pts: [number, number][]) => sdf.revolve(profile.polygon(pts, { smooth: true, samples: 8 })).scale([1, 1, 0.9]);
    const skirtOuter = flare([[0, 0.34], [0.11, 0.34], [0.126, 0.3], [0.152, 0.26], [0.19, 0.215], [0.22, 0.17], [0, 0.17]]);
    const skirtInner = flare([[0, 0.35], [0.098, 0.35], [0.114, 0.3], [0.14, 0.26], [0.178, 0.215], [0.208, 0.17], [0, 0.16]]);
    const skirt = skirtOuter.subtract(skirtInner);
    const gown = sdf
      .smoothUnion(0.01, bodice, sleeve, h.weighted(skirt))
      .paintWhere(h.band(0.18, 0.19), C.gold, 0.002)
      .paintWhere(h.band(0.288, 0.322), C.gold, 0.002)
      .paintWhere(h.band(0.435, 0.446), C.gold, 0.002);
    k.body('gown', gown, { color: h.tint.shirt ?? C.gown, roughness: 0.8, detail: 0.005 });

    // The lower gold ruffle with a scalloped hem.
    const ruffleOuter = flare([[0, 0.2], [0.196, 0.2], [0.226, 0.17], [0.244, 0.135], [0, 0.135]]);
    const ruffleInner = flare([[0, 0.21], [0.184, 0.21], [0.213, 0.17], [0.23, 0.125], [0, 0.125]]);
    const scallops = sdf.union(
      ...Array.from({ length: 18 }, (_, i) => {
        const a = ((i + 0.5) / 18) * 2 * Math.PI;
        return sdf.sphere(0.022).at(0.25 * Math.sin(a), 0.124, 0.25 * 0.9 * Math.cos(a));
      }),
    );
    const ruffle = h.weighted(ruffleOuter.subtract(ruffleInner).subtract(scallops));
    k.body('ruffle', ruffle, { color: '#e8b04a', roughness: 0.75, detail: 0.004 });

    // ------------------------------------------------------------------ gold: sash, heart, bangle
    const chestZ = sdf.raycast(h.torso.round(0.009), [0, 0.405, 1], [0, 0, -1])?.[2] ?? 0.09;
    const heart = sdf
      .smoothUnion(
        0.004,
        sdf.sphere(0.011).at(-0.007, 0.01, 0),
        sdf.sphere(0.011).at(0.007, 0.01, 0),
        sdf.cone([0, -0.014, 0], [0, 0.006, 0], 0.002, 0.015),
      )
      .scale([1, 1, 0.55])
      .at(0, 0.405, chestZ + 0.004)
      .bone('chest');
    k.body('gold', sdf.union(heart, wire), { color: C.gold, roughness: 0.35, metalness: 0.8, detail: 0.004 });

    // ------------------------------------------------------------------ pink shoes
    const shoeFoot = sdf
      .smoothUnion(0.03, sdf.cylinder(0.044, 0.03, 0.012).at(0, 0.03, 0), sdf.ellipsoid([0.056, 0.034, 0.098]).at(0, 0.03, 0.045))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = shoeFoot.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.014)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const strap = sdf.torus(0.046, 0.006).at(0, 0.05, 0.0).intersect(sdf.halfSpace([0, 0, -1], 0.02));
    const shoe = sdf
      .union(shoeFoot, sole.paint(C.sole), strap.paint('#f2a0b8'))
      .rotateY(12)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: pink, roughness: 0.55 });

    // ------------------------------------------------------------------ the bouquet in the right fist
    // Built upright around the grip (origin), tilted back like the fist, and placed at the posed grip (x < 0).
    const G = h.arms.R.GRIP;
    const place = (s: sdf.Shape) => s.scale(1.25).rotateX(-20).at(-G[0], G[1], G[2]).bone('knife.R');
    const heads: { p: [number, number, number]; white: boolean }[] = [
      { p: [0, 0.158, 0], white: true },
      { p: [-0.035, 0.132, 0.01], white: false },
      { p: [0.035, 0.134, -0.008], white: true },
      { p: [0.008, 0.128, 0.04], white: false },
      { p: [0.006, 0.13, -0.04], white: false },
      { p: [-0.03, 0.15, -0.025], white: true },
    ];
    const flower = (p: [number, number, number], white: boolean) => {
      const petal = white ? C.white : C.yellow;
      const centre = white ? C.yellow : '#f4e0a0';
      const ring = sdf.smoothUnion(
        0.006,
        ...[0, 72, 144, 216, 288].map((a) => sdf.ellipsoid([0.0145, 0.0095, 0.0145]).at(0.0135 * Math.sin(a * rad), 0, 0.0135 * Math.cos(a * rad))),
      );
      const hx = p[0];
      const hz = p[2];
      const len = Math.hypot(hx, hz) || 1;
      return sdf
        .union(ring.paint(petal), sdf.ellipsoid([0.0105, 0.009, 0.0105]).at(0, 0.006, 0).paint(centre))
        .rotateZ(-40 * (hx / len))
        .rotateX(40 * (hz / len))
        .at(...p);
    };
    const stems = sdf.smoothUnion(
      0.006,
      sdf.chain([[0, -0.075, 0, 0.012], [0, 0.03, 0, 0.011]], 0.01),
      ...heads.map(({ p }) => sdf.chain([[0, 0.03, 0, 0.006], [p[0] * 0.5, 0.075, p[2] * 0.5, 0.005], [p[0], p[1] - 0.01, p[2], 0.005]], 0.006)),
    );
    const leaf = (az: number) => sdf.ellipsoid([0.03, 0.007, 0.0125]).at(0.03, 0, 0).rotateZ(35).rotateY(az).at(0, 0.075, 0);
    const leaves = sdf.union(...[30, 120, 205, 290].map(leaf));
    k.body('stems', place(sdf.union(stems, leaves).paint(C.leaf)), { color: C.leaf, roughness: 0.7, detail: 0.003 });
    k.body('flowers', place(sdf.union(...heads.map(({ p, white }) => flower(p, white)))), { color: C.white, roughness: 0.6, detail: 0.003 });
    const ribbon = sdf.union(
      sdf.torus(0.018, 0.0065).at(0, 0.05, 0),
      sdf.ellipsoid([0.016, 0.007, 0.009]).at(0.017, 0.062, 0),
      sdf.ellipsoid([0.016, 0.007, 0.009]).at(-0.017, 0.062, 0),
      sdf.chain([[0.004, 0.046, 0.016, 0.005], [0.014, 0.025, 0.022, 0.004]], 0.004),
      sdf.chain([[-0.004, 0.046, 0.016, 0.005], [-0.014, 0.025, 0.022, 0.004]], 0.004),
    );
    k.body('ribbon', place(ribbon), { color: C.bow, roughness: 0.5, detail: 0.003 });
  },
});
