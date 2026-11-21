Author model: opencode-go/deepseek-v4.1-flash

## Amendment after r1

Date: 2026-11-21. Scope: `spec.md` and `plan.md` only. No implementation.

- F1 closed: `spec.md` D5 now holds one table with the exact stderr line and the exit code for 12
  failure classes: usage, bad set name, missing set file, invalid JSON, each set shape error,
  earshot missing or not executable, a non-zero render, and a render that writes no file. D5 also
  fixes the check order, the stop rule, and the rule that a failed call prints no child output.
  AC2 states that the test asserts the full line for each class and accepts no prefix match.
  `plan.md` T1 cases 2 to 8 match those lines.
- F2 closed: `spec.md` AC3 now gives nine header steps with byte offsets: `OggS` at 0, version 0
  at 4, BOS `0x02` at 5, the segment count at 26, the first packet at `27 + n`, packet type `0x01`
  and `vorbis`, `vorbis_version` 0 at packet offset 7, channels 2 at 11, sample rate 48000 at 12,
  and the framing flag 1 at 29. The set requires stereo. `plan.md` T1 case 9 applies the steps
  with `readFileSync` and `readUInt32LE`.
- Offset check: the trial file `/var/tmp/earshot-trial/out/tap.ogg` gives version 0, header type
  `0x02`, segment count 1, lacing 30, packet at 28 with type `0x01` and `vorbis`, version 0,
  channels 2, rate 48000, and framing 1.
