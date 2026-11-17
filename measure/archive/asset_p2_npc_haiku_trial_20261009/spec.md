# P2 NPC Haiku trial (baker)

## Purpose

Test a new method for the P2 NPCs: six Haiku 5.5 agents build one asset in parallel, an independent
reviewer picks the best, and the orchestrator improves it. Compare time, tokens, and quality with one
Sonnet high agent on the same brief.

## Acceptance criteria

- One brief (bench/haiku/brief-baker.md) and one mockup (docs/npc-mockups/baker_001.jpg) serve all arms.
- Each arm writes only assets/baker-<arm>.ts and out/baker-<arm>/.
- An independent reviewer ranks the arms. The orchestrator never rates its own work.
- The result records wall-clock time, tokens, and cost for each arm in bench/haiku/results.md.
- The accepted baker is assets/baker.ts at the NPC bar (7.0).
