import { mixRgb, profile, rgb, sdf } from '../src/index.js';
import { CAT_TAIL_TIP, catAsset } from './parts/cat-kind.js';

/**
 * Familiar cat — Chibi Quest wildlife (catalog `wildlife/mounts-and-pets/familiar-cat`), about 0.48
 * m to the ear tips, faces +Z. Target: docs/wildlife-mockups/familiar-cat_001.jpg (made with mmx).
 *
 * The cat kind (`assets/parts/cat-kind.ts`: the dire wolf's body, rig, and clips at 0.6 scale) as a
 * wizard's black familiar: a black coat with a dark grey chest, big glowing violet irises with small pupils, violet
 * ear insides, pale whiskers, a purple collar with a glowing crescent moon charm, and a small
 * glowing star at the tail tip.
 * Role: a magic pet that follows the wizard hero (an avatar pet later); the glowing eyes and the
 *   moon charm read at 128 px, also in dark scenes.
 * Palette (60/30/10): black #2a2632 and dark grey #4a4452; purple collar #6a3a9a; glowing violet
 *   #b070ff eyes, moon, and star as the accent.
 */

export default catAsset({
  name: 'familiar-cat',
  description: 'Chibi familiar cat: a black cat with a big round head, big glowing violet irises with small pupils, pale whiskers, a purple collar with a glowing crescent moon charm, and a glowing star on the tip of its long curled tail; quadruped rig.',
  reference: 'docs/wildlife-mockups/familiar-cat_001.jpg',
  // The mockup sits: the rest pose stands (for the walk), and the `sit` clip holds the sitting pose.
  sit: true,
  // A big head over short legs, with a small muzzle.
  headScale: 1.4,
  muzzleWidth: 0.75,
  variants: {
    fur: { black: '#2a2632', grey: '#6a6670', white: '#ece8f0' },
    markings: { grey: '#4a4452', black: '#1e1a24', silver: '#c8c4d0' },
    eyes: { violet: '#8a3ae0', gold: '#e0a020', green: '#30c060', blue: '#3a88e8' },
    magic: { violet: '#b070ff', gold: '#f0c040', green: '#60e080', blue: '#60b0ff' },
  },
  presets: {
    grey: { fur: 'grey', markings: 'black', eyes: 'gold', magic: 'gold' },
    white: { fur: 'white', markings: 'silver', eyes: 'blue', magic: 'blue' },
    green: { fur: 'black', markings: 'grey', eyes: 'green', magic: 'green' },
  },
  colors: { earInner: '#6a4a8a', nose: '#8a6aa0', whisker: '#c8c0d0', eyeRim: '#5a2a9a', furLight: '#3e3848' },
  eyeGlow: 1.2,
  eyeScale: 1.6,
  pupilScale: 1.05,
  extra(k, w) {
    const magic = k.tint('magic');
    // The collar: a band over the neck and the chest, lower in front.
    const neckline = sdf.smoothUnion(
      0.04,
      sdf.smoothUnion(0.07, sdf.ellipsoid([0.15, 0.15, 0.16]).at(0, 0.29, 0.03), sdf.ellipsoid([0.12, 0.12, 0.09]).at(0, 0.37, 0.08)),
      sdf.ellipsoid([0.115, 0.12, 0.075]).at(0, 0.31, 0.15),
    );
    const collar = neckline.round(0.014).smoothSubtract(0.004, neckline.round(-0.008)).smoothIntersect(0.006, sdf.box([0.6, 0.036, 0.6], 0.01).rotateX(29).at(0, 0.35, 0.075));
    k.body('collar', collar, { color: '#6a3a9a', roughness: 0.5, detail: 0.003, bone: 'neck' });
    // The charm: a big crescent moon hanging at the front of the collar with a small star beside
    // it, and a star at the tail tip.
    const front = sdf.raycast(collar, [0, 0.27, 2], [0, 0, -1]);
    const fz = (front?.[2] ?? 0.22) + 0.008;
    const moon = sdf
      .extrude(profile.circle(0.032), 0.01, 0.003)
      .subtract(sdf.extrude(profile.circle(0.027), 0.1).at(0.016, 0.01, 0))
      .at(0, 0.235, fz);
    const starShape = (r: number) =>
      profile.polygon(
        Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * 2 * Math.PI;
          const rr = i % 2 === 0 ? r : r * 0.38;
          return [rr * Math.sin(a), rr * Math.cos(a)] as [number, number];
        }),
      );
    const charmStar = sdf.extrude(starShape(0.016), 0.008, 0.002).at(0.042, 0.25, fz - 0.004);
    k.body('charm-star', charmStar, { color: magic, emissive: magic, emissiveIntensity: 1.6, roughness: 0.3, detail: 0.002, bone: 'neck' });
    const star = sdf.extrude(
      profile.polygon(Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * 2 * Math.PI;
        const r = i % 2 === 0 ? 0.032 : 0.014;
        return [r * Math.sin(a), r * Math.cos(a)] as [number, number];
      })),
      0.012,
      0.003,
    ).at(CAT_TAIL_TIP[0], CAT_TAIL_TIP[1], CAT_TAIL_TIP[2] - 0.01);
    k.body('moon-charm', moon, { color: magic, emissive: magic, emissiveIntensity: 1.6, roughness: 0.3, detail: 0.002, bone: 'neck' });
    k.body('tail-star', star, { color: magic, emissive: magic, emissiveIntensity: 1.6, roughness: 0.3, detail: 0.002, bone: 'tail' });
    // Glossy glowing eyes over the painted ones: a lens on each eye, dark violet at the top and
    // bright violet at the bottom, with a small dark pupil, a big highlight at the upper outer side,
    // and a small one below it.
    const e = w.eye;
    const n = [e[0] - 0, e[1] - 0.5, e[2] - 0.17];
    const nl = Math.hypot(n[0]!, n[1]!, n[2]!);
    const [nx, ny, nz] = [n[0]! / nl, n[1]! / nl, n[2]! / nl];
    const R = 0.054;
    const dark = rgb(w.tone('eyes', '#3a0c78', 1));
    const light = rgb(w.tone('eyes', '#d6a4ff', 1));
    const lensLocal = sdf
      .ellipsoid([R, R * 1.06, 0.022])
      .paintFn((_x, y) => mixRgb(dark, light, Math.min(1, Math.max(0, 0.5 - y / (R * 1.4)))))
      .paintWhere(sdf.ellipsoid([R * 0.26, R * 0.36, 0.05]), '#120a1a', 0.003)
      .paintWhere(sdf.sphere(R * 0.3).at(R * 0.34, R * 0.38, 0.02), '#ffffff', 0.003)
      .paintWhere(sdf.sphere(R * 0.12).at(-R * 0.3, -R * 0.42, 0.02), '#ffffff', 0.002);
    const lens = lensLocal
      .rotateX(-Math.asin(ny) * (180 / Math.PI))
      .rotateY(Math.atan2(nx, nz) * (180 / Math.PI))
      .at(e[0] - nx * 0.006, e[1] - ny * 0.006, e[2] - nz * 0.006);
    k.body('eye-lens', lens.mirror('x').bone('head'), { color: w.tint.eye, emissive: magic, emissiveIntensity: 0.45, roughness: 0.08, detail: 0.002, textureDensity: 2 });
    // A small soft ridge of fur on the top of the head.
    const top = sdf.raycast(w.head, [0, 2, 0.2], [0, -1, 0])!;
    const ridge = sdf.cone([top[0], top[1] - 0.02, top[2]], [top[0], top[1] + 0.035, top[2] - 0.01], 0.022, 0.004).scale([0.6, 1, 1]);
    k.body('ridge', ridge.bone('head'), { color: w.tint.fur, roughness: 0.85, detail: 0.003 });
  },
});
