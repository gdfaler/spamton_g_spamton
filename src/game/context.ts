import type { InputManager } from '../core/input';
import type { AssetManager, AudioHandle } from '../core/assets';
import type { GameState } from '../core/stateMachine';
import type { Attack, SimpleBullet } from '../attacks/types';
import type { DialogueData } from '../core/dialogueData';
import type { Soul } from './soul';
import { PARTY_CONFIG, PARTY_ORDER, type PartyMemberId, SPAMTON_NEO_CONFIG, TP_CONFIG } from '../config/party';
import type { EnemyId } from '../config/enemies';

export interface PartyMemberBattleState {
  hp: number; // can go negative while DOWN
  isDown: boolean;
}

export type ActionChoice =
  | { type: 'fight'; targetId: EnemyId }
  | { type: 'act'; option: 'check' | 'snap' | 'snapAll'; targetId: EnemyId }
  | { type: 'magic'; spellId: string }
  | { type: 'item' }
  | { type: 'defend' }
  | { type: 'spare' }
  | { type: 'skippedDown' }
  | { type: 'skippedBySnapAll' };

export interface BattleData {
  turnNumber: number;
  spamtonHp: number;
  mercyPercent: number;
  manualSnapCount: number;
  /** Shared party-wide TP, 0..TP_CONFIG.max (SPEC.md §2). */
  tp: number;
  party: Record<PartyMemberId, PartyMemberBattleState>;
  /** This round's committed choices, written by PartyMenu, consumed by
   * ResolveNonFight/ResolveFight, cleared at the start of each round. */
  actions: Record<PartyMemberId, ActionChoice | null>;
  /** Reset each round; DEFEND/Pacify reduce damage only for the round
   * they were used in. */
  defendedThisRound: Partial<Record<PartyMemberId, boolean>>;
  pacifyDamageReductionPercent: number;
  currentAttack: Attack | null;
}

export function createInitialBattleData(): BattleData {
  const party = {} as Record<PartyMemberId, PartyMemberBattleState>;
  const actions = {} as Record<PartyMemberId, ActionChoice | null>;
  for (const id of PARTY_ORDER) {
    party[id] = { hp: PARTY_CONFIG[id].maxHp, isDown: false };
    actions[id] = null;
  }
  return {
    turnNumber: 1,
    spamtonHp: SPAMTON_NEO_CONFIG.maxHp,
    mercyPercent: 0,
    manualSnapCount: 0,
    tp: 0,
    party,
    actions,
    defendedThisRound: {},
    pacifyDamageReductionPercent: 0,
    currentAttack: null
  };
}

export function isPartyMemberAlive(battle: BattleData, id: PartyMemberId): boolean {
  return !battle.party[id].isDown;
}

export function allPartyDown(battle: BattleData): boolean {
  return PARTY_ORDER.every((id) => battle.party[id].isDown);
}

export function clampTp(value: number): number {
  return Math.min(TP_CONFIG.max, Math.max(0, value));
}

export function clampMercy(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export interface GameContext {
  readonly input: InputManager;
  readonly assets: AssetManager;
  battle: BattleData;
  fps: number;
  /** Requests a state transition. Set by Game.ts at startup. */
  goto: (state: GameState<GameContext>) => void;
  currentStateName: () => string;
  /** Loaded once in BootState; null only for the brief instant before it
   * resolves (Boot doesn't advance until it's set). */
  dialogueData: DialogueData | null;
  sfxBlip: AudioHandle | null;
  /** Owned by EnemyAttackState for the duration of the enemy's turn; null
   * otherwise. Exposed on the context so UI helpers (party panel, etc.)
   * that render across many states don't need per-state plumbing. */
  soul: Soul | null;
  bullets: SimpleBullet[];
}
