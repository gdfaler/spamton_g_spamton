import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import { createInitialBattleData } from '../context';
import { IntroState } from './Intro';
import { PartyMenuState } from './PartyMenu';

const OPTIONS = ['Начать игру', 'Начать сразу с боя'] as const;

/** The one "real" (non-stub) menu built in Stage 2 — simple enough to
 * double as an input-manager smoke test (up/down navigation + confirm). */
export class StartMenuState implements GameState<GameContext> {
  readonly name = 'StartMenu';
  private selected = 0;

  update(ctx: GameContext): void {
    if (ctx.input.justPressed('up') || ctx.input.justPressed('down')) {
      this.selected = (this.selected + 1) % OPTIONS.length;
    }
    if (ctx.input.justPressed('confirm')) {
      ctx.battle = createInitialBattleData();
      if (this.selected === 0) {
        ctx.goto(new IntroState());
      } else {
        ctx.goto(new PartyMenuState());
      }
    }
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    g.fillStyle = '#0a0a12';
    g.fillRect(0, 0, 640, 480);

    g.fillStyle = '#ffe14d';
    g.font = 'bold 28px monospace';
    g.textAlign = 'center';
    g.fillText('★ SPAMTON NEO ★', 320, 160);

    g.font = '16px monospace';
    OPTIONS.forEach((label, i) => {
      const y = 260 + i * 40;
      g.fillStyle = i === this.selected ? '#ffe14d' : '#ffffff';
      g.fillText(i === this.selected ? `> ${label} <` : label, 320, y);
    });

    g.fillStyle = '#5bffb0';
    g.font = '12px monospace';
    g.fillText(`FPS: ${ctx.fps.toFixed(0)}  |  state: ${ctx.currentStateName()}`, 320, 460);
    g.textAlign = 'left';
  }
}
