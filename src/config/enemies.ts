// Enemy roster. Only one enemy exists in this fight, but the target-select
// screen (SPEC.md Stage 4: "список врагов с HP% и MERCY%, как в Deltarune
// Chapter 2") is built as a real list so a second enemy would just be
// another entry here — nothing else would need to change.
export type EnemyId = 'spamton_neo';

export interface EnemyConfig {
  id: EnemyId;
  displayName: string;
}

export const ENEMIES: EnemyConfig[] = [{ id: 'spamton_neo', displayName: 'SPAMTON NEO' }];
