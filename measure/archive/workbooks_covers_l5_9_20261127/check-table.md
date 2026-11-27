# Check table: Primary Advantage covers, levels 5 to 9

Date: 2026-11-27. From: Advantage Forge. For: Workbooks, track `book_covers_20261007`, Phase 4.

The check list is the one of the request README. The 7 items are:

1. The style is the same as the style reference (cel shading, line art, colors).
2. The heroes and the fox are the same as the references (faces, clothes, colors).
3. No hero or creature crosses the center line (the middle of the width).
4. No text, letter, logo, or signature in the picture.
5. No divider, line, or frame in the middle.
6. The size is 1920 x 1280 px, RGB, PNG.
7. The scene and the gear match the row in `requests.json`.

## Result

| #   | Book          | File                                   | Attempt | 1 Style | 2 Cast | 3 Center   | 4 No text | 5 No divider | 6 Size | 7 Scene | Result   |
| --- | ------------- | -------------------------------------- | ------- | ------- | ------ | ---------- | --------- | ------------ | ------ | ------- | -------- |
| 1   | Quest 5       | cover-wide-quest-5-1920x1280.png       | 2       | pass    | pass   | pass       | pass      | pass         | pass   | pass    | accepted |
| 2   | Quest 6.1     | cover-wide-quest-6.1-1920x1280.png     | 5       | pass    | pass   | pass       | pass      | pass         | pass   | pass    | accepted |
| 3   | Quest 6.2     | cover-wide-quest-6.2-1920x1280.png     | 2       | pass    | pass   | pass, note | pass      | pass         | pass   | pass    | accepted |
| 4   | Adventure 7.1 | cover-wide-adventure-7.1-1920x1280.png | 6       | pass    | pass   | pass       | pass      | pass         | pass   | pass    | accepted |
| 5   | Adventure 7.2 | cover-wide-adventure-7.2-1920x1280.png | 4       | pass    | pass   | pass       | pass      | pass         | pass   | pass    | accepted |
| 6   | Adventure 8.1 | cover-wide-adventure-8.1-1920x1280.png | 6       | pass    | pass   | pass       | pass      | pass         | pass   | pass    | accepted |
| 7   | Adventure 8.2 | cover-wide-adventure-8.2-1920x1280.png | 2       | pass    | pass   | pass       | pass      | pass         | pass   | pass    | accepted |
| 8   | Adventure 8.3 | cover-wide-adventure-8.3-1920x1280.png | 1       | pass    | pass   | pass       | pass      | pass         | pass   | pass    | accepted |
| 9   | Adventure 9.1 | cover-wide-adventure-9.1-1920x1280.png | 2       | pass    | pass   | pass       | pass      | pass         | pass   | pass    | accepted |
| 10  | Adventure 9.2 | cover-wide-adventure-9.2-1920x1280.png | 2       | pass    | pass   | pass       | pass      | pass         | pass   | pass    | accepted |
| 11  | Adventure 9.3 | cover-wide-adventure-9.3-1920x1280.png | 3       | pass    | pass   | pass       | pass      | pass         | pass   | pass    | accepted |

Accepted: 11. Rejected: 0.

## Notes per picture

- Quest 5: river crossing with a rope bridge. The boy holds the sword down and to the left. The tip
  sits at about 50 percent of the width, on the middle line.
- Quest 6.1: ancient ruins entrance with gears, torches, and stone tablets. The tablets carry carved
  rune glyphs. They are scene motifs, not text.
- Quest 6.2: forest shrine with nature magic and a friendly moss stag. The note on check 3: the
  guardian creature stands in the left part of the picture, from 3 to 35 percent of the width. It
  never crosses the middle line, and it stands far from it. The picture reads well on the back
  cover page. A third attempt moved the guardian to the right side, but that attempt put the sword
  over the middle line. The second attempt stands.
- Adventure 7.1: mountain pass with capes, fur boots, a rope, and climbing tools.
- Adventure 7.2: sky bridge over a canyon with ropes and flying gliders. A small dark shape sits in
  the glider at the upper left. It reads as machinery, not as cast.
