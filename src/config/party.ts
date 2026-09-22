// Party balance numbers — SPEC.md §2. All placeholders until confirmed;
// nothing in game logic should hardcode these values directly, only read
// from here, so tuning is a one-line edit.

export type PartyMemberId = 'kris' | 'susie' | 'ralsei';

export interface PartyMemberConfig {
  id: PartyMemberId;
  displayName: string;
  maxHp: number;
}

// [ПРОВЕРИТЬ] — округлённые дефолты, см. SPEC.md §2.
export const PARTY_CONFIG: Record<PartyMemberId, PartyMemberConfig> = {
  kris: { id: 'kris', displayName: 'KRIS', maxHp: 90 },
  susie: { id: 'susie', displayName: 'SUSIE', maxHp: 112 },
  ralsei: { id: 'ralsei', displayName: 'RALSEI', maxHp: 80 }
};

export const PARTY_ORDER: PartyMemberId[] = ['kris', 'susie', 'ralsei'];

export const TP_CONFIG = {
  max: 100,
  // [ПРОВЕРИТЬ] точный прирост TP за DEFEND / за получение урона.
  gainPerDefend: 16,
  gainPerHitTaken: 8
};

export const SPAMTON_NEO_CONFIG = {
  maxHp: 4809,
  atk: 13,
  defBase: 0,
  // DEF -3 every turn after turn 16, floor at -12 (SPEC.md §2, sourced).
  defDecayStartTurn: 16,
  defDecayPerTurn: 3,
  defFloor: -12
};

export const MERCY_CONFIG = {
  max: 100,
  // [ПРОВЕРИТЬ] точные проценты — см. SPEC.md §3 (источники называли ~2%
  // за обычное действие, ~7% за Snap All).
  gainPerSnap: 2,
  gainPerXAction: 2,
  gainPerSnapAll: 7
};
