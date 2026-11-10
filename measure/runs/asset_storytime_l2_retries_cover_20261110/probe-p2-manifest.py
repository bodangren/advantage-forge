#!/usr/bin/env python3
"""Verify archived color judge passes, retry1 manifest ids, and approvals list."""
import json

ARCH = "measure/runs/asset_storytime_l2_unit2_pictures_20261108/"
for f in ["judge-u2-w13-r1-color.json", "judge-u2-w14-r1-color.json",
          "judge-u2-w09-r1-color.json", "judge-u2-w09-r1-color-mop-t2.json"]:
    d = json.load(open(ARCH + f))
    print(f, "->", [(r.get("file", "?"), r.get("verdict")) for r in d.get("results", [])])

m = json.load(open("out/storytime/l2/unit2/delivery-muse-v1-retry1/manifest.json"))
print("retry1 ids:", [j["id"] for j in m["jobs"]])
print("retry1 file count:", len(m["jobs"]))

a = json.load(open("measure/runs/asset_storytime_l2_retries_cover_20261110/approvals-retry1.json"))
print("approvals:", json.dumps(a)[:500])
