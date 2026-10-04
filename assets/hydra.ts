import { mixRgb, motion, noise, profile, rgb, sdf } from '../src/index.js';
import { dragonAsset } from './parts/dragon-kind.js';

/**
 * Hydra — Chibi Quest monster (catalog `monsters/beast/hydra`), a three-headed drake about 0.95 m
 * to the horns, faces +Z. Target: docs/monster-mockups/hydra_001.jpg (made with mmx).
 *
 * The drake (`assets/drake.ts`; body, main head, rig, and clips from `assets/parts/dragon-kind.ts`)
 * as a friendly hydra: purple scales with a big cream belly, small white horns and a yellow spot on
 * the main head, a teal saddle with purple spots down the back, white back spikes, and two small
 * teal heads on long purple necks that reach out to the sides from behind the main head. The side
 * heads have big black eyes, a yellow spot, and small fins, and they snap forward in the attack while
 * the main head sprays a jet of water in place of the fire.
 * Role: a dragon of the lakes and the marshes; the three heads read at 128 px.
 * Palette (60/30/10): purple #8a6ac8 scales; cream #f4ecd0 belly; teal #4ac0b0 side heads and
 *   saddle with yellow #f2d040 spots as the accent.
 * Bones added: `neck2.L`, `head2.L` (and `.R`) for the side heads.
 */
type V3 = [number, number, number];

const NECK_ROOT: V3 = [0.11, 0.43, -0.08];
const NECK_MID: V3 = [0.24, 0.53, -0.06];
const HEAD2: V3 = [0.36, 0.59, -0.02];
const mx = (p: V3): V3 => [-p[0], p[1], p[2]];

