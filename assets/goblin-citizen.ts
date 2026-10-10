import { noise, profile, rgb, sdf } from '../src/index.js';
import { goblinAsset } from './parts/goblin-kind.js';
import type { AssetContext, AssetDefinition } from '../src/index.js';

type V3 = readonly [number, number, number];
// The right arm of this goblin is raised: the bell hangs from a fist at head height. The kind's
// arm hangs lower, so `build` below cuts the kind's right forearm and fist from the skin and the
// outfit grows the raised arm (shoulder, elbow E2, wrist W2, fist F) in its place.
const SH_R: V3 = [-0.14, 0.405, 0];
const E2: V3 = [-0.27, 0.36, 0.03];
const W2: V3 = [-0.31, 0.5, 0.07];
const F: V3 = [-0.3, 0.555, 0.17];

/**
 * Goblin citizen — Chibi Quest NPC (catalog `npcs/fantasy-peoples/goblin-citizen`), about 0.9 m
 * tall to the headscarf, faces +Z, stands on y = 0.
 * Target: docs/npc-mockups/goblin-citizen_001.jpg.
 *
 * Role: a friendly, chatty goblin junk trader of the market and the goblin bazaar who gives swap
 *   errands; seen in 3D and as a 128 px sprite. The bell, the grin, and the huge pack read first.
 * The one idea: a cheerful peddler under a mountain of odds and ends, ringing a little brass bell.
 * Shape language: round and soft (a friendly trader), with big pointed ears as the one sharp form.
 * Palette (60/30/10): green skin #8fa84c; a yellow headscarf #e0b040; a brown vest #6b4226 with
 *   #8a6a3a patches over a cream shirt #ece0c8; a red sash #b03a3a; purple striped trousers
 *   #6a5a8a / #4a3a6a; red slippers #b03a3a; a tan pack #8a6a3a with gold pots #c8a040, cream
 *   scrolls #f0e6cc, and a lantern. Brass (#e0b040) in the earrings and the bell is the accent.
 * Bodies added: torso, shirt, vest, neckerchief, sash, trousers, slippers, headscarf, brows, grin,
 *   earrings, wrist bands, pack, pots, scrolls, lantern, bell, handle.
 * Rig: the goblin kind's skeleton and clips; the bell is rigid on `dagger`, the pack on `chest`.
 */
