import { defineAsset, mixRgb, rgb, sdf, type Rgb } from '../src/index.js';

// Design note — gold ring with red gem (equipment/accessories/ring).
//
// Role: small equipment pickup and inventory icon. Reads at 128 px as a
//   chunky gold ring standing upright with an oversized glowing red gem
//   gripped by four prongs on top.
// Size: band 0.06 m wide (outer diameter), total height ~0.085 m with the
//   setting. Stands on its bottom edge on y = 0, centred on the Y axis,
//   ring face toward +Z.
// One idea: a chunky polished gold band whose top swells into a rounded
//   bezel, with a big red cabochon dome held by four stubby prongs — the
//   gem is deliberately oversized so it reads as the focal point.
// Shape language: round dominant (torus band, dome gem, rounded bezel).
// Palette (60/30/10): gold #d4a93a dominant, gold shadow #8a6a1e, gold
//   highlight #f4d870; gem dark base #4a0a05 under glow #ff2818
//   (intensity 1.6, per the emissive rule).
// Materials: gold (metalness 1, roughness 0.3); gem (roughness 0.15,
//   faint emissive, dark base color so the glow stays saturated).
// Detail list: torus band + rounded bezel + 4 diagonal prongs + red
//   cabochon gem. Focal point: the gem.
// Rig/animation: none (static item).

const GOLD = rgb('#d4a93a');
const GOLD_DARK = rgb('#8a6a1e');
const GOLD_HI = rgb('#f4d870');

const GEM_DARK = rgb('#4a0a05');
const GEM_MID = rgb('#9a1a18');
const GEM_RIM = rgb('#ff6a4a');
const GEM_GLOW = '#ff2818';

const BAND_R = 0.022; // band major radius
const BAND_TUBE = 0.008; // band tube radius: outer diameter 0.06 m
const BAND_CY = BAND_R + BAND_TUBE; // band centre height: bottom touches y = 0

const BEZEL_Y = 0.06; // bezel centre
const GEM_Y = 0.072; // gem dome centre
const GEM_Z = 0.004;

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (e0: number, e1: number, v: number): number => {
  const t = clamp01((v - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

export default defineAsset({
  name: 'ring',
  description: 'Gold ring standing upright with a glowing red cabochon gem in a four-prong setting.',
  detail: 0.003,
  reference: 'docs/item-mockups/ring-mock.jpg',
  texture: { size: 1024 },

  build(k) {
    // ------------------------------------------------------------------
    // Band: a torus rotated so its ring plane is the vertical XY plane,
    // face toward +Z, bottom of the tube resting on y = 0.
    const band = sdf.torus(BAND_R, BAND_TUBE).rotateX(90).at(0, BAND_CY, 0);

    // ------------------------------------------------------------------
    // Bezel: a rounded gold swelling on top of the band that cradles the
    // gem. It overlaps the band's top so the smoothUnion welds them.
    const bezel = sdf.ellipsoid([0.017, 0.011, 0.016]).at(0, BEZEL_Y, 0.003);

    // ------------------------------------------------------------------
    // Four stubby prongs at the diagonals, gripping the gem dome. The
    // diagonal layout keeps the front face of the gem clear to read.
    const prongs: sdf.Shape[] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4; // 45°, 135°, 225°, 315°
      const cx = Math.cos(a);
      const sz = Math.sin(a);
      const base = [0.013 * cx, 0.063, 0.004 + 0.013 * sz] as [number, number, number];
      const tip = [0.0132 * cx, 0.076, 0.004 + 0.0132 * sz] as [number, number, number];
      prongs.push(sdf.cone(base, tip, 0.005, 0.0045));
    }

    const goldPaint = (x: number, y: number, z: number): Rgb => {
      // Vertical value ramp: shadow near the ground, bright mid-height,
      // warm highlight near the top where the light catches.
      const yT = clamp01(y / 0.085);
      let c = mixRgb(GOLD_DARK, GOLD, 0.25 + 0.6 * smoothstep(0.05, 0.7, yT));
      c = mixRgb(c, GOLD_HI, 0.25 * smoothstep(0.72, 1.0, yT));
      // Darken the inside of the band hole so the ring opening reads.
      const d = Math.hypot(x, y - BAND_CY);
      const onInner = Math.exp(-Math.pow((d - (BAND_R - BAND_TUBE)) / 0.0035, 2));
      c = mixRgb(c, GOLD_DARK, 0.35 * onInner);
      return c;
    };

    const goldShape = sdf
      .smoothUnion(0.004, band, bezel, ...prongs)
      .paintFn(goldPaint);
    k.body('gold', goldShape, {
      color: '#d4a93a',
      roughness: 0.3,
      metalness: 1,
      detail: 0.0028,
      maxTriangles: 1000,
      paintWeight: 2,
    });

    // ------------------------------------------------------------------
    // Gem: a red cabochon dome half-seated in the bezel, gripped by the
    // prongs. Dark base color keeps the emissive glow saturated.
    const gem = sdf.ellipsoid([0.015, 0.0125, 0.015]).at(0, GEM_Y, GEM_Z);
    const gemPaint = (x: number, y: number, z: number): Rgb => {
      const yT = clamp01((y - (GEM_Y - 0.0125)) / 0.025);
      const lift = clamp01((y - GEM_Y) / 0.0125);
      let c = mixRgb(GEM_DARK, GEM_MID, 0.15 + 0.45 * lift);
      // Bright rim only at the very top of the dome where the light catches.
      c = mixRgb(c, GEM_RIM, 0.22 * smoothstep(0.72, 1.0, yT) * lift);
      // Soft dark edge around the dome's base.
      const r = Math.hypot(x, z - GEM_Z);
      const onEdge = Math.exp(-Math.pow((r - 0.013) / 0.002, 2));
      c = mixRgb(c, GEM_DARK, 0.5 * onEdge);
      return c;
    };
    k.body('gem', gem.paintFn(gemPaint), {
      color: '#4a0a05',
      roughness: 0.15,
      metalness: 0.05,
      emissive: GEM_GLOW,
      emissiveIntensity: 0.9,
      detail: 0.0025,
      textureDensity: 2,
      paintWeight: 2,
      maxTriangles: 350,
    });
  },
});
