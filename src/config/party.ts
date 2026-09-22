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

export type SnapAllUnlockMode = 'always' | 'afterManualSnaps' | 'mercyThreshold';

/**
 * [РЕШЕНО, настраиваемо] SnapAll unlock condition + cost — see SPEC.md §3.
 * Default: always available, but costs the WHOLE party's turn (Susie and
 * Ralsei do not act that round when Kris picks SnapAll). Flip
 * `unlockMode`/`unlockValue` to gate it behind manual snaps or a Mercy%
 * threshold instead, without touching any battle logic.
 */
export const SNAP_ALL_CONFIG = {
  unlockMode: 'always' as SnapAllUnlockMode,
  /** Meaning depends on unlockMode: manual-Snap count for
   * 'afterManualSnaps', Mercy% for 'mercyThreshold'. Unused for 'always'. */
  unlockValue: 0,
  /** Susie/Ralsei skip their action this round when SnapAll is used. */
  consumesWholePartyTurn: true
};

/** DEFEND — Stage 4 requirement: reduces incoming damage this round and
 * grants TP immediately. */
export const DEFEND_CONFIG = {
  tpGain: 16,
  /** 0..100, percent damage reduction applied if this character is the
   * random target of an enemy hit during the same round they defended. */
  damageReductionPercent: 50
};

/** Pacify (Ralsei MAGIC) — [ПРОВЕРИТЬ] exact effect; implemented as a
 * party-wide damage reduction for the current round, similar to DEFEND
 * but from a spell instead of a per-character action. */
export const PACIFY_CONFIG = {
  damageReductionPercent: 30
};

/**
 * DOWN state — SPEC.md Stage 4: HP can go negative; a downed character
 * skips their turns and regains HP at the start of each round, standing
 * back up once HP > 0. GameOver only when all three are DOWN at once.
 */
export const DOWN_CONFIG = {
  hpRegenPerRound: 20
};
