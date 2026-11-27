# Spend log: Primary Advantage covers, levels 5 to 9

Date: 2026-11-27. From: Advantage Forge (session ses_e91f29337ffeQ3heyz490CeBFO).
For: Workbooks, track `book_covers_20261007`, Phase 4. The request folder is
`~/Desktop/handoff/levels-5-9-cover-art-request-2026-11-27/`.

## Money

- Model: Muse (`meta/muse-image` at OpenRouter). Aspect ratio 3:2. Size 1920 x 1280 px.
- Hard stop: 0.40 USD for the whole run. Daniel said "Go" on 2026-11-27
  (Google Tasks item TEpCMklwY2YxSXZvV3gtSA, relayed by the PM).
- Total spend: **0.35 USD**. Money left under the stop: 0.05 USD.
- Calls: 36. Paid calls: 35. Failed calls: 1. The failed call cost 0 USD.
- The cost of one call: 0.01 USD.
- The tool `scripts/primary-covers-muse.mjs` holds the cap and stops before a call that would pass it.
- The tool writes every row to `out/primary-covers/levels-5-9/costs.tsv`. It holds the same 36 rows.

## What each picture needed

Ten of the 11 pictures failed check 3 at the first attempt. A hero part crossed the middle of the
width. The sword blade caused most of the failures.

A second attempt with the same prompt fixed 5 of those 10 pictures. The rest needed a fix clause
appended to the prompt. The clause named the middle of the width and told the model to keep the
heroes, the sword, the staff, the cape and the fox in the right part of the picture. The cost file
records the clause in the last column: `requests.json` for the plain prompt, `fix clause` for the
redos with the clause.

Quest 6.2 took three attempts. Its third attempt moved the guardian creature to the right side with
the heroes, but it put the sword over the middle line. The second attempt stands. Its guardian
creature stands in the left part of the picture, far from the middle line. The check table of this
folder names that point.

## The result files

The 11 files in `results/` are the accepted attempts. Each one is copied under the output file
name of `requests.json`. The attempt that each file comes from is in the last column of the table
below.

## Every call

