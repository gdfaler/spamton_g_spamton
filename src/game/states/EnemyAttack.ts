import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import type { Attack } from '../../attacks/types';
import { attackForTurn } from '../../attacks/sequence';
import { StubAttack } from '../../attacks/StubAttack';
import { PartyMenuState } from './PartyMenu';

/** Wires the real Attack contract (init/update/draw/isFinished) end-to-end
 * using StubAttack, picking which attack by turn number via
 * attackForTurn() (SPEC.md §5). The yellow soul itself is Stage 5 — this
 * only proves an attack module can run for its full duration and hand
 * control back. */
export class EnemyAttackState implements GameState<GameContext> {
  readonly name = 'EnemyAttack';
  private attack: Attack | null = null;

  enter(ctx: GameContext): void {
    const id = attackForTurn(ctx.battle.turnNumber);
    this.attack = new StubAttack(id);
    this.attack.init({ turnNumber: ctx.battle.turnNumber });
    ctx.battle.currentAttack = this.attack;
  }

  exit(ctx: GameContext): void {
    ctx.battle.currentAttack = null;
  }

  update(ctx: GameContext, dt: number): void {
    this.attack?.update(dt);
    if (this.attack?.isFinished()) {
      ctx.battle.turnNumber += 1;
      ctx.goto(new PartyMenuState());
    }
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    g.fillStyle = '#0a0a12';
    g.fillRect(0, 0, 640, 480);
    this.attack?.draw(g);

    g.fillStyle = '#5bffb0';
    g.font = '12px monospace';
    g.textAlign = 'center';
    g.fillText(`FPS: ${ctx.fps.toFixed(0)}  |  state: ${ctx.currentStateName()}`, 320, 460);
    g.textAlign = 'left';
  }
}