export default dragonAsset({
  name: 'hydra',
  description: 'Chibi hydra monster: a purple three-headed drake with a big cream belly, small white horns and a yellow spot on the main head, a teal saddle with purple spots and white spikes down the back, and two small teal side heads with big black eyes on long purple necks; dragon rig with two extra necks.',
  reference: 'docs/monster-mockups/hydra_001.jpg',
  variants: {
    scales: { purple: '#8a6ac8', blue: '#5a78c8', rose: '#c06a9a' },
    belly: { cream: '#f4ecd0', pale: '#ecf0f2', peach: '#f4d8c0' },
    eyes: { brown: '#4a3050', blue: '#2a4a8a', green: '#2a6a40' },
    heads: { teal: '#4ac0b0', mint: '#7ad0a0', gold: '#e8b84a' },
  },
  presets: {
    lake: { scales: 'blue', belly: 'pale', eyes: 'blue', heads: 'mint' },
    bloom: { scales: 'rose', belly: 'peach', eyes: 'green', heads: 'gold' },
  },
  palette: {
    redDark: '#6a4aa0',
    creamLine: '#d8cca8',
    horn: '#f6f2ea',
    hornBase: '#e6dccb',
    brow: '#5a3c8a',
    claw: '#f2ecd8',
    eyeLow: '#2a1a30',
    fireCore: '#eefcff',
    fire: '#86d8f0',
    fireTip: '#3a9ad8',
  },
  looks: {
    crest: { color: '#eef6f2' },
  },
  wings: false,
  headCrest: false,
  friendly: true,
  tailFin: false,
  horn: [
    [0.1, 0.81, -0.02, 0.034],
    [0.13, 0.855, -0.03, 0.025],
    [0.15, 0.89, -0.035, 0.008],
  ],
  hornBaseBelow: 0.8,
  bones: {
    'neck2.L': { parent: 'chest', at: NECK_ROOT },
    'head2.L': { parent: 'neck2.L', at: HEAD2, tail: [0.48, 0.62, 0.06] },
    'neck2.R': { parent: 'chest', at: mx(NECK_ROOT) },
    'head2.R': { parent: 'neck2.R', at: mx(HEAD2), tail: [-0.48, 0.62, 0.06] },
  },
  paint(scales, tint, k) {
    const teal = k.tint('heads');
    const spot = k.tint('scales', { color: '#a07ad8', follow: 1 });
    const yellow = '#f2d040';
    // A teal saddle down the back with purple spots, and a yellow spot on the forehead.
    return scales
      .paintFn((x, y, z, c) => {
        const back = Math.min(1, Math.max(0, (-z - 0.05) * 14)) * Math.min(1, Math.max(0, (0.46 - y) * 20)) * Math.min(1, Math.max(0, (y - 0.08) * 20));
        if (back <= 0) return c;
        const dot = noise.noise3(x * 30, y * 30, z * 30) > 0.45;
        return mixRgb(c, rgb(dot ? spot : teal), back);
      })
      .paintWhere(sdf.capsule([0, 0.8, 0], [0, 0.8, 0.4], 0.024), yellow, 0.003);
  },
  extra(k, d) {
    void d;
    const teal = k.tint('heads');
    // The side necks: from behind the main head out to the sides.
    const neck = sdf.chain([[...NECK_ROOT, 0.05], [...NECK_MID, 0.045], [...HEAD2, 0.042]], 0.015).bone('neck2.L');
    k.body('side-necks', neck.mirror('x'), { color: k.tint('scales'), roughness: 0.6 });
    // A side head, built facing +Z at the origin and turned out: a round skull, a short snout, big
    // black eyes with a shine, a yellow spot on top, a small smile, and two small fins at the back.
    const skull = sdf.smoothUnion(0.03, sdf.ellipsoid([0.075, 0.068, 0.075]).at(0, 0.02, 0.0), sdf.ellipsoid([0.058, 0.042, 0.06]).at(0, -0.005, 0.06));
    const smile = sdf.extrude(profile.arc(0.04, 0.008, 230, 310), 0.2).at(0, 0.03, 0.1);
    const head = skull.paintWhere(sdf.capsule([0, 0.06, 0], [0, 0.12, 0.02], 0.016), '#f2d040', 0.002).paintWhere(smile, '#3a2a40', 0.002);
    const eyeAt = sdf.surfacePoint(skull, [0.045, 0.04, 0.07], -0.008);
    const eye = sdf
      .sphere(0.02)
      .at(...eyeAt)
      .paintWhere(sdf.sphere(0.007).at(eyeAt[0] + 0.004, eyeAt[1] + 0.009, eyeAt[2] + 0.016), '#ffffff', 0.001)
      .mirror('x');
    const fins = sdf
      .union(sdf.cone([0.05, 0.03, -0.03], [0.1, 0.06, -0.07], 0.022, 0.004).scale([1, 1, 0.5]), sdf.cone([0.05, 0.0, -0.04], [0.1, -0.02, -0.08], 0.018, 0.004).scale([1, 1, 0.5]))
      .mirror('x');
    const place = (s: sdf.Shape) => s.scale(1.35).rotateY(28).at(HEAD2[0] + 0.09, HEAD2[1] + 0.02, HEAD2[2] + 0.05);
    // Tagged before the mirror, so the right head follows `head2.R`.
    k.body('side-heads', place(sdf.smoothUnion(0.012, head, fins.paint(teal))).bone('head2.L').mirror('x'), { color: teal, roughness: 0.55 });
    k.body('side-eyes', place(eye).bone('head2.L').mirror('x'), { color: '#18141c', roughness: 0.15, detail: 0.003 });
  },
  pose(clip, p) {
    const { wave, keys } = motion;
    const both = (neck: V3, head: V3) => ({
      'neck2.L': { rotate: neck },
      'neck2.R': { rotate: [neck[0], -neck[1], -neck[2]] as V3 },
      'head2.L': { rotate: head },
      'head2.R': { rotate: [head[0], -head[1], -head[2]] as V3 },
    });
    if (clip === 'idle') return both([0, 6 * wave(p, 1, 0.2), 5 * wave(p, 1, 0.4)], [4 * wave(p, 2), 10 * wave(p, 1, 0.5), 0]);
    if (clip === 'walk' || clip === 'run') return both([0, 4 * wave(p, 1, 0.3), 7 * wave(p, 2, 0.2)], [0, 0, -5 * wave(p, 2, 0.4)]);
    if (clip === 'attack') {
      // The side heads draw back, then snap forward and bite.
      const b = keys(p, [[0, 0], [0.25, -0.6], [0.45, 1], [0.7, 1], [1, 0]]);
      return both([0, -38 * Math.max(0, b) + 12 * Math.max(0, -b), 6 * b], [8 * b, -20 * Math.max(0, b), 0]);
    }
    if (clip === 'hit') {
      const h = keys(p, [[0, 0], [0.16, 1], [0.4, 0.7], [1, 0]]);
      return both([0, 18 * h, 12 * h], [-14 * h, 0, 0]);
    }
    if (clip === 'death') {
      const dr = keys(p, [[0.2, 0], [0.6, 1], [0.68, 0.9], [0.76, 1]]);
      // The body rolls onto its right side; both necks swing back to lie along the ground behind it.
      return both([0, 100 * dr, 0], [12 * dr, 0, 0]);
    }
    if (clip === 'roar') {
      const r = keys(p, [[0, 0], [0.25, 1], [0.75, 1], [1, 0]]);
      return both([0, -10 * r, 24 * r], [-18 * r, 0, 0]);
    }
    return {};
  },
});
