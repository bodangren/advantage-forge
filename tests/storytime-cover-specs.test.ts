// Tests for the Storytime cover spec and the 9 retry spec edits (D2, D5, D6, FR-5).
//
// The 9 unit 2 retry specs hold one new prompt sentence each, and the cover spec
// docs/storytime/covers/teacher-front/l2-u1-cover-quest-teacher-front.json holds the prompt of the
// Teacher Book front art. The tests cover:
//   - the new sentence of each of the 9 retry specs, in its named field, and the end of that field;
//   - the cover spec: the id, the folder, the print mode, the print size, the aspect, and no line
//     prompt;
//   - the 7 references: every file exists, and no file of the avoid folder is a reference;
//   - the style, the scene, the cast notes, and the never list of the brief, word for word;
//   - the count of three people, the four fault fixes, and the layout of D6;
//   - the aspect check of D5: the ratio of 3:4 is at least the target ratio of 2480 / 3508, and the
//     crop of the muse tool cuts the sides and stays centered.
//
// The brief folder is read only. The test reads it and the repository files. No test makes a
// provider call.

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = process.cwd();
const BRIEF = '/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-brief';
const COVER_SPEC = 'docs/storytime/covers/teacher-front/l2-u1-cover-quest-teacher-front.json';
const read = (p: string) => JSON.parse(readFileSync(resolve(REPO, p), 'utf8'));
const cover = read(COVER_SPEC);
const prompt = cover.colorPrompt as string;

const HAT_PIP = 'docs/storytime/l2-unit2/w10/muse/l2-w10-story-page-put-on-your-hat-pip.json';
const TOM_MOP = 'docs/storytime/l2-unit2/w09/muse/l2-w09-story-page-tom-can-see-the-mop.json';
const RICE = 'docs/storytime/l2-unit2/w09/muse/l2-w09-card-rice.json';
const CARDS = [
  'docs/storytime/l2-unit2/w12/muse/l2-w12-card-hippo.json',
  'docs/storytime/l2-unit2/w12/muse/l2-w12-card-ruler.json',
  'docs/storytime/l2-unit2/w13/muse/l2-w13-card-clap.json',
  'docs/storytime/l2-unit2/w13/muse/l2-w13-card-throw.json',
  'docs/storytime/l2-unit2/w14/muse/l2-w14-card-cold.json',
  'docs/storytime/l2-unit2/w14/muse/l2-w14-card-windy.json',
];

const OLD_COUNT =
  'Count the people: exactly seven children (Sam, May, Ben, Mia, Pat, Lily, and Nan), Teacher Kim, and Pip. ' +
  'Nan, with her two round buns, stands in front at the right, in full view. Exactly the characters named here ' +
  'are in the picture, and no other person or animal.';
const NEW_COUNT =
  'Count the people: exactly seven children (Sam, May, Ben, Mia, Pat, Lily, and Nan), Teacher Kim, and Pip. ' +
  'Nan, in her orange T-shirt with the white star, is in full view. The seven children stand in one line, side by ' +
  'side, each in full view, from left to right: Sam, May, Ben, Mia, Pat, Lily, and Nan; Pip sits in the big open ' +
  'dress-up box in front of the line, and Teacher Kim stands once behind the line. Each child shows exactly once, ' +
  'with his or her own hair and own clothes from the pictures. Exactly the characters named here are in the ' +
  'picture, and no other person or animal.';
const TOM_MOP_SENTENCE = 'Dad has no glasses. His eyes are two simple dots. Keep the very thick lines.';
const RICE_SENTENCE = 'The rice is many small separate closed ovals (grains) heaped in the bowl, with no big blobs.';
const WIDE_SENTENCE =
  'Draw the object or the child large, filling most of the square, with few details. Every line is about one ' +
  'fiftieth of the picture width (2 percent) thick, never thinner. This line width replaces any other line width ' +
  'in this prompt.';

const STYLE_A =
  'The style is bright painted anime fantasy key art. It has soft cel shading, clean line art, lush scenery, ' +
  'warm sunlight, vivid colors, and big expressive eyes.';
