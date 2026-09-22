import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import { drawStubScreen } from '../debugUi';
import { EnemyAttackState } from './EnemyAttack';

/** Stub — real version shows every FIGHT-bar chosen this round moving
 * SIMULTANEOUSLY (SPEC.md §3), confirmed one at a time. That UI is Stage 4. */
export class ResolveFightState implements GameState<GameContext> {
  readonly name = 'ResolveFight';

  update(ctx: GameContext): void {
    if (ctx.input.justPressed('confirm')) {
      ctx.goto(new EnemyAttackState());
    }
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    drawStubScreen(g, ctx, 'RESOLVE FIGHT (stub — Stage 4)', [
      'All FIGHT timing bars chosen this round move at once here,',
      'confirmed one-by-one (SPEC.md §3).',
      '',
      'Z/Enter: continue -> EnemyAttack'
    ]);
  }
}