const base = goblinAsset({
  name: 'goblin-citizen',
  description:
    'Chibi goblin citizen: a friendly junk trader with huge ears and gold earrings, a yellow headscarf, a patched vest, a red sash, striped trousers, red slippers, a pack piled with pots and scrolls, and a brass bell.',
  reference: 'docs/npc-mockups/goblin-citizen_001.jpg',
  variants: {
    eyes: { olive: '#6b5a28', amber: '#8f5a10', moss: '#3d6a2a', brown: '#5e2812' },
    skin: { green: '#8fa84c', goblin: '#a0a446', leaf: '#6f9a4a', sage: '#86a67c' },
    clothing: { brown: '#6b4226', plum: '#5b3a52', teal: '#365a54', ochre: '#7a5a2a' },
    scarf: { orange: '#e08a30', gold: '#e0b040', rose: '#b04a6a', teal: '#3f8a86' },
  },
  presets: {
    market: { eyes: 'olive', skin: 'green', clothing: 'brown', scarf: 'orange' },
    bazaar: { eyes: 'amber', skin: 'sage', clothing: 'plum', scarf: 'rose' },
  },
  colors: { skinDark: '#6f8a38', earInner: '#7c9a44', blush: '#d98c80', brow: '#8fa84c', irisLow: '#b8a04a' },
  earScale: 1.32,
  nicks: false,
  tuft: false,
  outfit(k, g) {
    const { HIP, KNEE, ANKLE, SHOULDER, ELBOW, WRIST } = g.joints;
    const pair = (s: sdf.Shape) => s.mirror('x');
    const lerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const torso = g.torso;
    const band = (y0: number, y1: number) => sdf.box([0.7, y1 - y0, 0.7]).at(0, (y0 + y1) / 2, 0);

    // The green body under the clothes.
    k.body('torso', torso.bone('spine'), { color: g.tint.skin, roughness: 0.55 });

    // Cream shirt with short puffy sleeves.
    const sleeveL = sdf.cone(SHOULDER, lerp(SHOULDER, ELBOW, 0.78), 0.06, 0.058).bone('upperarm.L');
    const sleeveR = sdf.cone(SH_R, lerp(SH_R, E2, 0.62), 0.06, 0.058).bone('upperarm.R');
    const shirtBody = torso.round(0.005).smoothIntersect(0.006, band(0.23, 0.505)).bone('spine');
    k.body('shirt', sdf.smoothUnion(0.02, shirtBody, sleeveL, sleeveR), { color: '#ece0c8', roughness: 0.85 });

    // Patched brown vest, open at the front.
    const opening = sdf
      .extrude(
        profile.polygon([
          [-0.014, 0.26],
          [0.014, 0.26],
          [0.062, 0.52],
          [-0.062, 0.52],
        ]),
        0.4,
        0.004,
      )
      .at(0, 0, 0.2);
    const patch = (x: number, y: number, w: number, h: number) => sdf.box([w, h, 0.3], 0.006).at(x, y, 0.1);
    const vest = torso
      .round(0.012)
      .smoothIntersect(0.006, band(0.265, 0.5))
      .subtract(opening)
      .paintWhere(patch(0.085, 0.4, 0.05, 0.05), '#8a6a3a', 0.003)
      .paintWhere(patch(-0.08, 0.31, 0.055, 0.045), '#8a6a3a', 0.003)
      .paintWhere(patch(0.09, 0.31, 0.04, 0.05), '#a08048', 0.003)
      .bone('spine');
    k.body('vest', vest, { color: g.tint.clothing, roughness: 0.85 });
    const vestFront = (x: number, y: number) => sdf.raycast(vest, [x, y, 1], [0, 0, -1]);
    const buttonPts = [vestFront(0.07, 0.43), vestFront(0.07, 0.37), vestFront(-0.07, 0.43), vestFront(-0.07, 0.37)];
    const buttons = sdf.union(
      ...buttonPts.flatMap((p) => (p ? [sdf.sphere(0.011).at(p[0], p[1], p[2] + 0.004)] : [])),
    );
    k.body('vest-buttons', buttons.bone('chest'), { color: '#e0b040', roughness: 0.35, metalness: 0.8, detail: 0.003 });

    // A flared yellow neckerchief.
    const ring = sdf
      .revolve(
        profile.polygon(
          [
            [0.055, 0.532],
            [0.105, 0.526],
            [0.146, 0.5],
            [0.158, 0.47],
            [0.136, 0.452],
            [0.09, 0.474],
            [0.055, 0.49],
          ],
          { smooth: true, samples: 6 },
        ),
      )
      .scale([1, 1, 0.9]);
    const tip = torso
      .round(0.013)
      .subtract(torso.round(-0.002))
      .intersect(
        sdf
          .extrude(
            profile.polygon([
              [-0.13, 0.5],
              [0.13, 0.5],
              [0.02, 0.408],
              [0, 0.388],
              [-0.02, 0.408],
            ]),
            0.4,
          )
          .at(0, 0, 0.2),
      );
    // The hanging end: a flat orange strip that falls from the knot over the left side of the vest.
    const vestSurface = torso.round(0.014);
    const sz = (x: number, y: number) => (sdf.raycast(vestSurface, [x, y, 1], [0, 0, -1])?.[2] ?? 0.1) + 0.006;
    const hang = sdf
      .chain(
        [
          [0, 0, 0, 0.02],
          [0.014, -0.05, 0.006, 0.026],
          [0.022, -0.1, 0.008, 0.024],
          [0.024, -0.14, 0.008, 0.016],
        ],
        0.012,
      )
      .scale([1, 1, 0.4])
      .at(0.075, 0.48, sz(0.085, 0.43));
    k.body('neckerchief', sdf.smoothUnion(0.012, ring, tip, hang).bone('chest'), { color: k.tint('scarf', -0.1), roughness: 0.8 });

    // Red sash with a knot and two tails at the front, brass bobbles on the ends.
    const sash = torso.round(0.02).smoothIntersect(0.006, sdf.box([0.5, 0.062, 0.5], 0.006).at(0, 0.256, 0));
    const sashZ = sdf.raycast(sash, [-0.06, 0.256, 1], [0, 0, -1])?.[2] ?? 0.14;
    const knot = sdf.ellipsoid([0.032, 0.03, 0.022]).at(-0.06, 0.256, sashZ + 0.004);
    const tail = (dx: number, dy: number, len: number) =>
      sdf
        .chain(
          [
            [0, 0, 0, 0.018],
            [dx * 0.5, dy * len * 0.5, 0, 0.026],
            [dx, dy * len, 0.004, 0.022],
          ],
          0.01,
        )
        .scale([1, 1, 0.36])
        .at(-0.06, 0.256, sashZ + 0.008);
    k.body('sash', sdf.smoothUnion(0.01, sash, knot, tail(-0.012, -1, 0.11), tail(0.022, -1, 0.085)).bone('spine'), {
      color: '#b03a3a',
      roughness: 0.9,
    });
    const bobbles = sdf.union(sdf.sphere(0.012).at(-0.072, 0.13, sashZ + 0.012), sdf.sphere(0.011).at(-0.038, 0.155, sashZ + 0.012));
    k.body('bobbles', bobbles.bone('spine'), { color: '#e0b040', roughness: 0.35, metalness: 0.8, detail: 0.003 });

    // Baggy purple striped trousers, gathered at the ankle.
    const waist = torso.round(0.008).smoothIntersect(0.006, band(0.17, 0.3)).bone('spine');
    const hipsBlob = sdf.ellipsoid([0.13, 0.062, 0.1]).at(0, 0.21, 0).bone('hips');
    const AK: V3 = [ANKLE[0] + 0.002, 0.108, 0];
    const leg = sdf.smoothUnion(
      0.03,
      sdf.capsule([HIP[0], 0.2, 0], [KNEE[0], KNEE[1] + 0.005, 0.004], 0.082).bone('leg.L'),
      sdf.cone([KNEE[0], KNEE[1], 0.004], AK, 0.078, 0.05).bone('shin.L'),
    );
    const baseTrousers = sdf.smoothUnion(0.03, waist, hipsBlob, pair(leg));
    const stripe = (x: number, y: number, z: number, base: ReturnType<typeof rgb>) => {
      const cx = x >= 0 ? 0.09 : -0.09;
      const s = Math.sin(Math.atan2(z, x - cx) * 9 + y * 3);
      return s > 0.35 ? rgb('#4a3a6a') : base;
    };
    k.body('trousers', baseTrousers.paintFn(stripe), { color: '#6a5a8a', roughness: 0.85, textureDensity: 1.5 });

    // Red wrist bands.
    const wrist = (e: V3, w: V3, tag: string) => sdf.capsule(lerp(e, w, 0.74), lerp(e, w, 0.92), 0.047).bone(tag);
    k.body('wristbands', sdf.union(wrist(ELBOW, WRIST, 'forearm.L'), wrist(E2, W2, 'forearm.R')), {
      color: '#b03a3a',
      roughness: 0.8,
    });

    // Big red pointed slippers with a curled toe.
    const slipper = sdf
      .smoothUnion(
        0.022,
        sdf.ellipsoid([0.056, 0.042, 0.1]).at(0, 0.04, 0.03),
        sdf.capsule([0, 0.04, 0.0], [0, 0.098, -0.004], 0.05),
        sdf.cone([0, 0.04, 0.09], [0, 0.07, 0.185], 0.036, 0.012),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .rotateY(10)
      .at(ANKLE[0], 0, 0.004)
      .bone('foot.L');
    k.body('slippers', pair(slipper), { color: '#b03a3a', roughness: 0.7 });

    // ---------------------------------------------------------------- the pack, rigid on the chest
    // A huge sack, wider and deeper than the torso, with a bedroll across the top, pots, a cup, scrolls,
    // and a lantern. Everything above y 0.47 stays at z -0.26 or further back, clear of the head.
    const sack = sdf.smoothUnion(
      0.04,
      sdf.box([0.44, 0.38, 0.24], 0.09).at(0, 0.28, -0.29),
      sdf.box([0.3, 0.26, 0.12], 0.04).at(0, 0.3, -0.15),
      sdf.ellipsoid([0.1, 0.09, 0.08]).at(0.12, 0.22, -0.4),
      sdf.ellipsoid([0.09, 0.1, 0.08]).at(-0.13, 0.31, -0.4),
      sdf.box([0.42, 0.09, 0.25], 0.04).at(0, 0.43, -0.29),
    );
    const straps = torso
      .round(0.02)
      .smoothIntersect(
        0.005,
        pair(sdf.box([0.03, 0.3, 0.6], 0.006).rotateZ(-6).at(0.075, 0.42, 0)).intersect(sdf.halfSpace([0, -1, 0], -0.33)),
      )
      .intersect(sdf.halfSpace([0, 1, 0], 0.495));
    k.body('pack', sack.paintWhere(sdf.box([0.5, 0.012, 0.5]).at(0, 0.385, -0.29), '#6b4226', 0.004), {
      color: '#8a6a3a',
      roughness: 0.9,
      bone: 'chest',
      bump: (x, y, z) => 0.004 * noise.fbm(x * 25, y * 25, z * 25, 2),
    });
    k.body('pack-straps', straps, { color: '#6b4226', roughness: 0.7, bone: 'chest' });

    // A bedroll across the top of the sack, tied with two straps.
    const roll = sdf.cylinder(0.05, 0.52, 0.02).rotateZ(90).at(0, 0.53, -0.31);
    k.body('bedroll', roll, { color: '#c9b27a', roughness: 0.9, bone: 'chest', bump: (x, y, z) => 0.003 * noise.fbm(x * 30, y * 30, z * 30, 2) });
    const rollTies = sdf.union(
      sdf.cylinder(0.055, 0.025, 0.004).rotateZ(90).at(0.14, 0.53, -0.31),
      sdf.cylinder(0.055, 0.025, 0.004).rotateZ(90).at(-0.14, 0.53, -0.31),
    );
    k.body('roll-ties', rollTies, { color: '#6b4226', roughness: 0.75, bone: 'chest' });

    const potProfile = profile.polygon(
      [
        [0, 0],
        [0.038, 0],
        [0.06, 0.03],
        [0.07, 0.066],
        [0.058, 0.102],
        [0.036, 0.118],
        [0.044, 0.13],
        [0, 0.13],
      ],
      { smooth: true, samples: 5 },
    );
    const pot = sdf.revolve(potProfile);
    const potA = pot.scale(0.9).at(0.13, 0.575, -0.34);
    const potB = pot.scale(0.75).rotateZ(-10).at(-0.12, 0.58, -0.33);
    const lid = sdf.sphere(0.028).scale([1, 0.7, 1]).at(-0.12, 0.58 + 0.095, -0.33);
    const potC = pot.scale(0.85).at(-0.27, 0.18, -0.3);
    k.body('pots', sdf.union(potA, potB, lid, potC), { color: '#c8a040', roughness: 0.55, metalness: 0.3, bone: 'chest', detail: 0.004 });

    // A tin cup tied to the other side, and a rope that holds the kettle.
    const cup = sdf.cylinder(0.038, 0.075, 0.01).at(0.27, 0.24, -0.3);
    k.body('cup', cup, { color: '#a8aeb4', roughness: 0.4, metalness: 0.7, bone: 'chest', detail: 0.004 });

    // Rolled scrolls stand up behind the head, tied with red ribbons.
    const scroll = (x: number, y: number, z: number, len: number) => sdf.cylinder(0.024, len, 0.008).at(x, y, z);
    const scrolls = sdf.union(scroll(-0.02, 0.69, -0.4, 0.3), scroll(0.04, 0.67, -0.42, 0.26), scroll(-0.07, 0.66, -0.43, 0.24));
    k.body('scrolls', scrolls, { color: '#f0e6cc', roughness: 0.85, bone: 'chest' });
    const ties = sdf.union(
      sdf.cylinder(0.027, 0.02, 0.004).at(-0.02, 0.62, -0.4),
      sdf.cylinder(0.027, 0.02, 0.004).at(0.04, 0.6, -0.42),
      sdf.cylinder(0.027, 0.02, 0.004).at(-0.07, 0.6, -0.43),
    );
    k.body('scroll-ties', ties, { color: '#b03a3a', roughness: 0.8, bone: 'chest' });

    // A small lantern hangs at the back of the sack.
    const lanternBody = sdf.smoothUnion(
      0.006,
      sdf.box([0.052, 0.07, 0.052], 0.008),
      sdf.cylinder(0.014, 0.024, 0.004).at(0, 0.047, 0),
      sdf.torus(0.016, 0.005).rotateX(90).at(0, 0.074, 0),
    );
    k.body('lantern', lanternBody.at(0.0, 0.2, -0.435), { color: '#5a4a3a', roughness: 0.5, metalness: 0.6, bone: 'chest', detail: 0.003 });
    k.body('lantern-glow', sdf.box([0.04, 0.056, 0.058], 0.01).at(0.0, 0.2, -0.435), {
      color: '#ffb450',
      roughness: 0.3,
      emissive: '#ffb450',
      emissiveIntensity: 0.6,
      bone: 'chest',
      detail: 0.003,
    });
  },
  weapon(k) {
    // A brass bell on a short wooden handle. The fist at F grips the handle; the bell hangs below
    // the fist, mouth down, with its crown knob at the foot of the handle. Built in world frame
    // and rigid on `dagger` (its pivot is the fist).
    const handle = sdf.cylinder(0.017, 0.15, 0.006).at(F[0], F[1] + 0.012, F[2]);
    k.body('bell-handle', handle, { color: '#7a4a28', roughness: 0.75, bone: 'dagger', detail: 0.003 });
    const bellProfile = profile.polygon(
      [
        [0, 0.108],
        [0.012, 0.106],
        [0.022, 0.095],
        [0.03, 0.07],
        [0.038, 0.04],
        [0.05, 0.034],
        [0.05, 0.026],
        [0.0, 0.026],
      ],
      { smooth: true, samples: 5 },
    );
    const dome = sdf.revolve(bellProfile).subtract(sdf.sphere(0.034).at(0, 0.008, 0));
    const knob = sdf.sphere(0.014).at(0, 0.112, 0);
    const clapper = sdf.sphere(0.012).at(0, 0.03, 0);
    // The bell is 0.114 m tall at scale 1; 1.1 keeps it big enough to read. Its knob top sits at the fist's base.
    const bell = sdf.smoothUnion(0.006, dome, knob, clapper).scale(1.1).at(F[0], F[1] - 0.184, F[2]);
    k.body('bell', bell, { color: '#e0b040', roughness: 0.35, metalness: 0.8, bone: 'dagger', detail: 0.003 });
  },
  extra(k, g) {
    const head = g.head;
    // Orange bandana: a round cap over the skull, low at the back, wrapped by a thicker band at the
    // brow, with a knot at the right temple and two cloth ends (one long, one short) that hang behind.
    const n = Math.hypot(1, 0.3);
    const capBase = sdf.ellipsoid([0.205, 0.168, 0.205]).scale(1.07).at(0, 0.7, -0.005);
    const cap = capBase.intersect(sdf.halfSpace([0, -1 / n, 0.3 / n], -0.735 / n));
    const wrapBand = capBase
      .round(0.012)
      .intersect(sdf.box([0.8, 0.04, 0.8], 0.01).rotateX(-16.7).at(0, 0.755, 0));
    const knot = sdf.ellipsoid([0.05, 0.04, 0.045]).at(-0.085, 0.79, -0.15);
    const endLong = sdf.chain(
      [
        [-0.09, 0.78, -0.16, 0.03],
        [-0.12, 0.72, -0.19, 0.03],
        [-0.14, 0.64, -0.2, 0.018],
      ],
      0.015,
    );
    const endShort = sdf.chain(
      [
        [-0.075, 0.785, -0.165, 0.026],
        [-0.05, 0.735, -0.2, 0.024],
        [-0.04, 0.69, -0.215, 0.014],
      ],
      0.012,
    );
    const scarf = sdf.smoothUnion(0.02, cap, wrapBand, knot, endLong, endShort).bone('head');
    k.body('headscarf', scarf, { color: k.tint('scarf'), roughness: 0.85, bump: (x, y, z) => 0.003 * noise.fbm(x * 30, y * 30, z * 30, 2) });

    // Friendly arched brows over the big eyes (the base's painted brows are hidden in the skin color).
    const faceZ = (x: number, y: number) => g.faceZ(x, y);
    const browPts: [number, number][] = [
      [0.06, 0.742],
      [0.09, 0.754],
      [0.125, 0.758],
      [0.158, 0.744],
    ];
    const brow = sdf.chain(
      browPts.map(([x, y]) => [x, y, faceZ(x, y) + 0.002, 0.0095] as [number, number, number, number]),
      0.01,
    );
    k.body('brows', brow.mirror('x').bone('head'), { color: '#4a3222', roughness: 0.7, detail: 0.003 });

    // A big grin: a dark mouth with one white tooth band, as a thin skin over the face.
    const MR = 0.135;
    const shell = (t: number) => head.round(t).subtract(head.round(-0.003));
    const mouthArc = (r: number, w: number, a0: number, a1: number) =>
      sdf.extrude(profile.arc(r, w, a0, a1), 0.3).at(0, 0.542 + MR, 0.1);
    k.body('grin', shell(0.0025).intersect(mouthArc(MR + 0.012, 0.024, 236, 304)).bone('head'), {
      color: '#3a1c18',
      roughness: 0.4,
      detail: 0.003,
    });
    k.body('grin-teeth', shell(0.0045).intersect(mouthArc(MR + 0.001, 0.009, 241, 299)).bone('head'), {
      color: '#f4ecd8',
      roughness: 0.35,
      detail: 0.003,
    });

    // Gold earrings: a stud and a hoop at each ear lobe.
    const lobe = sdf.raycast(head, [1, 0.628, -0.005], [-1, 0, 0]);
    const lx = lobe ? lobe[0] : 0.2;
    const earring = sdf.union(sdf.sphere(0.013).at(lx + 0.008, 0.628, -0.005), sdf.torus(0.017, 0.0055).rotateZ(90).at(lx + 0.012, 0.6, -0.005));
    k.body('earrings', earring.mirror('x', 0).bone('head'), {
      color: '#e0b040',
      roughness: 0.3,
      metalness: 0.8,
      detail: 0.003,
    });
  },
});

// The kind builds the arm in a fixed pose. Here its skin body loses the right forearm and fist, the
// skeleton moves the right elbow, wrist, and bell bone to the raised arm, and the outfit adds the new arm.
const raisedArm = sdf
  .smoothUnion(
    0.02,
    sdf.cone(SH_R, E2, 0.046, 0.04).bone('upperarm.R'),
    sdf.cone(E2, W2, 0.04, 0.036).bone('forearm.R'),
    sdf.capsule(W2, F, 0.034).bone('hand.R'),
    sdf
      .smoothUnion(
        0.018,
        sdf.ellipsoid([0.05, 0.05, 0.048]).at(F[0], F[1], F[2]),
        sdf.capsule([F[0] + 0.022, F[1] - 0.034, F[2] + 0.04], [F[0] + 0.022, F[1] + 0.034, F[2] + 0.04], 0.02),
        sdf.cone([F[0] - 0.03, F[1] + 0.022, F[2] + 0.03], [F[0] + 0.01, F[1] + 0.012, F[2] + 0.046], 0.019, 0.014),
      )
      .bone('hand.R'),
  );
const oldArmZone = sdf.box([0.25, 0.3, 0.4]).at(-0.305, 0.3, 0.1);

const asset: AssetDefinition = {
  ...base,
  async build(k: AssetContext) {
    const wrapped: AssetContext = {
      ...k,
      body(name, shape, options) {
        k.body(name, name === 'skin' ? shape.subtract(oldArmZone).union(raisedArm) : shape, options);
      },
      // The kind's attack and taunt swing a dagger at arm's length; with the arm already raised they
      // would drive the bell into the head. This goblin rings the bell instead (same names and timing).
      animation(name, def) {
        if (name !== 'attack' && name !== 'taunt') {
          k.animation(name, def);
          return;
        }
        const big = name === 'taunt';
        k.animation(name, {
          ...def,
          pose: (_t, ph) => {
            const env = Math.sin(Math.PI * ph);
            const ring = Math.sin(ph * Math.PI * 2 * (big ? 5 : 4));
            return {
              hips: { move: [0, 0.012 * Math.abs(ring) * env, 0] },
              'upperarm.R': { rotate: [-8 * env, 0, -6 * env] },
              'forearm.R': { rotate: [-10 * env, 0, 0] },
              'hand.R': { rotate: [(big ? 16 : 12) * ring * env, 0, 0] },
              dagger: { rotate: [(big ? 26 : 20) * ring * env, 0, 0] },
            };
          },
        });
      },
      skeleton(def) {
        const fore = def['forearm.R'];
        const hand = def['hand.R'];
        const dagger = def['dagger'];
        k.skeleton(
          fore && hand && dagger
            ? { ...def, 'forearm.R': { ...fore, at: E2 }, 'hand.R': { ...hand, at: W2 }, dagger: { ...dagger, at: F } }
            : def,
        );
      },
    };
    await base.build(wrapped);
  },
};

export default asset;
