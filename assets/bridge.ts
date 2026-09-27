import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';
import type { Rgb } from '../src/index.js';

/**
 * Design note
 * Role: hamlet footbridge, a background landmark prop for a cozy chibi fantasy village.
 *   It must read as a bridge at 128 px, from the side and from the three-quarter view.
 * Size: about 4.1 m span along X, 1.8 m wide along Z, about 1.0 m tall. Stands on y = 0.
 * One idea: a gentle warm-wood arch. A bright plank deck sweeps up over a small rise,
 *   framed by dark chunky rails and four rounded newel posts with iron bolts at the ends.
 * Shape language: round and friendly (arched deck, rounded posts, soft rails), with the
 *   sturdy square rhythm of the posts and the calm triangle of the arch as the secondary.
 * Palette (60/30/10): deck planks #cf9a5b dominant (light warm brown), frame #5e3618 dark
 *   brown secondary, iron #33363b and a small touch of moss #5f7d3a as the accent.
 * Materials: deck planks (wood, roughness 0.80), frame rails and posts (wood, roughness
 *   0.85), iron bolts (metalness 0.75, roughness 0.5). Plank seams, grain, and moss are paint.
 * Detail list: primary = arched deck slab; secondary = side rails, newel posts, balusters,
 *   end sills; tertiary = plank seams, wood grain (bump), iron bolts, moss at the feet.
 * Focal point: the bright plank deck under the dark arched rail line.
 * Rig / animation: none.
 */

// ------------------------------------------------------------------ dimensions
const HALF = 1.86; // half span of the deck along X
const W = 1.8; // deck width along Z
const HW = W / 2;
const THICK = 0.15; // deck thickness
const RISE = 0.32; // arch rise at the crown
const RAIL_H = 0.5; // top rail height above the deck top
const LOW_H = 0.19; // lower rail height above the deck top
const RAIL_Z = HW - 0.09; // rail center across the width, tucked behind the posts
const POST_Z = HW - 0.09; // newel post center (post outer face is the widest point)
const POST_D = 0.17; // newel post depth along Z
const POST_X = HALF - 0.07; // newel post center along the span
const SILL_X = HALF + 0.08; // end sill center

const PLANK = 0.17; // plank width along the span

// ------------------------------------------------------------------ palette
const plankA = rgb('#cf9a5b');
const plankB = rgb('#a9763d');
const plankLight = rgb('#d9a565');
const plankDark = rgb('#4f2e12');
const frameA = rgb('#5e3618');
const frameB = rgb('#331c0a');
const frameLight = rgb('#a06a38');
const iron = rgb('#33363b');
const moss = rgb('#5f7d3a');

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Deck bottom curve: flat at the ground at both ends, rising to `RISE` at the crown. */
const archBot = (x: number) => RISE * (1 - (x / HALF) ** 2);
/** Deck top curve: a constant `THICK` above the bottom. */
const archTop = (x: number) => archBot(x) + THICK;

