import { defineAsset, motion, mixRgb, noise, profile, rgb, sdf } from '../src/index.js';

/**
 * Stylized treasure chest: plank body with iron corner guards and straps, barrel lid on a hinge,
 * gold lock plate, and a heap of coins inside. Rigged: the lid opens.
 */

const W = 0.72; // width (X)
const D = 0.46; // depth (Z)
const H = 0.3; // body height
const LID_R = D / 2; // the lid is a half cylinder spanning the depth
const HINGE = [0, H, -D / 2] as const;

const wood = rgb('#7d4a27');
const woodDark = rgb('#4e2c13');
const C = {
  iron: '#3d4047',
  gold: '#d9a93a',
  goldDark: '#9c6d1c',
  inside: '#2a170b',
  gem: '#35c2d6',
};

/** Planks: horizontal boards with dark gaps and a per-board tint, plus grain. */
const planks =
  (boardHeight: number, axis: 'y' | 'x') =>
  (x: number, y: number, z: number): readonly [number, number, number] => {
    const v = axis === 'y' ? y : x;
    const board = Math.floor(v / boardHeight);
    const f = v / boardHeight - board;
    const gap = f < 0.06 || f > 0.94 ? 0.75 : 0;
    const tint = noise.random(board, 3) * 0.35;
    const grain = 0.5 + 0.5 * noise.noise3(x * 6, y * 60, z * 6 + board);
    return mixRgb(wood, woodDark, Math.min(1, 0.15 + tint + 0.25 * grain + gap));
  };

