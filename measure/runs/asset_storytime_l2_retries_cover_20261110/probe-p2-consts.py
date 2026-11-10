#!/usr/bin/env python3
"""Acceptance probe: compare guard constant blocks between baseline 6ec8ef66 and HEAD."""
import re, subprocess

BASE = "6ec8ef66ed814e5b4c29c7bbfdaebf5961ed4e35"
HEAD = "10af09151548070983d415d3b7c9afc22dd38f5d"
FILE = "scripts/storytime-muse-guards.mjs"
CONSTS = ["CARD_RUN", "CARD_LINE_RETRY", "U2_RUN", "U2_FW_RUN", "COVER_RUN", "U2_EXTRA_TRY"]

def block(text, name):
    m = re.search(rf"export const {name} = \{{.*?\n\}};", text, re.S)
    return m.group(0) if m else None

base_src = subprocess.run(["git", "show", f"{BASE}:{FILE}"], capture_output=True, text=True, check=True).stdout
head_src = subprocess.run(["git", "show", f"{HEAD}:{FILE}"], capture_output=True, text=True, check=True).stdout

for c in CONSTS:
    b, h = block(base_src, c), block(head_src, c)
    if b == h:
        print(f"IDENTICAL: {c}")
    else:
        print(f"CHANGED: {c}")
        if c == "U2_EXTRA_TRY":
            import difflib
            for line in difflib.unified_diff(b.splitlines(), h.splitlines(), lineterm="", n=0):
                if line.startswith(("+", "-")) and not line.startswith(("+++", "---")):
                    print("   ", line[:170])
