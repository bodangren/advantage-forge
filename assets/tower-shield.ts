import { defineAsset, noise, profile, sdf } from '../src/index.js';

/**
 * Tower shield (catalog: equipment/armor/tower-shield), 1.0 m tall, standing on its bottom
 * edge at y = 0, face toward +Z. A curved rectangle: steel rim around a red enamel field,
 * a gold lion emblem in relief, gold rivets, and keystone plates at the top and bottom.
 *
 * - Role: equipment item; seen in hand and as an icon, so the silhouette and the lion must read at 128 px.
 * - One idea: a tall proud shield with a golden lion that looks slightly happy.
 * - Shape language: square and sturdy (tower) with rounded chunky bevels.
 * - Palette: steel #c8ccd2 (rim, dominant), red #b3352c (field, secondary), gold #d4a93a (lion + rivets, accent).
 * - Materials: rim/band/plates steel (metal 0.9), field enamel (metal 0.1), lion + rivets gold (metal 1),
 *   straps leather (rough 0.75).
 * - The curve: flat extrusions intersected with vertical cylinders (C1 plate, C2 band/plates, C3 field),
 *   so every layer follows the same cylindrical wrap.
 * - No rig; a static prop.
 */

const H = 1.0; // height, stands on y = 0
const HW = 0.3; // half width

// Cylindrical wrap: the interior of each layer is shifted back along Z by sag(x), the drop
// of a big cylinder (R = 0.9). The weight fades to 0 near the outline, so the edges, the
// top/bottom rims, and the ground contact stay put. Front surfaces at x = 0: plate 0.02,
// band/plates 0.04, field 0.03. Displace (not intersect) keeps the SDF smooth and crack-free.
const sag = (x: number) => 0.9 - Math.sqrt(Math.max(0, 0.81 - x * x));
const smooth01 = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};
// 1 in the interior, fading to 0 at the side edges and the top/bottom rims.
const wgt = (x: number, y: number) =>
  smooth01((HW - 0.025 - Math.abs(x)) / 0.05) *
  smooth01((y - 0.03) / 0.06) *
  smooth01((H - 0.03 - y) / 0.06);
const wrap = (s: sdf.Shape) => s.displace(1, (x, y) => sag(x) * wgt(x, y));
// Front surface of the raised band/keystones and of the field (where the lion sits, wgt = 1).
const surfC2 = (x: number, y: number) => 0.04 - sag(x) * wgt(x, y);
const surfC3 = (x: number) => 0.03 - sag(x) * wgt(x, 0.6);

