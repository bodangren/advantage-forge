import { profile, rgb, sdf } from '../src/index.js';
import { humanoidAsset } from './parts/humanoid-kind.js';

/**
 * Midwife — Chibi Quest settlement NPC (catalog `npcs/settlement/midwife`), about 1.0 m to the top
 * of the headscarf, faces +Z. Target: docs/npc-mockups/midwife_001.jpg. Built on the humanoid kind.
 *
 * Role: a village healer NPC for mothers and babies; seen in 3D and as a 128 px sprite. The white
 *   headscarf, the wave, and the basket of blankets and herbs must read.
 * One idea: a warm, motherly girl in soft blue whose white scarf, white apron, and pink-and-white
 *   basket make a bright, clean shape against the blue dress.
 * Shape language: round and soft (scarf, cheeks, blankets, basket), with the woven basket as the one busy form.
 * Palette (60/30/10): blue #6a8ab0 (dress, a cloth slot); white #f6f1ea (scarf, apron, cuffs, collar);
 *   brown #6b3e22 (hair), #8a5a35 (satchel), #5a3a24 (shoes); accents: basket #b08a50, pink #f0b0c0, herbs #4a6a3a.
 * Value plan: the white scarf and apron frame the mid blue; the pink blanket on the basket is the accent.
 * Bodies: skin, hand (open, waving), hair, scarf, dress, cuffs, collar, apron, satchel, shoes, basket,
 *   blankets, herbs.
 * Rig: the humanoid kind's skeleton and clips. The right arm keeps a raised pose; the open hand is rigid
 *   on `knife.R`. The basket and its load are rigid on `knife.L` (the left fist), with the handle through it.
 */

const C = {
  white: '#f6f1ea',
  pink: '#f0b0c0',
  satchel: '#8a5a35',
  strap: '#7a4c2c',
  shoe: '#5a3a24',
  sole: '#3a2418',
  basket: '#b08a50',
  weave: '#8a6a3a',
  herb: '#4a6a3a',
  herbDark: '#37502a',
  mouth: '#8a2e2a',
  tongue: '#d8706a',
  teeth: '#fbf6ee',
  fold: '#ddd3c6',
  foldPink: '#dc90a4',
};

// The right arm raised in a wave (left-side values; the kind mirrors them to the right arm).
const WAVE = { elbow: [0.2, 0.34, 0.02], wrist: [0.262, 0.45, 0.07] } as const;

