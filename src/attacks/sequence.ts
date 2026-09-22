// Fixed turn-number attack order — SPEC.md §5. This replaces the earlier
// HP%-based phase idea per the review notes: fill this array in by watching
// the real fight, one entry per turn. Nothing else needs to change when you
// edit this.
import type { AttackId } from './types';
import { ATTACK_SEQUENCE_CONFIG } from '../config/attacks';

export const ATTACK_SEQUENCE: AttackId[] = [
  // Turn 1, 2, 3, ... — placeholder order, replace with the real sequence.
  'PhoneHead',
  'PipisSwarm',
  'HeadRush',
  'LaneDodge',
  'MailTrucks'
];

/**
 * Turn numbers are 1-based. Once `turnNumber` exceeds the array, behavior
 * depends on ATTACK_SEQUENCE_CONFIG.loopMode (SPEC.md §5):
 * - 'loopAll' (default): wrap back to the start of the whole array.
 * - 'repeatLast': keep repeating the final entry.
 */
export function attackForTurn(turnNumber: number): AttackId {
  if (ATTACK_SEQUENCE.length === 0) {
    throw new Error('ATTACK_SEQUENCE must have at least one entry.');
  }
  const zeroBased = turnNumber - 1;
  const index =
    ATTACK_SEQUENCE_CONFIG.loopMode === 'loopAll'
      ? zeroBased % ATTACK_SEQUENCE.length
      : Math.min(zeroBased, ATTACK_SEQUENCE.length - 1);
  const attack = ATTACK_SEQUENCE[Math.max(0, index)];
  if (!attack) {
    throw new Error('ATTACK_SEQUENCE lookup produced no attack.');
  }
  return attack;
}
