// Yellow soul movement + hitbox/graze sizing. Full shooting/Big Shot is
// Stage 5 — Stage 4 only needs movement + collision geometry so TP/graze
// can be proven against StubAttack's test bullets ahead of real attacks.
export const SOUL_CONFIG = {
  moveSpeed: 180, // px/sec
  hitboxRadius: 6,
  /** Graze zone = hitboxRadius + this. A bullet inside this ring but NOT
   * inside hitboxRadius counts as a graze, not a hit. */
  grazeExtraRadius: 10,
  invincibleSecondsAfterHit: 1.1,
  grazeFlashSeconds: 0.15
};
