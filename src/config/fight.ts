// FIGHT weapon numbers per character — SPEC.md §3 revision: Ralsei DOES
// have FIGHT (his scarf), just weak. `damageMultiplier` is relative to
// Kris's baseline (1.0); the actual timing-bar damage formula is Stage 4.
import type { PartyMemberId } from './party';

export interface FightWeaponConfig {
  weaponName: string;
  damageMultiplier: number;
}

// [ПРОВЕРИТЬ] весов: множители на глаз (Susie сильнее топором, Ralsei
// слабее шарфом), точные числа — при плейтесте.
export const FIGHT_CONFIG: Record<PartyMemberId, FightWeaponConfig> = {
  kris: { weaponName: 'Wushuang Blade', damageMultiplier: 1.0 },
  susie: { weaponName: 'Axe', damageMultiplier: 1.3 },
  ralsei: { weaponName: 'Scarf', damageMultiplier: 0.6 }
};
