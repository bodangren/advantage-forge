import { mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Herbalist — Chibi Quest settlement NPC (catalog `npcs/settlement/herbalist`), about 0.95 m to the
 * top of the headscarf, faces +Z. Target: docs/npc-mockups/herbalist_001.jpg. Built on the humanoid kind.
 *
 * Role: a village and forest-edge NPC who sells herbs and potions; seen in 3D and as a 128 px sprite.
 *   The green headscarf, the long braid, and the basket of flowers must read.
 * One idea: a gentle girl in muted greens whose full wicker basket (pink and yellow flowers) is the
 *   one bright spot.
 * Shape language: round and soft (scarf, braid, basket, leaves), the laced bodice is the small hard form.
 * Palette (60/30/10): olive #5a6236 (dress), dark olive #3d4a30 (scarves); brown #6b4226 (bodice, pouch),
 *   #5a3a24 (boots), #6b3e22 (hair); basket #b08a50 / #8a6a3a; accents pink #f0a0b0 and yellow #f0d060.
 * Value plan: dark scarf over the light face, mid sage dress, the pale basket and flowers at the hip.
 * Bodies: skin, hair, braid, headscarf, neck scarf, dress, bodice, pouch, boots, basket, herbs, flowers.
 * Rig: the humanoid kind's skeleton and clips. The basket, herbs, and flowers are rigid on `knife.L`
 *   (the left fist); the right arm hangs free.
 */

const C = {
  scarf: '#27321f',
  scarfNeck: '#2f3c26',
  bodice: '#6b4226',
  lace: '#d8bd86',
  boot: '#5a3a24',
  bootCuff: '#7a5434',
  stocking: '#cdbb98',
  basket: '#b08a50',
  weave: '#8a6a3a',
  herb: '#4e6a30',
  herbDark: '#37502a',
  pink: '#f0a0b0',
  yellow: '#f0d060',
  pinkHeart: '#f4cf72',
  clasp: '#d6b34e',
};

// The basket hangs from the left fist: the rim center, its radius, and its depth.
// The two-hand hold: the elbows bent and the fists at the sides of the basket, at waist height.
const HOLD_ELBOW = [0.16, 0.32, 0.045] as const;
const HOLD_WRIST = [0.1, 0.275, 0.13] as const;

export default humanoidAsset({
  name: 'herbalist',
  description: 'A gentle young herbalist in a green headscarf and a sage dress, carrying a wicker basket of herbs and flowers.',
  reference: 'docs/npc-mockups/herbalist_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#6b3e22', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { sage: '#5a6236', indigo: '#4f6a7a', heather: '#8a6a86', ochre: '#a8884a' },
  },
  presets: {
    meadow: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'heather' },
  },
  hair: false,
  undershirt: false,
  pants: C.stocking,
  shoes: false,
  hold: { elbow: HOLD_ELBOW, wrist: HOLD_WRIST },

  // Thinner, higher brows read as a girl's face: the kind's straight brows are painted over with skin.
  paintSkin(skin, h) {
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.009, 58, 122), 0.3).at(0.1, 0.654, 0.1).mirror('x');
    return skin.paintWhere(oldBrows, h.tint.skin!, 0.002).paintWhere(brows, h.tint.brow!, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const G = h.arms.L.GRIP;
    const BASKET = { x: 0, y: G[1] + 0.015, z: G[2] + 0.065, r: 0.105, depth: 0.09 };
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const dress = h.tint.shirt ?? '#6f8a5a';
    const trim = k.tint('cloth', { color: '#7a8556', follow: 1 });

    // ------------------------------------------------------------------ hair under the headscarf
    // A cap a little larger than the skull, open at the face in an arch (a soft part at the brow), and
    // cut by a slanted plane below the scarf's edge so the hair shows at the forehead and temples.
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const faceMask = sdf.ellipsoid([0.15, 0.135, 0.12]).at(0, -0.082, 0.175);
    const lowCut = sdf.halfSpace([0, -1, 0.586], 0.06 / 1.159);
    const earCut = pair(sdf.ellipsoid([0.05, 0.06, 0.05]).at(0.2, -0.065, -0.01));
    const cap = sdf
      .ellipsoid([0.213, 0.207, 0.197])
      .smoothIntersect(0.03, lowCut)
      .smoothSubtract(0.03, faceMask, earCut);
    // Long locks that frame the face: from the part, past the temples and cheeks, to the chin.
    const lock = pair(
      sdf.chain(
        [
          [0.04, 0.095, 0.185, 0.022],
          [0.11, 0.07, 0.165, 0.025],
          [0.17, 0.0, 0.12, 0.027],
          [0.188, -0.07, 0.085, 0.026],
          [0.18, -0.13, 0.07, 0.022],
          [0.168, -0.175, 0.07, 0.014],
        ],
        0.035,
      ),
    );
    const hair = headPose(sdf.smoothUnion(0.035, cap, lock)).bone('head');
    k.body('hair', hair, { color: hairColor, roughness: 0.6, detail: 0.005 });

    // The braid: woven segments at the side of the right shoulder, tied with a band at the end.
    const spine: [number, number, number, number][] = [
      [-0.165, 0.565, -0.02, 0.03],
      [-0.195, 0.51, -0.005, 0.034],
      [-0.225, 0.45, 0.0, 0.036],
      [-0.245, 0.39, 0.0, 0.037],
      [-0.25, 0.335, 0.0, 0.036],
      [-0.242, 0.285, 0.0, 0.033],
      [-0.23, 0.245, 0.0, 0.029],
    ];
    const segments = spine.slice(1).map(([x, y, z, r], i) =>
      sdf
        .ellipsoid([r * 1.05, r * 1.0, r * 1.2])
        .rotateZ(i % 2 ? 38 : -38)
        .at(x + (i % 2 ? 0.006 : -0.006), y, z),
    );
    const braidCore = sdf.chain(spine.map(([x, y, z, r]) => [x, y, z, r * 0.8] as [number, number, number, number]), 0.03);
    const tip = sdf.chain([[-0.23, 0.225, 0.0, 0.02], [-0.22, 0.195, 0.0, 0.024], [-0.205, 0.172, 0.0, 0.016]], 0.02);
    k.body('braid', sdf.smoothUnion(0.006, braidCore, ...segments, tip).bone('chest'), { color: hairColor, roughness: 0.6, detail: 0.004 });
    k.body('braid-tie', sdf.torus(0.026, 0.009).rotateX(8).at(-0.23, 0.228, 0.0).bone('chest'), { color: '#c8a060', roughness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ headscarf: a close cap tied at the nape
    // The slanted front edge sits at the brow and drops to the nape; a soft knot with two tails ties it.
    const scarfCut = sdf.halfSpace([0, -1, 0.586], -0.012 / 1.159);
    const scarfCap = sdf
      .ellipsoid([0.222, 0.214, 0.205])
      .at(0, 0.002, -0.008)
      .smoothIntersect(0.012, scarfCut)
      .smoothIntersect(0.012, sdf.halfSpace([0, 1, 0], 0.27));
    // A small flat knot at the nape with two short ends that lie against the neck.
    const knot = sdf.smoothUnion(0.015, sdf.ellipsoid([0.04, 0.032, 0.03]).at(0, -0.075, -0.2), sdf.sphere(0.022).at(0, -0.08, -0.215));
    const endL = sdf.chain([[0.015, -0.085, -0.21, 0.02], [0.05, -0.115, -0.2, 0.021], [0.07, -0.145, -0.185, 0.014]], 0.02);
    // The kerchief drapes lower at the back of the head, over the nape.
    const drape = sdf
      .ellipsoid([0.19, 0.115, 0.125])
      .at(0, -0.075, -0.095)
      .smoothIntersect(0.02, sdf.halfSpace([0, 0, -1], 0.01));
    const folded = sdf
      .smoothUnion(0.02, scarfCap, drape, knot, endL.mirror('x'))
      .displace(0.004, (x, y, z) => noise.fbm(x * 16 + 3, y * 9, z * 16, 2));
    const scarf = headPose(folded).bone('head');
    k.body('headscarf', scarf, { color: C.scarf, roughness: 0.8, detail: 0.005 });

    // The neck scarf: a soft double cowl under the chin.
    const cowl = sdf.smoothUnion(
      0.02,
      sdf.torus(0.074, 0.038).scale([1, 1, 0.92]).at(0, 0.462, -0.008),
      sdf.torus(0.095, 0.033).scale([1, 1, 0.92]).at(0, 0.438, -0.005),
      sdf.ellipsoid([0.075, 0.032, 0.04]).at(0, 0.452, 0.065),
    );
    k.body('neck-scarf', cowl.bone('chest'), { color: C.scarfNeck, roughness: 0.92, detail: 0.005 });

    // ------------------------------------------------------------------ dress: a long flared dress below the knee, long sleeves
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.86), 0.043, 0.041).bone('forearm.L'),
      ),
    );
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.72), lerp(j.ELBOW, j.WRIST, 0.99), 0.046, 0.047).round(0.002).bone('forearm.L'));
    const skirtOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, 0.3],
            [0.13, 0.3],
            [0.14, 0.25],
            [0.158, 0.2],
            [0.185, 0.15],
            [0.212, 0.105],
            [0, 0.105],
          ],
          { smooth: true, samples: 8 },
        ),
      )
      .scale([1, 1, 0.9]);
    const bodyDress = h.weighted(h.torso.round(0.008).smoothIntersect(0.01, h.band(0.152, 0.452)));
    const dressShape = sdf
      .smoothUnion(0.02, bodyDress, h.weighted(skirtOuter), sleeve)
      .paintWhere(h.band(0.105, 0.128), trim, 0.004);
    k.body('dress', dressShape, { color: dress, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(x * 70 + y * 50) * Math.cos(z * 60) });
    k.body('cuffs', cuffs, { color: trim, roughness: 0.9, detail: 0.004 });

    // The small laced bodice: a narrow brown stay up the chest, under the neck scarf, and a thin waist cord.
    const shell = h.torso.round(0.024).subtract(h.torso.round(0.0));
    const stay = shell.intersect(sdf.box([0.13, 0.17, 0.5], 0.012).at(0, 0.335, 0.25));
    const laceBars = sdf.union(
      ...[0.27, 0.3, 0.33, 0.36, 0.39].flatMap((y) => [
        sdf.box([0.048, 0.008, 0.2]).rotateZ(35).at(0, y, 0.17),
        sdf.box([0.048, 0.008, 0.2]).rotateZ(-35).at(0, y, 0.17),
      ]),
    );
    k.body('bodice', h.weighted(stay).paintWhere(laceBars, C.lace, 0.002), { color: C.bodice, roughness: 0.75, detail: 0.004 });

    // The pouch at the right hip, with a flap and a small clasp, on a thin belt strap.
    const pouchBox = sdf.box([0.05, 0.08, 0.07], 0.014);
    const flap = sdf.box([0.054, 0.03, 0.074], 0.01).at(0.001, 0.027, 0);
    const pouch = sdf.smoothUnion(0.006, pouchBox, flap).rotateZ(-6).at(0.18, 0.17, 0.035).bone('hips');
    const belt = sdf.cylinder(0.139, 0.012, 0.005).scale([1, 1, 0.8]).at(0, 0.248, 0).bone('spine');
    k.body('pouch', sdf.union(pouch, belt), { color: C.bodice, roughness: 0.75, detail: 0.004 });
    k.body('clasp', sdf.sphere(0.011).at(0.207, 0.162, 0.035).bone('hips'), { color: C.clasp, roughness: 0.4, metalness: 0.7, detail: 0.003 });

    // ------------------------------------------------------------------ boots: ankle height, with a turned cuff
    const bootBody = sdf
      .smoothUnion(
        0.025,
        sdf.cylinder(0.052, 0.1, 0.016).at(0, 0.05, 0),
        sdf.ellipsoid([0.058, 0.05, 0.1]).at(0, 0.048, 0.045),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const bootCuff = sdf.cylinder(0.057, 0.024, 0.01).at(0, 0.088, 0);
    const sole = bootBody.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.014)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const boot = sdf.union(bootBody, bootCuff.paint(C.bootCuff), sole.paint('#3a2418')).rotateY(10).at(ANKLE[0], 0, 0).bone('foot.L');
    k.body('boots', pair(boot), { color: C.boot, roughness: 0.65, detail: 0.005 });

    // ------------------------------------------------------------------ the wicker basket, on the left fist
    // A shallow bowl with a rim, an arched handle that the fist grips, and a woven pattern.
    const { x: bx, y: by, z: bz, r: br, depth: bd } = BASKET;
    const bowlOuter = sdf.revolve(
      profile.polygon(
        [
          [0, -bd],
          [br * 0.6, -bd],
          [br * 0.82, -bd * 0.7],
          [br * 0.96, -bd * 0.3],
          [br, 0.004],
          [br, 0.014],
          [0, 0.014],
        ],
        { smooth: true, samples: 8 },
      ),
    );
    const bowlInner = sdf.revolve(
      profile.polygon(
        [
          [0, -bd + 0.016],
          [br * 0.56, -bd + 0.016],
          [br * 0.78, -bd * 0.7],
          [br * 0.92, -bd * 0.3],
          [br * 0.93, 0.02],
          [0, 0.02],
        ],
        { smooth: true, samples: 8 },
      ),
    );
    const rim = sdf.torus(br - 0.004, 0.011).at(0, 0.006, 0);
    const handleHalf = sdf.torus(br, 0.017).rotateX(90).intersect(sdf.halfSpace([0, -1, 0], 0.001));
    const basketShape = sdf
      .smoothUnion(0.008, bowlOuter.subtract(bowlInner), rim, handleHalf)
      .at(bx, by, bz)
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(z - bz, x - bx);
        const row = Math.floor((y - by) / 0.022);
        const cell = Math.floor((a * br * 1.0) / 0.026 + (row % 2 ? 0.5 : 0));
        return (row + cell) % 2 === 0 ? rgb(C.weave) : base;
      })
      .bone('hand.R');
    k.body('basket', basketShape, {
      color: C.basket,
      roughness: 0.85,
      detail: 0.005,
      bump: (x, y, z) => 0.0035 * Math.sin(Math.atan2(z - bz, x - bx) * 34 + Math.floor((y - by) / 0.022) * 2),
    });

    // Herbs: a dome of leaves and stems above the rim, in two greens.
    const leafAt = (x: number, y: number, z: number, rx: number, ry: number, rz: number, ay: number, ax: number) =>
      sdf.ellipsoid([rx, ry, rz]).rotateX(ax).rotateY(ay).at(bx + x, by + y, bz + z);
    const leaves = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([br * 0.9, 0.03, br * 0.9]).at(bx, by + 0.0, bz),
      leafAt(-0.05, 0.05, 0.02, 0.02, 0.012, 0.05, 30, -25),
      leafAt(0.0, 0.07, -0.03, 0.022, 0.012, 0.055, -20, -35),
      leafAt(0.05, 0.06, 0.03, 0.02, 0.012, 0.05, 60, -30),
      leafAt(-0.02, 0.06, 0.06, 0.02, 0.012, 0.046, 100, -20),
      leafAt(0.075, 0.05, -0.02, 0.02, 0.012, 0.045, -70, -25),
      leafAt(-0.075, 0.045, -0.03, 0.02, 0.012, 0.045, 150, -25),
      leafAt(0.02, 0.085, 0.01, 0.02, 0.012, 0.045, 10, -50),
      ...Array.from({ length: 12 }, (_, i) => {
        const phi = i * 30 + (i % 2) * 11;
        const rho = 0.035 + (i % 3) * 0.024;
        const lift = 0.06 + (i % 4) * 0.018;
        const t = (phi * Math.PI) / 180;
        return leafAt(Math.sin(t) * rho, lift, Math.cos(t) * rho, 0.024, 0.012, 0.062, phi, -42 - (i % 3) * 8);
      }),
    );
    const leavesPainted = leaves.paintFn((x, y, z, base) => mixRgb(base, rgb(C.herbDark), 0.5 + 0.5 * Math.sin(x * 60 + z * 45 + y * 30))).bone('hand.R');
    k.body('herbs', leavesPainted, { color: C.herb, roughness: 0.8, detail: 0.004 });

    // Flowers: flat five-petal blooms (pink) and round yellow ones, standing on the herbs.
    const bloom = (x: number, y: number, z: number, r: number) =>
      sdf.union(
        ...[0, 72, 144, 216, 288].map((a) => {
          const px = Math.cos((a * Math.PI) / 180) * r * 0.62;
          const pz = Math.sin((a * Math.PI) / 180) * r * 0.62;
          return sdf.sphere(r * 0.55).scale([1, 0.55, 1]).at(bx + x + px, by + y, bz + z + pz);
        }),
      ).smoothUnion(0.006, sdf.sphere(r * 0.45).at(bx + x, by + y + 0.004, bz + z));
    const pinks = sdf.union(bloom(-0.04, 0.085, 0.045, 0.028), bloom(0.04, 0.075, 0.05, 0.026), bloom(0.075, 0.06, -0.03, 0.024), bloom(-0.06, 0.07, -0.04, 0.024));
    const pinksPainted = pinks
      .paintWhere(sdf.sphere(0.011).at(bx - 0.04, by + 0.092, bz + 0.045), C.pinkHeart, 0.002)
      .paintWhere(sdf.sphere(0.01).at(bx + 0.04, by + 0.082, bz + 0.05), C.pinkHeart, 0.002)
      .paintWhere(sdf.sphere(0.01).at(bx + 0.075, by + 0.067, bz - 0.03), C.pinkHeart, 0.002)
      .paintWhere(sdf.sphere(0.01).at(bx - 0.06, by + 0.077, bz - 0.04), C.pinkHeart, 0.002)
      .bone('hand.R');
    k.body('flowers-pink', pinksPainted, { color: C.pink, roughness: 0.7, detail: 0.003 });
    const yellows = sdf.union(
      sdf.sphere(0.024).at(bx + 0.01, by + 0.11, bz - 0.01),
      sdf.sphere(0.02).at(bx - 0.02, by + 0.095, bz + 0.0),
      sdf.sphere(0.019).at(bx + 0.085, by + 0.07, bz + 0.03),
    );
    k.body('flowers-yellow', yellows.bone('hand.R'), { color: C.yellow, roughness: 0.7, detail: 0.003 });
  },
});
