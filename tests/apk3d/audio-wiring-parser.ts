// Shared host-text parser for the Phase 3 wiring tests (spec AC9).
// Case 6 of tests/apk3d/audio-wiring.test.ts and the adversarial wiring file
// both read the played events of each 2D host from raw source text. A play
// call inside a comment or a string literal is not a played event, so the
// extraction strips comments and ignores matches that live inside strings.
// Real audio.play calls keep their quoted event-name arguments.

/** The host text with line and block comments removed. */
export function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/** The text with every string literal body replaced by spaces (length kept). */
function blankStringLiterals(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const open = text[i]!;
    if (open !== "'" && open !== '"' && open !== '`') {
      out += open;
      i += 1;
      continue;
    }
    out += ' ';
    i += 1;
    while (i < text.length) {
      const ch = text[i]!;
      if (ch === '\\') {
        out += text[i + 1] === '\n' ? ' \n' : '  ';
        i += 2;
        continue;
      }
      out += ch === '\n' ? '\n' : ' ';
      i += 1;
      if (ch === open) break;
    }
  }
  return out;
}

/**
 * Every event a host plays: the literals of its audio.play calls (branch
 * names of ternaries only, never the compared value) and its SFX map values.
 * Sprite animation .play calls never count: only audio.play does. Play calls
 * inside comments or string literals never count either.
 */
export function playedEventsOf(text: string): Set<string> {
  const clean = stripComments(text);
  const blanked = blankStringLiterals(clean);
  const played = new Set<string>();
  const callStart = /audio\.play\(/g;
  let found: RegExpExecArray | null;
  while ((found = callStart.exec(blanked)) !== null) {
    // The match starts outside any string, so the same offset in the
    // comment-free text is the real call with its quoted arguments intact.
    const call = clean.slice(found.index).match(/^audio\.play\(([^;]*?)\)/s);
    if (!call) continue;
    let args = call[1]!;
    const branch = args.indexOf('?');
    if (branch >= 0) args = args.slice(branch);
    for (const literal of args.matchAll(/'([a-z][a-z-]*)'/g)) played.add(literal[1]!);
  }
  const sfxStart = /const SFX[^=]*=\s*\{/g;
  while ((found = sfxStart.exec(blanked)) !== null) {
    const body = clean.slice(found.index).match(/^const SFX[^=]*=\s*\{([^}]*)\}/s);
    if (!body) continue;
    for (const literal of body[1]!.matchAll(/'([^'"]+)'/g)) played.add(literal[1]!);
  }
  return played;
}
