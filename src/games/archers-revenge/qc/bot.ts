/**
 * A bot that plays Archer's Revenge from the state alone (the QC driver and the tests use it): it
 * aims at the word of the prompt. It returns null when no command remains.
 */
import { shotOf, TUNING, type ArchersRevengeCommand, type ArchersRevengeState, type Layout } from '../core/index.js';

export interface Aim {
  angle: number;
  power: number;
}

// Snapshots copy the layout, so geometry values identify the cache rather than object identity.
const aimCache = new Map<string, Map<number, Aim>>();

/** The first hitting pair in angle order, then power order. The old lane views also use this bridge. */
export function aimForLane(layout: Layout, lane: number): Aim | null {
  const key = JSON.stringify(layout);
  let aims = aimCache.get(key);
  if (!aims) {
    aims = new Map();
    const { minAngle, maxAngle, minPower, maxPower } = TUNING.aim;
    for (let angle = minAngle; angle <= maxAngle && aims.size < layout.lanes; angle++) {
      for (let power = minPower; power <= maxPower; power++) {
        const contact = shotOf(layout, [], angle, power).contact;
        if (contact.kind === 'target' && !aims.has(contact.index)) aims.set(contact.index, { angle, power });
      }
    }
    aimCache.set(key, aims);
  }
  const aim = aims.get(lane);
  return aim ? { ...aim } : null;
}

export function nextCommand(state: ArchersRevengeState): ArchersRevengeCommand | null {
  if (state.phase !== 'playing') return null;
  if (!state.started) return { type: 'start' };
  const round = state.round;
  const lane = round?.lanes.find((l) => l.wordId === round.wordId && !l.blocked);
  const aim = lane ? aimForLane(state.layout, lane.lane) : null;
  return aim ? { type: 'fire', ...aim } : null;
}
