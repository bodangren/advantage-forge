import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note — witch's cauldron over a log fire (dungeon/prop/cauldron).
 *
 * Role: dungeon landmark prop and one of the kit's warm light sources. Reads at 128 px.
 * Size: pot 0.60 m wide, 0.92 m tall with the stick; stands on y = 0, faces +Z.
 * One idea: a squat black iron pot on stub legs, brimming with glowing teal brew,
 *   hovering over a small ember fire — one cool mass, two small pools of light.
 * Shape language: round dominant (belly pot, rolled rim, logs, ember bed),
 *   square secondary (chunky slate hearth slabs tie it to the dungeon floor).
 * Palette: iron #22262e (dark mass), slate #4a5d75 / #7a8ba0 / #2a3547 (cool base),
 *   wood #8a5a35, brew #3fae9a (teal accent), ember #ff9a3c (warmest accent).
 * Materials: iron metalness 0.8; brew emissive 0.8; embers emissive 2;
 *   flames emissive 2.2; wood rough; slate rough. Fire glow painted on stone and iron.
 * Detail: hollow belly pot + rolled rim + 3 stub legs; 3 radiating logs + ember bed;
 *   2 flames; brim-full brew + 2 bubbles; leaning stick; 5 hearth slabs + pebble.
 * Rig/animation: none (static prop).
 */

const IRON = '#22262e';
const IRON_TOP = '#4a5160';
const SOOT = '#15181e';
const GLOW = '#ff7a2a';

const SLATE = '#4a5d75';
const SLATE_TOP = '#7a8ba0';
const SLATE_DARK = '#2a3547';

const WOOD = '#8a5a35';
const WOOD_LIGHT = '#c08a52';
const WOOD_DARK = '#4a2e18';
const CHAR = '#241a14';

const BREW = '#3fae9a';
const BREW_LIGHT = '#9ff2e2';
const EMBER = '#ff9a3c';
const EMBER_HOT = '#ffe0a8';

const FIRE_Y = 0.1; // centre of the ember bed and logs
const POT_BOTTOM = 0.2; // lowest point of the pot floor
const RIM_Y = 0.513; // centre height of the rolled rim

// Two legs sit in front so the fire reads between them; the third closes the tripod at the back.
// Logs radiate backwards: their plan-line then clears every leg by 5 cm.
const LEG_ANGLES = [30, 150, 270];
const LOG_ANGLES = [210, 330];
const LOG_IN = 0.055;
const LOG_OUT = 0.215;

