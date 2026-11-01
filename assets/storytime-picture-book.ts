import { defineAsset, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 picture book, a class A story-page prop.
 * Role: the open picture book on Sam's lap in the week 1 row `sam` ("Sam ... sits in the reading
 *   corner with a picture book on his lap and waves"). A child of about 5 years must read an open
 *   picture book at one look at page size.
 * One idea: an open hardcover book with a red cover border, cream pages, a sunken gutter at the
 *   spine, one big yellow sun on the left page, and one big blue fish on the right page.
 * Size: the book is 0.36 m wide and 0.24 m deep when open. The cover shows a 0.014 m border on the
 *   three outer sides. The pages are 0.008 m thick on a 0.006 m cover, so the book is 0.014 m tall.
 * Geometry: the spine runs along the Z axis at x = 0. The spread opens across X and faces +Y. The
 *   book lies flat with its cover base on the plane y = 0, is centered on x = 0 and z = 0, and the
 *   top of the open pages faces up.
 * Spine: a rounded gutter 0.004 m deep and 0.016 m wide runs along the spine, cut with a 0.01 m
 *   cylinder. The gutter surface carries a deeper cream paint, so the open book shows a V at the
 *   spine and not a flat card.
 * Pictures: the sun is a 0.11 m disc; the fish is 0.112 m long with a dorsal fin and a forked tail.
 *   Each picture is one flat slab on the page, so nothing floats and nothing sinks.
 * Line art: `texture: false` and one flat body for each color, so every edge is a hard color step.
 *   Each pair of touching colors differs by 0.3 or more in one channel (0 to 1): the red cover
 *   against cream pages, the sun against cream, the fish against cream, and the gutter against
 *   cream.
 * Materials: matte board and paper, roughness 0.85, no metal, no glass.
 * Detail: no text, letter, number, word, or logo anywhere, and no face. The pictures are flat
 *   shapes only, with no lines that could read as text.
 * Rig and animation: none.
 */

const COVER = rgb('#d9483b');
const PAGE = rgb('#f6eed8');
const GUTTER = rgb('#c9a97a');
const SUN = rgb('#f2c230');
const FISH = rgb('#3d7bd9');

const PAGE_TOP = 0.014;

/** The cover: a flat slab with soft corners, its base on y = 0. */
const cover = sdf.box([0.36, 0.006, 0.24], 0.003).at(0, 0.003, 0);

/** The page block: one cream slab with the spine gutter cut out and painted. */
const gutterCutter = sdf.cylinder(0.01, 0.28).rotateX(90).at(0, 0.02, 0);
const gutterPaint = sdf.cylinder(0.012, 0.28).rotateX(90).at(0, 0.02, 0);
const pages = sdf
  .subtract(sdf.box([0.332, 0.008, 0.212], 0.002).at(0, 0.01, 0), gutterCutter)
  .paintWhere(gutterPaint, GUTTER);

/** The sun: one flat bright disc on the left page, 0.11 m across. */
const sun = sdf.cylinder(0.055, 0.006).at(-0.095, 0.017, 0);

/**
 * The fish: one flat silhouette, drawn as a profile in the XZ plane. The head faces the spine and
 * the forked tail faces the outer page edge. A dorsal fin and the fork make the fish read at page
 * size; the body is 0.112 m long and the fin rises 0.042 m from the centre line.
 */
const fishOutline = [
  [-0.05, 0],
  [-0.042, 0.016],
  [-0.018, 0.026],
  [0.006, 0.03],
  [0.012, 0.042],
  [0.026, 0.024],
  [0.03, 0.01],
  [0.062, 0.03],
  [0.046, 0],
  [0.062, -0.03],
  [0.03, -0.01],
  [0.026, -0.024],
  [-0.018, -0.026],
  [-0.042, -0.016],
];
const fish = sdf
  .extrude(profile.polygon(fishOutline, { smooth: true }), 0.006)
  .rotateX(90)
  .at(0.085, 0.02, 0);

export default defineAsset({
  name: 'storytime-picture-book',
  description:
    'An open hardcover picture book for young children: a red cover border, cream pages, a yellow sun on the left page, and a blue fish on the right page.',
  detail: 0.0015,
  texture: false,

  build(k) {
    k.body('cover', cover, { color: COVER, roughness: 0.85, detail: 0.0018 });
    k.body('pages', pages, { color: PAGE, roughness: 0.85, paintWeight: 1, detail: 0.0015 });
    k.body('sun', sun, { color: SUN, roughness: 0.85, detail: 0.004 });
    k.body('fish', fish, { color: FISH, roughness: 0.85, detail: 0.0012 });
  },
});