| Time (UTC)               | Picture       | Attempt | Cost (USD) | Size      | Result file                                 | Result                           | Prompt        | Accepted |
| ------------------------ | ------------- | ------- | ---------- | --------- | ------------------------------------------- | -------------------------------- | ------------- | -------- |
| 2026-11-27T13:13:29.036Z | quest-5       | 1       | 0.01       | 1920x1280 | cover-wide-quest-5-1920x1280.png            | ok                               | requests.json | no       |
| 2026-11-27T13:17:27.711Z | quest-6.1     | 1       | 0.01       | 1920x1280 | cover-wide-quest-6.1-1920x1280.png          | ok                               | requests.json | no       |
| 2026-11-27T13:18:08.171Z | quest-6.2     | 1       | 0.01       | 1920x1280 | cover-wide-quest-6.2-1920x1280.png          | ok                               | requests.json | no       |
| 2026-11-27T13:18:45.763Z | adventure-7.1 | 1       | 0.01       | 1920x1280 | cover-wide-adventure-7.1-1920x1280.png      | ok                               | requests.json | no       |
| 2026-11-27T13:19:39.722Z | adventure-7.2 | 1       | 0.01       | 1920x1280 | cover-wide-adventure-7.2-1920x1280.png      | ok                               | requests.json | no       |
| 2026-11-27T13:20:12.346Z | adventure-8.1 | 1       | 0.01       | 1920x1280 | cover-wide-adventure-8.1-1920x1280.png      | ok                               | requests.json | no       |
| 2026-11-27T13:20:51.416Z | adventure-8.2 | 1       | 0.01       | 1920x1280 | cover-wide-adventure-8.2-1920x1280.png      | ok                               | requests.json | no       |
| 2026-11-27T13:21:27.650Z | adventure-8.3 | 1       | 0.01       | 1920x1280 | cover-wide-adventure-8.3-1920x1280.png      | ok                               | requests.json | yes      |
| 2026-11-27T13:22:05.796Z | adventure-9.1 | 1       | 0.01       | 1920x1280 | cover-wide-adventure-9.1-1920x1280.png      | ok                               | requests.json | no       |
| 2026-11-27T13:22:43.833Z | adventure-9.2 | 1       | 0.01       | 1920x1280 | cover-wide-adventure-9.2-1920x1280.png      | ok                               | requests.json | no       |
| 2026-11-27T13:23:24.919Z | adventure-9.3 | 1       | 0.01       | 1920x1280 | cover-wide-adventure-9.3-1920x1280.png      | ok                               | requests.json | no       |
| 2026-11-27T13:34:11.417Z | quest-5       | 2       | 0.01       | 1920x1280 | cover-wide-quest-5-1920x1280-try2.png       | ok                               | requests.json | yes      |
| 2026-11-27T13:34:52.806Z | quest-6.1     | 2       | 0.01       | 1920x1280 | cover-wide-quest-6.1-1920x1280-try2.png     | ok                               | requests.json | no       |
| 2026-11-27T13:35:30.916Z | quest-6.2     | 2       | 0.01       | 1920x1280 | cover-wide-quest-6.2-1920x1280-try2.png     | ok                               | requests.json | yes      |
| 2026-11-27T13:35:55.288Z | adventure-7.1 | 2       | 0.01       | 1920x1280 | cover-wide-adventure-7.1-1920x1280-try2.png | ok                               | requests.json | no       |
| 2026-11-27T13:36:42.990Z | adventure-7.2 | 2       | 0.01       | 1920x1280 | cover-wide-adventure-7.2-1920x1280-try2.png | ok                               | requests.json | no       |
| 2026-11-27T13:37:22.378Z | adventure-8.1 | 2       | 0.01       | 1920x1280 | cover-wide-adventure-8.1-1920x1280-try2.png | ok                               | requests.json | no       |
| 2026-11-27T13:37:50.970Z | adventure-8.2 | 2       | 0.01       | 1920x1280 | cover-wide-adventure-8.2-1920x1280-try2.png | ok                               | requests.json | yes      |
| 2026-11-27T13:38:24.775Z | adventure-9.1 | 2       | 0.01       | 1920x1280 | cover-wide-adventure-9.1-1920x1280-try2.png | ok                               | requests.json | yes      |
| 2026-11-27T13:38:57.990Z | adventure-9.2 | 2       | 0.01       | 1920x1280 | cover-wide-adventure-9.2-1920x1280-try2.png | ok                               | requests.json | yes      |
| 2026-11-27T13:39:31.305Z | adventure-9.3 | 2       | 0.01       | 1920x1280 | cover-wide-adventure-9.3-1920x1280-try2.png | ok                               | requests.json | no       |
| 2026-11-27T13:52:45.151Z | quest-6.1     | 3       | 0.01       | 1920x1280 | cover-wide-quest-6.1-1920x1280-try3.png     | ok                               | requests.json | no       |
| 2026-11-27T13:53:09.484Z | adventure-7.1 | 3       | 0.01       | 1920x1280 | cover-wide-adventure-7.1-1920x1280-try3.png | ok                               | requests.json | no       |
| 2026-11-27T13:53:32.657Z | adventure-7.2 | 3       | 0.01       | 1920x1280 | cover-wide-adventure-7.2-1920x1280-try3.png | ok                               | requests.json | no       |
| 2026-11-27T13:54:12.498Z | adventure-8.1 | 3       | 0.01       | 1920x1280 | cover-wide-adventure-8.1-1920x1280-try3.png | ok                               | requests.json | no       |
| 2026-11-27T13:54:53.107Z | adventure-9.3 | 3       | 0.01       | 1920x1280 | cover-wide-adventure-9.3-1920x1280-try3.png | ok                               | requests.json | yes      |
| 2026-11-27T14:08:09.219Z | quest-6.1     | 4       | 0.00       | none      | none                                        | failed: network error: ETIMEDOUT | fix clause    | no       |
| 2026-11-27T14:08:54.305Z | adventure-7.1 | 4       | 0.01       | 1920x1280 | cover-wide-adventure-7.1-1920x1280-try4.png | ok                               | fix clause    | no       |
| 2026-11-27T14:09:25.409Z | adventure-7.2 | 4       | 0.01       | 1920x1280 | cover-wide-adventure-7.2-1920x1280-try4.png | ok                               | fix clause    | yes      |
| 2026-11-27T14:10:06.494Z | adventure-8.1 | 4       | 0.01       | 1920x1280 | cover-wide-adventure-8.1-1920x1280-try4.png | ok                               | fix clause    | no       |
| 2026-11-27T14:15:05.899Z | quest-6.1     | 5       | 0.01       | 1920x1280 | cover-wide-quest-6.1-1920x1280-try5.png     | ok                               | fix clause    | yes      |
| 2026-11-27T14:15:49.630Z | adventure-7.1 | 5       | 0.01       | 1920x1280 | cover-wide-adventure-7.1-1920x1280-try5.png | ok                               | fix clause    | no       |
| 2026-11-27T14:16:35.677Z | adventure-8.1 | 5       | 0.01       | 1920x1280 | cover-wide-adventure-8.1-1920x1280-try5.png | ok                               | fix clause    | no       |
| 2026-11-27T14:23:42.567Z | adventure-7.1 | 6       | 0.01       | 1920x1280 | cover-wide-adventure-7.1-1920x1280-try6.png | ok                               | fix clause    | yes      |
| 2026-11-27T14:24:29.280Z | adventure-8.1 | 6       | 0.01       | 1920x1280 | cover-wide-adventure-8.1-1920x1280-try6.png | ok                               | fix clause    | yes      |
| 2026-11-27T17:51:53.767Z | quest-6.2     | 3       | 0.01       | 1920x1280 | cover-wide-quest-6.2-1920x1280-try3.png     | ok                               | fix clause    | no       |
