import { profile, sdf } from '../src/index.js';
import { horseAsset } from './parts/horse-kind.js';
import { saddle } from './parts/horse-tack.js';

/**
 * Warhorse — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/warhorse`), about 1.3 m to the
 * plume and 1.1 m from muzzle to tail, faces +Z. Target: docs/wildlife-mockups/warhorse_001.jpg
 * (made with mmx from the horse mockup).
 *
 * The horse of `assets/horse.ts` (body, head, rig, and clips from `assets/parts/horse-kind.ts`) in
 * barding: a silver chanfron down the face with a red plume, a red cloth peytral over the chest
 * with a gold trim and a gold sun on each shoulder, a red caparison under a dark saddle
 * (`assets/parts/horse-tack.ts`), and fluffy white feathering over the hooves; a dark grey coat
 * with a white mane and tail.
 * Role: the knight's mount and a parade or battle horse; the silver face, the red cloth, and the
 *   white mane read at 128 px.
 * Palette (60/30/10): dark grey coat #5c5c62 and white mane; red cloth #b8323a with gold #e0b040;
 *   silver #c8ccd2 chanfron as the accent.
 */

const GOLD = '#e0b040';
const SILVER = '#c8ccd2';

// A sun: a disc with eight pointed rays (in the XY plane).
const sun = profile.polygon(
  Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * 2 * Math.PI;
    const r = i % 2 === 0 ? 0.046 : 0.026;
    return [r * Math.sin(a), r * Math.cos(a)] as [number, number];
  }),
);

export default horseAsset({
  name: 'warhorse',
  description: 'Chibi warhorse: a dark grey horse with big glossy eyes, a white mane and tail, a silver chanfron with a red plume, a red cloth peytral and caparison with a gold trim and gold suns, a dark saddle, and fluffy white feathering over its hooves; quadruped rig.',
  reference: 'docs/wildlife-mockups/warhorse_001.jpg',
  variants: {
    coat: { slate: '#5c5c62', black: '#2e2a28', grey: '#b0b0b4', bay: '#6e3e26' },
    mane: { white: '#f0ece4', black: '#2a2624', silver: '#a8a8ac' },
    eyes: { brown: '#2a1a12', blue: '#4f6f8c', amber: '#8a5a1a' },
    cloth: { red: '#b8323a', blue: '#3a5ab0', green: '#3a7a4a', purple: '#6a3a90' },
  },
  presets: {
    black: { coat: 'black', mane: 'black', eyes: 'amber', cloth: 'blue' },
    grey: { coat: 'grey', mane: 'white', eyes: 'blue', cloth: 'green' },
    bay: { coat: 'bay', mane: 'black', eyes: 'brown', cloth: 'purple' },
  },
  colors: { leather: '#9aa0a8', buckle: GOLD, hoof: '#2a2624', muzzle: '#8a8a90', coatDark: '#3e3e44', brow: '#2a2a2e' },
  muzzleFollow: 0.9,
  blaze: false,
  extra(k, horse) {
    const cloth = k.tint('cloth');
    saddle(k, horse, { blanket: cloth, trim: GOLD, leather: '#3a2a24', metal: SILVER, drop: 0.24, stirrups: false, breast: false });
    // The peytral: a cloth apron over the front of the chest and the shoulders, its lower edge
    // scalloped, with a gold trim and a gold sun on each shoulder.
    const trunk = horse.trunk;
    const apron = trunk
      .round(0.014)
      .smoothIntersect(0.012, sdf.box([0.6, 0.26, 0.3], 0.05).at(0, 0.53, 0.22))
      .subtract(...[-0.12, -0.04, 0.04, 0.12].map((x) => sdf.sphere(0.05).at(x, 0.39, 0.34)));
    const apronInner = sdf.box([1, 0.19, 0.3]).at(0, 0.535, 0.255);
    const sh = sdf.raycast(trunk, [1, 0.52, 0.2], [-1, 0, 0])!;
    const suns = sdf.extrude(sun, 0.2).rotateY(90).at(sh[0], 0.52, 0.2).mirror('x');
    k.body(
      'peytral',
      apron.paintWhere(sdf.box([1, 1, 1]).at(0, 0.53, 0.22).subtract(apronInner), GOLD, 0.004).paintWhere(suns, GOLD, 0.003),
      { color: cloth, roughness: 0.85, detail: 0.004, textureDensity: 1.5 },
    );
    // The chanfron: a silver plate down the face between the eyes, with a ridge, over the head.
    const outline = profile.polygon(
      [[-0.15, 1.07], [0.15, 1.07], [0.16, 0.93], [0.075, 0.85], [0.06, 0.765], [-0.06, 0.765], [-0.075, 0.85], [-0.16, 0.93]],
      { smooth: false },
    );
    const eh = horse.faceHit(0.1, 0.87);
    const eyeHoles = sdf.sphere(0.064).at(eh[0], eh[1], eh[2] - 0.02).mirror('x');
    const plate = horse.head
      .round(0.01)
      .intersect(sdf.extrude(outline, 0.6, 0.02).at(0, 0, 0.5))
      .intersect(sdf.halfSpace([0, 0, -1], -0.25).intersect(sdf.box([0.5, 0.6, 0.6]).at(0, 0.9, 0.5)))
      .subtract(eyeHoles);
    const fh = horse.faceHit(0, 0.85);
    const ridge = sdf.capsule([0, 1.02, fh[2] - 0.035], [0, 0.82, fh[2] + 0.04], 0.012);
    const cup = sdf.sphere(0.024).at(0, 1.085, 0.33);
    k.body('chanfron', sdf.smoothUnion(0.008, plate, ridge, cup), { color: SILVER, roughness: 0.3, metalness: 0.85, detail: 0.004, bone: 'head' });
    // The plume: red feathers from the cup, curling up and back.
    const plume = sdf.smoothUnion(
      0.015,
      sdf.chain([[0, 1.1, 0.335, 0.026], [0, 1.17, 0.33, 0.034], [0, 1.22, 0.29, 0.028], [0, 1.22, 0.24, 0.012]], 0.02),
      sdf.chain([[0, 1.1, 0.335, 0.02], [0.02, 1.16, 0.35, 0.022], [0.03, 1.2, 0.33, 0.01]], 0.015),
      sdf.chain([[0, 1.1, 0.335, 0.02], [-0.02, 1.16, 0.35, 0.022], [-0.03, 1.2, 0.33, 0.01]], 0.015),
    );
    k.body('plume', plume, { color: cloth, roughness: 0.8, detail: 0.004, bone: 'head' });
  },
});
