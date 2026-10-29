/**
 * A bot that plays Castle Defense from the state alone (the QC driver and the tests use it): it
 * chooses the next word, then the spot with the most path steps in range.
 * The lowest spot index wins a tie. The bot returns null after the run.
 */
import type { CastleDefenseCommand, CastleDefenseState } from '../core/index.js';

export function nextCommand(state: CastleDefenseState): CastleDefenseCommand | null {
  if (state.phase !== 'playing') return null;
  if (!state.started) return { type: 'start' };
  if (state.stage === 'place') {
    const spot = [...state.spots].sort((a, b) => b.covers.length - a.covers.length || a.spot - b.spot)[0];
    return spot ? { type: 'build', spot: spot.spot } : null;
  }
  const choice = state.step?.choices.find((c) => c.right && !c.blocked);
  return choice ? { type: 'pick', choice: choice.index } : null;
}
