import type { BattleData } from './context';
import { SNAP_ALL_CONFIG } from '../config/party';

export function isSnapAllUnlocked(battle: BattleData): boolean {
  switch (SNAP_ALL_CONFIG.unlockMode) {
    case 'always':
      return true;
    case 'afterManualSnaps':
      return battle.manualSnapCount >= SNAP_ALL_CONFIG.unlockValue;
    case 'mercyThreshold':
      return battle.mercyPercent >= SNAP_ALL_CONFIG.unlockValue;
  }
}
