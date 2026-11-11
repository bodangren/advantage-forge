Status: done.

# The PM report of the look1 order

## The hand-off folder

The folder is /home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-look1/. It holds 9 files:
4 PNG files, contact-sheet.png, manifest.json, spend-log.tsv, README.md, and MANIFEST.txt.

The SHA-256 of MANIFEST.txt is
6ae4e14f0f37914eb542596a5d756c5a41a2de6abfc728f176bbd0d09aa6c077. The check
sha256sum --quiet -c MANIFEST.txt gives no FAILED line, and
sha256sum -c MANIFEST.txt | grep -c ': OK$' gives 8 OK lines.

The 4 PNG files are hard links of the delivered files. The delivery folder and the hand-off folder
share every inode. The contact sheet has 2 rows: the hat-pip row and the T-shirt row. Each row has
the color print beside the line print, and the row id under the pair.

## The spend

The 2 spend lines, word for word from spend-log.tsv:

```
2026-11-11T00:23:46.646Z	muse	l2-w10-story-page-put-on-your-t-shirt color	2	0.01	l2-w10-story-page-put-on-your-t-shirt-m2-color.png
2026-11-11T00:34:37.068Z	muse	l2-w10-story-page-put-on-your-t-shirt line	3	0.01	l2-w10-story-page-put-on-your-t-shirt-m2-line.png
```

The total is 2 calls and 0.02 USD of the 0.10 USD stop.

## The judge results

### The T-shirt color try 2 (m2)

- The first judge, judge-u2l1-color-t2.json, fails the file with the class wrong-character. The
  defect sits on the clothes of Ben: a yellow T-shirt instead of the light blue of the cast note,
  and a white vest-like garment under it. Its action check reads a yes, b yes, c no, d yes, e yes,
  f yes, and g n/a. Item c says the hands hold the hem out at chest height, so the shirt is not
  pulled down over the belly. The other items are yes.
- The second judge, judge-u2l1-color-t2-second.json, passes the file with the class none. That judge
  read the action-check prompt before it finished its v6 part, so the order fault voided its v6
  verdict. Its action check reads a yes, b yes, c yes, d yes, e yes, f yes, and g n/a.
- A clean second v6 judge, judge-u2l1-color-t2-second-r2.json, passes the file with the class none.
  It reads no action check.

The second-judge rule of D6 clears the fail. The v6 verdict comes from the clean file and the action
check comes from the second judge. So the color try 2 (m2) passes.

### The T-shirt line try 3

The print gate passes. The line print is 22 px and its despeckled print is 22 px. The judge,
judge-u2l1-line-t3.json, passes the file with the class none. Its action check reads a yes, b yes,
c yes, d yes, e yes, f yes, and g yes. The note says the vest is a simple band, and item g covers
the pose, the hands, and the T-shirt.

## The hat-pip row

The owner words, Daniel, Tasks, 2026-11-11 06:27 ICT:

> Hat-pip image passes, but the w10 put on your t shirt image doesn't pass.

The owner accepts this picture. The owner waives the wrong-character fail of the 2 judges of the
archived track for this row only.

The approval version is 3. The color print is the color m3 and the line print is the line try 3.

| file | kind | SHA-256 |
| --- | --- | --- |
| l2-w10-story-page-put-on-your-hat-pip-v1.png | color m3 | 6db86851b359760ea88e9feb67cf2bc784720ac4466abc5419af6f1dfff6bdff |
| l2-w10-story-page-put-on-your-hat-pip-line-v1.png | line try 3 | 1474680276aa160dd972cd78b8559039a765032e703323cdb1ff41f0583aa9e1 |

## The T-shirt files

| file | old SHA-256 | new SHA-256 |
| --- | --- | --- |
| l2-w10-story-page-put-on-your-t-shirt-v1.png | 9e207c3c72db52d323fd8ef64c9565588f853460ec7abcfa0fda5a053bd925e4 | 8e1baee103a536b26071781754118ff757072a75a5a13837ada6439c2dc406b2 |
| l2-w10-story-page-put-on-your-t-shirt-line-v1.png | 71e2ba056c09ad66a1beecb565941616becfdecf4fccd107e86bbbe0b9e1ca7e | 675a7ef4d25dcc22f7533c1caf0296c9fdd5abf1773972b5531a4c8403f514d7 |

The new picture replaces the v1 T-shirt files of storytime-l2u2-book-pictures/. The 2 new files keep
the same -v1 names. The old folder does not change on disk.

## The unchanged folders

The 6 folders of D8 have the same file counts and the same state SHA-256 before and after this
order. The records are folder-state-look1-before.txt and folder-state-look1-after.txt.

| folder | files | state sha256 |
| --- | --- | --- |
| out/storytime/l2/unit2/delivery-muse-v1/ | 441 | a64ddf5f19a76542ee8806e16e872d23ef4a44308082fabee461f3ca9aec038c |
| out/storytime/l2/unit2/delivery-muse-v1-retry1/ | 9 | ca4cc92ff5767edf23c299602b6dc25951c5a6a45f3157c62b2252c4993544b7 |
| out/storytime/l2/unit2/delivery-muse-v1-repair1/ | 27 | c1105932782a2ccbbcc0ab8cec3c0d9bc354c047a5f2161db8fa4d717955c564 |
| handoff/storytime-l2u2-book-pictures/ | 469 | 1146c9a48c77c39ac7ce67974a3f73a6d086d575bb21699f704c35f3c309c592 |
| handoff/storytime-l2u2-book-pictures-retry1/ | 23 | 9ade5c1e3b968ca87d71ab0d6c40503157bc5b1bb4e9be5450178e71f4f03c8a |
| handoff/storytime-l2u2-book-pictures-repair1/ | 33 | 490fa8f24e1bd8e0ff069243be6531a5913cb38145807e80e924311cda0d4b08 |

The judge results of the t-shirt are model evidence, not acceptance. Daniel's look gate and the
Workbooks checks decide.

## Facts changed:

- Forge look1 spend 0.02 USD (2 Muse calls) of the 0.10 USD stop.
- hat-pip has a delivery job on Daniel's words, so Forge gives a delivery job for 229 of the 229 unit 2 rows (228 before).
- the t-shirt picture has new files (color 8e1baee1…, line 675a7ef4…) under the same -v1 names, and they replace 9e207c3c… and 71e2ba05….
- the t-shirt is model evidence until Daniel looks at it.
