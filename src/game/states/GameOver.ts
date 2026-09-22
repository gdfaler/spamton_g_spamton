import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import { createInitialBattleData } from '../context';
import { drawStubScreen } from '../debugUi';
import { PartyMenuState } from './PartyMenu';

/** Stub — restarts the BATTLE (not the whole app), per SPEC.md §6. */
export class GameOverState implements GameState<GameContext> {
  readonly name = 'GameOver';

  update(ctx: GameContext): void {
    if (ctx.input.justPressed('confirm')) {
      ctx.battle = createInitialBattleData();
      ctx.goto(new PartyMenuState());
    }
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    drawStubScreen(g, ctx, 'GAME OVER', [
      'Real epilogue scene: later stage.',
      '',
      'Z/Enter: retry battle'
    ]);
  }
}
