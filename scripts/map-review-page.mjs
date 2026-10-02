// Builds docs/map-review.html: static map shots with accept/reject marks.
// Usage: node scripts/map-review-page.mjs
import fs from 'node:fs';
const dir = 'docs/map-mockups';
const log = fs.readFileSync('bench/sonnet/log.tsv', 'utf8').trim().split('\n').map((l) => l.split('\t'));
const last = {};
for (const r of log) if (r[2] === 'map-p2') last[r[1]] = { rating: r[10], status: r[11], note: r[12] || '' };
const names = fs.readdirSync(dir).filter((f) => f.endsWith('-3q.png')).map((f) => f.slice(0, -7)).sort();
const maps = names.map((n) => {
  const m = last[n] || {};
  const md = fs.existsSync(`${dir}/${n}.md`) ? fs.readFileSync(`${dir}/${n}.md`, 'utf8') : '';
  const pieces = (md.match(/\((\d+) pieces\)/) || [])[1] || '';
  return { id: n, rating: m.rating || '', status: m.status || '', note: m.note, pieces,
    reviewed: /not re-viewed|without/.test(m.note || '') };
});
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Map Review</title><style>
:root{--bg:#f6f5f1;--fg:#222;--card:#fff;--line:#d8d5cc;--ok:#1f7a3d;--no:#b3261e;--mut:#6b6860}
@media(prefers-color-scheme:dark){:root{--bg:#161614;--fg:#e8e6e0;--card:#222220;--line:#3a3935;--ok:#5fc582;--no:#ff8a80;--mut:#9a978e}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.4 system-ui,sans-serif}
header{position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--line);padding:10px 16px;z-index:5;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
header h1{font-size:18px;margin:0 12px 0 0}button,select{font:inherit;padding:4px 10px;border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:6px;cursor:pointer}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,520px),1fr));gap:16px;padding:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px}.card.accept{border-color:var(--ok);border-width:2px}.card.reject{border-color:var(--no);border-width:2px}
.card h2{margin:0 0 4px;font-size:17px}.meta{color:var(--mut);font-size:13px;margin-bottom:8px}
.imgs{display:grid;grid-template-columns:2fr 1fr;gap:6px}.imgs img{width:100%;border-radius:6px;display:block;cursor:zoom-in;background:#000}
.imgs .stack{display:grid;gap:6px;align-content:start}.row{display:flex;gap:8px;margin-top:10px;align-items:center}
.row button{flex:0 0 auto}.a.on{background:var(--ok);color:#fff}.r.on{background:var(--no);color:#fff}
input.note{flex:1;min-width:0;font:inherit;padding:4px 8px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--fg)}
#zoom{position:fixed;inset:0;background:#000d;display:none;align-items:center;justify-content:center;z-index:10}#zoom img{max-width:96vw;max-height:96vh}
.tag{display:inline-block;padding:0 6px;border-radius:4px;border:1px solid var(--line);font-size:12px}
</style></head><body>
<header><h1>Map review</h1><span id="count"></span>
<select id="filter"><option value="all">All maps</option><option value="undecided">Undecided</option><option value="accept">Accepted</option><option value="reject">Rejected</option><option value="reserve">Reserve (agent)</option><option value="unviewed">Not viewed by orchestrator</option></select>
<button id="export">Export JSON</button><button id="copy">Copy TSV</button></header>
<main id="grid"></main><div id="zoom"><img alt=""></div>
<script>
const MAPS=${JSON.stringify(maps)};
const KEY='map-review-v1';let S={};try{S=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const grid=document.getElementById('grid'),zoom=document.getElementById('zoom');
function render(){const f=document.getElementById('filter').value;grid.innerHTML='';let n=0,a=0,r=0;
for(const m of MAPS){const s=S[m.id]||{};if(s.d==='accept')a++;if(s.d==='reject')r++;
if(f==='undecided'&&s.d)continue;if((f==='accept'||f==='reject')&&s.d!==f)continue;if(f==='reserve'&&m.status!=='reserve')continue;if(f==='unviewed'&&!m.reviewed)continue;n++;
const c=document.createElement('div');c.className='card '+(s.d||'');
c.innerHTML='<h2>'+m.id+'</h2><div class="meta">Agent rating '+(m.rating||'?')+' · '+(m.status||'no log')+(m.pieces?' · '+m.pieces+' pieces':'')+(m.reviewed?' · <span class="tag">not viewed</span>':'')+'</div>'+
'<div class="imgs"><img loading="lazy" src="map-mockups/'+m.id+'-3q.png" alt="'+m.id+' 3/4 view"><div class="stack"><img loading="lazy" src="map-mockups/'+m.id+'-top.png" alt="top view"><img loading="lazy" src="map-mockups/'+m.id+'.jpg" alt="mockup"></div></div>'+
'<div class="row"><button class="a'+(s.d==='accept'?' on':'')+'">Accept</button><button class="r'+(s.d==='reject'?' on':'')+'">Reject</button><input class="note" placeholder="Note" value="'+(s.n||'').replace(/"/g,'&quot;')+'"></div>';
const set=(d)=>{S[m.id]=Object.assign(S[m.id]||{},{d:S[m.id]&&S[m.id].d===d?'':d});save();render()};
c.querySelector('.a').onclick=()=>set('accept');c.querySelector('.r').onclick=()=>set('reject');
c.querySelector('.note').onchange=(e)=>{S[m.id]=Object.assign(S[m.id]||{},{n:e.target.value});save()};
c.querySelectorAll('img').forEach(i=>i.onclick=()=>{zoom.firstChild.src=i.src;zoom.style.display='flex'});grid.appendChild(c)}
document.getElementById('count').textContent=n+' shown · '+a+' accepted · '+r+' rejected · '+(MAPS.length-a-r)+' undecided'}
zoom.onclick=()=>zoom.style.display='none';document.getElementById('filter').onchange=render;
const rows=()=>MAPS.map(m=>{const s=S[m.id]||{};return{map:m.id,decision:s.d||'',note:s.n||'',agentRating:m.rating}});
document.getElementById('export').onclick=()=>{const b=new Blob([JSON.stringify(rows(),null,2)],{type:'application/json'});const u=document.createElement('a');u.href=URL.createObjectURL(b);u.download='map-review.json';u.click()};
document.getElementById('copy').onclick=()=>navigator.clipboard.writeText(rows().map(r=>[r.map,r.decision,r.note].join('\\t')).join('\\n'));
render();
</script></body></html>`;
fs.writeFileSync('docs/map-review.html', html);
console.log(maps.length, 'maps ->docs/map-review.html');
