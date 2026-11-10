#!/usr/bin/env python3
"""Reverse-engineer the maker combined-hash form for the v1 folders."""
import hashlib, os

REPO = "/home/daniebo/Desktop/advantage-forge"
CASES = [
    (os.path.join(REPO, "out/storytime/l2/unit2/delivery-muse-v1"), 441,
     "69025314d447dc1d6ec3920215ab6b3b0794f125bb240917a17c9ba3e498f2fc"),
    ("/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures", 469,
     "edc67a8d01477b91c0f333acf194332c2101c4d0ca7fb734050772f74c93a1ed"),
]

def sha(b):
    return hashlib.sha256(b).hexdigest()

for folder, want_n, want in CASES:
    entries = []
    for root, _d, files in os.walk(folder):
        for f in files:
            p = os.path.join(root, f)
            digest = hashlib.sha256(open(p, "rb").read()).hexdigest()
            rel = os.path.relpath(p, folder)
            entries.append((digest, rel, p))
    print(f"=== {folder}: {len(entries)} files, want {want[:16]}...")
    variants = {}
    hs = sorted(d for d, _r, _p in entries)
    variants["sorted-hashes-join-nl"] = sha("\n".join(hs).encode())
    variants["sorted-hashes-join-nl-trailing"] = sha(("\n".join(hs) + "\n").encode())
    variants["sorted-hashes-concat"] = sha("".join(hs).encode())
    # path-sorted order, hashes in that order
    by_path = sorted(entries, key=lambda e: e[1])
    in_path_order = [d for d, _r, _p in by_path]
    variants["path-order-hashes-join-nl"] = sha("\n".join(in_path_order).encode())
    variants["path-order-hashes-join-nl-trailing"] = sha(("\n".join(in_path_order) + "\n").encode())
    # sha256sum-style lines
    lines_rel = sorted(f"{d}  {r}" for d, r, _p in entries)
    variants["sorted-lines-rel-2sp-nl"] = sha(("\n".join(lines_rel) + "\n").encode())
    lines_rel_noend = sorted(f"{d}  {r}" for d, r, _p in entries)
    variants["sorted-lines-rel-2sp"] = sha("\n".join(lines_rel_noend).encode())
    lines_abs = sorted(f"{d}  {p}" for d, _r, p in entries)
    variants["sorted-lines-abs-2sp-nl"] = sha(("\n".join(lines_abs) + "\n").encode())
    lines_tab = sorted(f"{d}\t{r}" for d, r, _p in entries)
    variants["sorted-lines-rel-tab-nl"] = sha(("\n".join(lines_tab) + "\n").encode())
    # path-sorted lines (find | sort | xargs sha256sum | sha256sum form)
    lines_path_order = [f"{d}  {r}" for d, r, _p in by_path]
    variants["path-order-lines-rel-2sp-nl"] = sha(("\n".join(lines_path_order) + "\n").encode())
    lines_path_order_abs = [f"{d}  {p}" for d, _r, p in by_path]
    variants["path-order-lines-abs-2sp-nl"] = sha(("\n".join(lines_path_order_abs) + "\n").encode())
    # JSON array of sorted hashes
    import json as _json
    variants["json-sorted-hashes"] = sha(_json.dumps(hs).encode())
    variants["json-sorted-hashes-spaced"] = sha(_json.dumps(hs, indent=0).encode())
    for name, h in variants.items():
        mark = "  <<< MATCH" if h == want else ""
        print(f"  {name:42s} {h[:16]}{mark}")