export default defineAsset({
  name: 'cauldron',
  description:
    'Blackened iron cauldron on three stub legs over a small log fire, brimming with glowing brew.',
  detail: 0.008,
  reference: 'docs/dungeon-mockups/dungeon-quest_002.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------ hearth
    // A cool slate pad of chunky rounded slabs: the dungeon floor language under the fire.
    // Slabs sit at slightly different heights, so their edges catch light like worn stone.
    const slabDefs = [
      { x: -0.185, z: -0.165, w: 0.35, d: 0.3, h: 0.055, r: -3 },
      { x: 0.165, z: -0.17, w: 0.36, d: 0.28, h: 0.06, r: 4 },
      { x: -0.18, z: 0.165, w: 0.34, d: 0.3, h: 0.05, r: 5 },
      { x: 0.19, z: 0.16, w: 0.32, d: 0.29, h: 0.058, r: -4 },
      { x: 0.315, z: 0.31, w: 0.17, d: 0.15, h: 0.045, r: 14 }, // stray chip breaking the square
    ];
    const slabs = sdf.union(
      ...slabDefs.map((s) =>
        sdf.box([s.w, s.h, s.d], 0.018).rotate(0, s.r, 0).at(s.x, s.h / 2, s.z),
      ),
    );
    // Dark grout plate under the slabs: gaps between slabs read as grout lines.
    const plate = sdf
      .box([0.74, 0.045, 0.66], 0.014).at(0, 0.0225, 0)
      .paint(SLATE_DARK);
    // One loose pebble beside the fire — a small touch of use and place.
    const pebble = sdf.sphere(0.05).scale([1, 0.62, 0.92]).at(-0.33, 0.031, 0.29);

    const hearthPaint = (x: number, y: number, z: number) => {
      const worn = 0.5 + 0.5 * noise.fbm(x * 7, y * 7, z * 7, 2);
      // Cool slate: dark sides, mid faces, pale worn tops (the block language of the kit).
      let c = mixRgb(rgb('#1f2836'), rgb(SLATE), Math.min(1, y / 0.026 + 0.3 * worn));
      const top = Math.min(1, Math.max(0, (y - 0.03) / 0.028));
      c = mixRgb(c, rgb(SLATE_TOP), top * (0.12 + 0.55 * Math.pow(worn, 2.5)));
      // Warm firelight pool on the stone around the fire.
      const d = Math.hypot(x, y - FIRE_Y, z);
      const g = Math.max(0, 1 - d / 0.38);
      c = mixRgb(c, rgb(GLOW), 0.45 * Math.pow(g, 1.7));
      return c;
    };
    k.body('hearth', sdf.union(plate, slabs.paintFn(hearthPaint), pebble.paintFn(hearthPaint)), {
      color: SLATE,
      roughness: 0.92,
      metalness: 0,
      detail: 0.01,
      paintWeight: 2,
      bump: (x, y, z) => 0.0022 * noise.fbm(x * 24, y * 24, z * 24, 3),
      maxTriangles: 800,
    });

    // ------------------------------------------------------------------ iron pot
    // Hollow revolve: outer belly up over the rim, then a cavity cut down inside it.
    const outer = profile.polygon(
      [
        [0, POT_BOTTOM],
        [0.13, POT_BOTTOM],
        [0.215, 0.22],
        [0.272, 0.27],
        [0.3, 0.345],
        [0.288, 0.42],
        [0.255, 0.48],
        [0.242, RIM_Y],
        [0.2, 0.523],
        [0.1, 0.527],
        [0, 0.528],
      ],
      { smooth: true, samples: 12 },
    );
    const cavity = profile.polygon(
      [
        [0, 0.24],
        [0.12, 0.24],
        [0.2, 0.26],
        [0.252, 0.305],
        [0.271, 0.355],
        [0.259, 0.42],
        [0.228, 0.477],
        [0.212, 0.545],
        [0.1, 0.557],
        [0, 0.56],
      ],
      { smooth: true, samples: 12 },
    );
    const shell = sdf.revolve(outer).subtract(sdf.revolve(cavity));
    // Fat rolled rim, the chunky highlight line of the silhouette.
    const rim = sdf.torus(0.238, 0.026).at(0, RIM_Y, 0);

    // Three stub legs: splayed cones with round feet seated on the hearth.
    const legs = LEG_ANGLES.map((deg) => {
      const a = (deg * Math.PI) / 180;
      const c = Math.cos(a);
      const s = Math.sin(a);
      return sdf.smoothUnion(
        0.02,
        sdf.cone([0.185 * c, 0.1, 0.185 * s], [0.145 * c, 0.215, 0.145 * s], 0.05, 0.063),
        sdf.sphere(0.05).at(0.185 * c, 0.1, 0.185 * s),
      );
    });

    const ironPaint = (x: number, y: number, z: number) => {
      const soot = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 3);
      let c = mixRgb(rgb(IRON), rgb(SOOT), 0.4 * soot); // patchy blackening
      const rimT = Math.min(1, Math.max(0, (y - 0.44) / 0.075));
      c = mixRgb(c, rgb(IRON_TOP), 0.65 * rimT); // worn, lit rim and shoulder
      const d = Math.hypot(x, y - 0.16, z);
      const g = Math.max(0, 1 - d / 0.34);
      c = mixRgb(c, rgb(GLOW), 0.45 * Math.pow(g, 2.2)); // firelight on the belly underside
      return c;
    };
    const iron = sdf
      .smoothUnion(0.025, shell, ...legs)
      .smoothUnion(0.012, rim)
      .paintFn(ironPaint);
    k.body('iron', iron, {
      color: IRON,
      roughness: 0.5,
      metalness: 0.8,
      detail: 0.008,
      paintWeight: 2,
      bump: (x, y, z) => 0.0016 * noise.fbm(x * 34, y * 34, z * 34, 2),
      maxTriangles: 1400,
    });

    // ------------------------------------------------------------------ brew
    // The surface brims to the rim so it reads from every view; bubbles break the rim line.
    const brewPaint = (x: number, y: number, z: number) => {
      const r = Math.hypot(x, z);
      const foam = Math.max(0, (r - 0.185) / 0.045);
      const swirl = 0.5 + 0.5 * noise.fbm(x * 11, y * 40, z * 11, 2);
      return mixRgb(rgb(BREW), rgb(BREW_LIGHT), 0.06 + 0.22 * foam + 0.12 * swirl);
    };
    k.body(
      'brew',
      sdf
        .union(
          sdf.ellipsoid([0.224, 0.03, 0.224]).at(0, 0.505, 0),
          sdf.sphere(0.042).at(0.07, 0.53, 0.09), // big bubble at the brim
          sdf.sphere(0.03).at(-0.09, 0.525, -0.03),
        )
        .paintFn(brewPaint),
      {
        color: BREW,
        roughness: 0.25,
        metalness: 0,
        emissive: BREW,
        emissiveIntensity: 0.8,
        detail: 0.006,
        maxTriangles: 320,
      },
    );

    // ------------------------------------------------------------------ embers
    const emberPaint = (x: number, y: number, z: number) => {
      const crust = 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2);
      let c = mixRgb(rgb('#b04a14'), rgb(EMBER), crust);
      const hot =
        Math.max(0, 1 - Math.hypot(x, z) / 0.13) *
        Math.min(1, Math.max(0, (y - 0.06) / 0.05));
      c = mixRgb(c, rgb(EMBER_HOT), 0.5 * hot);
      return c;
    };
    k.body(
      'embers',
      sdf
        .union(
          sdf.ellipsoid([0.175, 0.03, 0.165]).at(0, 0.085, 0),
          sdf.sphere(0.035).at(0.12, 0.1, 0.12),
          sdf.sphere(0.03).at(-0.13, 0.1, -0.08),
          sdf.sphere(0.03).at(0.04, 0.105, -0.14),
          sdf.sphere(0.032).at(-0.09, 0.1, 0.13),
        )
        .paintFn(emberPaint),
      {
        color: EMBER,
        roughness: 0.8,
        metalness: 0,
        emissive: EMBER,
        emissiveIntensity: 2,
        detail: 0.007,
        maxTriangles: 320,
      },
    );

    // ------------------------------------------------------------------ flames
    // Two tapered teardrops in the open front gap between the legs: the brightest,
    // warmest points of the whole kit. The tall one licks the pot floor.
    const flame = (a: [number, number, number], b: [number, number, number], ra: number, rb: number) =>
      sdf.cone(a, b, ra, rb);
    k.body(
      'flames',
      sdf
        .union(
          flame([0.055, 0.098, 0.155], [0.078, 0.213, 0.165], 0.043, 0.008),
          flame([-0.07, 0.096, 0.145], [-0.086, 0.186, 0.152], 0.034, 0.007),
        )
        .paintFn((_x, y, _z) => {
          const t = Math.max(0, Math.min(1, (y - 0.1) / 0.1));
          return mixRgb(rgb('#ffe9b0'), rgb('#ff7a1e'), t);
        }),
      {
        color: '#ff8a20',
        roughness: 0.5,
        metalness: 0,
        emissive: '#ff9a3c',
        emissiveIntensity: 2.2,
        detail: 0.004,
        maxTriangles: 260,
      },
    );

    // ------------------------------------------------------------------ logs
    // Two logs radiate backwards into the leg gaps, so nothing collides with the legs.
    const tipPoints: [number, number, number][] = [];
    const logDefs = LOG_ANGLES.map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const out = i === 1 ? 0.19 : LOG_OUT;
      const ra = i === 1 ? 0.056 : 0.06;
      const rb = i === 1 ? 0.043 : 0.046;
      tipPoints.push([out * c, FIRE_Y, out * s]);
      // Tapered logs, thick where they cross at the fire.
      return sdf.cone([LOG_IN * c, FIRE_Y, LOG_IN * s], [out * c, FIRE_Y, out * s], ra, rb);
    });
    // One split chunk waiting at the edge of the pad — a small touch of use.
    const chunk = sdf.cone([0.26, 0.1, 0.16], [0.335, 0.095, 0.225], 0.05, 0.04);
    tipPoints.push([0.335, 0.095, 0.225]);

    const logPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 8, y * 34, z * 8, 2);
      let c = mixRgb(rgb(WOOD), rgb(WOOD_DARK), 0.42 * grain);
      // Charred near the coals, sawn cut ends further out.
      const cd = Math.hypot(x, z);
      c = mixRgb(c, rgb(CHAR), 0.75 * Math.max(0, 1 - cd / 0.26));
      const td = Math.min(...tipPoints.map((t) => Math.hypot(x - t[0], y - t[1], z - t[2])));
      const end = Math.max(0, 1 - td / 0.045);
      c = mixRgb(c, rgb(WOOD_LIGHT), 0.6 * end);
      c = mixRgb(c, rgb(WOOD_DARK), 0.45 * end * (0.5 + 0.5 * Math.cos(td * 130))); // growth rings
      return c;
    };
    k.body('logs', sdf.union(...logDefs, chunk).paintFn(logPaint), {
      color: WOOD,
      roughness: 0.85,
      metalness: 0,
      detail: 0.008,
      paintWeight: 2,
      bump: (x, y, z) => 0.0024 * noise.fbm(x * 36, y * 14, z * 36, 2),
      maxTriangles: 560,
    });

    // ------------------------------------------------------------------ stirring stick
    // Leans in against the rim and breaks the silhouette above the pot.
    const stickTop: [number, number, number] = [0.4, 0.885, 0.24];
    k.body(
      'stick',
      sdf
        .union(
          sdf.cone([0.1, 0.37, 0.06], stickTop, 0.017, 0.024),
          sdf.sphere(0.032).at(stickTop[0], stickTop[1], stickTop[2]),
        )
        .paintFn((x, y, z) => {
          const grain = 0.5 + 0.5 * noise.fbm(x * 14, y * 40, z * 14, 2);
          let c = mixRgb(rgb(WOOD), rgb(WOOD_LIGHT), 0.25 + 0.3 * grain);
          c = mixRgb(c, rgb(WOOD_DARK), 0.25 * Math.max(0, (0.55 - y) / 0.25));
          return c;
        }),
      {
        color: WOOD,
        roughness: 0.8,
        metalness: 0,
        detail: 0.006,
        maxTriangles: 160,
      },
    );
  },
});
