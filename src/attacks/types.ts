// Attack module contract (per the technical requirements): every attack in
// src/attacks/ implements this same shape so new attacks can be dropped in
// without touching the battle state machine. Real attacks land in Stage 6;
// Stage 2 introduced a stub to prove the contract, Stage 4 adds the
// bullet/soul collision plumbing (spawnBullet) so TP/graze can be proven
// too, ahead of real bullet-hell patterns.

export type AttackId =
  | 'PhoneHead'
  | 'LaneDodge'
  | 'MailTrucks'
  | 'PipisSwarm'
  | 'HeadRush'
  | 'FreeTurnCall' // [ПРОВЕРИТЬ] — lowest priority, implemented last
  | 'PowerOfNeo';

/** A bullet as tracked by EnemyAttackState's shared collision loop — see
 * src/game/collision.ts. Attack modules only set the physics fields via
 * spawnBullet(); `grazeTicksUsed`/`dead` are engine-owned bookkeeping. */
export interface SimpleBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  grazeTicksUsed: number;
  dead: boolean;
}

export type SpawnBulletInput = Omit<SimpleBullet, 'grazeTicksUsed' | 'dead'>;

export interface AttackContext {
  readonly turnNumber: number;
  /** Adds a bullet to the shared collision loop (hit -> damages a random
   * living party member; near-miss -> grazes the soul for TP). */
  spawnBullet(bullet: SpawnBulletInput): void;
}

export interface Attack {
  readonly id: AttackId;
  init(ctx: AttackContext): void;
  update(dt: number): void;
  draw(g: CanvasRenderingContext2D): void;
  isFinished(): boolean;
}