// Rounded-top rectangle outline (tower shape): flat bottom, slightly rounded bottom corners,
// tall rounded top corners.
function towerOutline(): [number, number][] {
  const rb = 0.05; // bottom corner radius
  const rt = 0.11; // top corner radius
  const pts: [number, number][] = [];
  const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
    for (let i = 0; i <= 3; i++) {
      const a = ((a0 + ((a1 - a0) * i) / 3) * Math.PI) / 180;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  pts.push([-HW + rb, 0]);
  pts.push([HW - rb, 0]);
  arc(HW - rb, rb, rb, -90, 0); // bottom-right
  pts.push([HW, H - rt]);
  arc(HW - rt, H - rt, rt, 0, 90); // top-right
  pts.push([-HW + rt, H]);
  arc(-HW + rt, H - rt, rt, 90, 180); // top-left
  pts.push([-HW, rb]);
  arc(-HW + rb, rb, rb, 180, 270); // bottom-left
  return pts;
}

const GOLD = '#d4a93a';
const STEEL = '#c8ccd2';

export default defineAsset({
  name: 'tower-shield',
  description: 'Tall curved tower shield, steel rim, red field with a gold lion emblem, gold rivets.',
  reference: 'docs/item-mockups/tower-shield-mock.jpg',
  detail: 0.005,
  texture: { size: 1024 },

  build(k) {
    const outer = profile.polygon(towerOutline());

    // ------------------------------------------------------------- steel shell
    // Back plate: deep enough that the wrap leaves solid material at the edges.
    const plate = wrap(sdf.extrude(outer, 0.16, 0.012).at(0, 0, -0.06));
    k.body('rim', plate, {
      color: STEEL,
      roughness: 0.35,
      metalness: 0.9,
      detail: 0.008,
      maxTriangles: 400,
      bump: (x, y, z) => 0.0004 * noise.fbm(x * 300, y * 20, z * 300, 2), // brushed steel
    });

    // Raised rim band around the field.
    const bandOuter = profile.offsetProfile(outer, -0.012);
    const band = wrap(
      sdf
        .extrude(bandOuter, 0.15, 0.01)
        .subtract(sdf.extrude(profile.offsetProfile(bandOuter, -0.05), 0.3))
        .at(0, 0, -0.035),
    );
    // Keystone plates at the top and bottom edges.
    const plateT = profile.polygon([
      [-0.075, 0.89],
      [0.075, 0.89],
      [0.13, 1.0],
      [-0.13, 1.0],
    ]);
    const plateB = profile.polygon([
      [-0.13, 0.0],
      [0.13, 0.0],
      [0.075, 0.11],
      [-0.075, 0.11],
    ]);
    const keystones = wrap(
      sdf.union(
        sdf.extrude(plateT, 0.14, 0.012).at(0, 0, -0.03),
        sdf.extrude(plateB, 0.14, 0.012).at(0, 0, -0.03),
      ),
    );
    k.body('rim-band', sdf.union(band, keystones), {
      color: STEEL,
      roughness: 0.35,
      metalness: 0.9,
      detail: 0.008,
      maxTriangles: 700,
    });

    // ------------------------------------------------------------- red field
    const field = wrap(sdf.extrude(profile.offsetProfile(outer, -0.05), 0.14, 0.01).at(0, 0, -0.04));
    k.body('field', field, {
      color: '#b3352c',
      roughness: 0.5,
      metalness: 0.1,
      detail: 0.008,
      maxTriangles: 300,
    });

    // ------------------------------------------------------------- gold lion
    // A flat heraldic relief in front of the field surface (surfC3): a scalloped mane disc, a
    // dominant head disc, ears, a rounded muzzle and nose, and two paws. Flat relief reads at 128 px.
    const LY = 0.6; // lion center height
    const s0 = surfC3(0);
    // Mane: a smooth 12-scallop wavy disc.
    const scallop: [number, number][] = [];
    for (let i = 0; i < 24; i++) {
      const a = ((i + 0.5) / 24) * Math.PI * 2;
      const r = i % 2 === 0 ? 0.2 : 0.163;
      scallop.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    const parts: sdf.Shape[] = [];
    parts.push(sdf.extrude(profile.polygon(scallop, { smooth: true }), 0.05, 0.014).at(0, LY, s0 - 0.005));
    // Head, ears, muzzle, nose.
    parts.push(sdf.extrude(profile.circle(0.105), 0.06, 0.016).at(0, LY + 0.01, s0 + 0.005));
    parts.push(sdf.extrude(profile.circle(0.036), 0.05, 0.012).at(-0.08, LY + 0.125, surfC3(-0.08) + 0.015));
    parts.push(sdf.extrude(profile.circle(0.036), 0.05, 0.012).at(0.08, LY + 0.125, surfC3(0.08) + 0.015));
    parts.push(sdf.ellipsoid([0.06, 0.048, 0.05]).at(0, LY - 0.048, s0 + 0.015));
    parts.push(sdf.sphere(0.015).at(0, LY - 0.028, s0 + 0.055));
    // Two paws tucked under the mane.
    parts.push(sdf.ellipsoid([0.042, 0.032, 0.035]).at(-0.06, LY - 0.185, surfC3(-0.06) - 0.008));
    parts.push(sdf.ellipsoid([0.042, 0.032, 0.035]).at(0.06, LY - 0.185, surfC3(0.06) - 0.008));
    const eye = (x: number) =>
      sdf
        .extrude(profile.arc(0.018, 0.006, 200, 340), 0.12)
        .at(x, LY + 0.035, s0 + 0.06);
    const lion = sdf
      .union(...parts)
      .paintWhere(eye(-0.042), '#3a2210', 0.003)
      .paintWhere(eye(0.042), '#3a2210', 0.003);
    k.body('lion', lion, {
      color: GOLD,
      roughness: 0.42,
      metalness: 1,
      detail: 0.005,
      textureDensity: 2,
      maxTriangles: 2000,
    });

    // ------------------------------------------------------------- gold rivets and studs
    const rivet = (x: number, y: number) => sdf.sphere(0.018).at(x, y, surfC2(x, y) + 0.004);
    const rivets: sdf.Shape[] = [];
    for (const y of [0.2, 0.5, 0.8]) {
      rivets.push(rivet(-0.263, y), rivet(0.263, y));
    }
    rivets.push(rivet(-0.19, 0.06), rivet(0.19, 0.06), rivet(-0.19, 0.94), rivet(0.19, 0.94));
    // Studs on the keystone plates (x = 0, so no wrap shift).
    rivets.push(sdf.sphere(0.02).at(0, 0.055, surfC2(0, 0.055) + 0.006));
    rivets.push(sdf.sphere(0.02).at(0, 0.945, surfC2(0, 0.945) + 0.006));
    k.body('rivets', sdf.union(...rivets), {
      color: GOLD,
      roughness: 0.42,
      metalness: 1,
      detail: 0.008,
      maxTriangles: 800,
    });

    // ------------------------------------------------------------- leather straps on the back
    const strap = (y: number) => sdf.capsule([-0.15, y, -0.12], [0.15, y, -0.12], 0.022);
    k.body('straps', sdf.union(strap(0.4), strap(0.62)), {
      color: '#5c3a22',
      roughness: 0.75,
      metalness: 0,
      detail: 0.008,
    });
  },
});
