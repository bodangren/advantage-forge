import { defineAsset, mixRgb, motion, noise, profile, rgb, sdf, type Rgb } from '../src/index.js';

/**
 * Design note — standing iron prison cage (props/world/cage).
 *
 * Role: dungeon dressing for the Sunken Vault; a landmark prop that must read
 *   as "something is locked in there" at 128 px.
 * Size: 1.0 x 1.0 m footprint, ~1.5 m tall (ring included), stands on y = 0,
 *   centred on Y, door faces +Z.
 * One idea: a heavy square iron cage whose fat corner posts and domed cap
 *   dwarf the barred door — and the fat gold padlock is the focal point.
 * Shape language: square dominant (base frame, rails, door), round secondary
 *   (bars, dome, ring, lock body).
 * Palette: iron mid #4a4f55 (dominant), iron dark #363a3f (shaded undersides),
 *   worn highlight #a8acb1 (small, tops only); gold #d4a93a (accent, the
 *   padlock, metalness 1); interior shadow #14171d. No emissive: nothing burns.
 * Materials: worn iron (roughness 0.5, metalness 0.7, tiny bump), gold lock
 *   (roughness 0.3, metalness 1), matte shadow core (roughness 0.95).
 * Detail list: base frame + floor plate + corner posts (big), bars + rails +
 *   dome + ring (big), door frame + hinges + hasp (medium), padlock + keyhole
 *   (focal point), grime/rust paint (tertiary). Rig: door bone, rattle clip.
 */

const IRON = rgb('#4a4f55');
const IRON_DARK = rgb('#363a3f');
const IRON_HI = rgb('#a8acb1');
const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#9a7723');
const GOLD_HI = rgb('#f0cd6b');
const KEYHOLE = '#1c1206';
const INTERIOR = '#14171d';

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// Shared worn-iron paint: patchy dark grime, pale worn tops, dirty feet.
function ironPaint(x: number, y: number, z: number, base: Rgb): Rgb {
  const patch = noise.fbm(x * 7, y * 7, z * 7, 3);
  const speck = 0.5 + 0.5 * noise.fbm(x * 26, y * 26, z * 26, 2);
  let c = mixRgb(base, IRON_DARK, 0.1 + 0.22 * clamp01(-patch));
  // Pale wear catches on upper surfaces and high spots.
  const hi = clamp01((y - 0.6) / 0.9) * (0.3 + 0.5 * speck);
  c = mixRgb(c, IRON_HI, 0.3 * hi);
  // Grime crawling up from the floor.
  c = mixRgb(c, IRON_DARK, 0.25 * clamp01((0.2 - y) / 0.2));
  return c;
}
const ironBump = (x: number, y: number, z: number) =>
  0.0011 * noise.fbm(x * 40, y * 40, z * 40, 2);

// Cage plan: half-span of the square, bars sit on the 0.45 m lines.
const S = 0.45;
const BAR_R = 0.014; // ~3% of height: reads at 128 px
const POST_R = 0.03;
const BAR_Y0 = 0.06;
const BAR_Y1 = 1.1; // bar tips bury into the dome base
const SIDE_ZS = [-0.315, -0.19, -0.065, 0.065, 0.19, 0.315];
const RAIL_Y = 1.06;

