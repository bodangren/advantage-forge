import { readFileSync } from 'node:fs';

/** The task text a model receives. Identical for both arms; only the skill differs. */
export interface Brief {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly brief: string;
  readonly height: readonly [number, number];
  readonly triangles: readonly [number, number];
  readonly rig: boolean;
  readonly clips: readonly string[];
  readonly asset?: string;
  readonly expect_min?: number;
}

export function loadBrief(path: string): Brief {
  return JSON.parse(readFileSync(path, 'utf8')) as Brief;
}

export function taskPrompt(b: Brief, minutes: number, vision: boolean): string {
  const rig = b.rig
    ? `- Rig it with \`k.skeleton\` and add these animation clips with exactly these names: ${b.clips.map((c) => `\`${c}\``).join(', ')}.`
    : '- No rig or animation is needed.';
  const look = vision
    ? `- Look at your renders: \`./forge render ${b.id} --fast\` writes \`out/${b.id}/render.png\`; read that image and compare it with the brief after every change.`
    : `- You may not be able to see images. After every build run \`./forge inspect ${b.id} --fast\`: it prints what a picture would show as numbers (visibility of each part, silhouette, values, colors, floating or buried parts). \`./forge render ${b.id} --fast\` still writes \`out/${b.id}/render.png\`.`;
  return `You are working in the Fantasy Asset Forge repository in the current directory.

Task: create the 3D game asset "${b.title}" as \`assets/${b.id}.ts\` (the asset name must be '${b.id}').

Brief: ${b.brief}

Requirements:
- Read AGENTS.md first: it explains the API and the workflow.
- Real-world scale: about ${b.height[0]} to ${b.height[1]} m tall. Stand on y = 0 and face +Z.
${rig}
- Only create or edit \`assets/${b.id}.ts\`. You may add helper files named \`assets/_${b.id}-*.ts\`. Do not change any other file.
${look}
${b.rig ? `- Check animations with \`./forge animate ${b.id} --fast\` (strip images in \`out/${b.id}/anim/\`).\n` : ''}- Finish with \`./forge all ${b.id}\` and make sure it builds with no \`warning:\` lines.
- You have about ${minutes} minutes. A finished, clean asset beats an ambitious broken one. Stop when you are done.`;
}
