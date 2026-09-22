// Graze -> TP tuning (SPEC.md Stage 4 requirements). One bullet can only
// feed the graze zone a capped number of ticks, so a slow/lingering bullet
// can't be farmed for unlimited TP.
export const GRAZE_CONFIG = {
  tpPerGrazeTick: 1,
  maxGrazeTicksPerBullet: 12
};
