import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import { drawStubScreen } from '../debugUi';
import { ResolveFightState } from './ResolveFight';

/** Stub — resolves ITEM/ACT/MAGIC/DEFEND/SPARE for whoever picked them,
 * in Kris -> Susie -> Ralsei order (SPEC.md §1, resolved BEFORE fight). */
export class ResolveNonFightState implements GameState<GameContext> {
  readonly name = 'ResolveNonFight';

  update(ctx: GameContext): void {
    if (ctx.input.justPressed('confirm')) {
      ctx.goto(new ResolveFightState());
    }
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    drawStubScreen(g, ctx, 'RESOLVE NON-FIGHT (stub — Stage 4)', [
      'ITEM / ACT (Check, Snap, SnapAll) / MAGIC (TP spells) / DEFEND /',
      'SPARE (always fails on NEO) resolve here, in Kris -> Susie -> Ralsei order.',
      '',
      'Z/Enter: continue -> ResolveFight'
    ]);
  }
}
