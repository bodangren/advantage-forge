#!/usr/bin/env python3
"""Acceptance probe: v1 combined hashes (check 6), FR-12 grep, FR-13 image check (check 7),
FR-14 frozen paths from the changed list, and scratch folders (check 9)."""
import hashlib, os, subprocess

REPO = "/home/daniebo/Desktop/advantage-forge"

def combined_hash(folder):
    """SHA-256 of the sorted list of the SHA-256 of every file (maker-p2g.log form)."""
    hashes = []
    for root, _dirs, files in os.walk(folder):
        for f in files:
            p = os.path.join(root, f)
            with open(p, "rb") as fh:
                hashes.append(hashlib.sha256(fh.read()).hexdigest())
    joined = "\n".join(sorted(hashes))
    return len(hashes), hashlib.sha256(joined.encode()).hexdigest()

print("=== check 6: v1 folders unchanged ===")
for folder, want_count, want_hash in [
    (os.path.join(REPO, "out/storytime/l2/unit2/delivery-muse-v1"), 441,
     "69025314d447dc1d6ec3920215ab6b3b0794f125bb240917a17c9ba3e498f2fc"),
    ("/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures", 469,
     "edc67a8d01477b91c0f333acf194332c2101c4d0ca7fb734050772f74c93a1ed"),
]:
    n, h = combined_hash(folder)
    status = "OK" if (n == want_count and h == want_hash) else "MISMATCH"
    print(f"{status}: {folder} files={n} hash={h}")
    if h != want_hash:
        # try alternate form: hash of sorted "hash  path" lines relative
        lines = []
        for root, _d, files in os.walk(folder):
            for f in files:
                p = os.path.join(root, f)
                rel = os.path.relpath(p, folder)
                digest = hashlib.sha256(open(p, "rb").read()).hexdigest()
                lines.append(f"{digest}  {rel}")
        alt = hashlib.sha256("\n".join(sorted(lines)).encode()).hexdigest()
        print(f"  alternate (hash+path) form: {alt}")

print()
print("=== check 7: FR-13 no PNG/JPG in git in range ===")
out = subprocess.run(
    ["git", "diff", "--name-only", "6ec8ef66ed814e5b4c29c7bbfdaebf5961ed4e35",
     "10af09151548070983d415d3b7c9afc22dd38f5d"],
    capture_output=True, text=True, cwd=REPO, check=True).stdout.split()
imgs = [f for f in out if f.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".webp"))]
print("image files in range:", imgs if imgs else "NONE")

print()
print("=== check 7: FR-12 acceptance-claim grep ===")
# Grep the changed text files and the two hand-off folders for acceptance claims.
claim_pat = r"(Daniel|the PM|Workbooks)[^\n]{0,80}(accepted|approved|sign(ed|off)? off|gave approval)"
paths = [os.path.join(REPO, f) for f in out if f.startswith("measure/") or f.startswith("docs/") or f.startswith("tests/") or f.startswith("scripts/")]
paths += [
    "/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-retry1",
    "/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge",
]
hits = subprocess.run(["grep", "-rInE", claim_pat] + paths,
                      capture_output=True, text=True)
print("claim hits (should be empty):")
print(hits.stdout if hits.stdout else "  NONE")

# Also grep for the phrase 'accepted' near picture/art in track files, broader.
hits2 = subprocess.run(
    ["grep", "-rInE", r"\baccepted\b", 
     os.path.join(REPO, "measure/tracks/asset_storytime_l2_retries_cover_20261110"),
     os.path.join(REPO, "measure/runs/asset_storytime_l2_retries_cover_20261110"),
     "/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-retry1",
     "/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge"],
    capture_output=True, text=True)
print("any 'accepted' lines (review context):")
print(hits2.stdout if hits2.stdout else "  NONE")

print()
print("=== check 7: FR-14 frozen paths ===")
frozen_prefixes = [
    "docs/storytime/l2-unit1/", "assets/", "src/storytime/muse-delivery.ts",
]
frozen_eq = ["src/storytime/muse-delivery.ts"]
viol = [f for f in out if any(f == p or f.startswith(p) for p in frozen_prefixes)]
print("frozen path hits in changed list:", viol if viol else "NONE")
# muse-delivery.ts behavior unchanged?
diff_md = subprocess.run(
    ["git", "diff", "6ec8ef66ed814e5b4c29c7bbfdaebf5961ed4e35",
     "10af09151548070983d415d3b7c9afc22dd38f5d", "--", "src/storytime/muse-delivery.ts"],
    capture_output=True, text=True, cwd=REPO)
print("muse-delivery.ts diff bytes:", len(diff_md.stdout))

print()
print("=== check 9: scratch folders ===")
for p in ["/tmp/opencode/l2rc", "/tmp/judge-u2rc", "/tmp/opencode/l2rc-sumtest"]:
    print(f"{p}: {'EXISTS (BAD)' if os.path.exists(p) else 'gone (OK)'}")
