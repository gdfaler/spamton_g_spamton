import type { InputManager } from '../core/input';
import type { AssetManager } from '../core/assets';
import type { GameState } from '../core/stateMachine';
import type { Attack } from '../attacks/types';
import { PARTY_CONFIG, type PartyMemberId, SPAMTON_NEO_CONFIG } from '../config/party';

export interface BattleData {
  turnNumber: number;
  spamtonHp: number;
  mercyPercent: number;
  partyHp: Record<PartyMemberId, number>;
  currentAttack: Attack | null;
}

export function createInitialBattleData(): BattleData {
  return {
    turnNumber: 1,
    spamtonHp: SPAMTON_NEO_CONFIG.maxHp,
    mercyPercent: 0,
    partyHp: {
      kris: PARTY_CONFIG.kris.maxHp,
      susie: PARTY_CONFIG.susie.maxHp,
      ralsei: PARTY_CONFIG.ralsei.maxHp
    },
    currentAttack: null
  };
}

export interface GameContext {
  readonly input: InputManager;
  readonly assets: AssetManager;
  battle: BattleData;
  fps: number;
  /** Requests a state transition. Set by Game.ts at startup. */
  goto: (state: GameState<GameContext>) => void;
  currentStateName: () => string;
}
