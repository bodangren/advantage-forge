#!/usr/bin/env python3
"""Record the state of the 6 folders that must not change in the look1 track.

The script walks each folder, sorts the relative paths, and makes one line per file:
`<relative path>\t<size>\t<sha256>`. It then records the file count of the folder and the
SHA-256 of the joined lines. The script writes the result to
`folder-state-look1-before.txt` for the argument `before` and to
`folder-state-look1-after.txt` for the argument `after`. The script reads the folders only. It
writes one file in the run folder.

The 6 folders are the 3 delivery folders of the storytime level 2 unit 2 pictures and the 3
hand-off folders of the same pictures.

  python3 measure/runs/asset_storytime_l2u2_look1_20261111/folder-state-look1.py before
  python3 measure/runs/asset_storytime_l2u2_look1_20261111/folder-state-look1.py after
"""
import hashlib
import os
import sys

REPO = "/home/daniebo/Desktop/advantage-forge"
RUN = os.path.join(REPO, "measure/runs/asset_storytime_l2u2_look1_20261111")
HANDOFF = "/home/daniebo/Desktop/handoff"

FOLDERS = [
    ("out/storytime/l2/unit2/delivery-muse-v1/", os.path.join(REPO, "out/storytime/l2/unit2/delivery-muse-v1")),
    ("out/storytime/l2/unit2/delivery-muse-v1-retry1/", os.path.join(REPO, "out/storytime/l2/unit2/delivery-muse-v1-retry1")),
    ("out/storytime/l2/unit2/delivery-muse-v1-repair1/", os.path.join(REPO, "out/storytime/l2/unit2/delivery-muse-v1-repair1")),
    ("handoff/storytime-l2u2-book-pictures/", os.path.join(HANDOFF, "storytime-l2u2-book-pictures")),
    ("handoff/storytime-l2u2-book-pictures-retry1/", os.path.join(HANDOFF, "storytime-l2u2-book-pictures-retry1")),
    ("handoff/storytime-l2u2-book-pictures-repair1/", os.path.join(HANDOFF, "storytime-l2u2-book-pictures-repair1")),
]

DEFAULT_OUT = os.path.join(RUN, "folder-state-look1-before.txt")


def sha256_of_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def state_of(folder: str) -> tuple[list[str], int, str]:
    lines: list[str] = []
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
    count = len(lines)
    state_sha = hashlib.sha256(joined.encode("utf-8")).hexdigest()
    return lines, count, state_sha


def main() -> int:
    argument = sys.argv[1] if len(sys.argv) > 1 else "before"
    if argument not in ("before", "after"):
        print(f"the argument {argument} is not before or after")
        return 2
    out_path = os.path.join(RUN, f"folder-state-look1-{argument}.txt")
    report = ["folder state of the 6 folders that must not change in the look1 track", ""]
    for label, folder in FOLDERS:
        if not os.path.isdir(folder):
            report.append(f"folder: {label}")
            report.append("  state: MISSING")
            report.append("")
            continue
        lines, count, state_sha = state_of(folder)
        report.append(f"folder: {label}")
        report.append(f"  path: {folder}")
        report.append(f"  files: {count}")
        report.append(f"  state sha256: {state_sha}")
        for line in lines:
            report.append(f"  {line}")
        report.append("")
    with open(out_path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(report))
    print(f"wrote {out_path}")
    for label, folder in FOLDERS:
        if os.path.isdir(folder):
            _, count, state_sha = state_of(folder)
            print(f"{label}\tfiles={count}\tstate_sha256={state_sha}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
