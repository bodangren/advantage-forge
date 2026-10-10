#!/usr/bin/env python3
"""Write out/npc-report.html: the token use of the serial P2 NPC runs and the NPC status list.

Usage: python3 bench/sonnet/npc-serial/report.py

Inputs: bench/sonnet/npc-serial/log.tsv (one row per agent run), state.json (orchestrator
sessions and baselines), bench/sonnet/p2-npc-data.mjs (the NPC names), docs/character-reviews.json,
the follow-up table in the P2 NPC plan, and the agent transcripts under ~/.claude/projects.
Token counts: one value per API request (the max of each usage field), summed per model.
"""
import collections, datetime as dt, glob, html, json, os, re, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
PROJ = os.path.expanduser('~/.claude/projects/-home-daniebo-Desktop-advantage-forge')
PLAN = os.path.join(ROOT, 'measure/tracks/asset_p2_npcs_20260928/plan.md')
OUT = os.path.join(ROOT, 'out/npc-report.html')
BAR = 7.0  # NPC bar (owner rule 2026-10-10): 7.0 unless the model has a critical error
FIELDS = (('input', 'input_tokens'), ('cacheWrite', 'cache_creation_input_tokens'),
          ('cacheRead', 'cache_read_input_tokens'), ('output', 'output_tokens'))


def ts(s):
    return dt.datetime.fromisoformat(s.replace('Z', '+00:00')) if s else None


def usage(path, since=None):
    """Per-model token sums of one transcript, plus the first and last timestamps."""
    req, first, last = {}, None, None
    for line in open(path):
        try:
            m = json.loads(line)
        except ValueError:
            continue
        if m.get('type') != 'assistant':
            continue
        t = ts(m.get('timestamp'))
        if since and t and t < since:
            continue
        msg = m.get('message', {})
        u = msg.get('usage')
        if not u:
            continue
        first = first or t
        last = t or last
        cur = req.setdefault(m.get('requestId') or msg.get('id'), {'model': msg.get('model', '?')})
        for key, field in FIELDS:
            cur[key] = max(cur.get(key, 0), u.get(field, 0) or 0)
    per = collections.defaultdict(collections.Counter)
    for r in req.values():
        c = per[r['model'].replace('claude-', '')]
        c['calls'] += 1
        for key, _ in FIELDS:
            c[key] += r.get(key, 0)
        c['total'] += sum(r.get(key, 0) for key, _ in FIELDS)
    return per, first, last


def merge(dst, per):
    for model, c in per.items():
        dst[model].update(c)


def m(n):
    return f'{n / 1e6:.2f}M'


def npc_names():
    src = open(os.path.join(ROOT, 'bench/sonnet/p2-npc-data.mjs')).read()
    return re.findall(r"^\s+name: '([a-z-]+)'", src, re.M)


def follow_up():
    text = open(PLAN).read().split('## Follow-up list', 1)
    if len(text) < 2:
        return set()
    return set(re.findall(r'^\| ([a-z][a-z-]*) \|', text[1], re.M))


def committed():
    out = subprocess.run(['git', 'ls-files', 'assets'], cwd=ROOT, capture_output=True, text=True).stdout
    return {os.path.basename(p)[:-3] for p in out.split() if p.endswith('.ts')}


def mtime(p):
    return os.path.getmtime(p) if os.path.exists(p) else None


def status_of(n, reviews, follow, tracked, rounds):
    r = reviews.get(n, {})
    rating = r.get('overall')
    src = mtime(os.path.join(ROOT, f'assets/{n}.ts'))
    glb = mtime(os.path.join(ROOT, f'out/{n}/{n}.glb'))
    rev = ts(r.get('reviewedAt'))
    if n in follow:
        return 'follow-up'
    if rating is not None and rating >= BAR and n in tracked:
        return 'accepted'
    if src is None:
        return 'not started'
    sprites = mtime(os.path.join(ROOT, f'out/{n}/sprites/preview.png'))
    if glb is None or glb < src or sprites is None or sprites < src:
        return 'in work'
    if rating is None or (rev and glb > rev.timestamp()):
        return 'waits for review'
    return 'needs rework'


GROUPS = [
    ('accepted', 'Accepted (bar 7.0)'),
    ('waits for review', 'Built, waits for an independent review'),
    ('needs rework', 'Reviewed below the bar, waits for a builder pass'),
    ('in work', 'Source exists, the build is old or missing'),
    ('follow-up', 'Follow-up list (three reviews below the bar)'),
    ('not started', 'Not started'),
]


