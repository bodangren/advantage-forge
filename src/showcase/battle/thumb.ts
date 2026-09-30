/**
 * The thumbnail of the battle teaser: the YouTube dressing over one still of the leap (the
 * knight and the orc warlord in the air, just before the impact).
 *
 *   thumb.html?format=16x9&bg=/out/battle/thumb-bg-16x9.png   the still (a video frame or a ?cam still)
 *   &zoom=1.2&fx=50&fy=45                                      16:9, optional: scale the still about fx% fy%
 *   &format=9x16&enemy=1320,368&hero=405,435&scale=1.35         9:16 (a Reels cover) from the same 16:9 still:
 *                                                              the orc warlord above a diagonal cut, the knight
 *                                                              below it; enemy and hero are their faces in the still
 *
 * scripts/battle.ts thumb renders it to out/battle/thumb-<format>.png and .jpg.
 */
import { ENEMY_KINDS, HERO_CLASSES } from './timeline.js';
import './battle.css';
import './thumb.css';

const params = new URLSearchParams(location.search);
const format = params.get('format') === '9x16' ? '9x16' : '16x9';
const num = (name: string, def: number): number => {
  const v = Number(params.get(name));
  return params.has(name) && Number.isFinite(v) ? v : def;
};
const point = (name: string, def: [number, number]): [number, number] => {
  const v = (params.get(name) ?? '').split(',').map(Number);
  return v.length === 2 && v.every(Number.isFinite) ? [v[0]!, v[1]!] : def;
};

/** The red arrow: from the top right, down to the tip at the bottom left (it points at the orc warlord). */
const ARROW_SHAFT = 'M262 24 C 268 140, 210 214, 118 236';
const ARROW_HEAD = 'M34 254 L 112 190 L 128 290 Z';

const still = format === '9x16'
  ? '<div class="half enemy-half"><img alt="" /></div><div class="half hero-half"><img alt="" /></div><div class="cut"></div>'
  : '<div class="half full"><img alt="" /></div>';

const root = document.createElement('div');
root.className = `thumb format-${format}`;
root.innerHTML = `
  ${still}
  <div class="rays"></div>
  <div class="burst"></div>
  <div class="vignette"></div>
  <div class="logo title-text">CHIBI QUEST</div>
  <div class="soon"><span>เร็ว ๆ นี้!</span></div>
  <div class="vs">VS</div>
  <div class="badge hero"><span class="pre">ฮีโร่</span><span class="num">${HERO_CLASSES}</span><span class="post">คลาส</span></div>
  <div class="badge enemy"><span class="pre">ศัตรู</span><span class="num">${ENEMY_KINDS}</span><span class="post">แบบ</span></div>
  <svg class="arrow" viewBox="0 0 300 300" aria-hidden="true">
    <g class="edge"><path class="shaft" d="${ARROW_SHAFT}" /><path class="head" d="${ARROW_HEAD}" /></g>
    <g class="body"><path class="shaft" d="${ARROW_SHAFT}" /><path class="head" d="${ARROW_HEAD}" /></g>
  </svg>
  <div class="question">ใครจะชนะ?!</div>`;
document.body.append(root);

const imgs = [...root.querySelectorAll<HTMLImageElement>('.half img')];
for (const img of imgs) img.src = params.get('bg') ?? '';

/** Scale the still by s and put its point `from` at the point `to` of its half, with no gap at an edge. */
function place(img: HTMLImageElement, from: [number, number], to: [number, number], s: number): void {
  const box = img.parentElement!.getBoundingClientRect();
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  const left = Math.min(0, Math.max(box.width - w, to[0] - from[0] * s));
  const top = Math.min(0, Math.max(box.height - h, to[1] - from[1] * s));
  Object.assign(img.style, { width: `${w}px`, height: `${h}px`, left: `${left}px`, top: `${top}px` });
}

declare global {
  interface Window {
    __thumb?: { ready: boolean };
  }
}

void Promise.all([...imgs.map((i) => i.decode()), document.fonts.ready]).then(() => {
  if (format === '9x16') {
    // The faces go to the center line of each half: the orc under the logo, the knight under the cut.
    const s = num('scale', 1.35);
    place(imgs[0]!, point('enemy', [1320, 368]), [560, 497], s);
    place(imgs[1]!, point('hero', [405, 435]), [540, 574], s);
  } else {
    const [img] = imgs;
    const s = num('zoom', 1);
    const w = innerWidth;
    const h = innerHeight;
    place(img!, [(num('fx', 50) / 100) * img!.naturalWidth, (num('fy', 50) / 100) * img!.naturalHeight], [(num('fx', 50) / 100) * w, (num('fy', 50) / 100) * h], (s * w) / img!.naturalWidth);
  }
  window.__thumb = { ready: true };
});