export default humanoidAsset({
  name: 'midwife',
  description: 'A warm, motherly village midwife in a white headscarf and a blue dress, waving, with a basket of blankets and herbs.',
  reference: 'docs/npc-mockups/midwife_001.jpg',
  variants: {
    skin: { fair: '#f2c7a4', light: '#e8b48e', tan: '#d49a72', brown: '#8a5a3e', deep: '#5e3b28' },
    hair: { brown: '#6b3e22', black: '#231a17', blond: '#c4974a', auburn: '#8e3b1c', silver: '#b8b4c4', teal: '#2f6f6a' },
    eyes: { brown: '#6e4020', blue: '#2f6aa8', green: '#3d7a35', hazel: '#8a6a2a', violet: '#6a4a9a' },
    cloth: { blue: '#6a8ab0', heather: '#8a7aa8', moss: '#6f8a68', rose: '#b0707a' },
  },
  presets: {
    meadow: { skin: 'tan', hair: 'auburn', eyes: 'green', cloth: 'heather' },
  },
  hair: false,
  undershirt: false,
  pants: false,
  shoes: false,
  pose: { R: WAVE },

  // A glad, open smile with a band of teeth, thicker arched brows, and big rosy cheeks.
  paintSkin(skin, h) {
    const y = 0.536;
    const grin = profile.polygon(
      [
        [-0.05, 0.012],
        [-0.026, 0.002],
        [0, 0.0],
        [0.026, 0.002],
        [0.05, 0.012],
        [0.04, -0.01],
        [0.02, -0.026],
        [0, -0.031],
        [-0.02, -0.026],
        [-0.04, -0.01],
      ],
      { smooth: true, samples: 6 },
    );
    const mouth = h.onFace(sdf.extrude(grin, 0.3), 0, y);
    const teeth = mouth.intersect(sdf.halfSpace([0, -1, 0], -(y - 0.009))).intersect(sdf.box([0.04, 0.1, 1]).at(0, y, 0));
    const tongue = h.onFace(sdf.ellipsoid([0.022, 0.012, 0.08]), 0, y - 0.026);
    const oldBrows = sdf.extrude(profile.arc(0.1, 0.036, 54, 126), 0.3).at(0.1, 0.622, 0.1).mirror('x');
    const brows = sdf.extrude(profile.arc(0.07, 0.014, 56, 124), 0.3).at(0.1, 0.656, 0.1).mirror('x');
    const cheeks = h.onFace(sdf.sphere(0.044), 0.135, 0.556).mirror('x');
    return skin
      .paintWhere(oldBrows, h.tint.skin!, 0.002)
      .paintWhere(brows, h.tint.brow!, 0.002)
      .paintWhere(cheeks, h.tint.blush!, 0.035)
      .paintWhere(mouth, C.mouth)
      .paintWhere(tongue.intersect(mouth), C.tongue, 0.004)
      .paintWhere(teeth, C.teeth, 0.002);
  },

  extra(k, h) {
    const { SHOULDER, ANKLE, HEAD_Y } = h.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
      a[0]! + (b[0]! - a[0]!) * t,
      a[1]! + (b[1]! - a[1]!) * t,
      a[2]! + (b[2]! - a[2]!) * t,
    ];
    const hairColor = k.tint('hair');
    const dressColor = h.tint.shirt ?? '#6a8ab0';
    const trim = k.tint('cloth', { color: '#587696', follow: 1 });
    const skinColor = k.tint('skin');
    type P4 = [number, number, number, number];

    // ------------------------------------------------------------------ hair: a small cap and chain locks
    const headPose = (s: sdf.Shape) => s.at(0, HEAD_Y, 0);
    const faceMask = sdf.ellipsoid([0.15, 0.135, 0.12]).at(0, -0.082, 0.175);
    const lowCut = sdf.halfSpace([0, -1, 0.586], 0.03 / 1.159);
    const earCut = pair(sdf.ellipsoid([0.05, 0.06, 0.05]).at(0.2, -0.065, -0.01));
    const cap = sdf.ellipsoid([0.211, 0.205, 0.195]).smoothIntersect(0.03, lowCut).smoothSubtract(0.03, faceMask, earCut);
    // A lock follows the face surface: each point is (x, world y) and sits on the head at that spot.
    // The head ellipsoid's surface z (a lock may sit past the face silhouette, where a ray would miss).
    const headZ = (x: number, y: number) => 0.19 * Math.sqrt(Math.max(0.04, 1 - (x / 0.205) ** 2 - ((y - HEAD_Y) / 0.2) ** 2));
    const onHead = ([x, y, r]: [number, number, number]): P4 => [x, y + 0.024 - HEAD_Y, headZ(x, y) + 0.004, r];
    const lockOf = (pts: [number, number, number][]) => sdf.chain(pts.map(onHead), 0.012);
    const fringe = [
      // The fringe sweeps from the part at the viewer's left, across the brow, to the temple on the other side.
      [[-0.1, 0.835, 0.024], [-0.06, 0.8, 0.023], [0.0, 0.775, 0.022], [0.07, 0.755, 0.02], [0.13, 0.735, 0.018]],
      [[-0.04, 0.845, 0.024], [0.0, 0.815, 0.023], [0.06, 0.785, 0.022], [0.11, 0.76, 0.02], [0.16, 0.72, 0.018], [0.18, 0.67, 0.015]],
      [[-0.14, 0.805, 0.022], [-0.1, 0.775, 0.021], [-0.04, 0.752, 0.02], [0.02, 0.745, 0.018]],
      [[0.03, 0.85, 0.023], [0.08, 0.82, 0.022], [0.13, 0.79, 0.02], [0.17, 0.75, 0.018], [0.185, 0.7, 0.015]],
      [[-0.07, 0.84, 0.022], [-0.03, 0.805, 0.021], [0.03, 0.775, 0.02], [0.08, 0.76, 0.017]],
      // Short locks beside the temple at the viewer's left.
      [[-0.17, 0.79, 0.022], [-0.185, 0.745, 0.021], [-0.192, 0.69, 0.019], [-0.19, 0.64, 0.014]],
      [[-0.12, 0.81, 0.022], [-0.15, 0.775, 0.021], [-0.17, 0.74, 0.018]],
      // The lock at the other temple, past the ear.
      [[0.175, 0.74, 0.022], [0.19, 0.7, 0.021], [0.198, 0.65, 0.018], [0.194, 0.6, 0.014]],
    ] as [number, number, number][][];
    // The part above the scarf's edge is hidden: cut it just inside the scarf so no lock pokes through.
    const underScarf = sdf.halfSpace([0, 1, -0.586], 0.04 / 1.159);
    const hairShape = headPose(cap.smoothUnion(0.02, ...fringe.map(lockOf)).intersect(underScarf.intersect(sdf.box([1, 1, 1])))).bone('head');
    k.body('hair', hairShape, { color: hairColor, roughness: 0.6, detail: 0.004 });

    // ------------------------------------------------------------------ headscarf: a soft white bonnet
    // The front edge sits high on the forehead; the scarf puffs on top and drapes over the nape, where
    // it is tied in a small knot with one short tail.
    const edge = sdf.halfSpace([0, -1, 0.586], -0.012 / 1.159);
    const bonnet = sdf.ellipsoid([0.232, 0.222, 0.218]).at(0, 0.03, -0.015).smoothIntersect(0.015, edge);
    const fold = sdf.smoothUnion(
      0.05,
      sdf.ellipsoid([0.18, 0.075, 0.17]).at(0, 0.165, -0.03),
      sdf.sphere(0.085).at(-0.07, 0.195, -0.03),
      sdf.sphere(0.075).at(0.075, 0.185, -0.05),
    );
    const drape = sdf.ellipsoid([0.2, 0.12, 0.13]).at(0, -0.085, -0.09);
    const knot = sdf.smoothUnion(0.015, sdf.ellipsoid([0.04, 0.032, 0.032]).at(0.03, -0.085, -0.2), sdf.sphere(0.024).at(0.045, -0.1, -0.205));
    const tail = sdf.chain([[0.04, -0.1, -0.205, 0.022], [0.07, -0.13, -0.2, 0.022], [0.08, -0.17, -0.19, 0.016]], 0.02);
    const scarf = headPose(sdf.smoothUnion(0.03, bonnet, fold, drape, knot, tail)).bone('head');
    k.body('scarf', scarf, {
      color: C.white,
      roughness: 0.88,
      detail: 0.005,
      bump: (x, y, z) => 0.0025 * Math.sin(x * 55 + y * 20) * Math.cos(z * 45 + y * 30),
    });

    // ------------------------------------------------------------------ dress: long sleeves, a calf-length skirt
    const sleeve = h.perArm((j) =>
      sdf.smoothUnion(
        0.015,
        sdf.cone(lerp(SHOULDER, j.ELBOW, -0.1), j.ELBOW, 0.047, 0.043).bone('upperarm.L'),
        sdf.cone(j.ELBOW, lerp(j.ELBOW, j.WRIST, 0.86), 0.043, 0.041).bone('forearm.L'),
      ),
    );
    const cuffs = h.perArm((j) => sdf.cone(lerp(j.ELBOW, j.WRIST, 0.7), lerp(j.ELBOW, j.WRIST, 0.99), 0.046, 0.047).round(0.002).bone('forearm.L'));
    const skirtProfile = (g: number) =>
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.3],
              [0.13 + g, 0.3],
              [0.138 + g, 0.25],
              [0.15 + g, 0.2],
              [0.162 + g, 0.15],
              [0.172 + g, 0.1],
              [0, 0.1],
            ],
            { smooth: true, samples: 8 },
          ),
        )
        .scale([1, 1, 0.92]);
    const skirt = skirtProfile(0);
    const bodyDress = h.weighted(h.torso.round(0.008).smoothIntersect(0.01, h.band(0.152, 0.452)));
    const dress = sdf.smoothUnion(0.02, bodyDress, h.weighted(skirt), sleeve).paintWhere(h.band(0.1, 0.122), trim, 0.004);
    k.body('dress', dress, { color: dressColor, roughness: 0.9, detail: 0.005, bump: (x, y, z) => 0.002 * Math.sin(x * 70 + y * 50) * Math.cos(z * 60) });
    // White cuffs, and a small collar that peeks out above the apron bib.
    const collar = sdf.torus(0.066, 0.017).scale([1, 1, 0.9]).at(0, 0.452, -0.008).bone('chest');
    const collarFront = sdf.ellipsoid([0.05, 0.024, 0.03]).at(0, 0.446, 0.05).bone('chest');
    k.body('cuffs', sdf.smoothUnion(0.012, cuffs, collar, collarFront), { color: C.white, roughness: 0.9, detail: 0.004 });

    // ------------------------------------------------------------------ apron: bib, straps, and a round skirt panel
    const shell = h.torso.round(0.017).subtract(h.torso.round(0.007));
    const front = (x: number, y0: number, y1: number) => sdf.box([2 * x, y1 - y0, 0.4], 0.012).at(0, (y0 + y1) / 2, 0.2);
    const bib = shell.intersect(front(0.078, 0.25, 0.41));
    const strap = shell
      .intersect(sdf.box([0.034, 0.5, 0.6]).at(0.07, 0.39, 0))
      .intersect(sdf.halfSpace([0, -1, 0], -0.3))
      .intersect(sdf.halfSpace([0, 1, 0], 0.5))
      .bone('chest');
    const apronSkirt = skirtProfile(0.012)
      .subtract(skirtProfile(0.002))
      .intersect(sdf.box([0.27, 0.15, 0.4], 0.07).at(0, 0.2, 0.2));
    const apron = sdf
      .smoothUnion(0.008, h.weighted(bib), pair(strap), h.weighted(apronSkirt))
      .paintWhere(h.band(0.254, 0.268), C.fold, 0.002);
    k.body('apron', apron, { color: C.white, roughness: 0.9, detail: 0.005 });

    // ------------------------------------------------------------------ satchel: right hip, with a cross strap
    const strapSlab = sdf.box([0.032, 0.5, 0.8]).rotateZ(-42.5).at(-0.03, 0.32, 0);
    const crossStrap = h.torso
      .round(0.027)
      .subtract(h.torso.round(0.012))
      .intersect(strapSlab)
      .intersect(h.band(0.2, 0.45))
      .bone('chest');
    const bag = sdf.box([0.06, 0.09, 0.1], 0.018);
    const flap = sdf.box([0.06, 0.034, 0.092], 0.012).at(0, 0.03, 0);
    const buckle = sdf.sphere(0.009).at(-0.03, 0.022, 0);
    const satchel = sdf
      .smoothUnion(0.006, bag, flap)
      .rotateZ(8)
      .at(-0.178, 0.168, 0.0)
      .bone('hips')
      .paintWhere(buckle.rotateZ(8).at(-0.178, 0.168, 0), '#d6b34e', 0.002);
    k.body('satchel', sdf.union(satchel, crossStrap), { color: C.satchel, roughness: 0.7, detail: 0.004 });

    // ------------------------------------------------------------------ shoes: a round shoe with a toe and a heel
    const shoeBody = sdf
      .smoothUnion(0.03, sdf.ellipsoid([0.054, 0.04, 0.1]).at(0, 0.04, 0.04), sdf.sphere(0.047).at(0, 0.05, -0.012))
      .intersect(sdf.halfSpace([0, -1, 0], 0));
    const sole = shoeBody.round(0.004).intersect(sdf.halfSpace([0, 1, 0], 0.014)).intersect(sdf.halfSpace([0, -1, 0], 0));
    const toeCap = sdf.ellipsoid([0.05, 0.034, 0.05]).at(0, 0.05, 0.1);
    const shoeStrap = sdf.box([0.1, 0.014, 0.022], 0.005).at(0, 0.082, 0.03);
    const shoe = sdf
      .union(shoeBody.paintWhere(toeCap, '#6a4630', 0.01), sole.paint(C.sole), shoeStrap.paint('#6a4630'))
      .rotateY(10)
      .at(ANKLE[0], 0, 0)
      .bone('foot.L');
    k.body('shoes', pair(shoe), { color: C.shoe, roughness: 0.65, detail: 0.004 });

    // ------------------------------------------------------------------ the right hand: an open wave
    // Built along +Y with the palm facing +Z, then turned with the forearm, at the right wrist (x < 0).
    const wr = h.arms.R;
    const d = [wr.WRIST[0] - wr.ELBOW[0], wr.WRIST[1] - wr.ELBOW[1], wr.WRIST[2] - wr.ELBOW[2]];
    const dl = Math.hypot(d[0]!, d[1]!, d[2]!);
    const tiltX = (Math.asin(d[2]! / dl) * 180) / Math.PI; // forward lean of the forearm
    const tiltZ = (Math.atan2(d[0]!, d[1]!) * 180) / Math.PI; // outward lean
    const finger = (x: number, len: number, lean: number) =>
      sdf.capsule([x, 0.03, 0], [x + lean, 0.03 + len, 0.002], 0.0125);
    const handShape = sdf.smoothUnion(
      0.012,
      sdf.ellipsoid([0.043, 0.04, 0.03]).at(0, 0.04, 0),
      finger(-0.028, 0.05, -0.008),
      finger(-0.01, 0.06, -0.002),
      finger(0.01, 0.058, 0.003),
      finger(0.028, 0.045, 0.01),
      sdf.capsule([0.036, 0.03, 0.004], [0.066, 0.058, 0.006], 0.0135), // the thumb toward the head
    );
    // Turn it so +Y follows the forearm (leaning forward and outward), mirror to the right arm (x < 0).
    const hand = handShape
      .rotateX(tiltX)
      .rotateZ(-tiltZ)
      .at(wr.WRIST[0], wr.WRIST[1], wr.WRIST[2])
      .mirror('x', 0)
      .intersect(sdf.halfSpace([1, 0, 0], 0))
      .bone('knife.R');
    k.body('hand', hand, { color: skinColor, roughness: 0.55, detail: 0.004, textureDensity: 2 });

    // ------------------------------------------------------------------ the basket, on the left fist
    // The handle arches in the YZ plane through the fist; the bowl hangs below it at the hip.
    const G = h.arms.L.GRIP;
    const B = { x: 0.258, y: 0.155, z: 0.04, rx: 0.08, rz: 0.102, depth: 0.08 };
    const bowlOuter = sdf
      .revolve(
        profile.polygon(
          [
            [0, -B.depth],
            [0.6, -B.depth],
            [0.82, -B.depth * 0.7],
            [0.96, -B.depth * 0.3],
            [1, 0.004],
            [1, 0.014],
            [0, 0.014],
          ].map(([u, v]) => [u!, v!] as [number, number]),
          { smooth: true, samples: 8 },
        ),
      )
      .scale([B.rx, 1, B.rz]);
    const bowlInner = sdf
      .revolve(
        profile.polygon(
          [
            [0, -B.depth + 0.016],
            [0.56, -B.depth + 0.016],
            [0.78, -B.depth * 0.7],
            [0.9, -B.depth * 0.3],
            [0.92, 0.02],
            [0, 0.02],
          ].map(([u, v]) => [u!, v!] as [number, number]),
          { smooth: true, samples: 8 },
        ),
      )
      .scale([B.rx, 1, B.rz]);
    const ring = Array.from({ length: 25 }, (_, i) => {
      const t = (i / 24) * Math.PI * 2;
      return [(B.rx - 0.004) * Math.cos(t), 0.006, (B.rz - 0.004) * Math.sin(t), 0.0115] as P4;
    });
    const rim = sdf.chain(ring, 0.004);
    const handleH = G[1] - B.y + 0.002; // the arch crests at the grip
    const arch = Array.from({ length: 13 }, (_, i) => {
      const t = (i / 12) * Math.PI;
      return [0, 0.006 + handleH * Math.sin(t), B.rz * 0.97 * Math.cos(t), 0.0165] as P4;
    });
    const handle = sdf.chain(arch, 0.004);
    const basketLocal = sdf.smoothUnion(0.008, bowlOuter.subtract(bowlInner), rim, handle);
    const weaveRow = 0.022;
    const basket = basketLocal
      .at(B.x, B.y, B.z)
      .paintFn((x, y, z, base) => {
        const a = Math.atan2(z - B.z, x - B.x);
        const row = Math.floor((y - B.y) / weaveRow);
        const cell = Math.floor((a * 0.1) / 0.026 + (row % 2 ? 0.5 : 0));
        return (row + cell) % 2 === 0 ? rgb(C.weave) : base;
      })
      .bone('knife.L');
    k.body('basket', basket, {
      color: C.basket,
      roughness: 0.85,
      detail: 0.005,
      bump: (x, y, z) => 0.003 * Math.sin(Math.atan2(z - B.z, x - B.x) * 36 + Math.floor((y - B.y) / weaveRow) * 2),
    });

    // Folded blankets and herbs: a pink stack at the front, white rolls and a white fold behind it.
    const L = (x: number, y: number, z: number) => [B.x + x, B.y + y, B.z + z] as const;
    const slab = (w: number, hh: number, dd: number, at: readonly [number, number, number], ry: number) =>
      sdf.box([w, hh, dd], hh * 0.45).rotateY(ry).at(...at);
    const whiteLoad = sdf
      .smoothUnion(
        0.008,
        slab(0.11, 0.045, 0.1, L(0.0, -0.012, -0.03), 8),
        slab(0.1, 0.04, 0.09, L(0.003, 0.026, -0.03), -6),
        sdf.capsule(L(0.03, 0.04, 0.045), L(-0.03, 0.04, 0.045), 0.03), // a rolled blanket across the front
      )
      .paintWhere(slab(0.2, 0.004, 0.2, L(0, 0.0, -0.03), 8), C.fold, 0.003)
      .bone('knife.L');
    k.body('blankets-white', whiteLoad, { color: C.white, roughness: 0.92, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(x * 80) * Math.cos(z * 70) });
    const pinkLoad = sdf
      .smoothUnion(0.008, slab(0.09, 0.04, 0.075, L(-0.005, 0.03, 0.065), -10), slab(0.082, 0.032, 0.07, L(-0.003, 0.062, 0.062), 6))
      .paintWhere(slab(0.2, 0.004, 0.2, L(0, 0.056, 0.063), 0), C.foldPink, 0.003)
      .bone('knife.L');
    k.body('blankets-pink', pinkLoad, { color: C.pink, roughness: 0.92, detail: 0.004, bump: (x, y, z) => 0.002 * Math.sin(y * 90) * Math.cos(z * 70) });

    const leaf = (x: number, y: number, z: number, ay: number, ax: number, s = 1) =>
      sdf.ellipsoid([0.02 * s, 0.01 * s, 0.05 * s]).rotateX(ax).rotateY(ay).at(...L(x, y, z));
    const herbs = sdf
      .smoothUnion(
        0.01,
        leaf(0.05, 0.075, -0.06, 20, -35),
        leaf(0.075, 0.075, -0.04, 50, -32),
        leaf(0.06, 0.095, -0.075, 0, -50, 1.1),
        leaf(0.088, 0.065, -0.07, 80, -28),
        leaf(0.035, 0.09, -0.045, -20, -40),
        leaf(0.075, 0.1, -0.05, 35, -55, 0.9),
        sdf.capsule(L(0.07, 0.04, -0.03), L(0.07, 0.07, -0.055), 0.008),
      )
      .paintFn((x, y, z, base) => (Math.sin(x * 70 + z * 50 + y * 30) > 0.2 ? rgb(C.herbDark) : base))
      .bone('knife.L');
    k.body('herbs', herbs, { color: C.herb, roughness: 0.8, detail: 0.004 });
  },
});