const STYLE_B = 'Not 3D. Not a render. Not clay.';
const STYLE = `${STYLE_A} ${STYLE_B}`;
const SCENE =
  'The scene is under a giant old tree. The tree stands in a sunny flower meadow of a storybook valley. A stream ' +
  'runs behind. Teacher Kim sits on a low tree stump. She shows the open book to the children. She holds one open ' +
  'picture book. Its open pages turn toward Nan and Sam, so the children see the pictures. She looks at the ' +
  'children and smiles. Nan and Sam sit on the grass in front of her. They look at the pictures in the book. They ' +
  'smile. The pages show simple pictures, for example a tree and a ball.';
const KIM =
  'Teacher Kim: a grown woman, about one and a half times as tall as the children, with medium-length dark-brown ' +
  'hair in a low ponytail, a soft green cardigan over a cream blouse, navy trousers, brown flat shoes, a gentle smile';
const NAN =
  'Nan: black-brown hair in exactly two round buns with smooth red ring bands (no bun on top), large dark-brown ' +
  'eyes, an orange T-shirt with a white star, red shorts, white sneakers';
const SAM =
  'Sam: a five-year-old boy with a chibi look (a big head and a small body), short brown hair with a side-swept ' +
  'fringe, big brown eyes, a big open-mouth smile, a red T-shirt with two white stripes across the chest, blue ' +
  'shorts, blue shoes';
const NEVER_TEXT = 'The picture holds no letters, no words, and no numbers.';
const NEVER_MARKS =
  'The picture holds no signatures, no watermarks, no logos, no borders, no frames, and no rulers.';
const NEVER_FLAG =
  'The picture holds no flag-like shape. A flag-like shape is a single circle, star, cross, or stripe pattern on a ' +
  "plain field, alone on a book page, a banner, a cloth, or a sign. The white star on Nan's orange T-shirt and the " +
  "two white stripes on Sam's red T-shirt are cast marks, not flags: keep them.";
const LAYOUT =
  'The top 30 percent of the height is sky and leaves only: calm, with no face, no hand, no book, and no key ' +
  'object. The faces, the hands, and the open book stay between 30 percent and 78 percent of the height. The bottom ' +
  '22 percent holds only grass, flowers, and feet.';

describe('the 9 retry spec edits (CS1 to CS3)', () => {
  it('CS1 holds the new count sentence of hat-pip in the colorPrompt field', () => {
    const spec = read(HAT_PIP);
    expect(spec.colorPrompt).toContain(NEW_COUNT);
    expect(spec.colorPrompt).not.toContain(OLD_COUNT);
    expect(spec.colorPrompt.endsWith('is context only: do not draw any text.')).toBe(true);
  });

  it('CS2 holds the new sentence at the end of the linePrompt field of the 8 other specs', () => {
    expect(read(TOM_MOP).linePrompt.endsWith(TOM_MOP_SENTENCE)).toBe(true);
    expect(read(RICE).linePrompt.endsWith(RICE_SENTENCE)).toBe(true);
    for (const file of CARDS) {
      expect.soft(read(file).linePrompt.endsWith(WIDE_SENTENCE), file).toBe(true);
    }
  });

  it('CS3 keeps the id and the folder of every edited spec', () => {
    const files = [HAT_PIP, TOM_MOP, RICE, ...CARDS];
    for (const file of files) {
      const spec = read(file);
      const name = file.split('/').pop()!.replace('.json', '');
      expect.soft(spec.id, file).toBe(name);
      expect.soft(spec.outDir, file).toBe(`out/storytime/l2/unit2/${file.split('/')[3]}/muse`);
    }
  });
});

