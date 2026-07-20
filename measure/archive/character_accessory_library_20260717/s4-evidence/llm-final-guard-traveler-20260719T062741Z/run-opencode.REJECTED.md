# Rejected Historical Runner

The executable `run-opencode.mjs` from this failed evidence attempt was removed
after independent security review. It inherited the host environment, used
predictable temporary paths, and lacked bounded process-tree termination. It is
preserved in Git history at commit `60ffa5e`, with original SHA-256
`f19d8daf98bfa5fac39d04b386d584608ce249ef89b926cfd95d5e917b398ae6`.

Do not reconstruct or execute it. Any future external-client reassessment must
use a separate approved Measure track, fresh Red tests, owner-only temporary
directories, minimal credential forwarding, symlink-safe paths, and bounded
process-tree termination.
