import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — horned helmet (equipment/armor/horned-helmet).
 *
 * Role: hero gear for the chibi party; seen as a pickup, an icon, and on a head,
 *   so the dome, brow band, nasal, and above all the two horns must read at 128 px.
 * Size: fit contract 1x (docs/equipment-fit.md): inner cavity radii ~0.215 x 0.21 x 0.20 over
 *   the hero head, bowl ~0.46 wide x 0.43 deep, ~0.38 m to the crown, ~0.60 m to the horn tips,
 *   built at 0.30 m and scaled by FIT below, resting on its rim on y = 0, face toward +Z, open at the bottom.
 * One idea: a round iron nasal helm carrying two big cream horns that sweep
 *   outward, then curl up — the horns are the silhouette, oversized on purpose.
 * Shape language: round dominant (dome, rivets, curled horns); the nasal point
 *   is the one crisp accent.
 * Palette: one iron family — body #4a4f55, shadow #363a3f inside, worn highlight
 *   #a8acb1 scuffed on the crown and on every rivet; cream horns #e9dcbc with
 *   paler tips #f4ead2 as the warm accent.
 * Materials: worn iron (roughness 0.5, metalness 0.7) and horn (roughness 0.45,
 *   metalness 0). No displacement on metal; only a whisper of bump.
 * Detail: primary shell + horns; secondary brow band with 6 rivets, nasal plate
 *   with ridge and 2 rivets; tertiary crown scuffs. Focal point: horns + brow band.
 * Rig/animation: none (static item).
 */

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');
const HORN = rgb('#e9dcbc');
const HORN_TIP = rgb('#f4ead2');

const FIT: [number, number, number] = [1.55, 1.5, 1.45]; // whole build, about the origin

const BAND_Y = 0.121; // brow band center height

