import { defineAsset, mixRgb, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — handheld lantern (equipment/accessories/lantern-handheld).
 *
 * Role: handheld gear for chibi quest heroes; must read at 128 px sprite.
 * Size: 0.35 m tall, stands on y = 0, faces +Z.
 * One idea: a chunky iron lantern whose warm candle glow is the only bright
 *   spot — everything else is dark iron and glass.
 * Shape language: round dominant (bulged glass chamber, cone roof, ring
 *   handle), square secondary (chunky base block, straight corner bars).
 * Palette: iron #4a4f55 / dark #363a3f / highlight #a8acb1 (dominant dark
 *   metal); pale glass #cfd8dd; wax #e8ddc8; accent: flame glow #ff9a3c
 *   emissive on dark base #4a1405; gold #d4a93a knob.
 * Materials: worn iron (roughness 0.5, metalness 0.7), glass (roughness 0.1,
 *   opacity 0.35), wax (roughness 0.6), emissive flame (roughness 0.2,
 *   emissiveIntensity 1.8), gold knob (metalness 1).
 * Detail: primary = base + glass chamber + cone roof + ring handle;
 *   secondary = four corner bars, collar rings, finial; tertiary = none.
 *   Focal point: the glowing flame behind the glass.
 * Rig/animation: none (static hand item).
 */

const IRON_MID = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_LIGHT = rgb('#a8acb1');
const GOLD = '#d4a93a';
const WAX = '#e8ddc8';

const GLASS_TOP = 0.235;
const GLASS_BOT = 0.055;

export default defineAsset({
  name: 'lantern-handheld',
  description:
    'Chunky iron handheld lantern with four glass panes, a glowing candle flame, a cone roof, and a ring handle.',
  detail: 0.005,
  reference: 'docs/item-mockups/lantern-handheld-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ iron frame
    // Chunky round base, slightly wider foot, flat on y = 0.
    const base = sdf
      .revolve(
        profile.polygon(
          [
            [0.055, 0],
            [0.085, 0],
            [0.09, 0.008],
            [0.088, 0.022],
            [0.078, 0.032],
            [0.055, 0.037],
            [0, 0.037],
          ],
          { smooth: true },
        ),
      )
      .intersect(sdf.halfSpace([0, -1, 0], 0));

    // Collar ring under the glass, and ring above it where the cone sits.
    const collar = sdf.cylinder(0.062, 0.018, 0.006).at(0, 0.046, 0);
    const topRing = sdf.cylinder(0.068, 0.02, 0.007).at(0, 0.242, 0);

    // Four corner bars framing the glass into four panes, running from the
    // base edge up into the roof brim so nothing floats.
    const barAt = (x: number, z: number) =>
      sdf.capsule([x, 0.02, z], [x, 0.248, z], 0.0075);
    const bars = sdf.union(
      barAt(0.06, 0.06),
      barAt(-0.06, 0.06),
      barAt(0.06, -0.06),
      barAt(-0.06, -0.06),
    );

    // Cone roof: crisp revolved triangle brim tapering to a small finial.
    const roof = sdf.smoothUnion(
      0.005,
      sdf
        .revolve(
          profile.polygon(
            [
              [0, 0.244],
              [0.086, 0.244],
              [0.008, 0.302],
              [0, 0.302],
            ],
          ),
        )
        .intersect(sdf.halfSpace([0, -1, 0], -0.244)),
      sdf.sphere(0.009).at(0, 0.304, 0),
    );

    // Ring handle standing in the XY plane so it reads as a loop up front,
    // loop bottom meeting the finial so the attachment is clear.
    const handle = sdf.torus(0.024, 0.006).rotateX(90).at(0, 0.324, 0);

    const ironShape = sdf.union(base, collar, topRing, bars, roof, handle);
    const ironPaint = (x: number, y: number, z: number) => {
      let c = mixRgb(IRON_MID, IRON_DARK, Math.min(1, Math.max(0, 1 - y / 0.28)));
      // Warm highlight on upward-facing and top parts of the frame.
      c = mixRgb(c, IRON_LIGHT, 0.28 * Math.min(1, Math.max(0, (y - 0.2) / 0.15)));
      return c;
    };
    k.body('iron-frame', ironShape.paintFn(ironPaint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      maxTriangles: 1850,
    });

    // ------------------------------------------------------------------ glass panes
    // Bulged chamber clipped between two heights; the four corner bars make
    // it read as four panes.
    const glassShape = sdf
      .revolve(
        profile.polygon(
          [
            [0.048, GLASS_BOT],
            [0.072, 0.09],
            [0.08, 0.145],
            [0.072, 0.2],
            [0.048, GLASS_TOP],
          ],
          { smooth: true },
        ),
      )
      .intersect(sdf.halfSpace([0, -1, 0], -GLASS_BOT))
      .intersect(sdf.halfSpace([0, 1, 0], GLASS_TOP))
      .shell(0.008);
    k.body('glass', glassShape, {
      color: '#cfd8dd',
      roughness: 0.1,
      metalness: 0,
      opacity: 0.28,
      detail: 0.005,
      maxTriangles: 1300,
    });

    // ------------------------------------------------------------------ candle + flame
    // Wax candle on a small dish inside the base, flame centered in the glass.
    const dish = sdf.cylinder(0.03, 0.008, 0.003).at(0, 0.041, 0);
    const candle = sdf.cylinder(0.017, 0.06, 0.004).at(0, 0.08, 0);
    k.body(
      'candle',
      sdf.smoothUnion(0.006, dish, candle).paint(WAX),
      { color: WAX, roughness: 0.6, metalness: 0, detail: 0.005, maxTriangles: 400 },
    );

    // Teardrop flame: round base licking up into a point, emissive on dark.
    const flame = sdf.smoothUnion(
      0.006,
      sdf.sphere(0.015).at(0, 0.122, 0),
      sdf.cone([0, 0.118, 0], [0, 0.175, 0], 0.013, 0.001),
    );
    k.body('flame', flame, {
      color: '#4a1405',
      roughness: 0.2,
      metalness: 0,
      emissive: '#ff9a3c',
      emissiveIntensity: 1.3,
      detail: 0.0045,
      maxTriangles: 350,
    });

    // ------------------------------------------------------------------ gold knob
    // Small gold knob on the front of the base, the metal accent.
    const knob = sdf.capsule([0, 0.02, 0.085], [0, 0.02, 0.1], 0.009);
    k.body('knob', knob, {
      color: GOLD,
      roughness: 0.3,
      metalness: 1,
      detail: 0.0045,
      maxTriangles: 200,
    });
  },
});
