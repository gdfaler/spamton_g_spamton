// Simultaneous FIGHT-bar minigame numbers (Stage 4 requirement: every
// attacker's bar moves at once, each with its own speed/delay; Z resolves
// whichever unresolved bar is currently nearest its target line).
export const FIGHT_TIMING_CONFIG = {
  barWidth: 480,
  barHeight: 28,
  /** Target-zone half-width tiers, in px from the zone's center. */
  perfectWindowPx: 8,
  greatWindowPx: 24,
  okWindowPx: 44,
  /** Base damage before FIGHT_CONFIG's per-character weapon multiplier
   * and the tier multiplier below are applied. */
  baseDamageMin: 90,
  baseDamageMax: 130,
  tierMultiplier: {
    perfect: 2.2, // crit
    great: 1.4,
    ok: 1.0,
    miss: 0.35
  },
  /** Each bar gets its own randomized speed/start-delay within these
   * ranges, so simultaneous bars don't move identically. */
  speedPxPerSecMin: 420,
  speedPxPerSecMax: 620,
  startDelaySecMin: 0,
  startDelaySecMax: 0.35,
  targetZoneWidthPx: 70
};