- Adventure 8.1: crystal cave. The staff crystal has grown large. The sword shows a faint blue glow.
- Adventure 8.2: waterfall temple with water runes, blue light, and a puzzle door with a dial.
- Adventure 8.3: library ruins with reading magic, floating pages, and glowing glyphs on the pillars.
  The floating pages carry illegible scribbles. They are scene motifs, not text.
- Adventure 9.1: sunlit desert ruins with scarves, goggles, and an artifact compass on the belt.
  The obelisks carry carved glyphs. They are scene motifs, not text.
- Adventure 9.2: jungle temple with vines and a hidden doorway with a glowing sigil. The fox is the
  animal companion.
- Adventure 9.3: night camp with a fire, lanterns, and a monster shadow in the sky. The shadow is a
  dragon silhouette at 3 to 23 percent of the width. The scene holds suspense and no violence. The
  picture uses a night palette because the scene is a night camp.

## How each check was done

- Checks 1, 2, 4, 5 and 7: Forge looked at each accepted picture in full and compared it with the
  three reference pictures in the request folder.
- Check 3: Forge cropped the band from x=880 to x=960 of each accepted file and looked at the band.
  The middle of the width is x=960. No hero part and no creature sits left of it. The lowest
  element is the sword tip, and it stays on the right of the line in all 11 pictures.
- Check 6: Forge read the header of each file. All 11 files are 1920 x 1280 px, sRGB, PNG, with no
  alpha channel.

## The second opinion of a look judge

A second session looked at the 11 accepted files and the three reference files with the same list,
in 6 items. The size item was left out, because a judge cannot read the size by eye. Its table:

| #   | Book          | 1 style | 2 cast | 3 left half | 4 no text | 5 no divider | 6 scene |
| --- | ------------- | ------- | ------ | ----------- | --------- | ------------ | ------- |
| 1   | Quest 5       | pass    | pass   | pass        | pass      | pass         | pass    |
| 2   | Quest 6.1     | pass    | pass   | pass        | pass      | pass         | pass    |
| 3   | Quest 6.2     | pass    | pass   | fail        | pass      | pass         | pass    |
| 4   | Adventure 7.1 | pass    | pass   | pass        | pass      | pass         | pass    |
| 5   | Adventure 7.2 | pass    | pass   | pass        | pass      | pass         | pass    |
| 6   | Adventure 8.1 | pass    | pass   | pass        | pass      | pass         | pass    |
| 7   | Adventure 8.2 | pass    | pass   | pass        | pass      | pass         | pass    |
| 8   | Adventure 8.3 | pass    | pass   | pass        | pass      | pass         | pass    |
| 9   | Adventure 9.1 | pass    | pass   | pass        | pass      | pass         | pass    |
| 10  | Adventure 9.2 | pass    | pass   | pass        | pass      | pass         | pass    |
| 11  | Adventure 9.3 | pass    | pass   | pass        | pass      | pass         | pass    |

The judge gave 10 of 11 pictures a full pass. Its one fail is row 3, and the reason is the guardian
creature in the left part of Quest 6.2. The judge read item 3 as a rule for the whole left half. The
README words are a rule for the middle line, and the creature never reaches it. Forge keeps the
picture and states the point here so that Workbooks and Daniel can judge it.

The judge also gave the leftmost pixel of each element, as a percent of the width:

| #   | Sword  | Heroes | Fox  |
| --- | ------ | ------ | ---- |
| 1   | 50.5 % | 54 %   | 80 % |
| 2   | 50.7 % | 58 %   | 92 % |
| 3   | 56 %   | 60 %   | 91 % |
| 4   | 55.5 % | 56 %   | 82 % |
| 5   | 57 %   | 61 %   | 82 % |
| 6   | 52 %   | 55 %   | 83 % |
| 7   | 51.5 % | 56.5 % | 83 % |
| 8   | 51.3 % | 56.5 % | 83 % |
| 9   | 53.5 % | 58 %   | 85 % |
| 10  | 54.5 % | 59 %   | 84 % |
| 11  | 74 %   | 74 %   | 56 % |

## One note for Workbooks

The cover script cuts 1886 px from the center of the picture. It gives two pages of 943 x 1280 px.
The heroes stand right of the cut in all 11 pictures, so they land on the front cover page. The
left page holds scenery only, apart from the guardian creature of Quest 6.2.
