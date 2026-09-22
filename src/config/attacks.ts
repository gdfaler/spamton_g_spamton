// Per-attack tuning numbers. Convention: every attack module reads its
// numbers from here (never hardcodes a speed/interval/duration inline), so
// you can retune by editing this file only. Each attack will likely extend
// its own entry with extra fields once implemented in Stage 6 — the shared
// fields below (duration, battle box size) are the ones every attack needs
// regardless of pattern.
import type { AttackId } from '../attacks/types';

export interface AttackConfigBase {
  durationSeconds: number;
  boxWidth: number;
  boxHeight: number;
}

// All placeholders — [ПРОВЕРИТЬ] against the real fight when each attack
// is implemented (Stage 6). Values here only need to exist so the stub
// EnemyAttack state in Stage 2 has something to read.
export const ATTACK_CONFIG: Record<AttackId, AttackConfigBase> = {
  PhoneHead: { durationSeconds: 8, boxWidth: 300, boxHeight: 160 },
  LaneDodge: { durationSeconds: 6, boxWidth: 420, boxHeight: 120 },
  MailTrucks: { durationSeconds: 7, boxWidth: 420, boxHeight: 120 },
  PipisSwarm: { durationSeconds: 7, boxWidth: 300, boxHeight: 180 },
  HeadRush: { durationSeconds: 8, boxWidth: 360, boxHeight: 160 },
  FreeTurnCall: { durationSeconds: 3, boxWidth: 300, boxHeight: 160 },
  PowerOfNeo: { durationSeconds: 10, boxWidth: 560, boxHeight: 300 }
};

export const ATTACK_BOX_TOP_Y = 260;

/** Shared box-rect formula so StubAttack's drawing and EnemyAttackState's
 * soul-movement bounds never drift apart. Real attacks (Stage 6) can use
 * the same helper or read boxWidth/boxHeight directly for a custom shape. */
export function computeAttackBoxRect(id: AttackId): { x: number; y: number; w: number; h: number } {
  const cfg = ATTACK_CONFIG[id];
  return { x: (640 - cfg.boxWidth) / 2, y: ATTACK_BOX_TOP_Y, w: cfg.boxWidth, h: cfg.boxHeight };
}

export type AttackSequenceLoopMode = 'loopAll' | 'repeatLast';

/** [РЕШЕНО, настраиваемо] What happens once turnNumber exceeds
 * ATTACK_SEQUENCE's length — see SPEC.md §5 and src/attacks/sequence.ts. */
export const ATTACK_SEQUENCE_CONFIG = {
  loopMode: 'loopAll' as AttackSequenceLoopMode
};
