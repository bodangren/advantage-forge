import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — the grape bunch (Chibi Sprouts props).
 *
 * Role: a song-video prop for week 3; must read at 128 px.
 * Size: 0.20 m tall; the bunch rests on y = 0 on its lowest grapes, with the stem above.
 * One idea: a bunch of purple grapes, wide at the top and tapering down, with a brown stem
 *   and one green grape leaf.
 * Shape language: round grapes in tight rows, one flat five-point leaf.
 * Palette: purple #7b4a9e (grapes), with the values from #6c3f8c to #8a56ad, brown #6b4a2e
 *   (stem), leaf green #5fa364 (leaf).
 * Materials: soft shiny grapes (roughness 0.4), a matte stem (roughness 0.85).
 * Detail list: primary the sixteen grapes; secondary the stem and the leaf; tertiary the
 *   value change from grape to grape.
 * Rig/animation: none (static prop).
 */

const DEG = Math.PI / 180;

const GRAPE = rgb('#7b4a9e');
const DARK = rgb('#6c3f8c');
const LIGHT = rgb('#8a56ad');

const R = 0.022; // the grape radius
const ROW_GAP = 0.038; // the gap between the rows
const COUNTS = [2, 3, 3, 4, 4]; // the grapes per row, from the bottom
const STAGGER = [0, 60, 0, 45, 0]; // the angle of the first grape in each row

/** The grape centres: a ring per row, so the neighbours touch. */
const centres: [number, number, number][] = [];
for (let row = 0; row < COUNTS.length; row++) {
  const n = COUNTS[row]!;
  const y = R + row * ROW_GAP;
  const ring = R / Math.sin(Math.PI / n);
  for (let i = 0; i < n; i++) {
    const a = (STAGGER[row]! + (i * 360) / n) * DEG;
    centres.push([Math.cos(a) * ring, y, Math.sin(a) * ring]);
  }
}

/** The paint: every grape takes its own value from the dark purple to the light one. */
const grapePaint = (x: number, y: number, z: number) => {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < centres.length; i++) {
    const c = centres[i]!;
    const d = (x - c[0]) ** 2 + (y - c[1]) ** 2 + (z - c[2]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return mixRgb(DARK, LIGHT, noise.random(best, 1, 2));
};

export default defineAsset({
  name: 'grape-bunch',
  description: 'A bunch of purple grapes, wide at the top and tapering down, with a brown stem and one green leaf.',
  detail: 0.0036,
  texture: { size: 1024 },

  build(k) {
    // The bunch: sixteen grapes in five rows.
    let bunch = sdf.sphere(R).at(...centres[0]!);
    for (const c of centres.slice(1)) bunch = bunch.smoothUnion(0.004, sdf.sphere(R).at(...c));

    // The stem: a short brown capsule from the top centre.
    const stem = sdf.capsule([0, 0.19, 0], [0, 0.23, 0], 0.006);

    // The leaf: a flat five-point profile at the stem.
    // Five lobes with shallow notches, so the profile reads as a grape leaf and not as a star.
    const star = profile.polygon(
      [
        [0.0333, 0.0108],
        [0.0141, 0.0194],
        [0, 0.035],
        [-0.0141, 0.0194],
        [-0.0333, 0.0108],
        [-0.0228, -0.0074],
        [-0.0206, -0.0282],
        [0, -0.024],
        [0.0206, -0.0282],
        [0.0228, -0.0074],
      ],
      { smooth: true },
    );
    const leaf = sdf.extrude(star, 0.008, 0.0025).at(0.03, 0.222, 0);

    k.body('grapes', bunch.paintFn(grapePaint), {
      color: '#7b4a9e',
      roughness: 0.4,
      metalness: 0,
      textureDensity: 2,
    });
    k.body('stem', stem, { color: '#6b4a2e', roughness: 0.85 });
    k.body('leaf', leaf, { color: '#5fa364', roughness: 0.8 });
  },
});
