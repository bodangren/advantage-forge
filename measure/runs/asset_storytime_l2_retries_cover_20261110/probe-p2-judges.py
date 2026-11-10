#!/usr/bin/env python3
"""Summarize judge verdicts of the retry and cover judge files."""
import json, os

BASE = "measure/runs/asset_storytime_l2_retries_cover_20261110"
FILES = [
    "judge-u2rc-a-line-t4.json",
    "judge-u2rc-d-color-t5.json",
    "judge-u2rc-d-line-t5.json",
    "judge-u2rc-e-line-t2.json",
    "judge-u2rc-e-line-t2-second.json",
    "judge-cover-r1.json",
    "judge-cover-second.json",
    "judge-cover-r2.json",
    "judge-cover-second-r2.json",
]

for f in FILES:
    d = json.load(open(os.path.join(BASE, f)))
    print(f"=== {f} | model: {d.get('model')} | status: {d.get('status')} | second: {d.get('second', False)}")
    for r in d.get("results", []):
        name = r.get("file") or r.get("id") or "?"
        keep = {k: v for k, v in r.items() if k in ("verdict", "pass", "passed", "ok", "result", "failClasses", "faults", "rank")}
        print("   ", name, "->", json.dumps(keep)[:220])
    if "summary" in d:
        print("    summary:", json.dumps(d["summary"])[:220])
