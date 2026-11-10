#!/usr/bin/env python3
"""Reverse-engineer the maker combined-hash form for the v1 folders, wide variant set."""
import hashlib, os

REPO = "/home/daniebo/Desktop/advantage-forge"
CASES = [
    (os.path.join(REPO, "out/storytime/l2/unit2/delivery-muse-v1"), "delivery-muse-v1", 441,
     "69025314d447dc1d6ec3920215ab6b3b0794f125bb240917a17c9ba3e498f2fc"),
    ("/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures", "storytime-l2u2-book-pictures", 469,
     "edc67a8d01477b91c0f333acf194332c2101c4d0ca7fb734050772f74c93a1ed"),
]

def sha(b):
    return hashlib.sha256(b).hexdigest()

for folder, name, want_n, want in CASES:
    entries = []
    for root, _d, files in os.walk(folder):
        for f in files:
            p = os.path.join(root, f)
            digest = hashlib.sha256(open(p, "rb").read()).hexdigest()
            rel = os.path.relpath(p, folder)
            entries.append((digest, rel, p))
    print(f"=== {name}: {len(entries)} files, want {want[:16]}...")
    variants = {}
    hs = sorted(d for d, _r, _p in entries)
    by_path = sorted(entries, key=lambda e: e[1])
    in_path_order = [d for d, _r, _p in by_path]
    forms = {
        "bare-hashes": lambda e: e[0],
        "hash-rel": lambda e: f"{e[0]}  {e[1]}",
        "hash-dot-rel": lambda e: f"{e[0]}  ./{e[1]}",
        "hash-name-rel": lambda e: f"{e[0]}  {name}/{e[1]}",
        "hash-abs": lambda e: f"{e[0]}  {e[2]}",
        "hash-repo-rel": lambda e: f"{e[0]}  {os.path.relpath(e[2], REPO)}",
        "hash-sp-rel": lambda e: f"{e[0]} {e[1]}",
    }
    orders = {
        "hashsort": lambda es: sorted(es, key=lambda e: e[0]),
        "pathsort": lambda es: sorted(es, key=lambda e: e[1]),
    }
    for oname, ofn in orders.items():
        for fname, ffn in forms.items():
            lines = [ffn(e) for e in ofn(entries)]
            variants[f"{oname}-{fname}-nl"] = sha(("\n".join(lines) + "\n").encode())
            variants[f"{oname}-{fname}"] = sha("\n".join(lines).encode())
    found = False
    for vn, h in variants.items():
        if h == want:
            print(f"  MATCH: {vn}")
            found = True
    if not found:
        print("  no match in", len(variants), "variants")
        # show closest few for eyeballing
        for vn in list(variants)[:4]:
            print(f"    e.g. {vn}: {variants[vn][:16]}")
