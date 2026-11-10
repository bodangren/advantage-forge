#!/usr/bin/env python3
"""Acceptance probe: full 1:1 reconciliation of spend log vs provider rows."""
import csv, os
from collections import Counter

REPO = "/home/daniebo/Desktop/advantage-forge"
RUNS = os.path.join(REPO, "measure/runs/asset_storytime_l2_retries_cover_20261110")
START = "2026-11-10T08:57:00Z"

calls = []
with open(os.path.join(RUNS, "spend-log.tsv")) as f:
    for line in f:
        parts = line.rstrip("\n").split("\t")
        if parts[0] in ("worst-case", "total"):
            continue
        calls.append(parts)

weeks = ["w09", "w10", "w12", "w13", "w14"]
folders = [os.path.join(REPO, "out/storytime/l2/unit2", w, "muse", "costs.tsv") for w in weeks]
folders.append(os.path.join(REPO, "out/storytime/covers/teacher-front/muse/costs.tsv"))

rows = []
for path in folders:
    with open(path) as f:
        for row in csv.DictReader(f, delimiter="\t"):
            rows.append(row)

recent = [r for r in rows if r["time"] >= START]

problems = []
# Match by exact time.
by_time = {}
for r in recent:
    by_time.setdefault(r["time"], []).append(r)

spend_a = 0.0
spend_b = 0.0
matched_times = set()
for c in calls:
    t, tool, prompt, attempt, cost, resfile = c[0], c[1], c[2], int(c[3]), float(c[4]), c[5]
    if t not in by_time:
        problems.append(f"spend line {t} {prompt} has no provider row")
        continue
    matched_times.add(t)
    # time may collide; take first unused
    r = by_time[t].pop(0)
    rid, kind = prompt.rsplit(" ", 1)
    if r["row"] != rid:
        problems.append(f"time {t}: row mismatch log={rid} provider={r['row']}")
    if r["kind"] != kind:
        problems.append(f"time {t}: kind mismatch log={kind} provider={r['kind']}")
    if abs(float(r["usage_cost"]) - cost) > 1e-9:
        problems.append(f"time {t}: cost mismatch log={cost} provider={r['usage_cost']}")
    if cost > 0.03:
        problems.append(f"time {t}: call above 0.03 USD: {cost}")
    if kind == "color" and rid == "l2-u1-cover-quest-teacher-front":
        spend_b += cost
    else:
        spend_a += cost
    # attempt cross-check: count rows of id+kind at/after start up to and including this row
    n = sum(1 for x in recent if x["row"] == rid and x["kind"] == kind and x["time"] <= t)
    if rid == "l2-u1-cover-quest-teacher-front":
        if n != attempt:
            problems.append(f"time {t}: cover attempt mismatch log={attempt} counted={n}")
    else:
        # For unit2 rows, attempt numbers continue from archived tries.
        pass

for t, lst in by_time.items():
    for r in lst:
        problems.append(f"provider row {t} {r['row']} {r['kind']} has no spend log line")

# Listed-id check: every non-cover recent row must be one of the 9 U2_EXTRA_TRY ids.
listed = {
    ("l2-w10-story-page-put-on-your-hat-pip", "color"),
    ("l2-w10-story-page-put-on-your-hat-pip", "line"),
    ("l2-w09-story-page-tom-can-see-the-mop", "line"),
    ("l2-w09-card-rice", "line"),
    ("l2-w12-card-hippo", "line"),
    ("l2-w12-card-ruler", "line"),
    ("l2-w13-card-clap", "line"),
    ("l2-w13-card-throw", "line"),
    ("l2-w14-card-cold", "line"),
    ("l2-w14-card-windy", "line"),
}
for r in recent:
    key = (r["row"], r["kind"])
    if r["row"] == "l2-u1-cover-quest-teacher-front":
        continue
    if key not in listed:
        problems.append(f"unlisted row got a call: {key} at {r['time']}")

# Totals.
n_a = sum(1 for c in calls if c[2] != "l2-u1-cover-quest-teacher-front color")
n_b = sum(1 for c in calls if c[2] == "l2-u1-cover-quest-teacher-front color")
print(f"item a: {n_a} calls, spend {spend_a:.2f} USD (stop 0.15)")
print(f"item b: {n_b} calls, spend {spend_b:.2f} USD (stop 0.10)")
print(f"per-id counts: {Counter(c[2] for c in calls)}")
if problems:
    print("PROBLEMS:")
    for p in problems:
        print(" -", p)
else:
    print("RECONCILIATION CLEAN: every spend line matches one provider row and reverse.")