def main():
    state = json.load(open(os.path.join(HERE, 'state.json')))
    start = ts(state['serialStart'])
    rows = []
    with open(os.path.join(HERE, 'log.tsv')) as f:
        head = f.readline().rstrip('\n').split('\t')
        for line in f:
            if line.strip():
                rows.append(dict(zip(head, line.rstrip('\n').split('\t'))))

    serial_models = collections.defaultdict(collections.Counter)
    serial_roles = collections.Counter()
    for r in rows:
        hits = glob.glob(f"{PROJ}/*/subagents/agent-{r['agent']}.jsonl")
        per, first, last = usage(hits[0]) if hits else ({}, None, None)
        tot = collections.Counter()
        for c in per.values():
            tot.update(c)
        r['tok'] = tot
        r['models'] = ', '.join(sorted(per)) or r.get('model', '')
        r['minutes'] = f'{(last - first).total_seconds() / 60:.0f}' if first and last else ''
        r['when'] = first.astimezone().strftime('%m-%d %H:%M') if first else ''
        if r['phase'] == 'serial':
            merge(serial_models, per)
            serial_roles[r['role']] += tot['total']

    orch = collections.defaultdict(collections.Counter)
    for o in state['orchestrator']:
        p = f"{PROJ}/{o['session']}.jsonl"
        if os.path.exists(p):
            merge(orch, usage(p, ts(o['since']))[0])
    orch_total = sum(c['total'] for c in orch.values())
    merge(serial_models, orch)
    serial_roles['orchestrator'] += orch_total
    serial_total = sum(c['total'] for c in serial_models.values())

    reviews = json.load(open(os.path.join(ROOT, 'docs/character-reviews.json')))
    follow, tracked = follow_up(), committed()
    names = npc_names()
    names += sorted(follow - set(names))
    cards = collections.Counter(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(ROOT, 'bench/sonnet/npc-cards/*/*.png')))
    by = collections.defaultdict(list)
    for n in names:
        by[status_of(n, reviews, follow, tracked, cards)].append(n)
    acc_serial = [n for n in by['accepted'] if (ts(reviews[n].get('reviewedAt')) or start) >= start]
    decided_serial = acc_serial + [n for n in by['follow-up'] if n in reviews and (ts(reviews[n].get('reviewedAt')) or start) >= start]
    serial_runs = [r for r in rows if r['phase'] == 'serial']
    builder_runs = [r for r in serial_runs if r['role'] == 'builder']

    e = html.escape
    now = dt.datetime.now().strftime('%Y-%m-%d %H:%M')
    per_acc = m(serial_total / len(acc_serial)) if acc_serial else 'no accepted NPC yet'
    per_build = m(sum(r['tok']['total'] for r in builder_runs) / len(builder_runs)) if builder_runs else '-'

    stat = [
        ('Serial total', m(serial_total)),
        ('Per accepted NPC', per_acc),
        ('Per builder run', per_build),
        ('Agent runs', str(len(serial_runs))),
        ('Accepted', f"{len(by['accepted'])} of {len(names)}"),
        ('Accepted since serial start', str(len(acc_serial))),
    ]
    out = [f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="60">
<title>NPC Usage Report</title><style>
:root{{--bg:#f6f5f2;--card:#fff;--ink:#1d1d1b;--mute:#6b6a65;--line:#dedcd5;--accent:#2f6aa8;--good:#2e7d4f;--warn:#a8642f}}
@media (prefers-color-scheme:dark){{:root{{--bg:#16171a;--card:#202227;--ink:#ecebe7;--mute:#9a9891;--line:#33353b;--accent:#7fb0e6;--good:#6cc58f;--warn:#e0a46c}}}}
body{{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,sans-serif}}
main{{max-width:1400px;margin:0 auto;padding:16px}}
h1{{font-size:22px;margin:4px 0}} h2{{font-size:17px;margin:28px 0 8px}} .mute{{color:var(--mute)}}
.stats{{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin:12px 0}}
.stat{{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:10px}}
.stat b{{display:block;font-size:20px}}
.wrap{{overflow-x:auto}} table{{border-collapse:collapse;width:100%;background:var(--card)}}
th,td{{border-bottom:1px solid var(--line);padding:5px 8px;text-align:left;vertical-align:top}}
td.n{{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}}
.npc{{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px}}
.npc img{{width:100%;display:block;margin-top:6px;border-radius:4px;background:#888}}
.npc .row{{display:flex;justify-content:space-between;gap:8px}}
.chips{{display:flex;flex-wrap:wrap;gap:6px}} .chip{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:2px 9px}}
.good{{color:var(--good)}} .warn{{color:var(--warn)}}
</style></head><body><main>
<h1>P2 NPC usage report</h1>
<p class="mute">Generated {now}. The page reloads every 60 s; the data changes after every five NPCs.
Serial method since {start.astimezone().strftime('%m-%d %H:%M')}: one agent at a time (one Sonnet builder, or one reviewer).</p>
<div class="stats">''']
    out += [f'<div class="stat"><span class="mute">{e(k)}</span><b>{e(v)}</b></div>' for k, v in stat]
    out.append('</div>')

    out.append('<h2>Method comparison</h2><div class="wrap"><table><tr><th>Method</th><th>Tokens</th><th>NPCs</th><th>Tokens per NPC</th></tr>')
    for b in state['baselines']:
        out.append(f"<tr><td>{e(b['method'])}</td><td class=n>{m(b['tokens'])}</td><td class=n>{b['npcs']}</td><td class=n>{m(b['tokens'] / b['npcs'])} per {e(b['unit'])}</td></tr>")
    for phase, label in (('trial', 'Opus subagent trial (peddler, refugee), agents only'), ('serial', 'Serial method, agents and orchestrator')):
        rr = [r for r in rows if r['phase'] == phase and r['role'] == 'builder']
        t = sum(r['tok']['total'] for r in rows if r['phase'] == phase) + (orch_total if phase == 'serial' else 0)
        n = len(acc_serial) if phase == 'serial' else len(rr)
        unit = 'accepted NPC' if phase == 'serial' else 'pass'
        out.append(f"<tr><td>{e(label)}</td><td class=n>{m(t)}</td><td class=n>{n}</td><td class=n>{m(t / n) + ' per ' + unit if n else '-'}</td></tr>")
    out.append('</table></div>')

    out.append('<h2>Serial use per model and role</h2><div class="wrap"><table><tr><th>Model</th><th>Calls</th><th>Cache read</th><th>Cache write</th><th>Output</th><th>Total</th></tr>')
    for model, c in sorted(serial_models.items()):
        out.append(f"<tr><td>{e(model)}</td><td class=n>{c['calls']}</td><td class=n>{m(c['cacheRead'])}</td><td class=n>{m(c['cacheWrite'])}</td><td class=n>{c['output']:,}</td><td class=n>{m(c['total'])}</td></tr>")
    out.append('</table></div><p class="chips">' + ''.join(f'<span class="chip">{e(k)}: {m(v)}</span>' for k, v in sorted(serial_roles.items())) + '</p>')

    out.append('<h2>Agent runs</h2><div class="wrap"><table><tr><th>Run</th><th>Start</th><th>Role</th><th>Model</th><th>NPCs</th><th>Calls</th><th>Cache read</th><th>Cache write</th><th>Total</th><th>Min</th><th>Result</th><th>Lesson</th></tr>')
    for r in reversed(rows):
        t = r['tok']
        out.append(f"<tr><td>{e(r['run'])}</td><td>{e(r['when'])}</td><td>{e(r['role'])}</td><td>{e(r['models'])}</td><td>{e(r['npcs'].replace(',', ', '))}</td>"
                   f"<td class=n>{t['calls']}</td><td class=n>{m(t['cacheRead'])}</td><td class=n>{m(t['cacheWrite'])}</td><td class=n>{m(t['total'])}</td><td class=n>{e(r['minutes'])}</td>"
                   f"<td>{e(r['result'])}</td><td>{e(r['lesson'])}</td></tr>")
    out.append('</table></div>')

    for key, label in GROUPS:
        group = by.get(key, [])
        out.append(f'<h2>{e(label)} <span class="mute">({len(group)})</span></h2>')
        if not group:
            out.append('<p class="mute">None.</p>')
            continue
        if key == 'not started':
            out.append('<p class="chips">' + ''.join(f'<span class="chip">{e(n)}</span>' for n in group) + '</p>')
            continue
        out.append('<div class="grid">')
        for n in group:
            r = reviews.get(n, {})
            rating = r.get('overall')
            cls = 'good' if rating is not None and rating >= BAR else 'warn'
            rt = f'<b class="{cls}">{rating}</b>' if rating is not None else '<span class="mute">no rating</span>'
            imgs = ''
            for rel in (f'{n}/render.png', f'{n}/sprites/preview.png'):
                t = mtime(os.path.join(ROOT, 'out', rel))
                if t:
                    imgs += f'<a href="{e(rel)}"><img loading="lazy" src="{e(rel)}?v={int(t)}" alt="{e(n)} {e(rel)}"></a>'
            issue = (r.get('issues') or [''])[0] if key in ('needs rework', 'follow-up') else ''
            out.append(f'<div class="npc"><div class="row"><b>{e(n)}</b><span>{rt} · {cards[n]} reviews</span></div>'
                       + (f'<div class="mute">{e(issue)}</div>' if issue else '') + (imgs or '<div class="mute">No preview image.</div>') + '</div>')
        out.append('</div>')

    out.append('''</main><script>
try{const k='npc-report-scroll';const y=sessionStorage.getItem(k);if(y)scrollTo(0,+y);
addEventListener('scroll',()=>{try{sessionStorage.setItem(k,scrollY)}catch(_){}})}catch(_){}
</script></body></html>''')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, 'w').write('\n'.join(out))
    print(f"wrote {OUT}: serial {m(serial_total)} (orchestrator {m(orch_total)}), "
          + ', '.join(f'{k} {len(by[k])}' for k, _ in GROUPS))


if __name__ == '__main__':
    main()
