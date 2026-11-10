#!/usr/bin/env python3
"""Record the state of the 4 folders that must not change in Phase 3.

The script walks each folder, sorts the relative paths, and makes one line per file:
`<relative path>\t<size>\t<sha256>`. It then records the file count of the folder and the
SHA-256 of the joined lines. The script writes the result to `folder-state-p3e-before.txt` by
default. Pass a path to write another result file.

The 4 folders are the v1 delivery folder, the retry1 delivery folder, the v1 hand-off folder, and
the retry1 hand-off folder. The script reads them only. It writes one file in the run folder.

  python3 measure/runs/asset_storytime_l2_retries_cover_20261110/folder-state-p3e.py
  python3 measure/runs/asset_storytime_l2_retries_cover_20261110/folder-state-p3e.py \
    measure/runs/asset_storytime_l2_retries_cover_20261110/folder-state-p3e-after.txt
"""
import hashlib
import os
import sys

REPO = "/home/daniebo/Desktop/advantage-forge"
RUN = os.path.join(REPO, "measure/runs/asset_storytime_l2_retries_cover_20261110")

FOLDERS = [
    ("out/storytime/l2/unit2/delivery-muse-v1/", os.path.join(REPO, "out/storytime/l2/unit2/delivery-muse-v1")),
    ("out/storytime/l2/unit2/delivery-muse-v1-retry1/", os.path.join(REPO, "out/storytime/l2/unit2/delivery-muse-v1-retry1")),
    ("handoff/storytime-l2u2-book-pictures/", "/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures"),
    ("handoff/storytime-l2u2-book-pictures-retry1/", "/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-retry1"),
]

DEFAULT_OUT = os.path.join(RUN, "folder-state-p3e-before.txt")


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
    out_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT
    report = ["folder state of the 4 folders that must not change in Phase 3", ""]
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
