#!/usr/bin/env python3
"""The pixel check of FR-18 for the repair1 delivery (Phase 3, Task 12).

The script checks 3 things.

1. For each of the 9 repaired rows, the delivered color file and the delivered line file of
   `out/storytime/l2/unit2/delivery-muse-v1-repair1/` have the same SHA-256 as the file of the same
   name in `out/storytime/l2/unit2/delivery-muse-v1/`.
2. For each of the 4 card rows, the delivered color file has the SHA-256 of its m1 color print, and
   the delivered line file has the SHA-256 of its best line print.
3. The manifest of the repair1 delivery holds 13 jobs. Every candidate version and every
   `selectedVersion` is 1. The 4 card candidates hold a `lineWidthException` with a `waivedError`.
   The 9 repaired rows hold no `lineWidthException`. No job is the hat-pip row.

The script writes its report to `pixel-check-p3e.txt` and prints the same report. It exits 1 when
a check fails.

  python3 measure/runs/asset_storytime_l2_retries_cover_20261110/pixel-check-p3e.py
"""
import hashlib
import json
import os
import sys

REPO = "/home/daniebo/Desktop/advantage-forge"
RUN = os.path.join(REPO, "measure/runs/asset_storytime_l2_retries_cover_20261110")
MUSE_ROOT = os.path.join(REPO, "out/storytime/l2/unit2")
V1 = os.path.join(MUSE_ROOT, "delivery-muse-v1")
REPAIR1 = os.path.join(MUSE_ROOT, "delivery-muse-v1-repair1")

# The 9 rows of D17. The order is the order of the PM order.
REPAIRED_ROWS = [
    "l2-w10-check-row-ten",
    "l2-w11-story-page-here",
    "l2-w11-story-page-ten-men-in-the-den",
    "l2-w11-story-page-the-den-is-on-dad",
    "l2-w12-story-page-open-your-book-nan",
    "l2-w13-cover-look-at-me",
    "l2-w13-check-row-dot",
    "l2-w13-d4-prompt-jump",
    "l2-w15-cover-look-a-bus",
]

# The 4 card rows, with their week folder and their 2 source prints.
CARD_ROWS = [
    ("l2-w12-card-hippo", "w12", "l2-w12-card-hippo-m1-color-print.png", "l2-w12-card-hippo-m1-line-print-4.png"),
    ("l2-w12-card-ruler", "w12", "l2-w12-card-ruler-m1-color-print.png", "l2-w12-card-ruler-m1-line-print-4.png"),
    ("l2-w13-card-clap", "w13", "l2-w13-card-clap-m1-color-print.png", "l2-w13-card-clap-m1-line-print-3.png"),
    ("l2-w14-card-cold", "w14", "l2-w14-card-cold-m1-color-print.png", "l2-w14-card-cold-m1-line-print-4.png"),
]

HAT_PIP_ROW = "l2-w10-story-page-put-on-your-hat-pip"

OUT = os.path.join(RUN, "pixel-check-p3e.txt")


def sha256_of_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    report: list[str] = []
    failures: list[str] = []

    def say(text: str) -> None:
        report.append(text)

    say("pixel check of FR-18, the repair1 delivery")
    say("")

    # Check 1: the 9 repaired rows match the v1 delivery file of the same name.
    say("check 1, the 9 repaired rows against the v1 delivery folder")
    for row_id in REPAIRED_ROWS:
        for suffix in ("-v1.png", "-line-v1.png"):
            name = row_id + suffix
            delivered = os.path.join(REPAIR1, name)
            v1_file = os.path.join(V1, name)
            if not os.path.exists(delivered) or not os.path.exists(v1_file):
                failures.append(f"{name}: a file is missing")
                say(f"  {name}: MISSING")
                continue
            delivered_sha = sha256_of_file(delivered)
            v1_sha = sha256_of_file(v1_file)
            same = delivered_sha == v1_sha
            if not same:
                failures.append(f"{name}: the delivered sha differs from the v1 sha")
            say(f"  {name}: same={same} sha256={delivered_sha}")
    say("")

    # Check 2: the 4 card rows match their source prints.
    say("check 2, the 4 card rows against their source prints")
    for row_id, week, color_name, line_name in CARD_ROWS:
        muse = os.path.join(MUSE_ROOT, week, "muse")
        pairs = [
            (row_id + "-v1.png", os.path.join(muse, color_name), color_name),
            (row_id + "-line-v1.png", os.path.join(muse, line_name), line_name),
        ]
        for delivered_name, source, source_label in pairs:
            delivered = os.path.join(REPAIR1, delivered_name)
            if not os.path.exists(delivered) or not os.path.exists(source):
                failures.append(f"{delivered_name}: a file is missing")
                say(f"  {delivered_name}: MISSING")
                continue
            delivered_sha = sha256_of_file(delivered)
            source_sha = sha256_of_file(source)
            same = delivered_sha == source_sha
            if not same:
                failures.append(f"{delivered_name}: the delivered sha differs from the source sha")
            say(f"  {delivered_name}: source={source_label} same={same} sha256={delivered_sha}")
    say("")

    # Check 3: the manifest.
    say("check 3, the manifest of the repair1 delivery")
    manifest_path = os.path.join(REPAIR1, "manifest.json")
    manifest = json.load(open(manifest_path, encoding="utf-8"))
    jobs = manifest["jobs"]
    say(f"  jobs: {len(jobs)}")
    if len(jobs) != 13:
        failures.append(f"the manifest holds {len(jobs)} jobs, not 13")
    card_ids = {row[0] for row in CARD_ROWS}
    repaired_ids = set(REPAIRED_ROWS)
    for job in jobs:
        job_id = job["id"]
        candidates = job.get("candidates", [])
        versions = [candidate.get("version") for candidate in candidates]
        if any(version != 1 for version in versions):
            failures.append(f"{job_id}: a candidate version is not 1")
        if job.get("selectedVersion") != 1:
            failures.append(f"{job_id}: the selectedVersion is not 1")
        has_exception = any("lineWidthException" in candidate for candidate in candidates)
        if job_id in card_ids:
            for candidate in candidates:
                exception = candidate.get("lineWidthException")
                if not exception:
                    failures.append(f"{job_id}: the candidate has no lineWidthException")
                    continue
                if not exception.get("waivedError"):
                    failures.append(f"{job_id}: the lineWidthException has no waivedError")
            say(f"  {job_id}: versions={versions} selectedVersion={job.get('selectedVersion')} lineWidthException=True")
        elif job_id in repaired_ids:
            if has_exception:
                failures.append(f"{job_id}: the candidate has a lineWidthException")
            say(f"  {job_id}: versions={versions} selectedVersion={job.get('selectedVersion')} lineWidthException=False")
        else:
            failures.append(f"{job_id}: the manifest holds a row that is not in the approval list")
            say(f"  {job_id}: UNEXPECTED ROW")
        if job_id == HAT_PIP_ROW:
            failures.append(f"{job_id}: the manifest holds the hat-pip row")
    say(f"  hat-pip job present: {any(job['id'] == HAT_PIP_ROW for job in jobs)}")
    say("")

    say(f"failures: {len(failures)}")
    for failure in failures:
        say(f"  {failure}")
    say("result: " + ("pass" if not failures else "fail"))

    text = "\n".join(report) + "\n"
    with open(OUT, "w", encoding="utf-8") as handle:
        handle.write(text)
    print(text, end="")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
