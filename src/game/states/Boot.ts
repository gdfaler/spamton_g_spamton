import type { GameState } from '../../core/stateMachine';
import type { GameContext } from '../context';
import type { SpriteHandle } from '../../core/assets';
import { loadDialogueData } from '../../core/dialogueData';
import { drawStubScreen } from '../debugUi';
import { StartMenuState } from './StartMenu';

/**
 * Preloads dialogue.json + the text-blip sound, and (as an asset-loader
 * smoke test) requests a sprite that does NOT exist on disk yet — proving
 * the loader resolves with a labeled placeholder instead of throwing or
 * hanging (per ASSETS.md's "must never crash" requirement).
 */
export class BootState implements GameState<GameContext> {
  readonly name = 'Boot';
  private timer = 0;
  private demoSprite: SpriteHandle | null = null;
  private ready = false;

  enter(ctx: GameContext): void {
    this.timer = 0;
    ctx.assets.loadSprite('assets/sprites/neo_idle.png', 96, 96).then((handle) => {
      this.demoSprite = handle;
    });
    Promise.all([
      loadDialogueData(),
      ctx.assets.loadAudio('assets/audio/sfx_text_blip.wav')
    ]).then(([dialogueData, blip]) => {
      ctx.dialogueData = dialogueData;
      ctx.sfxBlip = blip;
      this.ready = true;
    });
  }

  update(ctx: GameContext, dt: number): void {
    this.timer += dt;
    if (this.timer >= 0.6 && this.demoSprite && this.ready) {
      ctx.goto(new StartMenuState());
    }
  }

  render(ctx: GameContext, g: CanvasRenderingContext2D): void {
    drawStubScreen(g, ctx, 'SPAMTON NEO — BATTLE CLONE', [
      'Loading...',
      this.demoSprite
        ? `sprite loader OK -> ${this.demoSprite.isPlaceholder ? 'placeholder (file missing, as expected)' : 'real sprite'}`
        : 'requesting assets/sprites/neo_idle.png ...',
      this.ready ? 'dialogue.json + blip sfx OK' : 'loading dialogue.json + sfx...'
    ]);
    if (this.demoSprite) {
      g.drawImage(this.demoSprite.source, 320 - 48, 190, 96, 96);
    }
  }
}
