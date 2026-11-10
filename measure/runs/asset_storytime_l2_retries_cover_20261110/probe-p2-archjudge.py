#!/usr/bin/env python3
"""Check the archived color judge verdicts for the exact m1 color files of the 4 pass rows."""
import json

ARCH = "measure/runs/asset_storytime_l2_unit2_pictures_20261108/"
TARGETS = {
    "judge-u2-w13-r1-color.json": "l2-w13-card-throw",
    "judge-u2-w14-r1-color.json": "l2-w14-card-windy",
    "judge-u2-w09-r1-color.json": "l2-w09-card-rice",
    "judge-u2-w09-r1-color-mop-t2.json": "l2-w09-story-page-tom-can-see-the-mop",
}
for f, rid in TARGETS.items():
    d = json.load(open(ARCH + f))
    hits = []
    for r in d.get("results", []):
        name = r.get("file") or r.get("image") or r.get("id") or ""
        if rid in str(name):
            hits.append((name, r.get("verdict")))
    print(f, "->", hits if hits else "NO ENTRY NAMING THE ROW; result keys: " + str(list(d['results'][0].keys())))