export default defineAsset({
  name: 'bridge',
  description:
    'Small arched wooden footbridge: warm plank deck, chunky dark side rails, and rounded end posts.',
  detail: 0.012,
  texture: { size: 1024 },

  build(k) {
    // A closed band between two curves in the XY plane, ready to extrude along Z. `sdf.extrude`
    // keeps the profile exact and only rounds the front and back edges, so the deck underside
    // sits exactly on y = 0 at both ends.
    const archBand = (
      bot: (x: number) => number,
      top: (x: number) => number,
      x0: number,
      x1: number,
      n = 44,
    ) => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        pts.push([x, bot(x)]);
      }
      for (let i = n; i >= 0; i--) {
        const x = x0 + ((x1 - x0) * i) / n;
        pts.push([x, top(x)]);
      }
      return profile.polygon(pts);
    };

    /** Soft moss that creeps up from the damp feet: a strong noise mask near the ground. */
    const mossAt = (x: number, y: number, z: number, reach: number) =>
      clamp01(clamp01((reach - y) / reach) * (0.35 + 0.65 * noise.fbm(x * 9, y * 9, z * 9, 2)) * 0.9);

    // ------------------------------------------------------------------ deck (focal point)
    // Planks run across the width (Z); seams fall along the span (X).
    const plankOf = (x: number) => {
      const u = (x + HALF) / PLANK;
      const i = Math.floor(u);
      return { i, f: u - i };
    };
    const deck = sdf.extrude(archBand(archBot, archTop, -HALF, HALF), W, 0.025).paintFn((x, y, z): Rgb => {
      const { i, f } = plankOf(x);
      const tint = noise.random(i, 3);
      const grain = 0.5 + 0.5 * noise.noise3(x * 26, y * 6, z * 4);
      let c = mixRgb(plankA, plankB, 0.1 + 0.45 * tint);
      c = mixRgb(c, plankDark, 0.08 + 0.2 * grain);
      // The walking surface is sun-bleached and light: the deck is the bright focal band.
      const sun = clamp01((y - archTop(x) + 0.03) / 0.06);
      c = mixRgb(c, plankLight, 0.26 * sun);
      if (f < 0.07) c = mixRgb(c, plankDark, sun > 0.4 ? 0.82 : 0.55); // plank gap
      // End grain on the two long side faces reads darker than the walking surface.
      const edge = clamp01((Math.abs(z) - (HW - 0.07)) / 0.07);
      c = mixRgb(c, plankDark, 0.45 * edge);
      return mixRgb(c, moss, mossAt(x, y, z, 0.05));
    });
    k.body('deck', deck, {
      color: '#cf9a5b',
      roughness: 0.8,
      detail: 0.013,
      bump: (x, y, z) => {
        const { f } = plankOf(x);
        const seam = f < 0.07 ? -0.004 : 0;
        return seam + 0.0017 * noise.fbm(x * 26, y * 6, z * 4, 2);
      },
    });

    // ------------------------------------------------------------------ frame: rails, posts, sills
    const frameParts: sdf.Shape[] = [];

    // Top rail and lower rail per side, following the deck arch so they stay a constant
    // hand height above the walking surface.
    const railAt = (sign: number, height: number, half: number, depth: number) => {
      const center = (x: number) => archTop(x) + height;
      return sdf
        .extrude(
          archBand(
            (x) => center(x) - half,
            (x) => center(x) + half,
            -HALF + 0.06,
            HALF - 0.06,
          ),
          depth,
          0.045,
        )
        .at(0, 0, sign * RAIL_Z);
    };

    // Rounded newel post with a squashed ball head, standing on the deck at each corner.
    const postAt = (sx: number, sz: number) => {
      const x = sx * POST_X;
      const z = sz * POST_Z;
      const base = archTop(x) - 0.06;
      const head = archTop(x) + RAIL_H + 0.03;
      return sdf.union(
        sdf.box([0.15, head - base, POST_D], 0.028).at(x, (base + head) / 2, z),
        sdf.box([0.19, 0.05, 0.2], 0.022).at(x, head - 0.01, z),
        sdf.ellipsoid([0.08, 0.055, 0.08]).at(x, head + 0.045, z),
      );
    };

    // Thin baluster between the deck and the top rail, tucked behind the rail line.
    const balusterAt = (bx: number, sz: number) => {
      const z = sz * RAIL_Z;
      const base = archTop(bx) - 0.03;
      const top = archTop(bx) + RAIL_H - 0.02;
      return sdf.box([0.072, top - base, 0.072], 0.018).at(bx, (base + top) / 2, z);
    };

    // End sill: a chunky threshold resting flat on the ground, wider than the deck.
    const sillAt = (sx: number) => sdf.box([0.2, 0.15, W + 0.1], 0.025).at(sx * SILL_X, 0.075, 0);

    for (const sz of [1, -1]) {
      frameParts.push(railAt(sz, RAIL_H, 0.055, 0.13), railAt(sz, LOW_H, 0.042, 0.1));
      for (const bx of [-0.95, 0, 0.95]) frameParts.push(balusterAt(bx, sz));
      for (const sx of [1, -1]) frameParts.push(postAt(sx, sz));
    }
    for (const sx of [1, -1]) frameParts.push(sillAt(sx));

    const frame = sdf.union(...frameParts).paintFn((x, y, z): Rgb => {
      const grain = 0.5 + 0.5 * noise.noise3(x * 5, y * 26, z * 18);
      let c = mixRgb(frameA, frameB, 0.2 + 0.5 * grain);
      // Sun-worn tops catch the light, so the rails read against the dark sides.
      const sun = clamp01((y - archTop(x) - RAIL_H + 0.05) / 0.08);
      c = mixRgb(c, frameLight, 0.55 * sun);
      return mixRgb(c, moss, mossAt(x, y, z, 0.05));
    });
    k.body('frame', frame, {
      color: '#5e3618',
      roughness: 0.85,
      detail: 0.012,
      bump: (x, y, z) => 0.0017 * noise.fbm(x * 12, y * 34, z * 20, 2),
    });

    // ------------------------------------------------------------------ iron bolts (accent)
    // On the outer face of each newel post, proud of the rail so they read from every view.
    const bolts: sdf.Shape[] = [];
    const boltZ = POST_Z + POST_D / 2 + 0.006;
    for (const sz of [1, -1]) {
      for (const sx of [1, -1]) {
        const px = sx * POST_X;
        for (const h of [RAIL_H, LOW_H]) {
          bolts.push(
            sdf
              .cylinder(0.034, 0.03, 0.008)
              .rotateX(90)
              .at(px, archTop(px) + h, sz * boltZ),
          );
        }
      }
    }
    k.body('bolts', sdf.union(...bolts), {
      color: '#33363b',
      roughness: 0.5,
      metalness: 0.75,
      detail: 0.007,
    });
  },
});
