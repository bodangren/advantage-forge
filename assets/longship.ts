import { defineAsset, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Design note - longship (vehicles/water/longship).
 * Role: harbor/raid prop, read at 128 px as a red-striped sail over a row of big round shields.
 * Size: about 5.9 m long (Z, dragon bow +Z), 1.6 m wide, mast top 3.6 m; keel strip on y = 0.
 * One idea: a slim clinker hull with a carved dragon head, and a giant striped sail.
 * Shape language: round hull, curled ends, square sail. Focal point: the red/yellow shield rows.
 * Palette: oak #b5814a, brown #8a5a35, walnut #6b4226, pale #c9a06a, red #c8302a, cream #efe6d2,
 * shield yellow #e0bb60, iron #4a4f55.
 * Materials: hull wood, deck wood, dragon, shields, sail cloth, spars, rope, iron.
 * Rig: none.
 */
const OAK = rgb('#b5814a');
const BROWN = rgb('#8a5a35');
const WALNUT = rgb('#6b4226');
const PALE = rgb('#c9a06a');
const RED = rgb('#c8302a');
const CREAM = rgb('#efe6d2');
const YELLOW = rgb('#e0bb60');
const IRON = rgb('#4a4f55');

const RX = 0.88, RY = 0.75, RZ = 2.55, EC = 0.5; // hull ellipsoid
const RIM = 0.85; // gunwale height
const FLOOR = 0.34;
const SH_Y = 0.6; // shield center height
const SH_R = 0.28;
const SH_STEP = 2 * SH_R - 0.1; // 0.46, 0.1 overlap
const SH_Z0 = -3.5 * SH_STEP;

// hull half-width at height y and station z
const hullX = (y: number, z: number) => {
  const t = 1 - ((y - EC) / RY) ** 2 - (z / RZ) ** 2;
  return RX * Math.sqrt(Math.max(t, 0));
};

export default defineAsset({
  name: 'longship',
  description: 'A chunky Viking longship with a carved dragon head, striped square sail, and two rows of eight round shields.',
  reference: 'docs/vehicle-mockups/longship-mock.jpg',
  detail: 0.008,
  texture: { size: 1024 },
  build(k) {
    // ---------------------------------------------------------------- hull
    const outerFull = sdf.ellipsoid([RX, RY, RZ]).at(0, EC, 0);
    const keelSlab = sdf.box([4, RIM, 12], 0).at(0, RIM / 2, 0);
    const outer = outerFull.intersect(keelSlab);
    const well = outerFull.round(-0.1).intersect(sdf.box([4, 3, 12], 0).at(0, FLOOR + 1.5, 0));
    const bow = sdf.chain([[0, 0.6, 2.2, 0.22], [0, 1.0, 2.5, 0.2], [0, 1.4, 2.6, 0.18], [0, 1.68, 2.52, 0.2]], 0.05);
    const stern = sdf.chain([[0, 0.6, -2.2, 0.22], [0, 1.0, -2.5, 0.2], [0, 1.4, -2.6, 0.17], [0, 1.72, -2.5, 0.15], [0, 1.9, -2.25, 0.14]], 0.05);
    const hullShape = sdf.smoothUnion(0.07, outer.subtract(well), bow, stern);

    const bandH = 0.132;
    const hullPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 28, z * 6, 2);
      if (y > FLOOR - 0.006 && y < FLOOR + 0.012 && Math.abs(x) < 0.85) {
        const plank = Math.floor((x + 1) / 0.16);
        let c = mixRgb((plank & 1) ? PALE : mixRgb(PALE, OAK, 0.5), OAK, 0.25 * grain);
        if (Math.abs((((x + 1) / 0.16) % 1) - 0.5) > 0.46) c = mixRgb(c, WALNUT, 0.6);
        return c;
      }
      if (y > RIM - 0.09 && y < RIM + 0.03) return mixRgb(YELLOW, rgb('#f0d488'), 0.3 + 0.4 * grain);
      if (y > RIM + 0.03) {
        const g = mixRgb(BROWN, WALNUT, 0.35 * grain);
        return y > 1.8 && z < 0 ? mixRgb(g, YELLOW, 0.5) : g;
      }
      if (y < 0.035) return mixRgb(WALNUT, BROWN, 0.3 * grain);
      const r = Math.floor(y / bandH);
      const f = (y / bandH) % 1;
      let c = mixRgb([BROWN, OAK, mixRgb(BROWN, OAK, 0.5), OAK, BROWN][r % 5], PALE, 0.08 * grain);
      if (f < 0.12) c = mixRgb(c, WALNUT, 0.55); // seam shadow under each overlapping plank
      return mixRgb(c, WALNUT, 0.25 * grain);
    };
    k.body('hull', hullShape.round(0.006).paintFn(hullPaint), {
      color: '#8a5a35', roughness: 0.8, metalness: 0, detail: 0.008,
      bump: (x, y, z) => {
        const f = (y / bandH) % 1;
        return 0.002 * noise.fbm(x * 10, y * 40, z * 10, 2) + 0.006 * Math.min(1, f * 4) * (y < RIM - 0.09 ? 1 : 0);
      },
      maxTriangles: 7000,
    });

    // ------------------------------------------------- deck, thwarts, stern castle
    const thwart = (z: number) => sdf.box([1.3, 0.09, 0.3], 0.02).at(0, 0.6, z);
    const castle = sdf.box([1.15, 0.12, 0.95], 0.03).at(0, 0.62, -1.95);
    const posts = sdf.union(...[-0.45, -0.225, 0, 0.225, 0.45].map((x) =>
      sdf.cylinder(0.05, 0.34, 0.015).at(x, 0.8, -1.5)));
    const rail = sdf.capsule([-0.5, 0.98, -1.5], [0.5, 0.98, -1.5], 0.05);
    const deckShape = sdf.union(thwart(-0.9), thwart(0.95), thwart(1.7), castle, posts, rail,
      sdf.box([1.3, 0.09, 0.3], 0.02).at(0, 0.6, -0.15));
    k.body('deck', deckShape.paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 6, y * 20, z * 6, 2);
      const plank = Math.floor((x + 1) / 0.14);
      let c = mixRgb((plank & 1) ? PALE : mixRgb(PALE, OAK, 0.5), OAK, 0.25 * grain);
      if (Math.abs((((x + 1) / 0.14) % 1) - 0.5) > 0.45) c = mixRgb(c, WALNUT, 0.55);
      return c;
    }), {
      color: '#c9a06a', roughness: 0.8, metalness: 0, detail: 0.008,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 9, y * 30, z * 9, 2) + 0.002 * (Math.floor((x + 1) / 0.14) & 1),
      maxTriangles: 2000,
    });

    // -------------------------------------------------------------- shields
    const shieldParts: sdf.Shape[] = [];
    const bossParts: sdf.Shape[] = [];
    for (const s of [1, -1]) {
      for (let i = 0; i < 8; i++) {
        const z = SH_Z0 + i * SH_STEP;
        const f = hullX(SH_Y, z);
        const slope = (hullX(SH_Y, z + 0.05) - hullX(SH_Y, z - 0.05)) / 0.1;
        const phi = s * Math.atan(slope) * 180 / Math.PI;
        const nl = Math.hypot(1, slope);
        const nx = s / nl, nz = -slope / nl;
        const lift = (i & 1) ? 0.06 : 0.02;
        const cx = s * f + nx * lift, cz = z + nz * lift;
        shieldParts.push(sdf.cylinder(SH_R, 0.07, 0.022).rotateZ(90).rotateY(phi).at(cx, SH_Y, cz));
        bossParts.push(sdf.ellipsoid([0.045, 0.075, 0.075]).rotateY(phi).at(cx + nx * 0.04, SH_Y, cz + nz * 0.04));
      }
    }
    k.body('shields', sdf.union(...shieldParts).paintFn((x, y, z) => {
      const i0 = Math.max(0, Math.min(7, Math.round((z - SH_Z0) / SH_STEP)));
      let idx = i0;
      for (const c of [i0 - 1, i0, i0 + 1]) {
        if (c < 0 || c > 7 || !(c & 1)) continue;
        if (Math.hypot(z - (SH_Z0 + c * SH_STEP), y - SH_Y) < SH_R) { idx = c; break; }
      }
      const d = Math.hypot(z - (SH_Z0 + idx * SH_STEP), y - SH_Y);
      const red = (idx & 1) === 0;
      const base = red ? RED : YELLOW;
      const alt = red ? YELLOW : RED;
      if (d > 0.245) return mixRgb(WALNUT, base, 0.35);
      if (d > 0.17 && d < 0.2) return alt;
      return mixRgb(base, WALNUT, 0.08 * (0.5 + 0.5 * noise.fbm(x * 8, y * 8, z * 8, 2)));
    }), {
      color: '#e0bb60', roughness: 0.7, metalness: 0, detail: 0.005,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 30, y * 30, z * 30, 2),
      maxTriangles: 4000,
    });

    // ----------------------------------------------------------------- dragon
    const skull = sdf.ellipsoid([0.27, 0.26, 0.36]).at(0, 1.95, 2.6);
    const snout = sdf.ellipsoid([0.17, 0.14, 0.3]).rotateX(-8).at(0, 1.86, 2.92);
    const jaw = sdf.ellipsoid([0.14, 0.08, 0.26]).rotateX(6).at(0, 1.64, 2.88);
    const nostril = (s: number) => sdf.sphere(0.035).at(s * 0.065, 1.94, 3.17);
    const head = sdf.smoothUnion(0.05, skull, snout, jaw)
      .subtract(nostril(1), nostril(-1))
      .subtract(sdf.box([0.5, 0.06, 0.4], 0.01).at(0, 1.74, 3.0));
    k.body('dragon', head.paintFn((x, y, z) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 8, y * 14, z * 8, 2);
      if (y < 1.74 && z > 2.85) return mixRgb(rgb('#b03a2a'), WALNUT, 0.2 * grain);
      if (y < 1.74 && y > 1.62 && z > 2.95) return CREAM;
      if (Math.abs(x) > 0.14 && y > 1.86 && z > 2.6 && z < 2.85) return rgb('#b9c23e');
      return mixRgb(BROWN, OAK, 0.3 + 0.3 * grain);
    }), {
      color: '#8a5a35', roughness: 0.75, metalness: 0, detail: 0.005, textureDensity: 2,
      bump: (x, y, z) => 0.002 * noise.fbm(x * 14, y * 14, z * 14, 2),
      maxTriangles: 2500,
    });
    const horn = (s: number) => sdf.cone([s * 0.12, 2.1, 2.55], [s * 0.24, 2.62, 2.38], 0.08, 0.035);
    const fin = (y: number, z: number, s: number, len: number) =>
      sdf.cone([s * 0.14, y, z], [s * (0.3 + len * 0.4), y + len * 0.5, z - len * 0.55], 0.06, 0.03);
    const spikes = sdf.union(horn(1), horn(-1),
      ...[1, -1].flatMap((s) => [fin(1.85, 2.5, s, 0.36), fin(1.65, 2.42, s, 0.32), fin(1.45, 2.4, s, 0.28)]));
    k.body('horns', spikes.paintFn((x, y, z) => (y > 2.2 ? mixRgb(PALE, CREAM, 0.4) : YELLOW)), {
      color: '#e0bb60', roughness: 0.7, metalness: 0, detail: 0.004, maxTriangles: 1100,
    });
    const eye = (s: number) => sdf.sphere(0.075).at(s * 0.22, 2.0, 2.75);
    k.body('eyes', sdf.union(eye(1), eye(-1)).paintFn((x, y, z) =>
      Math.hypot(Math.abs(x) - 0.28, z - 2.79) < 0.035 ? rgb('#1c1a18') : rgb('#c8d640')), {
      color: '#c8d640', roughness: 0.3, metalness: 0, detail: 0.004, maxTriangles: 600,
      emissive: '#c8d640', emissiveIntensity: 0.35,
    });

    // ------------------------------------------------- mast, yard, oars, rudder
    const mast = sdf.cylinder(0.09, 3.3, 0.02).at(0, 0.3 + 1.65, 0);
    const yard = sdf.union(
      sdf.capsule([-1.3, 3.22, 0.24], [1.3, 3.22, 0.24], 0.06),
      sdf.sphere(0.1).at(-1.32, 3.22, 0.24), sdf.sphere(0.1).at(1.32, 3.22, 0.24));
    const rudder = sdf.union(
      sdf.capsule([-0.78, 1.15, -2.1], [-1.05, 0.05, -2.62], 0.055),
      sdf.box([0.06, 0.6, 0.24], 0.02).rotateX(-10).rotateZ(-14).at(-1.04, 0.22, -2.6));
    const woodPaint = (x: number, y: number, z: number) => {
      const grain = 0.5 + 0.5 * noise.fbm(x * 9, y * 9, z * 9, 2);
      return mixRgb(mixRgb(PALE, OAK, 0.45), BROWN, 0.4 * grain);
    };
    const woodOpts = {
      color: '#b5814a', roughness: 0.8, metalness: 0, detail: 0.006,
      bump: (x: number, y: number, z: number) => 0.002 * noise.fbm(x * 12, y * 12, z * 12, 2),
    };
    k.body('spars', sdf.union(mast, yard).paintFn(woodPaint), { ...woodOpts, maxTriangles: 1500 });
    k.body('rudder', rudder.intersect(sdf.box([3, 2, 3], 0).at(-0.6, 1, -2.2)).paintFn(woodPaint), { ...woodOpts, maxTriangles: 800 });

    // ------------------------------------------------------------------ sail
    const ez = -0.2, ecy = 2.3, erx = 1.5, ery = 2.6, erz = 0.9;
    const sailShell = sdf.ellipsoid([erx, ery, erz]).at(0, ecy, ez).shell(0.05);
    const sailBox = sdf.box([2.4, 1.85, 0.95], 0.01).at(0, 2.3, ez + 0.825);
    const sail = sailShell.intersect(sailBox);
    k.body('sail', sail.paintFn((x, y, z) => {
      const stripe = Math.floor((x + 1.2) / 0.4);
      const weave = 0.5 + 0.5 * noise.fbm(x * 20, y * 20, z * 20, 2);
      const c = (stripe & 1) ? CREAM : RED;
      return mixRgb(c, WALNUT, 0.06 * weave);
    }), {
      color: '#efe6d2', roughness: 0.9, metalness: 0, detail: 0.008,
      bump: (x, y, z) => 0.0015 * noise.fbm(x * 40, y * 40, z * 40, 2),
      maxTriangles: 3500,
    });
    // pennant on the mast top
    const pennant = sdf.extrude(profile.polygon([[0, 0], [0.5, 0.05], [0.5, 0.16], [0.02, 0.18]]), 0.05, 0.01)
      .rotateY(90).at(0, 3.42, 0.06);
    k.body('pennant', pennant, {
      color: '#c8302a', roughness: 0.85, metalness: 0, detail: 0.006, maxTriangles: 800,
    });

    const spike = (z: number) => sdf.cone([0, 0.32, z], [0, 0.67, z], 0.08, 0.025);
    k.body('spikes', sdf.union(spike(-0.42), spike(-0.62), spike(-1.2), spike(-1.4)).paintFn((x, y, z) =>
      mixRgb(WALNUT, BROWN, 0.3 + 0.3 * noise.fbm(x * 9, y * 9, z * 9, 2))), {
      color: '#6b4226', roughness: 0.8, metalness: 0, detail: 0.005, maxTriangles: 800,
    });

    // ------------------------------------------------------------------ rope
    const stay = (sx: number) => sdf.capsule([0, 3.4, 0.0], [sx * 0.78, 0.9, 0.0], 0.04);
    const backstay = sdf.capsule([0, 3.55, -0.02], [0, 1.5, -2.4], 0.04);
    k.body('rope', sdf.union(stay(1), stay(-1), backstay), {
      color: '#6b4226', roughness: 0.9, metalness: 0, detail: 0.008, maxTriangles: 600,
    });

    // ------------------------------------------------------------------ iron
    const band = sdf.cylinder(0.1, 0.1, 0.02).at(0, 0.75, 0);
    const band2 = sdf.cylinder(0.1, 0.1, 0.02).at(0, 3.0, 0);
    const ironOpts = { color: '#4a4f55', roughness: 0.5, metalness: 0.8 };
    k.body('bosses', sdf.union(...bossParts), { ...ironOpts, detail: 0.006, maxTriangles: 1200 });
    k.body('iron', sdf.union(band, band2), { ...ironOpts, detail: 0.005, maxTriangles: 800 });
  },
});
