import { defineAsset, noise, profile, rgb, mixRgb, sdf } from '../src/index.js';

/** Oak barrel with iron hoops, 0.9 m tall. Stylized: soft bevels, chunky hoops, slight wear. */

const H = 0.9;
const STAVES = 14;
const oak = rgb('#9a6437');
const oakDark = rgb('#6e4424');
const iron = '#4b4d52';

export default defineAsset({
  name: 'barrel',
  description: 'Oak barrel with iron hoops and a plank lid.',
  detail: 0.006,

  build(k) {
    // Bulged body: a revolved profile, widest at the middle.
    const bodyProfile = profile.polygon(
      [
        [0, 0],
        [0.26, 0],
        [0.3, H * 0.25],
        [0.315, H * 0.5],
        [0.3, H * 0.75],
        [0.26, H],
        [0, H],
      ],
      { smooth: true, samples: 10 },
    );
    const shell = sdf.revolve(bodyProfile).intersect(sdf.box([1, H, 1]).at(0, H / 2, 0));

    // Stave grooves: a shallow V cut at each seam, from the angle around the axis.
    const seam = (x: number, _y: number, z: number) => {
      const a = ((Math.atan2(z, x) / (2 * Math.PI)) * STAVES + STAVES) % 1;
      const d = Math.min(a, 1 - a) * 2; // 0 at a seam, 1 mid-stave
      return d < 0.12 ? 1 - d / 0.12 : 0;
    };
    const staveIndex = (x: number, z: number) =>
      Math.floor(((Math.atan2(z, x) / (2 * Math.PI)) * STAVES + STAVES) % STAVES);

    // Recessed lid with planks.
    const body = shell
      .displace(0.004, (x, y, z) => seam(x, y, z) + 0.25 * noise.fbm(x * 18, y * 6, z * 18, 3))
      .smoothSubtract(0.01, sdf.cylinder(0.225, 0.06, 0.01).at(0, H + 0.012, 0))
      .paintFn((x, y, z, base) => {
        // Each stave gets its own tint; grain streaks run vertically.
        const tint = noise.random(staveIndex(x, z), 7);
        const grain = 0.5 + 0.5 * noise.noise3(Math.atan2(z, x) * 40, y * 3, 0.5);
        const wood = mixRgb(oak, oakDark, 0.15 + 0.35 * tint + 0.25 * grain);
        return y > H - 0.03 && Math.hypot(x, z) < 0.23 ? mixRgb(wood, oakDark, 0.3) : wood;
      });
    k.body('barrel', body, { color: '#9a6437', roughness: 0.8, paintWeight: 2 });

    // Lid planks: three boards with gaps, sitting in the recess.
    const planks = sdf
      .intersect(
        sdf.cylinder(0.222, 0.02, 0.004).at(0, H - 0.025, 0),
        sdf.union(...[-0.15, 0, 0.15].map((x) => sdf.box([0.142, 0.1, 0.5], 0.004).at(x, H - 0.025, 0))),
      )
      .paintFn((x, y, z, base) => mixRgb(oak, oakDark, 0.3 + 0.3 * noise.noise3(x * 8, 0, z * 60)));
    k.body('lid', planks, { color: '#9a6437', roughness: 0.8, paintWeight: 2 });

    // Hoops: the body's own surface grown outward and cut into bands, so they hug the bulge.
    const hoops = shell
      .round(0.012)
      .intersect(
        sdf.union(...[0.07, 0.3, 0.6, 0.83].map((y) => sdf.box([1, 0.045, 1], 0.01).at(0, y * H, 0))),
      )
      .displace(0.0012, (x, y, z) => noise.noise3(x * 9, y * 9, z * 9));
    const rivets = sdf.union(
      ...[0.07, 0.3, 0.6, 0.83].flatMap((y) =>
        [0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + 0.4;
          const r = y === 0.3 || y === 0.6 ? 0.325 : 0.295;
          return sdf.sphere(0.011).at(Math.cos(a) * r, y * H, Math.sin(a) * r);
        }),
      ),
    );
    k.body('hoops', sdf.union(hoops, rivets), { color: iron, roughness: 0.45, metalness: 0.7 });
  },
});
