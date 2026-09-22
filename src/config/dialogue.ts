// Dialogue box tuning — SPEC.md §7.
export const DIALOGUE_CONFIG = {
  charsPerSecond: 42,
  blipEveryNChars: 2,
  /** How long C must be held to skip the intro outright (with a visible
   * fill indicator), independent of the "Начать сразу с боя" start-menu
   * option which bypasses Intro entirely. */
  skipHoldSeconds: 1.0
};
