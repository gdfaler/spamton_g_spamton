// Fixed turn-number attack order — SPEC.md §5. This replaces the earlier
// HP%-based phase idea per the review notes: fill this array in by watching
// the real fight, one entry per turn. Nothing else needs to change when you
// edit this.
import type { AttackId } from './types';

export const ATTACK_SEQUENCE: AttackId[] = [
  // Turn 1, 2, 3, ... — placeholder order, replace with the real sequence.
  'PhoneHead',
  'PipisSwarm',
  'HeadRush',
  'LaneDodge',
  'MailTrucks'
];

/**
 * Turn numbers are 1-based. Once `turnNumber` exceeds the array, we repeat
 * the LAST entry rather than looping back to the start — see SPEC.md §5
 * ([ПРОВЕРИТЬ]: confirm this is the desired fallback before Stage 6).
 */
export function attackForTurn(turnNumber: number): AttackId {
  const index = Math.min(turnNumber - 1, ATTACK_SEQUENCE.length - 1);
  const attack = ATTACK_SEQUENCE[Math.max(0, index)];
  if (!attack) {
    throw new Error('ATTACK_SEQUENCE must have at least one entry.');
  }
  return attack;
}