export default defineAsset({
  name: 'cage',
  description:
    'Standing iron prison cage, 1 m square and 1.5 m tall: chunky base frame, vertical bars, domed cap with a lifting ring, barred door rattling on its hinges, closed by a fat gold padlock.',
  detail: 0.008,
  reference: 'docs/item-mockups/cage-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------- frame + bars
    // Square base: four chunky beams + a floor plate to stand on.
    const base = sdf.union(
      sdf.box([1.0, 0.09, 0.1], 0.02).at(0, 0.045, S),
      sdf.box([1.0, 0.09, 0.1], 0.02).at(0, 0.045, -S),
      sdf.box([0.1, 0.09, 0.8], 0.02).at(S, 0.045, 0),
      sdf.box([0.1, 0.09, 0.8], 0.02).at(-S, 0.045, 0),
      sdf.box([0.86, 0.03, 0.86], 0.014).at(0, 0.09, 0),
    );

    // Four fat corner posts carry the whole silhouette.
    const posts = [];
    for (const px of [-S, S]) {
      for (const pz of [-S, S]) {
        posts.push(sdf.capsule([px, 0.034, pz], [px, 1.1, pz], POST_R));
      }
    }

    // Vertical bars: sides and back at a ~0.125 m rhythm; the front leaves a
    // gap in the middle for the door, keeping one bar each side of it.
    const bars = [];
    for (const z of SIDE_ZS) {
      bars.push(sdf.capsule([-S, BAR_Y0, z], [-S, BAR_Y1, z], BAR_R));
      bars.push(sdf.capsule([S, BAR_Y0, z], [S, BAR_Y1, z], BAR_R));
    }
    for (const x of SIDE_ZS) {
      bars.push(sdf.capsule([x, BAR_Y0, -S], [x, BAR_Y1, -S], BAR_R));
    }
    // Front: no plain bars — the door fills the whole front between the posts.

    // Top and bottom rails: three-sided rings (the door frame closes the front).
    const rail = (y: number) =>
      sdf.union(
        sdf.box([0.06, 0.055, 0.9], 0.016).at(-S, y, 0),
        sdf.box([0.06, 0.055, 0.9], 0.016).at(S, y, 0),
        sdf.box([0.9, 0.055, 0.06], 0.016).at(0, y, -S),
      );

    const ironwork = sdf
      .union(base, ...posts, ...bars, rail(0.14), rail(RAIL_Y))
      .paintFn(ironPaint);
    k.body('ironwork', ironwork, {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.008,
      bone: 'cage',
      paintWeight: 2,
      bump: ironBump,
      maxTriangles: 3600,
    });

    // ------------------------------------------------------------- dome + ring
    // Bell-shaped cap revolved from a profile: wide skirt swallowing the bar
    // tips, soft shoulder, small peg, and a standing lifting ring.
    const domeProfile = profile.polygon(
      [
        [0.462, 1.065],
        [0.462, 1.095],
        [0.442, 1.155],
        [0.392, 1.215],
        [0.322, 1.265],
        [0.222, 1.31],
        [0.105, 1.338],
        [0.001, 1.35],
      ],
      { smooth: true, samples: 14 },
    );
    const dome = sdf.union(
      sdf.revolve(domeProfile),
      sdf.cylinder(0.036, 0.045, 0.01).at(0, 1.372, 0),
      sdf.sphere(0.016).at(0, 1.398, 0),
      sdf.torus(0.048, 0.01).rotateX(90).at(0, 1.404, 0),
    );
    k.body('dome', dome.paintFn(ironPaint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.01,
      bone: 'cage',
      paintWeight: 2,
      bump: ironBump,
      maxTriangles: 1300,
    });

    // ------------------------------------------------------------- dark inside
    // Solid shadow core just inside the bars so the gaps read as darkness.
    const core = sdf.box([0.8, 1.0, 0.8], 0.03).at(0, 0.58, 0);
    k.body('shadow-core', core, {
      color: INTERIOR,
      roughness: 0.95,
      metalness: 0,
      detail: 0.012,
      bone: 'cage',
      maxTriangles: 200,
    });

    // ------------------------------------------------------------- door + lock
    // Hinged on the left stile (bone 'door' sits on that line). The door fills
    // the whole front and sits proud of the bar plane so it reads as a door,
    // not a grid. Slightly brighter wear than the cage body for contrast.
    const DZ = 0.46;
    const doorIron = sdf.union(
      // Stiles and rails of the door frame.
      sdf.box([0.06, 0.97, 0.05], 0.016).at(-0.3, 0.61, DZ),
      sdf.box([0.06, 0.97, 0.05], 0.016).at(0.3, 0.61, DZ),
      sdf.box([0.66, 0.05, 0.05], 0.016).at(0, 1.078, DZ),
      sdf.box([0.66, 0.055, 0.05], 0.016).at(0, 0.125, DZ),
      // Three fat door bars.
      ...[-0.15, 0, 0.15].map((x) =>
        sdf.capsule([x, 0.17, DZ], [x, 1.03, DZ], 0.0135),
      ),
      // Two barrel hinges on the outer face of the left stile.
      sdf.cylinder(0.018, 0.07, 0.006).at(-0.338, 0.33, DZ),
      sdf.cylinder(0.018, 0.07, 0.006).at(-0.338, 0.87, DZ),
      // Hasp plate the padlock hangs from, on the right stile.
      sdf.box([0.024, 0.06, 0.02], 0.006).at(0.3, 0.815, 0.474),
      sdf.torus(0.013, 0.005).rotateX(90).at(0.3, 0.782, 0.481),
    );
    const doorPaint = (x: number, y: number, z: number, b: Rgb): Rgb => {
      const c = ironPaint(x, y, z, b);
      return mixRgb(c, IRON_HI, 0.1 + 0.12 * (0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2)));
    };
    k.body('door-iron', doorIron.paintFn(doorPaint), {
      color: '#4a4f55',
      roughness: 0.5,
      metalness: 0.7,
      detail: 0.006,
      bone: 'door',
      paintWeight: 2,
      bump: ironBump,
      maxTriangles: 1000,
    });

    // The gold padlock: fat rounded body, arched shackle through the staple,
    // dark keyhole stencilled through the body front.
    const LX = 0.3;
    const lockBody = sdf.box([0.085, 0.09, 0.036], 0.014).at(LX, 0.725, 0.48);
    const shackle = sdf
      .torus(0.022, 0.008)
      .at(LX, 0.77, 0.48)
      .intersect(sdf.halfSpace([0, -1, 0], -0.77));
    const goldPaint = (x: number, y: number, z: number, b: Rgb): Rgb => {
      const patch = noise.fbm(x * 30, y * 30, z * 30, 2);
      let c = mixRgb(b, GOLD_DARK, 0.25 + 0.3 * clamp01(-patch));
      c = mixRgb(c, GOLD_HI, 0.3 * clamp01((y - 0.72) / 0.09) * (0.4 + 0.6 * (0.5 + 0.5 * patch)));
      return c;
    };
    const lock = sdf
      .union(lockBody, shackle)
      .paintFn(goldPaint)
      .paintWhere(sdf.extrude(profile.circle(0.008), 0.06).at(LX, 0.719, 0.48), KEYHOLE)
      .paintWhere(
        sdf.capsule([LX, 0.719, 0.48], [LX, 0.699, 0.48], 0.004),
        KEYHOLE,
      );
    k.body('lock-gold', lock, {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.004,
      bone: 'door',
      maxTriangles: 600,
    });

    // ------------------------------------------------------------- rig + clip
    k.skeleton({
      cage: { at: [0, 0, 0] },
      door: { parent: 'cage', at: [-0.3, 0, 0.46] },
    });
    // The padlock rattles against the hasp: three short swings per loop,
    // strongest mid-loop, eased to zero at the loop ends.
    k.animation('rattle', {
      duration: 1.8,
      loop: true,
      pose: (_t, p) => ({
        door: { rotate: [0, -2.8 * Math.sin(p * Math.PI * 6) * motion.bump(p, 1, 0), 0] },
      }),
    });
  },
});
