#!/usr/bin/env python3
"""More combined-hash variants: Python repr forms and joiners."""
import hashlib, json, os

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
    hs = sorted(d for d, _r, _p in entries)
    lines_rel = sorted(f"{d}  {r}" for d, r, _p in entries)
    variants = {
        "repr-hashes": sha(str(hs).encode()),
        "json-hashes": sha(json.dumps(hs).encode()),
        "repr-lines": sha(str(lines_rel).encode()),
        "json-lines": sha(json.dumps(lines_rel).encode()),
        "join-comma-space": sha(", ".join(hs).encode()),
        "join-comma": sha(",".join(hs).encode()),
        "join-empty": sha("".join(hs).encode()),
        "lines-nl-nofinal": sha("\n".join(lines_rel).encode()),
        "lines-crnl": sha(("\r\n".join(lines_rel) + "\r\n").encode()),
    }
    found = [vn for vn, h in variants.items() if h == want]
    print(folder.split("/")[-1], "->", found if found else "no match")
    if not found:
        # newest mtime as change evidence
        newest = max(os.path.getmtime(os.path.join(r, f)) for r, _d, fs in os.walk(folder) for f in fs)
        import datetime
        print("   newest file mtime (UTC):", datetime.datetime.utcfromtimestamp(newest).isoformat(), "Z")
