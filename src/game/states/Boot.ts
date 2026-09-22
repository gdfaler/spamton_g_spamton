import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import type { SpriteHandle } from '../../core/assets';
import { drawStubScreen } from '../debugUi';
import { StartMenuState } from './StartMenu';

/**
 * Nothing real to preload yet (Stage 2 has no actual sprite files — only
 * .gitkeep in public/assets/sprites/), so this doubles as the asset-loader
 * smoke test: it requests a sprite that does NOT exist on disk and proves
 * the loader resolves with a labeled placeholder instead of throwing or
 * hanging (per ASSETS.md's "must never crash" requirement).
 */
export class BootState implements GameState<GameContext> {
  readonly name = 'Boot';
  private timer = 0;
  private demoSprite: SpriteHandle | null = null;

  enter(ctx: GameContext): void {
    this.timer = 0;
    ctx.assets.loadSprite('assets/sprites/neo_idle.png', 96, 96).then((handle) => {
      this.demoSprite = handle;
    });
  }

  update(ctx: GameContext, dt: number): void {
    this.timer += dt;
    if (this.timer >= 0.6 && this.demoSprite) {
      ctx.goto(new StartMenuState());
    }
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    drawStubScreen(g, ctx, 'SPAMTON NEO — BATTLE CLONE', [
      'Loading...',
      this.demoSprite
        ? `asset loader OK -> ${this.demoSprite.isPlaceholder ? 'placeholder (file missing, as expected)' : 'real sprite'}`
        : 'requesting assets/sprites/neo_idle.png ...'
    ]);
    if (this.demoSprite) {
      g.drawImage(this.demoSprite.source, 320 - 48, 160, 96, 96);
    }
  }
}
