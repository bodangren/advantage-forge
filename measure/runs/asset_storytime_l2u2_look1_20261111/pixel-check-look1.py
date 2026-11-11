#!/usr/bin/env python3
"""The pixel check of FR-7 for the look1 delivery (Phase 1, Task 4, part 1).

The script checks 4 things.

1. For each of the 2 approved rows, the delivered color file and the delivered line file of
   `out/storytime/l2/unit2/delivery-muse-v1-look1/` have the same SHA-256 as the Muse print of the
   approval list.
2. The manifest of the look1 delivery holds 2 jobs, the hat-pip row and the T-shirt row. Every
   candidate version and every `selectedVersion` is 1. No candidate holds a `lineWidthException`.
3. The delivered names are the `-v1` names of the picture list.
4. The report records the delivered SHA-256 values of the T-shirt files next to the old v1 values.

The script writes its report to `pixel-check-look1.txt` and prints the same report. It exits 1
when a check fails.

  python3 measure/runs/asset_storytime_l2u2_look1_20261111/pixel-check-look1.py
"""
import hashlib
import json
import os
import sys

REPO = "/home/daniebo/Desktop/advantage-forge"
RUN = os.path.join(REPO, "measure/runs/asset_storytime_l2u2_look1_20261111")
MUSE_ROOT = os.path.join(REPO, "out/storytime/l2/unit2")
LOOK1 = os.path.join(MUSE_ROOT, "delivery-muse-v1-look1")
APPROVALS = os.path.join(RUN, "approvals-look1.json")
LIST_FILE = "/home/daniebo/Desktop/Workbooks/content/storytime/drafts/l2/print/pictures-u2.json"

# The 2 rows of the look1 approval list, with their week folder.
APPROVED_ROWS = [
    ("l2-w10-story-page-put-on-your-hat-pip", "w10"),
    ("l2-w10-story-page-put-on-your-t-shirt", "w10"),
]

# The old SHA-256 values of the v1 T-shirt files of the hand-off folder.
OLD_TSHIRT = {
    "color": "9e207c3c72db52d323fd8ef64c9565588f853460ec7abcfa0fda5a053bd925e4",
    "line": "71e2ba056c09ad66a1beecb565941616becfdecf4fccd107e86bbbe0b9e1ca7e",
}

OUT = os.path.join(RUN, "pixel-check-look1.txt")


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

    approvals = json.load(open(APPROVALS, encoding="utf-8"))
    entries = {entry["rowId"]: entry for entry in approvals["entries"]}
    picture_list = json.load(open(LIST_FILE, encoding="utf-8"))
    list_rows = picture_list if isinstance(picture_list, list) else picture_list.get("rows", picture_list)
    list_by_id = {row["id"]: row for row in list_rows}

    say("pixel check of FR-7, the look1 delivery")
    say("")

    # Check 1: each delivered file has the SHA-256 of its Muse print.
    say("check 1, the 4 delivered files against their Muse prints")
    delivered_shas: dict[str, str] = {}
    for row_id, week in APPROVED_ROWS:
        entry = entries.get(row_id)
        if not entry:
            failures.append(f"{row_id}: the approval list has no entry")
            say(f"  {row_id}: NO APPROVAL ENTRY")
            continue
        muse = os.path.join(MUSE_ROOT, week, "muse")
        pairs = [
            (row_id + "-v1.png", os.path.join(muse, entry["colorPrint"]), entry["colorPrint"]),
            (row_id + "-line-v1.png", os.path.join(muse, entry["linePrint"]), entry["linePrint"]),
        ]
        for delivered_name, source, source_label in pairs:
            delivered = os.path.join(LOOK1, delivered_name)
            if not os.path.exists(delivered) or not os.path.exists(source):
                failures.append(f"{delivered_name}: a file is missing")
                say(f"  {delivered_name}: MISSING")
                continue
            delivered_sha = sha256_of_file(delivered)
            source_sha = sha256_of_file(source)
            same = delivered_sha == source_sha
            if not same:
                failures.append(f"{delivered_name}: the delivered sha differs from the print sha")
            delivered_shas[delivered_name] = delivered_sha
            say(f"  {delivered_name}: print={source_label} same={same} sha256={delivered_sha}")
    say("")

    # Check 2: the manifest.
    say("check 2, the manifest of the look1 delivery")
    manifest_path = os.path.join(LOOK1, "manifest.json")
    manifest = json.load(open(manifest_path, encoding="utf-8"))
    jobs = manifest["jobs"]
    say(f"  jobs: {len(jobs)}")
    if len(jobs) != 2:
        failures.append(f"the manifest holds {len(jobs)} jobs, not 2")
    approved_ids = {row[0] for row in APPROVED_ROWS}
    for job in jobs:
        job_id = job["id"]
        candidates = job.get("candidates", [])
        versions = [candidate.get("version") for candidate in candidates]
        if any(version != 1 for version in versions):
            failures.append(f"{job_id}: a candidate version is not 1")
        if job.get("selectedVersion") != 1:
            failures.append(f"{job_id}: the selectedVersion is not 1")
        has_exception = any("lineWidthException" in candidate for candidate in candidates)
        if has_exception:
            failures.append(f"{job_id}: a candidate holds a lineWidthException")
        if job_id not in approved_ids:
            failures.append(f"{job_id}: the manifest holds a row that is not in the approval list")
        say(
            f"  {job_id}: versions={versions} selectedVersion={job.get('selectedVersion')} "
            f"lineWidthException={has_exception}"
        )
    manifest_ids = {job["id"] for job in jobs}
    for row_id in sorted(approved_ids):
        if row_id not in manifest_ids:
            failures.append(f"{row_id}: the manifest has no job")
    say(f"  hat-pip job present: {'l2-w10-story-page-put-on-your-hat-pip' in manifest_ids}")
    say(f"  t-shirt job present: {'l2-w10-story-page-put-on-your-t-shirt' in manifest_ids}")
    say("")

    # Check 3: the delivered names are the -v1 names of the picture list.
    say("check 3, the delivered names against the picture list")
    delivered_names = sorted(name for name in os.listdir(LOOK1) if name.endswith(".png"))
    for row_id, week in APPROVED_ROWS:
        row = list_by_id.get(row_id)
        if not row:
            failures.append(f"{row_id}: the picture list has no row")
            continue
        for want in (row["fileName"], row["lineArtFileName"]):
            present = want in delivered_names
            if not present:
                failures.append(f"{want}: the delivery has no such file")
            say(f"  {want}: present={present}")
    say(f"  delivered PNG files: {len(delivered_names)}")
    say("")

    # Check 4: the T-shirt values next to the old v1 values.
    say("check 4, the T-shirt SHA-256 values, the new and the old")
    new_color = delivered_shas.get("l2-w10-story-page-put-on-your-t-shirt-v1.png", "MISSING")
    new_line = delivered_shas.get("l2-w10-story-page-put-on-your-t-shirt-line-v1.png", "MISSING")
    if new_color == "MISSING" or new_line == "MISSING":
        failures.append("the delivered T-shirt file is missing")
    say(f"  color: old={OLD_TSHIRT['color']}")
    say(f"  color: new={new_color}")
    say(f"  color: changed={new_color != OLD_TSHIRT['color']}")
    say(f"  line: old={OLD_TSHIRT['line']}")
    say(f"  line: new={new_line}")
    say(f"  line: changed={new_line != OLD_TSHIRT['line']}")
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
