// Attack module contract (per the technical requirements): every attack in
// src/attacks/ implements this same shape so new attacks can be dropped in
// without touching the battle state machine. Real attacks land in Stage 6;
// Stage 2 only needs the contract + a stub to prove it end-to-end.

export type AttackId =
  | 'PhoneHead'
  | 'LaneDodge'
  | 'MailTrucks'
  | 'PipisSwarm'
  | 'HeadRush'
  | 'FreeTurnCall' // [ПРОВЕРИТЬ] — lowest priority, implemented last
  | 'PowerOfNeo';

export interface AttackContext {
  readonly turnNumber: number;
}

export interface Attack {
  readonly id: AttackId;
  init(ctx: AttackContext): void;
  update(dt: number): void;
  draw(g: CanvasRenderingContext2D): void;
  isFinished(): boolean;
}
