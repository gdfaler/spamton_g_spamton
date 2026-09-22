// MAGIC menu numbers (Susie/Ralsei) — SPEC.md §3. All placeholders,
// [ПРОВЕРИТЬ] against real playtest values.

export interface MagicSpellConfig {
  id: string;
  displayName: string;
  tpCost: number;
  /** Rough effect description for the stub UI in Stage 4; real effect
   * implementation happens when the battle menu is built. */
  kind: 'damage' | 'heal' | 'support' | 'mercy';
  power: number;
}

export const SUSIE_MAGIC: MagicSpellConfig[] = [
  { id: 'rude_buster', displayName: 'Rude Buster', tpCost: 32, kind: 'damage', power: 60 },
  { id: 'ultimate_heal', displayName: 'UltimateHeal', tpCost: 48, kind: 'heal', power: 40 },
  { id: 's_action', displayName: 'S-Action', tpCost: 16, kind: 'mercy', power: 1 }
];

export const RALSEI_MAGIC: MagicSpellConfig[] = [
  { id: 'heal_prayer', displayName: 'Heal Prayer', tpCost: 28, kind: 'heal', power: 30 },
  { id: 'pacify', displayName: 'Pacify', tpCost: 24, kind: 'support', power: 0 },
  { id: 'r_action', displayName: 'R-Action', tpCost: 16, kind: 'mercy', power: 1 }
];
