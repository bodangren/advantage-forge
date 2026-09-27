import { defineAsset, sdf, profile, noise, rgb, mixRgb } from '../src/index.js';

/*
 * Iron helmet — Chibi Quest equipment (catalog `equipment/armor/iron-helmet`).
 * A standalone loot/display item, about 0.36 m wide, 0.32 m tall, 0.38 m deep, resting on
 * its rim at y = 0, face opening toward +Z. Target: reference/iron-helmet-mock.jpg.
 *
 * Role: equipment icon and drop; must read at 128 px and sit believably on a chibi hero's
 *   big round head, so the dome is a near-sphere with a wide open face.
 * One idea: a chunky round iron dome with a riveted brow band, a short nasal, and two soft
 *   cheek guards — the classic adventurer's kettle helm.
 * Shape language: round and sturdy (dome, rivet domes, rounded cheek pads) with one straight
 *   accent (the nasal's tapered drop).
 * Palette (60/30/10): worn iron #4a4f55 dominant; shadow #363a3f on the inner shell and low
 *   rim; highlight #a8acb1 worn onto the crown. Roughness 0.5, metalness 0.7, no displacement.
 * Bodies: dome (shell with face opening), ironwork (brow band, crown ridge, nasal, cheek
 *   guards, rivets) — same iron material, kept apart for mesh density.
 * Rig: none; a static item.
 */

const IRON = '#4a4f55';
const IRON_SHADOW = '#363a3f';
const IRON_WEAR = '#a8acb1';
const IRON_DARK = '#3d4248';

export default defineAsset({
  name: 'iron-helmet',
  description: 'Chibi iron helmet: round dome, riveted brow band, nasal guard, cheek guards.',
  detail: 0.005,
  reference: 'docs/item-mockups/iron-helmet-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- dome shell
    const outer = sdf.ellipsoid([0.18, 0.19, 0.19]).at(0, 0.13, 0);
    const inner = sdf.ellipsoid([0.165, 0.175, 0.175]).at(0, 0.135, 0);
    // Face opening: straight across under the brow band, closing slightly toward the chin,
    // reaching past the rim so the front is open all the way down.
    const opening = sdf
      .extrude(
        profile.polygon(
          [
            [-0.16, 0.187],
            [0.16, 0.187],
            [0.135, 0.105],
            [0.115, -0.03],
            [-0.115, -0.03],
            [-0.135, 0.105],
          ],
          { smooth: true, samples: 5 },
        ),
        0.3,
        0.008,
      )
      .at(0, 0, 0.19);

    const dome = outer
      .subtract(inner)
      .smoothSubtract(0.006, opening)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      // Subtle forged patchiness, then worn paint layers.
      .paintFn((x, y, z, base) => {
        const n = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
        return mixRgb(base, rgb(IRON_DARK), 0.24 * n);
      })
      // Brighter worn crown, biased a touch forward so it reads in three-quarter views.
      .paintWhere(sdf.sphere(0.125).at(0.015, 0.29, 0.075), IRON_WEAR, 0.03)
      // Shadowed inner shell, visible through the face opening.
      .paintWhere(inner.round(0.004), IRON_SHADOW, 0.008);
    k.body('dome', dome, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      maxTriangles: 3200,
    });

    // ------------------------------------------------------------- ironwork
    const shellOf = (s: sdf.Shape, out: number, inn: number) => s.round(out).subtract(s.round(-inn));
    const BROW_Y = 0.208;

    // Raised brow band all around; the face opening stops just under its lower edge so the
    // band reads continuous across the front, as on the mock.
    const bandFull = shellOf(outer, 0.009, 0.007).smoothIntersect(
      0.006,
      sdf.box([0.6, 0.046, 0.6], 0.012).at(0, BROW_Y, 0),
    );
    const band = bandFull.smoothSubtract(0.004, opening);

    // Low raised ridge over the crown, front to back, following the dome.
    const ridge = shellOf(outer, 0.008, 0.014)
      .smoothIntersect(0.006, sdf.box([0.03, 0.24, 0.34], 0.012).at(0, 0.32, -0.01))
      .smoothSubtract(0.004, opening);

    // Nasal guard: a small tapered plate hung from the band over the opening.
    const nasal = sdf
      .extrude(
        profile.polygon(
          [
            [0, 0.226],
            [0.036, 0.219],
            [0.033, 0.15],
            [0.026, 0.11],
            [0, 0.085],
            [-0.026, 0.11],
            [-0.033, 0.15],
            [-0.036, 0.219],
          ],
          { smooth: true, samples: 5 },
        ),
        0.016,
        0.004,
      )
      .at(0, 0, 0.177);

    // Cheek guards: soft rounded pads over the cheeks at the opening's sides, clipped to the
    // dome so they hug it, with a flat rounded bottom like little hanging plates.
    const cheek = sdf
      .ellipsoid([0.018, 0.058, 0.048])
      .rotateY(-18)
      .at(0.149, 0.125, 0.048)
      .intersect(outer.round(0.01))
      .intersect(sdf.halfSpace([0, -1, 0], -0.062))
      .round(0.004);
    const cheeks = cheek.mirror('x', 0);

    // Rivets along the brow band, probed on the band surface around the front arc.
    const rivets: sdf.Shape[] = [];
    for (const aDeg of [-60, -40, -20, 0, 20, 40, 60]) {
      const a = (aDeg * Math.PI) / 180;
      const p = sdf.surfacePoint(bandFull, [0.178 * Math.sin(a), BROW_Y, 0.19 * Math.cos(a)], 0.003);
      rivets.push(sdf.sphere(0.01).at(...p));
    }

    const ironwork = sdf
      .union(band, ridge, nasal, cheeks, ...rivets)
      // Worn value accents: cheek pads a touch lighter than the dome shadow side,
      // nasal plate bright worn iron, so the face furniture reads at game size.
      .paintWhere(cheeks.round(0.003), '#6e747c', 0.01)
      .paintWhere(nasal, '#8a9097', 0.008);
    k.body('ironwork', ironwork, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.005,
      maxTriangles: 2600,
    });
  },
});
