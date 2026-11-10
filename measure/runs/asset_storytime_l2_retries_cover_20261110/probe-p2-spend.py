#!/usr/bin/env python3
"""Acceptance probe: reconcile spend-log.tsv against provider costs.tsv rows."""
import csv, json, os, sys

REPO = "/home/daniebo/Desktop/advantage-forge"
RUNS = os.path.join(REPO, "measure/runs/asset_storytime_l2_retries_cover_20261110")
START = "2026-11-10T08:57:00Z"

# 1. Read spend log call lines (skip worst-case and total lines).
calls = []
with open(os.path.join(RUNS, "spend-log.tsv")) as f:
    for line in f:
        parts = line.rstrip("\n").split("\t")
        if parts[0] in ("worst-case", "total"):
            continue
        calls.append({
            "time": parts[0], "tool": parts[1], "prompt": parts[2],
            "attempt": int(parts[3]), "cost": float(parts[4]), "file": parts[5],
        })
print(f"spend log call lines: {len(calls)}")

# 2. Read provider cost rows since START from each costs.tsv.
weeks = ["w09", "w10", "w12", "w13", "w14"]
folders = [os.path.join(REPO, "out/storytime/l2/unit2", w, "muse", "costs.tsv") for w in weeks]
folders.append(os.path.join(REPO, "out/storytime/covers/teacher-front/muse/costs.tsv"))

provider_rows = []
for path in folders:
    with open(path) as f:
        rdr = csv.DictReader(f, delimiter="\t")
        for row in rdr:
            row["_file"] = os.path.relpath(path, REPO)
            provider_rows.append(row)

print(f"provider cost rows total: {len(provider_rows)}")
for r in provider_rows[:2]:
    print("sample provider row keys:", list(r.keys()))
    break

# Show all rows at/after START.
recent = [r for r in provider_rows if r.get("time", "") >= START]
print(f"provider rows at/after {START}: {len(recent)}")
for r in recent:
    print(json.dumps({k: v for k, v in r.items() if not k.startswith("_")})[:220], "|", r["_file"])
