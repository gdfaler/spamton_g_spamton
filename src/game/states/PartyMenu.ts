import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import { drawStubScreen } from '../debugUi';
import { ResolveNonFightState } from './ResolveNonFight';

/** Stub — real per-character FIGHT/ACT/MAGIC/ITEM/DEFEND/SPARE menu is
 * Stage 4. This proves PartyMenu -> ResolveNonFight -> ResolveFight ->
 * EnemyAttack -> back to PartyMenu (SPEC.md §1) all wire up correctly. */
export class PartyMenuState implements GameState<GameContext> {
  readonly name = 'PartyMenu';

  update(ctx: GameContext): void {
    if (ctx.input.justPressed('confirm')) {
      ctx.goto(new ResolveNonFightState());
    }
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    const b = ctx.battle;
    drawStubScreen(g, ctx, 'PARTY MENU (stub — Stage 4)', [
      `Turn ${b.turnNumber}`,
      `Spamton NEO HP: ${b.spamtonHp} / 4809     Mercy: ${b.mercyPercent}%`,
      `Kris ${b.partyHp.kris}   Susie ${b.partyHp.susie}   Ralsei ${b.partyHp.ralsei}`,
      '',
      'Real menu (FIGHT/ACT/MAGIC/ITEM/DEFEND/SPARE): Stage 4.',
      '',
      'Z/Enter: continue -> ResolveNonFight -> ResolveFight -> EnemyAttack'
    ]);
  }
}