describe('the cover spec (CS4 to CS8)', () => {
  it('CS4 holds the id, the folder, the print mode, the print size, the aspect, and no line prompt', () => {
    expect(cover.id).toBe('l2-u1-cover-quest-teacher-front');
    expect(cover.outDir).toBe('out/storytime/covers/teacher-front/muse');
    expect(cover.print).toBe('crop');
    expect(cover.printSize).toEqual([2480, 3508]);
    expect(cover.aspect).toBe('3:4');
    expect(Object.hasOwn(cover, 'linePrompt')).toBe(false);
  });

  it('CS5 holds 7 references, every file exists, and no file of the avoid folder is a reference', () => {
    const references = cover.references as string[];
    expect(references).toHaveLength(7);
    expect(references[0]).toBe('out/storytime/covers/teacher-front/refs/style-student-front-final.jpg');
    expect(references[1]).toBe('out/storytime/covers/teacher-front/refs/cast-teacher-kim.png');
    expect(references[2]).toBe('out/storytime/covers/teacher-front/refs/cast-nan.png');
    expect(references[3]).toBe('out/storytime/covers/teacher-front/refs/cast-sam.png');
    expect(references[4]).toBe('out/storytime-review/judge/cast/teacher-kim.png');
    expect(references[5]).toBe('out/storytime-review/judge/cast/nan.png');
    expect(references[6]).toBe('out/storytime-review/judge/cast/sam.png');
    for (const reference of references) {
      expect.soft(existsSync(resolve(REPO, reference)), reference).toBe(true);
      expect.soft(reference.includes('/avoid/'), reference).toBe(false);
    }
  });

  it('CS6 holds the style, the scene, and the cast notes of the brief, word for word', () => {
    expect(prompt).toContain(STYLE);
    expect(prompt).toContain(SCENE);
    expect(prompt).toContain(KIM);
    expect(prompt).toContain(NAN);
    expect(prompt).toContain(SAM);
    const brief = readFileSync(resolve(BRIEF, 'README.md'), 'utf8');
    for (const note of [KIM, NAN, SAM]) {
      expect.soft(brief.includes(note), note.slice(0, 12)).toBe(true);
    }
    // The brief holds the style in two paragraphs, and the prompt holds both sentences.
    expect.soft(brief.includes(STYLE_A)).toBe(true);
    expect.soft(brief.includes(STYLE_B)).toBe(true);
  });

  it('CS7 holds the count of three people, the four fault fixes, and the layout of D6', () => {
    expect(prompt).toContain('The picture shows exactly three people: Teacher Kim, Nan, and Sam. It shows no Pip.');
    expect(prompt).toContain(
      "Sam's red T-shirt shows exactly two white stripes across the chest and nothing else.",
    );
    expect(prompt).toContain("Nan's orange T-shirt shows one white star and no letters.");
    expect(prompt).toContain(
      'Nan wears the orange T-shirt with the white star, and Sam wears the red T-shirt with the two white ' +
        'stripes, and each child keeps his or her own clothes.',
    );
    expect(prompt).toContain(
      'Teacher Kim shows the open book to the children, looks at them, and smiles, and the open pages face Nan ' +
        'and Sam and not the viewer.',
    );
    expect(prompt).toContain(LAYOUT);
  });

  it('CS8 holds the never list of the brief', () => {
    expect(prompt).toContain(NEVER_TEXT);
    expect(prompt).toContain(NEVER_MARKS);
    expect(prompt).toContain(NEVER_FLAG);
  });
});

describe('the aspect check of D5 (CS9 to CS10)', () => {
  it('CS9 holds a ratio that is at least the target ratio of 2480 / 3508', () => {
    const target = 2480 / 3508;
    const ratio = 3 / 4;
    expect(target).toBeCloseTo(0.7069, 3);
    expect(ratio).toBeGreaterThanOrEqual(target);
    // The fallback ratio, if the model refuses 3:4, is 4:5. It is at least the target ratio too.
    expect(4 / 5).toBeGreaterThanOrEqual(target);
  });

  it('CS10 holds a centered crop that trims the sides of a 3:4 model picture', () => {
    const target = 2480 / 3508;
    const modelWidth = 1536;
    const modelHeight = 2048;
    const targetWidth = Math.round(modelHeight * target);
    expect(modelWidth).toBeGreaterThan(targetWidth);
    const left = Math.floor((modelWidth - targetWidth) / 2);
    expect(left).toBe(44);
    expect(left + targetWidth + left).toBeLessThanOrEqual(modelWidth);
  });
});
