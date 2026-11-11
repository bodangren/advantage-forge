#!/usr/bin/env python3
"""Acceptance probe for items 8 and 9 (FR-9, FR-11, FR-12).

Part A: the folder-state code of folder-state-look1.py, with only the output path changed to
/tmp/opencode/l2look1-p1c/. Compares the 6 folders with folder-state-look1-before.txt.

Part B: the FR-11 grep over the files of `git diff --name-only 942fb436 26cec278` and the look1
hand-off README.md. Forbidden acceptance claims, allowed: the D2 words for hat-pip and the PM
order quote.

Part C: the FR-12 check. No .png or .jpg file in the diff, and no frozen path of the spec in it.
"""
import hashlib
import os
import re
import subprocess

REPO = "/home/daniebo/Desktop/advantage-forge"
RUN = os.path.join(REPO, "measure/runs/asset_storytime_l2u2_look1_20261111")
HANDOFF = "/home/daniebo/Desktop/handoff"
SCRATCH = "/tmp/opencode/l2look1-p1c"
OUT = os.path.join(SCRATCH, "folder-state-accept.txt")

FOLDERS = [
    ("out/storytime/l2/unit2/delivery-muse-v1/", os.path.join(REPO, "out/storytime/l2/unit2/delivery-muse-v1")),
    ("out/storytime/l2/unit2/delivery-muse-v1-retry1/", os.path.join(REPO, "out/storytime/l2/unit2/delivery-muse-v1-retry1")),
    ("out/storytime/l2/unit2/delivery-muse-v1-repair1/", os.path.join(REPO, "out/storytime/l2/unit2/delivery-muse-v1-repair1")),
    ("handoff/storytime-l2u2-book-pictures/", os.path.join(HANDOFF, "storytime-l2u2-book-pictures")),
    ("handoff/storytime-l2u2-book-pictures-retry1/", os.path.join(HANDOFF, "storytime-l2u2-book-pictures-retry1")),
    ("handoff/storytime-l2u2-book-pictures-repair1/", os.path.join(HANDOFF, "storytime-l2u2-book-pictures-repair1")),
]


def sha256_of_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def state_of(folder):
    lines = []
    for root, dirs, files in os.walk(folder):
        dirs.sort()
        for name in sorted(files):
            path = os.path.join(root, name)
            relative = os.path.relpath(path, folder)
            size = os.path.getsize(path)
            lines.append(f"{relative}\t{size}\t{sha256_of_file(path)}")
    lines.sort()
    joined = "\n".join(lines)
    if joined:
        joined += "\n"
    return len(lines), hashlib.sha256(joined.encode("utf-8")).hexdigest()


def main():
    os.makedirs(SCRATCH, exist_ok=True)
    before = {}
    current = {}
    for label, folder in FOLDERS:
        if not os.path.isdir(folder):
            print(f"A MISSING {label}")
            continue
        count, state_sha = state_of(folder)
        current[label] = (count, state_sha)
        print(f"A current {label} files={count} state_sha256={state_sha}")

    before_text = open(os.path.join(RUN, "folder-state-look1-before.txt")).read()
    ok = True
    for label in current:
        match = re.search(rf"folder: {re.escape(label)}\n  path: .*\n  files: (\d+)\n  state sha256: ([0-9a-f]+)", before_text)
        if not match:
            print(f"A NO BEFORE ENTRY {label}")
            ok = False
            continue
        bcount, bsha = int(match.group(1)), match.group(2)
        ccount, csha = current[label]
        same = (bcount, bsha) == (ccount, csha)
        print(f"A compare {label}: before files={bcount} sha={bsha[:12]}.. same={same}")
        ok = ok and same
    after_text = open(os.path.join(RUN, "folder-state-look1-after.txt")).read()
    after_sha = hashlib.sha256(after_text.encode("utf-8")).hexdigest()
    before_sha = hashlib.sha256(before_text.encode("utf-8")).hexdigest()
    print(f"A before file sha256: {before_sha}")
    print(f"A after file sha256 : {after_sha} same_as_before={before_sha == after_sha}")
    print(f"A all 6 folders unchanged vs before: {ok and before_sha == after_sha}")

    print("== B FR-11 claims grep")
    names = subprocess.run(["git", "diff", "--name-only", "942fb436", "26cec278"], capture_output=True, text=True, cwd=REPO).stdout.split()
    readme = os.path.join(HANDOFF, "storytime-l2u2-book-pictures-look1", "README.md")
    files = [os.path.join(REPO, n) for n in names] + [readme]
    d2_words = "Hat-pip image passes"
    claim_pat = re.compile(r"(Daniel|the PM|Workbooks)[^.]{0,120}(accept|approv|sign(ed)? off|passed the)", re.I)
    hits = []
    for f in files:
        try:
            text = open(f).read()
        except (UnicodeDecodeError, IsADirectoryError):
            continue
        for m in claim_pat.finditer(text):
            span = text[max(0, m.start() - 80):m.end() + 80].replace("\n", " ")
            if d2_words in span or "Hat-pip image passes" in span:
                continue
            hits.append((os.path.basename(f), span))
    for f, span in hits:
        print("B HIT", f, "::", span)
    print("B claim hits outside D2:", len(hits))

    print("== C FR-12 git and frozen paths")
    pngs = [n for n in names if n.lower().endswith((".png", ".jpg", ".jpeg"))]
    print("C png/jpg in diff:", pngs)
    frozen_prefixes = [
        "docs/storytime/l2-unit1/",
        "scripts/storytime-judge-batch.mjs",
        "src/storytime/muse-delivery.ts",
        "src/storytime/muse-delivery-u2.ts",
        "assets/",
        "measure/archive/asset_storytime_l2_retries_cover_20261110/",
    ]
    frozen_hits = [n for n in names for p in frozen_prefixes if n == p or n.startswith(p)]
    other_specs = [n for n in names if n.startswith("docs/storytime/") and n.endswith(".json") and "w10/muse/l2-w10-story-page-put-on-your-t-shirt.json" not in n and "/judge/" not in n]
    print("C frozen path hits:", frozen_hits, "other spec files:", other_specs)
    old_tests = [n for n in names if n.startswith("tests/") and "storytime-u2-look1" not in n]
    print("C existing test files changed:", old_tests)


if __name__ == "__main__":
    main()