export default defineAsset({
  name: 'treasure-chest',
  description: 'Wooden treasure chest with iron fittings, a gold lock, and coins; the lid opens.',
  detail: 0.006,

  build(k) {
    k.skeleton({
      base: { at: [0, 0, 0] },
      lid: { parent: 'base', at: HINGE },
    });

    // ------------------------------------------------------------------ body: an open box
    const outer = sdf.box([W, H, D], 0.018).at(0, H / 2, 0);
    const hollow = sdf.box([W - 0.07, H, D - 0.07], 0.01).at(0, H / 2 + 0.05, 0);
    const body = outer
      .subtract(hollow)
      .displace(0.0025, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2))
      .paintFn(planks(0.075, 'y'))
      .paintWhere(hollow.round(0.004), C.inside, 0.01);
    k.body('body', body, { color: '#8a5530', roughness: 0.8, bone: 'base' });

    // Iron: corner guards wrap each vertical edge; two straps run over the front and back.
    const shellOf = (s: sdf.Shape, t: number) => s.round(t).subtract(s.round(-0.002));
    const skin = shellOf(outer, 0.009);
    const corners = skin.intersect(
      sdf
        .box([0.11, H + 0.02, 0.11], 0.01)
        .at(W / 2, H / 2, D / 2)
        .mirror('x', 0)
        .mirror('z', 0),
    );
    const straps = skin.intersect(
      sdf
        .box([0.06, H + 0.02, D + 0.1], 0.01)
        .at(W * 0.3, H / 2, 0)
        .mirror('x', 0),
    );
    const studs = sdf.union(
      ...[0.06, 0.15, 0.24].flatMap((y) =>
        [W * 0.3, W / 2 - 0.035].map((x) => sdf.sphere(0.011).at(x, y, D / 2 + 0.008)),
      ),
    );
    k.body('iron', sdf.union(corners, straps, studs.mirror('x', 0)).mirror('z', 0), {
      color: C.iron,
      roughness: 0.42,
      metalness: 0.85,
      bone: 'base',
    });

    // ------------------------------------------------------------------ lid: half cylinder along X
    const lidProfile = profile.polygon(
      Array.from({ length: 25 }, (_, i) => {
        const a = (Math.PI * i) / 24;
        return [Math.cos(a) * LID_R, Math.sin(a) * LID_R * 0.72] as [number, number];
      }),
    );
    // Profile in ZY (U = z, V = y), extruded along X.
    const lidSolid = sdf.extrude(lidProfile, W, 0.018).rotateY(90).at(0, H, 0);
    // Hollow underside, so the open lid shows its inside instead of a flat wall.
    const lidHollow = sdf
      .extrude(
        profile.polygon(
          Array.from({ length: 25 }, (_, i) => {
            const a = (Math.PI * i) / 24;
            return [Math.cos(a) * (LID_R - 0.035), Math.sin(a) * (LID_R * 0.72 - 0.035) - 0.02] as [
              number,
              number,
            ];
          }),
        ),
        W - 0.07,
        0.01,
      )
      .rotateY(90)
      .at(0, H, 0);
    const lid = lidSolid
      .subtract(lidHollow)
      .paintWhere(lidHollow.round(0.004), C.inside, 0.01)
      .displace(0.0025, (x, y, z) => noise.fbm(x * 30, y * 30, z * 30, 2))
      .paintFn((x, y, z) => {
        // Lid boards run along X; board edges follow the arc of the lid.
        const angle = Math.atan2((y - H) / 0.72, z);
        return planks(0.26, 'y')(x, angle * 0.5, z);
      });
    k.body('lid-wood', lid, { color: '#8a5530', roughness: 0.8, bone: 'lid' });

    const lidSkin = shellOf(lidSolid, 0.009);
    const lidBands = lidSkin.intersect(
      sdf.union(
        sdf
          .box([0.06, 0.4, D + 0.1], 0.01)
          .at(W * 0.3, H + 0.1, 0)
          .mirror('x', 0),
        sdf
          .box([0.05, 0.4, D + 0.1], 0.01)
          .at(W / 2 - 0.06, H + 0.1, 0)
          .mirror('x', 0),
      ),
    );
    const lock = sdf
      .extrude(
        profile.polygon(
          [
            [0, 0.07],
            [0.055, 0.05],
            [0.06, -0.02],
            [0, -0.075],
            [-0.06, -0.02],
            [-0.055, 0.05],
          ],
          { smooth: true },
        ),
        0.02,
        0.006,
      )
      .at(0, H - 0.01, D / 2 + 0.012)
      .paintWhere(sdf.extrude(profile.rect([0.012, 0.03], 0.006), 0.1).at(0, H - 0.025, D / 2), '#1a1206')
      .paintWhere(sdf.sphere(0.011).at(0, H - 0.004, D / 2 + 0.03), '#1a1206');
    k.body('lid-iron', lidBands, { color: C.iron, roughness: 0.42, metalness: 0.85, bone: 'lid' });
    k.body('lock', lock, { color: C.gold, roughness: 0.3, metalness: 1, bone: 'lid' });

    // ------------------------------------------------------------------ treasure inside
    const heap = sdf
      .ellipsoid([W / 2 - 0.06, 0.07, D / 2 - 0.06])
      .at(0, H - 0.04, 0)
      .displace(0.012, (x, _y, z) => noise.fbm(x * 25, 0, z * 25, 3))
      .intersect(hollow.round(-0.002));
    const coins = sdf.union(
      ...Array.from({ length: 9 }, (_, i) => {
        const x = (noise.random(i, 1) - 0.5) * (W - 0.2);
        const z = (noise.random(i, 2) - 0.5) * (D - 0.18);
        return sdf
          .cylinder(0.028, 0.008, 0.003)
          .rotate(noise.random(i, 3) * 60 - 30, 0, noise.random(i, 4) * 60 - 30)
          .at(x, H + 0.02 + noise.random(i, 5) * 0.015, z);
      }),
    );
    k.body(
      'gold',
      sdf
        .smoothUnion(0.006, heap, coins)
        .paintFn((x, y, z) =>
          mixRgb(rgb(C.gold), rgb(C.goldDark), 0.5 + 0.5 * noise.noise3(x * 70, y * 70, z * 70)),
        ),
      { color: C.gold, roughness: 0.28, metalness: 1, bone: 'base' },
    );
    const gem = sdf
      .intersect(sdf.box([0.05, 0.05, 0.05]).rotate(35, 45, 0), sdf.sphere(0.03))
      .at(0.12, H + 0.035, 0.03);
    k.body('gem', gem, { color: C.gem, roughness: 0.12, metalness: 0.1, bone: 'base', flat: true });

    // ------------------------------------------------------------------ animation
    const { wave } = motion;
    const easeOutBack = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;
    k.animation('open', {
      duration: 1.1,
      loop: false,
      pose: (_t, p) => ({ lid: { rotate: [-105 * easeOutBack(Math.min(1, p * 1.15)), 0, 0] } }),
    });
    // A locked chest rattles when something is inside.
    k.animation('rattle', {
      duration: 0.8,
      pose: (_t, p) => ({
        // 5 shakes per clip: an odd count keeps 8-frame review strips off the zero crossings.
        base: { rotate: [0, 0, 2.5 * wave(p, 5) * Math.max(0, wave(p))] },
        lid: { rotate: [-5 * Math.max(0, wave(p, 5, 0.1)) * Math.max(0, wave(p)), 0, 0] },
      }),
    });
  },
});
