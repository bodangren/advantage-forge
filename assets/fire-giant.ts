import { mixRgb, noise, rgb, sdf } from '../src/index.js';
import { flameTongue } from './parts/element-features.js';
import { ogreAsset, ogrePauldrons } from './parts/ogre-kind.js';

/**
 * Fire giant — Chibi Quest monster (catalog `monsters/giant-and-ancient/fire-giant`), about 1.5 m
 * to the top of its head (1.7 m to the flame tips), faces +Z. Target:
 * docs/monster-mockups/fire-giant_001.jpg (made with mmx).
 *
 * The ogre brute (`assets/ogre-brute.ts`; body, rig, and clips from `assets/parts/ogre-kind.ts`)
 * as a fire giant, bigger: crimson skin, a broad nose (no tusks), a glowing orange beard and side
 * locks, a crest of flames on its head, dark iron shoulder plates, bracers, and belt buckle, and
 * an iron war hammer in place of the club.
 * Role: the fire brute of the giant family; the flame hair and the iron armor read at 128 px.
 * Palette (60/30/10): crimson skin #a8323a (a lighter belly); dark iron #3a3a44; dark cloth
 *   #3a3036; the glowing orange beard and flames as the accent.
 * Bodies added: flames (on the head, glowing), pauldrons (tagged to the upper arms), hammer and
 *   hammer-head (rigid on the right hand).
 */

const FLAME_ROOT = rgb('#ff5a10');
const FLAME_TIP = rgb('#ffe060');

export default ogreAsset({
  name: 'fire-giant',
  description:
    'Chibi fire giant monster: a big crimson giant with a glowing orange flame beard and a crest of flames, a broad nose, dark iron shoulder plates and bracers, a dark loincloth, and an iron war hammer.',
  reference: 'docs/monster-mockups/fire-giant_001.jpg',
  scale: 1.45,
  headScale: 1.1,
  variants: {
    skin: { crimson: '#a8323a', ember: '#c04a2a', basalt: '#5a4a4e' },
    cloth: { soot: '#3a3036', red: '#7a2a20', brown: '#5a3a22' },
    leather: { iron: '#3a3a44', bronze: '#7a5a34', black: '#24222a' },
    mane: { flame: '#ff7a1c', ember: '#e04a18', gold: '#ffa424' },
  },
  presets: {
    ember: { skin: 'ember', cloth: 'red', leather: 'black', mane: 'gold' },
    basalt: { skin: 'basalt', cloth: 'brown', leather: 'bronze', mane: 'ember' },
  },
  colors: {
    skinDark: '#7a2228',
    skinLight: '#c04a50',
    lid: '#7a2228',
    mouth: '#3a1010',
    sclera: '#ffe8a0',
    redDark: '#241e22',
    hide: '#4a4048',
    leatherDark: '#24242c',
    maneShade: '#d8381a',
    maneHi: '#ffd04a',
  },
  nose: 'human',
  tusks: 0,
  mane: { tuft: false },
  maneBody: { roughness: 0.5, emissive: '#ff6a10', emissiveIntensity: 0.4 },
  weapon(_k, o) {
    // An iron war hammer: a dark wooden haft and a heavy iron block across it (along the side axis,
    // which stays level in the low swipe, so the block stays above the ground).
    const haft = sdf.chain(
      [
        [0, -0.1, 0, 0.034],
        [0, 0.16, 0, 0.038],
        [0, 0.24, 0, 0.04],
      ],
      0.02,
    );
    o.put('hammer', o.weapon(haft), { color: '#4a2e1e', roughness: 0.75, bone: 'hand.R', detail: 0.005 });
    const block = sdf.smoothUnion(
      0.01,
      sdf.box([0.17, 0.11, 0.11], 0.02).at(0, 0.28, 0),
      ...[-0.09, 0.09].map((x) => sdf.cylinder(0.058, 0.024, 0.008).rotateZ(90).at(x, 0.28, 0)), // the striking faces
    );
    o.put('hammer-head', o.weapon(block.displace(0.002, (x, y, z) => noise.fbm(x * 40, y * 40, z * 40, 2))), {
      color: o.tone('leather', '#4a4a54'),
      roughness: 0.45,
      metalness: 0.7,
      bone: 'hand.R',
      detail: 0.004,
    });
  },
  extra(_k, o) {
    // A crest of flames on the head (head space: the top of the skull is at y 0.92).
    const crest = sdf
      .smoothUnion(
        0.03,
        flameTongue(0, 0.84, 0.04, 4, 0.24, 0.08, 0.08),
        flameTongue(0.09, 0.82, 0.0, 30, 0.17, 0.06, 0.06),
        flameTongue(-0.09, 0.82, 0.0, -30, 0.17, 0.06, 0.06),
        flameTongue(0.05, 0.84, -0.09, 14, 0.2, 0.065, 0.08),
        flameTongue(-0.05, 0.84, -0.09, -14, 0.2, 0.065, 0.08),
      )
      .paintFn((_x, y) => mixRgb(FLAME_ROOT, FLAME_TIP, Math.min(1, Math.max(0, (y - 0.93) / 0.14))));
    o.put('flames', o.head(crest), { color: '#ff7a1c', roughness: 0.5, emissive: '#ff6a00', emissiveIntensity: 0.5, bone: 'head', detail: 0.005 });
    o.put('pauldrons', ogrePauldrons(o), { color: o.tint.leather, roughness: 0.45, metalness: 0.6, detail: 0.006 });
  },
});