export default defineAsset({
  name: 'horned-helmet',
  description:
    'Round iron nasal helm for a chibi hero with two big curled cream horns, a riveted brow band, and a ridged nose guard, open at the bottom.',
  detail: 0.004,
  reference: 'docs/item-mockups/horned-helmet-mock.jpg',
  texture: { size: 1024 },
  equip: { slot: 'head', origin: [0, 0.15, 0] },

  build(k) {
    // ------------------------------------------------------------------ shell
    // One closed revolved profile traces the whole wall: up the outside, over
    // the crown, down the inside, and across the rim — an upside-down bowl,
    // open at the bottom, with a ~11 mm wall. 0.30 m wide at the brow.
    const shellProfile = profile.polygon(
      [
        [0.125, -0.01],
        [0.136, 0.025],
        [0.147, 0.075],
        [0.15, 0.121],
        [0.145, 0.158],
        [0.13, 0.196],
        [0.1, 0.227],
        [0.057, 0.246],
        [0, 0.252],
        [0, 0.239],
        [0.048, 0.233],
        [0.09, 0.216],
        [0.119, 0.184],
        [0.134, 0.153],
        [0.139, 0.113],
        [0.135, 0.068],
        [0.125, 0.022],
        [0.114, -0.01],
      ],
      { smooth: true, samples: 10 },
    );
    const dome = sdf.revolve(shellProfile);
    // Solid dome and hollow for band shells, rivet probes, and inside paint.
    const outerProfile = profile.polygon(
      [
        [0.125, -0.012],
        [0.136, 0.025],
        [0.147, 0.075],
        [0.15, 0.121],
        [0.145, 0.158],
        [0.13, 0.196],
        [0.1, 0.227],
        [0.057, 0.246],
        [0, 0.252],
      ],
      { smooth: true, samples: 10 },
    );
    const innerProfile = profile.polygon(
      [
        [0.114, -0.012],
        [0.125, 0.022],
        [0.135, 0.068],
        [0.139, 0.113],
        [0.134, 0.153],
        [0.119, 0.184],
        [0.09, 0.216],
        [0.048, 0.233],
        [0, 0.239],
      ],
      { smooth: true, samples: 10 },
    );
    const domeOuter = sdf.revolve(outerProfile);
    const domeInner = sdf.revolve(innerProfile);

    // Face opening: a smooth stencil pushed through the front, wide at the
    // brow, narrowing to the chin. It stops short of the back, so the shell
    // curves down to the nape behind.
    const opening = sdf.extrude(
      profile.polygon(
        [
          [-0.124, 0.132],
          [0.124, 0.132],
          [0.136, 0.098],
          [0.134, 0.055],
          [0.128, 0.012],
          [0.104, -0.024],
          [0.078, -0.027],
          [-0.078, -0.027],
          [-0.104, -0.024],
          [-0.128, 0.012],
          [-0.134, 0.055],
          [-0.136, 0.098],
        ],
        { smooth: true, samples: 6 },
      ),
      0.45,
      0.008,
    ).at(0, 0, 0.185);

    // ------------------------------------------------------------------ horns
    // One smooth tapered chain per side: root buried in the dome at brow
    // height, bulging outward, then curling up to a point. Mirrored hard — the
    // roots sit inside the shell, so the seam is hidden.
    const horn = sdf
      .chain(
        [
          [0.086, 0.136, 0.012, 0.038], // root, buried in the shell
          [0.17, 0.175, 0.006, 0.046], // bulge outward
          [0.224, 0.248, 0, 0.035], // sweeping up
          [0.244, 0.328, -0.006, 0.021], // curling
          [0.225, 0.398, -0.012, 0.007], // tip
        ],
        0.02,
      )
      .mirror('x', 0);

    // ------------------------------------------------------------------ nasal guard
    // A shield plate tucked under the band, with a center ridge and two rivets.
    const nasalPlate = sdf.extrude(
      profile.polygon(
        [
          [-0.04, 0.144],
          [0.04, 0.144],
          [0.034, 0.088],
          [0.024, 0.05],
          [0, 0.018],
          [-0.024, 0.05],
          [-0.034, 0.088],
        ],
        { smooth: true, samples: 6 },
      ),
      0.018,
      0.005,
    ).at(0, 0, 0.157);
    const nasalRidge = sdf.capsule([0, 0.132, 0.168], [0, 0.034, 0.165], 0.0048);
    const nasalRivets = sdf.union(
      sdf.sphere(0.0075).at(-0.016, 0.098, 0.164),
      sdf.sphere(0.0075).at(0.016, 0.098, 0.164),
    );

    // ------------------------------------------------------------------ brow band + rivets
    const shellOf = (s: sdf.Shape, out: number, inn: number) =>
      s.round(out).subtract(s.round(-inn));
    const band = shellOf(domeOuter, 0.005, 0.004).smoothIntersect(
      0.005,
      sdf.box([0.44, 0.032, 0.44], 0.008).at(0, BAND_Y, 0),
    );
    // Six rivets across the front of the band, probed on the dome surface.
    const bandRivets = [];
    for (const deg of [-68, -43, -18, 18, 43, 68]) {
      const a = (deg * Math.PI) / 180;
      const at = sdf.surfacePoint(domeOuter, [Math.sin(a) * 0.16, BAND_Y, Math.cos(a) * 0.16], 0.006);
      bandRivets.push(sdf.sphere(0.009).at(at[0], at[1], at[2]));
    }
    const rivets = sdf.union(...bandRivets, nasalRivets);

    // ------------------------------------------------------------------ iron body
    const helmet = dome
      .smoothSubtract(0.006, opening)
      .smoothUnion(0.004, nasalPlate)
      .smoothUnion(0.003, nasalRidge)
      .union(band)
      .union(rivets)
      .intersect(sdf.halfSpace([0, -1, 0], 0))
      .paintFn((x, y, z, base) => {
        let c = base;
        // Worn scuffs on the crown only; the shell stays one iron family.
        const crown = Math.min(1, Math.max(0, (y - 0.155) / 0.09));
        const wear = 0.5 + 0.5 * noise.fbm(x * 26 + 7, y * 26, z * 26 - 3, 3);
        c = mixRgb(c, IRON_HI, 0.45 * crown * crown * Math.max(0, (wear - 0.38) / 0.62));
        return c;
      })
      .paintWhere(domeInner.round(0.004), IRON_DARK, 0.01)
      .paintWhere(rivets.round(0.002), IRON_HI, 0.005)
      .scale(FIT);

    k.body('iron', helmet, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.004,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 2350,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 90, y * 90, z * 90, 2),
    });

    // ------------------------------------------------------------------ horns
    // Cream horn, paler toward the tip, a warm accent against the iron.
    k.body('horn', horn.scale(FIT), {
      color: '#e9dcbc',
      roughness: 0.45,
      metalness: 0,
      detail: 0.0055,
      maxTriangles: 1500,
      paintFn: (x, y, z, base) => {
        const t = Math.min(1, Math.max(0, (Math.hypot(x / FIT[0], z / FIT[2]) - 0.14) / 0.1 + (y / FIT[1] - 0.17) / 0.25));
        return mixRgb(base, HORN_TIP, 0.65 * Math.min(1, Math.max(0, t)));
      },
    });
  },
});
