// Generic state machine driving the top-level flow from SPEC.md §1.
// Each game state (Boot, StartMenu, Intro, PartyMenu, ...) implements this
// interface; the machine only knows how to enter/exit/update/render
// whichever one is current, plus request transitions by name.

export interface GameState<Ctx> {
  readonly name: string;
  enter?(ctx: Ctx): void;
  exit?(ctx: Ctx): void;
  update(ctx: Ctx, dt: number): void;
  render(ctx: Ctx, g: CanvasRenderingContext2D): void;
}

export class StateMachine<Ctx> {
  private current: GameState<Ctx> | null = null;
  private ctx: Ctx;

  constructor(ctx: Ctx) {
    this.ctx = ctx;
  }

  transition(next: GameState<Ctx>): void {
    this.current?.exit?.(this.ctx);
    this.current = next;
    this.current.enter?.(this.ctx);
  }

  get currentName(): string {
    return this.current?.name ?? '(none)';
  }

  update(dt: number): void {
    this.current?.update(this.ctx, dt);
  }

  render(g: CanvasRenderingContext2D): void {
    this.current?.render(this.ctx, g);
  }
}
