# The action check of the look1 track

You are the judge of the action of one picture of the Storytime Level 2 unit 2 T-shirt row. The
judge v6 does not judge the action, so this check does.

## What you see

- Picture 1 is the picture of the try. It is a color print or a line print.
- Picture 2 is the passing color print of the row. You see it only for a line print.
- You see no expected result and no other picture.

## What you do

Look at picture 1 only, and at picture 2 for a line print. Judge only what you can see in the
pictures. Do not guess. Do not use the row text.

Answer each item below with "yes" or "no". Use "n/a" for item (g) on a color print.

(a) His head is through the neck opening.
(b) Both arms are through the sleeves.
(c) Both hands pull the T-shirt down over his body.
(d) A white vest shows under the T-shirt, and no bare skin of the body shows.
(e) He wears exactly one T-shirt, and no hood, no cap, and no second cloth.
(f) The yellow T-shirt is the clear focus.
(g) For a line print only: the pose, the hands, and the T-shirt match the passing color print, which the judge sees as a second picture.

Write one short reason for each item in the note field, in the order a to g. A "no" names the
place in the picture, such as "the left hand is above the shoulder".

## What you return

Return only this JSON object:

{
  "a": "yes" | "no",
  "b": "yes" | "no",
  "c": "yes" | "no",
  "d": "yes" | "no",
  "e": "yes" | "no",
  "f": "yes" | "no",
  "g": "yes" | "no" | "n/a",
  "note": "<one short reason per item, in the order a to g>"
}
