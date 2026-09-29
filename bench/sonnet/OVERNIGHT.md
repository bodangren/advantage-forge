# Overnight batch 1 (2026-09-29) — orchestrator notes

Goal: /goal statement in the session. State: state.tsv (one row per asset). Log: log.tsv (one row per pass).
Briefs: briefs/<asset>.md. Rules: bar 7 (7.5 for P0 / game-pack rows, 8 for characters); retry 1 = feedback
to the same agent after its completion notice ("Resuming agent" reply required); retry 2 = fresh agent one tier
up; then skip. Max 4 agents. Commit accepted sources with explicit paths. Stop: queue + enemies empty, 6 skips
in a row, or 4,000,000 subagent tokens.

Round 1: cloth-robe (low), mantle (low), greenhouse (medium), yurt (medium). Started 2026-09-29.
Tokens so far (batch 1 incl. probe): 325,020.

Round 1 status: cloth-robe pass 3 (same agent), yurt pass 2 (same agent), greenhouse pass 2 (same agent), mantle fresh medium agent. Low tier: both armor pieces failed at v1 (6.5); use medium for the remaining armor.
Tokens: probe 325,020 + round 1 so far 35568+8516+41196+43356+56088 = 509,744.
