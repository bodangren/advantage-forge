import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — iron helmet (equipment/armor/iron-helmet).
 *
 * Role: hero gear for the chibi party; seen as a pickup, an icon, and on a head, so the dome,
 *   brow band, and nasal must read at 128 px.
 * Size: about 0.46 m wide, 0.42 m tall, 0.46 m deep (cavity 0.215 x 0.21 x 0.20 over the hero head, 1x fit), resting on its rim on y = 0, face toward +Z.
 * One idea: an open iron nasal helm — a round bowl shell with a raised riveted brow band, a
 *   ridged nasal plate hanging over the face, and two short cheek guards at the sides.
 * Shape language: round dominant (dome, rivets, rounded plates); the nasal point is the one
 *   crisp accent.
 * Palette: one iron family — body #4a4f55 everywhere, shadow #363a3f inside, worn highlight
 *   #a8acb1 scuffed on the crown and on every rivet. No pale band on a dark shell.
 * Materials: a single worn-iron body (roughness 0.5, metalness 0.7); reflections stay calm
 *   (no displacement, only a whisper of bump).
 * Detail: primary shell + band; secondary nasal plate with ridge and 2 rivets, cheek guards,
 *   6 band rivets; tertiary crown scuffs. Focal point: brow band + nasal. No rig (static item).
 */

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');

// Fit contract: the whole build is scaled about its origin so the cavity is 0.215 x 0.21 x 0.20.
const FIT: [number, number, number] = [1.25, 1.4, 1.17];
const BAND_Y = 0.146; // brow band center height

export default defineAsset({
  name: 'iron-helmet',
  description:
    'Open iron nasal helm for a chibi hero: a round riveted brow band, a ridged nasal plate, and short cheek guards over a dark shell interior.',
  detail: 0.004,
  reference: 'docs/item-mockups/iron-helmet-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ shell
    // One closed revolved profile traces the whole wall: up the outside, over the
    // crown, down the inside, and across the rim — an upside-down bowl, open at
    // the bottom, with a 10-12 mm wall.
    const shellProfile = profile.polygon(
      [
        [0.15, -0.012],
        [0.163, 0.03],
        [0.176, 0.09],
        [0.18, 0.146],
        [0.174, 0.19],
        [0.156, 0.235],
        [0.12, 0.272],
        [0.068, 0.295],
        [0, 0.302],
        [0, 0.288],
        [0.057, 0.282],
        [0.108, 0.26],
        [0.144, 0.224],
        [0.162, 0.182],
        [0.168, 0.14],
        [0.164, 0.084],
        [0.151, 0.026],
        [0.139, -0.012],
      ],
      { smooth: true, samples: 10 },
    );
    const dome = sdf.revolve(shellProfile);
    // Solid dome and hollow for band shells, rivet probes, and inside paint.
    const outerProfile = profile.polygon(
      [
        [0.15, -0.02],
        [0.163, 0.03],
        [0.176, 0.09],
        [0.18, 0.146],
        [0.174, 0.19],
        [0.156, 0.235],
        [0.12, 0.272],
        [0.068, 0.295],
        [0, 0.302],
      ],
      { smooth: true, samples: 10 },
    );
    const innerProfile = profile.polygon(
      [
        [0.139, -0.02],
        [0.151, 0.026],
        [0.164, 0.084],
        [0.168, 0.14],
        [0.162, 0.182],
        [0.144, 0.224],
        [0.108, 0.26],
        [0.057, 0.282],
        [0, 0.288],
      ],
      { smooth: true, samples: 10 },
    );
    const domeOuter = sdf.revolve(outerProfile);
    const domeInner = sdf.revolve(innerProfile);

    // Face opening: a smooth stencil pushed through the front, wide at the brow,
    // narrowing to the chin. It stops short of the back, so the shell curves down
    // to the nape behind.
    const opening = sdf.extrude(
      profile.polygon(
        [
          [-0.145, 0.16],
          [0.145, 0.16],
          [0.16, 0.12],
          [0.16, 0.07],
          [0.158, 0.02],
          [0.13, -0.03],
          [0.1, -0.032],
          [-0.1, -0.032],
          [-0.13, -0.03],
          [-0.158, 0.02],
          [-0.16, 0.07],
          [-0.16, 0.12],
        ],
        { smooth: true, samples: 6 },
      ),
      0.45,
      0.008,
    ).at(0, 0, 0.22);

    // ------------------------------------------------------------------ cheek guards
    // One rounded plate hugging the side of the shell, mirrored hard.
    const cheek = sdf
      .box([0.105, 0.115, 0.04], 0.012)
      .rotateY(38)
      .at(0.113, 0.085, 0.144)
      .mirror('x', 0);

    // ------------------------------------------------------------------ nasal guard
    // A shield plate tucked under the band, with a center ridge and two rivets.
    const nasalPlate = sdf.extrude(
      profile.polygon(
        [
          [-0.045, 0.172],
          [0.045, 0.172],
          [0.038, 0.1],
          [0.028, 0.058],
          [0, 0.022],
          [-0.028, 0.058],
          [-0.038, 0.1],
        ],
        { smooth: true, samples: 6 },
      ),
      0.02,
      0.006,
    ).at(0, 0, 0.19);
    const nasalRidge = sdf.capsule([0, 0.16, 0.201], [0, 0.04, 0.198], 0.0055);
    const nasalRivets = sdf.union(
      sdf.sphere(0.0085).at(-0.018, 0.118, 0.198),
      sdf.sphere(0.0085).at(0.018, 0.118, 0.198),
    );

    // ------------------------------------------------------------------ brow band + rivets
    const shellOf = (s: sdf.Shape, out: number, inn: number) =>
      s.round(out).subtract(s.round(-inn));
    const band = shellOf(domeOuter, 0.006, 0.005).smoothIntersect(
      0.005,
      sdf.box([0.5, 0.036, 0.5], 0.01).at(0, BAND_Y, 0),
    );
    // Six rivets across the front of the band, probed on the dome surface.
    const bandRivets = [];
    for (const deg of [-70, -45, -20, 20, 45, 70]) {
      const a = (deg * Math.PI) / 180;
      const at = sdf.surfacePoint(domeOuter, [Math.sin(a) * 0.19, BAND_Y, Math.cos(a) * 0.19], 0.007);
      bandRivets.push(sdf.sphere(0.0105).at(at[0], at[1], at[2]));
    }
    const rivets = sdf.union(...bandRivets, nasalRivets);

    // ------------------------------------------------------------------ combine + paint
    const helmet = dome
      .smoothSubtract(0.006, opening)
      .smoothUnion(0.005, cheek)
      .smoothUnion(0.004, nasalPlate)
      .smoothUnion(0.003, nasalRidge)
      .union(band)
      .union(rivets)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z, base) => {
        let c = base;
        // Worn scuffs on the crown only; the shell stays one iron family.
        const crown = Math.min(1, Math.max(0, (y - 0.185) / 0.1));
        const wear = 0.5 + 0.5 * noise.fbm(x * 26 + 7, y * 26, z * 26 - 3, 3);
        c = mixRgb(c, IRON_HI, 0.45 * crown * crown * Math.max(0, (wear - 0.38) / 0.62));
        return c;
      })
      .paintWhere(domeInner.round(0.004), IRON_DARK, 0.01)
      .paintWhere(rivets.round(0.002), IRON_HI, 0.005);

    k.body('iron', helmet.scale(FIT), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 5200,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });
  },
});
