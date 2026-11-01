import { defineAsset, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — Storytime week 1 wall pictures, a class A page prop.
 * Role: the kindergarten wall in the story pages `pat`, `may`, and `cover-hello`. Those rows ask
 *   for "a wall with big colorful animal pictures and no letters". A child of about 5 years must
 *   name each animal at one look, and must never find a letter.
 * One idea: three framed picture-book pages in a row, each with one flat bright background and one
 *   big flat animal: an orange lion on light blue, a grey-blue elephant on light yellow, and a
 *   green frog on pink.
 * Size: each picture is 0.55 m wide and 0.45 m tall with a 0.03 m frame. The gap between pictures
 *   is 0.12 m, so the row is 1.89 m wide. The frame backs sit on the plane z = 0 and the bottom
 *   edge sits on the plane y = 0, so the stage puts the row flat on a wall and lifts it with `y`.
 *   The row is centered on x = 0 and faces +Z.
 * Layer depth: the frame is a border ring of the full 0.038 m picture depth, with a 0.004 m back
 *   plate and an opening of 0.49 by 0.39 m; its front is flush with the front face of the deepest
 *   animal layer. Background 0.004 to 0.024 m, and 0.01 m wider than the opening on each side, so
 *   its edge sits inside the frame. Animal layers 0.022 to 0.038 m in four 0.010 m slabs, each
 *   0.002 m in front of the layer below. Every layer overlaps the one behind it, so nothing sinks
 *   into the background and nothing floats off it. Each slab is at least 0.010 m thick, so the
 *   mesher never collapses it (a 0.006 m slab did collapse in round 49).
 * Line art: `texture: false` and one body for each color, so every edge is a hard color step. Each
 *   pair of touching colors differs by 0.3 or more in one channel (0 to 1), so the 1-bit line art
 *   (src/storytime/line-art-pass.ts) draws one closed stroke around every color area. Every feature
 *   is 0.05 m or more across, so no feature becomes a blob at page size: eyes 0.062 m, lion nose
 *   0.07 m, tusks 0.05 m, mane lobes 0.05 m deep. No thin lines, no hair strokes, no fine texture.
 * Materials: matte painted board, roughness 0.85, no metal, no glass.
 * Detail: no text, letter, number, word, or logo anywhere; no human face. Rated G.
 * Rig and animation: none.
 */

const FRAME = rgb('#c98a4b');

const LION_BG = rgb('#a5dcf7');
const LION_MANE = rgb('#9c3f12');
const LION_FACE = rgb('#f8b04a');
const LION_MUZZLE = rgb('#fff0d0');

const ELEPHANT_BG = rgb('#ffd95c');
const ELEPHANT_EAR = rgb('#54708c');
const ELEPHANT_BODY = rgb('#a9bccd');
const ELEPHANT_TUSK = rgb('#fbf3e0');

const FROG_BG = rgb('#ffb8d1');
const FROG_BODY = rgb('#4e9e3a');
const FROG_BELLY = rgb('#f4efb8');

const DARK = rgb('#2a1a10');

const PICTURE_W = 0.55;
const PICTURE_H = 0.45;
const FRAME_W = 0.03;
const GAP = 0.12;
const PICTURE_CY = 0.225;
/** Picture centers: 0.55 m wide each with a 0.12 m gap, so the row is 1.89 m wide. */
const PICTURE_X = [-(PICTURE_W + GAP), 0, PICTURE_W + GAP];

/** The four animal layers, each 0.010 m thick and 0.002 m in front of the one before. */
const LAYER = [0.027, 0.029, 0.031, 0.033] as const;
const SLAB = 0.01;

/**
 * The frame is a border of the full picture depth, and its front sits flush with the front face of
 * the deepest animal layer. Round 51 fix: the frame front used to sit 0.010 m behind the picture
 * face, so at an oblique view (the classroom pages) the border read as a second board offset
 * behind the picture, with a wood tab below it. The border now runs forward past every layer, so
 * one closed ring surrounds the picture on all four sides at one depth.
 */
const FRAME_DEPTH = LAYER[3] + SLAB / 2;
/** A back plate behind the picture, so the frame reads as one solid board from behind. It is
 *  0.012 m thick, above the 0.007 m mesh cell, because a 0.004 m plate collapsed in round 51. */
const FRAME_BACK = 0.012;

/** A lobe ring: n points on the outer radius and n points on the inner radius, in turn. */
const lobeRing = (outer: number, inner: number, lobes: number, cy = 0) =>
  profile.polygon(
    Array.from({ length: lobes * 2 }, (_, i) => {
      const a = (i / (lobes * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? outer : inner;
      return [Math.cos(a) * r, cy + Math.sin(a) * r] as [number, number];
    }),
  );

/** A smooth closed blob of half-width rx and half-height ry, centered at cy. */
const blob = (rx: number, ry: number, cy = 0) =>
  profile.polygon(
    Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return [Math.cos(a) * rx, cy + Math.sin(a) * ry] as [number, number];
    }),
    { smooth: true },
  );

/** One flat slab of a 2D profile, laid on an animal layer at a picture-local point. */
const flat = (
  shape: ReturnType<typeof profile.circle>,
  cx: number,
  lx: number,
  ly: number,
  layer: 0 | 1 | 2 | 3,
  sx = 1,
  sy = 1,
) =>
  sdf
    .extrude(shape, SLAB)
    .scale([sx, sy, 1])
    .at(cx + lx, PICTURE_CY + ly, LAYER[layer]!);

const triangle = (halfW: number, top: number, tip: number) =>
  profile.polygon([
    [-halfW, top],
    [halfW, top],
    [0, tip],
  ]);

export default defineAsset({
  name: 'storytime-animal-pictures',
  description:
    'Three framed picture-book pages in a row for a kindergarten wall: an orange lion on light blue, a grey-blue elephant on light yellow, and a green frog on pink. No letters.',
  detail: 0.006,
  texture: false,

  build(k) {
    // ---------------------------------------------------------------- frames and backgrounds
    PICTURE_X.forEach((cx, i) => {
      const opening = sdf
        .box(
          [PICTURE_W - 2 * FRAME_W, PICTURE_H - 2 * FRAME_W, FRAME_DEPTH - FRAME_BACK + 0.04],
          0.001,
        )
        .at(cx, PICTURE_CY, FRAME_BACK + (FRAME_DEPTH - FRAME_BACK + 0.04) / 2);
      k.body(
        `frame-${i + 1}`,
        sdf
          .box([PICTURE_W, PICTURE_H, FRAME_DEPTH], 0.005)
          .at(cx, PICTURE_CY, FRAME_DEPTH / 2)
          .subtract(opening),
        { color: FRAME, roughness: 0.85, paintWeight: 1, detail: 0.007 },
      );
    });
    const bg = [LION_BG, ELEPHANT_BG, FROG_BG];
    PICTURE_X.forEach((cx, i) => {
      k.body(
        `backdrop-${i + 1}`,
        sdf
          .box([PICTURE_W - 2 * FRAME_W + 0.02, PICTURE_H - 2 * FRAME_W + 0.02, 0.02], 0.002)
          .at(cx, PICTURE_CY, 0.014),
        { color: bg[i]!, roughness: 0.85, paintWeight: 1, detail: 0.01 },
      );
    });

    // ---------------------------------------------------------------- picture 1: the lion
    const lion = PICTURE_X[0]!;
    k.body('lion-mane', flat(lobeRing(0.18, 0.13, 12, 0.005), lion, 0, 0, 0), {
      color: LION_MANE,
      roughness: 0.85,
      paintWeight: 1,
      detail: 0.006,
    });
    k.body('lion-face', flat(profile.circle(0.115), lion, 0, -0.005, 1), {
      color: LION_FACE,
      roughness: 0.85,
      paintWeight: 1,
      detail: 0.006,
    });
    k.body('lion-muzzle', flat(profile.circle(0.062), lion, 0, -0.062, 2, 1.35, 1), {
      color: LION_MUZZLE,
      roughness: 0.85,
      paintWeight: 1,
      detail: 0.005,
    });
    k.body(
      'lion-eyes',
      flat(profile.circle(0.031), lion, -0.055, 0.035, 3).union(
        flat(profile.circle(0.031), lion, 0.055, 0.035, 3),
      ),
      { color: DARK, roughness: 0.85, paintWeight: 1, detail: 0.004 },
    );
    k.body('lion-nose', flat(triangle(0.035, 0.018, -0.03), lion, 0, -0.024, 3), {
      color: DARK,
      roughness: 0.85,
      paintWeight: 1,
      detail: 0.003,
    });

    // ---------------------------------------------------------------- picture 2: the elephant
    const el = PICTURE_X[1]!;
    k.body(
      'elephant-ears',
      flat(profile.circle(0.078), el, -0.115, 0.055, 0).union(
        flat(profile.circle(0.078), el, 0.115, 0.055, 0),
      ),
      { color: ELEPHANT_EAR, roughness: 0.85, paintWeight: 1, detail: 0.006 },
    );
    k.body(
      'elephant-head',
      flat(profile.circle(0.12), el, 0, 0.035, 1)
        .union(flat(profile.circle(0.036), el, 0.005, -0.075, 1))
        .union(flat(profile.circle(0.031), el, 0.03, -0.115, 1))
        .union(flat(profile.circle(0.027), el, 0.06, -0.148, 1)),
      { color: ELEPHANT_BODY, roughness: 0.85, paintWeight: 1, detail: 0.006 },
    );
    k.body(
      'elephant-tusks',
      flat(triangle(0.025, 0.03, -0.03), el, -0.075, -0.06, 2).union(
        flat(triangle(0.025, 0.03, -0.03), el, 0.075, -0.06, 2),
      ),
      { color: ELEPHANT_TUSK, roughness: 0.85, paintWeight: 1, detail: 0.004 },
    );
    k.body(
      'elephant-eyes',
      flat(profile.circle(0.031), el, -0.048, 0.075, 3).union(
        flat(profile.circle(0.031), el, 0.048, 0.075, 3),
      ),
      { color: DARK, roughness: 0.85, paintWeight: 1, detail: 0.004 },
    );

    // ---------------------------------------------------------------- picture 3: the frog
    const frog = PICTURE_X[2]!;
    k.body(
      'frog-body',
      flat(blob(0.2, 0.128, -0.05), frog, 0, 0, 1)
        .union(flat(profile.circle(0.062), frog, -0.112, 0.075, 1))
        .union(flat(profile.circle(0.062), frog, 0.112, 0.075, 1)),
      { color: FROG_BODY, roughness: 0.85, paintWeight: 1, detail: 0.006 },
    );
    k.body('frog-belly', flat(profile.circle(0.078), frog, 0, -0.075, 2), {
      color: FROG_BELLY,
      roughness: 0.85,
      paintWeight: 1,
      detail: 0.005,
    });
    k.body(
      'frog-eyes',
      flat(profile.circle(0.032), frog, -0.112, 0.082, 3).union(
        flat(profile.circle(0.032), frog, 0.112, 0.082, 3),
      ),
      { color: DARK, roughness: 0.85, paintWeight: 1, detail: 0.004 },
    );
  },
});
