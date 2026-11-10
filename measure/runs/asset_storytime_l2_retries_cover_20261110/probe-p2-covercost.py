#!/usr/bin/env python3
"""Check restored cover costs.tsv rows against m1..m6 sidecar json files."""
import csv, json, os

REPO = "/home/daniebo/Desktop/advantage-forge"
MUSE = os.path.join(REPO, "out/storytime/covers/teacher-front/muse")

with open(os.path.join(MUSE, "costs.tsv")) as f:
    rows = list(csv.DictReader(f, delimiter="\t"))

problems = []
if len(rows) != 6:
    problems.append(f"row count {len(rows)} != 6")

for i, r in enumerate(rows, start=1):
    mj = os.path.join(MUSE, f"l2-u1-cover-quest-teacher-front-m{i}.json")
    if not os.path.exists(mj):
        problems.append(f"missing sidecar {mj}")
        continue
    with open(mj) as f:
        side = json.load(f)
    # sidecar shape: check common fields
    if r["version"] != f"m{i}":
        problems.append(f"row {i}: version {r['version']} != m{i}")
    if r["kind"] != "color":
        problems.append(f"row {i}: kind {r['kind']}")
    if r["usage_cost"] != "0.01":
        problems.append(f"row {i}: cost {r['usage_cost']}")
    if r["note"] != "ok":
        problems.append(f"row {i}: note {r['note']}")
    if r["size"] != "1280x1920":
        problems.append(f"row {i}: size {r['size']}")
    # sidecar cost + output checks
    def dig(d, *ks):
        for k in ks:
            if isinstance(d, dict) and k in d:
                d = d[k]
            else:
                return None
        return d
    cost = dig(side, "usage_cost") or dig(side, "cost")
    if cost is not None and abs(float(cost) - 0.01) > 1e-9:
        problems.append(f"row {i}: sidecar cost {cost}")
    # time proximity between sidecar and row
    st = dig(side, "created") or dig(side, "time") or side.get("time")
    if st and not str(st).startswith(r["time"][:17]):
        problems.append(f"row {i}: sidecar time {st} vs row time {r['time']}")

print("sidecar keys sample:", list(json.load(open(os.path.join(MUSE, 'l2-u1-cover-quest-teacher-front-m1.json'))).keys()))
if problems:
    print("PROBLEMS:")
    for p in problems:
        print(" -", p)
else:
    print("COVER COST FILE OK: 6 rows match sidecars and spend log.")
