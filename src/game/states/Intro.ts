import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import { drawStubScreen } from '../debugUi';
import { PartyMenuState } from './PartyMenu';

/** Stub — real dialogue system (typewriter text, skip-hold on C, portraits)
 * is Stage 3. This only proves the transition Intro → PartyMenu exists. */
export class IntroState implements GameState<GameContext> {
  readonly name = 'Intro';

  update(ctx: GameContext): void {
    if (ctx.input.justPressed('confirm')) {
      ctx.goto(new PartyMenuState());
    }
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    drawStubScreen(g, ctx, 'INTRO (stub — Stage 3)', [
      'PhoneCallGag + NeoDeclaration will render here.',
      'Skip-hold on C and typewriter text: Stage 3.',
      '',
      'Z/Enter: continue -> PartyMenu'
    ]);
  }
}
