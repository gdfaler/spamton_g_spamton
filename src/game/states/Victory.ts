import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import { drawStubScreen } from '../debugUi';
import { StartMenuState } from './StartMenu';

export type VictoryKind = 'fight' | 'wires';

/** Stub — two distinct endings per SPEC.md §6 (VictoryFight vs
 * VictoryWires). Real epilogue text/scene is a later stage. */
export class VictoryState implements GameState<GameContext> {
  readonly name = 'Victory';

  constructor(private readonly kind: VictoryKind) {}

  update(ctx: GameContext): void {
    if (ctx.input.justPressed('confirm')) {
      ctx.goto(new StartMenuState());
    }
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    const label = this.kind === 'fight' ? 'VICTORY — FIGHT (HP -> 0)' : 'VICTORY — WIRES (Mercy% = 100)';
    drawStubScreen(g, ctx, label, [
      'Real epilogue scene: later stage.',
      '',
      'Z/Enter: back to StartMenu'
    ]);
  }
}
